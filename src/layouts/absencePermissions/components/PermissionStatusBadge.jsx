import React from "react";
import PropTypes from "prop-types";

const STATUS_CONFIG = {
  PENDING: {
    label: "Pendiente",
    className: "bg-amber-50 text-amber-700 border border-amber-200",
    dot: "bg-amber-500",
  },
  APPROVED: {
    label: "Aprobado",
    className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    dot: "bg-emerald-500",
  },
  REJECTED: {
    label: "Rechazado",
    className: "bg-red-50 text-red-700 border border-red-200",
    dot: "bg-red-500",
  },
  CANCELLED: {
    label: "Cancelado",
    className: "bg-gray-100 text-gray-500 border border-gray-200",
    dot: "bg-gray-400",
  },
};

export function PermissionStatusBadge({ status, showDot = true, size = "sm" }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  const textSize = size === "xs" ? "text-xs" : "text-xs";
  const padding = size === "xs" ? "px-2 py-0.5" : "px-2.5 py-1";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${textSize} ${padding} ${config.className}`}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dot}`} />
      )}
      {config.label}
    </span>
  );
}

PermissionStatusBadge.propTypes = {
  status: PropTypes.oneOf(["PENDING", "APPROVED", "REJECTED", "CANCELLED"]).isRequired,
  showDot: PropTypes.bool,
  size: PropTypes.oneOf(["xs", "sm"]),
};
