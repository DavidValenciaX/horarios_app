// Authentication module for login and registration functionality

import { apiService } from './api.js';
import { enhanceFormAccessibility, MOBILE_FORM_CONSTANTS } from './utils.js';
import { clearDashboardStats } from './UI.js';

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
    userStatusContainer.className = 'user-status-container';

    const userInfo = document.createElement('div');
    userInfo.id = 'user-info';
    userInfo.className = 'user-info';

    const authButtons = document.createElement('div');
    authButtons.id = 'auth-buttons';
    authButtons.className = 'auth-buttons';

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
        <span class="user-status-online">●</span>
        <span>Conectado como: <strong>${user.name}</strong></span>
        <small class="user-email">(${user.email})</small>
      `;

      authButtons.innerHTML = `
        <button id="logout-btn" class="btn-secondary">
          Cerrar Sesión
        </button>
      `;

      document.getElementById('logout-btn').addEventListener('click', () => {
        this.logout();
      });
    } else {
      userInfo.innerHTML = `
        <span class="user-status-offline">●</span>
        <span>No conectado</span>
        <small class="user-email">(Los datos se guardan localmente)</small>
      `;

      authButtons.innerHTML = `
        <button id="login-btn" class="btn-primary">
          Iniciar Sesión
        </button>
        <button id="register-btn" class="btn-secondary">
          Registrarse
        </button>
      `;

      document.getElementById('login-btn').addEventListener('click', () => {
        this.showLoginModal();
      });

      document.getElementById('register-btn').addEventListener('click', () => {
        this.showRegisterModal();
      });

      clearDashboardStats();
    }
  }

  showLoginModal() {
    const modal = this.createModal('Iniciar Sesión');
    const form = document.createElement('form');
    form.className = 'auth-form';

    form.innerHTML = `
      <h2>Iniciar Sesión</h2>
      
      <input 
        type="email" 
        id="login-email" 
        placeholder="Correo electrónico" 
        required
        autocomplete="email"
      >
      
      <input 
        type="password" 
        id="login-password" 
        placeholder="Contraseña" 
        required
        autocomplete="current-password"
      >
      
      <div id="login-error" class="auth-error hidden"></div>
      
      <div class="auth-button-group">
        <button type="submit" class="btn-primary">
          Iniciar Sesión
        </button>
        <button type="button" id="cancel-login" class="btn-secondary">
          Cancelar
        </button>
      </div>
      
      <div class="auth-form-link">
        <small>
          ¿No tienes cuenta? 
          <a href="#" id="switch-to-register">
            Regístrate aquí
          </a>
        </small>
      </div>
    `;

    modal.appendChild(form);

    // Enhance form for mobile and accessibility
    enhanceFormAccessibility(form);

    // Event listeners
    form.addEventListener('submit', (e) => this.handleLogin(e));
    form.querySelector('#cancel-login').addEventListener('click', () => this.closeModal());
    form.querySelector('#switch-to-register').addEventListener('click', (e) => {
      e.preventDefault();
      this.closeModal();
      setTimeout(() => this.showRegisterModal(), MOBILE_FORM_CONSTANTS.MODAL_ANIMATION_DURATION);
    });

    this.showModal(modal);
  }

  showRegisterModal() {
    const modal = this.createModal('Registrarse');
    const form = document.createElement('form');
    form.className = 'auth-form';

    form.innerHTML = `
      <h2>Crear Cuenta</h2>
      
      <input 
        type="text" 
        id="register-name" 
        placeholder="Nombre completo" 
        required
        autocomplete="name"
      >
      
      <input 
        type="email" 
        id="register-email" 
        placeholder="Correo electrónico" 
        required
        autocomplete="email"
      >
      
      <input 
        type="password" 
        id="register-password" 
        placeholder="Contraseña (mínimo 6 caracteres)" 
        required
        minlength="6"
        autocomplete="new-password"
      >
      
      <input 
        type="password" 
        id="register-password-confirm" 
        placeholder="Confirmar contraseña" 
        required
        autocomplete="new-password"
      >
      
      <div id="register-error" class="auth-error hidden"></div>
      
      <div class="auth-button-group">
        <button type="submit" class="btn-primary">
          Registrarse
        </button>
        <button type="button" id="cancel-register" class="btn-secondary">
          Cancelar
        </button>
      </div>
      
      <div class="auth-form-link">
        <small>
          ¿Ya tienes cuenta? 
          <a href="#" id="switch-to-login">
            Inicia sesión aquí
          </a>
        </small>
      </div>
    `;

    modal.appendChild(form);

    // Enhance form for mobile and accessibility
    enhanceFormAccessibility(form);

    // Event listeners
    form.addEventListener('submit', (e) => this.handleRegister(e));
    form.querySelector('#cancel-register').addEventListener('click', () => this.closeModal());
    form.querySelector('#switch-to-login').addEventListener('click', (e) => {
      e.preventDefault();
      this.closeModal();
      setTimeout(() => this.showLoginModal(), MOBILE_FORM_CONSTANTS.MODAL_ANIMATION_DURATION);
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
        errorElement.classList.remove('hidden');
      }
    } catch (error) {
      errorElement.textContent = 'Error de conexión. Inténtalo de nuevo: ' + error;
      errorElement.classList.remove('hidden');
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
      errorElement.classList.remove('hidden');
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
        errorElement.classList.remove('hidden');
      }
    } catch (error) {
      errorElement.textContent = 'Error de conexión. Inténtalo de nuevo: ' + error;
      errorElement.classList.remove('hidden');
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
    modal.className = 'auth-modal-content';
    return modal;
  }

  showModal(modalContent) {
    const backdrop = document.createElement('div');
    backdrop.className = 'auth-modal-backdrop';
    backdrop.appendChild(modalContent);
    
    // Close on backdrop click
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        this.closeModal();
      }
    });

    // Close on Escape key
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        this.closeModal();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    backdrop.handleKeyDown = handleKeyDown; // Store reference for cleanup

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    
    // Focus management for accessibility
    modalContent.setAttribute('tabindex', '-1');
    modalContent.setAttribute('role', 'dialog');
    modalContent.setAttribute('aria-modal', 'true');
    
    document.body.appendChild(backdrop);
    this.currentModal = backdrop;
    
    // Focus the first input in the modal
    setTimeout(() => {
      const firstInput = modalContent.querySelector('input');
      if (firstInput) {
        firstInput.focus();
      }
    }, 100);
  }

  closeModal() {
    if (this.currentModal) {
      // Clean up event listeners
      if (this.currentModal.handleKeyDown) {
        document.removeEventListener('keydown', this.currentModal.handleKeyDown);
      }
      
      // Restore body scroll
      document.body.style.overflow = '';
      
      // Remove modal from DOM
      document.body.removeChild(this.currentModal);
      this.currentModal = null;
    }
  }

  showSuccessMessage(message) {
    const successElement = document.createElement('div');
    successElement.className = 'auth-success-toast';
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