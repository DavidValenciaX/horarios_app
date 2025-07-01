// Mobile and accessibility utilities
export const TOUCH_CONSTANTS = {
  TAP_TIMEOUT: 300,
  DOUBLE_TAP_THRESHOLD: 300,
  TOUCH_MOVE_THRESHOLD: 10
};

// Debounce utility for performance optimization
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func.apply(this, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Touch event handler for better mobile interaction
export function addTouchSupport(element, callback) {
  let touchStartTime = 0;
  let touchStartPosition = { x: 0, y: 0 };

  element.addEventListener('touchstart', (e) => {
    touchStartTime = Date.now();
    const touch = e.touches[0];
    touchStartPosition = { x: touch.clientX, y: touch.clientY };
  }, { passive: true });

  element.addEventListener('touchend', (e) => {
    const touchEndTime = Date.now();
    const touchDuration = touchEndTime - touchStartTime;

    if (touchDuration < TOUCH_CONSTANTS.TAP_TIMEOUT) {
      const touch = e.changedTouches[0];
      const touchEndPosition = { x: touch.clientX, y: touch.clientY };
      
      const moveDistance = Math.sqrt(
        Math.pow(touchEndPosition.x - touchStartPosition.x, 2) + 
        Math.pow(touchEndPosition.y - touchStartPosition.y, 2)
      );

      if (moveDistance < TOUCH_CONSTANTS.TOUCH_MOVE_THRESHOLD) {
        e.preventDefault();
        callback(e);
      }
    }
  }, { passive: false });
}

// Keyboard navigation support
export function addKeyboardSupport(element, callback) {
  element.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      callback(e);
    }
  });
}

// Mobile optimization constants for forms
export const MOBILE_FORM_CONSTANTS = {
  KEYBOARD_DELAY: 300,
  FORM_VALIDATION_DEBOUNCE: 500,
  MODAL_ANIMATION_DURATION: 300
};

// Mobile-friendly form validation
export function enhanceFormAccessibility(form) {
  const inputs = form.querySelectorAll('input');
  
  // Add form submission handler to clear custom validations
  form.addEventListener('submit', (e) => {
    // Mark form as being submitted to prevent real-time validation interference
    form.checkingSubmission = true;
    
    // Clear all custom validations before submission to let native validation work
    inputs.forEach(input => {
      input.setCustomValidity('');
    });
    
    // Reset the flag after a short delay
    setTimeout(() => {
      form.checkingSubmission = false;
    }, 100);
  });
  
  inputs.forEach(input => {
    // Add mobile-optimized input attributes
    if (input.type === 'email') {
      input.setAttribute('autocomplete', 'email');
      input.setAttribute('autocapitalize', 'none');
      input.setAttribute('autocorrect', 'off');
      input.setAttribute('inputmode', 'email');
    }
    
    if (input.type === 'password') {
      input.setAttribute('autocomplete', input.id.includes('new') ? 'new-password' : 'current-password');
    }
    
    if (input.type === 'text' && input.id.includes('name')) {
      input.setAttribute('autocomplete', 'name');
      input.setAttribute('autocapitalize', 'words');
    }
    
    // Add real-time validation feedback with mobile-friendly debouncing
    const debouncedValidation = debounce(() => {
      // Only validate if not during form submission
      if (!form.checkingSubmission) {
        validateInput(input);
      }
    }, MOBILE_FORM_CONSTANTS.FORM_VALIDATION_DEBOUNCE);
    
    // Use different validation strategies for mobile vs desktop
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
      // On mobile, be less aggressive with real-time validation
      input.addEventListener('blur', () => {
        if (!form.checkingSubmission) {
          validateInput(input);
        }
      });
    } else {
      // On desktop, use both input and blur events
      input.addEventListener('input', debouncedValidation);
      input.addEventListener('blur', () => {
        if (!form.checkingSubmission) {
          validateInput(input);
        }
      });
    }
  });
}

// Input validation with visual feedback
export function validateInput(input) {
  // Always reset custom validity first to avoid interference
  input.setCustomValidity('');
  
  // Check validity after resetting custom messages
  const isValid = input.checkValidity();
  
  // Remove previous validation classes
  input.classList.remove('input-valid', 'input-invalid');
  
  // Add appropriate class based on validation
  if (input.value.trim() !== '') {
    input.classList.add(isValid ? 'input-valid' : 'input-invalid');
  }
  
  // Only set custom validation messages if the field is actually invalid
  // and has content, and only during real-time validation (not form submission)
  if (!isValid && input.value.trim() !== '' && !input.form?.checkingSubmission) {
    const errorMessages = {
      'valueMissing': 'Este campo es obligatorio',
      'typeMismatch': input.type === 'email' ? 'Ingresa un email válido' : 'Formato inválido',
      'tooShort': `Mínimo ${input.minLength} caracteres`,
      'patternMismatch': 'El formato no es válido'
    };
    
    // More robust error type detection
    const validityState = input.validity;
    let errorType = null;
    
    if (validityState.valueMissing) errorType = 'valueMissing';
    else if (validityState.typeMismatch) errorType = 'typeMismatch';
    else if (validityState.tooShort) errorType = 'tooShort';
    else if (validityState.patternMismatch) errorType = 'patternMismatch';
    
    // Only set custom message if we have a specific error type
    if (errorType && errorMessages[errorType]) {
      input.setCustomValidity(errorMessages[errorType]);
    }
  }
} 