"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export const ConfirmDialog = ({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Подтвердить",
  cancelText = "Отмена",
}: ConfirmDialogProps) => {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      PaperProps={{
        sx: {
          m: { xs: 1, sm: 2 },
          width: { xs: "calc(100% - 16px)", sm: "auto" },
        },
      }}
    >
      <DialogTitle sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>
        {title}
      </DialogTitle>
      <DialogContent sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 1, sm: 2 } }}>
        <DialogContentText sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions
        sx={{
          px: { xs: 2, sm: 3 },
          pb: { xs: 2, sm: 2 },
          flexDirection: { xs: "column-reverse", sm: "row" },
          gap: { xs: 1, sm: 1 },
          "& > *": {
            width: { xs: "100%", sm: "auto" },
          },
        }}
      >
        <Button
          variant="outlined"
          sx={{
            boxShadow: "none",
            width: { xs: "100%", sm: "auto" },
          }}
          onClick={onCancel}
        >
          {cancelText}
        </Button>
        <Button
          sx={{
            boxShadow: "none",
            width: { xs: "100%", sm: "auto" },
          }}
          onClick={onConfirm}
          color="error"
          variant="contained"
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
