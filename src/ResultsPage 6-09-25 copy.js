// src/coupang/ResultsPage.js
import React, { useEffect, useState } from 'react';
import { useNavigate }       from 'react-router-dom';
import { auth, db }          from './firebaseConfig';
import {
  collection,
  query,
  getDocs,
  orderBy,
  doc,
  getDoc,

}                            from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Line }              from 'react-chartjs-2';
import {
  Chart as ChartJS,
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  CategoryScale
}                            from 'chart.js';
import 'chartjs-adapter-date-fns';

import tips                 from '../main/common/mentalHealthTips.js';
import { useLogout }        from '../main/common/utils/logout.js';
import JoiAppLogo           from './joiapplogo.png';
import './css/ResultsPage.css';

ChartJS.register(
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  CategoryScale
);

// If running locally, uncomment next line and comment out the prod URL.
//const API_URL = 'http://localhost:8080';
const API_URL = 'https://api.joiapp.org';

export default function ResultsPage() {
  const navigate = useNavigate();
  const logout   = useLogout();

  // ─────────────────────────────────────────────────────────────
  // 1) Firestore answer data (GAD-2, PHQ-2, GAD-7, PHQ-9)
  // ─────────────────────────────────────────────────────────────
  const [gad7Data, setGad7Data] = useState([]);
  const [phq9Data, setPhq9Data] = useState([]);
  const [gad2Data, setGad2Data] = useState([]);
  const [phq2Data, setPhq2Data] = useState([]);
  const [timeUnit, setTimeUnit] = useState('day'); // not used right now, but left in case

  // ─────────────────────────────────────────────────────────────
  // 2) Coupang quick-fire analysis state (face + voice)
  // ─────────────────────────────────────────────────────────────
  const [coupangStatus,    setCoupangStatus]    = useState('pending');    // 'pending' | 'in_progress' | 'complete' | 'error'
         // { dominant_facial_emotions, dominant_voice_emotions, safety_ok, gad2History, phq2History, summary }
  const [quickError,       setQuickError]       = useState(null);

  // ─────────────────────────────────────────────────────────────
  // 3) Deep analysis state
  // ─────────────────────────────────────────────────────────────
  const [deepProgress, setDeepProgress] = useState(0);       // 0–100
  const [deepResults,  setDeepResults]  = useState(null);    // final payload from /coupang/analysis_results
  const [deepStatus,   setDeepStatus]   = useState('not_started'); // 'not_started' | 'queued' | 'in_progress' | 'complete' | 'error'
  const [deepError,    setDeepError]    = useState(null);

    // Firestore에서 안면/음성 이력을 보여주기 위한 state
  const [facialHistory, setFacialHistory] = useState([]);
  const [voiceHistory,  setVoiceHistory]  = useState([]);


    // ─── “Deep” status & history (PHQ-2 / GAD-2) ───────────────────────
  const [phq2History, setPhq2History] = useState([]); // array of { score, timestamp }
  const [gad2History, setGad2History] = useState([]); // array of { score, timestamp }

     const [coupangResults,  setCoupangResults]  = useState([]);
     const [summaryText, setSummaryText]  = useState([]);

  // ─────────────────────────────────────────────────────────────
  // 4) Auth (get userId, then fetch Firestore + start polling Coupang)
  // ─────────────────────────────────────────────────────────────
  const [userId, setUserId] = useState(null);


    // ─── When userId changes (or on mount), load all histories ───────────
  useEffect(() => {
    if (!userId) return;
    fetchEmotionHistories(userId);
    fetchPhqGadHistories(userId);
  }, [userId]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      if (user) {
        setUserId(user.uid);
        fetchFirestoreData(user.uid);
        fetchEmotionHistories(user.uid);
      } else {
        navigate('/');
      }
    });
    return () => unsub();
  }, [navigate]);

  // Fetch Firestore “answers” collections for the four scales
  const fetchFirestoreData = async uid => {
    const fetchCollectionData = async collName => {
      const q = query(
        collection(db, 'users', uid, collName),
        orderBy('timestamp', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    };

    try {
      const [gad7, phq9, gad2, phq2] = await Promise.all([
        fetchCollectionData('gad7'),
        fetchCollectionData('phq9'),
        fetchCollectionData('gad2'),
        fetchCollectionData('phq2')
      ]);
      setGad7Data(gad7);
      setPhq9Data(phq9);
      setGad2Data(gad2);
      setPhq2Data(phq2);
    } catch (err) {
      console.error('Error fetching Firestore data:', err);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 5) Build Chart.js data object from Firestore docs
  // ─────────────────────────────────────────────────────────────
  const processChartData = (answersData, questionsToShow = null) => {
    const chartData = { labels: [], datasets: [] };
    if (answersData.length > 0) {
      const questions = questionsToShow || Object.keys(answersData[0].answers);
      chartData.labels = answersData.map(e => new Date(e.timestamp.seconds * 1000));

      questions.forEach(q => {
        chartData.datasets.push({
          label: q,
          data: answersData.map(e => Number(e.answers[q])),
          fill: false,
          borderColor: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
          tension: 0.1
        });
      });
    }
    return chartData;
  };

  const chartOptions = {
    responsive: true,
    scales: {
      x: {
        type: 'time',
        time: {
          displayFormats: {
            day: 'MMM d',
            hour: 'MMM d, h a',
            minute: 'MMM d, h:mm a'
          },
          tooltipFormat: 'MMM d, h:mm a'
        },
        title: { display: true, text: 'Date & Time' }
      },
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Score' }
      }
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: { boxWidth: 10, font: { size: 10 } }
      }
    }
  };

  const chartOptionsAllTime = {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      x: {
        ...chartOptions.scales.x,
        min: undefined,
        max: undefined
      }
    }
  };
