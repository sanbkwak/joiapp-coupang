// src/components/DebugStellar.js - FIXED VERSION
import React, { useContext, useState } from 'react';
import { WalletContext } from '../../contexts/WalletContext';
import freighterApi from '@stellar/freighter-api';

export default function DebugStellar() {
  const { publicKey } = useContext(WalletContext);
  const [status, setStatus] = useState('');

  const testStellarSDK = () => {
    try {
      setStatus('🔍 Testing Stellar SDK...\n');
      
      if (!window.StellarSdk) {
        setStatus('❌ StellarSdk not loaded');
        return;
      }

      const StellarSdk = window.StellarSdk;
      setStatus(prev => prev + `✅ StellarSdk loaded, version: ${StellarSdk.version || 'unknown'}\n`);

      // Test Server
      let server;
      try {
        const StellarSdk = window.StellarSdk;
        
        // Try different ways to create server
        if (StellarSdk.Horizon && StellarSdk.Horizon.Server) {
          server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
          setStatus(prev => prev + `✅ Server created (Horizon.Server): ${server.serverURL}\n`);
        } else if (StellarSdk.Server) {
          server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
          setStatus(prev => prev + `✅ Server created (Server): ${server.serverURL}\n`);
        } else {
          throw new Error('No Server constructor found');
        }
      } catch (e) {
        setStatus(prev => prev + `❌ Server creation failed: ${e.message}\n`);
        return;
      }

      // Test Asset creation
      try {
        const issuer = process.env.REACT_APP_ISSUER_PUBLIC_KEY;
        if (!issuer) {
          setStatus(prev => prev + `❌ No issuer key in environment\n`);
          return;
        }
        
        const asset = new StellarSdk.Asset('SZUP', issuer);
        setStatus(prev => prev + `✅ Asset created: ${asset.code}:${asset.issuer}\n`);
      } catch (e) {
        setStatus(prev => prev + `❌ Asset creation failed: ${e.message}\n`);
        return;
      }

      // Test basic operation creation (without transaction)
      try {
        const issuer = process.env.REACT_APP_ISSUER_PUBLIC_KEY;
        const asset = new StellarSdk.Asset('SZUP', issuer);
        
        const operation = StellarSdk.Operation.changeTrust({
          asset: asset,
          limit: '1000000',
        });
        
        setStatus(prev => prev + `✅ ChangeTrust operation created\n`);
      } catch (e) {
        setStatus(prev => prev + `❌ Operation creation failed: ${e.message}\n`);
        return;
      }

      setStatus(prev => prev + `🎉 All basic tests passed!`);
      
    } catch (error) {
      setStatus(prev => prev + `❌ General error: ${error.message}`);
    }
  };

  const testFullTransaction = async () => {
    if (!publicKey) {
      setStatus('❌ Please connect your wallet first');
      return;
    }

    try {
      setStatus('🔍 Testing full transaction flow...\n');
      
      const StellarSdk = window.StellarSdk;
      
      // Create server with proper constructor
      let server;
      if (StellarSdk.Horizon && StellarSdk.Horizon.Server) {
        server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
      } else if (StellarSdk.Server) {
        server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
      } else {
        throw new Error('No Server constructor found in StellarSdk');
      }
      
      // Debug server properties
      setStatus(prev => prev + `🔍 Server created. Properties: ${Object.keys(server).join(', ')}\n`);
      setStatus(prev => prev + `🔍 Server URL: ${server.serverURL || server._serverURL || 'unknown'}\n`);
      
      const issuer = process.env.REACT_APP_ISSUER_PUBLIC_KEY;
      const asset = new StellarSdk.Asset('SZUP', issuer);
      
      setStatus(prev => prev + '📡 Loading account...\n');
      
      // Check if account exists, fund if needed
      let account;
      try {
        account = await server.loadAccount(publicKey);
        setStatus(prev => prev + '✅ Account loaded\n');
      } catch (error) {
        if (error.response && error.response.status === 404) {
          setStatus(prev => prev + '🚀 Funding account via Friendbot...\n');
          const friendbotResponse = await fetch(
            `https://horizon-testnet.stellar.org/friendbot?addr=${encodeURIComponent(publicKey)}`
          );
          if (!friendbotResponse.ok) {
            throw new Error('Friendbot funding failed');
          }
          await new Promise(resolve => setTimeout(resolve, 3000));
          account = await server.loadAccount(publicKey);
          setStatus(prev => prev + '✅ Account funded and loaded\n');
        } else {
          throw error;
        }
      }

      setStatus(prev => prev + '🔨 Building transaction...\n');
      
      // Build transaction step by step
      const transactionBuilder = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: 'Test SDF Network ; September 2015',
      });
      
      setStatus(prev => prev + '✅ TransactionBuilder created\n');
      
      // Add operation
      transactionBuilder.addOperation(
        StellarSdk.Operation.changeTrust({
          asset: asset,
          limit: '1000000',
        })
      );
      
      setStatus(prev => prev + '✅ Operation added\n');
      
      // Set timeout
      transactionBuilder.setTimeout(30);
      setStatus(prev => prev + '✅ Timeout set\n');
      
      // Build transaction
      const transaction = transactionBuilder.build();
      setStatus(prev => prev + '✅ Transaction built\n');
      
      // Get XDR
      const xdr = transaction.toXDR();
      setStatus(prev => prev + `✅ XDR generated: ${xdr.substring(0, 50)}...\n`);
      
      setStatus(prev => prev + '🖊️ Signing transaction...\n');
      
      // Sign the transaction
      const resp = await freighterApi.signTransaction(xdr, {
        networkPassphrase: StellarSdk.Networks.TESTNET,
      });

      // Normalize possible return shapes across versions
      const signedXDR =
        typeof resp === 'string'
          ? resp
          : resp?.signedTxXdr || resp?.signedXDR || resp?.xdr || null;

      if (!signedXDR) {
        setStatus(prev => prev + `❌ Unexpected Freighter payload: ${JSON.stringify(resp)}\n`);
        return;
      }

      // Sanity check: can the SDK parse this base64?
      try {
        StellarSdk.TransactionBuilder.fromXDR(signedXDR, StellarSdk.Networks.TESTNET);
        setStatus(prev => prev + `✅ signedXDR len ${signedXDR.length}\n`);
      } catch (e) {
        setStatus(prev => prev + `❌ Not valid XDR: ${e.message}\nPayload: ${JSON.stringify(resp)}\n`);
        return;
      }

      setStatus(prev => prev + '✅ Transaction signed\n');
      setStatus(prev => prev + '📤 Submitting transaction...\n');
      
      // Submit directly to Horizon API
      try {
        const submitUrl = 'https://horizon-testnet.stellar.org/transactions';
        
        setStatus(prev => prev + `📡 Submitting to: ${submitUrl}\n`);
        
        const response = await fetch(submitUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ tx: signedXDR }),
        });
        
        setStatus(prev => prev + `📊 Response status: ${response.status}\n`);
        
        if (!response.ok) {
          const errorText = await response.text();
          setStatus(prev => prev + `📝 Error response: ${errorText.substring(0, 200)}...\n`);
          
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            throw new Error(`HTTP ${response.status}: ${errorText}`);
          }
          
          // Handle Stellar-specific errors
          if (errorData.extras && errorData.extras.result_codes) {
            throw new Error(`Transaction failed: ${JSON.stringify(errorData.extras.result_codes)}`);
          }
          
          throw new Error(`HTTP ${response.status}: ${errorData.detail || errorData.title || errorText}`);
        }
        
        const result = await response.json();
        setStatus(prev => prev + `🎉 SUCCESS! Hash: ${result.hash}\n`);
        setStatus(prev => prev + `📋 Ledger: ${result.ledger}\n`);
        
      } catch (submitError) {
        setStatus(prev => prev + `❌ Submission failed: ${submitError.message}\n`);
        
        // If direct submission fails, let's also try the SDK method as a fallback
        setStatus(prev => prev + `🔄 Trying SDK submission as fallback...\n`);
        try {
          const signedTransaction = StellarSdk.TransactionBuilder.fromXDR(
            signedXDR, 
            StellarSdk.Networks.TESTNET
          );
          const result = await server.submitTransaction(signedTransaction);
          setStatus(prev => prev + `🎉 SUCCESS via SDK fallback! Hash: ${result.hash}\n`);
          return;
        } catch (fallbackError) {
          setStatus(prev => prev + `❌ SDK fallback also failed: ${fallbackError.message}\n`);
          throw submitError; // Throw the original error
        }
      }
      
    } catch (error) {
      setStatus(prev => prev + `❌ Error: ${error.message}\n`);
      console.error('Full transaction test error:', error);
    }
  };

  return (
    <div className="space-y-2 p-4 border rounded shadow-sm">
      <h2 className="text-lg font-semibold">Debug Stellar SDK</h2>
      <p className="text-sm text-gray-600">
        Wallet: {publicKey ? `${publicKey.slice(0,8)}...${publicKey.slice(-8)}` : 'Not connected'}
      </p>
      <p className="text-sm text-gray-600">
        Issuer Key: {process.env.REACT_APP_ISSUER_PUBLIC_KEY ? 
          `${process.env.REACT_APP_ISSUER_PUBLIC_KEY.slice(0,10)}...` : 
          'Not set'}
      </p>
      <div className="flex gap-2">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={testStellarSDK}
        >
          Test SDK Basics
        </button>
        <button
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          onClick={testFullTransaction}
          disabled={!publicKey}
        >
          Test Full Transaction
        </button>
      </div>
      {status && (
        <div className="mt-2 p-2 bg-gray-100 rounded">
          <pre className="text-sm whitespace-pre-wrap">{status}</pre>
        </div>
      )}
    </div>
  );
}