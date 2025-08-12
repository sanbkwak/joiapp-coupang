// LoginPage.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './css/modern.css';
import { auth, db } from './firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

const LoginPage = () => {
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [error, setError]             = useState(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const navigate = useNavigate();

  // user login
  const handleUserLogin = async (e) => {
    e.preventDefault();
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const uid  = cred.user.uid;
      const userRef = doc(db, 'users', uid);
      const snap    = await getDoc(userRef);
      const data    = snap.data() || {};

      const newLogins = (data.numberOfLogins || 0) + 1;
      await updateDoc(userRef, {
        lastLogin:      serverTimestamp(),
        numberOfLogins: newLogins,
        JoiPoints:      newLogins * 5,
      });

      // survey every first login or every 2 weeks
      const TWO_WEEKS = 14 * 24 * 60 * 60 * 1000;
      const lastSurvey = data.lastSurveyDate?.toDate?.();
      const now = Date.now();
      const needSurvey = (
        data.numberOfLogins === 0 ||
        !lastSurvey ||
        now - lastSurvey.getTime() > TWO_WEEKS
      );

      navigate( needSurvey ? '/survey' : '/questions' );
    } catch (e) {
      console.error(e);
      setError('로그인 오류: ' + e.message);
    }
  };

  // admin login
  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (email === 'admin' && password === 'adminCoupang') {
      navigate('/admin');
    } else {
      setError('관리자 로그인 오류: 아이디 또는 비밀번호가 잘못되었습니다.');
    }
  };

  return (
    <div className="container">
      {/* top-right admin toggle */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px' }}>
        <button
          type="button"
          className="admin-login-btn"
          onClick={() => {
            setError(null);
            setIsAdminMode(!isAdminMode);
          }}
        >
          {isAdminMode ? '← 사용자 로그인' : '관리자 로그인 →'}
        </button>
      </div>

      <div className="login-box">
        <div className="login-header">
          <h1>{isAdminMode ? '관리자 로그인' : '사용자 로그인'}</h1>
          <p>{isAdminMode ? '관리자 계정으로 접속합니다' : '이메일과 비밀번호를 입력하세요'}</p>
        </div>

        <form
          className="login-form"
          onSubmit={isAdminMode ? handleAdminLogin : handleUserLogin}
        >
          <div className="form-group">
            <input
              type="text"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <label>{isAdminMode ? '아이디' : '이메일'}</label>
            <div className="bar" />
          </div>

          <div className="form-group">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <label>비밀번호</label>
            <div className="bar" />
          </div>

          {error && (
            <p className="error-text" style={{ color: 'salmon', marginTop: 8 }}>
              {error}
            </p>
          )}

          <button type="submit" className="submit-btn">
            {isAdminMode ? '관리자 로그인' : '로그인'}
          </button>
        </form>

        {!isAdminMode && (
          <div className="register-link">
            <p>계정이 없으신가요?</p>
            <Link to="/register" className="register-btn">
              회원가입
            </Link>
          </div>
        )}
      </div>
            <div className="footer">
        <p>© Szupia, Inc. 2019</p>
      </div>
    </div>
  );
};

export default LoginPage;
