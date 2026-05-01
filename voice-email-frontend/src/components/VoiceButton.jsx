import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAccessibility } from "../contexts/AccessibilityContext";

export default function VoiceButton({ onSectionChange, onAnnouncement, currentSection }) {
  const { blindMode, announce, speak, listen, isSpeaking } = useAccessibility();
  const [isListening, setIsListening] = useState(false);

  const handleVoiceCommand = useCallback((command) => {
    const cmd = command.toLowerCase().trim();
    
    // Navigation commands
    if (cmd.includes('compose') || cmd.includes('write email')) {
      onSectionChange('compose', 'Compose');
      speak("Switched to compose section");
    } else if (cmd.includes('inbox') || cmd.includes('read emails')) {
      onSectionChange('inbox', 'Inbox');
      speak("Switched to inbox section");
    } else if (cmd.includes('sent') || cmd.includes('sent emails')) {
      onSectionChange('sent', 'Sent');
      speak("Switched to sent section");
    } else if (cmd.includes('drafts') || cmd.includes('draft emails')) {
      onSectionChange('drafts', 'Drafts');
      speak("Switched to drafts section");
    } else if (cmd.includes('contacts') || cmd.includes('contact list')) {
      onSectionChange('contacts', 'Contacts');
      speak("Switched to contacts section");
    } else if (cmd.includes('trash') || cmd.includes('deleted emails')) {
      onSectionChange('trash', 'Trash');
      speak("Switched to trash section");
    } else if (cmd.includes('settings') || cmd.includes('preferences')) {
      onSectionChange('settings', 'Settings');
      speak("Switched to settings section");
    } else if (cmd.includes('help') || cmd.includes('support')) {
      onSectionChange('help', 'Help');
      speak("Switched to help section");
    } else if (cmd.includes('profile') || cmd.includes('my profile')) {
      onSectionChange('profile', 'Profile');
      speak("Switched to profile section");
    } else if (cmd.includes('read list') || cmd.includes('what emails')) {
      speak("Reading your email list");
      // Trigger a custom event that components can listen to
      window.dispatchEvent(new CustomEvent('voice-read-list'));
    } else if (cmd.includes('read page') || cmd.includes('where am i')) {
      window.dispatchEvent(new CustomEvent('voice-read-page'));
    } else if (cmd.includes('delete') || cmd.includes('remove')) {
      speak("Attempting to delete item");
      // Context specific delete logic could go here
    } else if (cmd.includes('logout') || cmd.includes('sign out')) {
      speak("Logging out. Goodbye!");
      // Trigger logout through a prop or global event if needed, 
      // but for now we'll just announce it.
    } else if (cmd.includes('stop') || cmd.includes('cancel')) {
      speak("Voice command cancelled");
    } else {
      // Handle email sending or other context-specific commands
      if (currentSection === 'compose') {
        onAnnouncement(`Email content updated: ${command}`);
        speak(`I added to your email: ${command}`);
      } else {
        onAnnouncement(`Voice input: ${command}`);
        speak(`I heard: ${command}`);
      }
    }
  }, [onSectionChange, onAnnouncement, speak, currentSection]);

  const toggleListening = async () => {
    if (isListening) return;
    
    try {
      setIsListening(true);
      const transcript = await listen();
      handleVoiceCommand(transcript);
    } catch (error) {
      console.error('Voice recognition error:', error);
      speak("I didn't catch that. Could you please repeat?");
    } finally {
      setIsListening(false);
    }
  };

  useEffect(() => {
    // Listen for spacebar to trigger voice command
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        toggleListening();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleListening]);

  return (
    <div className={`voice-button-container ${isListening ? 'listening' : ''}`}>
      <button 
        className={`voice-trigger ${isListening ? 'active' : ''}`}
        onClick={toggleListening}
        aria-label={isListening ? "Stop listening" : "Start voice command"}
        aria-pressed={isListening}
      >
        <div className="mic-icon">🎤</div>
        {isListening && <div className="listening-pulse"></div>}
      </button>
      {isListening && (
        <div className="voice-status" aria-live="polite">
          Listening...
        </div>
      )}
    </div>
  );
}
