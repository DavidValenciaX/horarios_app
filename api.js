// API service layer for backend communication

const getApiBaseUrl = () => import.meta.env.VITE_API_BASE_URL;

// Constants for configuration
const CONFIG = {
  TOKEN_KEY: 'horarios_app_token',
  USER_KEY: 'horarios_app_user',
  AUTO_SAVE_ENABLED: true,
  AUTO_SAVE_DEBOUNCE_MS: 1000
};

class ApiService {
  constructor() {
    this.token = localStorage.getItem(CONFIG.TOKEN_KEY);
    this.user = JSON.parse(localStorage.getItem(CONFIG.USER_KEY) || 'null');
    this.autoSaveTimeout = null;
  }

  // Authentication methods
  async register(name, email, password) {
    try {
      const response = await fetch(`${getApiBaseUrl()}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.errors?.[0]?.msg || 'Error en el registro');
      }

      this.setAuthData(data.token);
      await this.getCurrentUser();
      return { success: true, token: data.token };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  }

  async login(email, password) {
    try {
      const response = await fetch(`${getApiBaseUrl()}/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        data = null;
        console.error('Error al parsear la respuesta del servidor:', e);
      }

      if (!response.ok) {
        throw new Error(data?.errors?.[0]?.msg || 'Error en el login');
      }

      if (!data?.token) {
        throw new Error('Respuesta de login inválida del servidor.');
      }
      
      this.setAuthData(data.token);
      await this.getCurrentUser();
      return { success: true, token: data.token };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  }

  async getCurrentUser() {
    if (!this.token) return null;

    try {
      const response = await fetch(`${getApiBaseUrl()}/auth`, {
        method: 'GET',
        headers: {
          'x-auth-token': this.token,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.logout();
        }
        return null;
      }

      const user = await response.json();
      this.user = user;
      localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(user));
      return user;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }

  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem(CONFIG.TOKEN_KEY);
    localStorage.removeItem(CONFIG.USER_KEY);
  }

  setAuthData(token) {
    this.token = token;
    localStorage.setItem(CONFIG.TOKEN_KEY, token);
  }

  isAuthenticated() {
    return !!this.token && !!this.user;
  }

  getUser() {
    return this.user;
  }

  // Schedule data methods
  async loadScheduleData() {
    if (!this.isAuthenticated()) return null;

    try {
      const response = await fetch(`${getApiBaseUrl()}/schedules`, {
        method: 'GET',
        headers: {
          'x-auth-token': this.token,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.logout();
        }
        return null;
      }

      const scheduleData = await response.json();
      return scheduleData;
    } catch (error) {
      console.error('Load schedule data error:', error);
      return null;
    }
  }

  async saveScheduleData(scenarioManager) {
    if (!this.isAuthenticated()) return { success: false };

    try {
      const response = await fetch(`${getApiBaseUrl()}/schedules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': this.token,
        },
        body: JSON.stringify({
          scenarios: scenarioManager.scenarios,
          activeScenarioIndex: scenarioManager.activeScenarioIndex,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.logout();
        }
        return { success: false };
      }

      return { success: true };
    } catch (error) {
      console.error('Save schedule data error:', error);
      return { success: false, error: error.message };
    }
  }

  // Auto-save functionality
  scheduleAutoSave(scenarioManager) {
    if (!CONFIG.AUTO_SAVE_ENABLED || !this.isAuthenticated()) return;

    // Clear previous timeout
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }

    // Set new timeout for debounced auto-save
    this.autoSaveTimeout = setTimeout(async () => {
      const result = await this.saveScheduleData(scenarioManager);
      if (result.success) {
        this.showAutoSaveIndicator();
      }
    }, CONFIG.AUTO_SAVE_DEBOUNCE_MS);
  }

  showAutoSaveIndicator() {
    // Create or update auto-save indicator
    let indicator = document.getElementById('auto-save-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'auto-save-indicator';
      indicator.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 8px 16px;
        border-radius: 4px;
        font-size: 14px;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.3s ease;
      `;
      document.body.appendChild(indicator);
    }

    indicator.textContent = '✓ Guardado automáticamente';
    indicator.style.opacity = '1';

    setTimeout(() => {
      indicator.style.opacity = '0';
    }, 2000);
  }

  // Generate combinations on server (optional, fallback to client-side)
  async generateCombinations(activities, days, timeSlots) {
    if (!this.isAuthenticated()) {
      // Fallback to client-side generation
      return null;
    }

    try {
      const response = await fetch(`${getApiBaseUrl()}/schedules/combinations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': this.token,
        },
        body: JSON.stringify({ activities, days, timeSlots }),
      });

      if (!response.ok) {
        return null; // Fallback to client-side
      }

      const combinations = await response.json();
      return combinations;
    } catch (error) {
      console.error('Server-side combination generation error:', error);
      return null; // Fallback to client-side
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();
export { CONFIG }; 