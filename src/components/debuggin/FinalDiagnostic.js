// Final diagnostic to catch the actual 400 error details
import React, { useState, useContext } from 'react';
import { WalletContext } from '../../contexts/WalletContext';

export default function FinalDiagnostic() {
  const { publicKey } = useContext(WalletContext);
  const [status, setStatus] = useState('');

  const interceptActualError = async () => {
    if (!publicKey) {
      setStatus('❌ Connect wallet first');
      return;
    }

    try {
      setStatus('🔍 Intercepting the actual error details...\n');

      const { stellar, SZUP } = await import('../../stellar');
      const StellarSdk = window.StellarSdk;

      // Load fresh account
      const account = await stellar.loadAccount(publicKey);
      setStatus(prev => prev + `✅ Account loaded, sequence: ${account.sequenceNumber()}\n`);

      // Build transaction
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

      setStatus(prev => prev + `✅ Transaction built, sequence: ${transaction.sequence}\n`);

      // Sign with detailed logging
      const freighterApi = (await import('@stellar/freighter-api')).default;
      
      setStatus(prev => prev + '🖊️ Calling Freighter...\n');
      const signedResult = await freighterApi.signTransaction(transaction.toXDR(), {
        networkPassphrase: StellarSdk.Networks.TESTNET,
      });

      setStatus(prev => prev + `📋 Freighter response type: ${typeof signedResult}\n`);
      
      // Check for rejection or error
      if (signedResult.error) {
        setStatus(prev => prev + `❌ Freighter error: ${JSON.stringify(signedResult.error)}\n`);
        return;
      }

      const signedXDR = typeof signedResult === 'string' 
        ? signedResult 
        : signedResult?.signedTxXdr || signedResult?.signedXDR;

      if (!signedXDR || signedXDR.length === 0) {
        setStatus(prev => prev + `❌ Empty signed XDR: ${JSON.stringify(signedResult)}\n`);
        return;
      }

      const signedTx = StellarSdk.TransactionBuilder.fromXDR(
        signedXDR,
        StellarSdk.Networks.TESTNET
      );

      setStatus(prev => prev + `✅ Signed transaction verified, signatures: ${signedTx.signatures.length}\n`);

      // Submit with full error interception
      setStatus(prev => prev + '📤 Submitting to Stellar...\n');

      try {
        const result = await stellar.server.submitTransaction(signedTx);
        setStatus(prev => prev + `🎉 SUCCESS! Hash: ${result.hash}\n`);
      } catch (submitError) {
        setStatus(prev => prev + '❌ Submission error caught!\n');
        
        // Extract full error details
        if (submitError.response && submitError.response.data) {
          const errorData = submitError.response.data;
          
          setStatus(prev => prev + `\n📋 Complete Error Details:\n`);
          setStatus(prev => prev + JSON.stringify(errorData, null, 2) + '\n');
          
          // Specifically look for result codes
          if (errorData.extras && errorData.extras.result_codes) {
            const codes = errorData.extras.result_codes;
            
            setStatus(prev => prev + `\n🎯 Result Codes Analysis:\n`);
            setStatus(prev => prev + `   Transaction: ${codes.transaction}\n`);
            
            if (codes.operations) {
              codes.operations.forEach((opCode, index) => {
                setStatus(prev => prev + `   Operation ${index}: ${opCode}\n`);
                
                // Explain specific codes
                if (opCode === 'op_already_exists') {
                  setStatus(prev => prev + '     → Trustline already exists! This is actually success.\n');
                } else if (opCode === 'op_low_reserve') {
                  setStatus(prev => prev + '     → Insufficient XLM for reserve requirements.\n');
                } else if (opCode === 'op_bad_seq') {
                  setStatus(prev => prev + '     → Sequence number is wrong.\n');
                }
              });
            }
            
            if (codes.transaction === 'tx_bad_seq') {
              setStatus(prev => prev + '   💡 tx_bad_seq = Wrong sequence number\n');
              
              // Check current sequence again
              const freshAccount = await stellar.loadAccount(publicKey);
              setStatus(prev => prev + `   Current sequence now: ${freshAccount.sequenceNumber()}\n`);
              setStatus(prev => prev + `   Transaction used: ${transaction.sequence}\n`);
            }
          }
        } else {
          setStatus(prev => prev + `Raw error: ${submitError.message}\n`);
        }
      }

    } catch (error) {
      setStatus(prev => prev + `❌ Diagnostic failed: ${error.message}\n`);
      
      if (error.message.includes('User rejected')) {
        setStatus(prev => prev + '💡 You actually did decline the Freighter popup\n');
      }
    }
  };

  const testDirectSubmission = async () => {
    if (!publicKey) {
      setStatus('❌ Connect wallet first');
      return;
    }

    setStatus('🧪 Testing direct Horizon submission...\n');

    try {
      const { stellar, SZUP } = await import('../../stellar');
      const StellarSdk = window.StellarSdk;

      const account = await stellar.loadAccount(publicKey);
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

      const freighterApi = (await import('@stellar/freighter-api')).default;
      const signedResult = await freighterApi.signTransaction(transaction.toXDR(), {
        networkPassphrase: StellarSdk.Networks.TESTNET,
      });

      const signedXDR = typeof signedResult === 'string' 
        ? signedResult 
        : signedResult?.signedTxXdr || signedResult?.signedXDR;

      // Submit directly to Horizon API with detailed logging
      setStatus(prev => prev + '📤 Submitting directly to Horizon API...\n');

      const response = await fetch('https://horizon-testnet.stellar.org/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ tx: signedXDR }),
      });

      setStatus(prev => prev + `📊 Response status: ${response.status}\n`);

      if (!response.ok) {
        const errorText = await response.text();
        setStatus(prev => prev + `📝 Full error response:\n${errorText}\n`);
        
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.extras && errorJson.extras.result_codes) {
            setStatus(prev => prev + `🎯 Parsed result codes: ${JSON.stringify(errorJson.extras.result_codes)}\n`);
          }
        } catch (parseError) {
          setStatus(prev => prev + '❌ Could not parse error as JSON\n');
        }
      } else {
        const result = await response.json();
        setStatus(prev => prev + `🎉 SUCCESS! Hash: ${result.hash}\n`);
      }

    } catch (error) {
      setStatus(prev => prev + `❌ Direct submission failed: ${error.message}\n`);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded shadow-sm max-w-4xl mx-auto">
      <h2 className="text-lg font-semibold text-green-600">🔍 Final Diagnostic</h2>
      
      <div className="p-3 bg-green-50 border border-green-200 rounded">
        <h4 className="font-medium text-green-800">Good News:</h4>
        <ul className="text-sm text-green-700 mt-1 space-y-1">
          <li>✅ SZUP asset is working perfectly</li>
          <li>✅ Transaction building works</li>
          <li>✅ Signing produces 1 signature</li>
          <li>❌ Something in submission fails</li>
        </ul>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          onClick={interceptActualError}
          disabled={!publicKey}
        >
          🔍 Intercept Real Error
        </button>

        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={testDirectSubmission}
          disabled={!publicKey}
        >
          🧪 Test Direct API
        </button>
      </div>

      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
        <h4 className="font-medium text-yellow-800">What we'll catch:</h4>
        <ul className="text-sm text-yellow-700 mt-1 space-y-1">
          <li>• The exact 400 error details from Stellar</li>
          <li>• Whether it's actually op_already_exists (success)</li>
          <li>• Whether it's a sequence number issue</li>
          <li>• Whether Freighter is actually rejecting</li>
        </ul>
      </div>

      {status && (
        <div className="p-3 bg-gray-100 rounded max-h-96 overflow-y-auto">
          <pre className="text-sm whitespace-pre-wrap font-mono">{status}</pre>
        </div>
      )}
    </div>
  );
}