// ─────────────────────────────────────────────────────────────
//  Chart options for “session” X-axis instead of time
// ─────────────────────────────────────────────────────────────
const sessionChartOptions = {
  responsive: true,
  scales: {
    x: {
      type: 'category',               // ← use category, not time
      title: { display: true, text: 'Session' },
      ticks: { color: '#333' },
      grid: { color: 'rgba(0,0,0,0.05)' },
    },
    y: {
      beginAtZero: true,
      title: { display: true, text: 'Score' },
      ticks: { color: '#333' },
      grid: { color: 'rgba(0,0,0,0.05)' },
    },
  },
  plugins: {
    legend: {
      position: 'bottom',
      labels: { boxWidth: 10, font: { size: 10 } },
    },
  },
}
 

// For “all‐time” you can clone it (no min/max on X anyway):
const sessionChartOptionsAllTime = { ...sessionChartOptions }


/**
 * Given an array of { score, timestamp } objects,
 * return only the last entry for each calendar date.
 */
function filterLatestPerDay(data) {
  const byDate = {};
  data.forEach(item => {
    const day = new Date(item.timestamp).toLocaleDateString();
    // always overwrite so the last‐seen stays
    byDate[day] = item;
  });
  // restore chronological order by sorting keys
  return Object.entries(byDate)
    .sort((a, b) => new Date(a[0]) - new Date(b[0]))
    .map(([_, item]) => item);
}
  // ─────────────────────────────────────────────────────────────
  // 6) Once userId is known, start polling `/coupang/status` every 5s
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    // Immediately set quickStatus = 'in_progress'
    setCoupangStatus('in_progress');

    const intervalId = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/coupang/status?userId=${userId}`);
        if (!res.ok) {
          throw new Error(`Status fetch failed: ${res.status}`);
        }
        const { status } = await res.json();
        setCoupangStatus(status);

        if (status === 'complete' || status === 'error') {
          clearInterval(intervalId);
        }
      } catch (err) {
        console.error('Error polling coupang status:', err);
        setQuickError(err.message);
        setCoupangStatus('error');
        clearInterval(intervalId);
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [userId]);


 // ─────────────────────────────────────────────────────────────
  // 9) Fetch Coupang “quick‐fire” results once status === 'complete'
  //    and then immediately enqueue deep analysis
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (coupangStatus !== 'complete' || !userId) return;

    const fetchQuickResults = async () => {
      try {
        const res = await fetch(`${API_URL}/coupang/results?userId=${encodeURIComponent(userId)}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch coupang results: ${res.status}`);
        }
        const data = await res.json();
        setCoupangResults(data);
        // Kick off deep analysis
        triggerDeepAnalysis();
      } catch (err) {
        console.error('Error fetching coupang results:', err);
        setQuickError(err.message);
      }
    };
    fetchQuickResults();
  }, [coupangStatus, userId]);

  // ─────────────────────────────────────────────────────────────
  // 8) Enqueue deep analysis → poll `/coupang/analysis_progress`
  // ─────────────────────────────────────────────────────────────
  const triggerDeepAnalysis = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_URL}/coupang/analyze/queue?userId=${userId}`, {
        method: 'POST'
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Enqueue failed: ${txt}`);
      }
      setDeepStatus('queued');
      pollDeepProgress();
    } catch (err) {
      console.error('Error triggering deep analysis:', err);
      setDeepError(err.message);
      setDeepStatus('error');
    }
  };

  const pollDeepProgress = () => {
    setDeepStatus('in_progress');
    const id = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/coupang/analysis_progress?userId=${userId}`);
        if (!res.ok) {
          throw new Error(`Progress fetch failed: ${res.status}`);
        }
        const { progress } = await res.json();
        setDeepProgress(progress);
        if (progress >= 100) {
          clearInterval(id);
          setDeepStatus('complete');
        }
      } catch (err) {
        console.error('Error polling deep progress:', err);
        setDeepError(err.message);
        setDeepStatus('error');
        clearInterval(id);
      }
    }, 2000);
  };

  // ─────────────────────────────────────────────────────────────
  // 9) Once deepStatus === 'complete', fetch `/coupang/analysis_results`
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (deepStatus !== 'complete' || !userId) return;

    (async () => {
      try {
        const res = await fetch(`${API_URL}/coupang/analysis_results?userId=${userId}`);
        if (!res.ok) {
          throw new Error(`Deep results fetch failed: ${res.status}`);
        }
        const data = await res.json();
        setDeepResults(data);
      } catch (err) {
        console.error('Error fetching deep analysis results:', err);
        setDeepError(err.message);
      }
    })();
  }, [deepStatus, userId]);


