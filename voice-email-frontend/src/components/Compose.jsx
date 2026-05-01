import React, { useState, useRef, useEffect } from "react";
import apiService from "../services/api";
import { useAccessibility } from "../contexts/AccessibilityContext";

export default function Compose({ onAnnouncement }) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [currentField, setCurrentField] = useState("to");
  const [isSending, setIsSending] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const { speak, listen } = useAccessibility();

  const startVoiceCompose = async () => {
    setIsVoiceMode(true);
    setCurrentField("to");
    
    try {
      speak("Starting voice compose. Please speak the recipient email address.");
      setCurrentField("to");
      const recipient = await listen();
      setTo(recipient);
      
      speak(`Recipient set to: ${recipient}. Now speak the subject.`);
      setCurrentField("subject");
      const sub = await listen();
      setSubject(sub);
      
      speak(`Subject set to: ${sub}. Now speak your message.`);
      setCurrentField("message");
      const msg = await listen();
      setMessage(msg);
      
      speak(`Message set. You can now review and send.`);
      setCurrentField("completed");
    } catch (err) {
      speak("Sorry, I had trouble hearing you. Please try again.");
    } finally {
      setIsVoiceMode(false);
    }
  };

  const handleFieldVoiceInput = async (field) => {
    try {
      const fieldLabels = {
        to: 'recipient email',
        subject: 'subject',
        message: 'message'
      };
      
      speak(`Please speak the ${fieldLabels[field]}`);
      const transcript = await listen();
      
      if (field === 'to') {
        const cleanTo = transcript.toLowerCase().replace(/\s+/g, '');
        setTo(cleanTo);
        speak(`Recipient set to ${cleanTo}`);
      } else if (field === 'subject') {
        setSubject(transcript);
        speak(`Subject set to ${transcript}`);
      } else {
        setMessage(transcript);
        speak(`Message set.`);
      }
    } catch (err) {
      speak(`Sorry, I didn't catch that.`);
    }
  };

  const handleSend = async () => {
    if (!to || !message) {
      speak("Please fill in recipient and message before sending.");
      onAnnouncement("Please fill in recipient and message before sending.");
      return;
    }
    
    setIsSending(true);
    
    try {
      const emailData = {
        to: to.trim(),
        subject: subject.trim() || 'No Subject',
        body: message.trim(),
        voiceTranscript: isVoiceMode ? message : null
      };
      
      const response = await apiService.sendEmail(emailData);
      
      speak(`Email sent successfully to ${to}`);
      onAnnouncement(`Email sent to ${to}`);
      
      // Clear form
      setTo("");
      setSubject("");
      setMessage("");
      setCurrentField("to");
      
    } catch (error) {
      const errorMsg = `Failed to send email: ${error.message}`;
      speak(errorMsg);
      onAnnouncement(errorMsg);
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!to && !subject && !message) {
      speak("Please enter some content before saving draft.");
      onAnnouncement("Please enter some content before saving draft.");
      return;
    }
    
    setIsSavingDraft(true);
    
    try {
      const draftData = {
        to: to.trim() || null,
        subject: subject.trim() || null,
        body: message.trim() || null,
        voiceTranscript: isVoiceMode ? message : null
      };
      
      await apiService.saveDraft(draftData);
      
      speak("Draft saved successfully");
      onAnnouncement("Draft saved successfully");
      
      // Clear form
      setTo("");
      setSubject("");
      setMessage("");
      setCurrentField("to");
      
    } catch (error) {
      const errorMsg = `Failed to save draft: ${error.message}`;
      speak(errorMsg);
      onAnnouncement(errorMsg);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const readCurrentForm = () => {
    const formContent = `Recipient: ${to || 'not set'}. Subject: ${subject || 'not set'}. Message: ${message || 'not set'}`;
    speak(formContent);
    onAnnouncement(formContent);
  };

  return (
    <div className="card" role="region" aria-label="Compose email">
      <h2 tabIndex="0">Compose Email</h2>
      
      <div className="compose-controls">
        <button 
          onClick={startVoiceCompose}
          className="voice-compose-btn"
          aria-label="Start voice compose mode"
        >
          🎙 Voice Compose
        </button>
        
        <button 
          onClick={readCurrentForm}
          className="read-form-btn"
          aria-label="Read current form content"
        >
          📖 Read Form
        </button>
      </div>

      {isVoiceMode && (
        <div className="voice-mode-indicator" role="status" aria-live="polite">
          <p>🎧 Voice mode active - Listening for: {currentField}</p>
        </div>
      )}

      <div className="form-fields">
        <label htmlFor="to-field" className="field-label">
          Recipient Email:
        </label>
        <div className="form-group">
          <input
            id="to-field"
            type="email"
            placeholder="Recipient Email"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            aria-describedby="to-help"
            className="form-input"
          />
          <button 
            type="button" 
            className="voice-input-btn"
            onClick={() => handleFieldVoiceInput('to')}
            aria-label="Speak recipient email"
          >
            🎙️
          </button>
        </div>
        <div id="to-help" className="field-help">
          Enter the email address of the recipient
        </div>

        <label htmlFor="subject-field" className="field-label">
          Subject:
        </label>
        <div className="form-group">
          <input
            id="subject-field"
            type="text"
            placeholder="Email Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            aria-describedby="subject-help"
            className="form-input"
          />
          <button 
            type="button" 
            className="voice-input-btn"
            onClick={() => handleFieldVoiceInput('subject')}
            aria-label="Speak email subject"
          >
            🎙️
          </button>
        </div>
        <div id="subject-help" className="field-help">
          Enter the subject of your email
        </div>

        <label htmlFor="message-field" className="field-label">
          Message:
        </label>
        <div className="form-group">
          <textarea
            id="message-field"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            aria-describedby="message-help"
            className="form-textarea"
            rows="6"
          />
          <button 
            type="button" 
            className="voice-input-btn"
            onClick={() => handleFieldVoiceInput('message')}
            aria-label="Speak email message"
          >
            🎙️
          </button>
        </div>
        <div id="message-help" className="field-help">
          Enter the content of your email message
        </div>
      </div>

      <div className="form-actions">
        <button 
          onClick={handleSend}
          className="send-btn"
          disabled={isSending || isSavingDraft}
          aria-label={isSending ? "Sending email..." : "Send email"}
        >
          {isSending ? (
            <>
              <span className="spinner">⏳</span>
              Sending...
            </>
          ) : (
            <>
              📧 Send Email
            </>
          )}
        </button>
        
        <button 
          onClick={handleSaveDraft}
          className="save-draft-btn"
          disabled={isSending || isSavingDraft}
          aria-label={isSavingDraft ? "Saving draft..." : "Save as draft"}
        >
          {isSavingDraft ? (
            <>
              <span className="spinner">⏳</span>
              Saving...
            </>
          ) : (
            <>
              💾 Save Draft
            </>
          )}
        </button>
        
        <button 
          onClick={() => {
            setTo("");
            setSubject("");
            setMessage("");
            setCurrentField("to");
            speak("Form cleared");
            onAnnouncement("Form cleared");
          }}
          className="clear-btn"
          disabled={isSending || isSavingDraft}
          aria-label="Clear form"
        >
          🗑️ Clear
        </button>
      </div>

      <div className="compose-help">
        <h3>Voice Compose Instructions:</h3>
        <ol>
          <li>Click "Voice Compose" to start</li>
          <li>Speak the recipient email address</li>
          <li>Speak the subject line</li>
          <li>Speak your message</li>
          <li>Click "Send Email" when done</li>
        </ol>
      </div>
    </div>
  );
}
