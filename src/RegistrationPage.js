// src/pages/RegistrationPage.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { db } from './firebaseConfig';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import './css/modern.css';

const RegistrationPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const navigate = useNavigate();
  const auth     = getAuth();

const [emailError, setEmailError] = useState('');

const handleChange = e => {
  const { name, value } = e.target;
  setFormData(prev => ({ ...prev, [name]: value }));

  if (name === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setEmailError('올바른 이메일 형식이 아닙니다.');
    } else {
      setEmailError('');
    }
  }
};


const handleRegister = async (email, password, confirmPassword) => {
  // 1) basic password match check
  if (emailError) {
  alert('이메일 형식을 확인해주세요.');
  return;
}
  if (password !== confirmPassword) {
    alert('비밀번호가 서로 일치하지 않습니다.');
    return;
  }

  // 2) email format validation using regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert('올바른 이메일 형식을 입력해주세요.');
    return;
  }

  try {
    // 3) create the user in Firebase Auth
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    const uid = user.uid;

    // 4) store user info in Firestore
    await setDoc(doc(db, 'users', uid), {
      email,
      registeredAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      numberOfLogins: 1,
      JoiPoints: 5,
      lastSurveyDate: null,
    });

    // 5) navigate to profile
    navigate('/profile');
  } catch (error) {
    console.error('회원가입 중 오류:', error);
    alert('회원가입 실패: ' + error.message);
  }
};

  return (
    <div className="container">
      <div className="login-box">
        <div className="login-header">
          <h1>계정 생성</h1>
          <p>환영합니다!</p>
        </div>

        <form
          className="login-form"
          onSubmit={e => {
            e.preventDefault();
            handleRegister(
              formData.email,
              formData.password,
              formData.confirmPassword
            );
          }}
        >
          <div className="form-group">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <label>이메일</label>
            <div className="bar" />
            {emailError && <p style={{ color: 'red', fontSize: '0.8rem' }}>{emailError}</p>}
          </div>

          <div className="form-group">
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <label>비밀번호</label>
            <div className="bar" />
          </div>

          <div className="form-group">
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
            <label>비밀번호 확인</label>
            <div className="bar" />
          </div>

          <button type="submit" className="submit-btn">
            계정 생성
          </button>

          <div className="register-link">
            <p>이미 계정이 있으신가요?</p>
            <Link to="/login" className="register-btn">
              로그인
            </Link>
          </div>
        </form>
      </div>

      <div className="footer">
        <p>© Szupia, Inc. 2019</p>
      </div>
    </div>
  );
};

export default RegistrationPage;
