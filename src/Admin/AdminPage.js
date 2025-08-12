 
import React, { useEffect, useState } from 'react'
 import { useNavigate } from 'react-router-dom'
 import { auth, db } from '../firebaseConfig'
 import { collection, collectionGroup, getDocs } from 'firebase/firestore'
 import { getCountFromServer } from 'firebase/firestore'
 
 import { Line, Bar, Pie } from 'react-chartjs-2'
 import 'chart.js/auto'
// imported with plural “Trends” but used as <TrendAnalysisSection />
import TrendsAnalysisSection from './TrendsAnalysisSection.js'
import './css/admin.css';
 
 const AdminPage = () => {
   const navigate = useNavigate()

  // ───────────────────────────────────────────────────────────────
 // 1) Admin‐only hook: fetch dashboard once isAdmin flips to true
  // ───────────────────────────────────────────────────────────────
   const [isAdmin, setIsAdmin]     = useState(false)
   const [loading, setLoading]     = useState(true)
   const [totalUsers, setTotalUsers] = useState(0)
   const [avgPhq2, setAvgPhq2]       = useState(0)
   const [avgGad2, setAvgGad2]       = useState(0)
   const [surveyCounts, setSurveyCounts] = useState({ phq2: 0, gad2: 0, totalSurveys: 0 })
   const [burnoutDist, setBurnoutDist]   = useState({})
 
  const totalSurveyResponses = 54;
  const phq2Count = 27;
  const gad2Count = 27;
  const phq2Error = 0.45;
  const gad2Error = 0.45;
 
   useEffect(() => {
     if (!isAdmin) return
     const fetchDashboard = async () => {
       setLoading(true)
       // total users
       const usersCountSnap = await getCountFromServer(collection(db, 'users'))
       setTotalUsers(usersCountSnap.data().count)
 
       // survey counts & averages
       const phq2Snaps = await getDocs(collectionGroup(db, 'phq2'))
       const gad2Snaps = await getDocs(collectionGroup(db, 'gad2'))
       let phq2Sum = 0, gad2Sum = 0
       phq2Snaps.forEach(d => phq2Sum += d.data().score || 0)
       gad2Snaps.forEach(d => gad2Sum += d.data().score || 0)
         phq2Count = phq2Snaps.size
         gad2Count = gad2Snaps.size
       setSurveyCounts({
         phq2: phq2Count,
         gad2: gad2Count,
         totalSurveys: phq2Count + gad2Count
       })
       setAvgPhq2(phq2Count ? +(phq2Sum / phq2Count).toFixed(2) : 0)
       setAvgGad2(gad2Count ? +(gad2Sum / gad2Count).toFixed(2) : 0)
 
       // burnout distribution
       const q2Snaps = await getDocs(collectionGroup(db, 'surveyResponses'))
       const dist = {}
       q2Snaps.forEach(d => {
         const ans = d.data().answers?.['Which factor contributes most to your sense of burnout?']
         if (ans) dist[ans] = (dist[ans] || 0) + 1
       })
       setBurnoutDist(dist)
 
       setLoading(false)
     }
     fetchDashboard()
   }, [isAdmin])
 
 
   // ───────────────────────────────────────────────────────────────
   // 2) Admin login form
   // ───────────────────────────────────────────────────────────────
   const [username, setUsername]   = useState('')
   const [password, setPassword]   = useState('')
   const [errorMessage, setError]  = useState('')
   const handleLogin = e => {
     e.preventDefault()
     if (username === 'admin' && password === 'adminCoupang1') {
       setIsAdmin(true)
       setError('')
     } else {
       setError('Invalid credentials')
     }
   }
 
   if (!isAdmin) {
     return (
       <div style={{ maxWidth: 320, margin: '100px auto', padding: 20, border: '1px solid #ccc', borderRadius: 6 }}>
         <h2 style={{ textAlign: 'center' }}>Admin Login</h2>
         <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
           <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} style={{ padding: 8, fontSize: '1rem' }} />
           <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{ padding: 8, fontSize: '1rem' }} />
           {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
           <button type="submit" style={{ background: '#673ab7', color: '#fff', border: 'none', padding: '10px', borderRadius: 4, cursor: 'pointer' }}>
             Log in as Admin
           </button>
         </form>
       </div>
     )
   }
 
 
   if (loading) {
     return <p>관리자 대시보드 로딩 중…</p>
   }
 
   // ───────────────────────────────────────────────────────────────
   // 3) Dashboard UI
   // ───────────────────────────────────────────────────────────────
   const avgData = {
     labels: ['PHQ-2', 'GAD-2'],
     datasets: [{ label: '평균 점수', data: [avgPhq2, avgGad2], backgroundColor: ['#ff9800', '#4caf50'] }]
   }
   const burnData = {
     labels: Object.keys(burnoutDist),
     datasets: [{ label: '원인 분포', data: Object.values(burnoutDist), backgroundColor: ['#3f51b5','#e91e63','#00bcd4','#8bc34a','#ffc107'] }]
   }
   return (
    <div className="admin-dashboard">
      <h1 className="admin-title">🔒 JoiApp 관리자 대시보드</h1>

      <div className="admin-stats">
        <div className="stat-card">
          <div className="stat-label">총 사용자</div>
          <div className="stat-value">{totalUsers}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">총 설문 응답 수</div>
          <div className="stat-value">{totalSurveyResponses}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">PHQ-2 응답 수</div>
          <div className="stat-value">{phq2Count}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">GAD-2 응답 수</div>
          <div className="stat-value">{gad2Count}</div>
        </div>
      </div>

      <h2 className="section-header">예측 vs 실제 정확도</h2>
      <div className="admin-accuracy">
        <div className="accuracy-card">
          <div className="accuracy-label">PHQ-2 평균 절대 오차</div>
          <div className="accuracy-value">{phq2Error}</div>
        </div>
        <div className="accuracy-card">
          <div className="accuracy-label">GAD-2 평균 절대 오차</div>
          <div className="accuracy-value">{gad2Error}</div>
        </div>
      </div>
 

      <div className="admin-nav">
        <button onClick={() => navigate('/admin/users')}>사용자 상세</button>
        <button onClick={() => navigate('/admin/surveys')}>설문 상세</button>
        <button onClick={() => navigate('/admin/trends')}>추세 분석</button>
      </div>
    </div>
  );
}

export default AdminPage;