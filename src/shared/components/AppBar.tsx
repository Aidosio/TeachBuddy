'use client';

import {
  AppBar as MuiAppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Box,
} from '@mui/material';
import { LogOut, User } from 'react-feather';
import { useAuthStore } from '@/stores/useAuthStore';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export const AppBar = () => {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
    handleMenuClose();
  };

  return (
    <MuiAppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Teach Buddy
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {user?.email && (
            <Typography variant="body2">{user.email}</Typography>
          )}
          <IconButton
            size="large"
            edge="end"
            color="inherit"
            onClick={handleMenuOpen}
            aria-label="user menu"
          >
            <User size={20} />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleLogout}>
              <LogOut size={16} style={{ marginRight: 8 }} />
              Выйти
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </MuiAppBar>
  );
};

