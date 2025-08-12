// Detect and fix Freighter account mismatch
import React, { useState, useContext } from 'react';
import { WalletContext } from '../../contexts/WalletContext';

export default function FreighterAccountMismatch() {
  const { publicKey } = useContext(WalletContext);
  const [status, setStatus] = useState('');

  const detectAccountMismatch = async () => {
    setStatus('🔍 Detecting Freighter account mismatch...\n\n');

    try {
      // Get account from React context
      setStatus(prev => prev + `📋 React Context Account: ${publicKey}\n`);

      // Get account directly from Freighter
      const freighterApi = (await import('@stellar/freighter-api')).default;
      const freighterAccount = await freighterApi.getPublicKey();
      
      setStatus(prev => prev + `📋 Freighter Direct Account: ${freighterAccount}\n\n`);

      // Compare accounts
      const accountsMatch = publicKey === freighterAccount;
      setStatus(prev => prev + `🔍 Accounts Match: ${accountsMatch ? '✅ YES' : '❌ NO'}\n\n`);

      if (!accountsMatch) {
        setStatus(prev => prev + '🎯 FOUND THE PROBLEM!\n');
        setStatus(prev => prev + 'Your React context has one account, but Freighter is connected to another!\n\n');
        
        setStatus(prev => prev + '💡 Solutions:\n');
        setStatus(prev => prev + '  1. Switch Freighter to the expected account\n');
        setStatus(prev => prev + '  2. Or refresh this page to sync with Freighter\n');
        setStatus(prev => prev + '  3. Or disconnect and reconnect wallet\n');
        return;
      }

      // If accounts match, check signature hints
      setStatus(prev => prev + '📋 Accounts match, checking signature hints...\n');

      const StellarSdk = window.StellarSdk;
      const keypair = StellarSdk.Keypair.fromPublicKey(publicKey);
      const expectedHint = keypair.signatureHint();
      
      setStatus(prev => prev + `Expected signature hint: ${expectedHint.toString('hex')}\n`);
      setStatus(prev => prev + `Observed in error: bc20d511\n`);
      
      const hintsMatch = expectedHint.toString('hex') === 'bc20d511';
      setStatus(prev => prev + `Signature hints match: ${hintsMatch ? '✅ YES' : '❌ NO'}\n`);

      if (!hintsMatch) {
        setStatus(prev => prev + '\n🎯 SIGNATURE HINT MISMATCH!\n');
        setStatus(prev => prev + 'The signature is from a different account than expected.\n');
        setStatus(prev => prev + 'This explains the tx_bad_auth error.\n');
      }

    } catch (error) {
      setStatus(prev => prev + `❌ Detection failed: ${error.message}\n`);
    }
  };

  const forceAccountSync = async () => {
    setStatus('🔄 Forcing account sync...\n');

    try {
      // Disconnect and reconnect to Freighter
      const freighterApi = (await import('@stellar/freighter-api')).default;
      
      setStatus(prev => prev + '1️⃣ Getting fresh account from Freighter...\n');
      const freshAccount = await freighterApi.getPublicKey();
      
      setStatus(prev => prev + `✅ Fresh account: ${freshAccount}\n`);
      setStatus(prev => prev + `Current context: ${publicKey}\n`);
      
      if (freshAccount !== publicKey) {
        setStatus(prev => prev + '❌ Still mismatched!\n');
        setStatus(prev => prev + '💡 You need to:\n');
        setStatus(prev => prev + '  1. Click Freighter extension\n');
        setStatus(prev => prev + `  2. Switch to account: ${publicKey.slice(0, 8)}...${publicKey.slice(-8)}\n`);
        setStatus(prev => prev + '  3. Refresh this page\n');
        setStatus(prev => prev + '  4. Try again\n');
      } else {
        setStatus(prev => prev + '✅ Accounts are synchronized!\n');
        setStatus(prev => prev + '🚀 Try adding the trustline again - it should work now.\n');
      }

    } catch (error) {
      setStatus(prev => prev + `❌ Sync failed: ${error.message}\n`);
    }
  };

  const testWithCorrectAccount = async () => {
    setStatus('🧪 Testing trustline with correct account detection...\n');

    try {
      // Force get the current Freighter account
      const freighterApi = (await import('@stellar/freighter-api')).default;
      const currentFreighterAccount = await freighterApi.getPublicKey();
      
      setStatus(prev => prev + `🎯 Using Freighter account: ${currentFreighterAccount}\n`);

      const { stellar, SZUP } = await import('../../stellar');
      const StellarSdk = window.StellarSdk;

      // Build transaction with the ACTUAL Freighter account
      const account = await stellar.loadAccount(currentFreighterAccount);
      
      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: StellarSdk.Networks.TESTNET,
      })
      .addOperation(
        StellarSdk.Operation.changeTrust({
          asset: SZUP,
          limit: '1000000',
        })
      )
      .setTimeout(30)
      .build();

      setStatus(prev => prev + `✅ Transaction built for correct account\n`);

      // Sign with Freighter
      const signedResult = await freighterApi.signTransaction(transaction.toXDR(), {
        networkPassphrase: StellarSdk.Networks.TESTNET,
      });

      const signedXDR = typeof signedResult === 'string' 
        ? signedResult 
        : signedResult?.signedTxXdr || signedResult?.signedXDR;

      const signedTx = StellarSdk.TransactionBuilder.fromXDR(
        signedXDR,
        StellarSdk.Networks.TESTNET
      );

      setStatus(prev => prev + `✅ Transaction signed, signatures: ${signedTx.signatures.length}\n`);

      // Submit
      const result = await stellar.server.submitTransaction(signedTx);
      
      setStatus(prev => prev + `🎉 SUCCESS! Trustline added!\n`);
      setStatus(prev => prev + `📋 Hash: ${result.hash}\n`);
      setStatus(prev => prev + `🌐 View: https://stellar.expert/explorer/testnet/tx/${result.hash}\n`);

    } catch (error) {
      setStatus(prev => prev + `❌ Test failed: ${error.message}\n`);
      
      if (error.response?.data?.extras?.result_codes) {
        const codes = error.response.data.extras.result_codes;
        if (codes.operations?.includes('op_already_exists')) {
          setStatus(prev => prev + '🎉 Actually SUCCESS - trustline already exists!\n');
        } else if (codes.transaction === 'tx_bad_auth') {
          setStatus(prev => prev + '❌ Still tx_bad_auth - account mismatch persists\n');
        }
      }
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded shadow-sm max-w-4xl mx-auto">
      <h2 className="text-lg font-semibold text-red-600">🎯 Fix Freighter Account Mismatch</h2>
      
      <div className="p-3 bg-red-50 border border-red-200 rounded">
        <h4 className="font-medium text-red-800">Root Cause Found:</h4>
        <p className="text-sm text-red-700 mt-1">
          The signature hint "bc20d511" in your error suggests Freighter is signing with a 
          different account than your React context expects. This causes tx_bad_auth.
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          onClick={detectAccountMismatch}
        >
          🔍 Detect Account Mismatch
        </button>

        <button
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          onClick={forceAccountSync}
        >
          🔄 Force Account Sync
        </button>

        <button
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          onClick={testWithCorrectAccount}
        >
          🧪 Test with Correct Account
        </button>
      </div>

      <div className="p-3 bg-blue-50 border border-blue-200 rounded">
        <h4 className="font-medium text-blue-800">What to do:</h4>
        <ol className="text-sm text-blue-700 mt-1 space-y-1 list-decimal list-inside">
          <li>Run "Detect Account Mismatch" to confirm the issue</li>
          <li>If accounts don't match, switch in Freighter extension</li>
          <li>Refresh this page after switching</li>
          <li>Try "Test with Correct Account" to bypass the mismatch</li>
        </ol>
      </div>

      {status && (
        <div className="p-3 bg-gray-100 rounded max-h-96 overflow-y-auto">
          <pre className="text-sm whitespace-pre-wrap font-mono">{status}</pre>
        </div>
      )}
    </div>
  );
}