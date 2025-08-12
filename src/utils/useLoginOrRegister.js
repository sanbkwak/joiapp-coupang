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


export const useLoginOrRegister = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();

  const login = useCallback(async (email, password) => {
    if (loading) return;
    setLoading(true);
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      await handleUserLogin(user.uid);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      alert('Login failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [auth, loading, navigate]);

  return { login, loading };
};
