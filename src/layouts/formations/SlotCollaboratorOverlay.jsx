/* eslint-disable react/prop-types */
import React from "react";

/**
 * Grid-level overlay for collaborator indicators.
 * It renders above the full formation content so pills can float above slots
 * without being clipped by slot boundaries.
 */
export function SlotCollaboratorOverlay({ items }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="absolute inset-0 z-30 pointer-events-none">
      {items.map((item) => {
        const { collaborator, rect, pillTop, pillLeft } = item;
        const isDragTarget = collaborator.isDragTarget;
        const color = collaborator.color || "#6366f1";

        return (
          <React.Fragment
            key={collaborator.connectionId || `${collaborator.userId}-${rect.key}-${pillTop}`}
          >
            <div
              style={{
                position: "absolute",
                top: rect.top + (isDragTarget ? -3 : -2),
                left: rect.left + (isDragTarget ? -3 : -2),
                width: rect.width + (isDragTarget ? 6 : 4),
                height: rect.height + (isDragTarget ? 6 : 4),
                borderRadius: "14px",
                border: `${isDragTarget ? "2px" : "1.5px"} solid ${color}`,
                boxShadow: isDragTarget
                  ? `0 0 0 3px ${color}22, 0 0 12px ${color}33`
                  : `0 0 0 2px ${color}18`,
                zIndex: 1,
              }}
            />

            <div
              style={{
                position: "absolute",
                top: pillTop,
                left: pillLeft,
                display: "flex",
                alignItems: "center",
                gap: 3,
                zIndex: 2,
              }}
            >
              <svg
                width="12"
                height="14"
                viewBox="0 0 12 14"
                fill="none"
                style={{ flexShrink: 0, filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.25))" }}
              >
                <path
                  d="M1 1L1 11.5L4.5 8L7 13L8.5 12.3L6 7.3L11 7.3L1 1Z"
                  fill={color}
                  stroke="white"
                  strokeWidth="0.8"
                  strokeLinejoin="round"
                />
              </svg>

              <div
                style={{
                  background: color,
                  color: "#fff",
                  fontSize: "11px",
                  fontWeight: 600,
                  lineHeight: 1,
                  padding: "5px 9px",
                  borderRadius: "8px",
                  whiteSpace: "nowrap",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
                  letterSpacing: "0.01em",
                }}
              >
                {collaborator.displayName?.split(" ")[0] || "Usuario"}
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
