import { useNavigate, useLocation } from 'react-router-dom';

const API_URL = "https://api.joiapp.org";

export const getAuthToken = () => {
  return localStorage.getItem('jwt_token');
};

export const isAuthenticated = () => {
  return !!getAuthToken();
};

export const verifyToken = async () => {
  const token = getAuthToken();
  if (!token) return false;

  try {
    const response = await fetch(`${API_URL}/api/v1/auth/verify`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.ok;
  } catch {
    return false;
  }
};

export const makeAuthenticatedRequest = async (url, options = {}, navigate) => {
  const token = getAuthToken();
  if (!token) {
    navigate('/');
    return;
  }
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (response.status === 401) {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_id');
    navigate('/');
    return;
  }
  
  return response;
};