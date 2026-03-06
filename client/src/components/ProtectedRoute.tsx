import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-callback-page">
        <div className="auth-callback-spinner">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="auth-callback-spin">
            <circle cx="20" cy="20" r="17" stroke="#EBF1FF" strokeWidth="4" />
            <path d="M20 3a17 17 0 0 1 17 17" stroke="#3B82F6" strokeWidth="4" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    );
  }

  // TODO: убрать когда бэкенд будет готов
  return <Outlet />;
  // return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
