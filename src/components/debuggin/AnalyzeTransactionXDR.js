// Analyze the failing transaction XDR to find auth issues
import React, { useState, useContext } from 'react';
import { WalletContext } from '../../contexts/WalletContext';

export default function AnalyzeTransactionXDR() {
  const { publicKey } = useContext(WalletContext);
  const [status, setStatus] = useState('');

  const analyzeFailingXDR = () => {
    // From your error log - the envelope_xdr
    const failingXDR = "AAAAAgAAAADySI71fDYZZUyliRE+EVvWUdoODmHpgwWlg5lIvCDVEQAAAGQADXfjAAAAAwAAAAEAAAAAAAAAAAAAAABom1iMAAAAAAAAAAEAAAAAAAAAAQAAAADMFPjW2hEHovmUy5/eVDz32QYDpMGMJB01/mAHD7i8uQAAAAFTWlVQAAAAAPJIjvV8NhllTKWJET4RW9ZR2g4OYemDBaWDmUi8INURAAAABdIdugAAAAAAAAAAAbwg1REAAABAWCNfEKZ9L6zC9SeDCYh0bmKbPsIshWOCHSj/FXJUqMTMOSrCJzLwtGeg2d/crwFlwDe1mB97PK+KmcoeEgaaCA==";
    
    setStatus('🔍 Analyzing Failing Transaction XDR...\n\n');
    
    try {
      const StellarSdk = window.StellarSdk;
      const transaction = StellarSdk.TransactionBuilder.fromXDR(
        failingXDR,
        StellarSdk.Networks.TESTNET
      );
      
      setStatus(prev => prev + '📋 Transaction Details:\n');
      setStatus(prev => prev + `   Source Account: ${transaction.source}\n`);
      setStatus(prev => prev + `   Your Wallet:    ${publicKey}\n`);
      setStatus(prev => prev + `   Match: ${transaction.source === publicKey ? '✅ YES' : '❌ NO'}\n\n`);
      
      setStatus(prev => prev + `   Sequence Number: ${transaction.sequence}\n`);
      setStatus(prev => prev + `   Fee: ${transaction.fee}\n`);
      setStatus(prev => prev + `   Operations: ${transaction.operations.length}\n`);
      setStatus(prev => prev + `   Signatures: ${transaction.signatures.length}\n\n`);
      
      // Analyze operations
      setStatus(prev => prev + '🔧 Operation Analysis:\n');
      transaction.operations.forEach((op, index) => {
        setStatus(prev => prev + `   ${index + 1}. Type: ${op.type}\n`);
        
        if (op.type === 'payment') {
          setStatus(prev => prev + `      From: ${op.source || transaction.source}\n`);
          setStatus(prev => prev + `      To: ${op.destination}\n`);
          setStatus(prev => prev + `      Asset: ${op.asset.code || 'XLM'}${op.asset.issuer ? ':' + op.asset.issuer.substring(0, 8) + '...' : ''}\n`);
          setStatus(prev => prev + `      Amount: ${op.amount}\n`);
        }
      });
      
      // Check signatures
      setStatus(prev => prev + '\n🔐 Signature Analysis:\n');
      if (transaction.signatures.length === 0) {
        setStatus(prev => prev + '   ❌ No signatures found!\n');
      } else {
        setStatus(prev => prev + `   Signatures count: ${transaction.signatures.length}\n`);
        transaction.signatures.forEach((sig, index) => {
          setStatus(prev => prev + `   ${index + 1}. Signature hint: ${sig.hint().toString('hex')}\n`);
        });
      }
      
      // Check if this is a self-payment issue
      const op = transaction.operations[0];
      if (op && op.type === 'payment' && op.destination === transaction.source) {
        setStatus(prev => prev + '\n⚠️  POTENTIAL ISSUE: Self-payment detected!\n');
        setStatus(prev => prev + '   You\'re trying to pay yourself with your own asset.\n');
        setStatus(prev => prev + '   This requires a trustline first!\n\n');
        
        setStatus(prev => prev + '💡 SOLUTION: Add SZUP trustline before issuing to yourself:\n');
        setStatus(prev => prev + '   1. Go to /wallet/trustline\n');
        setStatus(prev => prev + '   2. Add SZUP trustline\n');
        setStatus(prev => prev + '   3. Then try self-issuing\n');
      }
      
    } catch (error) {
      setStatus(prev => prev + `❌ Failed to parse XDR: ${error.message}\n`);
    }
  };

  const testAccountSequence = async () => {
    if (!publicKey) {
      setStatus('❌ Connect wallet first');
      return;
    }

    try {
      setStatus('🔍 Checking account sequence numbers...\n');
      
      const StellarSdk = window.StellarSdk;
      const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
      
      const account = await server.loadAccount(publicKey);
      setStatus(prev => prev + `Current sequence: ${account.sequenceNumber()}\n`);
      
      // Check what Freighter thinks the sequence should be
      setStatus(prev => prev + 'Testing what sequence Freighter will use...\n');
      
      // Build a dummy transaction to see what sequence it uses
      const testTx = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: StellarSdk.Networks.TESTNET,
      })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: publicKey,
          asset: StellarSdk.Asset.native(),
          amount: '0.0000001',
        })
      )
      .setTimeout(30)
      .build();
      
      setStatus(prev => prev + `Transaction will use sequence: ${testTx.sequence}\n`);
      setStatus(prev => prev + `Expected next sequence: ${account.sequenceNumber()}\n`);
      
      if (testTx.sequence !== account.sequenceNumber()) {
        setStatus(prev => prev + '❌ SEQUENCE MISMATCH! This could cause tx_bad_auth\n');
      } else {
        setStatus(prev => prev + '✅ Sequence numbers match\n');
      }
      
    } catch (error) {
      setStatus(prev => prev + `❌ Error: ${error.message}\n`);
    }
  };

  const checkTrustlineStatus = async () => {
    if (!publicKey) {
      setStatus('❌ Connect wallet first');
      return;
    }

    try {
      setStatus('🔍 Checking SZUP trustline status...\n');
      
      // Import SZUP
      const { SZUP } = await import('../../stellar');
      
      const StellarSdk = window.StellarSdk;
      const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
      
      const account = await server.loadAccount(publicKey);
      
      // Find SZUP trustline
      const szupTrustline = account.balances.find(b => 
        b.asset_code === 'SZUP' && b.asset_issuer === SZUP.issuer
      );
      
      if (!szupTrustline) {
        setStatus(prev => prev + '❌ NO SZUP TRUSTLINE FOUND!\n');
        setStatus(prev => prev + '💡 You need a trustline to receive your own SZUP tokens\n');
        setStatus(prev => prev + '💡 Even as the issuer, you need a trustline to hold the asset\n\n');
        setStatus(prev => prev + '🔧 SOLUTION:\n');
        setStatus(prev => prev + '   1. Go to /wallet/trustline\n');
        setStatus(prev => prev + '   2. Click "Add Trustline"\n');
        setStatus(prev => prev + '   3. Wait for confirmation\n');
        setStatus(prev => prev + '   4. THEN try issuing SZUP\n');
        return;
      }
      
      setStatus(prev => prev + '✅ SZUP trustline exists!\n');
      setStatus(prev => prev + `   Balance: ${szupTrustline.balance}\n`);
      setStatus(prev => prev + `   Limit: ${szupTrustline.limit}\n`);
      
      const available = parseFloat(szupTrustline.limit) - parseFloat(szupTrustline.balance);
      setStatus(prev => prev + `   Available space: ${available}\n`);
      
      if (available <= 0) {
        setStatus(prev => prev + '❌ Trustline is FULL!\n');
        setStatus(prev => prev + '💡 Increase the trustline limit\n');
      } else {
        setStatus(prev => prev + '✅ Trustline has space for more SZUP\n');
        setStatus(prev => prev + '💡 The tx_bad_auth issue is something else\n');
      }
      
    } catch (error) {
      setStatus(prev => prev + `❌ Error: ${error.message}\n`);
    }
  };

  const testMinimalTransaction = async () => {
    if (!publicKey) {
      setStatus('❌ Connect wallet first');
      return;
    }

    try {
      setStatus('🧪 Testing minimal XLM transaction...\n');
      
      // Import stellar utilities
      const { stellar } = await import('../../stellar');
      
      const result = await stellar.payment({
        destination: publicKey,
        asset: window.StellarSdk.Asset.native(),
        amount: '0.0000001',
        sourceAddress: publicKey
      });
      
      setStatus(prev => prev + `✅ XLM payment SUCCESS! Hash: ${result.hash}\n`);
      setStatus(prev => prev + '💡 Basic authentication works\n');
      setStatus(prev => prev + '💡 The issue is likely SZUP-specific or trustline-related\n');
      
    } catch (error) {
      setStatus(prev => prev + `❌ XLM payment failed: ${error.message}\n`);
      
      if (error.response?.data?.extras?.result_codes?.transaction === 'tx_bad_auth') {
        setStatus(prev => prev + '💡 Even XLM fails with tx_bad_auth\n');
        setStatus(prev => prev + '💡 This suggests a fundamental Freighter/signing issue\n');
      }
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded shadow-sm max-w-4xl mx-auto">
      <h2 className="text-lg font-semibold text-red-600">🔍 Analyze tx_bad_auth Issue</h2>
      
      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
        <h4 className="font-medium text-yellow-800">Still Getting tx_bad_auth</h4>
        <p className="text-sm text-yellow-700 mt-1">
          Your SZUP asset is working, but transactions still fail with authentication errors.
          Let's analyze the failing transaction to find the root cause.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          onClick={analyzeFailingXDR}
        >
          🔍 Analyze Failing XDR
        </button>

        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={testAccountSequence}
          disabled={!publicKey}
        >
          📊 Check Sequence Numbers
        </button>

        <button
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          onClick={checkTrustlineStatus}
          disabled={!publicKey}
        >
          🔗 Check SZUP Trustline
        </button>

        <button
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          onClick={testMinimalTransaction}
          disabled={!publicKey}
        >
          🧪 Test XLM Payment
        </button>
      </div>

      <div className="p-3 bg-red-50 border border-red-200 rounded">
        <h4 className="font-medium text-red-800">Most Likely Cause:</h4>
        <p className="text-sm text-red-700 mt-1">
          You're trying to issue SZUP to yourself, but you don't have a SZUP trustline yet.
          Even as the issuer, you need a trustline to receive/hold your own tokens.
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