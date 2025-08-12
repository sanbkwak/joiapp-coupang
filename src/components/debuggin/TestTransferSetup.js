// Component to set up SZUP for transfer testing
import React, { useState, useContext } from 'react';
import { WalletContext } from '../../contexts/WalletContext';
import { stellar, SZUP } from '../../stellar';

export default function TestTransferSetup() {
  const { publicKey } = useContext(WalletContext);
  const [status, setStatus] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');

  const setupForTransferTesting = async () => {
    if (!publicKey) {
      setStatus('🔒 Please connect your wallet first.');
      return;
    }

    try {
      setStatus('🚀 Setting up SZUP for transfer testing...\n\n');

      // Step 1: Check current setup
      setStatus(prev => prev + '📋 Step 1: Checking current account status...\n');
      
      const issuer = process.env.REACT_APP_ISSUER_PUBLIC_KEY;
      if (!issuer) {
        setStatus(prev => prev + '❌ REACT_APP_ISSUER_PUBLIC_KEY not set!\n');
        return;
      }

      const account = await stellar.loadAccount(publicKey);
      setStatus(prev => prev + `✅ Account loaded: ${account.id}\n`);

      // Step 2: Check if you have SZUP trustline
      const szupTrustline = account.balances.find(b => 
        b.asset_code === 'SZUP' && b.asset_issuer === SZUP.issuer
      );

      if (!szupTrustline) {
        setStatus(prev => prev + '\n📋 Step 2: Adding SZUP trustline...\n');
        
        const trustlineResult = await stellar.changeTrust({
          asset: SZUP,
          limit: '10000000',
          sourceAddress: publicKey
        });

        setStatus(prev => prev + `✅ Trustline added! Hash: ${trustlineResult.hash}\n`);
        setStatus(prev => prev + '⏳ Waiting 5 seconds for confirmation...\n');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Reload account to see trustline
        const updatedAccount = await stellar.loadAccount(publicKey);
        const newTrustline = updatedAccount.balances.find(b => 
          b.asset_code === 'SZUP' && b.asset_issuer === SZUP.issuer
        );
        
        if (newTrustline) {
          setStatus(prev => prev + '✅ Trustline confirmed!\n');
        } else {
          setStatus(prev => prev + '⚠️ Trustline not yet visible, but should work\n');
        }
      } else {
        setStatus(prev => prev + `✅ SZUP trustline already exists: ${szupTrustline.balance} SZUP\n`);
      }

      // Step 3: Check if you're the issuer or need tokens
      if (SZUP.issuer === publicKey) {
        setStatus(prev => prev + '\n🎯 You are the SZUP issuer! You can issue tokens to yourself.\n');
        
        // Self-issue some SZUP
        setStatus(prev => prev + '\n📋 Step 3: Self-issuing 1000 SZUP for testing...\n');
        
        const issueResult = await stellar.payment({
          destination: publicKey,
          asset: SZUP,
          amount: '1000',
          sourceAddress: publicKey
        });

        setStatus(prev => prev + `✅ Issued 1000 SZUP to yourself! Hash: ${issueResult.hash}\n`);
        
      } else {
        setStatus(prev => prev + '\n📋 You are NOT the issuer. Need to get SZUP from issuer...\n');
        setStatus(prev => prev + `   Issuer address: ${SZUP.issuer}\n`);
        setStatus(prev => prev + `   Your address: ${publicKey}\n\n`);
        
        setStatus(prev => prev + '💡 To get SZUP for testing:\n');
        setStatus(prev => prev + '   1. Connect with the issuer account\n');
        setStatus(prev => prev + '   2. Use "Issue SZUP" component to send tokens to your account\n');
        setStatus(prev => prev + '   3. Or ask someone with SZUP to send you some\n');
        return;
      }

      // Step 4: Verify final balance
      setStatus(prev => prev + '\n📋 Step 4: Checking final SZUP balance...\n');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const finalAccount = await stellar.loadAccount(publicKey);
      const finalTrustline = finalAccount.balances.find(b => 
        b.asset_code === 'SZUP' && b.asset_issuer === SZUP.issuer
      );

      if (finalTrustline && parseFloat(finalTrustline.balance) > 0) {
        setStatus(prev => prev + `🎉 SUCCESS! You have ${finalTrustline.balance} SZUP ready for testing!\n\n`);
        setStatus(prev => prev + '✅ You can now test transfers using the TransferSzup component!\n');
      } else {
        setStatus(prev => prev + '⚠️ Balance not yet updated. Wait 30 seconds and check manually.\n');
      }

    } catch (error) {
      setStatus(prev => prev + `\n❌ Error during setup: ${error.message}\n`);
      console.error('Transfer setup error:', error);

      if (error.response?.data?.extras?.result_codes) {
        const codes = error.response.data.extras.result_codes;
        setStatus(prev => prev + `Error codes: ${JSON.stringify(codes)}\n`);
        
        if (codes.operations?.includes('op_no_trust')) {
          setStatus(prev => prev + '💡 Trustline issue. Try adding trustline first.\n');
        }
        if (codes.transaction?.includes('tx_bad_auth')) {
          setStatus(prev => prev + '💡 You might not be the actual issuer. Check your REACT_APP_ISSUER_PUBLIC_KEY.\n');
        }
      }
    }
  };

  const createTestRecipient = async () => {
    if (!publicKey || !recipientAddress) {
      setStatus('❌ Connect wallet and enter recipient address');
      return;
    }

    try {
      setStatus('🎯 Setting up test recipient account...\n');

      // Check if recipient exists
      let recipientExists = true;
      try {
        await stellar.loadAccount(recipientAddress);
        setStatus(prev => prev + '✅ Recipient account exists\n');
      } catch (error) {
        if (error.response?.status === 404) {
          setStatus(prev => prev + '❌ Recipient account does not exist\n');
          setStatus(prev => prev + '💡 Fund the recipient account first using Friendbot\n');
          recipientExists = false;
        }
      }

      if (!recipientExists) return;

      // Check if recipient has SZUP trustline
      const recipientAccount = await stellar.loadAccount(recipientAddress);
      const recipientTrustline = recipientAccount.balances.find(b => 
        b.asset_code === 'SZUP' && b.asset_issuer === SZUP.issuer
      );

      if (!recipientTrustline) {
        setStatus(prev => prev + '❌ Recipient does not have SZUP trustline\n');
        setStatus(prev => prev + '💡 The recipient needs to add a SZUP trustline first\n');
        return;
      }

      setStatus(prev => prev + '✅ Recipient has SZUP trustline\n');
      setStatus(prev => prev + `   Balance: ${recipientTrustline.balance} SZUP\n`);
      setStatus(prev => prev + `   Limit: ${recipientTrustline.limit} SZUP\n`);
      setStatus(prev => prev + '\n🎉 Recipient is ready to receive SZUP!\n');

    } catch (error) {
      setStatus(prev => prev + `❌ Error: ${error.message}\n`);
    }
  };

  const quickTransferTest = async () => {
    if (!publicKey || !recipientAddress) {
      setStatus('❌ Connect wallet and enter recipient address');
      return;
    }

    try {
      setStatus('🧪 Quick transfer test: sending 10 SZUP...\n');

      const result = await stellar.payment({
        destination: recipientAddress,
        asset: SZUP,
        amount: '10',
        sourceAddress: publicKey
      });

      setStatus(prev => prev + `✅ Transfer successful! Hash: ${result.hash}\n`);
      setStatus(prev => prev + '🎉 Your TransferSzup component should work now!\n');

    } catch (error) {
      setStatus(prev => prev + `❌ Transfer failed: ${error.message}\n`);
      
      if (error.response?.data?.extras?.result_codes) {
        const codes = error.response.data.extras.result_codes;
        if (codes.operations?.includes('op_underfunded')) {
          setStatus(prev => prev + '💡 You don\'t have enough SZUP to send\n');
        }
        if (codes.operations?.includes('op_no_trust')) {
          setStatus(prev => prev + '💡 Recipient needs a SZUP trustline\n');
        }
      }
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded shadow-sm max-w-2xl mx-auto">
      <h2 className="text-lg font-semibold">🧪 Setup SZUP for Transfer Testing</h2>
      
      <div className="p-3 bg-blue-50 border border-blue-200 rounded">
        <h4 className="font-medium text-blue-800">What this does:</h4>
        <ul className="text-sm text-blue-700 mt-1 space-y-1">
          <li>• Adds SZUP trustline if needed</li>
          <li>• Issues SZUP to yourself (if you're the issuer)</li>
          <li>• Gives you tokens to test transfers with</li>
          <li>• Verifies recipient accounts are ready</li>
        </ul>
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="font-medium mb-2">Step 1: Get SZUP tokens</h3>
          <button
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            onClick={setupForTransferTesting}
            disabled={!publicKey}
          >
            Setup My Account with SZUP
          </button>
        </div>

        <div>
          <h3 className="font-medium mb-2">Step 2: Test with a recipient</h3>
          <div className="flex gap-2">
            <input
              className="flex-1 px-3 py-2 border rounded"
              placeholder="Test recipient address (G...)"
              value={recipientAddress}
              onChange={e => setRecipientAddress(e.target.value)}
            />
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={createTestRecipient}
              disabled={!publicKey || !recipientAddress}
            >
              Check Recipient
            </button>
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-2">Step 3: Test transfer</h3>
          <button
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            onClick={quickTransferTest}
            disabled={!publicKey || !recipientAddress}
          >
            Send 10 SZUP (Test)
          </button>
        </div>
      </div>

      {status && (
        <div className="p-3 bg-gray-100 rounded max-h-80 overflow-y-auto">
          <pre className="text-sm whitespace-pre-wrap font-mono">{status}</pre>
        </div>
      )}
    </div>
  );
}