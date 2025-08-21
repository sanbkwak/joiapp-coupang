// src/admin/UserManagement.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthToken } from '../utils/authUtility';
import { useLogout } from '../utils/logout';
import JoiAppLogo from '../joiapplogo.png';
import AppLayout, { 
  AppSection, 
  AppButton, 
  AppStatusMessage,
  AppFormGroup,
  AppInput 
} from '../components/layout/AppLayout';

const API_URL = "https://api.joiapp.org";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  const navigate = useNavigate();
  const logout = useLogout();

  // Form state for create/edit
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'user',
    is_active: true
  });

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

  // Fetch users with pagination and filtering
  const fetchUsers = async (page = 1, search = '', sort = sortBy, order = sortOrder) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search,
        sort_by: sort,
        sort_order: order
      });

      const response = await makeAuthenticatedRequest(`${API_URL}/api/v1/admin/users?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`);
      }

      const data = await response.json();
      setUsers(data.users || []);
      setCurrentPage(data.page || 1);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(currentPage, searchTerm, sortBy, sortOrder);
  }, [currentPage, sortBy, sortOrder]);

  // Search with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== '') {
        fetchUsers(1, searchTerm, sortBy, sortOrder);
        setCurrentPage(1);
      } else {
        fetchUsers(currentPage, '', sortBy, sortOrder);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const response = await makeAuthenticatedRequest(`${API_URL}/api/v1/admin/users`, {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          password: 'TempPass123!' // Temporary password - user should change on first login
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to create user');
      }

      setShowCreateModal(false);
      setFormData({ email: '', name: '', role: 'user', is_active: true });
      fetchUsers(currentPage, searchTerm, sortBy, sortOrder);
      setError('User created successfully!');
      setTimeout(() => setError(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const response = await makeAuthenticatedRequest(`${API_URL}/api/v1/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to update user');
      }

      setShowEditModal(false);
      setSelectedUser(null);
      fetchUsers(currentPage, searchTerm, sortBy, sortOrder);
      setError('User updated successfully!');
      setTimeout(() => setError(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    setActionLoading(true);

    try {
      const response = await makeAuthenticatedRequest(`${API_URL}/api/v1/admin/users/${selectedUser.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to delete user');
      }

      setShowDeleteModal(false);
      setSelectedUser(null);
      fetchUsers(currentPage, searchTerm, sortBy, sortOrder);
      setError('User deleted successfully!');
      setTimeout(() => setError(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      name: user.name,
      role: user.role,
      is_active: user.is_active
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>{title}</h3>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#6b7280'
              }}
            >
              ×
            </button>
          </div>
          <div style={{ padding: '20px' }}>
            {children}
          </div>
        </div>
      </div>
    );
  };

  return (
    <AppLayout maxWidth={1200}>
      {/* Header */}
      <AppSection style={{
        padding: '16px 24px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div
          onClick={() => navigate('/admin')}
          style={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            gap: '12px'
          }}
        >
          <img src={JoiAppLogo} alt="JoiApp Logo" style={{ height: '32px' }} />
          <span style={{ fontSize: '20px', fontWeight: '700', color: '#111827' }}>
            JoiApp Admin
          </span>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <AppButton onClick={() => navigate('/admin')} variant="secondary">
            대시보드
          </AppButton>
          <AppButton onClick={logout} variant="outline">
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
          사용자 관리
        </h1>
        <p style={{ fontSize: '16px', color: '#6b7280' }}>
          시스템 사용자 계정 관리 및 권한 설정
        </p>
      </AppSection>

      {/* Error Message */}
      {error && (
        <AppStatusMessage
          message={error}
          type={error.includes('successfully') ? 'success' : 'error'}
          onClose={() => setError(null)}
        />
      )}

      {/* Search and Actions */}
      <AppSection style={{ padding: '0 24px 24px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          gap: '16px'
        }}>
          <div style={{ flex: 1, maxWidth: '400px' }}>
            <AppInput
              type="text"
              placeholder="이메일 또는 이름으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <AppButton
            onClick={() => setShowCreateModal(true)}
            variant="primary"
          >
            새 사용자 추가
          </AppButton>
        </div>

        {/* Users Table */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <div style={{
                width: '32px',
                height: '32px',
                border: '3px solid #e5e7eb',
                borderTop: '3px solid #2563eb',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px'
              }} />
              <p>사용자 목록을 불러오는 중...</p>
            </div>
          ) : (
            <>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#f9fafb' }}>
                  <tr>
                    <th
                      style={{ padding: '12px', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #e5e7eb' }}
                      onClick={() => handleSort('email')}
                    >
                      이메일 {sortBy === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      style={{ padding: '12px', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #e5e7eb' }}
                      onClick={() => handleSort('name')}
                    >
                      이름 {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      style={{ padding: '12px', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #e5e7eb' }}
                      onClick={() => handleSort('role')}
                    >
                      역할 {sortBy === 'role' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                      상태
                    </th>
                    <th
                      style={{ padding: '12px', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #e5e7eb' }}
                      onClick={() => handleSort('created_at')}
                    >
                      가입일 {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '12px' }}>{user.email}</td>
                      <td style={{ padding: '12px' }}>{user.name}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: user.role === 'admin' ? '#dbeafe' : '#f3f4f6',
                          color: user.role === 'admin' ? '#1d4ed8' : '#374151'
                        }}>
                          {user.role === 'admin' ? '관리자' : '사용자'}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: user.is_active ? '#d1fae5' : '#fee2e2',
                          color: user.is_active ? '#065f46' : '#991b1b'
                        }}>
                          {user.is_active ? '활성' : '비활성'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#6b7280' }}>
                        {new Date(user.created_at).toLocaleDateString('ko-KR')}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            onClick={() => openEditModal(user)}
                            style={{
                              padding: '4px 8px',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              backgroundColor: 'white',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            편집
                          </button>
                          <button
                            onClick={() => openDeleteModal(user)}
                            style={{
                              padding: '4px 8px',
                              border: '1px solid #dc2626',
                              borderRadius: '4px',
                              backgroundColor: '#dc2626',
                              color: 'white',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{
                  padding: '16px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  borderTop: '1px solid #e5e7eb'
                }}>
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      backgroundColor: currentPage === 1 ? '#f9fafb' : 'white',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    이전
                  </button>
                  
                  <span style={{ padding: '0 16px', fontSize: '14px', color: '#6b7280' }}>
                    {currentPage} / {totalPages}
                  </span>
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      backgroundColor: currentPage === totalPages ? '#f9fafb' : 'white',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                    }}
                  >
                    다음
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </AppSection>

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="새 사용자 추가"
      >
        <form onSubmit={handleCreateUser}>
          <AppFormGroup label="이메일">
            <AppInput
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </AppFormGroup>
          
          <AppFormGroup label="이름">
            <AppInput
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </AppFormGroup>
          
          <AppFormGroup label="역할">
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px'
              }}
            >
              <option value="user">사용자</option>
              <option value="admin">관리자</option>
            </select>
          </AppFormGroup>
          
          <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
            <AppButton
              type="button"
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              style={{ flex: 1 }}
            >
              취소
            </AppButton>
            <AppButton
              type="submit"
              variant="primary"
              disabled={actionLoading}
              style={{ flex: 1 }}
            >
              {actionLoading ? '생성 중...' : '사용자 생성'}
            </AppButton>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="사용자 편집"
      >
        <form onSubmit={handleUpdateUser}>
          <AppFormGroup label="이메일">
            <AppInput
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </AppFormGroup>
          
          <AppFormGroup label="이름">
            <AppInput
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </AppFormGroup>
          
          <AppFormGroup label="역할">
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px'
              }}
            >
              <option value="user">사용자</option>
              <option value="admin">관리자</option>
            </select>
          </AppFormGroup>
          
          <AppFormGroup label="상태">
            <select
              value={formData.is_active.toString()}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px'
              }}
            >
              <option value="true">활성</option>
              <option value="false">비활성</option>
            </select>
          </AppFormGroup>
          
          <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
            <AppButton
              type="button"
              variant="outline"
              onClick={() => setShowEditModal(false)}
              style={{ flex: 1 }}
            >
              취소
            </AppButton>
            <AppButton
              type="submit"
              variant="primary"
              disabled={actionLoading}
              style={{ flex: 1 }}
            >
              {actionLoading ? '업데이트 중...' : '업데이트'}
            </AppButton>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="사용자 삭제 확인"
      >
        <div>
          <p style={{ marginBottom: '16px' }}>
            정말로 <strong>{selectedUser?.email}</strong> 사용자를 삭제하시겠습니까?
          </p>
          <p style={{ fontSize: '14px', color: '#dc2626', marginBottom: '24px' }}>
            이 작업은 되돌릴 수 없습니다.
          </p>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <AppButton
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              style={{ flex: 1 }}
            >
              취소
            </AppButton>
            <AppButton
              variant="primary"
              onClick={handleDeleteUser}
              disabled={actionLoading}
              style={{ flex: 1, backgroundColor: '#dc2626' }}
            >
              {actionLoading ? '삭제 중...' : '삭제'}
            </AppButton>
          </div>
        </div>
      </Modal>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </AppLayout>
  );
}