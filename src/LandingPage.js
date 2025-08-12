import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from './firebaseConfig';
import { getDocs, collection } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useLoginOrRegister } from './utils/useLoginOrRegister.js';
import './css/LandingPage.css';
import JoiAppLogo from './joiapplogo.png'; 
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
        fetchFirestoreData();
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="landing-container">
      <header className="header">
        <div className="logo-container">
           <img src={JoiAppLogo} alt="JoiApp Logo" className="logo" />
          <h1 className="app-name">JoiApp</h1>
              <button
                  onClick={() => navigate('/admin')}
                  style={{
                    background: '#673ab7',
                    border: 'none',
                  padding: '8px 12px',
                    borderRadius: 4,
                    color: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  Admin
                </button>
        </div>
      </header>
  
      <div className="glass-overlay">
        <h1 className="title">당신의 정신건강을 위한 JoiApp</h1>
        
     <button onClick={() => navigate('/login')} className="login-button">
         로그인
       </button>
       <button onClick={() => navigate('/register')} className="login-button">
         회원가입
       </button>
      </div>
  
      <div className="footer">
        <p>© Szupia, Inc. 2019</p>
      </div>

    </div>

  );

};

export default LandingPage;
