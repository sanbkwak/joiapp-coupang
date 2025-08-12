// src/routes/RequireAdmin.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function RequireAdmin({ children }) {
  const { user, claims, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!claims?.admin) return <div className="p-4">You are not authorized.</div>;
  return children;
}
