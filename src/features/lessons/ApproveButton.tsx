"use client";

import { useState } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
} from "@mui/material";
import { Check } from "react-feather";
import { api, endpoints } from "@/lib/api";
import { useUiStore } from "@/stores/useUiStore";
import { useLessonStore } from "@/stores/useLessonStore";
import { LoadingButton } from "@/shared/components/LoadingButton";
import { VersionHistory } from "./VersionHistory";
import type { ContentType, ContentVersion } from "@/entities/types";

interface ApproveButtonProps {
  lessonId: string;
  type: ContentType;
  hasDraft: boolean;
  onApproved?: () => void;
}

export const ApproveButton = ({
  lessonId,
  type,
  hasDraft,
  onApproved,
}: ApproveButtonProps) => {
  const [open, setOpen] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    null
  );
  const [approving, setApproving] = useState(false);
  const { showNotification } = useUiStore();
  const { updateApprovedContent, refreshLesson } = useLessonStore();

  const typeLabels: Record<ContentType, string> = {
    plan: "план",
    materials: "материалы",
    tests: "тесты",
  };

  const getApproveEndpoint = (type: ContentType) => {
    switch (type) {
      case "plan":
        return endpoints.lessons.approvePlan(lessonId);
      case "materials":
        return endpoints.lessons.approveMaterials(lessonId);
      case "tests":
        return endpoints.lessons.approveTests(lessonId);
    }
  };

  const handleApprove = async () => {
    try {
      setApproving(true);
      const endpoint = getApproveEndpoint(type);
      await api.post(endpoint, {
        versionId: selectedVersionId || undefined,
      });

      showNotification(`${typeLabels[type]} успешно утвержден`, "success");
      await refreshLesson();
      setOpen(false);
      setSelectedVersionId(null);
      if (onApproved) {
        onApproved();
      }
    } catch (err: any) {
      showNotification(
        err.response?.data?.message ||
          err.message ||
          `Ошибка утверждения ${typeLabels[type]}`,
        "error"
      );
    } finally {
      setApproving(false);
    }
  };

  const handleSelectVersion = (version: ContentVersion) => {
    setSelectedVersionId(version.id);
  };

  if (!hasDraft) {
    return null;
  }

  return (
    <>
      <Button
        variant="contained"
        color="success"
        startIcon={<Check size={16} />}
        onClick={() => setOpen(true)}
      >
        Утвердить {typeLabels[type]}
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Утверждение {typeLabels[type]}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Выберите версию для утверждения или утвердите текущий черновик:
            </Typography>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Версия для утверждения</InputLabel>
              <Select
                value={selectedVersionId || "draft"}
                onChange={(e) =>
                  setSelectedVersionId(
                    e.target.value === "draft" ? null : e.target.value
                  )
                }
                label="Версия для утверждения"
              >
                <MenuItem value="draft">Текущий черновик</MenuItem>
              </Select>
            </FormControl>

            <VersionHistory
              lessonId={lessonId}
              type={type}
              onSelectVersion={handleSelectVersion}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Отмена</Button>
          <LoadingButton
            variant="contained"
            color="success"
            onClick={handleApprove}
            loading={approving}
            startIcon={<Check size={16} />}
          >
            Утвердить
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
};
