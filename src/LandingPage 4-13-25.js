import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from './firebaseConfig'; // Import your Firebase config
import { getDocs, collection } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useLoginOrRegister } from './useLoginOrRegister';
import './css/LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const handleLoginOrRegister = useLoginOrRegister();

  useEffect(() => {
    const fetchFirestoreData = async () => {
      try {
        const myCollection = collection(db, "users");
        const snapshot = await getDocs(myCollection);
        snapshot.docs.forEach(doc => console.log(doc.data()));
      } catch (error) {
        console.error('Error fetching documents: ', error);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('User is authenticated');
        fetchFirestoreData();
      } else {
        console.log('User is not authenticated');
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [auth, db]); // Ensure auth and db are included in dependency array
/*
  useEffect(() => {
    const fetchFirestoreData = async () => {
      try {
        const myCollection = collection(db, "users");
        const snapshot = await getDocs(myCollection);
        snapshot.docs.forEach(doc => console.log(doc.data()));
      } catch (error) {
        console.error('Error fetching documents: ', error);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('User is authenticated');
        fetchFirestoreData();
      } else {
        console.log('User is not authenticated');
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [auth, db]); // Ensure auth and db are included in dependency array
*/
  return (
    
<div className="landing-container">
  <header className="header">
    <div className="logo-container">
      <img src="joiapplogo.png" alt="JoiApp Logo" className="logo" />
      <h1 className="app-name">JoiApp</h1>
    </div>
  </header>

  
  <div className="overlay">
    <h1 className="title">Empowering your Career</h1>
    <h1 className="title">당신의 커리어를 응원합니다</h1>
    <p className="subtitle"> </p>
  
 
  
    <button onClick={handleLoginOrRegister} className="login-button">
      로그인
    </button>
  </div>
</div>


    /*
    <div className="landing-container">
      <h1 className="title">Welcome to Our Application</h1>
      <button onClick={handleLoginOrRegister} className="button register-button">
        Register with Freighter
      </button>
      <button onClick={handleLoginOrRegister} className="button login-button">
        Login
      </button>
    </div>
    */
  );
};

export default LandingPage;
