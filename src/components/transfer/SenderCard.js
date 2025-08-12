import React, { useContext, useState, useEffect } from 'react';
import { WalletContext } from '../../contexts/WalletContext';
import { stellar, SZUP } from '../../stellar';

export default function SenderCard({ onNext }) {
  const { publicKey } = useContext(WalletContext);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const checkBalance = async () => {
    if (!publicKey) return;
    
    setLoading(true);
    setError('');
    
    try {
      const account = await stellar.loadAccount(publicKey);
      
      // Find SZUP balance
      const szupBalance = account.balances.find(
        b => b.asset_code === 'SZUP' && b.asset_issuer === SZUP.issuer
      );

      // Find XLM balance
      const xlmBalance = account.balances.find(
        b => b.asset_type === 'native'
      );

      setBalance({
        szup: szupBalance ? parseFloat(szupBalance.balance) : 0,
        xlm: xlmBalance ? parseFloat(xlmBalance.balance) : 0,
        hasTrustline: !!szupBalance
      });
      
    } catch (error) {
      console.error('Balance check error:', error);
      if (error.response && error.response.status === 404) {
        setError('Account not found. Make sure your wallet is funded.');
      } else {
        setError('Failed to check balance: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Check balance when component mounts or publicKey changes
  useEffect(() => {
    if (publicKey) {
      checkBalance();
    }
  }, [publicKey]);

  const canProceed = () => {
    return publicKey && 
           balance && 
           balance.hasTrustline && 
           balance.szup > 0 && 
           balance.xlm >= 0.001; // Minimum XLM for fees
  };

  if (!publicKey) {
    return (
      <div className="p-4 border rounded">
        <h3 className="font-semibold mb-4">Connect Your Wallet</h3>
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-800">
            🔒 No wallet connected. Please go to the <strong>Connect Wallet</strong> page first, then return here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded">
      <h3 className="font-semibold mb-4">Sender Account</h3>
      
      {/* Account info */}
      <div className="bg-gray-50 p-3 rounded mb-4">
        <div className="text-sm">
          <strong>Connected Wallet:</strong>
          <div className="font-mono text-xs break-all mt-1 text-gray-600">
            {publicKey}
          </div>
        </div>
      </div>

      {/* Balance info */}
      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Account Balance:</span>
          <button
            className="text-xs text-blue-600 hover:underline"
            onClick={checkBalance}
            disabled={loading}
          >
            {loading ? '🔄 Checking...' : '🔄 Refresh'}
          </button>
        </div>

        {loading && (
          <div className="text-sm text-gray-600">
            🔍 Checking balances...
          </div>
        )}

        {error && (
          <div className="p-2 bg-red-50 border border-red-200 rounded">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {balance && !loading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>SZUP:</span>
              <span className="font-mono">
                {balance.szup.toFixed(7)} SZUP
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>XLM (for fees):</span>
              <span className="font-mono">
                {balance.xlm.toFixed(7)} XLM
              </span>
            </div>
            
            {!balance.hasTrustline && (
              <div className="p-2 bg-red-50 border border-red-200 rounded">
                <p className="text-red-600 text-xs">
                  ⚠️ No SZUP trustline found. Add one first to hold SZUP tokens.
                </p>
              </div>
            )}
            
            {balance.hasTrustline && balance.szup === 0 && (
              <div className="p-2 bg-orange-50 border border-orange-200 rounded">
                <p className="text-orange-600 text-xs">
                  ⚠️ Zero SZUP balance. You need SZUP tokens to send.
                </p>
              </div>
            )}
            
            {balance.xlm < 0.001 && (
              <div className="p-2 bg-red-50 border border-red-200 rounded">
                <p className="text-red-600 text-xs">
                  ⚠️ Low XLM balance. You need XLM for transaction fees.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action button */}
      <div className="space-y-2">
        <button
          className={`w-full px-4 py-2 text-white rounded transition-colors disabled:opacity-50 ${
            canProceed() 
              ? 'bg-blue-600 hover:bg-blue-700' 
              : 'bg-gray-400 cursor-not-allowed'
          }`}
          onClick={onNext}
          disabled={!canProceed()}
        >
          {loading ? 'Checking Balance...' : 
           !balance ? 'Check Balance First' :
           !balance.hasTrustline ? 'Add SZUP Trustline First' :
           balance.szup === 0 ? 'Need SZUP Tokens First' :
           balance.xlm < 0.001 ? 'Need XLM for Fees' :
           'Continue to Recipient →'}
        </button>
        
        {!canProceed() && balance && (
          <div className="text-xs text-gray-600">
            💡 Your account needs SZUP tokens and XLM to send transfers
          </div>
        )}
      </div>

      {/* Quick actions */}
      {balance && !balance.hasTrustline && (
        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
          <p className="text-xs text-blue-800 mb-2">Need to add a SZUP trustline?</p>
          <button 
            className="text-xs text-blue-600 hover:underline"
            onClick={() => window.open('/wallet/trustline', '_blank')}
          >
            → Go to Add Trustline page
          </button>
        </div>
      )}
    </div>
  );
}