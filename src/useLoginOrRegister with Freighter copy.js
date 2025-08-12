import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    isConnected,
    getPublicKey,
    isAllowed,
    setAllowed,
    getNetwork
} from "@stellar/freighter-api";
import { checkUserExists, createUser, updateUserLogin } from './userModel';
import { auth, provider, signInWithPopup } from './firebaseConfig'; // Import auth and provider

export const useLoginOrRegister = () => {
    const navigate = useNavigate();
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    const handleLoginOrRegister = useCallback(async () => {
        if (isAuthenticating) return; // Prevent multiple popup requests

        setIsAuthenticating(true);

        if (!(await isConnected())) {
            alert("Freighter wallet extension is not installed.");
            setIsAuthenticating(false);
            return;
        }

        let allowed = await isAllowed();
        if (!allowed) {
            allowed = await setAllowed();
        }

        if (allowed) {
            try {
                const publicKey = await getPublicKey();
                if (!publicKey) {
                    alert("Failed to retrieve public key;  Log in to Freighter Wallet");
                    let network = "";
                    let error = "";

                    try {
                        network = await getNetwork();
                        console.log("network : " + network);
                    } catch (e) {
                        error = e;
                        console.log("network error: " + e);
                    }
                    setIsAuthenticating(false);
                    return;
                }
                const result = await signInWithPopup(auth, provider);
              //  const user = result.user;
         //       console.log("in userloginorregister user: ", result.user);
         //       console.log("in userloginorregister auth.currentUser.uid: ", auth.currentUser.uid);
                const { exists, id, data } = await checkUserExists(publicKey);
                if (exists) {
                    await updateUserLogin(publicKey, data.numberOfLogins);
                    alert('Login successful');
                } else {
                    await createUser(publicKey);
                    alert('Registration successful');
                }

                localStorage.setItem('userPublicKey', publicKey);
                navigate('/questions');
            } catch (error) {
                console.error("Authentication error: ", error);
                if (error.code === 'auth/popup-blocked') {
                    alert("Popup blocked. Please allow popups for this site and try again.");
                } else {
                    alert("Authentication failed. Please try again.");
                }
            } finally {
                setIsAuthenticating(false);
            }
        } else {
            alert("Permission not granted.");
            setIsAuthenticating(false);
        }
    }, [navigate, isAuthenticating]);

    return handleLoginOrRegister;
};
