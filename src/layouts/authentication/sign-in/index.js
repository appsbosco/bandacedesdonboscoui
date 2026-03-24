/* eslint-disable react/prop-types */

import { useContext, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@apollo/client";
import jwtDecode from "jwt-decode";
import { AUTH_USER, REQUEST_RESET_MUTATION } from "graphql/mutations";
import UserContext from "UserContext";
import ForgotPasswordModal from "../password-reset/ForgotPasswordModal";
import cover from "../../../assets/images/cover.webp";
import "../../../styles.css";
import "../../../main.css";
import logoBcdb from "../../../assets/images/logo-bcdb.webp";

// ─── Reusable field ───────────────────────────────────────────────────────────

function Field({ label, error, children }) {
  return (
    <div className="flex flex-col">
      <label className="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-widest relative z-10">
        {label}
      </label>

      <div className="relative z-0">{children}</div>

      {error && (
        <p className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1">
          <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

function TextInput({ icon, type = "text", className = "", ...props }) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const isDate = type === "date";

  return (
    <div className="relative">
      {icon && !isDate && (
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
          {icon}
        </div>
      )}

      <input
        type={isPassword ? (show ? "text" : "password") : type}
        {...props}
        className={`block relative z-20 w-full bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400
          focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:bg-white
          hover:border-slate-300 transition-all duration-150 py-3
          ${icon && !isDate ? "pl-10 pr-4" : "px-4"}
          ${isPassword ? "pr-11" : ""}
          ${className}`}
      />

      {isPassword && (
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((s) => !s)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors z-30"
        >
          {show ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21"
              />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}

// ─── Toast notification ───────────────────────────────────────────────────────

function Toast({ type, message, onDismiss }) {
  if (!message) return null;
  const isSuccess = type === "success";
  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300
      ${
        isSuccess
          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
          : "bg-red-50 border-red-200 text-red-800"
      }`}
    >
      <div
        className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5
        ${isSuccess ? "bg-emerald-500" : "bg-red-500"}`}
      >
        {isSuccess ? (
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 13l4 4L19 7"
            />
          </svg>
        ) : (
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        )}
      </div>
      <span className="flex-1 leading-relaxed">{message}</span>
      <button
        onClick={onDismiss}
        className="text-current opacity-50 hover:opacity-80 transition-opacity"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}

// ─── SignIn ───────────────────────────────────────────────────────────────────

const SignIn = () => {
  const navigate = useNavigate();
  const { refreshUserData } = useContext(UserContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null); // { type, message }
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const [authUser] = useMutation(AUTH_USER);
  const [requestReset] = useMutation(REQUEST_RESET_MUTATION);

  const resolvePostLoginPath = (token) => {
    try {
      const decoded = jwtDecode(token);
      if (decoded?.role === "Taquilla") return "/qr-scanner";
      if (decoded?.role === "Tickets Admin") return "/lista-entradas";
    } catch (_) {
      return "/dashboard";
    }
    return "/dashboard";
  };

  const showToast = (type, message, duration = 4000) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), duration);
  };

  const validate = () => {
    const errs = {};
    if (!email.trim()) errs.email = "El correo es requerido";
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = "Correo no válido";
    if (!password) errs.password = "La contraseña es requerida";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await authUser({ variables: { input: { email, password } } });
      const { token } = data.authUser;
      localStorage.setItem("token", token);
      showToast("success", "¡Bienvenido! Redirigiendo…");
      refreshUserData();
      setTimeout(() => navigate(resolvePostLoginPath(token)), 1500);
    } catch (err) {
      showToast("error", err.message.replace("GraphQL error: ", ""));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    try {
      await requestReset({ variables: { email } });
      showToast("success", "Si ese correo existe, recibirás un enlace de recuperación.");
    } catch (_) {
      showToast("success", "Si ese correo existe, recibirás un enlace de recuperación.");
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* ── Left panel: form ── */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-16 max-w-xl">
        {/* Logo / brand */}
        <div className="mb-10">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <img
              src={logoBcdb}
              alt="Logo Banda CEDES Don Bosco"
              className="h-20 w-auto sm:h-24 object-contain"
              loading="eager"
              decoding="async"
            />
          </Link>
        </div>

        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight leading-tight">
            Bienvenido de vuelta
          </h1>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">
            Ingresá tus datos para acceder al sistema de la Banda CEDES Don Bosco.
          </p>
        </div>

        {/* Toast */}
        {toast && (
          <div className="mb-5">
            <Toast type={toast.type} message={toast.message} onDismiss={() => setToast(null)} />
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <Field label="Correo electrónico" error={errors.email}>
            <TextInput
              type="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((p) => ({ ...p, email: undefined }));
              }}
              autoComplete="email"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              }
            />
          </Field>

          <Field label="Contraseña" error={errors.password}>
            <TextInput
              type="password"
              placeholder="Tu contraseña"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((p) => ({ ...p, password: undefined }));
              }}
              autoComplete="current-password"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              }
            />
          </Field>

          {/* Forgot password */}
          <div className="flex justify-end -mt-1">
            <button
              type="button"
              onClick={() => setShowForgot(true)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors underline underline-offset-2"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 text-white text-sm font-semibold
              hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed
              transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Ingresando…
              </>
            ) : (
              "Iniciar sesión"
            )}
          </button>
        </form>

        {/* Sign up link */}
        <p className="mt-8 text-sm text-slate-500 text-center">
          ¿No tenés cuenta?{" "}
          <Link
            to="/autenticacion/registrarse-privado"
            className="font-semibold text-slate-900 hover:underline underline-offset-2"
          >
            Registrarse
          </Link>
        </p>
      </div>

      {/* ── Right panel: image (desktop only) ── */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-slate-900">
        <img
          src={cover}
          alt="Banda CEDES Don Bosco"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-60"
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-transparent" />

        {/* Quote block */}
        <div className="relative z-10 flex flex-col justify-end p-12 pb-14">
          <div className="max-w-sm">
            <div className="w-8 h-0.5 bg-white/50 mb-5" />
            <p className="text-white text-xl font-medium leading-relaxed tracking-tight">
              La música es el idioma universal de la humanidad.
            </p>
            <p className="mt-3 text-white/50 text-sm font-medium">— Henry Wadsworth Longfellow</p>
          </div>
        </div>

        {/* Decorative dots */}
        <div className="absolute top-10 right-10 grid grid-cols-5 gap-1.5 opacity-20">
          {Array.from({ length: 25 }).map((_, i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-white" />
          ))}
        </div>
      </div>

      {/* Forgot password modal */}
      {showForgot && (
        <ForgotPasswordModal
          open={showForgot}
          onClose={() => setShowForgot(false)}
          onSubmit={handleForgotPassword}
        />
      )}
    </div>
  );
};

export default SignIn;
