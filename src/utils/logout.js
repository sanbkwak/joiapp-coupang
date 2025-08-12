import { useNavigate } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';

export const useLogout = () => {
  const navigate = useNavigate();
  const auth = getAuth(); // Initialize Firebase Auth

  const logout = () => {
    // Sign out from Firebase Auth to clear user session
    signOut(auth)
      .then(() => {
        console.log('User signed out successfully');
        // Optionally clear any other user-related cache here
        localStorage.removeItem('userId'); // Example of removing userId from local storage, if stored manually

        // Navigate to landing page or login page after logout
        navigate('/');
      })
      .catch((error) => {
        console.error('Error signing out: ', error);
      });
  };

  return logout;
};
