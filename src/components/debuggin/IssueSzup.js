// src/components/IssueSzup.js
import React, { useState, useContext } from 'react';
import { WalletContext } from '../../contexts/WalletContext';
import { wallet, stellar, SZUP } from '../../stellar';

export default function IssueSzup() {
  const { publicKey } = useContext(WalletContext);
  const [to, setTo] = useState('');
  const [amt, setAmt] = useState('');
  const [stat, setStat] = useState('');

  const checkBalance = async () => {
    if (!publicKey) {
      setStat('🔒 Please connect your wallet first.');
      return;
    }

    try {
      setStat('🔍 Checking account balance...');
      
      const account = await stellar.loadAccount(publicKey);
      
      setStat(prev => prev + '\n📊 Account Details:');
      setStat(prev => prev + `\n   - Account ID: ${account.id}`);
      setStat(prev => prev + `\n   - Sequence: ${account.sequenceNumber()}`);
      
      // Show all balances
      setStat(prev => prev + '\n💰 All Balances:');
      account.balances.forEach((balance, index) => {
        if (balance.asset_type === 'native') {
          setStat(prev => prev + `\n   ${index + 1}. XLM (native): ${balance.balance}`);
        } else {
          setStat(prev => prev + `\n   ${index + 1}. ${balance.asset_code}:${balance.asset_issuer.substring(0,8)}...: ${balance.balance}`);
        }
      });

      // Calculate required reserves
      const numSubentries = account.subentry_count;
      const baseReserve = 0.5; // Current Stellar base reserve
      const requiredReserve = (2 + numSubentries) * baseReserve;
      
      setStat(prev => prev + `\n📋 Reserve Requirements:`);
      setStat(prev => prev + `\n   - Base Reserve: ${baseReserve} XLM`);
      setStat(prev => prev + `\n   - Subentries: ${numSubentries}`);
      setStat(prev => prev + `\n   - Required Reserve: ${requiredReserve} XLM`);
      
      const xlmBalance = parseFloat(account.balances.find(b => b.asset_type === 'native')?.balance || '0');
      const availableBalance = xlmBalance - requiredReserve;
      
      setStat(prev => prev + `\n💡 Available for fees: ${availableBalance} XLM`);
      
      if (availableBalance < 0.001) {
        setStat(prev => prev + '\n⚠️  WARNING: Very low available balance for transaction fees!');
      } else {
        setStat(prev => prev + '\n✅ Sufficient balance for transactions');
      }

    } catch (error) {
      setStat(prev => prev + `\n❌ Error checking balance: ${error.message}`);
      console.error('Balance check error:', error);
    }
  };

  const fundAccount = async () => {
    if (!publicKey) {
      setStat('🔒 Please connect your wallet first.');
      return;
    }

    if (process.env.REACT_APP_STELLAR_NETWORK === 'public') {
      setStat('❌ Friendbot funding is only available on testnet.');
      return;
    }

    try {
      setStat('🚀 Requesting XLM from Friendbot...');
      
      const friendbotUrl = `https://horizon-testnet.stellar.org/friendbot?addr=${encodeURIComponent(publicKey)}`;
      setStat(prev => prev + `\n📡 URL: ${friendbotUrl}`);
      
      const friendbotResponse = await fetch(friendbotUrl);
      
      setStat(prev => prev + `\n📊 Response Status: ${friendbotResponse.status} ${friendbotResponse.statusText}`);
      
      if (!friendbotResponse.ok) {
        const body = await friendbotResponse.text();
        setStat(prev => prev + `\n📝 Response Body: ${body}`);
        
        try {
          const jsonBody = JSON.parse(body);
          if (jsonBody.detail && jsonBody.detail.includes('already funded')) {
            setStat(prev => prev + '\n✅ Account already has XLM from Friendbot');
          } else {
            throw new Error(`Friendbot error: ${jsonBody.title || jsonBody.detail || friendbotResponse.status}`);
          }
        } catch (parseError) {
          throw new Error(`Friendbot HTTP ${friendbotResponse.status}: ${body}`);
        }
      } else {
        const result = await friendbotResponse.json();
        setStat(prev => prev + '\n✅ Account funded successfully!');
        setStat(prev => prev + `\n📋 Transaction Hash: ${result.hash}`);
        setStat(prev => prev + '\n⏳ Waiting 5 seconds for confirmation...');
        
        // Wait for the transaction to be confirmed
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Check balance after funding
        setStat(prev => prev + '\n🔍 Checking new balance...');
        await checkBalance();
      }
      
    } catch (error) {
      setStat(prev => prev + `\n❌ Funding failed: ${error.message}`);
      console.error('Funding error:', error);
    }
  };

  const issue = async () => {
    if (!publicKey) {
      setStat('🔒 Please connect your wallet first.');
      return;
    }

    if (!to || !amt) {
      setStat('❌ Please fill in both destination and amount fields.');
      return;
    }

    try {
      setStat('🔍 Pre-transaction balance check...');
      
      // Always check balance before attempting transaction
      await checkBalance();
      
      setStat(prev => prev + '\n⏳ Building payment transaction...');

      // Issue SZUP is just a payment from the issuer account
      const resp = await stellar.payment({
        destination: to,
        asset: SZUP,
        amount: amt,
        sourceAddress: publicKey
      });
      
      setStat(prev => prev + `\n✅ SZUP issued successfully! Hash: ${resp.hash}`);
      console.log('Issue transaction result:', resp);
      
      // Clear the form
      setTo('');
      setAmt('');
      
    } catch (e) {
      console.error('Issue error:', e);
      
      if (e.response?.data?.extras?.result_codes) {
        const resultCodes = e.response.data.extras.result_codes;
        
        setStat(prev => prev + `\n❌ Transaction failed: ${JSON.stringify(resultCodes)}`);
        
        if (resultCodes.operations?.includes('op_underfunded')) {
          setStat(prev => prev + '\n💡 UNDERFUNDED ERROR DETAILS:');
          setStat(prev => prev + '\n   - This usually means insufficient XLM for transaction fees');
          setStat(prev => prev + '\n   - OR insufficient balance to meet minimum reserve requirements');
          setStat(prev => prev + '\n   - Try funding your account again and wait 10 seconds');
          setStat(prev => prev + '\n   - Then check your balance before retrying');
        }
        if (resultCodes.operations?.includes('op_no_trust')) {
          setStat(prev => prev + '\n💡 The destination account needs to add a trustline for SZUP first.');
        }
        if (resultCodes.operations?.includes('op_no_destination')) {
          setStat(prev => prev + '\n💡 The destination account does not exist.');
        }
        
      } else {
        setStat(prev => prev + `\n❌ Error: ${e.message || e}`);
      }
    }
  };

  return (
    <div className="space-y-2 p-4 border rounded shadow-sm">
      <h2 className="text-lg font-semibold">Issue SZUP (Debug Mode)</h2>
      <p className="text-sm text-gray-600">
        {publicKey ? `Connected as issuer: ${publicKey.slice(0, 8)}...${publicKey.slice(-8)}` : 'Not connected'}
      </p>
      
      {/* Debug buttons */}
      <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-sm text-yellow-800 mb-2">
          🐛 Debug Tools:
        </p>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600"
            onClick={checkBalance}
          >
            Check Balance
          </button>
          {process.env.REACT_APP_STELLAR_NETWORK !== 'public' && (
            <button
              className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
              onClick={fundAccount}
            >
              Fund Account with XLM
            </button>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        <input 
          className="w-full px-3 py-2 border rounded"
          placeholder="Destination address (G...)"
          value={to}
          onChange={e => setTo(e.target.value)}
        />
        <input 
          className="w-full px-3 py-2 border rounded"
          placeholder="Amount (e.g., 100.0000000)"
          value={amt}
          onChange={e => setAmt(e.target.value)}
          type="number"
          step="0.0000001"
        />
      </div>
      
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        onClick={issue}
        disabled={!publicKey || !to || !amt}
      >
        Issue SZUP
      </button>
      
      {stat && (
        <div className="mt-2 p-2 bg-gray-100 rounded max-h-96 overflow-y-auto">
          <pre className="text-sm whitespace-pre-wrap">{stat}</pre>
        </div>
      )}
    </div>
  );
}