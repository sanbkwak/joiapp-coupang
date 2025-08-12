// src/components/Trustline.js
import React, { useContext, useState } from 'react';
import { WalletContext } from '../contexts/WalletContext';
import { wallet, stellar, SZUP } from '../stellar';

export default function Trustline() {
  const { publicKey } = useContext(WalletContext);
  const [status, setStatus] = useState('');

 
  const addTrustline = async () => {
    if (!publicKey) {
      setStatus('🔒 Please connect your wallet first.');
      return;
    }

    try {
      // Check if account exists first (only on testnet)
      if (process.env.REACT_APP_STELLAR_NETWORK !== 'public') {
        setStatus('🔍 Checking account on Testnet...');
        
        try {
          await stellar.loadAccount(publicKey);
          console.log('Account exists on testnet');
        } catch (error) {
          if (error.response && error.response.status === 404) {
            setStatus('🚀 Account not found. Funding via Friendbot...');
            
            const friendbotResponse = await fetch(
              `https://horizon-testnet.stellar.org/friendbot?addr=${encodeURIComponent(publicKey)}`
            );
            
            if (!friendbotResponse.ok) {
              const body = await friendbotResponse.json().catch(() => ({}));
              if (body.detail && body.detail.includes('already funded')) {
                console.log('Account already funded');
              } else {
                throw new Error(`Friendbot error: ${body.title || body.detail || friendbotResponse.status}`);
              }
            }
            
            // Wait a moment for the funding to be processed
            await new Promise(resolve => setTimeout(resolve, 2000));
            setStatus('✅ Account funded successfully');
          } else {
            throw error;
          }
        }
      }

      setStatus('⏳ Building trustline transaction...');
      
      // Use the stellar helper method
      const result = await stellar.changeTrust({
        asset: SZUP,
        limit: '1000000',
        sourceAddress: publicKey
      });

      setStatus(`✅ Trustline added successfully! Hash: ${result.hash}`);
      console.log('Trustline transaction result:', result);
      
    } catch (err) {
      console.error('Trustline error:', err);
      
      // Better error handling
      if (err.response?.data?.extras?.result_codes) {
        const resultCodes = err.response.data.extras.result_codes;
        setStatus(`❌ Transaction failed: ${JSON.stringify(resultCodes)}`);
      } else if (err.message) {
        setStatus(`❌ Error: ${err.message}`);
      } else {
        setStatus(`❌ Unknown error occurred`);
      }
    }
  };
 
  return (
    <div className="space-y-2 p-4 border rounded shadow-sm">
      <h2 className="text-lg font-semibold">Add SZUP Trustline</h2>
      <p className="text-sm text-gray-600">
        {publicKey ? `Connected: ${publicKey.slice(0, 8)}...${publicKey.slice(-8)}` : 'Not connected'}
      </p>
      <button
        className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
        onClick={addTrustline}
        disabled={!publicKey}
      >
        Add Trustline
      </button>
      {status && (
        <div className="mt-2 p-2 bg-gray-100 rounded">
          <p className="text-sm whitespace-pre-wrap">{status}</p>
        </div>
      )}
    </div>
  );
}