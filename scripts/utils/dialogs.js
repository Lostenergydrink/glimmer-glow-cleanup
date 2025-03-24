/**
 * Dialog Utilities
 * Provides functions for creating and managing modal dialogs.
 */

/**
 * Create and show a confirmation dialog
 * @param {string} title - Dialog title
 * @param {string} message - Dialog message
 * @param {string} confirmText - Text for confirm button
 * @param {string} cancelText - Text for cancel button
 * @returns {Promise<boolean>} Promise resolving to user's choice
 */
export function showConfirmDialog(title, message, confirmText = 'Confirm', cancelText = 'Cancel') {
  return new Promise(resolve => {
    // Create modal container
    const modalContainer = document.createElement('div');
    modalContainer.className = 'modal-container';
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content confirm-dialog';
    
    // Add title
    const titleElement = document.createElement('h3');
    titleElement.className = 'modal-title';
    titleElement.textContent = title;
    
    // Add message
    const messageElement = document.createElement('p');
    messageElement.className = 'modal-message';
    messageElement.textContent = message;
    
    // Add buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'modal-buttons';
    
    // Add cancel button
    const cancelButton = document.createElement('button');
    cancelButton.className = 'btn btn-secondary cancel-button';
    cancelButton.textContent = cancelText;
    cancelButton.addEventListener('click', () => {
      document.body.removeChild(modalContainer);
      resolve(false);
    });
    
    // Add confirm button
    const confirmButton = document.createElement('button');
    confirmButton.className = 'btn btn-primary confirm-button';
    confirmButton.textContent = confirmText;
    confirmButton.addEventListener('click', () => {
      document.body.removeChild(modalContainer);
      resolve(true);
    });
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.className = 'modal-close';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => {
      document.body.removeChild(modalContainer);
      resolve(false);
    });
    
    // Assemble modal
    buttonsContainer.appendChild(cancelButton);
    buttonsContainer.appendChild(confirmButton);
    
    modalContent.appendChild(closeButton);
    modalContent.appendChild(titleElement);
    modalContent.appendChild(messageElement);
    modalContent.appendChild(buttonsContainer);
    
    modalContainer.appendChild(modalContent);
    
    // Add to body
    document.body.appendChild(modalContainer);
    
    // Focus confirm button
    confirmButton.focus();
    
    // Handle Escape key
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        document.body.removeChild(modalContainer);
        document.removeEventListener('keydown', handleKeyDown);
        resolve(false);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
  });
}

/**
 * Create and show an alert dialog
 * @param {string} title - Dialog title
 * @param {string} message - Dialog message
 * @param {string} buttonText - Text for the button
 * @returns {Promise<void>} Promise resolving when dialog is closed
 */
export function showAlertDialog(title, message, buttonText = 'OK') {
  return new Promise(resolve => {
    // Create modal container
    const modalContainer = document.createElement('div');
    modalContainer.className = 'modal-container';
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content alert-dialog';
    
    // Add title
    const titleElement = document.createElement('h3');
    titleElement.className = 'modal-title';
    titleElement.textContent = title;
    
    // Add message
    const messageElement = document.createElement('p');
    messageElement.className = 'modal-message';
    messageElement.textContent = message;
    
    // Add button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'modal-buttons';
    
    // Add OK button
    const okButton = document.createElement('button');
    okButton.className = 'btn btn-primary ok-button';
    okButton.textContent = buttonText;
    okButton.addEventListener('click', () => {
      document.body.removeChild(modalContainer);
      resolve();
    });
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.className = 'modal-close';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => {
      document.body.removeChild(modalContainer);
      resolve();
    });
    
    // Assemble modal
    buttonContainer.appendChild(okButton);
    
    modalContent.appendChild(closeButton);
    modalContent.appendChild(titleElement);
    modalContent.appendChild(messageElement);
    modalContent.appendChild(buttonContainer);
    
    modalContainer.appendChild(modalContent);
    
    // Add to body
    document.body.appendChild(modalContainer);
    
    // Focus OK button
    okButton.focus();
    
    // Handle Escape key
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        document.body.removeChild(modalContainer);
        document.removeEventListener('keydown', handleKeyDown);
        resolve();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
  });
}

/**
 * Create and show a custom dialog
 * @param {Object} options - Dialog options
 * @param {string} options.title - Dialog title
 * @param {string|HTMLElement} options.content - Dialog content (string or HTML element)
 * @param {Array} options.buttons - Array of button configurations
 * @param {string} options.className - Additional class name for the dialog
 * @returns {Promise<any>} Promise resolving to button result
 */
export function showCustomDialog(options) {
  return new Promise(resolve => {
    const {
      title,
      content,
      buttons = [{text: 'Close', value: null, primary: true}],
      className = ''
    } = options;
    
    // Create modal container
    const modalContainer = document.createElement('div');
    modalContainer.className = 'modal-container';
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = `modal-content custom-dialog ${className}`;
    
    // Add title
    const titleElement = document.createElement('h3');
    titleElement.className = 'modal-title';
    titleElement.textContent = title;
    
    // Add content
    const contentElement = document.createElement('div');
    contentElement.className = 'modal-content-body';
    
    if (typeof content === 'string') {
      contentElement.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      contentElement.appendChild(content);
    }
    
    // Add buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'modal-buttons';
    
    // Add buttons
    buttons.forEach(button => {
      const buttonElement = document.createElement('button');
      buttonElement.className = `btn ${button.primary ? 'btn-primary' : 'btn-secondary'} ${button.className || ''}`;
      buttonElement.textContent = button.text;
      buttonElement.addEventListener('click', () => {
        document.body.removeChild(modalContainer);
        resolve(button.value);
      });
      
      if (button.id) {
        buttonElement.id = button.id;
      }
      
      buttonsContainer.appendChild(buttonElement);
    });
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.className = 'modal-close';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => {
      document.body.removeChild(modalContainer);
      resolve(null);
    });
    
    // Assemble modal
    modalContent.appendChild(closeButton);
    modalContent.appendChild(titleElement);
    modalContent.appendChild(contentElement);
    modalContent.appendChild(buttonsContainer);
    
    modalContainer.appendChild(modalContent);
    
    // Add to body
    document.body.appendChild(modalContainer);
    
    // Handle Escape key
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        document.body.removeChild(modalContainer);
        document.removeEventListener('keydown', handleKeyDown);
        resolve(null);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
  });
} 