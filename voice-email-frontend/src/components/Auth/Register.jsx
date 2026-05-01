import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useAccessibility } from '../../contexts/AccessibilityContext';

export default function Register({ onSwitchToLogin, onAnnouncement }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState(true);
  const { register, error, clearError } = useAuth();
  const { blindMode, speak, listen } = useAccessibility();

  useEffect(() => {
    if (onAnnouncement) {
      onAnnouncement('Registration form loaded. Fill in your details to create a new account.');
    }
  }, [onAnnouncement]);

  useEffect(() => {
    // Check password match when either password field changes
    if (formData.password && formData.confirmPassword) {
      setPasswordMatch(formData.password === formData.confirmPassword);
    } else {
      setPasswordMatch(true);
    }
  }, [formData.password, formData.confirmPassword]);

  const handleVoiceInput = async (field) => {
    try {
      const fieldLabels = {
        name: 'full name',
        email: 'email address',
        password: 'password',
        confirmPassword: 'password confirmation'
      };

      speak(`Please speak your ${fieldLabels[field]}`);
      const transcript = await listen();
      
      let cleanValue = transcript.trim();
      
      // Special handling for email and password
      if (field === 'email' || field === 'password' || field === 'confirmPassword') {
        cleanValue = cleanValue.toLowerCase().replace(/\s+/g, '');
      }

      setFormData(prev => ({
        ...prev,
        [field]: cleanValue
      }));

      if (field === 'password' || field === 'confirmPassword') {
        speak(`${fieldLabels[field]} set.`);
      } else {
        speak(`${fieldLabels[field]} set to ${cleanValue}`);
      }
      
      if (onAnnouncement) {
        onAnnouncement(`${fieldLabels[field]} updated via voice`);
      }
    } catch (err) {
      speak(`Sorry, I didn't catch that ${field}.`);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      return 'Please enter your full name';
    }
    if (!formData.email.trim()) {
      return 'Please enter your email address';
    }
    if (formData.password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    if (!passwordMatch) {
      return 'Passwords do not match';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      speak(validationError);
      if (onAnnouncement) onAnnouncement(validationError);
      return;
    }

    setIsSubmitting(true);
    clearError();

    try {
      const response = await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password
      });
      
      const successMsg = 'Registration successful! Welcome to Voice Email System.';
      speak(successMsg);
      if (onAnnouncement) onAnnouncement(successMsg);
      
      // Switch to login after successful registration
      onSwitchToLogin();
    } catch (error) {
      const errorMsg = `Registration failed: ${error.message}`;
      speak(errorMsg);
      if (onAnnouncement) onAnnouncement(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReadForm = () => {
    const formContent = `Registration form. Name: ${formData.name || 'not entered'}. Email: ${formData.email || 'not entered'}. Password: ${formData.password ? 'entered' : 'not entered'}. Confirm password: ${formData.confirmPassword ? 'entered' : 'not entered'}.`;
    speak(formContent);
    if (onAnnouncement) onAnnouncement('Reading current form data');
  };

  return (
    <div className="auth-container" role="main" aria-label="Registration form">
      <div className="auth-card">
        <div className="auth-header">
          <h1 tabIndex="0">
            <span className="auth-icon">✨</span>
            Create Voice Email Account
          </h1>
          <p className="auth-description">
            Join the accessible email revolution with voice control and screen reader support
          </p>
        </div>

        <div className="auth-controls">
          <button 
            onClick={handleReadForm}
            className="read-form-btn"
            type="button"
            aria-label="Read current form content"
          >
            📖 Read Form
          </button>
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

        {!passwordMatch && formData.confirmPassword && (
          <div 
            className="error-message" 
            role="alert" 
            aria-live="polite"
          >
            <span className="error-icon">⚠️</span>
            Passwords do not match
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Enter your full name"
              aria-describedby="name-help"
              required
              autoComplete="name"
              disabled={isSubmitting}
            />
            <button 
              type="button" 
              className="voice-input-btn"
              onClick={() => handleVoiceInput('name')}
              aria-label="Speak full name"
              disabled={isSubmitting}
            >
              🎙️
            </button>
            <div id="name-help" className="field-help">
              Enter your first and last name
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
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
              aria-label="Speak email address"
              disabled={isSubmitting}
            >
              🎙️
            </button>
            <div id="email-help" className="field-help">
              This will be your login email and primary email address
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Create a strong password"
              aria-describedby="password-help"
              required
              autoComplete="new-password"
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
              Password must be at least 6 characters long
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className={`form-input ${!passwordMatch && formData.confirmPassword ? 'error' : ''}`}
              placeholder="Confirm your password"
              aria-describedby="confirm-password-help"
              required
              autoComplete="new-password"
              disabled={isSubmitting}
            />
            <button 
              type="button" 
              className="voice-input-btn"
              onClick={() => handleVoiceInput('confirmPassword')}
              aria-label="Speak password confirmation"
              disabled={isSubmitting}
            >
              🎙️
            </button>
            <div id="confirm-password-help" className="field-help">
              Re-enter your password to confirm
            </div>
          </div>

          <div className="auth-actions">
            <button
              type="submit"
              className="auth-btn primary"
              disabled={isSubmitting || !passwordMatch}
              aria-label={isSubmitting ? "Creating account..." : "Create your account"}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner">⏳</span>
                  Creating Account...
                </>
              ) : (
                <>
                  <span className="btn-icon">🎉</span>
                  Create Account
                </>
              )}
            </button>
          </div>
        </form>

        <div className="auth-footer">
          <p className="auth-switch">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="auth-link"
              aria-label="Switch to login form"
            >
              Sign In
            </button>
          </p>
        </div>

        <div className="auth-help">
          <h3>What You'll Get:</h3>
          <ul>
            <li>🎤 Voice-controlled email composition</li>
            <li>👁️ Full screen reader compatibility</li>
            <li>⌨️ Complete keyboard navigation</li>
            <li>🔊 Audio feedback for all actions</li>
            <li>♿ Designed for accessibility first</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
