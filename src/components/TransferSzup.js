import React, { useContext, useState } from 'react';
import { WalletContext } from '../contexts/WalletContext';
import SenderCard from './transfer/SenderCard';
import ReceiverCard from './transfer/ReceiverCard';
import TransferConfirm from './transfer/TransferConfirm';

export default function TransferSzup() {
  const { publicKey } = useContext(WalletContext);
  const [step, setStep] = useState(1);
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');

  const handleReceiverNext = ({ recipient, amount }) => {
    setTo(recipient);
    setAmount(amount);
    setStep(3);
  };

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <h2 className="text-xl font-semibold">Transfer SZUP</h2>

      {step === 1 && <SenderCard onNext={() => setStep(2)} />}

      {step === 2 && (
        <ReceiverCard
          onNext={handleReceiverNext}
        />
      )}

      {step === 3 && (
        <TransferConfirm
          from={publicKey || ''}
          to={to}
          amount={amount}
          onBack={() => setStep(2)}
          onDone={() => {/* optionally navigate or reset */}}
        />
      )}
    </div>
  );
}
