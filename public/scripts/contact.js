import { showError, showSuccess, clearErrors } from './utils/utilities.js';

class ContactForm {
  constructor() {
    this.form = document.querySelector('.contact-form');
    this.nameInput = document.querySelector('input[name="name"]');
    this.interestInput = document.querySelector('input[name="interest"]');
    this.messageInput = document.querySelector('textarea[name="message"]');
    this.emailInput = document.querySelector('input[name="email"]');
    this.phoneInput = document.querySelector('input[name="phone"]');
    this.submitButton = document.querySelector('button[type="submit"]');
    this.csrfToken = null;

    this.initialize();
  }

  async initialize() {
    if (!this.form) return;

    await this.fetchCsrfToken();
    this.form.addEventListener('submit', this.handleSubmit.bind(this));
  }

  async fetchCsrfToken() {
    try {
      const response = await fetch('/api/csrf-token');
      const data = await response.json();
      this.csrfToken = data.csrfToken;
    } catch (error) {
      console.error('Error fetching CSRF token:', error);
      showError(null, 'Failed to initialize form. Please refresh the page.');
    }
  }

  validateForm() {
    let isValid = true;
    clearErrors();

    if (!this.nameInput.value.trim()) {
      showError('name', 'Name is required');
      isValid = false;
    } else if (this.nameInput.value.trim().length < 2) {
      showError('name', 'Name must be at least 2 characters');
      isValid = false;
    }

    if (!this.interestInput.value.trim()) {
      showError('interest', 'Interest is required');
      isValid = false;
    }

    if (!this.messageInput.value.trim()) {
      showError('message', 'Message is required');
      isValid = false;
    } else if (this.messageInput.value.trim().length < 10) {
      showError('message', 'Message must be at least 10 characters');
      isValid = false;
    }

    // Email validation if provided
    if (this.emailInput.value.trim() && !this.isValidEmail(this.emailInput.value.trim())) {
      showError('email', 'Please enter a valid email address');
      isValid = false;
    }

    return isValid;
  }

  isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  }

  async handleSubmit(event) {
    event.preventDefault();
    clearErrors();

    if (!this.validateForm()) {
      return;
    }

    this.submitButton.disabled = true;

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CSRF-Token': this.csrfToken
        },
        body: JSON.stringify({
          name: this.nameInput.value.trim(),
          interest: this.interestInput.value.trim(),
          message: this.messageInput.value.trim(),
          email: this.emailInput.value.trim(),
          phone: this.phoneInput.value.trim()
        })
      });

      const data = await response.json();

      if (response.status === 429) {
        showError(null, 'Too many requests. Please try again later.');
        return;
      }

      if (response.status === 403) {
        showError(null, 'Invalid CSRF token. Please refresh the page and try again.');
        return;
      }

      if (!response.ok) {
        if (data.errors) {
          data.errors.forEach(error => {
            showError(error.field, error.message);
          });
        } else {
          showError(null, data.message || 'An error occurred while processing your request.');
        }
        return;
      }

      if (data.success) {
        showSuccess(data.message);
        this.form.reset();
      } else {
        showError(null, data.message || 'An error occurred while processing your request.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      showError(null, 'Failed to submit form. Please try again.');
    } finally {
      this.submitButton.disabled = false;
    }
  }
}

// Initialize the contact form
document.addEventListener('DOMContentLoaded', () => {
  new ContactForm();
});
