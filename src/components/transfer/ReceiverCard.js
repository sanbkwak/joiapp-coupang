import React, { useState } from 'react';

export default function ReceiverCard({ onNext }) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const isValidStellarAddress = (address) => {
    try {
      // Use Stellar SDK if available for proper validation
      if (window?.StellarSdk?.StrKey?.isValidEd25519PublicKey) {
        return window.StellarSdk.StrKey.isValidEd25519PublicKey(address);
      }
      // Fallback validation
      return typeof address === 'string' && 
             address.startsWith('G') && 
             address.length === 56 &&
             /^G[A-Z2-7]{55}$/.test(address);
    } catch (error) {
      console.warn('Address validation error:', error);
      return false;
    }
  };

  const handleRecipientChange = (e) => {
    const value = e.target.value.trim();
    setRecipient(value);
    setError('');
    
    // Real-time validation feedback
    if (value && !isValidStellarAddress(value)) {
      setError('Invalid Stellar address format');
    }
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    setAmount(value);
    setError('');
    
    // Real-time amount validation
    if (value) {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue <= 0) {
        setError('Amount must be a positive number');
      } else if (numValue > 1000000000) {
        setError('Amount is too large');
      }
    }
  };

  const validateAndProceed = async () => {
    setError('');
    setIsValidating(true);
    
    try {
      // Validate recipient address
      if (!recipient) {
        setError('Please enter a recipient address');
        return;
      }
      
      if (!isValidStellarAddress(recipient)) {
        setError('Please enter a valid Stellar public key (starts with G, 56 characters)');
        return;
      }
      
      // Validate amount
      if (!amount) {
        setError('Please enter an amount');
        return;
      }
      
      const numAmount = parseFloat(amount);
      if (!Number.isFinite(numAmount) || numAmount <= 0) {
        setError('Please enter a valid positive amount');
        return;
      }
      
      if (numAmount > 1000000000) {
        setError('Amount exceeds maximum limit');
        return;
      }
      
      // Format amount to 7 decimal places (Stellar standard)
      const formattedAmount = numAmount.toFixed(7);
      
      // Proceed to next step
      onNext({ 
        recipient: recipient, 
        amount: formattedAmount 
      });
      
    } catch (error) {
      setError('Validation failed: ' + error.message);
    } finally {
      setIsValidating(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      validateAndProceed();
    }
  };

  // Quick recipient suggestions for testing
  const quickFillSelf = () => {
    // This would ideally come from context, but for demo purposes:
    setRecipient('GDGBJ6GW3IIQPIXZSTFZ7XSUHT35SBQDUTAYYJA5GX7GABYPXC6LTGPG');
  };

  return (
    <div className="p-4 border rounded">
      <h3 className="font-semibold mb-4">Transfer Details</h3>
      
      <div className="space-y-4">
        {/* Recipient Address */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Recipient Address <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            <input
              className={`w-full border rounded px-3 py-2 font-mono text-sm ${
                error && recipient ? 'border-red-500' : 'border-gray-300'
              }`}
              value={recipient}
              onChange={handleRecipientChange}
              onKeyPress={handleKeyPress}
              placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
              maxLength={56}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Must start with 'G' and be 56 characters</span>
              <span>{recipient.length}/56</span>
            </div>
            {/* Quick test button */}
            <button
              type="button"
              className="text-xs text-blue-600 hover:underline"
              onClick={quickFillSelf}
            >
              Use sample address for testing
            </button>
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Amount (SZUP) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              className={`w-full border rounded px-3 py-2 pr-16 ${
                error && amount ? 'border-red-500' : 'border-gray-300'
              }`}
              type="number"
              step="0.0000001"
              min="0.0000001"
              max="1000000000"
              value={amount}
              onChange={handleAmountChange}
              onKeyPress={handleKeyPress}
              placeholder="0.0000000"
            />
            <div className="absolute right-3 top-2 text-gray-500 text-sm">
              SZUP
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Enter amount with up to 7 decimal places
          </p>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 mt-4">
        <button
          className={`px-4 py-2 text-white rounded disabled:opacity-50 transition-colors ${
            isValidating ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
          }`}
          onClick={validateAndProceed}
          disabled={isValidating || !recipient || !amount}
        >
          {isValidating ? '🔄 Validating...' : 'Continue →'}
        </button>
      </div>

      {/* Info box */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <h4 className="font-medium text-blue-800 text-sm mb-1">💡 Before Sending:</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Make sure the recipient has a SZUP trustline</li>
          <li>• Check that their trustline has enough capacity</li>
          <li>• Verify the address is correct (transactions are irreversible)</li>
          <li>• You need XLM for transaction fees (~0.00001 XLM)</li>
        </ul>
      </div>
    </div>
  );
}