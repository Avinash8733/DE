import React, { useState, useRef, useEffect } from "react";
import { useAccessibility } from "../contexts/AccessibilityContext";

export default function Settings({ onAnnouncement }) {
  const { speak, isSpeaking } = useAccessibility();
  const [voiceSettings, setVoiceSettings] = useState({
    speechRate: 1.0,
    speechPitch: 1.0,
    speechVolume: 1.0,
    voice: 'default',
    autoRead: true,
    confirmActions: true,
    announceNavigation: true
  });
  
  const [accessibilitySettings, setAccessibilitySettings] = useState({
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    keyboardShortcuts: true,
    focusIndicators: true
  });
  
  const [emailSettings, setEmailSettings] = useState({
    autoSave: true,
    autoReadNew: true,
    voiceNotifications: true,
    emailSignature: "Sent via Voice Email System"
  });
  
  useEffect(() => {
    // Load saved settings from localStorage
    loadSettings();
  }, []);

  const loadSettings = () => {
    const savedVoice = localStorage.getItem('voiceSettings');
    const savedAccessibility = localStorage.getItem('accessibilitySettings');
    const savedEmail = localStorage.getItem('emailSettings');
    
    if (savedVoice) setVoiceSettings(JSON.parse(savedVoice));
    if (savedAccessibility) setAccessibilitySettings(JSON.parse(savedAccessibility));
    if (savedEmail) setEmailSettings(JSON.parse(savedEmail));
  };

  const saveSettings = () => {
    localStorage.setItem('voiceSettings', JSON.stringify(voiceSettings));
    localStorage.setItem('accessibilitySettings', JSON.stringify(accessibilitySettings));
    localStorage.setItem('emailSettings', JSON.stringify(emailSettings));
    speak("Settings saved successfully");
    onAnnouncement("Settings saved successfully");
  };

  const testVoice = () => {
    speak("This is a test of your current voice settings. You can adjust the rate, pitch, and volume to your preference.");
  };

  const resetToDefaults = () => {
    setVoiceSettings({
      speechRate: 1.0,
      speechPitch: 1.0,
      speechVolume: 1.0,
      voice: 'default',
      autoRead: true,
      confirmActions: true,
      announceNavigation: true
    });
    setAccessibilitySettings({
      highContrast: false,
      largeText: false,
      reducedMotion: false,
      keyboardShortcuts: true,
      focusIndicators: true
    });
    setEmailSettings({
      autoSave: true,
      autoReadNew: true,
      voiceNotifications: true,
      emailSignature: "Sent via Voice Email System"
    });
    speak("Settings reset to defaults");
    onAnnouncement("Settings reset to defaults");
  };

  const handleVoiceSettingChange = (setting, value) => {
    setVoiceSettings(prev => ({ ...prev, [setting]: value }));
    if (setting === 'speechRate' || setting === 'speechPitch' || setting === 'speechVolume') {
      speak(`Voice ${setting} set to ${value}`);
    }
  };

  const handleAccessibilitySettingChange = (setting, value) => {
    setAccessibilitySettings(prev => ({ ...prev, [setting]: value }));
    speak(`${setting} ${value ? 'enabled' : 'disabled'}`);
  };

  const handleEmailSettingChange = (setting, value) => {
    setEmailSettings(prev => ({ ...prev, [setting]: value }));
    speak(`${setting} ${value ? 'enabled' : 'disabled'}`);
  };

  return (
    <div className="card" role="region" aria-label="Settings">
      <h2 tabIndex="0">Settings & Preferences</h2>
      
      <div className="settings-sections">
        {/* Voice Settings */}
        <section className="settings-section" aria-labelledby="voice-settings-heading">
          <h3 id="voice-settings-heading">Voice Settings</h3>
          
          <div className="setting-group">
            <label htmlFor="speech-rate" className="setting-label">
              Speech Rate: {voiceSettings.speechRate}x
            </label>
            <input
              id="speech-rate"
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={voiceSettings.speechRate}
              onChange={(e) => handleVoiceSettingChange('speechRate', parseFloat(e.target.value))}
              className="setting-slider"
              aria-describedby="speech-rate-help"
            />
            <div id="speech-rate-help" className="setting-help">
              Adjust how fast the voice speaks
            </div>
          </div>

          <div className="setting-group">
            <label htmlFor="speech-pitch" className="setting-label">
              Speech Pitch: {voiceSettings.speechPitch}x
            </label>
            <input
              id="speech-pitch"
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={voiceSettings.speechPitch}
              onChange={(e) => handleVoiceSettingChange('speechPitch', parseFloat(e.target.value))}
              className="setting-slider"
              aria-describedby="speech-pitch-help"
            />
            <div id="speech-pitch-help" className="setting-help">
              Adjust the pitch of the voice
            </div>
          </div>

          <div className="setting-group">
            <label htmlFor="speech-volume" className="setting-label">
              Speech Volume: {Math.round(voiceSettings.speechVolume * 100)}%
            </label>
            <input
              id="speech-volume"
              type="range"
              min="0.1"
              max="1.0"
              step="0.1"
              value={voiceSettings.speechVolume}
              onChange={(e) => handleVoiceSettingChange('speechVolume', parseFloat(e.target.value))}
              className="setting-slider"
              aria-describedby="speech-volume-help"
            />
            <div id="speech-volume-help" className="setting-help">
              Adjust the volume of the voice
            </div>
          </div>

          <div className="setting-group">
            <label className="setting-checkbox-label">
              <input
                type="checkbox"
                checked={voiceSettings.autoRead}
                onChange={(e) => handleVoiceSettingChange('autoRead', e.target.checked)}
                className="setting-checkbox"
              />
              Auto-read new emails
            </label>
          </div>

          <div className="setting-group">
            <label className="setting-checkbox-label">
              <input
                type="checkbox"
                checked={voiceSettings.confirmActions}
                onChange={(e) => handleVoiceSettingChange('confirmActions', e.target.checked)}
                className="setting-checkbox"
              />
              Confirm actions with voice
            </label>
          </div>

          <div className="setting-group">
            <label className="setting-checkbox-label">
              <input
                type="checkbox"
                checked={voiceSettings.announceNavigation}
                onChange={(e) => handleVoiceSettingChange('announceNavigation', e.target.checked)}
                className="setting-checkbox"
              />
              Announce navigation changes
            </label>
          </div>

          <button onClick={testVoice} className="test-voice-btn">
            🔊 Test Voice Settings
          </button>
        </section>

        {/* Accessibility Settings */}
        <section className="settings-section" aria-labelledby="accessibility-settings-heading">
          <h3 id="accessibility-settings-heading">Accessibility Settings</h3>
          
          <div className="setting-group">
            <label className="setting-checkbox-label">
              <input
                type="checkbox"
                checked={accessibilitySettings.highContrast}
                onChange={(e) => handleAccessibilitySettingChange('highContrast', e.target.checked)}
                className="setting-checkbox"
              />
              High contrast mode
            </label>
          </div>

          <div className="setting-group">
            <label className="setting-checkbox-label">
              <input
                type="checkbox"
                checked={accessibilitySettings.largeText}
                onChange={(e) => handleAccessibilitySettingChange('largeText', e.target.checked)}
                className="setting-checkbox"
              />
              Large text mode
            </label>
          </div>

          <div className="setting-group">
            <label className="setting-checkbox-label">
              <input
                type="checkbox"
                checked={accessibilitySettings.reducedMotion}
                onChange={(e) => handleAccessibilitySettingChange('reducedMotion', e.target.checked)}
                className="setting-checkbox"
              />
              Reduce motion and animations
            </label>
          </div>

          <div className="setting-group">
            <label className="setting-checkbox-label">
              <input
                type="checkbox"
                checked={accessibilitySettings.keyboardShortcuts}
                onChange={(e) => handleAccessibilitySettingChange('keyboardShortcuts', e.target.checked)}
                className="setting-checkbox"
              />
              Enable keyboard shortcuts
            </label>
          </div>

          <div className="setting-group">
            <label className="setting-checkbox-label">
              <input
                type="checkbox"
                checked={accessibilitySettings.focusIndicators}
                onChange={(e) => handleAccessibilitySettingChange('focusIndicators', e.target.checked)}
                className="setting-checkbox"
              />
              Enhanced focus indicators
            </label>
          </div>
        </section>

        {/* Email Settings */}
        <section className="settings-section" aria-labelledby="email-settings-heading">
          <h3 id="email-settings-heading">Email Settings</h3>
          
          <div className="setting-group">
            <label className="setting-checkbox-label">
              <input
                type="checkbox"
                checked={emailSettings.autoSave}
                onChange={(e) => handleEmailSettingChange('autoSave', e.target.checked)}
                className="setting-checkbox"
              />
              Auto-save drafts
            </label>
          </div>

          <div className="setting-group">
            <label className="setting-checkbox-label">
              <input
                type="checkbox"
                checked={emailSettings.autoReadNew}
                onChange={(e) => handleEmailSettingChange('autoReadNew', e.target.checked)}
                className="setting-checkbox"
              />
              Auto-read new emails
            </label>
          </div>

          <div className="setting-group">
            <label className="setting-checkbox-label">
              <input
                type="checkbox"
                checked={emailSettings.voiceNotifications}
                onChange={(e) => handleEmailSettingChange('voiceNotifications', e.target.checked)}
                className="setting-checkbox"
              />
              Voice notifications for new emails
            </label>
          </div>

          <div className="setting-group">
            <label htmlFor="email-signature" className="setting-label">
              Email Signature:
            </label>
            <textarea
              id="email-signature"
              value={emailSettings.emailSignature}
              onChange={(e) => handleEmailSettingChange('emailSignature', e.target.value)}
              className="setting-textarea"
              rows="3"
              aria-describedby="email-signature-help"
            />
            <div id="email-signature-help" className="setting-help">
              This signature will be added to all outgoing emails
            </div>
          </div>
        </section>
      </div>

      <div className="settings-actions">
        <button onClick={saveSettings} className="save-settings-btn">
          💾 Save Settings
        </button>
        
        <button onClick={resetToDefaults} className="reset-settings-btn">
          🔄 Reset to Defaults
        </button>
      </div>

      <div className="settings-help">
        <h3>Settings Help:</h3>
        <ul>
          <li>Adjust voice settings to your preference</li>
          <li>Enable accessibility features for better usability</li>
          <li>Configure email behavior and notifications</li>
          <li>Settings are automatically saved to your browser</li>
        </ul>
      </div>
    </div>
  );
}
