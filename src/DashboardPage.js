import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLogout } from './utils/logout.js';
import { db, auth } from './firebaseConfig';// Import your Firebase configuration here
import { doc, getDoc } from 'firebase/firestore';
import './css/DashboardPage.css'; // Optional CSS file for styling

import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import JoiAppLogo from './joiapplogo.png'; 

const DashboardPage = () =>  {
    const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const logout = useLogout();

  const [userId, setUserId] = useState(null);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
            setUserId(user.uid);
        } else {
            console.error("User not authenticated");
            navigate('/');
        }
    });

    return () => unsubscribe();
}, [navigate]);


  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Reference to the user's document in Firestore
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUserData(userSnap.data());
        } else {
          console.error('User data not found');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!userData) {
    return <div>Error: User data not available</div>;
  }

  return (
    <div className="dashboard-container">
   
      <div className="dashboard">

         <div className="header">
                    <div className="logo-container" onClick={() => navigate('/dashboard')}>
                <img src={JoiAppLogo} alt="JoiApp Logo" className="logo" />
                <span className="app-name">JoiApp</span>
           </div>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {userId && <p>User ID: {userId}</p>}
                    </div>
                <button onClick={logout} className="logout-button">
                    Log Out
                </button>
            </div>
        <div className="dashboard-info">
          <div className="info-item">
            <strong>Username:</strong> {userData.username}
          </div>
          <div className="info-item">
            <strong>Login Times:</strong> {userData.numberOfLogins}
          </div>
          <div className="info-item">
            <strong>Last Login:</strong> {userData.lastLogin ? userData.lastLogin.toDate().toString() : 'N/A'}
          </div>
          <div className="info-item">
            <strong>Assessments Completed:</strong> {userData.assessmentsCompleted || 0}
          </div>
          <div className="info-item">
            <strong>JoiCoins Accumulated:</strong> {userData.joiCoins || 0}
          </div>
        </div>
      </div>
            <div className="footer">
        <p>© Szupia, Inc. 2019</p>
      </div>
    </div>
  );
}

export default DashboardPage;
 