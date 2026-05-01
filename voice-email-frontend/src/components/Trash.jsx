import React, { useState, useRef, useEffect, useCallback } from "react";
import apiService from "../services/api";
import { useAccessibility } from "../contexts/AccessibilityContext";

export default function Trash({ onAnnouncement }) {
  const { blindMode, announce, speak, isSpeaking } = useAccessibility();
  const [trashEmails, setTrashEmails] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const fetchTrashEmails = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.getEmails({ folder: "trash" });
      setTrashEmails(response?.emails || []);
      setIsLoading(false);

      if (response?.emails?.length > 0) {
        onAnnouncement(`${response.emails.length} deleted emails loaded`);
      } else {
        onAnnouncement("Trash is empty");
      }
    } catch (err) {
      console.error("Error fetching trash emails:", err);
      setError("Failed to load trash emails. Please try again later.");
      setIsLoading(false);
      onAnnouncement("Error loading trash emails");
    }
  }, [onAnnouncement]);

  useEffect(() => {
    fetchTrashEmails();
  }, [fetchTrashEmails]);

  const readEmail = (email) => {
    const emailText = `Deleted email from ${email.from_email}. Subject: ${email.subject || 'No subject'}. Message: ${email.body}. Deleted on ${new Date(email.created_at).toLocaleString()}`;
    speak(emailText);
    setSelectedEmail(email.id);
    onAnnouncement(`Reading deleted email from ${email.from_email}`);
  };

  const readTrashList = () => {
    if (!trashEmails || trashEmails.length === 0) {
      speak("Trash is empty");
      onAnnouncement("Trash is empty");
      return;
    }

    const listText = `You have ${trashEmails.length} emails in trash. ${trashEmails
      .map(
        (email, index) =>
          `Email ${index + 1}: From ${email.from || "Unknown"}, Subject: ${
            email.subject || "No subject"
          }`
      )
      .join(". ")}`;
    speak(listText);
    onAnnouncement(`Reading trash list. ${trashEmails.length} emails in trash.`);
  };

  const restoreEmail = (emailId) => {
    const email = trashEmails.find((e) => e.id === emailId);
    if (email) {
      const updatedTrash = trashEmails.filter((e) => e.id !== emailId);
      setTrashEmails(updatedTrash);
      localStorage.setItem("trashEmails", JSON.stringify(updatedTrash));

      speak(`Email from ${email.from || "Unknown"} restored to inbox`);
      onAnnouncement(`Email from ${email.from || "Unknown"} restored to inbox`);
    }
  };

  const permanentlyDeleteEmail = (emailId) => {
    const email = trashEmails.find((e) => e.id === emailId);
    if (email) {
      const updatedTrash = trashEmails.filter((e) => e.id !== emailId);
      setTrashEmails(updatedTrash);
      localStorage.setItem("trashEmails", JSON.stringify(updatedTrash));

      speak(`Email from ${email.from || "Unknown"} permanently deleted`);
      onAnnouncement(`Email from ${email.from || "Unknown"} permanently deleted`);
    }
  };

  const emptyTrash = () => {
    if (trashEmails.length === 0) {
      speak("Trash is already empty");
      onAnnouncement("Trash is already empty");
      return;
    }

    setTrashEmails([]);
    localStorage.setItem("trashEmails", JSON.stringify([]));

    speak(`Trash emptied. ${trashEmails.length} emails permanently deleted`);
    onAnnouncement(`Trash emptied. ${trashEmails.length} emails permanently deleted`);
  };

  const confirmEmptyTrash = () => {
    if (trashEmails.length === 0) {
      speak("Trash is already empty");
      return;
    }

    speak(
      `Are you sure you want to permanently delete all ${trashEmails.length} emails in trash? This action cannot be undone.`
    );
    setShowConfirmDialog(true);
  };

  const cancelEmptyTrash = () => {
    setShowConfirmDialog(false);
    speak("Empty trash cancelled");
    onAnnouncement("Empty trash cancelled");
  };

  return (
    <div className="card" role="region" aria-label="Trash emails">
      <h2 tabIndex="0">Trash Emails ({trashEmails?.length || 0} emails)</h2>

      {isLoading ? (
        <div className="loading-state" aria-live="polite">
          <p>Loading trash emails...</p>
        </div>
      ) : error ? (
        <div className="error-state" aria-live="assertive">
          <p className="error-message">{error}</p>
          <button
            onClick={fetchTrashEmails}
            className="retry-btn"
            aria-label="Try loading emails again"
          >
            🔄 Retry
          </button>
        </div>
      ) : (
        <>
          <div className="trash-controls">
            <button
              onClick={readTrashList}
              className="read-list-btn"
              disabled={isSpeaking}
              aria-label="Read trash emails list"
            >
              📋 Read Trash List
            </button>

            <button
              onClick={confirmEmptyTrash}
              className="empty-trash-btn"
              disabled={trashEmails.length === 0}
              aria-label="Empty trash"
            >
              🗑️ Empty Trash
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

          {showConfirmDialog && (
            <div
              className="confirmation-dialog"
              role="dialog"
              aria-labelledby="confirm-title"
            >
              <h3 id="confirm-title">Confirm Empty Trash</h3>
              <p>
                Are you sure you want to permanently delete all{" "}
                {trashEmails.length} emails in trash?
              </p>
              <p>
                <strong>This action cannot be undone.</strong>
              </p>

              <div className="confirmation-actions">
                <button
                  onClick={() => {
                    emptyTrash();
                    setShowConfirmDialog(false);
                  }}
                  className="confirm-delete-btn"
                  aria-label="Confirm empty trash"
                >
                  ✅ Yes, Delete All
                </button>

                <button
                  onClick={cancelEmptyTrash}
                  className="cancel-delete-btn"
                  aria-label="Cancel empty trash"
                >
                  ❌ Cancel
                </button>
              </div>
            </div>
          )}

          {trashEmails.length === 0 ? (
            <div className="empty-state">
              <p>Trash is empty.</p>
              <p>
                Deleted emails will appear here and can be restored or
                permanently deleted.
              </p>
            </div>
          ) : (
            <div className="trash-list" role="list" aria-label="Trash emails list">
              {trashEmails.map((email) => (
                <div
                  key={email.id || Math.random()}
                  className={`trash-email ${
                    selectedEmail === email.id ? "selected" : ""
                  }`}
                  role="listitem"
                  tabIndex="0"
                  aria-label={`Deleted email from ${
                    email.from || "Unknown"
                  }, subject: ${email.subject || "No subject"}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      readEmail(email);
                    }
                  }}
                >
                  <div className="email-header">
                    <p className="email-from">
                      <strong>From:</strong> {email.from || "Unknown"}
                    </p>
                    <p className="email-subject">
                      <strong>Subject:</strong> {email.subject || "No subject"}
                    </p>
                    <p className="email-timestamp">
                      <strong>Received:</strong> {email.timestamp || "Unknown"}
                    </p>
                    <p className="email-deleted">
                      <strong>Deleted:</strong> {email.deletedDate || "Unknown"}
                    </p>
                  </div>

                  <div className="email-preview">
                    <p>
                      {email.message
                        ? email.message.length > 100
                          ? email.message.substring(0, 100) + "..."
                          : email.message
                        : "(No message content)"}
                    </p>
                  </div>

                  <div className="email-actions">
                    <button
                      onClick={() => readEmail(email)}
                      className="read-btn"
                      aria-label={`Read deleted email from ${
                        email.from || "Unknown"
                      }`}
                    >
                      📖 Read Full
                    </button>

                    <button
                      onClick={() => restoreEmail(email.id)}
                      className="restore-btn"
                      aria-label={`Restore email from ${email.from || "Unknown"}`}
                    >
                      ↩️ Restore
                    </button>

                    <button
                      onClick={() => permanentlyDeleteEmail(email.id)}
                      className="permanent-delete-btn"
                      aria-label={`Permanently delete email from ${
                        email.from || "Unknown"
                      }`}
                    >
                      🗑️ Delete Forever
                    </button>
                  </div>

                  <hr />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div className="trash-help">
        <h3>Trash Help:</h3>
        <ul>
          <li>Click "Read Trash List" to hear all deleted email summaries</li>
          <li>Click "Read Full" to hear the complete deleted email</li>
          <li>Use "Restore" to move an email back to inbox</li>
          <li>Use "Delete Forever" to permanently remove an email</li>
          <li>Use "Empty Trash" to permanently delete all emails</li>
          <li>Deleted emails stay in trash for 30 days by default</li>
        </ul>
      </div>
    </div>
  );
}
