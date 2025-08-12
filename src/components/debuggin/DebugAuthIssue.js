// Debug the specific tx_bad_auth issue when addresses match
import React, { useState, useContext } from 'react';
import { WalletContext } from '../../contexts/WalletContext';
import { stellar, SZUP } from '../../stellar';

export default function DebugAuthIssue() {
  const { publicKey } = useContext(WalletContext);
  const [status, setStatus] = useState('');

  const debugTransactionAuth = async () => {
    if (!publicKey) {
      setStatus('❌ Connect wallet first');
      return;
    }

    setStatus('🔍 Debugging tx_bad_auth issue...\n\n');

    try {
      // Step 1: Verify addresses match
      setStatus(prev => prev + '1️⃣ Address Verification:\n');
      setStatus(prev => prev + `   Wallet:     ${publicKey}\n`);
      setStatus(prev => prev + `   Env Issuer: ${process.env.REACT_APP_ISSUER_PUBLIC_KEY}\n`);
      setStatus(prev => prev + `   SZUP Issuer: ${SZUP.issuer}\n`);
      setStatus(prev => prev + `   Match: ${publicKey === SZUP.issuer ? '✅ YES' : '❌ NO'}\n\n`);

      // Step 2: Check account details
      setStatus(prev => prev + '2️⃣ Account Status:\n');
      const account = await stellar.loadAccount(publicKey);
      setStatus(prev => prev + `   Account ID: ${account.id}\n`);
      setStatus(prev => prev + `   Sequence: ${account.sequenceNumber()}\n`);
      setStatus(prev => prev + `   Subentries: ${account.subentry_count}\n\n`);

      // Step 3: Check network configuration
      setStatus(prev => prev + '3️⃣ Network Configuration:\n');
      const StellarSdk = window.StellarSdk;
      setStatus(prev => prev + `   Network: ${process.env.REACT_APP_STELLAR_NETWORK}\n`);
      setStatus(prev => prev + `   Testnet Passphrase: ${StellarSdk.Networks.TESTNET}\n`);
      setStatus(prev => prev + `   Mainnet Passphrase: ${StellarSdk.Networks.PUBLIC}\n\n`);

      // Step 4: Build transaction manually to see where it fails
      setStatus(prev => prev + '4️⃣ Testing Transaction Building:\n');
      
      const transactionBuilder = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: StellarSdk.Networks.TESTNET,
      });

      // Add a simple payment operation (to yourself)
      transactionBuilder.addOperation(
        StellarSdk.Operation.payment({
          destination: publicKey,
          asset: SZUP,
          amount: '1',
        })
      );

      transactionBuilder.setTimeout(30);
      const transaction = transactionBuilder.build();
      
      setStatus(prev => prev + '   ✅ Transaction built successfully\n');
      setStatus(prev => prev + `   Source: ${transaction.source}\n`);
      setStatus(prev => prev + `   Operations: ${transaction.operations.length}\n\n`);

      // Step 5: Test signing
      setStatus(prev => prev + '5️⃣ Testing Transaction Signing:\n');
      const xdr = transaction.toXDR();
      setStatus(prev => prev + `   XDR length: ${xdr.length}\n`);
      setStatus(prev => prev + `   XDR preview: ${xdr.substring(0, 50)}...\n`);

      // Try to sign with Freighter
      const freighterApi = (await import('@stellar/freighter-api')).default;
      
      setStatus(prev => prev + '   🖊️ Requesting signature from Freighter...\n');
      const signedResult = await freighterApi.signTransaction(xdr, {
        networkPassphrase: StellarSdk.Networks.TESTNET,
      });

      setStatus(prev => prev + '   ✅ Transaction signed by Freighter\n');
      
      // Extract signed XDR
      const signedXDR = typeof signedResult === 'string' 
        ? signedResult 
        : signedResult?.signedTxXdr || signedResult?.signedXDR;

      if (!signedXDR) {
        setStatus(prev => prev + `   ❌ Invalid signature response: ${JSON.stringify(signedResult)}\n`);
        return;
      }

      setStatus(prev => prev + `   Signed XDR length: ${signedXDR.length}\n\n`);

      // Step 6: Verify signed transaction
      setStatus(prev => prev + '6️⃣ Verifying Signed Transaction:\n');
      try {
        const signedTx = StellarSdk.TransactionBuilder.fromXDR(
          signedXDR, 
          StellarSdk.Networks.TESTNET
        );
        
        setStatus(prev => prev + `   ✅ Signed transaction is valid\n`);
        setStatus(prev => prev + `   Source account: ${signedTx.source}\n`);
        setStatus(prev => prev + `   Signatures count: ${signedTx.signatures.length}\n`);
        setStatus(prev => prev + `   Sequence number: ${signedTx.sequence}\n\n`);

        // Check if source matches
        if (signedTx.source !== publicKey) {
          setStatus(prev => prev + `   ❌ SOURCE MISMATCH!\n`);
          setStatus(prev => prev + `   Expected: ${publicKey}\n`);
          setStatus(prev => prev + `   Got:      ${signedTx.source}\n`);
          setStatus(prev => prev + `   This could cause tx_bad_auth!\n\n`);
        } else {
          setStatus(prev => prev + `   ✅ Source account matches wallet\n\n`);
        }

      } catch (parseError) {
        setStatus(prev => prev + `   ❌ Cannot parse signed XDR: ${parseError.message}\n\n`);
        return;
      }

      // Step 7: Submit to testnet (without using stellar.payment)
      setStatus(prev => prev + '7️⃣ Testing Direct Submission:\n');
      try {
        const response = await fetch('https://horizon-testnet.stellar.org/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ tx: signedXDR }),
        });

        setStatus(prev => prev + `   Response status: ${response.status}\n`);

        if (!response.ok) {
          const errorText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            setStatus(prev => prev + `   ❌ Non-JSON error: ${errorText.substring(0, 200)}\n`);
            return;
          }

          setStatus(prev => prev + `   ❌ Submission failed: ${errorData.title}\n`);
          
          if (errorData.extras?.result_codes) {
            setStatus(prev => prev + `   Result codes: ${JSON.stringify(errorData.extras.result_codes)}\n`);
            
            if (errorData.extras.result_codes.transaction === 'tx_bad_auth') {
              setStatus(prev => prev + '\n🔍 TX_BAD_AUTH ANALYSIS:\n');
              setStatus(prev => prev + '   Possible causes:\n');
              setStatus(prev => prev + '   • Wrong network (testnet vs mainnet)\n');
              setStatus(prev => prev + '   • Sequence number mismatch\n');
              setStatus(prev => prev + '   • Invalid signature format\n');
              setStatus(prev => prev + '   • Account doesn\'t match signer\n');
              setStatus(prev => prev + '   • Freighter signing wrong account\n\n');
            }
          }
        } else {
          const result = await response.json();
          setStatus(prev => prev + `   🎉 SUCCESS! Transaction hash: ${result.hash}\n`);
        }

      } catch (submitError) {
        setStatus(prev => prev + `   ❌ Submission error: ${submitError.message}\n`);
      }

    } catch (error) {
      setStatus(prev => prev + `\n❌ Debug failed: ${error.message}\n`);
      console.error('Debug error:', error);
    }
  };

  const testSimpleNativePayment = async () => {
    if (!publicKey) {
      setStatus('❌ Connect wallet first');
      return;
    }

    try {
      setStatus('🧪 Testing simple XLM payment to yourself...\n');

      const result = await stellar.payment({
        destination: publicKey,
        asset: window.StellarSdk.Asset.native(),
        amount: '0.0000001',
        sourceAddress: publicKey
      });

      setStatus(prev => prev + `✅ XLM payment successful! Hash: ${result.hash}\n`);
      setStatus(prev => prev + '💡 Basic signing works. The issue might be SZUP-specific.\n');

    } catch (error) {
      setStatus(prev => prev + `❌ XLM payment failed: ${error.message}\n`);
      
      if (error.response?.data?.extras?.result_codes) {
        const codes = error.response.data.extras.result_codes;
        setStatus(prev => prev + `Result codes: ${JSON.stringify(codes)}\n`);
        
        if (codes.transaction === 'tx_bad_auth') {
          setStatus(prev => prev + '💡 Even XLM payments fail with tx_bad_auth!\n');
          setStatus(prev => prev + '💡 This suggests a fundamental signing issue.\n');
        }
      }
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded shadow-sm max-w-4xl mx-auto">
      <h2 className="text-lg font-semibold text-red-600">🔍 Debug tx_bad_auth Issue</h2>
      
      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
        <h4 className="font-medium text-yellow-800">Addresses Match But Still Getting tx_bad_auth</h4>
        <p className="text-sm text-yellow-700 mt-1">
          Even though your wallet and issuer addresses are identical, you're getting authentication errors.
          Let's debug step by step to find the root cause.
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          onClick={debugTransactionAuth}
          disabled={!publicKey}
        >
          🔍 Full Debug Analysis
        </button>

        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={testSimpleNativePayment}
          disabled={!publicKey}
        >
          🧪 Test XLM Payment
        </button>
      </div>

      {status && (
        <div className="p-3 bg-gray-100 rounded max-h-96 overflow-y-auto">
          <pre className="text-sm whitespace-pre-wrap font-mono">{status}</pre>
        </div>
      )}
    </div>
  );
}