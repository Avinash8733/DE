import React, { useState, useEffect, useRef } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { AccessibilityProvider, useAccessibility } from "./contexts/AccessibilityContext";
import AuthWrapper from "./components/Auth/AuthWrapper";
import VoiceButton from "./components/VoiceButton";
import Compose from "./components/Compose";
import Inbox from "./components/Inbox";
import Sent from "./components/Sent";
import Drafts from "./components/Drafts";
import Contacts from "./components/Contacts";
import Trash from "./components/Trash";
import Settings from "./components/Settings";
import Help from "./components/Help";
import Profile from "./components/Profile";
import "./styles.css";

function MainApp() {
  const [section, setSection] = useState("inbox");
  const [announcement, setAnnouncement] = useState("");
  const announcementRef = useRef(null);
  const { isAuthenticated, user, logout } = useAuth();
  const { blindMode, toggleBlindMode, announce, speak } = useAccessibility();

  // Welcome prompt on launch - wait for first user interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      speak("Welcome to Voice Email System. Tap anywhere to begin.");
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };

    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('touchstart', handleFirstInteraction);

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, [speak]);
  useEffect(() => {
    if (announcement && announcementRef.current) {
      announcementRef.current.textContent = announcement;
      // Clear announcement after a short delay
      setTimeout(() => setAnnouncement(""), 1000);
    }
  }, [announcement]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            setSection("compose");
            setAnnouncement("Switched to Compose section");
            break;
          case '2':
            e.preventDefault();
            setSection("inbox");
            setAnnouncement("Switched to Inbox section");
            break;
          case '3':
            e.preventDefault();
            setSection("sent");
            setAnnouncement("Switched to Sent section");
            break;
          case '4':
            e.preventDefault();
            setSection("drafts");
            setAnnouncement("Switched to Drafts section");
            break;
          case '5':
            e.preventDefault();
            setSection("contacts");
            setAnnouncement("Switched to Contacts section");
            break;
          case '6':
            e.preventDefault();
            setSection("trash");
            setAnnouncement("Switched to Trash section");
            break;
          case '7':
            e.preventDefault();
            setSection("settings");
            setAnnouncement("Switched to Settings section");
            break;
          case '8':
            e.preventDefault();
            setSection("help");
            setAnnouncement("Switched to Help section");
            break;
          case '9':
            e.preventDefault();
            setSection("profile");
            setAnnouncement("Switched to Profile section");
            break;
          case 'h':
            e.preventDefault();
            setAnnouncement("Help: Ctrl+1-9 for sections, Space for voice commands");
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const handleSectionChange = (newSection, sectionName) => {
    setSection(newSection);
    const msg = `Switched to ${sectionName} section`;
    setAnnouncement(msg);
    if (blindMode) {
      announce(msg);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setAnnouncement("Logged out successfully");
    } catch (error) {
      setAnnouncement("Logout failed");
    }
  };

  // Show auth wrapper if not authenticated
  if (!isAuthenticated) {
    return <AuthWrapper onAnnouncement={setAnnouncement} />;
  }

  return (
    <div className="app" role="main" aria-label="Voice Email System">
      {/* Hero Section with Visual Elements */}
      <div className="hero-section">
        <div className="hero-content">
          <div className="hero-icon">
            <div className="email-icon">📧</div>
            <div className="voice-waves">
              <div className="wave wave-1"></div>
              <div className="wave wave-2"></div>
              <div className="wave wave-3"></div>
            </div>
          </div>
          <h1 className="title" tabIndex="0">
            <span className="title-main">Voice Email System</span>
            <span className="title-subtitle">Welcome, {user?.name || 'User'}</span>
          </h1>
          <div className="accessibility-toggle">
            <button 
              onClick={toggleBlindMode}
              className={`blind-mode-btn ${blindMode ? 'active' : ''}`}
              aria-pressed={blindMode}
              aria-label={blindMode ? "Disable Blind Mode" : "Enable Blind Mode"}
            >
              <span className="icon">{blindMode ? '👁️‍🗨️' : '👁️'}</span>
              {blindMode ? 'Blind Mode Active' : 'Enable Blind Mode'}
            </button>
          </div>
          <div className="hero-description">
            <p>Experience email like never before with voice control, screen reader support, and beautiful accessibility-first design.</p>
          </div>
          <div className="feature-highlights">
            <div className="feature-item">
              <span className="feature-icon">🎤</span>
              <span>Voice Control</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">👁️</span>
              <span>Screen Reader</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">⌨️</span>
              <span>Keyboard Access</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">♿</span>
              <span>Fully Accessible</span>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="floating-cards">
            <div className="floating-card card-1">
              <div className="card-icon">📨</div>
              <div className="card-text">Compose</div>
            </div>
            <div className="floating-card card-2">
              <div className="card-icon">📥</div>
              <div className="card-text">Inbox</div>
            </div>
            <div className="floating-card card-3">
              <div className="card-icon">👥</div>
              <div className="card-text">Contacts</div>
            </div>
            <div className="floating-card card-4">
              <div className="card-icon">⚙️</div>
              <div className="card-text">Settings</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Screen reader announcements */}
      <div 
        ref={announcementRef}
        className="sr-only" 
        aria-live="polite" 
        aria-atomic="true"
      ></div>

      {/* Help text for screen readers */}
      <div className="help-text sr-only">
        <p>Keyboard shortcuts: Ctrl+1-9 for sections, Ctrl+H for help</p>
        <p>Use the voice button to speak commands or compose emails</p>
      </div>
      
      <nav className="menu" role="navigation" aria-label="Main navigation">
        <button 
          onClick={() => handleSectionChange("compose", "Compose")}
          className={section === "compose" ? "active" : ""}
          aria-current={section === "compose" ? "page" : "false"}
          aria-label="Compose new email"
        >
          📨 Compose
        </button>
        <button 
          onClick={() => handleSectionChange("inbox", "Inbox")}
          className={section === "inbox" ? "active" : ""}
          aria-current={section === "inbox" ? "page" : "false"}
          aria-label="View inbox emails"
        >
          📥 Inbox
        </button>
        <button 
          onClick={() => handleSectionChange("sent", "Sent")}
          className={section === "sent" ? "active" : ""}
          aria-current={section === "sent" ? "page" : "false"}
          aria-label="View sent emails"
        >
          ✅ Sent
        </button>
        <button 
          onClick={() => handleSectionChange("drafts", "Drafts")}
          className={section === "drafts" ? "active" : ""}
          aria-current={section === "drafts" ? "page" : "false"}
          aria-label="View draft emails"
        >
          📝 Drafts
        </button>
        <button 
          onClick={() => handleSectionChange("contacts", "Contacts")}
          className={section === "contacts" ? "active" : ""}
          aria-current={section === "contacts" ? "page" : "false"}
          aria-label="Manage contacts"
        >
          👥 Contacts
        </button>
        <button 
          onClick={() => handleSectionChange("trash", "Trash")}
          className={section === "trash" ? "active" : ""}
          aria-current={section === "trash" ? "page" : "false"}
          aria-label="View deleted emails"
        >
          🗑️ Trash
        </button>
        <button 
          onClick={() => handleSectionChange("settings", "Settings")}
          className={section === "settings" ? "active" : ""}
          aria-current={section === "settings" ? "page" : "false"}
          aria-label="Application settings"
        >
          ⚙️ Settings
        </button>
        <button 
          onClick={() => handleSectionChange("help", "Help")}
          className={section === "help" ? "active" : ""}
          aria-current={section === "help" ? "page" : "false"}
          aria-label="Help and support"
        >
          ❓ Help
        </button>
        <button 
          onClick={() => handleSectionChange("profile", "Profile")}
          className={section === "profile" ? "active" : ""}
          aria-current={section === "profile" ? "page" : "false"}
          aria-label="User profile"
        >
          👤 Profile
        </button>
        <button 
          onClick={handleLogout}
          className="logout-btn"
          aria-label="Sign out of your account"
        >
          🚪 Logout
        </button>
      </nav>

      <main role="main" aria-label={`${section} section`}>
        {section === "compose" && <Compose onAnnouncement={setAnnouncement} />}
        {section === "inbox" && <Inbox onAnnouncement={setAnnouncement} />}
        {section === "sent" && <Sent onAnnouncement={setAnnouncement} />}
        {section === "drafts" && <Drafts onAnnouncement={setAnnouncement} />}
        {section === "contacts" && <Contacts onAnnouncement={setAnnouncement} />}
        {section === "trash" && <Trash onAnnouncement={setAnnouncement} />}
        {section === "settings" && <Settings onAnnouncement={setAnnouncement} />}
        {section === "help" && <Help onAnnouncement={setAnnouncement} />}
        {section === "profile" && <Profile onAnnouncement={setAnnouncement} />}
      </main>

      <VoiceButton 
        onSectionChange={handleSectionChange}
        onAnnouncement={setAnnouncement}
        currentSection={section}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AccessibilityProvider>
        <MainApp />
      </AccessibilityProvider>
    </AuthProvider>
  );
}
