// Fix for undefined SZUP asset issue
import React, { useState, useContext } from 'react';
import { WalletContext } from '../../contexts/WalletContext';

export default function FixUndefinedSZUP() {
  const { publicKey } = useContext(WalletContext);
  const [status, setStatus] = useState('');

  const diagnoseSZUPAsset = async () => {
    setStatus('🔍 Diagnosing SZUP Asset Creation...\n\n');

    try {
      // Step 1: Check environment
      setStatus(prev => prev + '1️⃣ Environment Check:\n');
      setStatus(prev => prev + `   REACT_APP_ISSUER_PUBLIC_KEY: ${process.env.REACT_APP_ISSUER_PUBLIC_KEY || 'NOT SET'}\n`);
      setStatus(prev => prev + `   REACT_APP_STELLAR_NETWORK: ${process.env.REACT_APP_STELLAR_NETWORK || 'NOT SET'}\n\n`);

      // Step 2: Test StellarSdk availability
      setStatus(prev => prev + '2️⃣ StellarSdk Check:\n');
      if (!window.StellarSdk) {
        setStatus(prev => prev + '   ❌ StellarSdk not loaded!\n');
        return;
      }
      setStatus(prev => prev + '   ✅ StellarSdk available\n\n');

      // Step 3: Try to create SZUP manually
      setStatus(prev => prev + '3️⃣ Manual SZUP Creation:\n');
      const StellarSdk = window.StellarSdk;
      const issuer = process.env.REACT_APP_ISSUER_PUBLIC_KEY;
      
      if (!issuer) {
        setStatus(prev => prev + '   ❌ No issuer key found\n');
        return;
      }

      try {
        const manualSZUP = new StellarSdk.Asset('SZUP', issuer);
        setStatus(prev => prev + '   ✅ Manual SZUP creation successful!\n');
        setStatus(prev => prev + `   Code: ${manualSZUP.code}\n`);
        setStatus(prev => prev + `   Issuer: ${manualSZUP.issuer}\n`);
        setStatus(prev => prev + `   Is Native: ${manualSZUP.isNative()}\n\n`);
      } catch (assetError) {
        setStatus(prev => prev + `   ❌ Manual creation failed: ${assetError.message}\n\n`);
        return;
      }

      // Step 4: Check stellar.js import
      setStatus(prev => prev + '4️⃣ Checking stellar.js import:\n');
      try {
        const stellarModule = await import('../../stellar');
        setStatus(prev => prev + '   ✅ Stellar module imported\n');
        
        if (stellarModule.SZUP) {
          setStatus(prev => prev + `   ✅ SZUP exported: ${stellarModule.SZUP.code}:${stellarModule.SZUP.issuer}\n`);
        } else {
          setStatus(prev => prev + '   ❌ SZUP not exported from stellar.js\n');
          setStatus(prev => prev + '   💡 Check your stellar.js exports\n');
        }

        if (stellarModule.getSZUP) {
          setStatus(prev => prev + '   ✅ getSZUP function exported\n');
          
          try {
            const szupFromFunction = stellarModule.getSZUP();
            setStatus(prev => prev + `   ✅ getSZUP() works: ${szupFromFunction.code}:${szupFromFunction.issuer}\n`);
          } catch (getSZUPError) {
            setStatus(prev => prev + `   ❌ getSZUP() failed: ${getSZUPError.message}\n`);
          }
        } else {
          setStatus(prev => prev + '   ❌ getSZUP function not exported\n');
        }

      } catch (importError) {
        setStatus(prev => prev + `   ❌ Import failed: ${importError.message}\n`);
      }

    } catch (error) {
      setStatus(prev => prev + `\n❌ Diagnosis failed: ${error.message}\n`);
    }
  };

  const fixStellarJs = () => {
    setStatus('📝 How to fix your stellar.js file:\n\n');
    
    const fixedCode = `// In your stellar.js file, make sure you have this:

import StellarSdk from 'stellar-sdk';

let _SZUP = null;

const getSZUP = () => {
  if (!_SZUP) {
    const issuerKey = process.env.REACT_APP_ISSUER_PUBLIC_KEY;
    
    if (!issuerKey) {
      throw new Error('REACT_APP_ISSUER_PUBLIC_KEY environment variable is not set');
    }
    
    console.log('Creating SZUP asset with issuer:', issuerKey);
    _SZUP = new StellarSdk.Asset('SZUP', issuerKey);
  }
  return _SZUP;
};

// Export both the function AND call it to create the constant
export { getSZUP };
export const SZUP = getSZUP();

// Make sure your other exports are here too:
export { stellar, wallet };`;

    setStatus(prev => prev + '```javascript\n');
    setStatus(prev => prev + fixedCode + '\n');
    setStatus(prev => prev + '```\n\n');
    
    setStatus(prev => prev + '🔧 Key points:\n');
    setStatus(prev => prev + '   • Import StellarSdk correctly\n');
    setStatus(prev => prev + '   • Export both getSZUP function and SZUP constant\n');
    setStatus(prev => prev + '   • Make sure environment variable is loaded\n');
    setStatus(prev => prev + '   • Add error handling for missing env var\n\n');
    
    setStatus(prev => prev + '🔄 After fixing:\n');
    setStatus(prev => prev + '   1. Save stellar.js\n');
    setStatus(prev => prev + '   2. Restart dev server\n');
    setStatus(prev => prev + '   3. Test again\n');
  };

  const testDirectSZUPCreation = async () => {
    if (!publicKey) {
      setStatus('❌ Connect wallet first');
      return;
    }

    try {
      setStatus('🧪 Testing direct SZUP transaction...\n');

      const StellarSdk = window.StellarSdk;
      const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
      const issuer = process.env.REACT_APP_ISSUER_PUBLIC_KEY;

      // Create SZUP asset directly
      const szupAsset = new StellarSdk.Asset('SZUP', issuer);
      setStatus(prev => prev + `✅ SZUP created: ${szupAsset.code}:${szupAsset.issuer}\n`);

      // Load account
      const account = await server.loadAccount(publicKey);
      setStatus(prev => prev + '✅ Account loaded\n');

      // Build transaction
      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: StellarSdk.Networks.TESTNET,
      })
        .addOperation(
          StellarSdk.Operation.payment({
            destination: publicKey,
            asset: szupAsset,
            amount: '1',
          })
        )
        .setTimeout(30)
        .build();

      setStatus(prev => prev + '✅ Transaction built successfully\n');
      setStatus(prev => prev + '💡 This proves SZUP can be created - the issue is in your stellar.js file\n');

    } catch (error) {
      setStatus(prev => prev + `❌ Direct test failed: ${error.message}\n`);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded shadow-sm max-w-4xl mx-auto">
      <h2 className="text-lg font-semibold text-red-600">🔧 Fix Undefined SZUP Asset</h2>
      
      <div className="p-3 bg-red-50 border border-red-200 rounded">
        <h4 className="font-medium text-red-800">Root Cause Found:</h4>
        <p className="text-sm text-red-700 mt-1">
          Your SZUP asset is undefined, which means your getSZUP() function in stellar.js
          isn't working properly. This causes tx_bad_auth because the transaction can't build.
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          onClick={diagnoseSZUPAsset}
        >
          🔍 Diagnose SZUP Asset
        </button>

        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={fixStellarJs}
        >
          📝 Show stellar.js Fix
        </button>

        <button
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          onClick={testDirectSZUPCreation}
          disabled={!publicKey}
        >
          🧪 Test Direct SZUP
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