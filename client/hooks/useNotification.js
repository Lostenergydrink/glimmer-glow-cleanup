import { useState, useCallback } from 'react';
import { Snackbar, Alert } from '@mui/material';

/**
 * Custom hook for managing notifications using Material-UI's Snackbar
 * @returns {Object} Hook methods and components
 */
export const useNotification = () => {
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info',
    autoHideDuration: 6000
  });

  const showNotification = useCallback(({
    message,
    severity = 'info',
    autoHideDuration = 6000
  }) => {
    setNotification({
      open: true,
      message,
      severity,
      autoHideDuration
    });
  }, []);

  const hideNotification = useCallback(() => {
    setNotification((prev) => ({
      ...prev,
      open: false
    }));
  }, []);

  const NotificationComponent = useCallback(() => (
    <Snackbar
      open={notification.open}
      autoHideDuration={notification.autoHideDuration}
      onClose={hideNotification}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert
        onClose={hideNotification}
        severity={notification.severity}
        variant="filled"
        sx={{ width: '100%' }}
      >
        {notification.message}
      </Alert>
    </Snackbar>
  ), [notification, hideNotification]);

  return {
    showNotification,
    hideNotification,
    NotificationComponent
  };
};
