"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { AppBar } from "@/shared/components/AppBar";
import {
  Container,
  Drawer,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  Divider,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Menu, LogOut, User, Home, X } from "react-feather";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, logout } = useAuthStore();
  const router = useRouter();
  const theme = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  // Используем noSsr чтобы избежать проблем с гидратацией
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"), { noSsr: true });

  // Убеждаемся, что компонент смонтирован на клиенте перед рендерингом условных элементов
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated()) {
    return null;
  }

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
    setMobileOpen(false);
  };

  const handleNavigate = (path: string) => {
    router.push(path);
    setMobileOpen(false);
  };

  const drawer = (
    <Box sx={{ width: 280, height: "100%" }}>
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          gap: 2,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Teach Buddy
        </Typography>
        <IconButton onClick={handleDrawerToggle} size="small">
          <X size={20} />
        </IconButton>
      </Box>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <User size={20} />
          <Typography variant="body2" sx={{ flexGrow: 1 }}>
            {user?.email || "Пользователь"}
          </Typography>
        </Box>
      </Box>
      <List sx={{ pt: 2 }}>
        <ListItem disablePadding>
          <ListItemButton onClick={() => handleNavigate("/dashboard")}>
            <ListItemIcon>
              <Home size={20} />
            </ListItemIcon>
            <ListItemText primary="Мои курсы" />
          </ListItemButton>
        </ListItem>
      </List>
      <Divider />
      <List sx={{ mt: "auto", pt: 2 }}>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <LogOut size={20} />
            </ListItemIcon>
            <ListItemText primary="Выйти" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  // Пока не смонтирован, рендерим только контент без условных элементов
  if (!mounted) {
    return (
      <Container
        maxWidth="xl"
        sx={{
          mt: { xs: 8, sm: 4 },
          mb: 4,
          px: { xs: 1, sm: 3 },
        }}
      >
        {children}
      </Container>
    );
  }

  return (
    <>
      {isMobile ? (
        <>
          <Box
            sx={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 1100,
              bgcolor: "background.paper",
              borderBottom: 1,
              borderColor: "divider",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                p: 1.5,
              }}
            >
              <IconButton onClick={handleDrawerToggle} aria-label="open drawer">
                <Menu size={24} />
              </IconButton>
              <Typography variant="h6" component="div">
                Teach Buddy
              </Typography>
              <Box sx={{ width: 40 }} /> {/* Spacer for centering */}
            </Box>
          </Box>
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}
            sx={{
              display: { xs: "block", sm: "none" },
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: 280,
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
              },
            }}
          >
            {drawer}
          </Drawer>
        </>
      ) : (
        <Container maxWidth="xl" sx={{ mt: 4 }}>
          <AppBar />
        </Container>
      )}
      <Container
        maxWidth="xl"
        sx={{
          mt: { xs: 8, sm: 4 },
          mb: 4,
          px: { xs: 1, sm: 3 },
        }}
      >
        {children}
      </Container>
    </>
  );
}
