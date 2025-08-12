// src/components/SelfIssueSzup.js
import React, { useState, useContext } from 'react';
import { WalletContext } from '../../contexts/WalletContext';
import { wallet, stellar, SZUP } from '../../stellar';
 

export default function SelfIssueSzup() {
  const { publicKey } = useContext(WalletContext);
  const [amt, setAmt] = useState('');
  const [stat, setStat] = useState('');
  const [status, setStatus] = useState('');
  const checkMyTrustline = async () => {
    if (!publicKey) {
      setStat('🔒 Please connect your wallet first.');
      return;
    }

    try {
      setStat('🔍 Checking your SZUP trustline...');
      
      // Use the same wait mechanism
      const szupBalance = await waitForTrustline();

      const currentBalance = parseFloat(szupBalance.balance);
      const limit = parseFloat(szupBalance.limit);
      const spaceLeft = limit - currentBalance;

      setStat(prev => prev + `\n📊 Your SZUP Trustline Status:
   - Current Balance: ${currentBalance} SZUP
   - Trustline Limit: ${limit} SZUP
   - Space Available: ${spaceLeft} SZUP
   
${spaceLeft <= 0 ? 
  '⚠️  Your trustline is FULL! You need to increase the limit first.' : 
  `✅ You can receive up to ${spaceLeft} more SZUP.`}`);

    } catch (error) {
      setStat(`❌ No SZUP trustline found. Add one first!\n${error.message}`);
      console.error('Trustline check error:', error);
    }
  };

  const waitForTrustline = async (maxAttempts = 5) => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        setStat(prev => prev + `\n🔍 Checking trustline (attempt ${attempt}/${maxAttempts})...`);
        
        const account = await stellar.loadAccount(publicKey);
        const szupBalance = account.balances.find(b => 
          b.asset_code === 'SZUP' && 
          b.asset_issuer === SZUP.issuer
        );

        if (szupBalance) {
          setStat(prev => prev + `\n✅ Trustline found!`);
          return szupBalance;
        }
        
        if (attempt < maxAttempts) {
          setStat(prev => prev + `\n⏳ Trustline not yet visible, waiting 3 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      } catch (error) {
        setStat(prev => prev + `\n⚠️ Attempt ${attempt} failed: ${error.message}`);
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    throw new Error('Trustline not found after multiple attempts');
  };

  const issueToSelf = async () => {
    if (!publicKey) {
      setStat('🔒 Please connect your wallet first.');
      return;
    }

    if (!amt) {
      setStat('❌ Please enter an amount to issue.');
      return;
    }

    try {
      setStat('🔍 Checking your trustline before issuing...');
      
      // Wait for trustline to be confirmed on ledger
      const szupBalance = await waitForTrustline();

      const currentBalance = parseFloat(szupBalance.balance);
      const limit = parseFloat(szupBalance.limit);
      const spaceLeft = limit - currentBalance;
      const amountToIssue = parseFloat(amt);

      setStat(prev => prev + `\n📊 Space available: ${spaceLeft} SZUP`);
      setStat(prev => prev + `\n📊 Amount to issue: ${amountToIssue} SZUP`);

      if (amountToIssue > spaceLeft) {
        setStat(prev => prev + `\n❌ Not enough space! You can only issue ${spaceLeft} more SZUP.`);
        setStat(prev => prev + '\n💡 Increase your trustline limit first, or issue a smaller amount.');
        return;
      }

      setStat(prev => prev + '\n⏳ Issuing SZUP to yourself...');

      // Issue SZUP to yourself (same address as source and destination)
      const resp = await stellar.payment({
        destination: publicKey,  // Send to yourself!
        asset: SZUP,
        amount: amt,
        sourceAddress: publicKey
      });
      
      setStat(prev => prev + `\n✅ Successfully issued ${amt} SZUP to yourself!`);
      setStat(prev => prev + `\n📋 Transaction Hash: ${resp.hash}`);
      setStat(prev => prev + `\n🎉 Your new SZUP balance: ${currentBalance + amountToIssue} SZUP`);
      
      console.log('Self-issue transaction result:', resp);
      
      // Clear the form
      setAmt('');
      
    } catch (e) {
      console.error('Self-issue error:', e);
      
      if (e.response?.data?.extras?.result_codes) {
        const resultCodes = e.response.data.extras.result_codes;
        
        setStat(prev => prev + `\n❌ Transaction failed: ${JSON.stringify(resultCodes)}`);
        
        if (resultCodes.operations?.includes('op_underfunded')) {
          setStat(prev => prev + '\n💡 Your account needs more XLM for transaction fees.');
        }
        if (resultCodes.operations?.includes('op_no_trust')) {
          setStat(prev => prev + '\n💡 You need to add a SZUP trustline first.');
        }
        if (resultCodes.operations?.includes('op_line_full')) {
          setStat(prev => prev + '\n💡 Your SZUP trustline is full. Increase the limit first.');
        }
        
      } else if (e.message && e.message.includes('full')) {
        setStat(prev => prev + `\n❌ ${e.message}`);
        setStat(prev => prev + '\n💡 Use the "Check My Trustline" button and increase your limit if needed.');
      } else {
        setStat(prev => prev + `\n❌ Error: ${e.message || e}`);
      }
    }
  };

  const addTrustline = async () => {
    if (!publicKey) {
      setStat('🔒 Please connect your wallet first.');
      return;
    }

    try {
      setStat('⏳ Adding SZUP trustline...');
      
      const result = await stellar.changeTrust({
        asset: SZUP,
        limit: '10000000', // 10M SZUP limit
        sourceAddress: publicKey
      });

      setStat(prev => prev + `\n✅ SZUP trustline added successfully!`);
      setStat(prev => prev + `\n📋 Transaction Hash: ${result.hash}`);
      setStat(prev => prev + `\n💰 You can now receive up to 10,000,000 SZUP`);
      setStat(prev => prev + `\n⏳ Waiting for ledger confirmation...`);
      
      // Wait for the trustline to be confirmed
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Verify the trustline was added
      try {
        await waitForTrustline();
        setStat(prev => prev + `\n🎉 Trustline confirmed and ready to use!`);
      } catch (error) {
        setStat(prev => prev + `\n⚠️ Trustline added but not yet confirmed. Wait a moment before issuing.`);
      }
      
    } catch (error) {
      setStat(prev => prev + `\n❌ Error adding trustline: ${error.message}`);
    }
  };
// Comprehensive debugging tools for trustline issues

const debugTrustlineIssues = async () => {
  if (!publicKey) {
    setStat('🔒 Please connect your wallet first.');
    return;
  }

  setStat('🔍 Starting comprehensive trustline diagnostics...\n');

  try {
    // 1. Check which network we're on
    const network = process.env.REACT_APP_STELLAR_NETWORK;
    setStat(prev => prev + `📡 Network: ${network}\n`);
    
    // 2. Verify account exists and is funded
    setStat(prev => prev + '🏦 Checking account status...\n');
    const account = await stellar.loadAccount(publicKey);
    
    setStat(prev => prev + `   ✅ Account exists: ${account.id}\n`);
    setStat(prev => prev + `   📊 Sequence: ${account.sequenceNumber()}\n`);
    setStat(prev => prev + `   📈 Subentries: ${account.subentry_count}\n`);
    
    // 3. Check XLM balance and reserves
    const xlmBalance = account.balances.find(b => b.asset_type === 'native');
    const baseReserve = 0.5;
    const requiredReserve = (2 + account.subentry_count) * baseReserve;
    const availableXLM = parseFloat(xlmBalance.balance) - requiredReserve;
    
    setStat(prev => prev + `   💰 XLM Balance: ${xlmBalance.balance}\n`);
    setStat(prev => prev + `   🔒 Required Reserve: ${requiredReserve} XLM\n`);
    setStat(prev => prev + `   💡 Available for fees: ${availableXLM} XLM\n`);
    
    if (availableXLM < 0.001) {
      setStat(prev => prev + '   ⚠️  CRITICAL: Insufficient XLM for transaction fees!\n');
      setStat(prev => prev + '   💡 Fund your account with more XLM first.\n\n');
      return;
    }
    
    // 4. Show ALL current trustlines
    setStat(prev => prev + '\n📋 Current Trustlines:\n');
    const trustlines = account.balances.filter(b => b.asset_type !== 'native');
    
    if (trustlines.length === 0) {
      setStat(prev => prev + '   ❌ No trustlines found at all\n');
    } else {
      trustlines.forEach((balance, index) => {
        setStat(prev => prev + `   ${index + 1}. ${balance.asset_code} (${balance.asset_issuer})\n`);
        setStat(prev => prev + `      Balance: ${balance.balance}, Limit: ${balance.limit}\n`);
      });
    }
    
    // 5. Check specifically for SZUP with exact issuer match
    setStat(prev => prev + '\n🎯 SZUP Trustline Check:\n');
    setStat(prev => prev + `   Looking for: SZUP issued by ${SZUP.issuer}\n`);
    
    const szupTrustline = trustlines.find(b => 
      b.asset_code === 'SZUP' && 
      b.asset_issuer === SZUP.issuer
    );
    
    if (szupTrustline) {
      setStat(prev => prev + '   ✅ SZUP trustline found!\n');
      setStat(prev => prev + `   📊 Balance: ${szupTrustline.balance} SZUP\n`);
      setStat(prev => prev + `   📊 Limit: ${szupTrustline.limit} SZUP\n`);
    } else {
      setStat(prev => prev + '   ❌ SZUP trustline NOT found\n');
      
      // Check if there's a similar asset
      const similarAssets = trustlines.filter(b => b.asset_code === 'SZUP');
      if (similarAssets.length > 0) {
        setStat(prev => prev + '   ⚠️  Found SZUP from different issuers:\n');
        similarAssets.forEach(asset => {
          setStat(prev => prev + `      - SZUP from: ${asset.asset_issuer}\n`);
        });
        setStat(prev => prev + '   💡 Make sure you\'re using the correct issuer address!\n');
      }
    }
    
    // 6. Verify SZUP asset configuration
    setStat(prev => prev + '\n🔧 SZUP Asset Configuration:\n');
    setStat(prev => prev + `   Asset Code: "${SZUP.code}"\n`);
    setStat(prev => prev + `   Issuer Address: "${SZUP.issuer}"\n`);
    setStat(prev => prev + `   Your Address: "${publicKey}"\n`);
    
    if (SZUP.issuer === publicKey) {
      setStat(prev => prev + '   ✅ You are the issuer of this asset\n');
    } else {
      setStat(prev => prev + '   📝 You are NOT the issuer of this asset\n');
    }
    
    // 7. Check recent transactions
    setStat(prev => prev + '\n📜 Recent Account Transactions:\n');
    try {
      const payments = await stellar.server
        .payments()
        .forAccount(publicKey)
        .order('desc')
        .limit(5)
        .call();
      
      if (payments.records.length === 0) {
        setStat(prev => prev + '   📝 No recent transactions found\n');
      } else {
        payments.records.forEach((payment, index) => {
          setStat(prev => prev + `   ${index + 1}. ${payment.type} - ${payment.created_at}\n`);
          if (payment.asset_code) {
            setStat(prev => prev + `      Asset: ${payment.asset_code}, Amount: ${payment.amount}\n`);
          }
        });
      }
    } catch (error) {
      setStat(prev => prev + `   ❌ Error fetching transactions: ${error.message}\n`);
    }
    
  } catch (error) {
    setStat(prev => prev + `\n❌ Diagnostic error: ${error.message}\n`);
    
    if (error.message.includes('account not found')) {
      setStat(prev => prev + '💡 Your account doesn\'t exist or isn\'t funded.\n');
      setStat(prev => prev + '💡 Use the "Fund Account" button first.\n');
    }
  }
};


// Function to manually verify a transaction hash
const checkTransactionHash = async (txHash) => {
  if (!txHash) {
    setStat('❌ Please provide a transaction hash to check.\n');
    return;
  }

  try {
    setStat(`🔍 Checking transaction: ${txHash}\n`);
    
    const transaction = await stellar.server.transactions().transaction(txHash).call();
    
    setStat(prev => prev + `✅ Transaction found!\n`);
    setStat(prev => prev + `   📅 Date: ${transaction.created_at}\n`);
    setStat(prev => prev + `   📊 Success: ${transaction.successful}\n`);
    setStat(prev => prev + `   🔗 Ledger: ${transaction.ledger}\n`);
    
    // Get operations for this transaction
    const operations = await stellar.server.operations().forTransaction(txHash).call();
    
    setStat(prev => prev + `\n🔧 Operations in this transaction:\n`);
    operations.records.forEach((op, index) => {
      setStat(prev => prev + `   ${index + 1}. ${op.type}\n`);
      
      if (op.type === 'change_trust') {
        setStat(prev => prev + `      Asset: ${op.asset_code || op.asset_type}\n`);
        setStat(prev => prev + `      Issuer: ${op.asset_issuer || 'native'}\n`);
        setStat(prev => prev + `      Limit: ${op.limit}\n`);
        setStat(prev => prev + `      Trustor: ${op.trustor}\n`);
      }
    });
    
  } catch (error) {
    setStat(prev => prev + `❌ Transaction not found or error: ${error.message}\n`);
    setStat(prev => prev + `💡 Make sure the transaction hash is correct and the transaction was successful.\n`);
  }
};

 

 

  const addTrustlineForConfiguredIssuer = async () => {
    if (!publicKey) {
      setStatus('🔒 Please connect your wallet first.');
      return;
    }

    try {
      const szupAsset = SZUP;
      
      setStatus('⏳ Adding trustline for configured SZUP issuer...\n');
      setStatus(prev => prev + `Asset: ${szupAsset.code}\n`);
      setStatus(prev => prev + `Issuer: ${szupAsset.issuer}\n`);

      const result = await stellar.changeTrust({
        asset: szupAsset,
        limit: '10000000',
        sourceAddress: publicKey
      });

      setStatus(prev => prev + '\n✅ Trustline added successfully!\n');
      setStatus(prev => prev + `📋 Transaction: ${result.hash}\n`);

      // Wait and re-check
      setTimeout(() => debugEnvironment(), 8000);

    } catch (error) {
      setStatus(prev => prev + `❌ Error: ${error.message}\n`);
      
      if (error.response?.data?.extras?.result_codes?.operations?.includes('op_already_exists')) {
        setStatus(prev => prev + '💡 Trustline already exists!\n');
        setTimeout(() => debugEnvironment(), 2000);
      }
    }
  };

// Enhanced trustline addition with better error handling
const addTrustlineWithDiagnostics = async () => {
  if (!publicKey) {
    setStat('🔒 Please connect your wallet first.');
    return;
  }

  try {
    // Pre-flight checks
    setStat('🔍 Pre-flight checks...\n');
    await debugTrustlineIssues();
    
    setStat(prev => prev + '\n⏳ Attempting to add SZUP trustline...\n');
    setStat(prev => prev + `   Asset: ${SZUP.code}\n`);
    setStat(prev => prev + `   Issuer: ${SZUP.issuer}\n`);
    setStat(prev => prev + `   Limit: 10,000,000\n`);
    
    const result = await stellar.changeTrust({
      asset: SZUP,
      limit: '10000000',
      sourceAddress: publicKey
    });

    setStat(prev => prev + `\n✅ Trustline transaction submitted!\n`);
    setStat(prev => prev + `📋 Transaction Hash: ${result.hash}\n`);
    setStat(prev => prev + `🌐 View on Stellar Expert: https://stellar.expert/explorer/${process.env.REACT_APP_STELLAR_NETWORK === 'public' ? 'public' : 'testnet'}/tx/${result.hash}\n`);
    
    setStat(prev => prev + `\n⏳ Waiting for confirmation...\n`);
    
    // Wait and then re-check
    await new Promise(resolve => setTimeout(resolve, 10000));
    await debugTrustlineIssues();
    
  } catch (error) {
    setStat(prev => prev + `\n❌ Error adding trustline: ${error.message}\n`);
    
    if (error.response?.data?.extras?.result_codes) {
      const codes = error.response.data.extras.result_codes;
      setStat(prev => prev + `📋 Error codes: ${JSON.stringify(codes)}\n`);
      
      if (codes.operations?.includes('op_low_reserve')) {
        setStat(prev => prev + '💡 Not enough XLM to meet minimum balance requirements.\n');
      }
      if (codes.operations?.includes('op_already_exists')) {
        setStat(prev => prev + '💡 Trustline already exists (this should be good!).\n');
      }
    }
  }
};

 

  const debugEnvironment = async () => {
    setStatus('🔍 Debugging SZUP Environment Configuration...\n\n');

    // 1. Check environment variables
    setStatus(prev => prev + '📋 Environment Variables:\n');
    setStatus(prev => prev + `   REACT_APP_ISSUER_PUBLIC_KEY: ${process.env.REACT_APP_ISSUER_PUBLIC_KEY || 'NOT SET'}\n`);
    setStatus(prev => prev + `   REACT_APP_STELLAR_NETWORK: ${process.env.REACT_APP_STELLAR_NETWORK || 'NOT SET'}\n\n`);

    // 2. Try to create SZUP asset and check what happens
    try {
      setStatus(prev => prev + '🔧 Testing SZUP Asset Creation:\n');
      
      // This should call your getSZUP() function
      const szupAsset = SZUP;
      
      setStatus(prev => prev + `   ✅ SZUP Asset Created Successfully!\n`);
      setStatus(prev => prev + `   📊 Asset Code: "${szupAsset.code}"\n`);
      setStatus(prev => prev + `   📊 Issuer: "${szupAsset.issuer}"\n`);
      setStatus(prev => prev + `   📊 Is Native: ${szupAsset.isNative()}\n\n`);

      // 3. Check if you have a wallet connected
      if (!publicKey) {
        setStatus(prev => prev + '🔒 No wallet connected for trustline check.\n');
        return;
      }

      // 4. Check your account and trustlines
      setStatus(prev => prev + `🏦 Checking Account: ${publicKey}\n`);
      const account = await stellar.loadAccount(publicKey);

      // 5. Find all SZUP trustlines
      const allSzupTrustlines = account.balances.filter(b => b.asset_code === 'SZUP');
      
      setStatus(prev => prev + `\n📋 Your SZUP Trustlines (${allSzupTrustlines.length} found):\n`);
      
      if (allSzupTrustlines.length === 0) {
        setStatus(prev => prev + '   ❌ No SZUP trustlines found\n');
      } else {
        allSzupTrustlines.forEach((trustline, index) => {
          const isConfiguredIssuer = trustline.asset_issuer === szupAsset.issuer;
          setStatus(prev => prev + `   ${index + 1}. SZUP - Balance: ${trustline.balance}, Limit: ${trustline.limit}\n`);
          setStatus(prev => prev + `      Issuer: ${trustline.asset_issuer}\n`);
          setStatus(prev => prev + `      ${isConfiguredIssuer ? '✅ MATCHES your configured SZUP issuer' : '❌ Different issuer'}\n\n`);
        });
      }

      // 6. Check if your configured SZUP matches any trustline
      const matchingTrustline = allSzupTrustlines.find(t => t.asset_issuer === szupAsset.issuer);
      
      if (matchingTrustline) {
        setStatus(prev => prev + '🎉 SUCCESS: Found matching trustline for your configured SZUP!\n');
        setStatus(prev => prev + `   Balance: ${matchingTrustline.balance} SZUP\n`);
        setStatus(prev => prev + `   Available space: ${parseFloat(matchingTrustline.limit) - parseFloat(matchingTrustline.balance)} SZUP\n`);
        setStatus(prev => prev + '\n✅ Your SZUP configuration is correct!\n');
      } else {
        setStatus(prev => prev + '❌ PROBLEM: No trustline found for your configured SZUP issuer\n');
        setStatus(prev => prev + '\n💡 Solutions:\n');
        setStatus(prev => prev + '   1. Update REACT_APP_ISSUER_PUBLIC_KEY to match an existing trustline\n');
        setStatus(prev => prev + '   2. OR add a new trustline for the configured issuer\n');
        
        if (allSzupTrustlines.length > 0) {
          setStatus(prev => prev + '\n🔧 To use existing trustline, set REACT_APP_ISSUER_PUBLIC_KEY to:\n');
          setStatus(prev => prev + `   ${allSzupTrustlines[0].asset_issuer}\n`);
        }
      }

    } catch (error) {
      setStatus(prev => prev + `❌ Error creating SZUP asset: ${error.message}\n`);
      
      if (error.message.includes('REACT_APP_ISSUER_PUBLIC_KEY')) {
        setStatus(prev => prev + '\n💡 Solution: Set your environment variable in .env file:\n');
        setStatus(prev => prev + '   REACT_APP_ISSUER_PUBLIC_KEY=GDZERDXVPQ3BSZKMUWERCPQRLPLFDWQOBZQ6TAYFUWBZSSF4EDKRDL3L\n');
      }
    }
  };
    
 
  const suggestedEnvFile = () => {
    setStatus('📝 Suggested .env file content:\n\n');
    setStatus(prev => prev + '# Add this to your .env file in the project root\n');
    setStatus(prev => prev + 'REACT_APP_STELLAR_NETWORK=testnet\n');
    setStatus(prev => prev + 'REACT_APP_ISSUER_PUBLIC_KEY=GDZERDXVPQ3BSZKMUWERCPQRLPLFDWQOBZQ6TAYFUWBZSSF4EDKRDL3L\n\n');
    setStatus(prev => prev + '💡 After adding/updating .env file:\n');
    setStatus(prev => prev + '   1. Save the file\n');
    setStatus(prev => prev + '   2. Restart your development server (npm start)\n');
    setStatus(prev => prev + '   3. Test again\n');
  };

 



  return (
    <div className="space-y-4 p-4 border rounded shadow-sm">
      <h2 className="text-lg font-semibold">Issue SZUP to Yourself</h2>
      <p className="text-sm text-gray-600">
        {publicKey ? `Your Address: ${publicKey.slice(0, 8)}...${publicKey.slice(-8)}` : 'Not connected'}
      </p>
      
      {/* Info box */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded">
        <h4 className="font-medium text-blue-800 mb-1">How Self-Issuance Works:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• As the issuer, you can create new SZUP tokens</li>
          <li>• You can send these tokens to yourself (self-issue)</li>
          <li>• You need a SZUP trustline first (like any receiver)</li>
          <li>• Make sure your trustline limit has enough space</li>
        </ul>
      </div>

      {/* Check trustline button */}
      <div>
        <button
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          onClick={checkMyTrustline}
          disabled={!publicKey}
        >
          Check My SZUP Trustline
        </button>
      </div>

      {/* Add trustline if needed */}
      <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-sm text-yellow-800 mb-2">
          💡 Don't have a SZUP trustline yet?
        </p>
        <button
          className="px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600"
          onClick={addTrustline}
          disabled={!publicKey}
        >
          Add SZUP Trustline (10M limit)
        </button>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={debugEnvironment}
        >
          Debug SZUP Config
        </button>
      </div>
  
      {/* Issue form */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Amount to Issue to Yourself:</label>
        <div className="flex gap-2">
          <input 
            className="flex-1 px-3 py-2 border rounded"
            placeholder="Amount (e.g., 1000)"
            value={amt}
            onChange={e => setAmt(e.target.value)}
            type="number"
            step="0.0000001"
          />
          <span className="px-3 py-2 bg-gray-100 border rounded text-gray-600">SZUP</span>
        </div>
      </div>
      
      <button
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        onClick={issueToSelf}
        disabled={!publicKey || !amt}
      >
        Issue {amt || '___'} SZUP to Myself
      </button>
      
      {stat && (
        <div className="mt-2 p-3 bg-gray-100 rounded max-h-64 overflow-y-auto">
          <pre className="text-sm whitespace-pre-wrap">{stat}</pre>
        </div>
      )}
    </div>
  );
}
