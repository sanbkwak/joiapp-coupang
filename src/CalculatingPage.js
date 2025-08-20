import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement } from 'chart.js';
import { auth } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { Link } from 'react-router-dom';
import { useLogout } from './utils/logout.js';
import JoiAppLogo from './joiapplogo.png';

// Import AppLayout components
import AppLayout, { AppSection, AppButton, AppStatusMessage } from './components/layout/AppLayout';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement);

const CalculatingPage = () => {
    const navigate = useNavigate();
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const logout = useLogout();
    const [userId, setUserId] = useState(null);
    const [emotionalFitness, setEmotionalFitness] = useState(null);
    const [error, setError] = useState(null);
   // const API_URL = "https://api.joiapp.org";
 const API_URL = "localhost:3000";
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
      
                const res = await fetch(`${API_URL}/api/v1/prediction_progress?userId=${userId}`);
                
                if (res.ok) {
                    const data = await res.json();
                    setProgress(data.progress);
                    if (data.progress === 100) {
                        fetchFinalResult();
                        clearInterval(progressInterval);
                    }
                } else {
                    const errorText = await res.text();
                    console.error('Failed to fetch progress', errorText);
                    setError(`Failed to fetch progress: ${errorText}`);
                }
            } catch (err) {
                console.error('Error fetching progress:', err);
                setError(`Network error: ${err.message}`);
            }
        };

        const progressInterval = setInterval(fetchProgress, 500);
        return () => clearInterval(progressInterval);
    }, [userId]);

    useEffect(() => {
        if (!userId) return;

        const triggerCalculation = async () => {
            try {
      
                const res = await fetch(`${API_URL}/api/v1/analyze_mood_anxiety`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId }),
                });
                
                if (!res.ok) {
                    const errorText = await res.text();
                    console.error('Failed to trigger analysis:', errorText);
                    setError(`Failed to start analysis: ${errorText}`);
                }
            } catch (error) {
                console.error('Error triggering analysis:', error);
                setError(`Failed to start analysis: ${error.message}`);
            }
        };

        triggerCalculation();
    }, [userId]);

    const fetchFinalResult = async () => {
        try {
        
            const response = await fetch(`${API_URL}/api/v1/analyze_mood_anxiety`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            });
            
            if (response.ok) {
                const data = await response.json();
                setResult(data);
            } else {
                const errorText = await response.text();
                console.error('Calculation failed', errorText);
                setError(`Calculation failed: ${errorText}`);
            }
        } catch (error) {
            console.error('Error calculating predictions:', error);
            setError(`Calculation error: ${error.message}`);
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
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderDash: [5, 5],
                    pointStyle: 'rectRot',
                    pointRadius: 5,
                    pointBackgroundColor: '#10b981',
                    tension: 0.1
                },
                {
                    label: `Actual ${title} Scores`,
                    data: actualScores,
                    fill: false,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    pointStyle: 'circle',
                    pointRadius: 5,
                    pointBackgroundColor: '#ef4444',
                    tension: 0.1
                }
            ],
        };

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Day',
                        font: { size: 14, weight: 'bold' },
                        color: '#374151'
                    },
                    ticks: {
                        font: { size: 12 },
                        color: '#6b7280'
                    },
                    grid: { color: 'rgba(0,0,0,0.05)' }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Score',
                        font: { size: 14, weight: 'bold' },
                        color: '#374151'
                    },
                    ticks: {
                        font: { size: 12 },
                        color: '#6b7280'
                    },
                    grid: { color: 'rgba(0,0,0,0.05)' }
                },
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { size: 12 },
                        color: '#374151',
                        usePointStyle: true,
                        padding: 15
                    }
                }
            }
        };

        return (
            <div style={{ height: '300px', position: 'relative' }}>
                <Line data={chartData} options={options} />
            </div>
        );
    };

    // Loading Progress Component
    const ProgressSection = () => (
        <AppSection style={{
            padding: '40px 24px',
            textAlign: 'center',
            backgroundColor: '#f9fafb'
        }}>
            <h2 style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '24px'
            }}>
                Calculating Predictions...
            </h2>
            
            <div style={{
                width: '100%',
                maxWidth: '400px',
                margin: '0 auto 16px',
                backgroundColor: '#e5e7eb',
                borderRadius: '8px',
                overflow: 'hidden'
            }}>
                <div style={{
                    width: `${progress}%`,
                    height: '12px',
                    backgroundColor: '#2563eb',
                    borderRadius: '8px',
                    transition: 'width 0.3s ease'
                }} />
            </div>
            
            <p style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#2563eb',
                marginBottom: '16px'
            }}>
                {progress}%
            </p>
            
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                color: '#6b7280'
            }}>
                <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid #e5e7eb',
                    borderTop: '2px solid #2563eb',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }} />
                <span>Please wait while we calculate your predictions...</span>
            </div>
            
            <style>
                {`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}
            </style>
        </AppSection>
    );

    // Emotional Fitness Status Component
    const EmotionalFitnessStatus = () => {
        if (emotionalFitness === null) return null;

        return (
            <AppSection style={{
                padding: '20px',
                marginBottom: '24px',
                backgroundColor: emotionalFitness ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${emotionalFitness ? '#22c55e' : '#ef4444'}`,
                borderRadius: '12px',
                textAlign: 'center'
            }}>
                <div style={{
                    fontSize: '48px',
                    marginBottom: '12px'
                }}>
                    {emotionalFitness ? '✅' : '⚠️'}
                </div>
                <p style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: emotionalFitness ? '#15803d' : '#dc2626',
                    margin: 0
                }}>
                    {emotionalFitness 
                        ? "You're emotionally fit to work!"
                        : "You seem emotionally distressed; consider taking a break."
                    }
                </p>
            </AppSection>
        );
    };

    // Chart Section Component
    const ChartSection = ({ title, data, current, deviance }) => (
        <AppSection style={{
            padding: '24px',
            marginBottom: '24px',
            border: '1px solid #e5e7eb',
            borderRadius: '12px'
        }}>
            <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '20px',
                textAlign: 'center'
            }}>
                {title}
            </h3>
            
            {renderChart(data.prediction, data.actual, title.split(' ')[0])}
            
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginTop: '20px',
                padding: '16px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <p style={{
                        fontSize: '14px',
                        color: '#6b7280',
                        margin: '0 0 4px 0'
                    }}>
                        Current Score
                    </p>
                    <p style={{
                        fontSize: '20px',
                        fontWeight: '700',
                        color: '#111827',
                        margin: 0
                    }}>
                        {current}
                    </p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <p style={{
                        fontSize: '14px',
                        color: '#6b7280',
                        margin: '0 0 4px 0'
                    }}>
                        Deviance
                    </p>
                    <p style={{
                        fontSize: '20px',
                        fontWeight: '700',
                        color: Math.abs(deviance) > 1.5 ? '#ef4444' : '#10b981',
                        margin: 0
                    }}>
                        {deviance?.toFixed(2)}
                    </p>
                </div>
            </div>
        </AppSection>
    );

    return (
        <AppLayout maxWidth={1000}>
            {/* Header */}
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

            {/* Error Message */}
            {error && (
                <AppStatusMessage
                    message={error}
                    type="error"
                    onClose={() => setError(null)}
                />
            )}

            {/* Main Content */}
            {!result ? (
                <ProgressSection />
            ) : (
                <AppSection style={{ padding: '24px' }}>
                    <EmotionalFitnessStatus />
                    
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                        gap: '24px',
                        marginBottom: '32px'
                    }}>
                        <ChartSection
                            title="PHQ2 Predictions"
                            data={{
                                prediction: result.phq2_prediction,
                                actual: result.actual_phq2_scores
                            }}
                            current={result.current_phq2}
                            deviance={result.phq2_deviance}
                        />
                        
                        <ChartSection
                            title="GAD2 Predictions"
                            data={{
                                prediction: result.gad2_prediction,
                                actual: result.actual_gad2_scores
                            }}
                            current={result.current_gad2}
                            deviance={result.gad2_deviance}
                        />
                    </div>

                    {/* Analysis Summary */}
                    <AppSection style={{
                        padding: '24px',
                        marginBottom: '32px',
                        backgroundColor: '#f0f9ff',
                        border: '1px solid #3b82f6',
                        borderRadius: '12px'
                    }}>
                        <h3 style={{
                            fontSize: '18px',
                            fontWeight: '600',
                            color: '#111827',
                            marginBottom: '16px',
                            textAlign: 'center'
                        }}>
                            Analysis Summary
                        </h3>
                        
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '16px'
                        }}>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{
                                    fontSize: '14px',
                                    color: '#6b7280',
                                    margin: '0 0 4px 0'
                                }}>
                                    Mood Analysis
                                </p>
                                <p style={{
                                    fontSize: '18px',
                                    fontWeight: '600',
                                    color: '#111827',
                                    margin: 0
                                }}>
                                    {result.mood_analysis?.toFixed(2)}
                                </p>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{
                                    fontSize: '14px',
                                    color: '#6b7280',
                                    margin: '0 0 4px 0'
                                }}>
                                    Anxiety Analysis
                                </p>
                                <p style={{
                                    fontSize: '18px',
                                    fontWeight: '600',
                                    color: '#111827',
                                    margin: 0
                                }}>
                                    {result.anxiety_analysis?.toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </AppSection>

                    {/* Action Buttons */}
                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        justifyContent: 'center'
                    }}>
                        <AppButton
                            onClick={() => navigate('/results')}
                            variant="primary"
                        >
                            Back to Results
                        </AppButton>
                        <AppButton
                            onClick={logout}
                            variant="secondary"
                        >
                            Logout
                        </AppButton>
                    </div>
                </AppSection>
            )}
        </AppLayout>
    );
};

export default CalculatingPage;