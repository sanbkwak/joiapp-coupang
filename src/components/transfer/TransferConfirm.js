import React, { useState } from 'react';
import { stellar, SZUP } from '../../stellar';

export default function TransferConfirm({ from, to, amount, onBack, onDone }) {
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    setStatus('');
    setSending(true);
    
    try {
      setStatus('🔍 Checking sender balance...');
      
      // Check sender SZUP balance first
      const senderAccount = await stellar.loadAccount(from);
      const szupBalance = senderAccount.balances.find(
        b => b.asset_code === 'SZUP' && b.asset_issuer === SZUP.issuer
      );

      const currentBalance = szupBalance ? parseFloat(szupBalance.balance) : 0;
      const amountToSend = parseFloat(amount);

      if (currentBalance < amountToSend) {
        setStatus(`❌ Insufficient balance! You have ${currentBalance} SZUP but need ${amountToSend} SZUP.`);
        setSending(false);
        return;
      }

      setStatus(prev => prev + `\n✅ Sender has ${currentBalance} SZUP (sufficient)`);
      setStatus(prev => prev + '\n🔍 Checking recipient trustline...');

      // Check recipient trustline
      try {
        const recipientAccount = await stellar.loadAccount(to);
        const recipientSzupBalance = recipientAccount.balances.find(
          b => b.asset_code === 'SZUP' && b.asset_issuer === SZUP.issuer
        );

        if (!recipientSzupBalance) {
          setStatus(prev => prev + '\n❌ Recipient has no SZUP trustline. They need to add one first.');
          setSending(false);
          return;
        }

        const recipientBalance = parseFloat(recipientSzupBalance.balance);
        const recipientLimit = parseFloat(recipientSzupBalance.limit);
        const availableSpace = recipientLimit - recipientBalance;

        setStatus(prev => prev + `\n📊 Recipient trustline:`);
        setStatus(prev => prev + `\n   - Current: ${recipientBalance} SZUP`);
        setStatus(prev => prev + `\n   - Limit: ${recipientLimit} SZUP`);
        setStatus(prev => prev + `\n   - Available space: ${availableSpace} SZUP`);

        if (amountToSend > availableSpace) {
          setStatus(prev => prev + `\n❌ Not enough space in recipient's trustline!`);
          setStatus(prev => prev + `\n💡 Recipient needs ${amountToSend - availableSpace} more SZUP capacity.`);
          setSending(false);
          return;
        }

        setStatus(prev => prev + '\n✅ Recipient can receive the tokens');
        
      } catch (error) {
        if (error.response && error.response.status === 404) {
          setStatus(prev => prev + '\n❌ Recipient account does not exist.');
          setSending(false);
          return;
        }
        throw error;
      }

      setStatus(prev => prev + '\n⏳ Building and submitting transaction...');
      
      const result = await stellar.payment({
        destination: to,
        asset: SZUP,
        amount: amount,
        sourceAddress: from,
      });

      setStatus(prev => prev + `\n🎉 Transfer successful!`);
      setStatus(prev => prev + `\n📋 Transaction Hash: ${result.hash}`);
      setStatus(prev => prev + `\n💰 Sent ${amount} SZUP to recipient`);
      
      console.log('Transfer result:', result);
      onDone?.(result);
      
    } catch (e) {
      console.error('Transfer error:', e);
      
      if (e.response?.data?.extras?.result_codes) {
        const resultCodes = e.response.data.extras.result_codes;
        setStatus(prev => prev + `\n❌ Transaction failed: ${JSON.stringify(resultCodes)}`);
        
        // Provide specific error explanations
        if (resultCodes.operations?.includes('op_underfunded')) {
          setStatus(prev => prev + '\n💡 Sender account needs more XLM for transaction fees.');
        }
        if (resultCodes.operations?.includes('op_no_trust')) {
          setStatus(prev => prev + '\n💡 Recipient needs to add a SZUP trustline first.');
        }
        if (resultCodes.operations?.includes('op_line_full')) {
          setStatus(prev => prev + '\n💡 Recipient\'s SZUP trustline is full.');
        }
        if (resultCodes.operations?.includes('op_underfunded')) {
          setStatus(prev => prev + '\n💡 Insufficient SZUP balance or XLM for fees.');
        }
        
      } else {
        setStatus(prev => prev + `\n❌ Error: ${e.message || 'Transfer failed'}`);
      }
      
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-4 border rounded">
      <h3 className="font-semibold mb-4">Confirm Transfer</h3>
      
      <div className="bg-gray-50 p-3 rounded mb-4">
        <div className="space-y-2 text-sm">
          <div>
            <strong>From:</strong> 
            <div className="font-mono text-xs break-all mt-1">{from}</div>
          </div>
          <div>
            <strong>To:</strong> 
            <div className="font-mono text-xs break-all mt-1">{to}</div>
          </div>
          <div>
            <strong>Asset:</strong> SZUP
          </div>
          <div>
            <strong>Amount:</strong> {amount} SZUP
          </div>
        </div>
      </div>
      
      <div className="flex gap-2 mb-4">
        <button 
          className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50" 
          onClick={onBack} 
          disabled={sending}
        >
          ← Back
        </button>
        <button
          className={`px-4 py-2 text-white rounded disabled:opacity-50 ${
            sending ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
          }`}
          onClick={handleSend}
          disabled={sending}
        >
          {sending ? '🔄 Sending...' : `Send ${amount} SZUP`}
        </button>
      </div>
      
      {status && (
        <div className="bg-gray-100 p-3 rounded max-h-64 overflow-y-auto">
          <pre className="text-sm whitespace-pre-wrap">{status}</pre>
        </div>
      )}
    </div>
  );
}