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
import { Line, Bar }              from 'react-chartjs-2';
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

import tips                 from './mentalHealthTips.js';
import { useLogout }        from './utils/logout.js';
import JoiAppLogo           from './joiapplogo.png';
import './css/ResultsPage.css';
import { Link } from 'react-router-dom';
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
// const API_URL = 'http://localhost:8080';
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
  const [coupangStatus,    setCoupangStatus]    = useState('in_progress');    // 'pending' | 'in_progress' | 'complete' | 'error'
         // { dominant_facial_emotions, dominant_voice_emotions, safety_ok, gad2History, phq2History, summary }
  const [quickError,       setQuickError]       = useState(null);

  // ─────────────────────────────────────────────────────────────
  // 3) Deep analysis state
  // ─────────────────────────────────────────────────────────────
  const [deepProgress, setDeepProgress] = useState(0);       // 0–100
  const [deepResults,  setDeepResults]  = useState(null);    // final payload from /coupang/analysis_results
  const [deepStatus,   setDeepStatus]   = useState('not_started'); // 'not_started' | 'queued' | 'in_progress' | 'complete' | 'error'
  const [deepError,    setDeepError]    = useState(null);

  // initial‐user suggestions
  const [initialSuggestion, setInitialSuggestion] = useState(null);
const [initialLoading, setInitialLoading] = useState(false);

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

// helper to sum the answers object into a total score
const getTotalScore = entry =>
  entry && entry.answers
    ? Object.values(entry.answers).reduce((sum, v) => sum + Number(v), 0)
    : null;

// grab the latest PHQ-9 & GAD-7 entries (they’re ordered descending)
// Pull the most recent entry (they’re ordered desc by timestamp)
const latestPhq9Entry = phq9Data[0] || null;
const latestGad7Entry = gad7Data[0] || null;

// Helper: raw answers map or empty
const phq9Answers = latestPhq9Entry?.answers || {};
const gad7Answers = latestGad7Entry?.answers || {};

// Per-question labels & values
const phq9Labels = Object.keys(phq9Answers);
const phq9Values = Object.values(phq9Answers).map(v => Number(v));

const gad7Labels = Object.keys(gad7Answers);
const gad7Values = Object.values(gad7Answers).map(v => Number(v));

// Total scores (use stored field if present, else sum the answers)
const phq9TotalScore =
  latestPhq9Entry?.phq9_total_score ??
  phq9Values.reduce((sum, val) => sum + val, 0);

