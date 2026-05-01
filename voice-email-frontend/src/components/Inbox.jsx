import React, { useState, useRef, useEffect } from "react";
import apiService from "../services/api";
import { useAccessibility } from "../contexts/AccessibilityContext";

export default function Inbox({ onAnnouncement }) {
  const [selectedEmail, setSelectedEmail] = useState(null);
  const { blindMode, announce, speak, isSpeaking } = useAccessibility();
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    loadEmails();

    const handleReadList = () => readEmailList();
    const handleReadPage = () => announce(`You are in the inbox. You have ${emails.length} emails.`);

    window.addEventListener('voice-read-list', handleReadList);
    window.addEventListener('voice-read-page', handleReadPage);

    return () => {
      window.removeEventListener('voice-read-list', handleReadList);
      window.removeEventListener('voice-read-page', handleReadPage);
    };
  }, [emails.length]);

  // Automatic reading in blind mode
  useEffect(() => {
    if (blindMode && emails.length > 0 && !loading) {
      announce(`You are in the inbox. You have ${emails.length} emails. Tap an email to hear details, or double tap to read full content.`);
    }
  }, [blindMode, loading, emails.length]);

  const loadEmails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getEmails({ 
        folder: 'inbox',
        limit: 20,
        page: 1
      });
      
      setEmails(response.emails || []);
      setPagination(response.pagination || {});
      
      if (onAnnouncement) {
        onAnnouncement(`Loaded ${response.emails?.length || 0} emails in inbox`);
      }
      
    } catch (error) {
      console.error('Failed to load emails:', error);
      setError(error.message);
      if (onAnnouncement) {
        onAnnouncement(`Failed to load emails: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const readEmail = async (email) => {
    try {
      // Mark email as read
      if (!email.is_read) {
        await apiService.markEmailAsRead(email.id, true);
        // Update local state
        setEmails(prevEmails => 
          prevEmails.map(e => 
            e.id === email.id ? { ...e, is_read: true } : e
          )
        );
      }
      
      const emailText = `Email from ${email.from_email}. Subject: ${email.subject || 'No subject'}. Message: ${email.body}. Received on ${new Date(email.created_at).toLocaleString()}`;
      speak(emailText);
      setSelectedEmail(email.id);
      onAnnouncement(`Reading email from ${email.from_email}`);
    } catch (error) {
      console.error('Failed to mark email as read:', error);
      // Still read the email even if marking as read fails
      const emailText = `Email from ${email.from_email}. Subject: ${email.subject || 'No subject'}. Message: ${email.body}. Received on ${new Date(email.created_at).toLocaleString()}`;
      speak(emailText);
      setSelectedEmail(email.id);
      onAnnouncement(`Reading email from ${email.from_email}`);
    }
  };

  const readEmailList = () => {
    const listText = `You have ${emails.length} emails. ${emails.map((email, index) => 
      `Email ${index + 1}: From ${email.from_email}, Subject: ${email.subject || 'No subject'}`
    ).join('. ')}`;
    speak(listText);
    onAnnouncement(`Reading email list. ${emails.length} emails found.`);
  };

  const markAsRead = async (emailId) => {
    try {
      const email = emails.find(e => e.id === emailId);
      if (!email) return;
      
      await apiService.markEmailAsRead(emailId, true);
      
      // Update local state
      setEmails(prevEmails => 
        prevEmails.map(e => 
          e.id === emailId ? { ...e, is_read: true } : e
        )
      );
      
      speak(`Email from ${email.from_email} marked as read`);
      onAnnouncement(`Email from ${email.from_email} marked as read`);
    } catch (error) {
      const errorMsg = `Failed to mark email as read: ${error.message}`;
      speak(errorMsg);
      onAnnouncement(errorMsg);
    }
  };

  const replyToEmail = (email) => {
    speak(`Opening reply to ${email.from_email}`);
    onAnnouncement(`Opening reply to ${email.from_email}`);
    // In a real app, this would navigate to compose with pre-filled recipient
  };

  const deleteEmail = async (emailId) => {
    try {
      const email = emails.find(e => e.id === emailId);
      if (!email) return;
      
      await apiService.moveEmail(emailId, 'trash');
      
      // Remove from local state
      setEmails(prevEmails => prevEmails.filter(e => e.id !== emailId));
      
      speak(`Email from ${email.from_email} moved to trash`);
      onAnnouncement(`Email moved to trash`);
    } catch (error) {
      const errorMsg = `Failed to delete email: ${error.message}`;
      speak(errorMsg);
      onAnnouncement(errorMsg);
    }
  };

  if (loading) {
    return (
      <div className="card" role="region" aria-label="Inbox">
        <h2 tabIndex="0">Inbox</h2>
        <div className="loading-state" role="status" aria-label="Loading emails">
          <div className="loading-spinner">
            <div className="spinner-ring"></div>
          </div>
          <p>Loading your emails...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" role="region" aria-label="Inbox">
        <h2 tabIndex="0">Inbox</h2>
        <div className="error-state" role="alert">
          <p>Failed to load emails: {error}</p>
          <button onClick={loadEmails} className="retry-btn">
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card" role="region" aria-label="Inbox">
      <h2 tabIndex="0">Inbox ({emails.length} emails)</h2>
      
      <div className="inbox-controls">
        <button 
          onClick={readEmailList}
          className="read-list-btn"
          disabled={isSpeaking}
          aria-label="Read email list"
        >
          📋 Read Email List
        </button>
        
        {isSpeaking && (
          <button 
            onClick={() => speak("")} // speak empty string cancels ongoing speech
            className="stop-reading-btn"
            aria-label="Stop reading"
          >
            🔇 Stop Reading
          </button>
        )}
      </div>

      {emails.length === 0 ? (
        <div className="empty-state">
          <p>📭 No emails in your inbox</p>
          <p>Your inbox is empty. New emails will appear here.</p>
        </div>
      ) : (
        <div className="email-list" role="list" aria-label="Email list">
          {emails.map((email, i) => (
          <div 
            key={email.id} 
            className={`email-item ${!email.is_read ? 'unread' : ''} ${selectedEmail === email.id ? 'selected' : ''}`}
            onClick={() => readEmail(email)}
            role="button"
            tabIndex="0"
            aria-label={`Email from ${email.from_email}. Subject: ${email.subject || 'No subject'}. Double tap to read full message.`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                readEmail(email);
              }
            }}
          >
            <div className="email-visual">
              <div className="email-avatar">
                <span className="avatar-text">{email.from_email.charAt(0).toUpperCase()}</span>
              </div>
              <div className="email-status">
                <div className={`status-indicator ${email.is_read ? 'read' : 'unread'}`}></div>
              </div>
            </div>
            <div className="email-content">
              <div className="email-header">
                <p className="email-from">
                  <span className="from-icon">👤</span>
                  <strong>From:</strong> {email.from_email}
                </p>
                <p className="email-subject">
                  <span className="subject-icon">📋</span>
                  <strong>Subject:</strong> {email.subject || 'No subject'}
                </p>
                <p className="email-timestamp">
                  <span className="time-icon">🕒</span>
                  <strong>Time:</strong> {new Date(email.created_at).toLocaleString()}
                </p>
              </div>
              
              <div className="email-preview">
                <p>{email.body && email.body.length > 100 ? email.body.substring(0, 100) + '...' : email.body}</p>
              </div>
            </div>

            <div className="email-actions">
              <button 
                onClick={() => readEmail(email)}
                className="read-btn"
                aria-label={`Read full email from ${email.from_email}`}
              >
                📖 Read Full
              </button>
              
              <button 
                onClick={() => replyToEmail(email)}
                className="reply-btn"
                aria-label={`Reply to ${email.from_email}`}
              >
                ↩️ Reply
              </button>
              
              {!email.is_read && (
                <button 
                  onClick={() => markAsRead(email.id)}
                  className="mark-read-btn"
                  aria-label={`Mark email from ${email.from_email} as read`}
                >
                  ✅ Mark Read
                </button>
              )}
              
              <button 
                onClick={() => deleteEmail(email.id)}
                className="delete-btn"
                aria-label={`Delete email from ${email.from_email}`}
              >
                🗑️ Delete
              </button>
            </div>
            
            <hr />
          </div>
          ))}
        </div>
      )}

      <div className="inbox-help">
        <h3>Inbox Instructions:</h3>
        <ul>
          <li>Click "Read Email List" to hear all email summaries</li>
          <li>Click "Read Full" to hear the complete email</li>
          <li>Use Tab to navigate between emails</li>
          <li>Press Enter or Space on an email to read it</li>
          <li>Use "Reply" to respond to an email</li>
        </ul>
      </div>
    </div>
  );
}
