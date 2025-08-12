// Debug and fix the unsigned transaction issue
import React, { useState, useContext } from 'react';
import { WalletContext } from '../../contexts/WalletContext';

export default function FixUnsignedTransaction() {
  const { publicKey } = useContext(WalletContext);
  const [status, setStatus] = useState('');

  const debugUnsignedIssue = () => {
    // The unsigned XDR from your logs
    const unsignedXDR = "AAAAAgAAAADySI71fDYZZUyliRE+EVvWUdoODmHpgwWlg5lIvCDVEQAAAGQADXfjAAAAAwAAAAEAAAAAAAAAAAAAAABom1s3AAAAAAAAAAEAAAAAAAAABgAAAAFTWlVQAAAAAPJIjvV8NhllTKWJET4RW9ZR2g4OYemDBaWDmUi8INURAAAJGE5yoAAAAAAAAAAAAA==";
    
    setStatus('🔍 Analyzing unsigned transaction issue...\n\n');
    
    try {
      const StellarSdk = window.StellarSdk;
      const transaction = StellarSdk.TransactionBuilder.fromXDR(
        unsignedXDR,
        StellarSdk.Networks.TESTNET
      );
      
      setStatus(prev => prev + '📋 Transaction Analysis:\n');
      setStatus(prev => prev + `   Source: ${transaction.source}\n`);
      setStatus(prev => prev + `   Operations: ${transaction.operations.length}\n`);
      setStatus(prev => prev + `   Signatures: ${transaction.signatures.length}\n\n`);
      
      if (transaction.signatures.length === 0) {
        setStatus(prev => prev + '❌ PROBLEM FOUND: Transaction has NO signatures!\n');
        setStatus(prev => prev + '💡 This is why you get tx_bad_auth\n');
        setStatus(prev => prev + '💡 The signing step is failing or being skipped\n\n');
        
        setStatus(prev => prev + '🔧 Possible causes:\n');
        setStatus(prev => prev + '   • Freighter is not being called for signing\n');
        setStatus(prev => prev + '   • Freighter signing fails silently\n');
        setStatus(prev => prev + '   • Transaction is submitted before signing completes\n');
        setStatus(prev => prev + '   • Error in your changeTrust function\n');
      } else {
        setStatus(prev => prev + `✅ Transaction has ${transaction.signatures.length} signature(s)\n`);
      }
      
    } catch (error) {
      setStatus(prev => prev + `❌ XDR analysis failed: ${error.message}\n`);
    }
  };

  const testManualSigning = async () => {
    if (!publicKey) {
      setStatus('❌ Connect wallet first');
      return;
    }

    try {
      setStatus('🧪 Testing manual transaction signing...\n');

      const { stellar, SZUP } = await import('../../stellar');
      const StellarSdk = window.StellarSdk;

      setStatus(prev => prev + '1️⃣ Loading account...\n');
      const account = await stellar.loadAccount(publicKey);
      setStatus(prev => prev + `✅ Account loaded: ${account.id}\n`);

      setStatus(prev => prev + '2️⃣ Building transaction...\n');
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

      setStatus(prev => prev + '✅ Transaction built\n');
      setStatus(prev => prev + `   Signatures before signing: ${transaction.signatures.length}\n`);

      const unsignedXDR = transaction.toXDR();
      setStatus(prev => prev + `   Unsigned XDR: ${unsignedXDR.substring(0, 50)}...\n`);

      setStatus(prev => prev + '3️⃣ Attempting to sign with Freighter...\n');

      // Import Freighter directly
      const freighterApi = (await import('@stellar/freighter-api')).default;

      const signedResult = await freighterApi.signTransaction(unsignedXDR, {
        networkPassphrase: StellarSdk.Networks.TESTNET,
      });

      setStatus(prev => prev + '✅ Freighter signing completed\n');
      setStatus(prev => prev + `   Response type: ${typeof signedResult}\n`);

      // Extract signed XDR
      const signedXDR = typeof signedResult === 'string' 
        ? signedResult 
        : signedResult?.signedTxXdr || signedResult?.signedXDR;

      if (!signedXDR) {
        setStatus(prev => prev + `❌ No signed XDR returned: ${JSON.stringify(signedResult)}\n`);
        return;
      }

      setStatus(prev => prev + `✅ Signed XDR received: ${signedXDR.substring(0, 50)}...\n`);

      // Verify the signed transaction
      const signedTx = StellarSdk.TransactionBuilder.fromXDR(
        signedXDR,
        StellarSdk.Networks.TESTNET
      );

      setStatus(prev => prev + `✅ Signed transaction verified\n`);
      setStatus(prev => prev + `   Signatures after signing: ${signedTx.signatures.length}\n`);

      if (signedTx.signatures.length > 0) {
        setStatus(prev => prev + '🎉 SUCCESS: Signing works properly!\n');
        setStatus(prev => prev + '💡 The issue is in your stellar.js changeTrust function\n');
        
        // Test submission
        setStatus(prev => prev + '4️⃣ Testing submission...\n');
        const result = await stellar.server.submitTransaction(signedTx);
        setStatus(prev => prev + `🎉 TRUSTLINE ADDED! Hash: ${result.hash}\n`);
      } else {
        setStatus(prev => prev + '❌ Signing failed - no signatures added\n');
      }

    } catch (error) {
      setStatus(prev => prev + `❌ Manual signing test failed: ${error.message}\n`);
      
      if (error.message.includes('User declined')) {
        setStatus(prev => prev + '💡 You declined the signature - that\'s expected for testing\n');
      } else {
        setStatus(prev => prev + '💡 This reveals the actual signing problem\n');
      }
    }
  };

  const fixStellarJsChangeTrust = () => {
    setStatus('🔧 How to fix your stellar.js changeTrust function:\n\n');
    
    const fixedCode = `// The issue is likely in your changeTrust function in stellar/index.js
// Here's the corrected version:

changeTrust: async ({ asset, limit, sourceAddress }) => {
  const StellarSdk = getStellarSdk();
  const server = getServer();
  
  console.log('ChangeTrust operation:', { asset, limit, sourceAddress });
  
  // Load the source account
  const account = await server.loadAccount(sourceAddress);
  
  // Build the transaction
  const transactionBuilder = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  });
  
  // Add the changeTrust operation
  transactionBuilder.addOperation(
    StellarSdk.Operation.changeTrust({
      asset: asset, // Make sure this is the actual Asset object
      limit: limit,
    })
  );
  
  // Set timeout and build
  transactionBuilder.setTimeout(30);
  const transaction = transactionBuilder.build();

  console.log('Transaction built, signatures:', transaction.signatures.length);
  console.log('Unsigned XDR:', transaction.toXDR());
  
  // ⭐ CRITICAL: Actually sign the transaction
  const signedXDR = await wallet.signTransaction(transaction.toXDR());
  console.log('Signed XDR received:', signedXDR.substring(0, 50) + '...');
  
  // ⭐ CRITICAL: Submit the SIGNED transaction
  const signedTx = StellarSdk.TransactionBuilder.fromXDR(
    signedXDR,
    NETWORK_PASSPHRASE
  );
  
  console.log('Submitting signed transaction, signatures:', signedTx.signatures.length);
  const result = await server.submitTransaction(signedTx);
  
  return result;
}`;

    setStatus(prev => prev + '```javascript\n');
    setStatus(prev => prev + fixedCode + '\n');
    setStatus(prev => prev + '```\n\n');
    setStatus(prev => prev + '🔍 Key issues to check:\n');
    setStatus(prev => prev + '   • Make sure wallet.signTransaction() is actually called\n');
    setStatus(prev => prev + '   • Make sure you await the signing result\n');
    setStatus(prev => prev + '   • Make sure you submit the SIGNED transaction, not the unsigned one\n');
    setStatus(prev => prev + '   • Add console.log statements to track the signing process\n');
  };

  return (
    <div className="space-y-4 p-4 border rounded shadow-sm max-w-4xl mx-auto">
      <h2 className="text-lg font-semibold text-red-600">🔧 Fix Unsigned Transaction</h2>
      
      <div className="p-3 bg-red-50 border border-red-200 rounded">
        <h4 className="font-medium text-red-800">Issue Found:</h4>
        <p className="text-sm text-red-700 mt-1">
          Your transaction XDR shows no signatures (ends with "=A=="), which means it's being 
          submitted unsigned. This causes tx_bad_auth because Stellar requires signed transactions.
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          onClick={debugUnsignedIssue}
        >
          🔍 Debug Unsigned XDR
        </button>

        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={testManualSigning}
          disabled={!publicKey}
        >
          🧪 Test Manual Signing
        </button>

        <button
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          onClick={fixStellarJsChangeTrust}
        >
          🔧 Show Fix for stellar.js
        </button>
      </div>

      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
        <h4 className="font-medium text-yellow-800">What to check:</h4>
        <ol className="text-sm text-yellow-700 mt-1 space-y-1 list-decimal list-inside">
          <li>Is wallet.signTransaction() being called?</li>
          <li>Is the signing result being awaited?</li>
          <li>Is the signed XDR being used for submission?</li>
          <li>Are there any errors during signing being ignored?</li>
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