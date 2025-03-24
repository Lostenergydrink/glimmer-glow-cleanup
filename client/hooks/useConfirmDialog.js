import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button
} from '@mui/material';

/**
 * Hook for managing confirmation dialogs
 * @returns {Object} Hook methods and state
 */
export const useConfirmDialog = () => {
  const [dialog, setDialog] = useState({
    open: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    severity: 'warning',
    resolve: null
  });

  const showConfirmDialog = useCallback(({
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    severity = 'warning'
  }) => {
    return new Promise((resolve) => {
      setDialog({
        open: true,
        title,
        message,
        confirmText,
        cancelText,
        severity,
        resolve
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    dialog.resolve(true);
    setDialog((prev) => ({ ...prev, open: false }));
  }, [dialog]);

  const handleCancel = useCallback(() => {
    dialog.resolve(false);
    setDialog((prev) => ({ ...prev, open: false }));
  }, [dialog]);

  const ConfirmDialog = useCallback(() => (
    <Dialog
      open={dialog.open}
      onClose={handleCancel}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      <DialogTitle id="confirm-dialog-title">
        {dialog.title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="confirm-dialog-description">
          {dialog.message}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel} color="inherit">
          {dialog.cancelText}
        </Button>
        <Button
          onClick={handleConfirm}
          color={dialog.severity === 'error' ? 'error' : 'primary'}
          variant="contained"
          autoFocus
        >
          {dialog.confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  ), [dialog, handleCancel, handleConfirm]);

  return {
    showConfirmDialog,
    ConfirmDialog
  };
};
