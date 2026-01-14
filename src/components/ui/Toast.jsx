import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import PropTypes from "prop-types";

const ToastContext = createContext(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}

/**
 * ToastProvider (Light UI)
 * - Alto contraste (texto oscuro sobre fondo claro)
 * - Botón cerrar claramente visible + aria-label
 * - Barra de progreso opcional
 * - Se puede pausar al hover (mejor UX)
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, options = {}) => {
    const {
      type = "info",
      duration = 4500,
      title,
      actionLabel,
      onAction,
      dismissible = true,
    } = options;

    const id = Date.now() + Math.random();

    setToasts((prev) => [
      ...prev,
      {
        id,
        message,
        type,
        title,
        actionLabel,
        onAction,
        dismissible,
        duration,
        createdAt: Date.now(),
        pausedAt: null,
        remaining: duration,
      },
    ]);

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback(
    (message, options) => addToast(message, { ...options, type: "success" }),
    [addToast]
  );
  const error = useCallback(
    (message, options) => addToast(message, { ...options, type: "error" }),
    [addToast]
  );
  const warning = useCallback(
    (message, options) => addToast(message, { ...options, type: "warning" }),
    [addToast]
  );
  const info = useCallback(
    (message, options) => addToast(message, { ...options, type: "info" }),
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} setToasts={setToasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

ToastProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

function ToastContainer({ toasts, setToasts, onRemove }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      className="
        fixed bottom-4 left-4 right-4 z-50
        flex flex-col gap-2
        pointer-events-none
        sm:left-auto sm:right-4 sm:max-w-sm
      "
      role="region"
      aria-label="Notificaciones"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} setToasts={setToasts} onRemove={onRemove} />
      ))}
    </div>
  );
}

ToastContainer.propTypes = {
  toasts: PropTypes.arrayOf(PropTypes.object).isRequired,
  setToasts: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
};

function Toast({ toast, setToasts, onRemove }) {
  const {
    id,
    message,
    type,
    title,
    actionLabel,
    onAction,
    dismissible,
    duration,
    remaining,
    pausedAt,
  } = toast;

  const timeoutRef = useRef(null);
  const startTsRef = useRef(null);

  // Auto-dismiss con pausa al hover
  useEffect(() => {
    if (!duration || duration <= 0) return;

    // Si está pausado, no programar timeout
    if (pausedAt) return;

    startTsRef.current = Date.now();

    timeoutRef.current = setTimeout(() => {
      onRemove(id);
    }, remaining);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [id, duration, remaining, pausedAt, onRemove]);

  const pause = () => {
    if (!duration || duration <= 0) return;
    if (pausedAt) return;

    const elapsed = Date.now() - (startTsRef.current || Date.now());
    setToasts((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        return {
          ...t,
          pausedAt: Date.now(),
          remaining: Math.max(0, (t.remaining ?? duration) - elapsed),
        };
      })
    );
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const resume = () => {
    if (!duration || duration <= 0) return;

    setToasts((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        return { ...t, pausedAt: null };
      })
    );
  };

  const theme = {
    success: {
      ring: "ring-emerald-200",
      bg: "bg-white",
      border: "border-emerald-200",
      iconBg: "bg-emerald-50",
      iconText: "text-emerald-700",
      title: "text-slate-900",
      body: "text-slate-600",
      bar: "bg-emerald-500",
    },
    error: {
      ring: "ring-rose-200",
      bg: "bg-white",
      border: "border-rose-200",
      iconBg: "bg-rose-50",
      iconText: "text-rose-700",
      title: "text-slate-900",
      body: "text-slate-600",
      bar: "bg-rose-500",
    },
    warning: {
      ring: "ring-amber-200",
      bg: "bg-white",
      border: "border-amber-200",
      iconBg: "bg-amber-50",
      iconText: "text-amber-800",
      title: "text-slate-900",
      body: "text-slate-600",
      bar: "bg-amber-500",
    },
    info: {
      ring: "ring-sky-200",
      bg: "bg-white",
      border: "border-sky-200",
      iconBg: "bg-sky-50",
      iconText: "text-sky-700",
      title: "text-slate-900",
      body: "text-slate-600",
      bar: "bg-sky-500",
    },
  }[type || "info"];

  const icons = {
    success: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  };

  const resolvedTitle =
    title ||
    (type === "success"
      ? "Listo"
      : type === "error"
      ? "Ocurrió un error"
      : type === "warning"
      ? "Atención"
      : "Información");

  const progressPct =
    duration && duration > 0 ? Math.max(0, Math.min(100, (remaining / duration) * 100)) : null;

  return (
    <div
      className={`
        pointer-events-auto
        w-full
        rounded-2xl border ${theme.border} ${theme.bg}
        shadow-xl shadow-slate-200/60
        ring-1 ${theme.ring}
        overflow-hidden
        animate-slide-up
      `}
      role="status"
      aria-live={type === "error" ? "assertive" : "polite"}
      onMouseEnter={pause}
      onMouseLeave={resume}
    >
      <div className="flex gap-3 p-4">
        {/* Icon */}
        <div
          className={`w-10 h-10 rounded-xl ${theme.iconBg} ${theme.iconText} flex items-center justify-center shrink-0`}
        >
          {icons[type || "info"]}
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-semibold ${theme.title}`}>{resolvedTitle}</p>
          <p className={`text-sm ${theme.body} mt-0.5 break-words`}>{message}</p>

          {/* Action */}
          {actionLabel && typeof onAction === "function" && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => {
                  onAction();
                  onRemove(id);
                }}
                className="
                  inline-flex items-center justify-center
                  px-3 py-1.5 rounded-xl
                  text-sm font-semibold
                  bg-slate-900 text-white
                  hover:bg-slate-800
                  transition-colors
                  focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2
                "
              >
                {actionLabel}
              </button>
            </div>
          )}
        </div>

        {/* Close */}
        {dismissible && (
          <button
            type="button"
            onClick={() => onRemove(id)}
            className="
              shrink-0
              w-9 h-9 rounded-xl
              flex items-center justify-center
              text-slate-500 hover:text-slate-900
              hover:bg-slate-100
              transition-colors
              focus:outline-none focus:ring-2 focus:ring-slate-300
            "
            aria-label="Cerrar notificación"
            title="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Progress bar */}
      {typeof progressPct === "number" && (
        <div className="h-1 bg-slate-100">
          <div
            className={`h-full ${theme.bar} transition-[width] duration-150`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}
    </div>
  );
}

Toast.propTypes = {
  toast: PropTypes.shape({
    id: PropTypes.number.isRequired,
    message: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
    type: PropTypes.oneOf(["success", "error", "warning", "info"]).isRequired,
    title: PropTypes.string,
    actionLabel: PropTypes.string,
    onAction: PropTypes.func,
    dismissible: PropTypes.bool,
    duration: PropTypes.number,
    remaining: PropTypes.number,
    pausedAt: PropTypes.number,
  }).isRequired,
  setToasts: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
};

export default ToastProvider;
