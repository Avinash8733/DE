import React, { useState, useRef, useEffect } from "react";
import apiService from "../services/api";
import { useAccessibility } from "../contexts/AccessibilityContext";

export default function Sent({ onAnnouncement }) {
  const { blindMode, announce, speak, isSpeaking } = useAccessibility();
  const [sentEmails, setSentEmails] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSentEmails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const fetchSentEmails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.getEmails({ folder: 'sent' });
      
      // Ensure response.emails is always an array
      const emails = response && response.emails ? response.emails : [];
      setSentEmails(emails);
      setIsLoading(false);
      
      if (emails.length > 0) {
        onAnnouncement(`${emails.length} sent emails loaded`);
      } else {
        onAnnouncement("No sent emails found");
      }
    } catch (err) {
      console.error("Error fetching sent emails:", err);
      setError("Failed to load sent emails. Please try again later.");
      setIsLoading(false);
      onAnnouncement("Error loading sent emails");
    }
  };

  const readSentList = () => {
    if (!sentEmails || sentEmails.length === 0) {
      speak("You have no sent emails yet");
      onAnnouncement("No sent emails found");
      return;
    }
    
    const listText = `You have sent ${sentEmails.length} emails. ${sentEmails.map((email, index) => 
      `Email ${index + 1}: To ${email?.to_email || 'unknown'}, Subject: ${email?.subject || 'no subject'}`
    ).join('. ')}`;
    speak(listText);
    onAnnouncement(`Reading sent emails list. ${sentEmails.length} emails found.`);
  };

  const readEmail = (email) => {
    const emailText = `Email to ${email.to_email}. Subject: ${email.subject || 'No subject'}. Message: ${email.body}. Sent on ${new Date(email.created_at).toLocaleString()}`;
    speak(emailText);
    onAnnouncement(`Reading sent email to ${email.to_email}`);
  };

  const deleteEmail = async (emailId) => {
    try {
      const email = sentEmails.find(e => e.id === emailId);
      if (!email) return;
      
      await apiService.moveEmail(emailId, 'trash');
      
      // Remove from local state
      setSentEmails(sentEmails.filter(e => e.id !== emailId));
      
      speak(`Email to ${email?.to_email || "unknown"} moved to trash`);
      onAnnouncement(`Email moved to trash`);
    } catch (error) {
      const errorMsg = `Failed to delete email: ${error.message}`;
      speak(errorMsg);
      onAnnouncement(errorMsg);
    }
  };

  return (
    <div className="card" role="region" aria-label="Sent emails">
      <h2 tabIndex="0">Sent Emails ({sentEmails ? sentEmails.length : 0} emails)</h2>
      
      {isLoading ? (
        <div className="loading-state" aria-live="polite">
          <p>Loading sent emails...</p>
        </div>
      ) : error ? (
        <div className="error-state" aria-live="assertive">
          <p className="error-message">{error}</p>
          <button 
            onClick={fetchSentEmails}
            className="retry-btn"
            aria-label="Try loading emails again"
          >
            🔄 Retry
          </button>
        </div>
      ) : (
        <>
          <div className="sent-controls">
            <button 
              onClick={readSentList}
              className="read-list-btn"
              disabled={isSpeaking}
              aria-label="Read sent emails list"
            >
              📋 Read Sent List
            </button>
            
            {isSpeaking && (
              <button 
                onClick={() => speak("")}
                className="stop-reading-btn"
                aria-label="Stop reading"
              >
                🔇 Stop Reading
              </button>
            )}
          </div>

          {sentEmails.length === 0 ? (
            <div className="empty-state">
              <p>No sent emails yet.</p>
              <p>Use the Compose section to send your first email!</p>
            </div>
          ) : (
            <div className="email-list" role="list" aria-label="Sent emails list">
              {sentEmails.map((email) => (
                <div 
                  key={email.id} 
                  className="email"
                  role="listitem"
                  tabIndex="0"
                  aria-label={`Email sent to ${email?.to_email || "unknown"}, subject: ${email?.subject || "no subject"}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      readEmail(email);
                    }
                  }}
                >
                  <div className="email-header">
                    <p className="email-to">
                      <strong>To:</strong> {email?.to_email || "unknown"}
                    </p>
                    <p className="email-subject">
                      <strong>Subject:</strong> {email?.subject || "no subject"}
                    </p>
                    <p className="email-timestamp">
                      <strong>Sent:</strong> {email?.created_at ? new Date(email.created_at).toLocaleString() : "unknown date"}
                    </p>
                  </div>
                  
                  <div className="email-preview">
                    <p>
                      {email?.body?.length > 100
                        ? email.body.substring(0, 100) + "..."
                        : email?.body || "No message"}
                    </p>
                  </div>

                  <div className="email-actions">
                    <button 
                      onClick={() => readEmail(email)}
                      className="read-btn"
                      aria-label={`Read email sent to ${email?.to_email || "unknown"}`}
                    >
                      📖 Read Full
                    </button>
                    
                    <button 
                      onClick={() => deleteEmail(email.id)}
                      className="delete-btn"
                      aria-label={`Delete email sent to ${email?.to_email || "unknown"}`}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                  
                  <hr />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div className="sent-help">
        <h3>Sent Emails Instructions:</h3>
        <ul>
          <li>Click "Read Sent List" to hear all sent email summaries</li>
          <li>Click "Read Full" to hear the complete email</li>
          <li>Use Tab to navigate between emails</li>
          <li>Press Enter or Space on an email to read it</li>
          <li>Use "Delete" to remove emails from sent list</li>
        </ul>
      </div>
    </div>
  );
}
