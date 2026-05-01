import React, { useState, useRef, useEffect } from "react";
import { useAccessibility } from "../contexts/AccessibilityContext";

export default function Help({ onAnnouncement }) {
  const { speak, isSpeaking } = useAccessibility();
  const [currentSection, setCurrentSection] = useState("overview");

  const helpSections = {
    overview: {
      title: "Getting Started",
      content: `Welcome to the Voice Email System! This application is designed specifically for blind and visually impaired users.

Key Features:
- Complete voice control for all functions
- Text-to-speech for reading emails and interface feedback
- Screen reader compatibility
- Keyboard navigation support
- High contrast design for visual accessibility

To get started, try saying "help" or use the voice button to explore voice commands.`
    },
    voiceCommands: {
      title: "Voice Commands",
      content: `Voice Commands Available:

Navigation Commands:
- "Compose" or "Write email" - Switch to compose section
- "Inbox" or "Read emails" - Switch to inbox section  
- "Sent" or "Sent emails" - Switch to sent section
- "Drafts" - Switch to drafts section
- "Contacts" - Switch to contacts section
- "Trash" - Switch to trash section
- "Settings" - Switch to settings section
- "Help" - Show this help information

Email Commands:
- "Read email list" - Hear summaries of all emails
- "Read full" - Hear complete email content
- "Voice compose" - Start voice-guided email composition
- "Send email" - Send the current email
- "Delete email" - Delete selected email

General Commands:
- "Stop" or "Cancel" - Stop current voice operation
- "Repeat" - Repeat last spoken information
- "Help" - Show available commands`
    },
    keyboardShortcuts: {
      title: "Keyboard Shortcuts",
      content: `Keyboard Navigation Shortcuts:

Main Navigation:
- Ctrl+1 - Switch to Compose
- Ctrl+2 - Switch to Inbox
- Ctrl+3 - Switch to Sent
- Ctrl+4 - Switch to Drafts
- Ctrl+5 - Switch to Contacts
- Ctrl+6 - Switch to Trash
- Ctrl+7 - Switch to Settings
- Ctrl+H - Show Help

General Navigation:
- Tab - Move to next element
- Shift+Tab - Move to previous element
- Enter - Activate focused element
- Space - Activate focused element
- Escape - Close dialogs or cancel operations

Email Navigation:
- Arrow Keys - Navigate between emails
- Enter - Read selected email
- Delete - Delete selected email
- R - Reply to email
- F - Forward email`
    },
    accessibility: {
      title: "Accessibility Features",
      content: `Accessibility Features:

Screen Reader Support:
- Full ARIA labels and semantic HTML
- Live regions for dynamic content updates
- Proper heading structure and landmarks
- Descriptive alt text and labels

Voice Features:
- Text-to-speech for all content
- Voice recognition for commands
- Audio feedback for all actions
- Adjustable speech rate, pitch, and volume

Visual Accessibility:
- High contrast color scheme
- Large, clear typography
- Focus indicators for keyboard navigation
- Reduced motion options

Keyboard Accessibility:
- Complete keyboard-only operation
- Logical tab order
- Skip links for efficient navigation
- Keyboard shortcuts for common actions`
    },
    troubleshooting: {
      title: "Troubleshooting",
      content: `Common Issues and Solutions:

Voice Recognition Not Working:
- Check microphone permissions in browser
- Ensure you're using a supported browser (Chrome recommended)
- Try speaking clearly and at normal volume
- Check internet connection for cloud-based recognition

Text-to-Speech Not Working:
- Check browser audio settings
- Ensure speakers/headphones are connected
- Try adjusting voice settings in Settings page
- Refresh the page if speech synthesis stops working

Screen Reader Issues:
- Ensure screen reader is enabled
- Check that JavaScript is enabled in browser
- Try refreshing the page if content isn't announced
- Use Tab key to navigate if screen reader skips elements

Performance Issues:
- Close other browser tabs to free memory
- Check internet connection speed
- Clear browser cache if app loads slowly
- Disable browser extensions that might interfere`
    },
    tips: {
      title: "Tips for Best Experience",
      content: `Tips for Optimal Usage:

Voice Commands:
- Speak clearly and at normal pace
- Wait for confirmation before giving next command
- Use natural language - the system understands context
- Practice common commands to build muscle memory

Email Management:
- Use voice compose for longer emails
- Read email summaries before reading full content
- Use keyboard shortcuts for faster navigation
- Organize contacts for quick email composition

Accessibility:
- Adjust voice settings to your preference
- Use high contrast mode if needed
- Enable keyboard shortcuts for power users
- Customize email settings for your workflow

General Tips:
- Keep the app updated for best performance
- Use headphones for better audio privacy
- Practice with sample emails to learn features
- Contact support if you need additional help`
    }
  };

  const readSection = (sectionId) => {
    const section = helpSections[sectionId || currentSection];
    const helpText = `${section.title}. ${section.content}`;
    speak(helpText);
    onAnnouncement(`Reading ${section.title} help section`);
  };

  const readCurrentSection = () => {
    const section = helpSections[currentSection];
    const content = `${section.title}. ${section.content}`;
    speak(content);
    onAnnouncement(`Reading ${section.title} section`);
  };

  return (
    <div className="card" role="region" aria-label="Help and support">
      <h2 tabIndex="0">Help & Support</h2>
      
      <div className="help-controls">
        <button 
          onClick={() => readSection(currentSection)}
          className="read-help-btn"
          disabled={isSpeaking}
          aria-label={`Read ${helpSections[currentSection].title} content`}
        >
          📋 Read Section
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

      <div className="help-navigation" role="navigation" aria-label="Help sections">
        <h3>Help Sections:</h3>
        <div className="help-nav-buttons">
          {Object.entries(helpSections).map(([key, section]) => (
            <button
              key={key}
              onClick={() => readSection(key)}
              className={`help-nav-btn ${currentSection === key ? 'active' : ''}`}
              aria-current={currentSection === key ? 'page' : 'false'}
              aria-label={`Read ${section.title} section`}
            >
              {section.title}
            </button>
          ))}
        </div>
      </div>

      <div className="help-content" role="main" aria-label="Help content">
        <h3>{helpSections[currentSection].title}</h3>
        <div className="help-text">
          {helpSections[currentSection].content.split('\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </div>

      <div className="quick-help">
        <h3>Quick Help:</h3>
        <div className="quick-help-grid">
          <div className="quick-help-item">
            <h4>🎤 Voice Commands</h4>
            <p>Say "compose", "inbox", "sent", "help" to navigate</p>
          </div>
          
          <div className="quick-help-item">
            <h4>⌨️ Keyboard Shortcuts</h4>
            <p>Ctrl+1-7 to switch sections, Tab to navigate</p>
          </div>
          
          <div className="quick-help-item">
            <h4>📧 Email Actions</h4>
            <p>Use "read email list" and "read full" for emails</p>
          </div>
          
          <div className="quick-help-item">
            <h4>⚙️ Settings</h4>
            <p>Adjust voice speed, pitch, and volume to your preference</p>
          </div>
        </div>
      </div>

      <div className="contact-support">
        <h3>Need More Help?</h3>
        <p>If you need additional assistance or have suggestions for improving accessibility:</p>
        <ul>
          <li>Check the troubleshooting section above</li>
          <li>Try adjusting voice settings in Settings</li>
          <li>Ensure your browser supports Web Speech API</li>
          <li>Contact support with specific issues</li>
        </ul>
        
        <button 
          onClick={() => {
            speak("For technical support, please contact the development team with details about your issue, browser type, and assistive technology used.");
            onAnnouncement("Support information provided");
          }}
          className="contact-support-btn"
          aria-label="Get support contact information"
        >
          📞 Contact Support
        </button>
      </div>

      <div className="help-footer">
        <p><strong>Voice Email System</strong> - Designed for accessibility and ease of use</p>
        <p>Version 1.0 | Built with React and Web Speech API</p>
      </div>
    </div>
  );
}
