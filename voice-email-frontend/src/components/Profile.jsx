import React, { useState, useRef, useEffect } from "react";
import apiService from "../services/api";
import { useAccessibility } from "../contexts/AccessibilityContext";

export default function Profile({ onAnnouncement }) {
  const { blindMode, announce, speak, listen, isSpeaking } = useAccessibility();
  const [profile, setProfile] = useState({
    name: "John Doe",
    email: "john.doe@email.com",
    phone: "+1-555-0123",
    organization: "Accessibility Solutions Inc.",
    title: "Accessibility Specialist",
    bio: "Passionate about making technology accessible to everyone. Working to improve digital inclusion through innovative solutions.",
    preferences: {
      emailNotifications: true,
      voiceNotifications: true,
      autoReadNew: true,
      highContrast: false,
      largeText: false
    },
    accessibility: {
      screenReader: "NVDA",
      voiceSpeed: 1.0,
      voicePitch: 1.0,
      voiceVolume: 1.0,
      keyboardNavigation: true
    }
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState("");
  
  useEffect(() => {
    // Load profile from backend and sync to localStorage
    const loadProfile = async () => {
      try {
        const response = await apiService.getProfile();
        const serverUser = response?.user || {};
        const serverVoice = serverUser.voice_settings || {};
        const serverAccessibility = serverUser.accessibility_settings || {};
    
        const mergedProfile = {
          ...profile,
          name: serverUser.name || profile.name,
          email: serverUser.email || profile.email,
          accessibility: {
            ...profile.accessibility,
            // Map server voice settings to local keys
            voiceSpeed: serverVoice.rate ?? profile.accessibility.voiceSpeed,
            voicePitch: serverVoice.pitch ?? profile.accessibility.voicePitch,
            voiceVolume: serverVoice.volume ?? profile.accessibility.voiceVolume,
            // Merge server accessibility settings
            highContrast: serverAccessibility.highContrast ?? profile.accessibility.highContrast,
            largeText: serverAccessibility.largeText ?? profile.accessibility.largeText,
            keyboardNavigation: serverAccessibility.keyboardNavigation ?? profile.accessibility.keyboardNavigation,
            screenReader: serverAccessibility.screenReader ?? profile.accessibility.screenReader,
          },
          // Preferences remain client-side for now; reflect accessibility mirrors
          preferences: {
            ...profile.preferences,
            highContrast: serverAccessibility.highContrast ?? profile.preferences.highContrast,
            largeText: serverAccessibility.largeText ?? profile.preferences.largeText,
          },
        };
    
        setProfile(mergedProfile);
        localStorage.setItem("userProfile", JSON.stringify(mergedProfile));
        onAnnouncement("Profile loaded from account");
      } catch (err) {
        // Fallback to localStorage if backend unavailable
        const savedProfile = localStorage.getItem("userProfile");
        if (savedProfile) {
          setProfile(JSON.parse(savedProfile));
          onAnnouncement("Loaded profile from local settings");
        }
      }
    };
  
    loadProfile();
  }, []);

  const readProfile = () => {
    const profileText = `Profile: ${profile.name}. Email: ${profile.email}. Phone: ${profile.phone}. Organization: ${profile.organization}. Title: ${profile.title}. Bio: ${profile.bio}`;
    speak(profileText);
    onAnnouncement("Reading profile information");
  };

  const startEdit = (field, currentValue) => {
    setEditingField(field);
    setEditValue(currentValue);
    setIsEditing(true);
    speak(`Editing ${field}. Current value: ${currentValue}. You can type or use the voice input button to update.`);
    onAnnouncement(`Editing ${field}`);
  };

  const handleVoiceInput = async () => {
    try {
      speak(`Please speak the new value for ${editingField}`);
      const transcript = await listen();
      setEditValue(transcript.trim());
      speak(`I heard: ${transcript}. Click save to update.`);
    } catch (err) {
      speak("Sorry, I didn't catch that. Please try again.");
    }
  };

  const saveEdit = async () => {
    if (!editValue.trim()) {
      speak("Please enter a value to save");
      onAnnouncement("Please enter a value to save");
      return;
    }

    const field = editingField;
    const newValue = editValue.trim();
  
    // Update local state immediately
    setProfile(prev => ({
      ...prev,
      [field]: newValue
    }));
  
    // Persist name to backend; email remains read-only in backend
    try {
      if (field === "name") {
        await apiService.updateProfile({ name: newValue });
      }
    } catch (err) {
      // Non-blocking: keep local update even if server fails
    }
  
    const updatedProfile = {
      ...profile,
      [field]: newValue
    };
    localStorage.setItem("userProfile", JSON.stringify(updatedProfile));
  
    speak(`${field} updated to ${newValue}`);
    onAnnouncement(`${field} updated successfully`);
  
    setIsEditing(false);
    setEditingField(null);
    setEditValue("");
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditingField(null);
    setEditValue("");
    speak("Edit cancelled");
    onAnnouncement("Edit cancelled");
  };

  const togglePreference = async (preference) => {
    const newValue = !profile.preferences[preference];
  
    setProfile(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [preference]: newValue
      }
    }));
  
    speak(`${preference} ${newValue ? 'enabled' : 'disabled'}`);
    onAnnouncement(`${preference} ${newValue ? 'enabled' : 'disabled'}`);
  
    // Persist accessibility-related preferences to server (merge behavior)
    try {
      if (preference === 'highContrast' || preference === 'largeText') {
        await apiService.updateUserPreferences({
          accessibility: { [preference]: newValue }
        });
      }
    } catch (err) {
      // Gracefully continue on failure
    }
  
    const updatedProfile = {
      ...profile,
      preferences: {
        ...profile.preferences,
        [preference]: newValue
      }
    };
    localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
  };

  const updateAccessibilitySetting = async (setting, value) => {
    setProfile(prev => ({
      ...prev,
      accessibility: {
        ...prev.accessibility,
        [setting]: value
      }
    }));
  
    speak(`${setting} set to ${value}`);
    onAnnouncement(`${setting} updated`);
  
    // Persist to backend using merge-friendly endpoint
    try {
      if (setting === 'voiceSpeed') {
        await apiService.updateUserPreferences({ voice: { rate: value } });
      } else if (setting === 'voicePitch') {
        await apiService.updateUserPreferences({ voice: { pitch: value } });
      } else if (setting === 'voiceVolume') {
        await apiService.updateUserPreferences({ voice: { volume: value } });
      } else {
        await apiService.updateUserPreferences({ accessibility: { [setting]: value } });
      }
    } catch (err) {
      // Non-blocking; local value still applied
    }
  
    const updatedProfile = {
      ...profile,
      accessibility: {
        ...profile.accessibility,
        [setting]: value
      }
    };
    localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
  };

  const exportProfile = () => {
    const profileData = {
      ...profile,
      exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(profileData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'voice-email-profile.json';
    link.click();
    
    URL.revokeObjectURL(url);
    
    speak("Profile exported successfully");
    onAnnouncement("Profile exported successfully");
  };

  return (
    <div className="card" role="region" aria-label="User profile">
      <h2 tabIndex="0">My Profile</h2>
      
      <div className="profile-controls">
        <button 
          onClick={readProfile}
          className="read-profile-btn"
          disabled={isSpeaking}
          aria-label="Read profile information"
        >
          📖 Read Profile
        </button>
        
        <button 
          onClick={exportProfile}
          className="export-profile-btn"
          aria-label="Export profile data"
        >
          📤 Export Profile
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

      {/* Basic Information */}
      <section className="profile-section" aria-labelledby="basic-info-heading">
        <h3 id="basic-info-heading">Basic Information</h3>
        
        <div className="profile-field">
          <label className="profile-label">Name:</label>
          <div className="profile-value">
            {editingField === 'name' ? (
              <>
                <input
                  id="edit-field"
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="profile-input"
                  autoFocus
                />
                <button 
                  type="button" 
                  className="voice-input-btn"
                  onClick={handleVoiceInput}
                  aria-label="Speak new value"
                >
                  🎙️
                </button>
              </>
            ) : (
              <span>{profile.name}</span>
            )}
            {!isEditing && (
              <button 
                onClick={() => startEdit('name', profile.name)}
                className="edit-field-btn"
                aria-label="Edit name"
              >
                ✏️ Edit
              </button>
            )}
          </div>
        </div>

        <div className="profile-field">
          <label className="profile-label">Email:</label>
          <div className="profile-value">
            {editingField === 'email' ? (
              <input
                type="email"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="profile-input"
                autoFocus
              />
            ) : (
              <span>{profile.email}</span>
            )}
            {!isEditing && (
              <button 
                onClick={() => startEdit('email', profile.email)}
                className="edit-field-btn"
                aria-label="Edit email"
              >
                ✏️ Edit
              </button>
            )}
          </div>
        </div>

        <div className="profile-field">
          <label className="profile-label">Phone:</label>
          <div className="profile-value">
            {editingField === 'phone' ? (
              <>
                <input
                  id="edit-field"
                  type="tel"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="profile-input"
                  autoFocus
                />
                <button 
                  type="button" 
                  className="voice-input-btn"
                  onClick={handleVoiceInput}
                  aria-label="Speak new value"
                >
                  🎙️
                </button>
              </>
            ) : (
              <span>{profile.phone}</span>
            )}
            {!isEditing && (
              <button 
                onClick={() => startEdit('phone', profile.phone)}
                className="edit-field-btn"
                aria-label="Edit phone"
              >
                ✏️ Edit
              </button>
            )}
          </div>
        </div>

        <div className="profile-field">
          <label className="profile-label">Organization:</label>
          <div className="profile-value">
            {editingField === 'organization' ? (
              <>
                <input
                  id="edit-field"
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="profile-input"
                  autoFocus
                />
                <button 
                  type="button" 
                  className="voice-input-btn"
                  onClick={handleVoiceInput}
                  aria-label="Speak new value"
                >
                  🎙️
                </button>
              </>
            ) : (
              <span>{profile.organization}</span>
            )}
            {!isEditing && (
              <button 
                onClick={() => startEdit('organization', profile.organization)}
                className="edit-field-btn"
                aria-label="Edit organization"
              >
                ✏️ Edit
              </button>
            )}
          </div>
        </div>

        <div className="profile-field">
          <label className="profile-label">Title:</label>
          <div className="profile-value">
            {editingField === 'title' ? (
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="profile-input"
                autoFocus
              />
            ) : (
              <span>{profile.title}</span>
            )}
            {!isEditing && (
              <button 
                onClick={() => startEdit('title', profile.title)}
                className="edit-field-btn"
                aria-label="Edit title"
              >
                ✏️ Edit
              </button>
            )}
          </div>
        </div>

        <div className="profile-field">
          <label className="profile-label">Bio:</label>
          <div className="profile-value">
            {editingField === 'bio' ? (
              <>
                <textarea
                  id="edit-field"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="profile-textarea"
                  rows="4"
                  autoFocus
                />
                <button 
                  type="button" 
                  className="voice-input-btn"
                  onClick={handleVoiceInput}
                  aria-label="Speak new value"
                >
                  🎙️
                </button>
              </>
            ) : (
              <span>{profile.bio}</span>
            )}
            {!isEditing && (
              <button 
                onClick={() => startEdit('bio', profile.bio)}
                className="edit-field-btn"
                aria-label="Edit bio"
              >
                ✏️ Edit
              </button>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="edit-actions">
            <button onClick={saveEdit} className="save-edit-btn">
              💾 Save
            </button>
            <button onClick={cancelEdit} className="cancel-edit-btn">
              ❌ Cancel
            </button>
          </div>
        )}
      </section>

      {/* Preferences */}
      <section className="profile-section" aria-labelledby="preferences-heading">
        <h3 id="preferences-heading">Preferences</h3>
        
        <div className="preferences-grid">
          <label className="preference-item">
            <input
              type="checkbox"
              checked={profile.preferences.emailNotifications}
              onChange={() => togglePreference('emailNotifications')}
              className="preference-checkbox"
            />
            Email notifications
          </label>

          <label className="preference-item">
            <input
              type="checkbox"
              checked={profile.preferences.voiceNotifications}
              onChange={() => togglePreference('voiceNotifications')}
              className="preference-checkbox"
            />
            Voice notifications
          </label>

          <label className="preference-item">
            <input
              type="checkbox"
              checked={profile.preferences.autoReadNew}
              onChange={() => togglePreference('autoReadNew')}
              className="preference-checkbox"
            />
            Auto-read new emails
          </label>

          <label className="preference-item">
            <input
              type="checkbox"
              checked={profile.preferences.highContrast}
              onChange={() => togglePreference('highContrast')}
              className="preference-checkbox"
            />
            High contrast mode
          </label>

          <label className="preference-item">
            <input
              type="checkbox"
              checked={profile.preferences.largeText}
              onChange={() => togglePreference('largeText')}
              className="preference-checkbox"
            />
            Large text mode
          </label>
        </div>
      </section>

      {/* Accessibility Settings */}
      <section className="profile-section" aria-labelledby="accessibility-heading">
        <h3 id="accessibility-heading">Accessibility Settings</h3>
        
        <div className="accessibility-settings">
          <div className="accessibility-field">
            <label htmlFor="screen-reader" className="accessibility-label">
              Screen Reader:
            </label>
            <select
              id="screen-reader"
              value={profile.accessibility.screenReader}
              onChange={(e) => updateAccessibilitySetting('screenReader', e.target.value)}
              className="accessibility-select"
            >
              <option value="NVDA">NVDA</option>
              <option value="JAWS">JAWS</option>
              <option value="VoiceOver">VoiceOver</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="accessibility-field">
            <label htmlFor="voice-speed" className="accessibility-label">
              Voice Speed: {profile.accessibility.voiceSpeed}x
            </label>
            <input
              id="voice-speed"
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={profile.accessibility.voiceSpeed}
              onChange={(e) => updateAccessibilitySetting('voiceSpeed', parseFloat(e.target.value))}
              className="accessibility-slider"
            />
          </div>

          <div className="accessibility-field">
            <label htmlFor="voice-pitch" className="accessibility-label">
              Voice Pitch: {profile.accessibility.voicePitch}x
            </label>
            <input
              id="voice-pitch"
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={profile.accessibility.voicePitch}
              onChange={(e) => updateAccessibilitySetting('voicePitch', parseFloat(e.target.value))}
              className="accessibility-slider"
            />
          </div>

          <div className="accessibility-field">
            <label htmlFor="voice-volume" className="accessibility-label">
              Voice Volume: {Math.round(profile.accessibility.voiceVolume * 100)}%
            </label>
            <input
              id="voice-volume"
              type="range"
              min="0.1"
              max="1.0"
              step="0.1"
              value={profile.accessibility.voiceVolume}
              onChange={(e) => updateAccessibilitySetting('voiceVolume', parseFloat(e.target.value))}
              className="accessibility-slider"
            />
          </div>

          <label className="accessibility-checkbox">
            <input
              type="checkbox"
              checked={profile.accessibility.keyboardNavigation}
              onChange={() => updateAccessibilitySetting('keyboardNavigation', !profile.accessibility.keyboardNavigation)}
              className="accessibility-checkbox-input"
            />
            Enhanced keyboard navigation
          </label>
        </div>
      </section>

      <div className="profile-help">
        <h3>Profile Help:</h3>
        <ul>
          <li>Click "Read Profile" to hear all your information</li>
          <li>Use "Edit" buttons to modify your information</li>
          <li>Toggle preferences to customize your experience</li>
          <li>Adjust accessibility settings for optimal use</li>
          <li>Export your profile to backup your settings</li>
        </ul>
      </div>
    </div>
  );
}
