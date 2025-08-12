import React, { createContext, useState, useCallback, useEffect } from "react";
import { isConnected, getAddress, requestAccess } from "@stellar/freighter-api";

export const WalletContext = createContext();

export function WalletProvider({ children }) {
  const [publicKey, setPublicKey] = useState(null);
  const [isConnectedState, setIsConnectedState] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const detect = useCallback(async () => {
    try {
      const res = await isConnected();
      const ok = !!res?.isConnected;
      setIsConnectedState(ok);
      return ok;
    } catch {
      setIsConnectedState(false);
      return false;
    }
  }, []);

  const connect = useCallback(async () => {
    if (!(await detect())) {
      throw new Error("Freighter not detected (extension not reachable).");
    }

    // If already allowed, this returns the address silently
    let res = await getAddress();
    let address = res?.address;

    // If not allowed yet, prompt the connection flow
    if (!address) {
      const access = await requestAccess();
      if (access.error) throw new Error(access.error.message || "User denied access.");
      address = access.address;
    }

    setPublicKey(address);
    setIsConnectedState(true);
    return address;
  }, [detect]);

  const disconnect = useCallback(() => {
    setPublicKey(null);
    setIsConnectedState(false);
  }, []);

  // Simple initialization - just mark as initialized after a short delay
  useEffect(() => {
    console.log('🚀 Starting simple wallet initialization...');
    
    const timer = setTimeout(() => {
      console.log('✨ Marking wallet as initialized');
      setIsInitialized(true);
    }, 1000); // 1 second delay to show the loading state briefly

    return () => clearTimeout(timer);
  }, []);

  // Optional: Try to restore connection after initialization
  useEffect(() => {
    if (!isInitialized) return;

    const tryRestore = async () => {
      try {
        console.log('🔍 Trying to restore connection...');
        const connected = await detect();
        
        if (connected) {
          const res = await getAddress();
          if (res?.address) {
            console.log('✅ Restored connection:', res.address);
            setPublicKey(res.address);
            setIsConnectedState(true);
          }
        }
      } catch (error) {
        console.log('⚠️ Could not restore connection:', error);
        // This is fine - user will need to connect manually
      }
    };

    tryRestore();
  }, [isInitialized, detect]);

  return (
    <WalletContext.Provider value={{ 
      publicKey, 
      isConnected: isConnectedState, 
      connect, 
      disconnect,
      isInitialized 
    }}>
      {children}
    </WalletContext.Provider>
  );
}