/**
 * Voice Service for Speech-to-Text (STT) and Text-to-Speech (TTS)
 * Uses the Web Speech API (supported by most modern browsers)
 */

class VoiceService {
  constructor() {
    this.synth = window.speechSynthesis;
    this.recognition = null;
    this.isListening = false;
    this.isSpeaking = false;
    this.defaultRate = 0.9; // Slightly slower for better clarity
    this.defaultPitch = 1.0;
    
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
    }
  }

  /**
   * Text-to-Speech: Speaks the provided text
   * @param {string} text - The text to speak
   * @param {function} onEnd - Callback when speaking finishes
   */
  speak(text, onEnd = null) {
    if (!this.synth) return;

    // Cancel any ongoing speech
    this.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = this.defaultRate;
    utterance.pitch = this.defaultPitch;
    
    utterance.onstart = () => {
      this.isSpeaking = true;
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      if (onEnd) onEnd();
    };

    utterance.onerror = (event) => {
      console.error('SpeechSynthesis error:', event);
      this.isSpeaking = false;
      if (onEnd) onEnd();
    };

    this.synth.speak(utterance);
  }

  /**
   * Cancels any ongoing speech
   */
  cancel() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
    }
  }

  /**
   * Speech-to-Text: Listens for a single voice input
   * @returns {Promise<string>} - The recognized transcript
   */
  listen() {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech Recognition not supported in this browser.'));
        return;
      }

      if (this.isListening) {
        this.recognition.stop();
      }

      this.recognition.onstart = () => {
        this.isListening = true;
      };

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        resolve(transcript);
      };

      this.recognition.onerror = (event) => {
        this.isListening = false;
        reject(event.error);
      };

      this.recognition.onend = () => {
        this.isListening = false;
      };

      this.recognition.start();
    });
  }

  /**
   * Checks if the browser supports required voice features
   */
  isSupported() {
    return !!(this.synth && this.recognition);
  }
}

const voiceService = new VoiceService();
export default voiceService;
