import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useAccessibility } from '../../contexts/AccessibilityContext';

export default function Login({ onSwitchToRegister, onAnnouncement }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, error, clearError } = useAuth();
  const { blindMode, speak, listen } = useAccessibility();

  useEffect(() => {
    if (onAnnouncement) {
      onAnnouncement('Login form loaded. Enter your email and password to sign in.');
    }
  }, [onAnnouncement]);

  const handleVoiceInput = async (field) => {
    try {
      speak(`Please speak your ${field}`);
      const transcript = await listen();
      const cleanTranscript = transcript.toLowerCase().replace(/\s+/g, '');
      
      if (field === 'email') {
        setEmail(cleanTranscript);
        speak(`Email set to ${cleanTranscript}`);
      } else {
        setPassword(cleanTranscript);
        speak(`Password set.`);
      }
    } catch (err) {
      speak(`Sorry, I didn't catch that ${field}.`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      const errorMsg = 'Please enter both email and password';
      speak(errorMsg);
      if (onAnnouncement) onAnnouncement(errorMsg);
      return;
    }

    setIsSubmitting(true);
    clearError();

    try {
      await login({ email, password });
      const successMsg = 'Login successful! Welcome to Voice Email System.';
      speak(successMsg);
      if (onAnnouncement) onAnnouncement(successMsg);
    } catch (error) {
      const errorMsg = `Login failed: ${error.message}`;
      speak(errorMsg);
      if (onAnnouncement) onAnnouncement(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail('demo@voiceemail.com');
    setPassword('demo123');
    
    const demoMsg = 'Demo credentials filled. Click Login to continue.';
    speak(demoMsg);
    if (onAnnouncement) onAnnouncement(demoMsg);
  };

  return (
    <div className="auth-container" role="main" aria-label="Login form">
      <div className="auth-card">
        <div className="auth-header">
          <h1 tabIndex="0">
            <span className="auth-icon">🔐</span>
            Sign In to Voice Email
          </h1>
          <p className="auth-description">
            Access your voice-controlled email system with full accessibility support
          </p>
        </div>

        {error && (
          <div 
            className="error-message" 
            role="alert" 
            aria-live="polite"
            tabIndex="0"
          >
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="Enter your email address"
              aria-describedby="email-help"
              required
              autoComplete="email"
              disabled={isSubmitting}
            />
            <button 
              type="button" 
              className="voice-input-btn"
              onClick={() => handleVoiceInput('email')}
              aria-label="Speak email"
              disabled={isSubmitting}
            >
              🎙️
            </button>
            <div id="email-help" className="field-help">
              Enter the email address you used to register
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="Enter your password"
              aria-describedby="password-help"
              required
              autoComplete="current-password"
              disabled={isSubmitting}
            />
            <button 
              type="button" 
              className="voice-input-btn"
              onClick={() => handleVoiceInput('password')}
              aria-label="Speak password"
              disabled={isSubmitting}
            >
              🎙️
            </button>
            <div id="password-help" className="field-help">
              Enter your account password
            </div>
          </div>

          <div className="auth-actions">
            <button
              type="submit"
              className="auth-btn primary"
              disabled={isSubmitting}
              aria-label={isSubmitting ? "Signing in..." : "Sign in to your account"}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner">⏳</span>
                  Signing In...
                </>
              ) : (
                <>
                  <span className="btn-icon">🚀</span>
                  Sign In
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDemoLogin}
              className="auth-btn secondary"
              disabled={isSubmitting}
              aria-label="Fill demo credentials"
            >
              <span className="btn-icon">🎯</span>
              Try Demo
            </button>
          </div>
        </form>

        <div className="auth-footer">
          <p className="auth-switch">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="auth-link"
              aria-label="Switch to registration form"
            >
              Create Account
            </button>
          </p>
        </div>

        <div className="auth-help">
          <h3>Accessibility Features:</h3>
          <ul>
            <li>🎤 Voice commands for navigation</li>
            <li>👁️ Screen reader optimized</li>
            <li>⌨️ Full keyboard navigation</li>
            <li>🔊 Audio feedback and announcements</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
