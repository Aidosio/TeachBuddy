'use client';

import { Snackbar, Alert } from '@mui/material';
import { useUiStore } from '@/stores/useUiStore';

export const SnackbarProvider = () => {
  const { notifications, hideNotification } = useUiStore();

  return (
    <>
      {notifications.map((notification) => (
        <Snackbar
          key={notification.id}
          open={true}
          autoHideDuration={5000}
          onClose={() => hideNotification(notification.id)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => hideNotification(notification.id)}
            severity={notification.type}
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </>
  );
};

