import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";

const MODAL_SIZES = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-full mx-4",
};

const EMPTY_STYLE = {};

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  size = "md",
  containerClassName = "",
  overlayClassName = "",
  panelClassName = "",
  headerClassName = "",
  contentClassName = "",
  closeButtonClassName = "",
  containerStyle = EMPTY_STYLE,
}) {
  const panelRef = useRef(null);
  const previouslyFocusedRef = useRef(null);

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Cerrar con Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
    }

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  // Enfocar el diálogo al abrir y devolver el foco al elemento anterior al cerrar.
  useEffect(() => {
    if (!isOpen) return undefined;
    previouslyFocusedRef.current = document.activeElement;
    const focusFrame = window.requestAnimationFrame(() => panelRef.current?.focus());

    return () => {
      window.cancelAnimationFrame(focusFrame);
      previouslyFocusedRef.current?.focus?.();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const modal = (
    <div
      className={`fixed inset-0 z-[10000] flex items-center justify-center p-4 ${containerClassName}`.trim()}
      style={{ zIndex: 10000, ...containerStyle }}
    >
      {/* Backdrop */}
      <button
        type="button"
        className={`absolute inset-0 border-0 bg-black/70 p-0 backdrop-blur-sm animate-fade-in ${overlayClassName}`.trim()}
        onClick={onClose}
        aria-label="Cerrar modal"
      />

      {/* Modal */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : "Ventana modal"}
        tabIndex={-1}
        className={`
          relative w-full ${MODAL_SIZES[size]}
          bg-white border 
          rounded-2xl shadow-2xl
          animate-slide-up
          ${panelClassName}
        `}
      >
        {/* Header */}
        {title && (
          <div
            className={`flex items-center justify-between px-6 py-4 border-b border-slate-700 ${headerClassName}`.trim()}
          >
            {typeof title === "string" ? (
              <h2 className="text-lg font-semibold text-black">{title}</h2>
            ) : (
              <div className="min-w-0 flex-1">{title}</div>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar modal"
              className={`flex h-11 w-11 items-center justify-center rounded-lg hover:bg-slate-800 transition-colors touch-target ${closeButtonClassName}`.trim()}
            >
              <svg
                className="w-5 h-5 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Content */}
        <div className={`p-6 ${contentClassName}`.trim()}>{children}</div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func,
  children: PropTypes.node,
  title: PropTypes.node, // permite string o JSX
  size: PropTypes.oneOf(["sm", "md", "lg", "xl", "full"]),
  containerClassName: PropTypes.string,
  overlayClassName: PropTypes.string,
  panelClassName: PropTypes.string,
  headerClassName: PropTypes.string,
  contentClassName: PropTypes.string,
  closeButtonClassName: PropTypes.string,
  containerStyle: PropTypes.object,
};

export default Modal;
