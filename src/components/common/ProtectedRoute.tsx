import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../../services/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const userStr = localStorage.getItem('user');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (!userStr) { setIsAuthenticated(false); return; }
        const user = JSON.parse(userStr);
        if (user.role !== 'ADMIN') {
          localStorage.removeItem('user');
          setIsAuthenticated(false);
          return;
        }
        await api.get('/auth/me');
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem('user');
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, [userStr]);

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--color-bg-secondary)]">
        <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};
