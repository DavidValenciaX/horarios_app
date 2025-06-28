// Authentication module for login and registration functionality

import { apiService } from './api.js';

const AUTH_CONSTANTS = {
  MODAL_BACKDROP_STYLE: `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  `,
  MODAL_CONTENT_STYLE: `
    background: white;
    padding: 2rem;
    border-radius: 8px;
    width: 90%;
    max-width: 400px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  `,
  FORM_STYLE: `
    display: flex;
    flex-direction: column;
    gap: 1rem;
  `,
  BUTTON_STYLE: `
    padding: 0.75rem;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
  `,
  BUTTON_SECONDARY_STYLE: `
    padding: 0.75rem;
    background: #6c757d;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
  `,
  ERROR_STYLE: `
    color: #dc3545;
    font-size: 0.875rem;
    margin-top: 0.5rem;
  `
};

class AuthComponent {
  constructor() {
    this.currentModal = null;
    this.userStatusElement = null;
    this.authCallbacks = [];
  }

  // Initialize auth UI in the dashboard
  initAuthUI() {
    this.createUserStatusElement();
    this.updateUserStatus();
  }

  createUserStatusElement() {
    const dashboard = document.getElementById('dashboard');
    if (!dashboard) return;

    // Create user status container
    const userStatusContainer = document.createElement('div');
    userStatusContainer.id = 'user-status-container';
    userStatusContainer.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
    `;

    const userInfo = document.createElement('div');
    userInfo.id = 'user-info';

    const authButtons = document.createElement('div');
    authButtons.id = 'auth-buttons';
    authButtons.style.cssText = 'display: flex; gap: 0.5rem;';

    userStatusContainer.appendChild(userInfo);
    userStatusContainer.appendChild(authButtons);

    // Insert at the beginning of dashboard
    dashboard.insertBefore(userStatusContainer, dashboard.firstChild);
    
    this.userStatusElement = userStatusContainer;
  }

  updateUserStatus() {
    if (!this.userStatusElement) return;

    const userInfo = this.userStatusElement.querySelector('#user-info');
    const authButtons = this.userStatusElement.querySelector('#auth-buttons');

    if (apiService.isAuthenticated()) {
      const user = apiService.getUser();
      userInfo.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span style="color: #28a745; font-weight: bold;">●</span>
          <span>Conectado como: <strong>${user.name}</strong></span>
          <small style="color: #6c757d;">(${user.email})</small>
        </div>
      `;

      authButtons.innerHTML = `
        <button id="logout-btn" style="${AUTH_CONSTANTS.BUTTON_SECONDARY_STYLE}">
          Cerrar Sesión
        </button>
      `;

      document.getElementById('logout-btn').addEventListener('click', () => {
        this.logout();
      });
    } else {
      userInfo.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span style="color: #dc3545; font-weight: bold;">●</span>
          <span>No conectado</span>
          <small style="color: #6c757d;">(Los datos se guardan localmente)</small>
        </div>
      `;

      authButtons.innerHTML = `
        <button id="login-btn" style="${AUTH_CONSTANTS.BUTTON_STYLE}">
          Iniciar Sesión
        </button>
        <button id="register-btn" style="${AUTH_CONSTANTS.BUTTON_SECONDARY_STYLE}">
          Registrarse
        </button>
      `;

      document.getElementById('login-btn').addEventListener('click', () => {
        this.showLoginModal();
      });

      document.getElementById('register-btn').addEventListener('click', () => {
        this.showRegisterModal();
      });
    }
  }

  showLoginModal() {
    const modal = this.createModal('Iniciar Sesión');
    const form = document.createElement('form');
    form.style.cssText = AUTH_CONSTANTS.FORM_STYLE;

    form.innerHTML = `
      <h2 style="margin: 0 0 1rem 0; text-align: center;">Iniciar Sesión</h2>
      
      <input 
        type="email" 
        id="login-email" 
        placeholder="Correo electrónico" 
        required
      >
      
      <input 
        type="password" 
        id="login-password" 
        placeholder="Contraseña" 
        required
      >
      
      <div id="login-error" style="${AUTH_CONSTANTS.ERROR_STYLE}; display: none;"></div>
      
      <div style="display: flex; gap: 0.5rem;">
        <button type="submit" style="${AUTH_CONSTANTS.BUTTON_STYLE}">
          Iniciar Sesión
        </button>
        <button type="button" id="cancel-login" style="${AUTH_CONSTANTS.BUTTON_SECONDARY_STYLE}">
          Cancelar
        </button>
      </div>
      
      <div style="text-align: center; margin-top: 1rem;">
        <small>
          ¿No tienes cuenta? 
          <a href="#" id="switch-to-register" style="color: #007bff; text-decoration: none;">
            Regístrate aquí
          </a>
        </small>
      </div>
    `;

    modal.appendChild(form);

    // Event listeners
    form.addEventListener('submit', (e) => this.handleLogin(e));
    form.querySelector('#cancel-login').addEventListener('click', () => this.closeModal());
    form.querySelector('#switch-to-register').addEventListener('click', (e) => {
      e.preventDefault();
      this.closeModal();
      this.showRegisterModal();
    });

    this.showModal(modal);
  }

  showRegisterModal() {
    const modal = this.createModal('Registrarse');
    const form = document.createElement('form');
    form.style.cssText = AUTH_CONSTANTS.FORM_STYLE;

    form.innerHTML = `
      <h2 style="margin: 0 0 1rem 0; text-align: center;">Crear Cuenta</h2>
      
      <input 
        type="text" 
        id="register-name" 
        placeholder="Nombre completo" 
        required
      >
      
      <input 
        type="email" 
        id="register-email" 
        placeholder="Correo electrónico" 
        required
      >
      
      <input 
        type="password" 
        id="register-password" 
        placeholder="Contraseña (mínimo 6 caracteres)" 
        required
        minlength="6"
      >
      
      <input 
        type="password" 
        id="register-password-confirm" 
        placeholder="Confirmar contraseña" 
        required
      >
      
      <div id="register-error" style="${AUTH_CONSTANTS.ERROR_STYLE}; display: none;"></div>
      
      <div style="display: flex; gap: 0.5rem;">
        <button type="submit" style="${AUTH_CONSTANTS.BUTTON_STYLE}">
          Registrarse
        </button>
        <button type="button" id="cancel-register" style="${AUTH_CONSTANTS.BUTTON_SECONDARY_STYLE}">
          Cancelar
        </button>
      </div>
      
      <div style="text-align: center; margin-top: 1rem;">
        <small>
          ¿Ya tienes cuenta? 
          <a href="#" id="switch-to-login" style="color: #007bff; text-decoration: none;">
            Inicia sesión aquí
          </a>
        </small>
      </div>
    `;

    modal.appendChild(form);

    // Event listeners
    form.addEventListener('submit', (e) => this.handleRegister(e));
    form.querySelector('#cancel-register').addEventListener('click', () => this.closeModal());
    form.querySelector('#switch-to-login').addEventListener('click', (e) => {
      e.preventDefault();
      this.closeModal();
      this.showLoginModal();
    });

    this.showModal(modal);
  }

  async handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorElement = document.getElementById('login-error');

    try {
      const result = await apiService.login(email, password);
      
      if (result.success) {
        this.closeModal();
        this.updateUserStatus();
        this.notifyAuthChange();
        this.showSuccessMessage('Inicio de sesión exitoso');
      } else {
        errorElement.textContent = result.error;
        errorElement.style.display = 'block';
      }
    } catch (error) {
      errorElement.textContent = 'Error de conexión. Inténtalo de nuevo: ' + error;
      errorElement.style.display = 'block';
    }
  }

  async handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const passwordConfirm = document.getElementById('register-password-confirm').value;
    const errorElement = document.getElementById('register-error');

    // Validate password confirmation
    if (password !== passwordConfirm) {
      errorElement.textContent = 'Las contraseñas no coinciden';
      errorElement.style.display = 'block';
      return;
    }

    try {
      const result = await apiService.register(name, email, password);
      
      if (result.success) {
        this.closeModal();
        this.updateUserStatus();
        this.notifyAuthChange();
        this.showSuccessMessage('Registro exitoso. ¡Bienvenido!');
      } else {
        errorElement.textContent = result.error;
        errorElement.style.display = 'block';
      }
    } catch (error) {
      errorElement.textContent = 'Error de conexión. Inténtalo de nuevo: ' + error;
      errorElement.style.display = 'block';
    }
  }

  logout() {
    apiService.logout();
    this.updateUserStatus();
    this.notifyAuthChange();
    this.showSuccessMessage('Sesión cerrada correctamente');
  }

  createModal(title) {
    const modal = document.createElement('div');
    modal.style.cssText = AUTH_CONSTANTS.MODAL_CONTENT_STYLE;
    return modal;
  }

  showModal(modalContent) {
    const backdrop = document.createElement('div');
    backdrop.style.cssText = AUTH_CONSTANTS.MODAL_BACKDROP_STYLE;
    backdrop.appendChild(modalContent);
    
    // Close on backdrop click
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        this.closeModal();
      }
    });

    document.body.appendChild(backdrop);
    this.currentModal = backdrop;
  }

  closeModal() {
    if (this.currentModal) {
      document.body.removeChild(this.currentModal);
      this.currentModal = null;
    }
  }

  showSuccessMessage(message) {
    const successElement = document.createElement('div');
    successElement.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #28a745;
      color: white;
      padding: 1rem;
      border-radius: 4px;
      z-index: 1001;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    successElement.textContent = message;
    
    document.body.appendChild(successElement);
    
    setTimeout(() => successElement.style.opacity = '1', 10);
    setTimeout(() => {
      successElement.style.opacity = '0';
      setTimeout(() => document.body.removeChild(successElement), 300);
    }, 3000);
  }

  // Method to register callbacks for auth state changes
  onAuthChange(callback) {
    this.authCallbacks.push(callback);
  }

  notifyAuthChange() {
    this.authCallbacks.forEach(callback => callback());
  }
}

// Export singleton instance
export const authComponent = new AuthComponent(); 