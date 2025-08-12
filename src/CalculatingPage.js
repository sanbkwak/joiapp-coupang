import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement } from 'chart.js';
import { auth } from './firebaseConfig'; // Ensure you import Firebase auth
import { onAuthStateChanged } from 'firebase/auth';
import { Link } from 'react-router-dom';
import { useLogout } from './utils/logout.js';
import JoiAppLogo from './joiapplogo.png'; 
import './css/CalculatingPage.css';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement);

const CalculatingPage = () => {
    const navigate = useNavigate();
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const logout = useLogout();

    const [userId, setUserId] = useState(null);
    const [emotionalFitness, setEmotionalFitness] = useState(null);

    const assessEmotionalFitness = (result) => {
        const DEVIANCE_THRESHOLD = 1.5;
        const MOOD_THRESHOLD = 0;
        const FACIAL_VOICE_THRESHOLD = 0;
      
        const emotionallyFit =
          Math.abs(result.phq2_deviance) < DEVIANCE_THRESHOLD &&
          Math.abs(result.gad2_deviance) < DEVIANCE_THRESHOLD;
      
        const moodStable = result.mood_analysis >= MOOD_THRESHOLD;
        const anxietyStable = result.anxiety_analysis >= MOOD_THRESHOLD;
        const facialVoiceStable = (result.facial_avg + result.voice_avg) / 2 >= FACIAL_VOICE_THRESHOLD;
      
        const emotionallyFitForWork =
          emotionallyFit && moodStable && anxietyStable && facialVoiceStable;
      
        return emotionallyFitForWork;
      };
      
      // In your component after results are fetched:
      useEffect(() => {
        if (result) {
          const isFit = assessEmotionalFitness(result);
          setEmotionalFitness(isFit);
        }
      }, [result]);
      

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                navigate('/');
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    useEffect(() => {
        if (!userId) return;

        const fetchProgress = async () => {
            try {
    //            const API_URL = "http://localhost:8080";
       const API_URL = "https://api.joiapp.org";
                const res = await fetch(`${API_URL}/prediction_progress?userId=${userId}`);
                if (res.ok) {
                    const data = await res.json();
                    setProgress(data.progress);
                    // When progress reaches 100, fetch the final result
                    if (data.progress === 100) {
                        fetchFinalResult();
                        clearInterval(progressInterval);
                    }
                } else {
                    console.error('Failed to fetch progress', await res.text());
                }
            } catch (err) {
                console.error('Error fetching progress:', err);
            }
        };

        const progressInterval = setInterval(fetchProgress, 500);
        return () => clearInterval(progressInterval);
    }, [userId]);
    useEffect(() => {
        if (!userId) return;
     //   const API_URL = "http://localhost:8080";
     const API_URL = "https://api.joiapp.org";
        // Trigger the calculation process (if not already triggered)
        const triggerCalculation = async () => {
          try {
            const res = await fetch(`${API_URL}/analyze_mood_anxiety`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId }),
            });
            if (!res.ok) {
              console.error('Failed to trigger analysis:', await res.text());
            }
          } catch (error) {
            console.error('Error triggering analysis:', error);
          }
        };
        
        triggerCalculation();
      }, [userId]);

    const fetchFinalResult = async () => {
        try {
            //const API_URL = "http://localhost:8080";
            const API_URL = "https://api.joiapp.org";
            const response = await fetch(`${API_URL}/analyze_mood_anxiety`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            });
            if (response.ok) {
                const data = await response.json();
                setResult(data);
            } else {
                console.error('Calculation failed', await response.text());
            }
        } catch (error) {
            console.error('Error calculating predictions:', error);
        }
    };


    const renderChart = (predictions, actualScores, title) => {
        const chartData = {
            labels: Array.from({ length: predictions.length }, (_, i) => `Day ${i + 1}`),
            datasets: [
                {
                    label: `${title} Predictions`,
                    data: predictions,
                    fill: false,
                    borderColor: 'rgba(75,192,192,1)',
                    backgroundColor: 'rgba(75,192,192,0.4)',
                    borderDash: [5, 5], // Dashed line for predictions
                    pointStyle: 'rectRot', // Use a different point shape
                    pointRadius: 5,
                    pointBackgroundColor: 'rgba(75,192,192,1)',
                    tension: 0.1
                },
                {
                    label: `Actual ${title} Scores`,
                    data: actualScores,
                    fill: false,
                    borderColor: 'rgba(255,99,132,1)',
                    backgroundColor: 'rgba(255,99,132,0.4)',
                    pointStyle: 'circle', // Solid circle for actual scores
                    pointRadius: 5,
                    pointBackgroundColor: 'rgba(255,99,132,1)',
                    tension: 0.1
                }
            ],
        };
    
        const options = {
            responsive: true,
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Day',
                        font: {
                            size: 16,
                            weight: 'bold',
                        },
                        color: '#333'
                    },
                    ticks: {
                        font: {
                            size: 14,
                            weight: 'bold',
                        },
                        color: '#333'
                    },
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Score',
                        font: {
                            size: 16,
                            weight: 'bold',
                        },
                        color: '#333'
                    },
                    ticks: {
                        font: {
                            size: 14,
                            weight: 'bold',
                        },
                        color: '#333'
                    },
                },
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: {
                            size: 14,
                        },
                        color: '#333'
                    }
                }
            }
        };
    
        return <Line data={chartData} options={options} />;
    };
    
    
    return (
        <div className="calculating-container">
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
            <h1 className="calculating-title">Calculating Predictions...</h1>
            <div className="progress-bar-container">
                <progress value={progress} max="100"></progress>
                <p>{progress}%</p>
            </div>
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
            {/* Display a loading spinner if result is not yet available */}
            {!result ? (
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Please wait while we calculate your predictions...</p>
                </div>
            ) : (
                <div className="result-container">
                <div className="emotional-fitness-status">
                                        {emotionalFitness !== null && (
                                            emotionalFitness ? (
                                                <p className="fit">✅ You're emotionally fit to work!</p>
                                            ) : (
                                                <p className="unfit">⚠️ You seem emotionally distressed; 
                                                consider taking a break.</p>
                                            )
                                        )}
                                    </div>

                    <div className="prediction-section">
                        <div className="phq2-section">
                            <h3>PHQ2 Predictions</h3>
                            {renderChart(result.phq2_prediction, result.actual_phq2_scores, 'PHQ2')}
                            <p>Current PHQ2 Score: {result.current_phq2}</p>
                            <p>PHQ2 Deviance: {result.phq2_deviance}</p>
                        </div>
                        <div className="gad2-section">
                            <h3>GAD2 Predictions</h3>
                            {renderChart(result.gad2_prediction, result.actual_gad2_scores, 'GAD2')}
                            <p>Current GAD2 Score: {result.current_gad2}</p>
                            <p>GAD2 Deviance: {result.gad2_deviance}</p>
                        </div>
                    </div>
                    <div className="analysis-section">
                        <p>Mood Analysis: {result.mood_analysis}</p>
                        <p>Anxiety Analysis: {result.anxiety_analysis}</p>
                    </div>
     
                    <div className="button-container">
                        <button onClick={() => navigate('/results')}>Back to Results</button>
                        <button onClick={logout}>Logout</button>
                    </div>
                </div>
            )}
        </div>
    );
};
export default CalculatingPage;
