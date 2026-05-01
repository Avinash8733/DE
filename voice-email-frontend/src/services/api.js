// API Service Layer for Voice Email Frontend

// Ensure we have a valid API URL that works across environments
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5001/api');

// Validate the URL to prevent "Failed to fetch" errors
const validateApiUrl = () => {
  try {
    // For production relative path, return as is
    if (API_BASE_URL === '/api') {
      return '/api';
    }
    // For localhost, don't use URL constructor as it requires protocol
    if (API_BASE_URL.includes('localhost')) {
      return 'http://localhost:5001/api';
    }
    return new URL(API_BASE_URL).toString();
  } catch (e) {
    console.error('Invalid API URL format, falling back to localhost');
    return 'http://localhost:5001/api';
  }
};

const VALIDATED_API_URL = validateApiUrl();

// Maximum number of retry attempts for failed requests
const MAX_RETRY_ATTEMPTS = 3;
// Delay between retry attempts (in milliseconds)
const RETRY_DELAY = 1000;

class ApiService {
  constructor() {
    this.token = localStorage.getItem('authToken');
  }

  // Helper method to get auth headers
  getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Helper method to handle API responses
  async handleResponse(response) {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        error: 'Network Error', 
        message: 'Failed to connect to server' 
      }));
      throw new Error(error.message || 'API request failed');
    }
    
    return response.json();
  }

  // Helper method to delay execution
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Helper method to make API requests with retry logic
  async request(endpoint, options = {}, retryCount = 0) {
    const url = `${VALIDATED_API_URL}${endpoint}`;
    const config = {
      headers: this.getAuthHeaders(),
      ...options,
    };

    try {
      console.log(`Making API request to: ${url}`);
      const response = await fetch(url, config);
      return await this.handleResponse(response);
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      
      // Check if we should retry the request
      if (retryCount < MAX_RETRY_ATTEMPTS && 
          (error.name === 'TypeError' || error.message === 'Failed to fetch')) {
        console.log(`Retrying request (${retryCount + 1}/${MAX_RETRY_ATTEMPTS})...`);
        // Wait before retrying
        await this.delay(RETRY_DELAY);
        // Retry the request with incremented retry count
        return this.request(endpoint, options, retryCount + 1);
      }
      
      // More detailed error logging
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        console.error('Network error: Server might be down or URL is incorrect');
        throw new Error('Unable to connect to the server. Please check if the backend server is running and try again.');
      }
      throw error;
    }
  }

  // Set auth token
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  // Clear auth token
  clearToken() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  // Authentication API
  async register(userData) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async login(credentials) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.clearToken();
    }
  }

  async verifyToken() {
    return this.request('/auth/verify');
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  async updateProfile(profileData) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async changePassword(passwordData) {
    return this.request('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
  }

  // Email API
  async getEmails(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/emails?${queryString}` : '/emails';
    return this.request(endpoint);
  }

  async getEmail(emailId) {
    return this.request(`/emails/${emailId}`);
  }

  async sendEmail(emailData) {
    return this.request('/emails/send', {
      method: 'POST',
      body: JSON.stringify(emailData),
    });
  }

  async saveDraft(draftData) {
    return this.request('/emails/drafts', {
      method: 'POST',
      body: JSON.stringify(draftData),
    });
  }

  async getDrafts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/emails/drafts/list?${queryString}` : '/emails/drafts/list';
    return this.request(endpoint);
  }

  async updateDraft(draftId, draftData) {
    return this.request(`/emails/drafts/${draftId}`, {
      method: 'PUT',
      body: JSON.stringify(draftData),
    });
  }

  async deleteDraft(draftId) {
    return this.request(`/emails/drafts/${draftId}`, {
      method: 'DELETE',
    });
  }

  async moveEmail(emailId, folder) {
    return this.request(`/emails/${emailId}/move`, {
      method: 'PUT',
      body: JSON.stringify({ folder }),
    });
  }

  async toggleEmailStar(emailId) {
    return this.request(`/emails/${emailId}/star`, {
      method: 'PUT',
    });
  }

  async markEmailAsRead(emailId, isRead) {
    return this.request(`/emails/${emailId}/read`, {
      method: 'PUT',
      body: JSON.stringify({ isRead }),
    });
  }

  async deleteEmail(emailId) {
    return this.request(`/emails/${emailId}`, {
      method: 'DELETE',
    });
  }

  // Contacts API
  async getContacts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/contacts?${queryString}` : '/contacts';
    return this.request(endpoint);
  }

  async getContact(contactId) {
    return this.request(`/contacts/${contactId}`);
  }

  async createContact(contactData) {
    return this.request('/contacts', {
      method: 'POST',
      body: JSON.stringify(contactData),
    });
  }

  async updateContact(contactId, contactData) {
    return this.request(`/contacts/${contactId}`, {
      method: 'PUT',
      body: JSON.stringify(contactData),
    });
  }

  async deleteContact(contactId) {
    return this.request(`/contacts/${contactId}`, {
      method: 'DELETE',
    });
  }

  async toggleContactFavorite(contactId) {
    return this.request(`/contacts/${contactId}/favorite`, {
      method: 'PUT',
    });
  }

  async bulkContactOperation(action, contactIds) {
    return this.request('/contacts/bulk', {
      method: 'POST',
      body: JSON.stringify({ action, contactIds }),
    });
  }

  async importContacts(contacts) {
    return this.request('/contacts/import', {
      method: 'POST',
      body: JSON.stringify({ contacts }),
    });
  }

  async exportContacts() {
    const response = await fetch(`${API_BASE_URL}/contacts/export/csv`, {
      headers: this.getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to export contacts');
    }
    
    return response.blob();
  }

  // Voice API
  async saveVoiceSession(sessionData) {
    return this.request('/voice/session', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  }

  async getVoiceSessions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/voice/sessions?${queryString}` : '/voice/sessions';
    return this.request(endpoint);
  }

  async processVoiceCommand(command, context = {}) {
    return this.request('/voice/command', {
      method: 'POST',
      body: JSON.stringify({ command, context }),
    });
  }

  async getVoiceAnalytics() {
    return this.request('/voice/analytics');
  }

  async getTTSPreferences() {
    return this.request('/voice/tts-preferences');
  }

  async updateTTSPreferences(preferences) {
    return this.request('/voice/tts-preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  }

  // User API
  async getUserStats() {
    return this.request('/users/stats');
  }

  async getUserPreferences() {
    return this.request('/users/preferences');
  }

  async updateUserPreferences(preferences) {
    return this.request('/users/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  }

  async getUserActivity(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/users/activity?${queryString}` : '/users/activity';
    return this.request(endpoint);
  }

  async deleteAccount(confirmPassword) {
    return this.request('/users/account', {
      method: 'DELETE',
      body: JSON.stringify({ confirmPassword }),
    });
  }

  async exportUserData() {
    const response = await fetch(`${API_BASE_URL}/users/export`, {
      headers: this.getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to export user data');
    }
    
    return response.blob();
  }

  // Health check
  async healthCheck() {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
    return response.json();
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;

// Export the class for testing purposes
export { ApiService };
