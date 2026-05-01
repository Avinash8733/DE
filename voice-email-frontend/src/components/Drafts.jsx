import React, { useState, useRef, useEffect } from "react";
import { useAccessibility } from "../contexts/AccessibilityContext";

export default function Drafts({ onAnnouncement }) {
  const { blindMode, announce, speak, listen, isSpeaking } = useAccessibility();
  const [drafts, setDrafts] = useState([
    {
      id: 1,
      to: "colleague@company.com",
      subject: "Project Update",
      message: "Hi, I wanted to update you on the project progress. We've completed the first phase and are moving to...",
      timestamp: "2024-01-15 2:30 PM",
      lastModified: "2024-01-15 2:30 PM"
    },
    {
      id: 2,
      to: "friend@email.com",
      subject: "Weekend Plans",
      message: "Are you free this weekend? I was thinking we could go for a hike in the mountains. The weather looks great and...",
      timestamp: "2024-01-14 4:15 PM",
      lastModified: "2024-01-14 4:15 PM"
    },
    {
      id: 3,
      to: "client@business.com",
      subject: "Proposal Follow-up",
      message: "Thank you for your interest in our proposal. I wanted to follow up on our meeting and provide additional information about...",
      timestamp: "2024-01-13 11:20 AM",
      lastModified: "2024-01-13 11:20 AM"
    }
  ]);
  
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [isReading, setIsReading] = useState(false);
  const [editingDraft, setEditingDraft] = useState(null);
  const [editedDraft, setEditedDraft] = useState({ to: "", subject: "", message: "" });
  
  const synthRef = useRef(null);

  useEffect(() => {
    synthRef.current = window.speechSynthesis;
    // Load drafts from localStorage
    const savedDrafts = localStorage.getItem('drafts');
    if (savedDrafts) {
      setDrafts(JSON.parse(savedDrafts));
    }
  }, []);

  const readDraft = (draft) => {
    const draftText = `Draft to ${draft.to || 'not set'}. Subject: ${draft.subject || 'not set'}. Message: ${draft.message || 'not set'}. Last modified: ${draft.lastModified}`;
    speak(draftText);
    setSelectedDraft(draft.id);
    onAnnouncement(`Reading draft to ${draft.to || 'not set'}`);
  };

  const readDraftsList = () => {
    if (drafts.length === 0) {
      speak("You have no draft emails");
      onAnnouncement("No draft emails found");
      return;
    }
    
    const listText = `You have ${drafts.length} draft emails. ${drafts.map((draft, index) => 
      `Draft ${index + 1}: To ${draft.to}, Subject: ${draft.subject}`
    ).join('. ')}`;
    speak(listText);
    onAnnouncement(`Reading drafts list. ${drafts.length} drafts found.`);
  };

  const stopReading = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsReading(false);
    }
  };

  const editDraft = (draft) => {
    setEditingDraft(draft.id);
    setEditedDraft({
      to: draft.to,
      subject: draft.subject,
      message: draft.message
    });
    speak(`Editing draft to ${draft.to}`);
    onAnnouncement(`Editing draft to ${draft.to}`);
  };

  const saveDraft = () => {
    if (!editedDraft.to || !editedDraft.message) {
      speak("Please fill in recipient and message to save draft");
      onAnnouncement("Please fill in recipient and message to save draft");
      return;
    }
    
    const updatedDrafts = drafts.map(draft => 
      draft.id === editingDraft 
        ? { 
            ...draft, 
            to: editedDraft.to,
            subject: editedDraft.subject,
            message: editedDraft.message,
            lastModified: new Date().toLocaleString()
          }
        : draft
    );
    
    setDrafts(updatedDrafts);
    localStorage.setItem('drafts', JSON.stringify(updatedDrafts));
    
    speak(`Draft to ${editedDraft.to} saved successfully`);
    onAnnouncement(`Draft to ${editedDraft.to} saved successfully`);
    
    setEditingDraft(null);
    setEditedDraft({ to: "", subject: "", message: "" });
  };

  const sendDraft = (draft) => {
    speak(`Sending draft to ${draft.to}`);
    onAnnouncement(`Sending draft to ${draft.to}`);
    
    // Remove from drafts and add to sent (in a real app)
    const updatedDrafts = drafts.filter(d => d.id !== draft.id);
    setDrafts(updatedDrafts);
    localStorage.setItem('drafts', JSON.stringify(updatedDrafts));
    
    speak(`Draft sent to ${draft.to}`);
    onAnnouncement(`Draft sent to ${draft.to}`);
  };

  const deleteDraft = (draftId) => {
    const draft = drafts.find(d => d.id === draftId);
    if (draft) {
      const updatedDrafts = drafts.filter(d => d.id !== draftId);
      setDrafts(updatedDrafts);
      localStorage.setItem('drafts', JSON.stringify(updatedDrafts));
      
      speak(`Draft to ${draft.to} deleted`);
      onAnnouncement(`Draft to ${draft.to} deleted`);
    }
  };

  const cancelEdit = () => {
    setEditingDraft(null);
    setEditedDraft({ to: "", subject: "", message: "" });
    speak("Edit cancelled");
    onAnnouncement("Edit cancelled");
  };

  return (
    <div className="card" role="region" aria-label="Draft emails">
      <h2 tabIndex="0">Draft Emails ({drafts.length} drafts)</h2>
      
      <div className="drafts-controls">
        <button 
          onClick={readDraftsList}
          className="read-drafts-btn"
          disabled={isReading}
          aria-label="Read drafts list"
        >
          📋 Read Drafts List
        </button>
        
        {isReading && (
          <button 
            onClick={stopReading}
            className="stop-reading-btn"
            aria-label="Stop reading"
          >
            🔇 Stop Reading
          </button>
        )}
      </div>

      {drafts.length === 0 ? (
        <div className="empty-state">
          <p>No draft emails yet.</p>
          <p>Start composing an email to create your first draft!</p>
        </div>
      ) : (
        <div className="drafts-list" role="list" aria-label="Draft emails list">
          {drafts.map((draft) => (
            <div 
              key={draft.id} 
              className={`draft ${selectedDraft === draft.id ? 'selected' : ''}`}
              role="listitem"
              tabIndex="0"
              aria-label={`Draft email to ${draft.to}, subject: ${draft.subject}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  readDraft(draft);
                }
              }}
            >
              {editingDraft === draft.id ? (
                <div className="edit-draft-form" role="form" aria-label="Edit draft">
                  <h4>Edit Draft</h4>
                  
                  <div className="form-fields">
                    <label htmlFor="edit-to" className="field-label">
                      To:
                    </label>
                    <input
                      id="edit-to"
                      type="email"
                      value={editedDraft.to}
                      onChange={(e) => setEditedDraft(prev => ({ ...prev, to: e.target.value }))}
                      className="form-input"
                    />

                    <label htmlFor="edit-subject" className="field-label">
                      Subject:
                    </label>
                    <input
                      id="edit-subject"
                      type="text"
                      value={editedDraft.subject}
                      onChange={(e) => setEditedDraft(prev => ({ ...prev, subject: e.target.value }))}
                      className="form-input"
                    />

                    <label htmlFor="edit-message" className="field-label">
                      Message:
                    </label>
                    <textarea
                      id="edit-message"
                      value={editedDraft.message}
                      onChange={(e) => setEditedDraft(prev => ({ ...prev, message: e.target.value }))}
                      className="form-textarea"
                      rows="6"
                    />
                  </div>

                  <div className="form-actions">
                    <button onClick={saveDraft} className="save-draft-btn">
                      💾 Save Draft
                    </button>
                    
                    <button onClick={cancelEdit} className="cancel-btn">
                      ❌ Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="draft-header">
                    <p className="draft-to">
                      <strong>To:</strong> {draft.to}
                    </p>
                    <p className="draft-subject">
                      <strong>Subject:</strong> {draft.subject}
                    </p>
                    <p className="draft-timestamp">
                      <strong>Last Modified:</strong> {draft.lastModified}
                    </p>
                  </div>
                  
                  <div className="draft-preview">
                    <p>{draft.message.length > 150 ? draft.message.substring(0, 150) + '...' : draft.message}</p>
                  </div>

                  <div className="draft-actions">
                    <button 
                      onClick={() => readDraft(draft)}
                      className="read-draft-btn"
                      aria-label={`Read draft to ${draft.to}`}
                    >
                      📖 Read Full
                    </button>
                    
                    <button 
                      onClick={() => editDraft(draft)}
                      className="edit-draft-btn"
                      aria-label={`Edit draft to ${draft.to}`}
                    >
                      ✏️ Edit
                    </button>
                    
                    <button 
                      onClick={() => sendDraft(draft)}
                      className="send-draft-btn"
                      aria-label={`Send draft to ${draft.to}`}
                    >
                      📧 Send
                    </button>
                    
                    <button 
                      onClick={() => deleteDraft(draft.id)}
                      className="delete-draft-btn"
                      aria-label={`Delete draft to ${draft.to}`}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </>
              )}
              
              <hr />
            </div>
          ))}
        </div>
      )}

      <div className="drafts-help">
        <h3>Drafts Help:</h3>
        <ul>
          <li>Click "Read Drafts List" to hear all draft summaries</li>
          <li>Click "Read Full" to hear the complete draft</li>
          <li>Use "Edit" to modify a draft</li>
          <li>Use "Send" to send the draft as an email</li>
          <li>Use "Delete" to remove a draft permanently</li>
          <li>Drafts are automatically saved as you type</li>
        </ul>
      </div>
    </div>
  );
}
