// src/contexts/AuthContext.js
import React, { createContext, useEffect, useState, useContext } from 'react';
import { auth } from '../firebaseConfig';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, getIdTokenResult } from 'firebase/auth';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [claims, setClaims] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => onAuthStateChanged(auth, async (u) => {
    setUser(u || null);
    if (u) {
      const res = await getIdTokenResult(u, true);
      setClaims(res.claims || null);
    } else {
      setClaims(null);
    }
    setLoading(false);
  }), []);

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, claims, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
