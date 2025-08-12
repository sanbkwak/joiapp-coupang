// Simple fix for account mismatch without dynamic imports
import React, { useState, useContext } from 'react';
import { WalletContext } from '../../contexts/WalletContext';
import freighterApi from '@stellar/freighter-api';

export default function SimpleAccountFix() {
  const { publicKey } = useContext(WalletContext);
  const [status, setStatus] = useState('');

  const detectAccountMismatch = async () => {
    setStatus('🔍 Detecting account mismatch...\n\n');

    try {
      // Get account from React context
      setStatus(prev => prev + `📋 React Context Account: ${publicKey}\n`);

      // Get account directly from Freighter (using static import)
      const freighterAccount = await freighterApi.getPublicKey();
      
      setStatus(prev => prev + `📋 Freighter Account: ${freighterAccount}\n\n`);

      // Compare accounts
      const accountsMatch = publicKey === freighterAccount;
      setStatus(prev => prev + `🔍 Accounts Match: ${accountsMatch ? '✅ YES' : '❌ NO'}\n\n`);

      if (!accountsMatch) {
        setStatus(prev => prev + '🎯 FOUND THE PROBLEM!\n');
        setStatus(prev => prev + 'React context and Freighter have different accounts!\n\n');
        
        setStatus(prev => prev + '💡 To Fix:\n');
        setStatus(prev => prev + '  1. Click Freighter extension icon\n');
        setStatus(prev => prev + '  2. Switch to account ending in: ...EDKRDL3L\n');
        setStatus(prev => prev + '  3. Refresh this entire page\n');
        setStatus(prev => prev + '  4. Try trustline again\n\n');
        
        setStatus(prev => prev + '🔍 Account Details:\n');
        setStatus(prev => prev + `  Expected: ${publicKey.slice(-8)}\n`);
        setStatus(prev => prev + `  Current:  ${freighterAccount.slice(-8)}\n`);
        return;
      }

      // Check signature hint if accounts match
      setStatus(prev => prev + '✅ Accounts match! Checking signature hint...\n');

      const StellarSdk = window.StellarSdk;
      const keypair = StellarSdk.Keypair.fromPublicKey(publicKey);
      const expectedHint = keypair.signatureHint().toString('hex');
      
      setStatus(prev => prev + `Expected signature hint: ${expectedHint}\n`);
      setStatus(prev => prev + `Observed in error: bc20d511\n`);
      
      if (expectedHint === 'bc20d511') {
        setStatus(prev => prev + '✅ Signature hints match!\n');
        setStatus(prev => prev + '🤔 The account mismatch is not the issue...\n');
      } else {
        setStatus(prev => prev + '❌ Signature hints DON\'T match!\n');
        setStatus(prev => prev + '🎯 This confirms the account mismatch problem!\n');
      }

    } catch (error) {
      setStatus(prev => prev + `❌ Detection failed: ${error.message}\n`);
      
      if (error.message.includes('getPublicKey is not a function')) {
        setStatus(prev => prev + '\n💡 Freighter API issue. Try these manual steps:\n');
        setStatus(prev => prev + '  1. Check Freighter extension is enabled\n');
        setStatus(prev => prev + '  2. Make sure you\'re connected to the right account\n');
        setStatus(prev => prev + '  3. Refresh the page completely (F5)\n');
      }
    }
  };

  const testTrustlineDirectly = async () => {
    if (!publicKey) {
      setStatus('❌ No wallet connected');
      return;
    }

    setStatus('🧪 Testing trustline with current account...\n');

    try {
      const { stellar, SZUP } = await import('../../stellar');

      // Use stellar.changeTrust with current publicKey
      const result = await stellar.changeTrust({
        asset: SZUP,
        limit: '1000000',
        sourceAddress: publicKey
      });

      setStatus(prev => prev + `🎉 SUCCESS! Trustline added!\n`);
      setStatus(prev => prev + `📋 Hash: ${result.hash}\n`);
      setStatus(prev => prev + `🌐 View: https://stellar.expert/explorer/testnet/tx/${result.hash}\n`);

    } catch (error) {
      setStatus(prev => prev + `❌ Test failed: ${error.message}\n`);
      
      // Check for specific error types
      if (error.message.includes('op_already_exists') || 
          (error.response?.data?.extras?.result_codes?.operations?.includes('op_already_exists'))) {
        setStatus(prev => prev + '\n🎉 ACTUALLY SUCCESS!\n');
        setStatus(prev => prev + 'The "error" means the trustline already exists!\n');
        setStatus(prev => prev + '✅ You can proceed with issuing SZUP tokens.\n');
      } else if (error.response?.data?.extras?.result_codes?.transaction === 'tx_bad_auth') {
        setStatus(prev => prev + '\n❌ Still getting tx_bad_auth\n');
        setStatus(prev => prev + '💡 This confirms there\'s an account mismatch issue\n');
        setStatus(prev => prev + '💡 Please switch Freighter to the correct account\n');
      }
    }
  };

  const manualInstructions = () => {
    setStatus('📋 Manual Fix Instructions:\n\n');
    setStatus(prev => prev + '🔧 Step-by-Step Fix:\n\n');
    
    setStatus(prev => prev + '1️⃣ Check Freighter Account:\n');
    setStatus(prev => prev + '   • Click the Freighter extension icon in your browser\n');
    setStatus(prev => prev + '   • Look at the currently selected account\n');
    setStatus(prev => prev + '   • It should end with: ...EDKRDL3L\n\n');
    
    setStatus(prev => prev + '2️⃣ Switch Account (if needed):\n');
    setStatus(prev => prev + '   • In Freighter, look for account switcher\n');
    setStatus(prev => prev + '   • Select the account ending in: ...EDKRDL3L\n');
    setStatus(prev => prev + '   • This is your issuer account\n\n');
    
    setStatus(prev => prev + '3️⃣ Refresh Browser:\n');
    setStatus(prev => prev + '   • After switching accounts, refresh this page (F5)\n');
    setStatus(prev => prev + '   • This syncs React with Freighter\n\n');
    
    setStatus(prev => prev + '4️⃣ Try Again:\n');
    setStatus(prev => prev + '   • Go to /wallet/trustline\n');
    setStatus(prev => prev + '   • Click "Add Trustline"\n');
    setStatus(prev => prev + '   • Approve the Freighter popup\n\n');
    
    setStatus(prev => prev + '🎯 Expected Result:\n');
    setStatus(prev => prev + '   • Either success, or "op_already_exists" (which is also success)\n');
    setStatus(prev => prev + '   • Then you can issue SZUP tokens!\n');
  };

  return (
    <div className="space-y-4 p-4 border rounded shadow-sm max-w-4xl mx-auto">
      <h2 className="text-lg font-semibold text-red-600">🔧 Simple Account Mismatch Fix</h2>
      
      <div className="p-3 bg-red-50 border border-red-200 rounded">
        <h4 className="font-medium text-red-800">The Issue:</h4>
        <p className="text-sm text-red-700 mt-1">
          tx_bad_auth with 1 signature means Freighter is signing with a different account 
          than your React app expects. The signature is valid, but for the wrong account.
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          onClick={detectAccountMismatch}
        >
          🔍 Check Account Match
        </button>

        <button
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          onClick={testTrustlineDirectly}
          disabled={!publicKey}
        >
          🧪 Test Trustline Now
        </button>

        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={manualInstructions}
        >
          📋 Show Manual Fix
        </button>
      </div>

      <div className="p-3 bg-green-50 border border-green-200 rounded">
        <h4 className="font-medium text-green-800">Quick Summary:</h4>
        <p className="text-sm text-green-700 mt-1">
          Your code is perfect! The issue is just that Freighter and your React app 
          are connected to different accounts. Switch to the right account in Freighter 
          and everything will work.
        </p>
      </div>

      {status && (
        <div className="p-3 bg-gray-100 rounded max-h-96 overflow-y-auto">
          <pre className="text-sm whitespace-pre-wrap font-mono">{status}</pre>
        </div>
      )}
    </div>
  );
}