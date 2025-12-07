'use client';

import { Button, ButtonProps, CircularProgress } from '@mui/material';

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
}

export const LoadingButton = ({
  loading = false,
  disabled,
  children,
  ...props
}: LoadingButtonProps) => {
  return (
    <Button disabled={disabled || loading} {...props}>
      {loading && (
        <CircularProgress size={16} sx={{ mr: 1 }} color="inherit" />
      )}
      {children}
    </Button>
  );
};

