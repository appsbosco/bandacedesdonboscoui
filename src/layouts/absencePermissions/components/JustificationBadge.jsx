import React from "react";
import PropTypes from "prop-types";

const JUSTIFICATION_CONFIG = {
  PENDING_REVIEW: {
    label: "Pendiente de revisión",
    className: "bg-sky-50 text-sky-700 border border-sky-200",
  },
  JUSTIFIED: {
    label: "Ausencia justificada",
    className: "bg-blue-50 text-blue-700 border border-blue-200",
  },
  NOT_JUSTIFIED: {
    label: "Ausencia no justificada",
    className: "bg-orange-50 text-orange-700 border border-orange-200",
  },
};

export function JustificationBadge({ status, size = "sm" }) {
  const config = JUSTIFICATION_CONFIG[status] ?? JUSTIFICATION_CONFIG.PENDING_REVIEW;
  const padding = size === "xs" ? "px-2 py-0.5" : "px-2.5 py-1";

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium text-xs ${padding} ${config.className}`}
    >
      {config.label}
    </span>
  );
}

JustificationBadge.propTypes = {
  status: PropTypes.oneOf(["PENDING_REVIEW", "JUSTIFIED", "NOT_JUSTIFIED"]).isRequired,
  size: PropTypes.oneOf(["xs", "sm"]),
};
