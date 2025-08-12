// src/common/RequireAdmin.js
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from './firebaseConfig';

export default function RequireAdmin({ children }) {
  const [authorized, setAuthorized] = useState<boolean|null>(null);

  useEffect(() => {
    auth.onAuthStateChanged(user => {
      if (!user) {
        setAuthorized(false);
      } else {
        user.getIdTokenResult().then((token) => {
          setAuthorized(!!token.claims.admin);
        });
      }
    });
  }, []);

  if (authorized === null) return <p>로딩 중…</p>;
  if (!authorized)       return <Navigate to="/login" replace />;
  return children;
}
