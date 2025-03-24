/**
 * contact.js - Contact form functionality
 * Handles form validation and submission for the contact form
 */
import { select, addEvent, showMessage, asyncHandler } from './utils/utilities.js';

class ContactForm {
  constructor() {
    this.form = select('#contact-form');
    this.submitButton = select('#contact-submit');

    if (!this.form || !this.submitButton) {
      console.error('Contact form elements not found');
      return;
    }

    this.fields = {
      name: {
        element: select('#name'),
        errorElement: select('#name-error'),
        validate: (value) => {
          if (value.length < 2) {
            return 'Name must be at least 2 characters long';
          }
          return '';
        }
      },
      interest: {
        element: select('#interest'),
        errorElement: select('#interest-error'),
        validate: (value) => {
          if (!value) {
            return 'Please select your area of interest';
          }
          return '';
        }
      },
      message: {
        element: select('#message'),
        errorElement: select('#message-error'),
        validate: (value) => {
          if (value.length < 10) {
            return 'Message must be at least 10 characters long';
          }
          return '';
        }
      }
    };

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Add submit event listener
    addEvent(this.form, 'submit', this.handleSubmit.bind(this));

    // Add input validation listeners
    Object.keys(this.fields).forEach(fieldName => {
      const field = this.fields[fieldName];
      addEvent(field.element, 'blur', () => this.validateField(fieldName));
      addEvent(field.element, 'input', () => this.clearFieldError(fieldName));
    });
  }

  validateField(fieldName) {
    const field = this.fields[fieldName];
    const value = field.element.value.trim();
    const errorMessage = field.validate(value);

    if (errorMessage) {
      this.setFieldError(fieldName, errorMessage);
      return false;
    }

    this.clearFieldError(fieldName);
    return true;
  }

  validateForm() {
    let isValid = true;
    Object.keys(this.fields).forEach(fieldName => {
      if (!this.validateField(fieldName)) {
        isValid = false;
      }
    });
    return isValid;
  }

  setFieldError(fieldName, message) {
    const field = this.fields[fieldName];
    field.element.classList.add('has-error');
    field.errorElement.textContent = message;
    field.errorElement.style.display = 'block';
  }

  clearFieldError(fieldName) {
    const field = this.fields[fieldName];
    field.element.classList.remove('has-error');
    field.errorElement.textContent = '';
    field.errorElement.style.display = 'none';
  }

  async submitForm(formData) {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(Object.fromEntries(formData))
    });

    if (!response.ok) {
      throw new Error('Failed to submit form. Please try again.');
    }

    return await response.json();
  }

  handleSubmit = asyncHandler(async (event) => {
    event.preventDefault();

    if (!this.validateForm()) {
      return;
    }

    const formData = new FormData(this.form);
    await this.submitForm(formData);

    showMessage('Thank you for your message! We will get back to you soon.', 'success');
    this.form.reset();
  });
}

// Initialize the contact form when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ContactForm();
});
