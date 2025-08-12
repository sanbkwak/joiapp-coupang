// Debug the specific 400 error during submission
import React, { useState, useContext } from 'react';
import { WalletContext } from '../../contexts/WalletContext';

export default function Debug400SubmissionError() {
  const { publicKey } = useContext(WalletContext);
  const [status, setStatus] = useState('');

  const testSubmissionWithDetails = async () => {
    if (!publicKey) {
      setStatus('❌ Connect wallet first');
      return;
    }

    try {
      setStatus('🔍 Testing submission with detailed error logging...\n');

      const { stellar, SZUP } = await import('../../stellar');
      const StellarSdk = window.StellarSdk;

      // Build transaction
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

      // Sign transaction
      const freighterApi = (await import('@stellar/freighter-api')).default;
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

      setStatus(prev => prev + `✅ Transaction ready for submission\n`);
      setStatus(prev => prev + `   Signatures: ${signedTx.signatures.length}\n`);
      setStatus(prev => prev + `   Source: ${signedTx.source}\n`);
      setStatus(prev => prev + `   Sequence: ${signedTx.sequence}\n\n`);

      // Attempt submission with detailed error handling
      setStatus(prev => prev + '📤 Submitting to Stellar...\n');

      try {
        const result = await stellar.server.submitTransaction(signedTx);
        setStatus(prev => prev + `🎉 SUCCESS! Hash: ${result.hash}\n`);
      } catch (submitError) {
        setStatus(prev => prev + `❌ Submission failed: ${submitError.message}\n`);
        
        // Extract detailed error info
        if (submitError.response && submitError.response.data) {
          const errorData = submitError.response.data;
          setStatus(prev => prev + `\n📋 Detailed Error Info:\n`);
          setStatus(prev => prev + `   Status: ${errorData.status}\n`);
          setStatus(prev => prev + `   Title: ${errorData.title}\n`);
          setStatus(prev => prev + `   Detail: ${errorData.detail}\n`);
          
          if (errorData.extras) {
            setStatus(prev => prev + `\n🔍 Error Extras:\n`);
            
            if (errorData.extras.result_codes) {
              const codes = errorData.extras.result_codes;
              setStatus(prev => prev + `   Transaction Code: ${codes.transaction}\n`);
              
              if (codes.operations) {
                setStatus(prev => prev + `   Operation Codes: ${JSON.stringify(codes.operations)}\n`);
                
                // Explain common operation codes
                codes.operations.forEach((opCode, index) => {
                  setStatus(prev => prev + `\n💡 Operation ${index + 1} (${opCode}):\n`);
                  
                  switch (opCode) {
                    case 'op_already_exists':
                      setStatus(prev => prev + '   → Trustline already exists! This is actually SUCCESS.\n');
                      setStatus(prev => prev + '   → You can ignore this error and proceed.\n');
                      break;
                    case 'op_low_reserve':
                      setStatus(prev => prev + '   → Not enough XLM for minimum balance requirements.\n');
                      setStatus(prev => prev + '   → Need more XLM in your account.\n');
                      break;
                    case 'op_line_full':
                      setStatus(prev => prev + '   → Trustline is full (limit reached).\n');
                      break;
                    case 'op_no_trust':
                      setStatus(prev => prev + '   → Account doesn\'t have required trustline.\n');
                      break;
                    case 'op_bad_auth':
                      setStatus(prev => prev + '   → Operation signature is invalid.\n');
                      break;
                    default:
                      setStatus(prev => prev + `   → See: https://developers.stellar.org/docs/fundamentals-and-concepts/list-of-operations#change-trust\n`);
                  }
                });
              }
            }
            
            if (errorData.extras.envelope_xdr) {
              setStatus(prev => prev + `\n📋 Transaction XDR: ${errorData.extras.envelope_xdr.substring(0, 50)}...\n`);
            }
          }
        }
      }

    } catch (error) {
      setStatus(prev => prev + `❌ Test failed: ${error.message}\n`);
    }
  };

  const checkAccountStatus = async () => {
    if (!publicKey) {
      setStatus('❌ Connect wallet first');
      return;
    }

    try {
      setStatus('🔍 Checking account status for potential issues...\n');

      const { stellar, SZUP } = await import('../../stellar');
      const account = await stellar.loadAccount(publicKey);

      setStatus(prev => prev + `\n📊 Account: ${account.id}\n`);
      setStatus(prev => prev + `   Sequence: ${account.sequenceNumber()}\n`);
      setStatus(prev => prev + `   Subentries: ${account.subentry_count}\n`);

      // Check XLM balance and reserves
      const xlmBalance = account.balances.find(b => b.asset_type === 'native');
      const baseReserve = 0.5;
      const requiredReserve = (2 + account.subentry_count) * baseReserve;
      const availableXLM = parseFloat(xlmBalance.balance) - requiredReserve;

      setStatus(prev => prev + `\n💰 XLM Status:\n`);
      setStatus(prev => prev + `   Balance: ${xlmBalance.balance} XLM\n`);
      setStatus(prev => prev + `   Required Reserve: ${requiredReserve} XLM\n`);
      setStatus(prev => prev + `   Available: ${availableXLM} XLM\n`);

      if (availableXLM < 0.5) {
        setStatus(prev => prev + `   ⚠️ Low XLM - may cause reserve issues\n`);
      } else {
        setStatus(prev => prev + `   ✅ Sufficient XLM\n`);
      }

      // Check existing trustlines
      const trustlines = account.balances.filter(b => b.asset_type !== 'native');
      setStatus(prev => prev + `\n🔗 Existing Trustlines: ${trustlines.length}\n`);

      trustlines.forEach((tl, index) => {
        setStatus(prev => prev + `   ${index + 1}. ${tl.asset_code}: ${tl.balance}/${tl.limit}\n`);
        setStatus(prev => prev + `      Issuer: ${tl.asset_issuer}\n`);
      });

      // Check if SZUP trustline already exists
      const szupTrustline = trustlines.find(tl => 
        tl.asset_code === 'SZUP' && tl.asset_issuer === SZUP.issuer
      );

      setStatus(prev => prev + `\n🎯 SZUP Trustline Status:\n`);
      if (szupTrustline) {
        setStatus(prev => prev + `   ✅ SZUP trustline EXISTS!\n`);
        setStatus(prev => prev + `   Balance: ${szupTrustline.balance}\n`);
        setStatus(prev => prev + `   Limit: ${szupTrustline.limit}\n`);
        setStatus(prev => prev + `   💡 This explains the 400 error - trustline already exists!\n`);
      } else {
        setStatus(prev => prev + `   ❌ No SZUP trustline found\n`);
        setStatus(prev => prev + `   💡 Should be safe to add trustline\n`);
      }

    } catch (error) {
      setStatus(prev => prev + `❌ Account check failed: ${error.message}\n`);
    }
  };

  const quickFixAttempt = async () => {
    if (!publicKey) {
      setStatus('❌ Connect wallet first');
      return;
    }

    try {
      setStatus('🚀 Quick fix attempt - using simplified approach...\n');

      const { stellar, SZUP } = await import('../../stellar');

      const result = await stellar.changeTrust({
        asset: SZUP,
        limit: '1000000',
        sourceAddress: publicKey
      });

      setStatus(prev => prev + `🎉 SUCCESS! Trustline added!\n`);
      setStatus(prev => prev + `📋 Hash: ${result.hash}\n`);

    } catch (error) {
      setStatus(prev => prev + `❌ Quick fix failed: ${error.message}\n`);
      
      if (error.message.includes('op_already_exists') || error.message.includes('already exists')) {
        setStatus(prev => prev + `💡 GOOD NEWS: Trustline already exists!\n`);
        setStatus(prev => prev + `💡 You can proceed with issuing SZUP\n`);
      }
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded shadow-sm max-w-4xl mx-auto">
      <h2 className="text-lg font-semibold text-orange-600">🔍 Debug 400 Submission Error</h2>
      
      <div className="p-3 bg-orange-50 border border-orange-200 rounded">
        <h4 className="font-medium text-orange-800">Status:</h4>
        <ul className="text-sm text-orange-700 mt-1 space-y-1">
          <li>• ✅ Transaction building works</li>
          <li>• ✅ Freighter signing works (1 signature)</li>
          <li>• ❌ Submission gets 400 error</li>
          <li>• 🤔 Need to see the specific error reason</li>
        </ul>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          onClick={testSubmissionWithDetails}
          disabled={!publicKey}
        >
          🔍 Test with Error Details
        </button>

        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={checkAccountStatus}
          disabled={!publicKey}
        >
          📊 Check Account Status
        </button>

        <button
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          onClick={quickFixAttempt}
          disabled={!publicKey}
        >
          🚀 Quick Fix Attempt
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