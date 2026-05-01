import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import voiceService from '../services/voiceService';

const AccessibilityContext = createContext();

export const useAccessibility = () => useContext(AccessibilityContext);

export const AccessibilityProvider = ({ children }) => {
  const [blindMode, setBlindMode] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastTouchedElement, setLastTouchedElement] = useState(null);
  const touchStartTime = useRef(0);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const lastTapTime = useRef(0);
  
  // Announcement helper
  const announce = useCallback((text, onEnd = null) => {
    if (blindMode) {
      setIsSpeaking(true);
      voiceService.speak(text, () => {
        setIsSpeaking(false);
        if (onEnd) onEnd();
      });
    }
    console.log('Announcement:', text);
  }, [blindMode]);

  const speak = useCallback((text, onEnd = null) => {
    setIsSpeaking(true);
    voiceService.speak(text, () => {
      setIsSpeaking(false);
      if (onEnd) onEnd();
    });
  }, []);

  // Handle element discovery on touch
  const handleTouchStart = useCallback((e) => {
    if (!blindMode) return;

    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    touchStartTime.current = Date.now();

    if (element) {
      const label = element.getAttribute('aria-label') || 
                    element.innerText || 
                    element.placeholder || 
                    element.tagName;
      
      if (label && element !== lastTouchedElement) {
        setLastTouchedElement(element);
        announce(label);
      }
    }
  }, [blindMode, lastTouchedElement, announce]);

  const handleTouchEnd = useCallback((e) => {
    if (!blindMode) return;

    const touchEndTime = Date.now();
    const duration = touchEndTime - touchStartTime.current;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;

    // Detect Swipe
    if (Math.abs(deltaX) > 50 || Math.abs(deltaY) > 50) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0) announce('Swiped right. Next item.');
        else announce('Swiped left. Previous item.');
      }
      return;
    }

    // Detect Double Tap for Selection
    const timeSinceLastTap = touchEndTime - lastTapTime.current;
    if (timeSinceLastTap < 300) {
      // Double tap detected
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      if (element) {
        announce('Selecting ' + (element.getAttribute('aria-label') || element.innerText || 'item'));
        element.click();
      }
      lastTapTime.current = 0; // Reset
    } else {
      lastTapTime.current = touchEndTime;
    }
  }, [blindMode, announce]);

  // Global event listeners for touch
  useEffect(() => {
    if (blindMode) {
      window.addEventListener('touchstart', handleTouchStart, { passive: false });
      window.addEventListener('touchend', handleTouchEnd, { passive: false });
    }
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [blindMode, handleTouchStart, handleTouchEnd]);

  // Initial welcome prompt when blind mode is enabled
  useEffect(() => {
    if (blindMode) {
      announce('Blind mode enabled. You can now use voice commands and touch gestures. Tap anywhere to begin exploration.');
    }
  }, [blindMode, announce]);

  const toggleBlindMode = () => {
    const newMode = !blindMode;
    setBlindMode(newMode);
    if (!newMode) {
      voiceService.cancel();
    }
  };

  const value = {
    blindMode,
    isSpeaking,
    toggleBlindMode,
    announce,
    speak,
    listen: voiceService.listen.bind(voiceService),
    isSupported: voiceService.isSupported()
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};