const gad7TotalScore =
  latestGad7Entry?.gad7_total_score ??
  gad7Values.reduce((sum, val) => sum + val, 0);


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
        console.log('🔍 fetched GAD-2 count:', gad2.length);
    console.log('🔍 fetched PHQ-2 count:', phq2.length);
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
    // once we have the raw PHQ2/GAD2 …
  
    useEffect(() => {
  if (!userId) return;

  // wrap async work in an IIFE
  (async () => {
    try {
      // 1) If <5 sessions, skip Coupang & get initial suggestions
      if (gad2Data.length < 5 || phq2Data.length < 5) {
        setInitialLoading(true);
        const res = await fetch(
          `${API_URL}/coupang/initial_suggestions?userId=${encodeURIComponent(userId)}`
        );
        const json = await res.json();
        if (json.suggestion) {
          setInitialSuggestion(json.suggestion);
          setDeepStatus("complete_initial");
        } else {
          throw new Error(json.error ?? "No suggestion returned");
        }
        return; // skip the rest
      }

      // 2) Otherwise proceed as before:
      // fetch quick results then enqueue deep analysis
      const quickRes = await fetch(
        `${API_URL}/coupang/results?userId=${encodeURIComponent(userId)}`
      );
      if (!quickRes.ok) {
        throw new Error(`Failed to fetch coupang results: ${quickRes.status}`);
      }
      const quickJson = await quickRes.json();
      setCoupangResults(quickJson);
      triggerDeepAnalysis();

    } catch (err) {
      console.error("Initial branch error:", err);
      setDeepError(err.message);
      setDeepStatus("error");
    }
      finally {
     setInitialLoading(false);
    }
  })();
}, [userId, gad2Data, phq2Data]);


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
          const { progress, status } = await res.json();
          setDeepProgress(progress);

          // If the analysis thread hit an error, stop polling and show error UI
          if (status === 'error_deep') {
            clearInterval(id);
            setDeepStatus('error');
            return;
          }

          // Otherwise, on completion
          if (status === 'complete_deep' || progress >= 100) {
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
            const progRes = await fetch(`${API_URL}/coupang/analysis_progress?userId=${userId}`);
       const { summary } = await progRes.json();
       if (summary) setSummaryText(summary);
      } catch (err) {
        console.error('Error fetching deep analysis results:', err);
         setDeepError(err.message);
       setDeepStatus('error');
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

  // just above your `return (...)`
const gad7SummaryData = {
  labels: gad7Data.map(d => new Date(d.timestamp.seconds * 1000)),
  datasets: [{
    label: '총 GAD-7 점수',
    data: gad7Data.map(
      d => d.score ?? Object.values(d.answers).reduce((a, v) => a + Number(v), 0)
    ),
    fill: false,
    borderColor: '#FFCA28',
    tension: 0.1
  }]
};

const phq9SummaryData = {
  labels: phq9Data.map(d => new Date(d.timestamp.seconds * 1000)),
  datasets: [{
    label: '총 PHQ-9 점수',
    data: phq9Data.map(
      d => d.score ?? Object.values(d.answers).reduce((a, v) => a + Number(v), 0)
    ),
    fill: false,
    borderColor: '#66BB6A',
    tension: 0.1
  }]
};

  // ─────────────────────────────────────────────────────────────
  // 13) RENDER
return (
  <div className="container-results" style={{ paddingTop: 80 }}>
    <SpinnerKeyframes />

    {/* Header + Logout */}
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
    {/* Page Title */}
    <div style={{ textAlign: 'center', margin: '40px 0 20px' }}>
      <h1 style={{ color: '#fff', fontSize: '2rem', margin: 0 }}>
        결과 추이 분석
      </h1>
      {userId && (
        <p style={{ color: '#eee', marginTop: '8px' }}>User ID: {userId}</p>
      )}
    </div>

    <div className="card">

      {/*** Three‐way branch ***/}
      { (gad2Data.length === 0 && phq2Data.length === 0) ? (
        // Case 1: First-time user – show GAD-7/PHQ-9 + suggestion
      <>
          <div className="chart-container">
            <h3>GAD-7 – 불안 척도 (7문항)</h3>
            {gad7Data.length > 0 ? (
              <Line data={gad7SummaryData} options={chartOptions} />
            ) : (
              <p style={{ color: '#eee' }}>
                아직 불안 척도 결과가 없습니다.
              </p>
            )}
          </div>

          <div className="chart-container">
            <h3>PHQ-9 – 우울 척도 (9문항)</h3>
            {phq9Data.length > 0 ? (
              <Line data={phq9SummaryData} options={chartOptions} />
            ) : (
              <p style={{ color: '#eee' }}>
                아직 우울 척도 결과가 없습니다.
              </p>
            )}
          </div>

      {/* — show their raw totals too, if desired — */}
    <div style={{ textAlign: 'center', marginBottom: 24, color: '#fff' }}>
      {latestPhq9Entry && (
        <p>최근 PHQ-9 총점: <strong>{phq9Values.reduce((a,b)=>a+b,0)}</strong></p>
      )}
      {latestGad7Entry && (
        <p>최근 GAD-7 총점: <strong>{gad7Values.reduce((a,b)=>a+b,0)}</strong></p>
      )}
    </div>

 {/* show the numeric totals */}
    <div style={{ textAlign:'center', marginBottom:24, color:'#fff' }}>
      <p>최근 PHQ-9 총점: <strong>{phq9TotalScore}</strong></p>
      <p>최근 GAD-7 총점: <strong>{gad7TotalScore}</strong></p>
    </div>

    {/* per-question bar chart for PHQ-9 */}
    <div className="chart-container">
      <h3>PHQ-9 세부 문항 응답</h3>
      <Bar
        data={{ labels: phq9Labels, datasets: [{ label:'응답 점수', data: phq9Values }] }}
        options={{
          indexAxis: 'y',
          scales: { x:{ beginAtZero:true } },
          plugins:{ legend:{ display:false } }
        }}
      />
    </div>

            {/* per-question bar chart for GAD-7 */}
            <div className="chart-container">
            <h3>GAD-7 세부 문항 응답</h3>
            <Bar
                data={{ labels: gad7Labels, datasets: [{ label:'응답 점수', data: gad7Values }] }}
                options={{
                indexAxis: 'y',
                scales: { x:{ beginAtZero:true } },
                plugins:{ legend:{ display:false } }
                }}
            />
            </div>
     



          {deepStatus === 'complete_initial' && initialSuggestion && (
            <div style={{
              background: '#283593', color: '#fff', padding: '24px',
              borderRadius: '8px', margin: '40px auto',
              maxWidth: '700px', textAlign: 'left'
            }}>
             <h2
                style={{
                    textAlign: 'center',
                    color: '#fff',
                    marginBottom: '12px'   /* ← add bottom margin */
                }}
                >
                초기 제안
                </h2>
                <p style={{ lineHeight: 1.6, color: '#eee', marginTop: '8px' }}>
                {initialSuggestion}
                </p>
            </div>
          )}

          {/* 완료 버튼 */}
          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <button
              onClick={() => navigate('/logout')}
              style={{
                background: '#43a047', border: 'none',
                padding: '10px 20px', borderRadius: '6px',
                color: '#fff', fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              완료
            </button>
          </div>
        </>

                ) :   
                
                (gad2Data.length < 5 || phq2Data.length < 5) ? (
            <>
                {/* Always show the charts immediately */}
                <div className="chart-container">
                <h3>GAD-2 – 지난 세션 불안검사</h3>
                <Line
                    data={{
                    ...processChartData(gad2Data),
                    labels: gad2Data.map((_, i) => `Session ${i + 1}`)
                    }}
                    options={sessionChartOptions}
                />
                </div>
                <div className="chart-container">
                <h3>PHQ-2 – 지난 세션 우울검사</h3>
                <Line
                    data={{
                    ...processChartData(phq2Data),
                    labels: phq2Data.map((_, i) => `Session ${i + 1}`)
                    }}
                    options={sessionChartOptions}
                />
                </div>

                {/* Suggestion area */}
                {initialLoading ? (
                // Spinner only in suggestion area
                <div
                    style={{
                    background: "#283593",
                    color: "#fff",
                    padding: "24px",
                    borderRadius: "8px",
                    textAlign: "center",
                    margin: "40px auto",
                    maxWidth: "700px"
                    }}
                >
                    <Spinner />
                    <h2 style={{ marginTop: "16px", color: "#fff" }}>
                    초기 제안 로딩 중…
                    </h2>
                </div>
                ) : (
                // Once loaded, show the suggestion box
                deepStatus === "complete_initial" && initialSuggestion && (
                    <div
                    style={{
                        background: "#283593",
                        color: "#fff",
                        padding: "24px",
                        borderRadius: "8px",
                        margin: "40px auto",
                        maxWidth: "700px",
                        textAlign: "left"
                    }}
                    >
                    <h2
                        style={{
                        textAlign: "center",
                        color: "#fff",
                        marginBottom: "12px"
                        }}
                    >
                        초기 제안
                    </h2>
                    <p style={{ lineHeight: 1.6, color: "#eee", marginTop: "8px" }}>
                        {initialSuggestion}
                    </p>
                    </div>
                )
                )}

                {/* 완료 button always shown */}
                <div style={{ textAlign: "center", marginTop: "24px" }}>
                <button
                    onClick={() => navigate("/somewhere-else")}
                    style={{
                    background: "#43a047",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "6px",
                    color: "#fff",
                    fontSize: "16px",
                    cursor: "pointer"
                    }}
                >
                    완료
                </button>
                </div>
            </>
            )  : (
        // Case 3: Full history – run deep analysis
        <>
          {/* Last 7 Sessions */}
          <div className="chart-container">
            <h3>GAD-2 – 지난 7번의 불안검사</h3>
            <Line
              data={{
                ...processChartData(gad2Last7),
                labels: gad2Last7.map((_, i) => `Session ${i + 1}`)
              }}
              options={sessionChartOptions}
            />
          </div>
          <div className="chart-container">
            <h3>PHQ-2 – 지난 7번의 감정검사</h3>
            <Line
              data={{
                ...processChartData(phq2Last7),
                labels: phq2Last7.map((_, i) => `Session ${i + 1}`)
              }}
              options={sessionChartOptions}
            />
          </div>

          {/* Spinner */}
          {deepStatus === 'in_progress' && (
            <div style={{
              background: '#283593', color: '#fff', padding: '24px',
              borderRadius: '8px', textAlign: 'center',
              margin: '40px auto', maxWidth: '700px'
            }}>
              <Spinner />
              <h2 style={{ marginTop: '16px', color: '#fff' }}>
                심층 예측 분석 진행 중…
              </h2>
              <p style={{ color: '#ddd' }}>잠시만 기다려주세요.</p>
              <ul style={{
                textAlign: 'left', maxWidth: '600px',
                margin: '20px auto', color: '#eee'
              }}>
                {tips.map((tip, idx) => (
                  <li key={idx} style={{ marginBottom: '8px' }}>{tip}</li>
                ))}
              </ul>
              {deepError && (
                <p style={{ color: '#ffbaba', marginTop: '12px' }}>
                  오류: {deepError}
                </p>
              )}
            </div>
          )}

          {/* Error */}
          {deepStatus === 'error' && (
            <>
              <h2 style={{ color: '#ff5252' }}>
                심층 분석 중 오류가 발생했습니다.
              </h2>
              <p>{deepError ?? '알 수 없는 오류가 발생했습니다.'}</p>
              <button onClick={() => window.location.reload()} style={{
                marginTop: '20px', background: '#ff5252', border: 'none',
                padding: '8px 16px', borderRadius: '4px', color: '#fff',
                cursor: 'pointer'
              }}>
                다시 시도
              </button>
            </>
          )}

          {/* Predictions & Summary */}
          {deepStatus === 'complete' && deepResults && (
            <>
              {/* PHQ-2 Prediction */}
              <div className="chart-container">
                <h3>PHQ-2 예측 vs 실제</h3>
                <Line
                  data={{
                    labels: deepResults.phq2_prediction.map((_, i) =>
                      `Session ${i + 1}`),
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
                      x: { display: true, title: { display: true, text: 'Session' } },
                      y: { display: true, title: { display: true, text: 'Score' } }
                    },
                    plugins: { legend: { position: 'bottom' } }
                  }}
                />
                <p>현재 PHQ-2 점수: {deepResults.current_phq2}</p>
                <p>PHQ-2 편차: {deepResults.phq2_deviance}</p>
              </div>

              {/* GAD-2 Prediction */}
              <div className="chart-container">
                <h3>GAD-2 예측 vs 실제</h3>
                <Line
                  data={{
                    labels: deepResults.gad2_prediction.map((_, i) =>
                      `Session ${i + 1}`),
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
                      x: { display: true, title: { display: true, text: 'Session' } },
                      y: { display: true, title: { display: true, text: 'Score' } }
                    },
                    plugins: { legend: { position: 'bottom' } }
                  }}
                />
                <p>현재 GAD-2 점수: {deepResults.current_gad2}</p>
                <p>GAD-2 편차: {deepResults.gad2_deviance}</p>
              </div>

              {/* Trend Summary */}
              <div style={{
                marginTop: 40, background: '#283593',
                padding: '20px', borderRadius: '8px',
                color: '#fff', textAlign: 'left'
              }}>
                <h2 style={{ textAlign: 'center' }}>검사 트렌드 요약</h2>
                {phq2History.length > 1 && gad2History.length > 1 ? (
                  <>
                    {/* trend summary logic… */}
                    {summaryText && (
                      <div style={{
                        marginTop: 20, background: '#3949ab',
                        padding: '12px', borderRadius: '6px',
                        color: '#fff'
                      }}>
                        <h4 style={{ margin: 0 }}>요약 의견</h4>
                        <p style={{ margin: '8px 0 0' }}>
                          {summaryText}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <p style={{ textAlign: 'center' }}>
                    충분한 이력 데이터가 없습니다.
                  </p>
                )}
              </div>

              {/* 완료 버튼 */}
              <div style={{ marginTop: '32px', textAlign: 'center' }}>
                <button onClick={() => navigate('/somewhere-else')} style={{
                  background: '#43a047', border: 'none',
                  padding: '10px 20px', borderRadius: '6px',
                  color: '#fff', fontSize: '16px', cursor: 'pointer'
                }}>
                  완료
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  </div>
);


 
}