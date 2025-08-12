// src/components/admin/Login.js
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminLogin() {
  const { login } = useAuth();
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    try { await login(email, password); window.location.replace('/admin'); }
    catch (e) { setErr(e.message || 'Login failed'); }
  };

  return (
    <div className="max-w-sm mx-auto p-6 border rounded bg-white">
      <h2 className="text-lg font-semibold mb-3">Admin Login</h2>
      <form onSubmit={submit} className="space-y-3">
        <input className="w-full border rounded px-3 py-2" placeholder="admin@email"
               value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="w-full border rounded px-3 py-2" type="password" placeholder="password"
               value={password} onChange={e=>setPassword(e.target.value)} />
        {err && <div className="text-red-600 text-sm">{err}</div>}
        <button className="w-full px-4 py-2 bg-blue-600 text-white rounded">Log in</button>
      </form>
    </div>
  );
}
