import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Login from './Login';
import Register from './Register';

export default function AuthWrapper({ onAnnouncement }) {
  const [isLogin, setIsLogin] = useState(true);
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-loading" role="status" aria-label="Loading authentication">
        <div className="loading-container">
          <div className="loading-spinner">
            <div className="spinner-ring"></div>
          </div>
          <h2>Loading Voice Email System...</h2>
          <p>Checking authentication status</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrapper">
      {isLogin ? (
        <Login 
          onSwitchToRegister={() => setIsLogin(false)}
          onAnnouncement={onAnnouncement}
        />
      ) : (
        <Register 
          onSwitchToLogin={() => setIsLogin(true)}
          onAnnouncement={onAnnouncement}
        />
      )}
    </div>
  );
}
