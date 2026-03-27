import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";

function CloseIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

export function BottomSheetDialog({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  maxWidth = "720px",
}) {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!mounted) return undefined;
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, mounted]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleEscape = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          background: "rgba(2,8,23,0.6)",
          backdropFilter: "blur(8px)",
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : "Dialog"}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          alignItems: isMobile ? "flex-end" : "center",
          justifyContent: "center",
          padding: isMobile ? 0 : "24px",
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            width: "100%",
            maxWidth: isMobile ? "100%" : maxWidth,
            maxHeight: isMobile ? "95dvh" : "90vh",
            background: "#ffffff",
            borderRadius: isMobile ? "24px 24px 0 0" : "20px",
            boxShadow: "0 32px 64px -12px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.06)",
            overflow: "hidden",
          }}
          onClick={(event) => event.stopPropagation()}
        >
          {isMobile && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "14px 0 6px",
                flexShrink: 0,
              }}
            >
              <div style={{ width: 40, height: 4, borderRadius: 99, background: "#e2e8f0" }} />
            </div>
          )}

          <div
            style={{
              flexShrink: 0,
              padding: isMobile ? "12px 20px 14px" : "18px 24px",
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  flexShrink: 0,
                  background: "#f8fafc",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  border: "1.5px solid #e2e8f0",
                }}
              >
                {icon || "📘"}
              </div>
              <div style={{ minWidth: 0 }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#0f172a",
                    lineHeight: 1.2,
                  }}
                >
                  {title}
                </h2>
                {subtitle ? (
                  <p
                    style={{
                      margin: "2px 0 0",
                      fontSize: 11,
                      color: "#94a3b8",
                      lineHeight: 1.3,
                    }}
                  >
                    {subtitle}
                  </p>
                ) : null}
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="Cerrar"
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                border: "none",
                background: "#f1f5f9",
                cursor: "pointer",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#475569",
              }}
            >
              <CloseIcon />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>{children}</div>

          {footer ? (
            <div
              style={{
                position: "sticky",
                bottom: 0,
                flexShrink: 0,
                padding: isMobile ? "14px 20px" : "14px 24px",
                background: "#ffffff",
                borderTop: "1px solid #f1f5f9",
              }}
            >
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </>,
    document.body
  );
}

BottomSheetDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func,
  title: PropTypes.node.isRequired,
  subtitle: PropTypes.node,
  icon: PropTypes.node,
  children: PropTypes.node,
  footer: PropTypes.node,
  maxWidth: PropTypes.string,
};

export default BottomSheetDialog;