/**
 * Fetch “솔직성 검사” (facial) history from coupang_interim/{uid}
 *  and “음성 감정” (voice) history from users/{uid}/voice_results.
 *
 *  The function will populate two React state variables:
 *    - facialHistory: Array<{ emotion: string, timestamp: Date|null }>
 *    - voiceHistory:  Array<{ emotion: string|null, timestamp: Date|null }>
 *
 *  If no data exists, it sets each history array to [].
 */  // ─── fetchEmotionHistories does exactly one setCoupangResults, not two ─

async function fetchEmotionHistories(uid) {
  // 1) Facial history
  const faceCol  = collection(db, 'users', uid, 'facial_results')
  const faceQ    = query(faceCol, orderBy('timestamp', 'desc'))
  const faceSnap = await getDocs(faceQ)

  if (faceSnap.empty) {
    setFacialHistory([])
  } else {
    const list = faceSnap.docs.map(d => {
      const dData = d.data()
      // timestamp → JS Date
      let ts = null
      if (dData.timestamp?.toDate) {
        ts = dData.timestamp.toDate()
      } else if (dData.timestamp) {
        ts = new Date(dData.timestamp)
      }
      // grab only the string you want:
      const dominant = Array.isArray(dData.facial_prediction_result) &&
                       dData.facial_prediction_result.length > 0
        ? dData.facial_prediction_result[0].dominant_emotion
        : null

      return { emotion: dominant, timestamp: ts }
    })
    setFacialHistory(list)
  }

  // 2) Voice history
  const voiceCol  = collection(db, 'users', uid, 'voice_results')
  const voiceQ    = query(voiceCol, orderBy('timestamp', 'desc'))
  const voiceSnap = await getDocs(voiceQ)

  if (voiceSnap.empty) {
    setVoiceHistory([])
  } else {
    const list = voiceSnap.docs.map(d => {
      const dData = d.data()
      let ts = null
      if (dData.timestamp?.toDate) {
        ts = dData.timestamp.toDate()
      } else if (dData.timestamp) {
        ts = new Date(dData.timestamp)
      }
      // here it’s a flat object, not an array:
      const dominant = dData.voice_prediction_result?.predicted_emotion || null

      return { emotion: dominant, timestamp: ts }
    })
    setVoiceHistory(list)
  }
}


  async function fetchPhqGadHistories(uid) {
    try {
      // 1) Read phq2 history from Firestore: users/{uid}/phq2_results
      const phqCol = collection(db, "users", uid, "phq2");
      const phqQ = query(phqCol, orderBy("timestamp", "asc"));
      const phqSnap = await getDocs(phqQ);

      if (phqSnap.empty) {
        console.log(`users/${uid}/phq2 is empty`);
        setPhq2History([]);
      } else {
        const phqList = phqSnap.docs.map((d) => {
          const dData = d.data();
          const score = dData.score !== undefined ? dData.score : null;
          let ts = null;
          if (dData.timestamp && typeof dData.timestamp.toDate === "function") {
            ts = dData.timestamp.toDate().toISOString();
          } else if (dData.timestamp) {
            ts = new Date(dData.timestamp).toISOString();
          }
          return {
            score,
            timestamp: ts,
          };
        });
        setPhq2History(phqList);
      }

      // 2) Read gad2 history from Firestore: users/{uid}/gad2
      const gadCol = collection(db, "users", uid, "gad2");
      const gadQ = query(gadCol, orderBy("timestamp", "asc"));
      const gadSnap = await getDocs(gadQ);

      if (gadSnap.empty) {
        console.log(`users/${uid}/gad2 is empty`);
        setGad2History([]);
      } else {
        const gadList = gadSnap.docs.map((d) => {
          const dData = d.data();
          const score = dData.score !== undefined ? dData.score : null;
          let ts = null;
          if (dData.timestamp && typeof dData.timestamp.toDate === "function") {
            ts = dData.timestamp.toDate().toISOString();
          } else if (dData.timestamp) {
            ts = new Date(dData.timestamp).toISOString();
          }
          return {
            score,
            timestamp: ts,
          };
        });
        setGad2History(gadList);
      }

      // 3) If your summary lives under coupang_interim (for example),
      // you could pull it here as well:
      const interimRef = doc(db, "coupang_interim", uid);
      const interimSnap = await getDoc(interimRef);
      if (interimSnap.exists()) {
        const interimData = interimSnap.data();
        if (interimData.summary && interimData.summary.text) {
          setSummaryText(interimData.summary.text);
        }
      }
    } catch (error) {
      console.error("Error fetching PHQ2/GAD2 histories:", error);
      setPhq2History([]);
      setGad2History([]);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 10) “Safety flag” stub (you can replace with your real logic)
  // ─────────────────────────────────────────────────────────────
  const hasSafetyRedFlag = () => {
    // If coupangResults contains something like `coupangResults.safety_ok === false`, return true.
    return coupangResults && !coupangResults.safety_ok;
  };

  // ─────────────────────────────────────────────────────────────
  // 11) Helper: filter Firestore data to “last 7 days”
  // ─────────────────────────────────────────────────────────────
  const filterLastNDays = (data, days) => {
    const cutoff = Date.now() - 1000 * 60 * 60 * 24 * days;
    return data.filter(e => e.timestamp?.seconds * 1000 >= cutoff);
  };

  const gad2Last7 = filterLastNDays(gad2Data, 7);
  const phq2Last7 = filterLastNDays(phq2Data, 7);

  // ─────────────────────────────────────────────────────────────
  // 12) Spinner keyframes + component (so we can drop it anywhere)
  // ─────────────────────────────────────────────────────────────
  const SpinnerKeyframes = () => (
    <style>
      {`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}
    </style>
  );

  const Spinner = () => (
    <div
      style={{
        border: '6px solid #f3f3f3',
        borderTop: '6px solid #3498db',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        animation: 'spin 1s linear infinite',
        margin: '20px auto'
      }}
    />
  );

  // ─────────────────────────────────────────────────────────────
  // 13) RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="container" style={{ paddingTop: 80 }}>
      {/* Inject spinner keyframes once */}
      <SpinnerKeyframes />

      {/* ───────────────────────────────────────────────────────────
           A) Header + Logout
      ─────────────────────────────────────────────────────────── */}
      <div className="sub-header-container">
        <div className="header">
          <div className="logo-container" onClick={() => navigate('/dashboard')}>
            <img src={JoiAppLogo} alt="JoiApp Logo" className="logo" />
            <span className="app-name">JoiApp</span>
          </div>
          <button onClick={logout} className="logout-button">로그아웃</button>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <h1 className="page-title">Progress &amp; Analysis</h1>
        {userId && <p className="public-key">User ID: {userId}</p>}
      </div>
 
 
      {/* ───────────────────────────────────────────────────────────
           B) 1) GAD-2, PHQ-2, GAD-7, PHQ-9 Charts (always visible)
      ─────────────────────────────────────────────────────────── */}
<div className="chart-container">
 

  {/* GAD-7 & PHQ-9 stay the same */}
   {/*
  <div className="section">

   
    <h2 className="section-header">GAD-7 – Generalized Anxiety Trend</h2>
    {gad7Data.length > 0 ? (
      <Line data={processChartData(gad7Data)} options={chartOptions} />
    ) : (
      <p className="no-data-text">No GAD-7 data available.</p>
    )}
  </div>
  <div className="section">
    <h2 className="section-header">PHQ-9 – Clinical Depression Trend</h2>
    {phq9Data.length > 0 ? (
      <Line data={processChartData(phq9Data)} options={chartOptions} />
    ) : (
      <p className="no-data-text">No PHQ-9 data available.</p>
    )}
  </div>
  */}

  {/* Comparison rows */}
  <div className="comparison-row">
    <div className="comparison-chart">
      <h3>GAD-2 – Last 7 Sessions</h3>
      <Line
        data={{
          ...processChartData(gad2Last7),
          labels: gad2Last7.map((_, i) => `Session ${i + 1}`)
        }}
        options={sessionChartOptions}
      />
    </div>
    {/*
    <div className="comparison-chart">
      <h3>GAD-2 – All Sessions</h3>
      <Line
        data={{
          ...processChartData(gad2Data),
          labels: gad2Data.map((_, i) => `Session ${i + 1}`)
        }}
        options={sessionChartOptionsAllTime}
      />
    </div>  
    */}
  </div>
  <div className="comparison-row">
    <div className="comparison-chart">
      <h3>PHQ-2 – Last 7 Sessions</h3>
      <Line
        data={{
          ...processChartData(phq2Last7),
          labels: phq2Last7.map((_, i) => `Session ${i + 1}`)
        }}
        options={sessionChartOptions}
      />
    </div>
    {/*
    <div className="comparison-chart">
      <h3>PHQ-2 – All Sessions</h3>
      <Line
        data={{
          ...processChartData(phq2Data),
          labels: phq2Data.map((_, i) => `Session ${i + 1}`)
        }}
        options={sessionChartOptionsAllTime}
      />
    </div>
       */}
  </div>

</div>

{/*}      <div className="chart-container">
        <div className="section">
          <h2 className="section-header">GAD-2 – Anxiety Trend</h2>
          {gad2Data.length > 0 ? (
            <Line data={processChartData(gad2Data)} options={chartOptions} />
          ) : (
            <p className="no-data-text">No GAD-2 data available.</p>
          )}
        </div>
        <div className="section">
          <h2 className="section-header">PHQ-2 – Depression Trend</h2>
          {phq2Data.length > 0 ? (
            <Line data={processChartData(phq2Data)} options={chartOptions} />
          ) : (
            <p className="no-data-text">No PHQ-2 data available.</p>
          )}
        </div>
        <div className="section">
          <h2 className="section-header">GAD-7 – Generalized Anxiety Trend</h2>
          {gad7Data.length > 0 ? (
            <Line data={processChartData(gad7Data)} options={chartOptions} />
          ) : (
            <p className="no-data-text">No GAD-7 data available.</p>
          )}
        </div>
        <div className="section">
          <h2 className="section-header">PHQ-9 – Clinical Depression Trend</h2>
          {phq9Data.length > 0 ? (
            <Line data={processChartData(phq9Data)} options={chartOptions} />
          ) : (
            <p className="no-data-text">No PHQ-9 data available.</p>
          )}
        </div>

        <div className="comparison-row">
          <div className="comparison-chart">
            <h3>GAD-2 – Last 7 Days</h3>
            <Line data={processChartData(gad2Last7)} options={chartOptions} />
          </div>
          <div className="comparison-chart">
            <h3>GAD-2 – All Time</h3>
            <Line data={processChartData(gad2Data)} options={chartOptionsAllTime} />
          </div>
        </div>
        <div className="comparison-row">
          <div className="comparison-chart">
            <h3>PHQ-2 – Last 7 Days</h3>
            <Line data={processChartData(phq2Last7)} options={chartOptions} />
          </div>
          <div className="comparison-chart">
            <h3>PHQ-2 – All Time</h3>
            <Line data={processChartData(phq2Data)} options={chartOptionsAllTime} />
          </div>
        </div>
      </div>
      */}

      {/* ───────────────────────────────────────────────────────────
           C) 2) Coupang “quick” analysis (face + voice) section
      ─────────────────────────────────────────────────────────── */}
   
   
      <div className="coupang-section" style={{ marginTop: 40, padding: 20 }}>
        <h2 className="section-header">솔직성 검사 진행 상태</h2>

        {/* 1) While quickStatus is still in_progress or pending: show spinner + tips */}
        {coupangStatus === 'pending' || coupangStatus === 'in_progress' ? (
          <div style={{ textAlign: 'center', padding: '40px', background: '#1a237e', color: '#fff' }}>
            <Spinner />
            <h2 style={{ marginTop: '16px' }}>솔직성 검사 진행 중…</h2>
            <p>잠시만 기다려주세요.</p>
            <ul style={{ textAlign: 'left', maxWidth: '600px', margin: '20px auto' }}>
              {tips.map((tip, idx) => (
                <li key={idx}>{tip}</li>
              ))}
            </ul>
            {quickError && (
              <p style={{ color: 'salmon', marginTop: '12px' }}>
                오류: {quickError}
              </p>
            )}
          </div>
        ) : coupangStatus === 'error' ? (
          // 2) If quickStatus errored:
          <div style={{ textAlign: 'center', padding: '40px', background: '#1a237e', color: '#ff5252' }}>
            <h2>솔직성 검사 중 오류가 발생했습니다.</h2>
            <p>{quickError ?? '알 수 없는 오류가 발생했습니다.'}</p>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '20px',
                background: '#ff5252',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              다시 시도
            </button>
          </div>
        ) : coupangStatus === 'complete' && !coupangResults ? (
          // 3) quickStatus is complete, but coupangResults hasn't loaded yet:
          <div style={{ textAlign: 'center', padding: '40px', background: '#1a237e', color: '#fff' }}>
            <Spinner />
            <h2 style={{ marginTop: '16px' }}>결과를 불러오는 중…</h2>
          </div>
        ) : (
          // 4) quickStatus === 'complete' & we have coupangResults → show cards + then deep section
          <>
            {/* ───────────────────────────────────────────────────────────
                 4A) Quick‐fire result‐cards (face, voice, safety)
            ─────────────────────────────────────────────────────────── */}
            <div style={{ padding: '40px', background: '#1a237e', color: '#fff', minHeight: 'auto' }}>
              {/* Re‐show SpinnerKeyframes inside in case the user reloads quickly */}
     {/** */}         <SpinnerKeyframes />

              <h1 style={{ textAlign: 'center', marginBottom: '24px' }}>솔직성 검사 결과</h1>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '20px'
                }}
              >
                {/* Face check card */}
                <div
                  style={{
                    width: '80%',
                    maxWidth: '400px',
                    background: '#3949ab',
                    padding: '20px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  }}
                >
                  <h3>솔직성 검사 (안면)</h3>
                  {coupangResults &&
                  coupangResults.dominant_facial_emotions &&
                  coupangResults.dominant_facial_emotions.length > 0 ? (
                    <p>
                      ✅ 분석 완료됨 ({coupangResults.dominant_facial_emotions[0]})
                    </p>
                  ) : (
                    <p>분석된 감정 없음</p>
                  )}
                </div>

                {/* Voice check card */}
                <div
                  style={{
                    width: '80%',
                    maxWidth: '400px',
                    background: '#3949ab',
                    padding: '20px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  }}
                >
                  <h3>솔직성 검사 (음성)</h3>
                  {coupangResults &&
                  coupangResults.dominant_voice_emotions &&
                  coupangResults.dominant_voice_emotions.length > 0 ? (
                    <p>
                      ✅ 분석 완료됨 ({coupangResults.dominant_voice_emotions[0]})
                    </p>
                  ) : (
                    <p>분석된 감정 없음</p>
                  )}
                </div>

                {/* Safety check card */}
                <div
                  style={{
                    width: '80%',
                    maxWidth: '400px',
                    background: '#3949ab',
                    padding: '20px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  }}
                >
                  <h3>안전 체크</h3>
                  {coupangResults && coupangResults.safety_ok ? (
                    <p>✅ 안전해 보입니다</p>
                  ) : (
                    <p style={{ color: '#ffab00' }}>⚠️ 빨간 플래그 감지됨</p>
                  )}
                </div>
              </div>


{/* ───────────────────────────────────────────────────────────
     4B) Coupang 검사 트렌드 요약
   ─────────────────────────────────────────────────────────── */}
<div
  style={{
    marginTop: 40,
    background: '#283593',
    padding: '20px',
    borderRadius: '8px',
    color: '#fff',
    textAlign: 'left'
  }}
>
  <h2 style={{ textAlign: 'center' }}>솔직성 검사 트렌드 요약</h2>

  {phq2History.length > 1 && gad2History.length > 1 ? (
    <>
      {(() => {
        // PHQ-2 변화 계산
        const firstPHQ = phq2History[0].score;
        const lastPHQ  = phq2History[phq2History.length - 1].score;
        const deltaPHQ = lastPHQ - firstPHQ;

        // GAD-2 변화 계산
        const firstGAD = gad2History[0].score;
        const lastGAD  = gad2History[gad2History.length - 1].score;
        const deltaGAD = lastGAD - firstGAD;

        return (
          <div style={{ lineHeight: 1.6 }}>
            <p>
              <strong>PHQ-2</strong>: 처음 {firstPHQ} → 현재 {lastPHQ} (
              {deltaPHQ >= 0 ? `+${deltaPHQ}` : deltaPHQ})
            </p>
            <p style={{ color: deltaPHQ > 0 ? '#ffab00' : '#4caf50' }}>
              {deltaPHQ > 0
                ? '우울 지수가 증가했습니다. 잠시 휴식을 취해보세요.'
                : deltaPHQ < 0
                ? '우울 지수가 감소하여 보다 안정적입니다.'
                : '우울 지수가 변동 없이 유지되고 있습니다.'}
            </p>

            <p>
              <strong>GAD-2</strong>: 처음 {firstGAD} → 현재 {lastGAD} (
              {deltaGAD >= 0 ? `+${deltaGAD}` : deltaGAD})
            </p>
            <p style={{ color: deltaGAD > 0 ? '#ffab00' : '#4caf50' }}>
              {deltaGAD > 0
                ? '불안 지수가 증가했습니다. 심호흡이나 이완 운동을 권장합니다.'
                : deltaGAD < 0
                ? '불안 지수가 감소하여 보다 안정적입니다.'
                : '불안 지수가 변동 없이 유지되고 있습니다.'}
            </p>
          </div>
        );
      })()}

      {summaryText && (
        <div
          style={{
            marginTop: 20,
            background: '#3949ab',
            padding: '12px',
            borderRadius: '6px',
            color: '#fff'
          }}
        >
          <h4 style={{ margin: 0 }}>요약 의견</h4>
          <p style={{ margin: '8px 0 0' }}>{summaryText}</p>
        </div>
      )}
    </>
  ) : (
    <p style={{ textAlign: 'center' }}>충분한 이력 데이터가 없습니다.</p>
  )}
</div>






              
            </div>

 {/* ───────────────────────────────────────────────────────────
                   4C) 감정 분석 이력 (안면 + 음성)
              ─────────────────────────────────────────────────────────── */}
  {/**          
 <div>
  <h4>📷 안면 감정 이력</h4>
  {facialHistory.length > 0 ? (
    <ul>
      {facialHistory.map(({emotion, timestamp}, i) => (
        <li key={i}>
          {timestamp ? timestamp.toLocaleString() : 'Unknown 시간'} – {emotion || 'Unknown'}
        </li>
      ))}
    </ul>
  ) : (
    <p>안면 감정 이력 없음</p>
  )}
</div>

<div>
  <h4>🎤 음성 감정 이력</h4>
  {voiceHistory.length > 0 ? (
    <ul>
      {voiceHistory.map(({emotion, timestamp}, i) => (
        <li key={i}>
          {timestamp ? timestamp.toLocaleString() : 'Unknown 시간'} – {emotion || 'Unknown'}
        </li>
      ))}
    </ul>
  ) : (
    <p>음성 감정 이력 없음</p>
  )}
</div>

*/}   
            {/* ───────────────────────────────────────────────────────────
                 4C) Deep analysis spinner or results appear below
            ─────────────────────────────────────────────────────────── */}
            <div style={{ marginTop: '40px', textAlign: 'center' }}>
              {deepStatus === 'in_progress' && (
                <>
                  <Spinner />
                  <h2 style={{ marginTop: '16px' }}>심층 예측 분석 진행 중…</h2>
                  <p>잠시만 기다려주세요.</p>
                  <ul style={{ textAlign: 'left', maxWidth: '600px', margin: '20px auto' }}>
                    {tips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                  {deepError && (
                    <p style={{ color: 'salmon', marginTop: '12px' }}>
                      오류: {deepError}
                    </p>
                  )}
                </>
              )}

              {deepStatus === 'error' && (
                <>
                  <h2 style={{ color: '#ff5252' }}>심층 분석 중 오류가 발생했습니다.</h2>
                  <p>{deepError ?? '알 수 없는 오류가 발생했습니다.'}</p>
                  <button
                    onClick={() => window.location.reload()}
                    style={{
                      marginTop: '20px',
                      background: '#ff5252',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      color: '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    다시 시도
                  </button>
                </>
              )}

              {deepStatus === 'complete' && deepResults && (
                <div
                  style={{
                    marginTop: '40px',
                    textAlign: 'left',
                    maxWidth: '800px',
                    margin: '40px auto'
                  }}
                >
                  <h1>심층 예측 결과</h1>

                  {/* PHQ-2 Forecast */}
                  <div style={{ marginTop: '24px' }}>
                    <h3>📈 PHQ-2 예측</h3>
                    <pre
                      style={{
                        background: '#283593',
                        padding: '12px',
                        borderRadius: '6px',
                        color: '#fff',
                        overflowX: 'auto'
                      }}
                    >
                   {/**   {JSON.stringify(deepResults.phq2_prediction, null, 2)}  */} 
                    </pre>
                    <p>현재 PHQ-2: {deepResults.current_phq2}</p>
                    <p>PHQ-2 편차: {deepResults.phq2_deviance}</p>
                  </div>

                  {/* GAD-2 Forecast */}
                  <div style={{ marginTop: '24px' }}>
                    <h3>📈 GAD-2 예측</h3>
                    <pre
                      style={{
                        background: '#283593',
                        padding: '12px',
                        borderRadius: '6px',
                        color: '#fff',
                        overflowX: 'auto'
                      }}
                    >
                   {/**        {JSON.stringify(deepResults.gad2_prediction, null, 2)}  */}  
                    </pre>
                    <p>현재 GAD-2: {deepResults.current_gad2}</p>
                    <p>GAD-2 편차: {deepResults.gad2_deviance}</p>
                  </div>

                  {/* Mood & Anxiety Write-Up */}
                               <pre
                      style={{
                        background: '#283593',
                        padding: '12px',
                        borderRadius: '6px',
                        color: '#fff',
                        overflowX: 'auto'
                      }}
                    ></pre>
                  <div style={{ marginTop: '24px' }}>
                    <h3>🧠 감정 분석</h3>
                    <p>{deepResults.mood_analysis}</p>
                  </div>
                               <pre
                      style={{
                        background: '#283593',
                        padding: '12px',
                        borderRadius: '6px',
                        color: '#fff',
                        overflowX: 'auto'
                      }}
                    ></pre>
                  <div style={{ marginTop: '16px' }}>
                    <h3>😟 불안감 분석</h3>
                    <p>{deepResults.anxiety_analysis}</p>
                  </div>

                   {/* ───────────────────────────────────────────────────────────
           D) Deep mood/anxiety analysis section repeated (if you still
           want a separate “deep‐section” below—otherwise the above block
           already shows deepResults when done)
      ─────────────────────────────────────────────────────────── */}

                 <pre
                      style={{
                        background: '#283593',
                        padding: '12px',
                        borderRadius: '6px',
                        color: '#fff',
                        overflowX: 'auto'
                      }}
                    ></pre>
      {coupangStatus === 'complete' && (
        <div className="deep-section" style={{ marginTop: 40, padding: 20 }}>
          <h2 className="section-header">심층 예측 분석</h2>

          {deepStatus !== 'complete' ? (
            <>
              <p>...심층 분석 진행 중입니다 ({deepProgress}%)</p>
              <progress value={deepProgress} max="100" style={{ width: '100%' }} />
              <ul style={{ marginTop: '12px' }}>
                {tips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </>
          ) : !deepResults ? (
            <p>심층 분석 결과를 불러오는 중… </p>

          ) : (
            <div>
              {/* Emotional Fitness */}
              <div style={{ marginBottom: 20 }}>
                {deepResults.emotional_fitness ? (
                  <p style={{ color: 'green' }}>✅ 현재 감정 상태가 업무 가능 수준입니다.</p>
                ) : (
                  <p style={{ color: 'red' }}>⚠️ 현재 감정 상태가 불안정합니다. 휴식을 고려하세요.</p>
                )}
              </div>

              {/* PHQ-2 Predictions Chart */}
              <div style={{ marginBottom: 20 }}>
                <h4>PHQ-2 예측 vs 실제</h4>
                <Line
                  data={{
                    labels: deepResults.phq2_prediction.map((_, i) => `Day ${i + 1}`),
                    datasets: [
                      {
                        label: '예측 PHQ-2',
                        data: deepResults.phq2_prediction,
                        borderColor: 'rgba(75,192,192,1)',
                        fill: false,
                        borderDash: [5, 5]
                      },
                      {
                        label: '실제 PHQ-2',
                        data: deepResults.actual_phq2_scores,
                        borderColor: 'rgba(255,99,132,1)',
                        fill: false
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    scales: {
                      x: { display: true, title: { display: true, text: 'Day' } },
                      y: { display: true, title: { display: true, text: 'Score' } }
                    },
                    plugins: { legend: { position: 'bottom' } }
                  }}
                />
                <p>현재 PHQ-2 점수: {deepResults.current_phq2}</p>
                <p>PHQ-2 편차: {deepResults.phq2_deviance}</p>
              </div>
           <pre
                      style={{
                        background: '#283593',
                        padding: '12px',
                        borderRadius: '6px',
                        color: '#fff',
                        overflowX: 'auto'
                      }}
                    ></pre>
              {/* GAD-2 Predictions Chart */}
              <div style={{ marginBottom: 20 }}>
                <h4>GAD-2 예측 vs 실제</h4>
                <Line
                  data={{
                    labels: deepResults.gad2_prediction.map((_, i) => `Day ${i + 1}`),
                    datasets: [
                      {
                        label: '예측 GAD-2',
                        data: deepResults.gad2_prediction,
                        borderColor: 'rgba(75,192,192,1)',
                        fill: false,
                        borderDash: [5, 5]
                      },
                      {
                        label: '실제 GAD-2',
                        data: deepResults.actual_gad2_scores,
                        borderColor: 'rgba(255,99,132,1)',
                        fill: false
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    scales: {
                      x: { display: true, title: { display: true, text: 'Day' } },
                      y: { display: true, title: { display: true, text: 'Score' } }
                    },
                    plugins: { legend: { position: 'bottom' } }
                  }}
                />
                <p>현재 GAD-2 점수: {deepResults.current_gad2}</p>
                <p>GAD-2 편차: {deepResults.gad2_deviance}</p>
              </div>
           <pre
                      style={{
                        background: '#283593',
                        padding: '12px',
                        borderRadius: '6px',
                        color: '#fff',
                        overflowX: 'auto'
                      }}
                    ></pre>
              <div style={{ marginTop: 20 }}>
                <p>감정분석: {deepResults.mood_analysis}</p>
                <p>불안정도 분석: {deepResults.anxiety_analysis}</p>
              </div>
                   {/* A button to move on to CalculatingPage */}
         
            </div>
          )}
  </div>
      )}
      

                  {/* “완료” 버튼 (필요 시 다른 페이지로 이동) */}
                  <div style={{ marginTop: '32px', textAlign: 'center' }}>
                    <button
                      onClick={() => navigate('/somewhere-else')}
                      style={{
                        background: '#43a047',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '16px',
                        cursor: 'pointer'
                      }}
                    >
                      완료
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

     
        

      <div style={{ marginTop: 40, textAlign: 'center' }}>
        <button onClick={() => navigate('/questions')} className="button">
          돌아가기
        </button>
      </div>
            <div className="footer">
        <p>© Szupia, Inc. 2019</p>
      </div>
    </div>
  );
}
