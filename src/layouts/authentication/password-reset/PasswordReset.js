/* eslint-disable react/prop-types */
import { useMutation } from "@apollo/client";
import { RESET_PASSWORD_MUTATION } from "graphql/mutations";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import logoBcdb from "../../../assets/images/logo-bcdb.webp";

// ─── Constants ────────────────────────────────────────────────────────────────

const MIN_PASSWORD_LEN = 8;

// ─── Password strength ───────────────────────────────────────────────────────

function getStrength(pw) {
  if (!pw) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  const map = [
    { label: "", color: "bg-slate-200" },
    { label: "Muy débil", color: "bg-red-400" },
    { label: "Débil", color: "bg-orange-400" },
    { label: "Regular", color: "bg-amber-400" },
    { label: "Buena", color: "bg-emerald-400" },
    { label: "Excelente", color: "bg-emerald-500" },
  ];
  return { score, ...map[score] };
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconEye = ({ slash = false }) => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    {slash ? (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21"
      />
    ) : (
      <>
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
      </>
    )}
  </svg>
);

const IconLock = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
    />
  </svg>
);

const IconCheck = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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

const IconWarning = () => (
  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
    />
  </svg>
);

// ─── Password input ───────────────────────────────────────────────────────────

function PasswordInput({ id, placeholder, value, onChange, disabled, hasError, describedBy }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        autoComplete="new-password"
        aria-invalid={hasError || undefined}
        aria-describedby={describedBy}
        className={`
          block w-full pl-10 pr-11 py-3 rounded-xl text-sm text-slate-900 bg-slate-50
          border transition-all duration-150 outline-none placeholder-slate-400
          hover:border-slate-300 hover:bg-white
          focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400
          disabled:opacity-50 disabled:cursor-not-allowed
          ${hasError ? "border-red-400 ring-2 ring-red-400/20" : "border-slate-200"}
        `}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow((s) => !s)}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors z-10"
        aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
      >
        <IconEye slash={show} />
      </button>
    </div>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({ label, htmlFor, error, errorId, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-xs font-semibold text-slate-500 uppercase tracking-widest"
      >
        {label}
      </label>
      {children}
      {error && (
        <p
          id={errorId}
          role="alert"
          className="flex items-center gap-1 text-xs text-red-500 font-medium"
        >
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

// ─── Requirement pill ─────────────────────────────────────────────────────────

function Req({ met, label }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium transition-colors duration-200
      ${met ? "text-emerald-600" : "text-slate-400"}`}
    >
      <span
        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0 transition-all duration-200
        ${met ? "bg-emerald-500 border-emerald-500" : "border-slate-300"}`}
      >
        {met && (
          <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
      {label}
    </span>
  );
}

// ─── Countdown redirect ───────────────────────────────────────────────────────

function CountdownRedirect({ seconds }) {
  return (
    <span className="inline-flex items-center gap-1 text-slate-400 text-sm">
      Redirigiendo en
      <span className="tabular-nums font-semibold text-slate-600">{seconds}s</span>…
    </span>
  );
}

// ─── Phases: idle | loading | success | expired | error ──────────────────────

// ─── Main component ───────────────────────────────────────────────────────────

const PasswordReset = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [phase, setPhase] = useState("idle"); // idle | loading | success | expired | error
  const [serverMsg, setServerMsg] = useState("");
  const [countdown, setCountdown] = useState(5);
  const firstInputRef = useRef(null);

  const [resetPassword] = useMutation(RESET_PASSWORD_MUTATION);

  // Sin token → redirigir
  useEffect(() => {
    if (!token) navigate("/autenticacion/iniciar-sesion", { replace: true });
    else firstInputRef.current?.focus();
  }, [token, navigate]);

  // Countdown after success
  useEffect(() => {
    if (phase !== "success") return;
    if (countdown <= 0) {
      navigate("/autenticacion/iniciar-sesion");
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown, navigate]);

  const strength = getStrength(newPassword);

  const validate = () => {
    const errs = {};
    if (!newPassword) {
      errs.newPassword = "La contraseña es requerida";
    } else if (newPassword.length < MIN_PASSWORD_LEN) {
      errs.newPassword = `Mínimo ${MIN_PASSWORD_LEN} caracteres`;
    }
    if (!confirmPassword) {
      errs.confirmPassword = "Confirmá tu contraseña";
    } else if (newPassword !== confirmPassword) {
      errs.confirmPassword = "Las contraseñas no coinciden";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setPhase("loading");
    setServerMsg("");

    try {
      await resetPassword({ variables: { token, newPassword } });
      setPhase("success");
    } catch (err) {
      const msg = err?.message?.replace("GraphQL error: ", "") || "";
      // Detectar si el error es de token expirado/inválido
      const isExpired = /inválido|expiró|expired|invalid/i.test(msg);
      setPhase(isExpired ? "expired" : "error");
      setServerMsg(msg || "Ocurrió un error. Intentá de nuevo.");
    }
  };

  const requirements = [
    { met: newPassword.length >= MIN_PASSWORD_LEN, label: `${MIN_PASSWORD_LEN}+ caracteres` },
    { met: /[A-Z]/.test(newPassword), label: "Mayúscula" },
    { met: /[0-9]/.test(newPassword), label: "Número" },
    { met: /[^A-Za-z0-9]/.test(newPassword), label: "Símbolo" },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-12">
      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Top accent */}
        <div className="h-1 w-full bg-gradient-to-r from-slate-800 via-slate-600 to-slate-400" />

        <div className="px-8 py-10">
          {/* Logo */}
          <Link to="/" className="inline-block mb-8">
            <img
              src={logoBcdb}
              alt="Banda CEDES Don Bosco"
              className="h-16 w-auto object-contain"
              loading="eager"
            />
          </Link>

          {/* ── SUCCESS ── */}
          {phase === "success" && (
            <div className="text-center animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5 text-emerald-500">
                <IconCheck />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">¡Listo!</h1>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">
                Tu contraseña fue cambiada con éxito. Ya podés iniciar sesión con tu nueva
                contraseña.
              </p>
              <CountdownRedirect seconds={countdown} />
              <button
                type="button"
                onClick={() => navigate("/autenticacion/iniciar-sesion")}
                className="mt-5 w-full py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold
                  hover:bg-slate-700 active:scale-[0.98] transition-all duration-150"
              >
                Ir a iniciar sesión
              </button>
            </div>
          )}

          {/* ── EXPIRED TOKEN ── */}
          {phase === "expired" && (
            <div className="text-center animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-5 text-amber-500">
                <IconWarning />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Enlace expirado</h1>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">
                Este enlace de recuperación ya no es válido. Los enlaces expiran a los 30 minutos
                por seguridad. Solicitá uno nuevo desde la pantalla de inicio de sesión.
              </p>
              <Link
                to="/autenticacion/iniciar-sesion"
                className="block w-full py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold text-center
                  hover:bg-slate-700 active:scale-[0.98] transition-all duration-150"
              >
                Volver al inicio de sesión
              </Link>
            </div>
          )}

          {/* ── FORM (idle | loading | error) ── */}
          {(phase === "idle" || phase === "loading" || phase === "error") && (
            <>
              <div className="mb-7">
                <h1 className="text-2xl font-bold text-slate-900 leading-tight">
                  Crear nueva contraseña
                </h1>
                <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
                  Elegí una contraseña segura que no hayas usado antes.
                </p>
              </div>

              {/* Server error banner */}
              {phase === "error" && serverMsg && (
                <div
                  role="alert"
                  className="mb-5 flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm animate-in fade-in slide-in-from-top-2 duration-200"
                >
                  <svg
                    className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {serverMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                {/* Nueva contraseña */}
                <Field
                  label="Nueva contraseña"
                  htmlFor="new-password"
                  error={errors.newPassword}
                  errorId="new-password-error"
                >
                  <PasswordInput
                    id="new-password"
                    placeholder="Mínimo 8 caracteres"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setErrors((p) => ({ ...p, newPassword: undefined }));
                    }}
                    disabled={phase === "loading"}
                    hasError={!!errors.newPassword}
                    describedBy="new-password-error new-password-strength"
                  />

                  {/* Strength bar */}
                  {newPassword && (
                    <div className="mt-2 space-y-1.5">
                      <div className="flex gap-1 h-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className={`flex-1 rounded-full transition-all duration-300
                              ${i <= strength.score ? strength.color : "bg-slate-100"}`}
                          />
                        ))}
                      </div>
                      <div id="new-password-strength" className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-x-3 gap-y-1">
                          {requirements.map((r) => (
                            <Req key={r.label} {...r} />
                          ))}
                        </div>
                        {strength.label && (
                          <span
                            className={`text-xs font-semibold ${strength.color.replace(
                              "bg-",
                              "text-"
                            )}`}
                          >
                            {strength.label}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </Field>

                {/* Confirmar contraseña */}
                <Field
                  label="Confirmar contraseña"
                  htmlFor="confirm-password"
                  error={errors.confirmPassword}
                  errorId="confirm-password-error"
                >
                  <PasswordInput
                    id="confirm-password"
                    placeholder="Repetí tu contraseña"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setErrors((p) => ({ ...p, confirmPassword: undefined }));
                    }}
                    disabled={phase === "loading"}
                    hasError={!!errors.confirmPassword}
                    describedBy="confirm-password-error"
                  />

                  {/* Match indicator */}
                  {confirmPassword && newPassword && !errors.confirmPassword && (
                    <span
                      className={`flex items-center gap-1 text-xs font-medium mt-0.5
                      ${newPassword === confirmPassword ? "text-emerald-600" : "text-slate-400"}`}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center
                        ${newPassword === confirmPassword ? "bg-emerald-500" : "bg-slate-200"}`}
                      >
                        {newPassword === confirmPassword && (
                          <svg
                            className="w-2 h-2 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </span>
                      {newPassword === confirmPassword
                        ? "Las contraseñas coinciden"
                        : "No coinciden aún"}
                    </span>
                  )}
                </Field>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={phase === "loading"}
                  className="mt-2 w-full flex items-center justify-center gap-2
                    py-3 px-4 rounded-xl bg-slate-900 text-white text-sm font-semibold
                    hover:bg-slate-700 active:scale-[0.98]
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all duration-150"
                >
                  {phase === "loading" ? (
                    <>
                      <IconSpinner /> Cambiando contraseña…
                    </>
                  ) : (
                    "Cambiar contraseña"
                  )}
                </button>

                <p className="text-center text-sm text-slate-400">
                  <Link
                    to="/autenticacion/iniciar-sesion"
                    className="hover:text-slate-700 transition-colors underline underline-offset-2"
                  >
                    Volver al inicio de sesión
                  </Link>
                </p>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <p className="mt-6 text-xs text-slate-400 text-center">
        © {new Date().getFullYear()} Banda CEDES Don Bosco
      </p>
    </div>
  );
};

export default PasswordReset;
