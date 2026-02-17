import React from "react";
import { Snackbar, Paper, Box, Typography, IconButton } from "@mui/material";
import Slide from "@mui/material/Slide";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import PropTypes from "prop-types";

const MAP = {
  success: { color: "#16a34a", Icon: CheckCircleRoundedIcon },
  error: { color: "#dc2626", Icon: ErrorOutlineRoundedIcon },
  warning: { color: "#f59e0b", Icon: WarningAmberRoundedIcon },
  info: { color: "#2563eb", Icon: InfoRoundedIcon },
};

export default function Toast({
  open,
  message,
  severity = "info",
  onClose,
  duration = 3200,
  anchorOrigin = { vertical: "top", horizontal: "center" },
  toastKey,
}) {
  const cfg = MAP[severity] || MAP.info;
  const Icon = cfg.Icon;

  return (
    <Snackbar
      key={toastKey}
      open={open}
      autoHideDuration={duration}
      onClose={(e, reason) => {
        if (reason === "clickaway") return;
        onClose?.();
      }}
      anchorOrigin={anchorOrigin}
      TransitionComponent={Slide}
      TransitionProps={{ direction: "down" }}
      sx={{ mt: 1.5 }}
    >
      <Paper
        elevation={0}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          px: 1.75,
          py: 1.25,
          borderRadius: 9999,

          // clean + glass
          bgcolor: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(10px)",
          border: "1px solid #e5e7eb",
          boxShadow: "0 14px 40px rgba(0,0,0,0.14)",

          // responsive width
          minWidth: { xs: "calc(100vw - 24px)", sm: 420 },
          maxWidth: 560,
        }}
      >
        {/* Accent dot */}
        <Box
          sx={{
            width: 10,
            height: 10,
            borderRadius: 9999,
            bgcolor: cfg.color,
            flex: "0 0 auto",
          }}
        />

        {/* Icon */}
        <Box sx={{ color: cfg.color, display: "flex" }}>
          <Icon fontSize="small" />
        </Box>

        {/* Message */}
        <Typography
          sx={{
            color: "#111827",
            fontWeight: 600,
            lineHeight: 1.2,
            flex: 1,
          }}
        >
          {message}
        </Typography>

        {/* Close */}
        <IconButton size="small" onClick={onClose} aria-label="Cerrar">
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </Paper>
    </Snackbar>
  );
}

Toast.propTypes = {
  open: PropTypes.bool.isRequired,
  message: PropTypes.string.isRequired,
  severity: PropTypes.oneOf(["success", "error", "warning", "info"]),
  onClose: PropTypes.func,
  duration: PropTypes.number,
  anchorOrigin: PropTypes.shape({
    vertical: PropTypes.oneOf(["top", "bottom"]).isRequired,
    horizontal: PropTypes.oneOf(["left", "center", "right"]).isRequired,
  }),
  toastKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

Toast.defaultProps = {
  severity: "info",
  onClose: undefined,
  duration: 3200,
  anchorOrigin: { vertical: "top", horizontal: "center" },
  toastKey: undefined,
};
