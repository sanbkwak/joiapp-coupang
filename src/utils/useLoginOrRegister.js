import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    isConnected,
    getPublicKey,
    isAllowed,
    setAllowed,
    getNetwork
} from "@stellar/freighter-api";
import { checkUserExistsFirestore,   handleUserLogin } from './userModel';
 
import { getAuth,  signInWithEmailAndPassword} from 'firebase/auth';
 

const API_URL = "https://api.joiapp.org";

export const useLoginOrRegister = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const login = useCallback(async (email, password) => {
    if (loading) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('jwt_token', data.token);
        localStorage.setItem('user_id', data.user_id);
        navigate('/dashboard');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Login failed');
      }
    } catch (err) {
      console.error(err);
      alert('Login failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [loading, navigate]);

  return { login, loading };
};