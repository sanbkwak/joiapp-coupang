import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { WalletContext } from '../contexts/WalletContext';

export default function ConnectWallet() {
  const { publicKey, connect, isConnected, isInitialized } = useContext(WalletContext);
  const [status, setStatus] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    setStatus('🔄 Connecting to Freighter wallet...');
    
    try {
      await connect();
      setStatus('✅ Connected successfully!');
    
    } catch (err) {
      console.error('Connection error:', err);
      
      let errorMessage = 'Connection failed';
      if (err.message.includes('User declined access') || err.message.includes('User denied access')) {
        errorMessage = '❌ Connection denied by user';
      } else if (err.message.includes('not found') || err.message.includes('not detected')) {
        errorMessage = '❌ Freighter wallet not found. Please install the Freighter extension from freighter.app';
      } else if (err.message.includes('not available')) {
        errorMessage = '❌ Freighter API not available. Please update your extension or try refreshing the page.';
      } else {
        errorMessage = `❌ Error: ${err.message}`;
      }
      
      setStatus(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  // Debug function - you can remove this after testing
  const showDebugInfo = () => {
    console.log('=== FREIGHTER DEBUG INFO ===');
    console.log('window.freighter exists:', !!window.freighter);
    console.log('window.freighter type:', typeof window.freighter);
    console.log('window.freighter methods:', window.freighter ? Object.keys(window.freighter) : 'none');
    console.log('StellarSdk exists:', !!window.StellarSdk);
    console.log('All window keys containing "freighter":', 
      Object.keys(window).filter(k => k.toLowerCase().includes('freighter'))
    );
    console.log('All window keys containing "stellar":', 
      Object.keys(window).filter(k => k.toLowerCase().includes('stellar'))
    );
    console.log('Current publicKey:', publicKey);
    console.log('Current isConnected:', isConnected);
    console.log('Is initialized:', isInitialized);
  };

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className="space-y-2 p-4 border rounded shadow-sm">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Stellar Wallet Connection</h2>
        </div>
        <p className="text-gray-600">🔄 Checking wallet connection...</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-4 border rounded shadow-sm">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Stellar Wallet Connection</h2>
        <button 
          onClick={showDebugInfo}
          className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
        >
          Debug
        </button>
      </div>
      
      {isConnected && publicKey ? (
        <>
          <p className="text-green-700">
            ✅ Connected as: <code className="bg-gray-100 px-1 rounded text-xs">{`${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`}</code>
          </p>
          <p className="text-xs text-gray-500 break-all">Full address: {publicKey}</p>
          
          <div className="flex flex-wrap gap-2 mt-3">
            <Link to="/wallet/trustline">
              <button className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors">
                Add Trustline
              </button>
            </Link>
            <Link to="/wallet/transfer">
              <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors">
                Transfer SZUP
              </button>
            </Link>
            <Link to="/wallet/issue">
              <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                Issue SZUP
              </button>
            </Link>
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <p className="text-gray-600">
            Connect your Freighter wallet to interact with SZUP tokens on Stellar.
          </p>
          
          <button
            className={`px-4 py-2 text-white rounded transition-colors ${
              isConnecting 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            onClick={handleConnect}
            disabled={isConnecting}
          >
            {isConnecting ? 'Connecting...' : 'Connect Freighter Wallet'}
          </button>
          
          <p className="text-xs text-gray-500">
            Don't have Freighter? <a href="https://www.freighter.app/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Install it here</a>
          </p>
        </div>
      )}
      
      {status && (
        <p className="mt-2 text-sm text-gray-700 p-2 bg-gray-50 rounded">
          {status}
        </p>
      )}
    </div>
  );
}