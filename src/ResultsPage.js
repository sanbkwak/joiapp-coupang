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
// Import AppLayout components
import AppLayout, { AppSection, AppButton, AppStatusMessage } from './components/layout/AppLayout';


 import { getAuthToken } from './utils/authUtility';


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
//  const API_URL = 'http://localhost:8080';
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

const makeAuthenticatedRequest = async (url, options = {}) => {
  const token = getAuthToken();
  if (!token) {
    navigate('/login'); // Changed from '/' to '/login'
    return;
  }
  
  try {
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
      navigate('/login');
      return;
    }
    
    return response;
  } catch (error) {
    console.error('Network error:', error);
    throw error;
  }
};



      // ─── When userId changes (or on mount), load all histories ───────────
  useEffect(() => {
    if (!userId) return;
    fetchEmotionHistories(userId);
    fetchPhqGadHistories(userId);
  }, [userId]);

useEffect(() => {
  const token = getAuthToken();
  if (token) {
    const user_id = localStorage.getItem('user_id');
    setUserId(user_id);
    // Remove fetchFirestoreData call since you're using Flask backend
  } else {
    navigate('/');
  }
}, [navigate]);

  // Fetch Firestore “answers” collections for the four scales
   

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
       const res = await makeAuthenticatedRequest(`${API_URL}/api/v1/coupang/status`);
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
              const res = await makeAuthenticatedRequest(
          `${API_URL}/api/v1/coupang/initial_suggestions`
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
      const quickRes = await makeAuthenticatedRequest(
        `${API_URL}/api/v1/coupang/analysis_results`
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
      const res = await makeAuthenticatedRequest(`${API_URL}/api/v1/coupang/analysis_results`);
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
        const res = await makeAuthenticatedRequest(`${API_URL}/api/v1/coupang/analyze/queue`, {
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
       const progRes = await makeAuthenticatedRequest(`${API_URL}/api/v1/coupang/analysis_progress`);

        if (!progRes.ok) {
          throw new Error(`Progress fetch failed: ${progRes.status}`);
        }
          const { progress, status } = await progRes.json();
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
        const res = await makeAuthenticatedRequest(`${API_URL}/api/v1/coupang/analysis_results`);
        if (!res.ok) {
          throw new Error(`Deep results fetch failed: ${res.status}`);
        }
        const data = await res.json();
        setDeepResults(data);
            const progRes = await makeAuthenticatedRequest(`${API_URL}/api/v1/coupang/analysis_progress`);
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
 const LoadingSpinner = ({ message = "Loading..." }) => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '40px',
      gap: '16px'
    }}>
      <div style={{
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #2563eb',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        animation: 'spin 1s linear infinite'
      }} />
      <p style={{
        color: '#6b7280',
        fontSize: '16px',
        margin: 0
      }}>
        {message}
      </p>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
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

  // Results Summary Card
  const ResultsCard = ({ title, children, variant = 'default' }) => {
    const variants = {
      default: { backgroundColor: '#f9fafb', borderColor: '#e5e7eb' },
      primary: { backgroundColor: '#eff6ff', borderColor: '#3b82f6' },
      success: { backgroundColor: '#f0fdf4', borderColor: '#22c55e' },
      warning: { backgroundColor: '#fffbeb', borderColor: '#f59e0b' }
    };

    return (
      <AppSection style={{
        padding: '24px',
        marginBottom: '24px',
        border: `1px solid ${variants[variant].borderColor}`,
        backgroundColor: variants[variant].backgroundColor,
        borderRadius: '12px'
      }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: '600',
          color: '#111827',
          marginBottom: '16px',
          textAlign: 'center'
        }}>
          {title}
        </h2>
        {children}
      </AppSection>
    );
  };
const ChartContainer = ({ title, children, description }) => (
    <AppSection style={{
      padding: '24px',
      marginBottom: '24px',
      border: '1px solid #e5e7eb',
      borderRadius: '12px'
    }}>
      <h3 style={{
        fontSize: '18px',
        fontWeight: '600',
        color: '#111827',
        marginBottom: description ? '8px' : '16px'
      }}>
        {title}
      </h3>
      {description && (
        <p style={{
          fontSize: '14px',
          color: '#6b7280',
          marginBottom: '16px'
        }}>
          {description}
        </p>
      )}
      <div style={{ height: '300px', position: 'relative' }}>
        {children}
      </div>
    </AppSection>
  );
  // ─────────────────────────────────────────────────────────────
  // 13) RENDER
return (
   <AppLayout maxWidth={1000}>
      {/* Custom Header */}
      <AppSection style={{
        padding: '16px 24px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div
          onClick={() => navigate('/dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            gap: '12px'
          }}
        >
          <img
            src={JoiAppLogo}
            alt="JoiApp Logo"
            style={{ height: '32px' }}
          />
          <span style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#111827'
          }}>
            JoiApp
          </span>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Link
            to="/settings"
            style={{
              fontSize: '14px',
              textDecoration: 'none',
              color: '#6b7280',
              fontWeight: '500'
            }}
          >
            설정
          </Link>
          <AppButton onClick={logout} variant="secondary">
            로그아웃
          </AppButton>
        </div>
      </AppSection>

      {/* Page Title */}
      <AppSection style={{ padding: '24px', textAlign: 'center' }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#111827',
          marginBottom: '8px'
        }}>
          결과 추이 분석
        </h1>
        {userId && (
          <p style={{
            fontSize: '14px',
            color: '#6b7280'
          }}>
            User ID: {userId}
          </p>
        )}
      </AppSection>

      {/* Status Messages */}
      {coupangStatus === 'in_progress' && (
        <AppStatusMessage
          message="분석이 진행 중입니다..."
          type="info"
        />
      )}
      {deepStatus === 'error' && (
        <AppStatusMessage
          message={`분석 중 오류가 발생했습니다: ${deepError || '알 수 없는 오류'}`}
          type="error"
        />
      )}

      {/* Main Content */}
      <AppSection style={{ padding: '0 24px 24px' }}>
        {/* Three-way branch logic */}
        {(gad2Data.length === 0 && phq2Data.length === 0) ? (
          // Case 1: First-time user
          <>
            <ChartContainer title="GAD-7 — 불안 척도 (7문항)">
              {gad7Data.length > 0 ? (
                <Line data={gad7SummaryData} options={chartOptions} />
              ) : (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: '#6b7280'
                }}>
                  아직 불안 척도 결과가 없습니다.
                </div>
              )}
            </ChartContainer>

            <ChartContainer title="PHQ-9 — 우울 척도 (9문항)">
              {phq9Data.length > 0 ? (
                <Line data={phq9SummaryData} options={chartOptions} />
              ) : (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: '#6b7280'
                }}>
                  아직 우울 척도 결과가 없습니다.
                </div>
              )}
            </ChartContainer>

            {/* Score Summary */}
            <ResultsCard title="최근 점수 요약" variant="primary">
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                textAlign: 'center'
              }}>
                <div>
                  <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 4px 0' }}>
                    최근 PHQ-9 총점
                  </p>
                  <p style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>
                    {phq9TotalScore}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 4px 0' }}>
                    최근 GAD-7 총점
                  </p>
                  <p style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>
                    {gad7TotalScore}
                  </p>
                </div>
              </div>
            </ResultsCard>

            {/* Detail Charts */}
            {phq9Labels.length > 0 && (
              <ChartContainer title="PHQ-9 세부 문항 응답">
                <Bar
                  data={{
                    labels: phq9Labels,
                    datasets: [{
                      label: '응답 점수',
                      data: phq9Values,
                      backgroundColor: '#3b82f6'
                    }]
                  }}
                  options={{
                    ...chartOptions,
                    indexAxis: 'y',
                    scales: { x: { beginAtZero: true } },
                    plugins: { legend: { display: false } }
                  }}
                />
              </ChartContainer>
            )}

            {gad7Labels.length > 0 && (
              <ChartContainer title="GAD-7 세부 문항 응답">
                <Bar
                  data={{
                    labels: gad7Labels,
                    datasets: [{
                      label: '응답 점수',
                      data: gad7Values,
                      backgroundColor: '#f59e0b'
                    }]
                  }}
                  options={{
                    ...chartOptions,
                    indexAxis: 'y',
                    scales: { x: { beginAtZero: true } },
                    plugins: { legend: { display: false } }
                  }}
                />
              </ChartContainer>
            )}

            {/* Initial Suggestion */}
            {deepStatus === 'complete_initial' && initialSuggestion && (
              <ResultsCard title="초기 제안" variant="success">
                <p style={{
                  lineHeight: 1.6,
                  color: '#374151',
                  margin: 0
                }}>
                  {initialSuggestion}
                </p>
              </ResultsCard>
            )}

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              marginTop: '32px'
            }}>
              <AppButton onClick={() => navigate('/calculating')}>
                완료
              </AppButton>
            </div>
          </>

        ) : (gad2Data.length < 5 || phq2Data.length < 5) ? (
          // Case 2: Insufficient data
          <>
            <ChartContainer title="GAD-2 — 지난 세션 불안검사">
              <Line
                data={{
                  ...processChartData(gad2Data),
                  labels: gad2Data.map((_, i) => `Session ${i + 1}`)
                }}
                options={sessionChartOptions}
              />
            </ChartContainer>

            <ChartContainer title="PHQ-2 — 지난 세션 우울검사">
              <Line
                data={{
                  ...processChartData(phq2Data),
                  labels: phq2Data.map((_, i) => `Session ${i + 1}`)
                }}
                options={sessionChartOptions}
              />
            </ChartContainer>

            {/* Loading or Suggestion */}
            {initialLoading ? (
              <ResultsCard title="초기 제안 로딩 중..." variant="primary">
                <LoadingSpinner message="분석 중입니다..." />
              </ResultsCard>
            ) : deepStatus === "complete_initial" && initialSuggestion && (
              <ResultsCard title="초기 제안" variant="success">
                <p style={{
                  lineHeight: 1.6,
                  color: '#374151',
                  margin: 0
                }}>
                  {initialSuggestion}
                </p>
              </ResultsCard>
            )}

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              marginTop: '32px'
            }}>
              <AppButton onClick={() => navigate('/dashboard')}>
                완료
              </AppButton>
            </div>
          </>

        ) : (
          // Case 3: Full analysis
          <>
            <ChartContainer title="GAD-2 — 지난 7번의 불안검사">
              <Line
                data={{
                  ...processChartData(gad2Last7),
                  labels: gad2Last7.map((_, i) => `Session ${i + 1}`)
                }}
                options={sessionChartOptions}
              />
            </ChartContainer>

            <ChartContainer title="PHQ-2 — 지난 7번의 감정검사">
              <Line
                data={{
                  ...processChartData(phq2Last7),
                  labels: phq2Last7.map((_, i) => `Session ${i + 1}`)
                }}
                options={sessionChartOptions}
              />
            </ChartContainer>

            {/* Loading State */}
            {deepStatus === 'in_progress' && (
              <ResultsCard title="심층 예측 분석 진행 중..." variant="primary">
                <LoadingSpinner message="잠시만 기다려주세요." />
                <div style={{ marginTop: '24px' }}>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#111827',
                    marginBottom: '12px'
                  }}>
                    분석하는 동안 읽어보세요:
                  </h4>
                  <ul style={{
                    color: '#6b7280',
                    lineHeight: 1.6,
                    paddingLeft: '20px'
                  }}>
                    {tips.map((tip, idx) => (
                      <li key={idx} style={{ marginBottom: '8px' }}>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </ResultsCard>
            )}

            {/* Deep Analysis Results */}
            {deepStatus === 'complete' && deepResults && (
              <>
                <ChartContainer title="PHQ-2 예측 vs 실제">
                  <Line
                    data={{
                      labels: deepResults.phq2_prediction.map((_, i) => `Session ${i + 1}`),
                      datasets: [
                        {
                          label: '예측 PHQ-2',
                          data: deepResults.phq2_prediction,
                          borderColor: '#10b981',
                          fill: false,
                          borderDash: [5, 5]
                        },
                        {
                          label: '실제 PHQ-2',
                          data: deepResults.actual_phq2_scores,
                          borderColor: '#ef4444',
                          fill: false
                        }
                      ]
                    }}
                    options={sessionChartOptions}
                  />
                  <div style={{
                    marginTop: '16px',
                    padding: '12px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '6px'
                  }}>
                    <p style={{ margin: '0 0 4px 0', color: '#374151' }}>
                      현재 PHQ-2 점수: <strong>{deepResults.current_phq2}</strong>
                    </p>
                    <p style={{ margin: 0, color: '#374151' }}>
                      PHQ-2 편차: <strong>{deepResults.phq2_deviance}</strong>
                    </p>
                  </div>
                </ChartContainer>

                <ChartContainer title="GAD-2 예측 vs 실제">
                  <Line
                    data={{
                      labels: deepResults.gad2_prediction.map((_, i) => `Session ${i + 1}`),
                      datasets: [
                        {
                          label: '예측 GAD-2',
                          data: deepResults.gad2_prediction,
                          borderColor: '#10b981',
                          fill: false,
                          borderDash: [5, 5]
                        },
                        {
                          label: '실제 GAD-2',
                          data: deepResults.actual_gad2_scores,
                          borderColor: '#ef4444',
                          fill: false
                        }
                      ]
                    }}
                    options={sessionChartOptions}
                  />
                  <div style={{
                    marginTop: '16px',
                    padding: '12px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '6px'
                  }}>
                    <p style={{ margin: '0 0 4px 0', color: '#374151' }}>
                      현재 GAD-2 점수: <strong>{deepResults.current_gad2}</strong>
                    </p>
                    <p style={{ margin: 0, color: '#374151' }}>
                      GAD-2 편차: <strong>{deepResults.gad2_deviance}</strong>
                    </p>
                  </div>
                </ChartContainer>

                {/* Summary */}
                <ResultsCard title="검사 트렌드 요약" variant="success">
                  {summaryText && (
                    <div style={{
                      padding: '16px',
                      backgroundColor: '#f0f9ff',
                      borderRadius: '8px',
                      marginBottom: '24px'
                    }}>
                      <h4 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#111827',
                        marginBottom: '8px'
                      }}>
                        요약 의견
                      </h4>
                      <p style={{
                        color: '#374151',
                        lineHeight: 1.6,
                        margin: 0
                      }}>
                        {summaryText}
                      </p>
                    </div>
                  )}

                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'center'
                  }}>
                    <AppButton
                      onClick={() => navigate('/action-items')}
                      variant="primary"
                    >
                      맞춤 액션 아이템 보기
                    </AppButton>
                    <AppButton
                      onClick={() => navigate('/dashboard')}
                      variant="secondary"
                    >
                      대시보드로
                    </AppButton>
                  </div>
                </ResultsCard>
              </>
            )}
          </>
        )}
      </AppSection>
    </AppLayout>
  );
 
 

 
}