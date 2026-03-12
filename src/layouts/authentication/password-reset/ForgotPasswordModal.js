/* eslint-disable react/prop-types */
import PropTypes from "prop-types";
import { useState, useEffect, useRef } from "react";
import { REQUEST_RESET_MUTATION } from "graphql/mutations";
import { useMutation } from "@apollo/client";

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconMail = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);

const IconX = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const IconCheckCircle = () => (
  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const IconSend = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
    />
  </svg>
);

const IconSpinner = () => (
  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
);

// ─── Countdown resend ─────────────────────────────────────────────────────────

function ResendButton({ onResend }) {
  const [seconds, setSeconds] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [busy, setBusy] = useState(false);
  const timerRef = useRef(null);

  const startTimer = () => {
    setSeconds(60);
    setCanResend(false);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current);
          setCanResend(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, []);

  const handleClick = async () => {
    if (!canResend || busy) return;
    setBusy(true);
    try {
      await onResend();
    } catch (_) {
      /* silent */
    } finally {
      setBusy(false);
      startTimer();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!canResend || busy}
      className={`text-sm font-semibold transition-all duration-200
        ${
          canResend && !busy
            ? "text-slate-900 underline underline-offset-2 hover:text-slate-600 cursor-pointer"
            : "text-slate-400 cursor-not-allowed"
        }`}
    >
      {busy ? "Enviando…" : canResend ? "Reenviar correo" : `Reenviar en ${seconds}s`}
    </button>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const ForgotPasswordModal = ({ open, onClose }) => {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [phase, setPhase] = useState("idle"); // idle | loading | success
  const inputRef = useRef(null);

  const [requestReset] = useMutation(REQUEST_RESET_MUTATION);

  // Focus input on open
  useEffect(() => {
    if (open && phase === "idle") setTimeout(() => inputRef.current?.focus(), 80);
  }, [open, phase]);

  // Reset state when closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setEmail("");
        setFieldError("");
        setPhase("idle");
      }, 300);
    }
  }, [open]);

  // ESC to close
  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  const validate = () => {
    if (!email.trim()) {
      setFieldError("El correo es requerido");
      return false;
    }
    if (!isValidEmail(email)) {
      setFieldError("Ingresá un correo válido");
      return false;
    }
    setFieldError("");
    return true;
  };

  const doRequest = async (emailToSend) => {
    try {
      await requestReset({ variables: { email: emailToSend.trim().toLowerCase() } });
    } catch (_) {
      /* always show success — anti-enumeration */
    }
  };

  const submit = async () => {
    if (!validate()) return;
    setPhase("loading");
    await doRequest(email);
    setPhase("success");
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="forgot-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />

      {/* Panel */}
      <div
        className="relative z-10 w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl
        shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 sm:slide-in-from-bottom-2 duration-300"
      >
        {/* Accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-slate-800 via-slate-600 to-slate-400" />

        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400
            hover:text-slate-700 hover:bg-slate-100 transition-all duration-150"
        >
          <IconX />
        </button>

        <div className="px-7 pt-7 pb-8">
          {/* ── Idle / loading ── */}
          {(phase === "idle" || phase === "loading") && (
            <>
              <div className="mb-7">
                <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center mb-4 text-slate-600">
                  <IconMail />
                </div>
                <h2 id="forgot-title" className="text-xl font-bold text-slate-900 leading-tight">
                  ¿Olvidaste tu contraseña?
                </h2>
                <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
                  Sin problema. Escribí tu correo y te enviamos un enlace para restablecerla.
                </p>
              </div>

              <div className="mb-5">
                <label
                  htmlFor="forgot-email"
                  className="block mb-1.5 text-xs font-semibold text-slate-500 uppercase tracking-widest"
                >
                  Correo electrónico
                </label>
                <div className="relative">
                  <input
                    ref={inputRef}
                    id="forgot-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="tu@correo.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldError) setFieldError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submit();
                    }}
                    disabled={phase === "loading"}
                    aria-invalid={!!fieldError}
                    aria-describedby={fieldError ? "forgot-email-error" : undefined}
                    className={`block w-full pl-10 pr-4 py-3 rounded-xl text-sm text-slate-900 bg-slate-50
                      border transition-all duration-150 outline-none placeholder-slate-400
                      hover:border-slate-300 hover:bg-white
                      focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400
                      disabled:opacity-50 disabled:cursor-not-allowed
                      ${fieldError ? "border-red-400 ring-2 ring-red-400/20" : "border-slate-200"}`}
                  />
                </div>
                {fieldError && (
                  <p
                    id="forgot-email-error"
                    role="alert"
                    className="mt-1.5 flex items-center gap-1 text-xs text-red-500 font-medium"
                  >
                    <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {fieldError}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={submit}
                disabled={phase === "loading" || !email.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl
                  bg-slate-900 text-white text-sm font-semibold
                  hover:bg-slate-700 active:scale-[0.98]
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-150"
              >
                {phase === "loading" ? (
                  <>
                    Enviando… <IconSpinner />
                  </>
                ) : (
                  <>
                    Enviar enlace <IconSend />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="mt-4 w-full text-center text-sm text-slate-400 hover:text-slate-600 transition-colors"
              >
                Cancelar
              </button>
            </>
          )}

          {/* ── Success ── */}
          {phase === "success" && (
            <div className="text-center py-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex justify-center mb-5 text-emerald-500">
                <IconCheckCircle />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Revisá tu bandeja</h2>
              <p className="text-sm text-slate-500 leading-relaxed mb-1">
                Si <span className="font-semibold text-slate-700">{email}</span> está registrado,
                vas a recibir un enlace en los próximos minutos.
              </p>
              <p className="text-xs text-slate-400 mb-7">
                Revisá también la carpeta de spam o correo no deseado.
              </p>
              <div className="flex items-center justify-center gap-2 mb-6 text-sm text-slate-500">
                <span>¿No llegó?</span>
                <ResendButton onResend={() => doRequest(email)} />
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 px-5 rounded-xl bg-slate-900 text-white text-sm font-semibold
                  hover:bg-slate-700 active:scale-[0.98] transition-all duration-150"
              >
                Listo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

ForgotPasswordModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ForgotPasswordModal;
