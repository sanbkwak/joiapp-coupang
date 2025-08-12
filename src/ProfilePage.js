// src/pages/ProfilePage.js
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from './firebaseConfig'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import 'react-datepicker/dist/react-datepicker.css'
import { ko } from 'date-fns/locale'
import ReactDatePicker, { registerLocale } from 'react-datepicker'
import { Link } from 'react-router-dom';
import { useLogout } from './utils/logout.js';
import JoiAppLogo from './joiapplogo.png'; 


registerLocale('ko', ko)



export default function ProfilePage() {
  const [gender,   setGender]   = useState('')
  const [birthday, setBirthday] = useState('')
  const [hireYear, setHireYear] = useState('')
  const [error,    setError]    = useState('')
  const navigate = useNavigate()
  const uid      = auth.currentUser?.uid
  const logout = useLogout();
  const handleSubmit = async e => {
    e.preventDefault()
    if (!gender || !birthday || !hireYear) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    // Validate birthdate
    const birthDate = new Date(birthday);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    if (birthDate > today) {
      setError('생년월일이 미래일 수 없습니다.');
      return;
    }
    if (age < 10 || age > 100) {
      setError('생년월일이 올바르지 않습니다. (10세 이상 100세 이하)');
      return;
    }
    try {
      await updateDoc(doc(db, 'users', uid), {
        gender,
        birthday: new Date(birthday),
        hireYear: Number(hireYear),
        profileCompleted: true,
        profileUpdatedAt: serverTimestamp()
      })
      // now go on to Survey (or wherever you want)
      navigate('/settings')
    } catch (e) {
      console.error(e)
      setError('프로필 저장 중 오류가 발생했습니다.')
    }
  }

 return (
  <div style={{
    maxWidth: '480px',
    margin: '60px auto',
    padding: '40px',
    borderRadius: '10px',
    backgroundColor: '#f5f7fb',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    fontFamily: 'Segoe UI, sans-serif'
  }}>
    <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
  <div
    className="logo-container"
    onClick={() => navigate('/dashboard')}
    style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
  >
    <img src={JoiAppLogo} alt="JoiApp Logo" style={{ height: '40px', marginRight: '12px' }} />
    <span className="app-name" style={{ fontSize: '20px', fontWeight: 'bold' }}>JoiApp</span>
  </div>

  <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
    <Link to="/settings" style={{ fontSize: '16px', textDecoration: 'none', color: '#333' }}>
      설정
    </Link>
    <button onClick={logout} className="logout-button">로그아웃</button>
  </div>
</div>
    <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#2c3e50' }}>
      🎉 프로필을 완성해주세요
    </h2>
    <p style={{ textAlign: 'center', color: '#666', fontSize: '14px', marginBottom: '30px' }}>
      간단한 정보를 입력하고 여정을 시작해요.
    </p>

    {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontWeight: '600', color: '#2c3e50', display: 'block', marginBottom: '6px' }}>
  성별
</label><br />
        <select
          value={gender}
          onChange={e => setGender(e.target.value)}
          required
          style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
        >
          <option value="">선택하세요</option>
          <option value="male">남성</option>
          <option value="female">여성</option>
          <option value="other">기타</option>
          <option value="prefer_not">응답 거부</option>
        </select>
      </div>

      <div style={{ marginBottom: 20 }}>
      <label style={{ fontWeight: '600', color: '#2c3e50', display: 'block', marginBottom: '6px' }}>
  생년월일
</label><br />
          <ReactDatePicker
            selected={birthday ? new Date(birthday) : null}
            onChange={date => setBirthday(date.toISOString().split('T')[0])}
            dateFormat="yyyy-MM-dd"
            locale="ko"
            placeholderText="생년월일을 선택하세요"
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
            className="custom-datepicker"
          />

      </div>

      <div style={{ marginBottom: 30 }}>
        <label style={{ fontWeight: '600', color: '#2c3e50', display: 'block', marginBottom: '6px' }}>
  입사연도
</label><br />
        <input
          type="number"
          value={hireYear}
          onChange={e => setHireYear(e.target.value)}
          min="2000"
          max={new Date().getFullYear()}
          required
          style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
        />
      </div>

      <button
        type="submit"
        style={{
          width: '100%',
          padding: '12px',
          background: '#2e86de',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          cursor: 'pointer',
          transition: 'background 0.3s'
        }}
        onMouseOver={e => e.currentTarget.style.background = '#1e70c1'}
        onMouseOut={e => e.currentTarget.style.background = '#2e86de'}
      >
        저장하고 계속 →
      </button>
    </form>

    <div className="footer" style={{ marginTop: '40px', textAlign: 'center', fontSize: '12px', color: '#aaa' }}>
      © Szupia, Inc. 2019
    </div>
  </div>
);

}

