// src/common/RequireAdmin.js
// src/common/RequireAdmin.js
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getAuthToken, getUserRole } from '../utils/authUtility';

export default function RequireAdmin({ children }) {
  const [authorized, setAuthorized] = useState(null);

  useEffect(() => {
    const token = getAuthToken();
    const userRole = getUserRole(); // or localStorage.getItem('user_role')
    
    if (!token) {
      setAuthorized(false);
    } else {
      setAuthorized(userRole === 'admin');
    }
  }, []);

  if (authorized === null) return <p>로딩 중…</p>;
  if (!authorized) return <Navigate to="/login" replace />;
  return children;
}