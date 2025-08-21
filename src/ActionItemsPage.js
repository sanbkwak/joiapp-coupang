// src/coupang/ActionItemsPage.js
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from './firebaseConfig.js';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, getDocs, orderBy, doc, setDoc, getDoc } from 'firebase/firestore';
import { useLogout } from './utils/logout.js';
import JoiAppLogo from './joiapplogo.png';
import './css/ActionItemsPage.css';
import { Link } from 'react-router-dom';
import { getAuthToken } from './utils/authUtility';
// If running locally, uncomment next line and comment out the prod URL.
// const API_URL = 'http://localhost:8080';
const API_URL = 'https://api.joiapp.org';

export default function ActionItemsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useLogout();

  const [userId, setUserId] = useState(null);
  const [actionItems, setActionItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completedItems, setCompletedItems] = useState(new Set());
  const [deepResults, setDeepResults] = useState(null);
  const [currentMoodLevel, setCurrentMoodLevel] = useState('stable');
  const [refreshing, setRefreshing] = useState(false);
const makeAuthenticatedRequest = async (url, options = {}) => {
  const token = getAuthToken();
  if (!token) {
    navigate('/');
    return;
  }
  
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
    navigate('/');
    return;
  }
  
  return response;
};
  // Auth check
useEffect(() => {
  const token = getAuthToken();
  if (token) {
    const user_id = localStorage.getItem('user_id');
    setUserId(user_id);
  } else {
    navigate('/');
  }
}, [navigate]);

  // Fetch action items when userId is available
  useEffect(() => {
    if (!userId) return;
    fetchActionItems();
    fetchDeepResults();
    loadCompletedItems();
  }, [userId]);

  const fetchDeepResults = async () => {
    try {
  const res = await makeAuthenticatedRequest(`${API_URL}/api/v1/coupang/analysis_results`);

      if (res.ok) {
        const data = await res.json();
        setDeepResults(data);
        
        // Determine current mood level based on deep results
        const phq2Current = data.current_phq2 || 0;
        const gad2Current = data.current_gad2 || 0;
        const avgScore = (phq2Current + gad2Current) / 2;
        
        if (avgScore >= 4) setCurrentMoodLevel('elevated');
        else if (avgScore <= 1.5) setCurrentMoodLevel('low');
        else setCurrentMoodLevel('stable');
      }
    } catch (err) {
      console.error('Error fetching deep results:', err);
    }
  };

  const fetchActionItems = async () => {
    try {
      setLoading(true);
   const res = await makeAuthenticatedRequest(`${API_URL}/api/v1/coupang/action_items`);

      
      if (!res.ok) {
        throw new Error(`Failed to fetch action items: ${res.status}`);
      }
      
      const data = await res.json();
      setActionItems(data.action_items || []);
    } catch (err) {
      console.error('Error fetching action items:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateNewActionItems = async () => {
    try {
      setRefreshing(true);
  const res = await makeAuthenticatedRequest(`${API_URL}/api/v1/coupang/action_items/generate`, {
  method: 'POST'
});
      
      if (!res.ok) {
        throw new Error(`Failed to generate action items: ${res.status}`);
      }
      
      const data = await res.json();
      setActionItems(data.action_items || []);
      setCompletedItems(new Set()); // Reset completed items
      await saveCompletedItems(new Set());
    } catch (err) {
      console.error('Error generating action items:', err);
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  };

  const loadCompletedItems = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const docRef = doc(db, 'users', userId, 'action_items_progress', today);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCompletedItems(new Set(data.completed_items || []));
      }
    } catch (err) {
      console.error('Error loading completed items:', err);
    }
  };

  const saveCompletedItems = async (completedSet) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const docRef = doc(db, 'users', userId, 'action_items_progress', today);
      await setDoc(docRef, {
        completed_items: Array.from(completedSet),
        last_updated: new Date(),
        total_items: actionItems.length
      }, { merge: true });
    } catch (err) {
      console.error('Error saving completed items:', err);
    }
  };

  const toggleItemCompletion = async (itemId) => {
    const newCompleted = new Set(completedItems);
    
    if (newCompleted.has(itemId)) {
      newCompleted.delete(itemId);
    } else {
      newCompleted.add(itemId);
    }
    
    setCompletedItems(newCompleted);
    await saveCompletedItems(newCompleted);
  };

  const getProgressPercentage = () => {
    if (actionItems.length === 0) return 0;
    return Math.round((completedItems.size / actionItems.length) * 100);
  };

  const getMoodLevelColor = () => {
    switch (currentMoodLevel) {
      case 'elevated': return '#ff7043';
      case 'low': return '#42a5f5';
      default: return '#66bb6a';
    }
  };

  const getMoodLevelText = () => {
    switch (currentMoodLevel) {
      case 'elevated': return '스트레스/불안 상승';
      case 'low': return '에너지/기분 저하';
      default: return '안정적';
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'breathing': '🫁',
      'movement': '🚶',
      'social': '👥',
      'cognitive': '🧠',
      'mindfulness': '🧘',
      'nutrition': '🥗',
      'sleep': '😴',
      'creativity': '🎨',
      'work': '💼',
      'self_care': '💚'
    };
    return icons[category] || '✨';
  };

  if (loading) {
    return (
      <div className="container-action-items" style={{ paddingTop: 80 }}>
        <div style={{ textAlign: 'center', marginTop: '100px' }}>
          <div className="spinner" />
          <p style={{ color: '#fff', marginTop: '20px' }}>맞춤형 액션 아이템을 생성하는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-action-items" style={{ paddingTop: 80 }}>
        <div style={{ textAlign: 'center', marginTop: '100px' }}>
          <h2 style={{ color: '#ff5252' }}>오류가 발생했습니다</h2>
          <p style={{ color: '#fff' }}>{error}</p>
          <button onClick={() => window.location.reload()} style={{
            background: '#ff5252', border: 'none', padding: '10px 20px',
            borderRadius: '6px', color: '#fff', cursor: 'pointer', marginTop: '20px'
          }}>
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-action-items" style={{ paddingTop: 80 }}>
      {/* Header */}
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
          <Link to="/results" style={{ fontSize: '16px', textDecoration: 'none', color: '#333' }}>
            분석 결과
          </Link>
          <Link to="/settings" style={{ fontSize: '16px', textDecoration: 'none', color: '#333' }}>
            설정
          </Link>
          <button onClick={logout} className="logout-button">로그아웃</button>
        </div>
      </div>

      {/* Page Title */}
      <div style={{ textAlign: 'center', margin: '40px 0 20px' }}>
        <h1 style={{ color: '#fff', fontSize: '2rem', margin: 0 }}>
          오늘의 맞춤 액션 아이템
        </h1>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          gap: '20px', 
          marginTop: '16px' 
        }}>
          <div style={{
            background: getMoodLevelColor(),
            padding: '8px 16px',
            borderRadius: '20px',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            현재 상태: {getMoodLevelText()}
          </div>
          <div style={{
            background: '#283593',
            padding: '8px 16px',
            borderRadius: '20px',
            color: '#fff',
            fontSize: '14px'
          }}>
            완료: {completedItems.size}/{actionItems.length} ({getProgressPercentage()}%)
          </div>
        </div>
      </div>

      <div className="card">
        {/* Progress Bar */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{
            width: '100%',
            height: '8px',
            background: '#e0e0e0',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${getProgressPercentage()}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #66bb6a, #43a047)',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        {/* Action Items */}
        {actionItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: '#eee', fontSize: '18px' }}>
              아직 액션 아이템이 생성되지 않았습니다.
            </p>
            <button
              onClick={generateNewActionItems}
              disabled={refreshing}
              style={{
                background: '#43a047',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '16px',
                cursor: refreshing ? 'not-allowed' : 'pointer',
                marginTop: '20px',
                opacity: refreshing ? 0.7 : 1
              }}
            >
              {refreshing ? '생성 중...' : '액션 아이템 생성하기'}
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gap: '16px' }}>
              {actionItems.map((item, index) => {
                const itemId = `item_${index}`;
                const isCompleted = completedItems.has(itemId);
                
                return (
                  <div
                    key={itemId}
                    style={{
                      background: isCompleted ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                      border: isCompleted ? '2px solid #4caf50' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      padding: '20px',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onClick={() => toggleItemCompletion(itemId)}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                      <div style={{
                        fontSize: '24px',
                        flexShrink: 0,
                        opacity: isCompleted ? 0.6 : 1
                      }}>
                        {getCategoryIcon(item.category)}
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                          <h3 style={{
                            margin: 0,
                            color: isCompleted ? '#aaa' : '#fff',
                            textDecoration: isCompleted ? 'line-through' : 'none',
                            fontSize: '18px'
                          }}>
                            {item.title}
                          </h3>
                          <span style={{
                            background: item.priority === 'high' ? '#ff7043' : 
                                      item.priority === 'medium' ? '#ffb74d' : '#81c784',
                            color: '#fff',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}>
                            {item.priority === 'high' ? '높음' : 
                             item.priority === 'medium' ? '보통' : '낮음'}
                          </span>
                        </div>
                        
                        <p style={{
                          margin: '0 0 12px 0',
                          color: isCompleted ? '#999' : '#eee',
                          lineHeight: 1.5
                        }}>
                          {item.description}
                        </p>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '14px' }}>
                          <span style={{ color: '#bbb' }}>
                            ⏰ {item.duration}분
                          </span>
                          <span style={{ color: '#bbb' }}>
                            📅 {item.best_time}
                          </span>
                          {item.difficulty && (
                            <span style={{ color: '#bbb' }}>
                              🎯 {item.difficulty}/5
                            </span>
                          )}
                        </div>
                        
                        {item.instructions && (
                          <div style={{
                            marginTop: '12px',
                            padding: '12px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '6px',
                            fontSize: '14px',
                            color: '#ddd'
                          }}>
                            <strong>방법:</strong> {item.instructions}
                          </div>
                        )}
                      </div>
                      
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        border: isCompleted ? '2px solid #4caf50' : '2px solid #666',
                        background: isCompleted ? '#4caf50' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {isCompleted && (
                          <span style={{ color: '#fff', fontSize: '14px' }}>✓</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '40px' }}>
              <button
                onClick={generateNewActionItems}
                disabled={refreshing}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '16px',
                  cursor: refreshing ? 'not-allowed' : 'pointer',
                  opacity: refreshing ? 0.7 : 1,
                  marginRight: '12px'
                }}
              >
                {refreshing ? '새로고침 중...' : '새 액션 아이템 생성'}
              </button>
              
              {getProgressPercentage() === 100 && (
                <div style={{
                  marginTop: '20px',
                  padding: '16px',
                  background: 'linear-gradient(135deg, #4caf50, #43a047)',
                  borderRadius: '8px',
                  color: '#fff'
                }}>
                  🎉 축하합니다! 오늘의 모든 액션 아이템을 완료했습니다!
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}