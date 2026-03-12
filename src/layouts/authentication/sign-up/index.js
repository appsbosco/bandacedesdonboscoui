/* eslint-disable react/prop-types */

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@apollo/client";
import { NEW_ACCOUNT } from "graphql/mutations";
import cover from "../../../assets/images/sign-up.webp";
import "../../../styles.css";
import "../../../main.css";
import logoBcdb from "../../../assets/images/logo-bcdb.webp";

// ── Constants ─────────────────────────────────────────────────────────────────

const ROLES = [
  "Integrante BCDB",
  "Principal de sección",
  "Asistente de sección",
  "Director",
  "Dirección Logística",
  "Staff",
  "Instructor Drumline",
  "Instructora Color Guard",
  "Instructora Danza",
  "Instructor de instrumento",
  "CEDES",
];
const INSTRUMENTS = [
  "No Aplica",
  "Flauta",
  "Clarinete",
  "Saxofón",
  "Trompeta",
  "Trombón",
  "Tuba",
  "Eufonio",
  "Corno Francés",
  "Mallets",
  "Percusión",
  "Color Guard",
  "Danza",
];
const GRADES = [
  "Tercero Primaria",
  "Cuarto Primaria",
  "Quinto Primaria",
  "Sexto Primaria",
  "Septimo",
  "Octavo",
  "Noveno",
  "Décimo",
  "Undécimo",
  "Duodécimo",
];
const STATES = ["Estudiante Activo", "Exalumno"];
const BAND_OPTIONS = [
  "Banda de marcha",
  "Banda de concierto elemental",
  "Banda de concierto inicial",
  "Banda de concierto intermedia",
  "Banda de concierto avanzada",
  "Big Band A",
  "Big Band B",
];

// ── Shared primitives (same as SignIn) ────────────────────────────────────────

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
function SelectInput({ children, ...props }) {
  return (
    <div className="relative">
      <select
        {...props}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 px-4 py-3 appearance-none cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:bg-white
          hover:border-slate-300 transition-all duration-150"
      >
        {children}
      </select>
      <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}

// ── Toast (same as SignIn) ────────────────────────────────────────────────────

function Toast({ type, message, onDismiss }) {
  if (!message) return null;
  const isSuccess = type === "success";
  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm font-medium
      ${
        isSuccess
          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
          : "bg-red-50 border-red-200 text-red-800"
      }`}
    >
      <div
        className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
          isSuccess ? "bg-emerald-500" : "bg-red-500"
        }`}
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

// ── Step progress bar ─────────────────────────────────────────────────────────

const STEP_LABELS = ["Cuenta", "Perfil", "Académico"];

function StepBar({ current }) {
  return (
    <div className="flex items-center mb-8">
      {STEP_LABELS.map((label, i) => (
        <div key={label} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
              ${
                i < current
                  ? "bg-emerald-500 text-white"
                  : i === current
                  ? "bg-slate-900 text-white ring-4 ring-slate-100"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              {i < current ? (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            <span
              className={`text-[10px] font-semibold mt-1.5 tracking-wide uppercase transition-colors
              ${
                i === current
                  ? "text-slate-900"
                  : i < current
                  ? "text-emerald-600"
                  : "text-slate-400"
              }`}
            >
              {label}
            </span>
          </div>
          {i < STEP_LABELS.length - 1 && (
            <div
              className={`flex-1 h-px mx-2 mb-4 transition-all duration-300 ${
                i < current ? "bg-emerald-400" : "bg-slate-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Password strength ─────────────────────────────────────────────────────────

function PasswordStrength({ password }) {
  if (!password) return null;
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ].filter(Boolean).length;

  const colors = ["bg-red-400", "bg-orange-400", "bg-amber-400", "bg-emerald-500"];
  const labels = ["Muy débil", "Débil", "Regular", "Fuerte"];
  const txts = ["text-red-500", "text-orange-500", "text-amber-600", "text-emerald-600"];

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`flex-1 h-0.5 rounded-full transition-all duration-300 ${
              i < score ? colors[score - 1] : "bg-slate-200"
            }`}
          />
        ))}
      </div>
      {score > 0 && (
        <p className={`text-[10px] font-semibold ${txts[score - 1]}`}>{labels[score - 1]}</p>
      )}
    </div>
  );
}

// ── Band pill ─────────────────────────────────────────────────────────────────

function BandPill({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all duration-150 active:scale-95
        ${
          selected
            ? "bg-slate-900 text-white border-slate-900"
            : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
        }`}
    >
      {label}
    </button>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

const IcoUser = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);
const IcoMail = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);
const IcoLock = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
    />
  </svg>
);
const IcoPhone = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
    />
  </svg>
);
const IcoCalendar = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);
const IcoCard = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0"
    />
  </svg>
);

// ── Main ──────────────────────────────────────────────────────────────────────

const SignUp = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isMusicianBCDB, setIsMusicianBCDB] = useState(null);
  const [selectedBands, setSelectedBands] = useState([]);

  // Per-step form state
  const [s0, setS0] = useState({
    name: "",
    firstSurName: "",
    secondSurName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [s1, setS1] = useState({ role: "", phone: "", birthday: "", state: "", instrument: "" });
  const [s2, setS2] = useState({ carnet: "", grade: "" });

  const [newUser] = useMutation(NEW_ACCOUNT);

  const showToast = (type, message, duration = 5000) => {
    setToast({ type, message });
    if (duration) setTimeout(() => setToast(null), duration);
  };

  const upd = (setter, field) => (e) => {
    setter((p) => ({ ...p, [field]: e.target.value }));
    setErrors((p) => ({ ...p, [field]: undefined }));
  };

  const toggleBand = (b) =>
    setSelectedBands((p) => (p.includes(b) ? p.filter((x) => x !== b) : [...p, b]));

  // ── Validations ──
  const validateStep0 = () => {
    const errs = {};
    if (!s0.name.trim()) errs.name = "Requerido";
    if (!s0.firstSurName.trim()) errs.firstSurName = "Requerido";
    if (!s0.secondSurName.trim()) errs.secondSurName = "Requerido";
    if (!s0.email.trim()) errs.email = "Requerido";
    else if (!/\S+@\S+\.\S+/.test(s0.email)) errs.email = "Email no válido";
    if (!s0.password) errs.password = "Requerido";
    else if (s0.password.length < 6) errs.password = "Mínimo 6 caracteres";
    if (!s0.confirmPassword) errs.confirmPassword = "Requerido";
    else if (s0.password !== s0.confirmPassword)
      errs.confirmPassword = "Las contraseñas no coinciden";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep1 = () => {
    const errs = {};
    if (!s1.role.trim()) errs.role = "Requerido";
    if (!s1.phone.trim()) errs.phone = "Requerido";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Submit handlers ──
  const handleStep0 = (e) => {
    e.preventDefault();
    if (validateStep0()) {
      setErrors({});
      setStep(1);
    }
  };

  const handleStep1 = (e) => {
    e.preventDefault();
    if (validateStep1()) {
      setErrors({});
      setStep(2);
    }
  };

  const handleStep2 = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { confirmPassword, ...rest0 } = s0;

    let formattedBirthday = "";
    if (s1.birthday) {
      const [y, m, d] = s1.birthday.split("-");
      formattedBirthday = `${d}/${m}/${y}`;
    }

    try {
      const { data } = await newUser({
        variables: {
          input: {
            ...rest0,
            role: s1.role,
            phone: s1.phone,
            state: s1.state,
            instrument: s1.instrument,
            birthday: formattedBirthday,
            carnet: s2.carnet,
            grade: s2.grade,
            bands: selectedBands,
          },
        },
      });
      showToast("success", `¡Cuenta creada! Bienvenido, ${data.newUser.name}. Redirigiendo…`);
      setTimeout(() => navigate("/autenticacion/iniciar-sesion"), 2500);
    } catch (err) {
      showToast("error", err.message.replace("GraphQL error: ", ""));
    } finally {
      setLoading(false);
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
        <div className="mb-7">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight leading-tight">
            Crear una cuenta
          </h1>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">
            Completá los tres pasos para unirte al sistema de la Banda CEDES Don Bosco.
          </p>
        </div>

        {/* Toast */}
        {toast && (
          <div className="mb-5">
            <Toast type={toast.type} message={toast.message} onDismiss={() => setToast(null)} />
          </div>
        )}

        <StepBar current={step} />

        {/* ══ Step 0: Cuenta ══ */}
        {step === 0 && (
          <form onSubmit={handleStep0} noValidate className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nombre completo" error={errors.name}>
                <TextInput
                  placeholder="Nombre completo"
                  value={s0.name}
                  onChange={upd(setS0, "name")}
                  icon={<IcoUser />}
                />
              </Field>
              <Field label="Primer apellido" error={errors.firstSurName}>
                <TextInput
                  placeholder="Primer apellido"
                  value={s0.firstSurName}
                  onChange={upd(setS0, "firstSurName")}
                  icon={<IcoUser />}
                />
              </Field>
            </div>

            <Field label="Segundo apellido" error={errors.secondSurName}>
              <TextInput
                placeholder="Segundo apellido"
                value={s0.secondSurName}
                onChange={upd(setS0, "secondSurName")}
                icon={<IcoUser />}
              />
            </Field>

            <Field label="Correo electrónico" error={errors.email}>
              <TextInput
                type="email"
                placeholder="tu@correo.com"
                autoComplete="email"
                value={s0.email}
                onChange={upd(setS0, "email")}
                icon={<IcoMail />}
              />
            </Field>

            <Field label="Contraseña" error={errors.password}>
              <TextInput
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={s0.password}
                onChange={upd(setS0, "password")}
                icon={<IcoLock />}
              />
              <PasswordStrength password={s0.password} />
            </Field>

            <Field label="Confirmar contraseña" error={errors.confirmPassword}>
              <TextInput
                type="password"
                placeholder="Repetí la contraseña"
                value={s0.confirmPassword}
                onChange={upd(setS0, "confirmPassword")}
                icon={<IcoLock />}
              />
            </Field>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-slate-900 text-white text-sm font-semibold
                hover:bg-slate-700 transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2 mt-1"
            >
              Continuar
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </form>
        )}

        {/* ══ Step 1: Perfil ══ */}
        {step === 1 && (
          <form onSubmit={handleStep1} noValidate className="space-y-4">
            {/* ¿Es músico BCDB? */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                ¿Sos músico de la BCDB?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {["Sí", "No"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setIsMusicianBCDB(opt === "Sí")}
                    className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition-all duration-150 active:scale-[0.98]
                      ${
                        isMusicianBCDB === (opt === "Sí")
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
                      }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {isMusicianBCDB === true && (
              <>
                <Field label="Estado">
                  <SelectInput value={s1.state} onChange={upd(setS1, "state")}>
                    <option value="">Seleccionar estado</option>
                    {STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </SelectInput>
                </Field>

                <Field label="Instrumento">
                  <SelectInput value={s1.instrument} onChange={upd(setS1, "instrument")}>
                    <option value="">Seleccionar instrumento</option>
                    {INSTRUMENTS.map((i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </SelectInput>
                </Field>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                    Bandas a las que pertenece
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {BAND_OPTIONS.map((b) => (
                      <BandPill
                        key={b}
                        label={b}
                        selected={selectedBands.includes(b)}
                        onClick={() => toggleBand(b)}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            <Field label="Rol" error={errors.role}>
              <SelectInput value={s1.role} onChange={upd(setS1, "role")}>
                <option value="">Seleccionar rol</option>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </SelectInput>
            </Field>

            <Field label="Número de celular" error={errors.phone}>
              <TextInput
                type="tel"
                placeholder="8888-8888"
                value={s1.phone}
                onChange={upd(setS1, "phone")}
                icon={<IcoPhone />}
              />
            </Field>

            <Field label="Fecha de nacimiento">
              <TextInput
                type="date"
                value={s1.birthday}
                onChange={upd(setS1, "birthday")}
                icon={<IcoCalendar />}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setErrors({});
                  setStep(0);
                }}
                className="py-3 px-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-700
                  hover:bg-slate-50 transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Atrás
              </button>
              <button
                type="submit"
                className="py-3 px-4 rounded-xl bg-slate-900 text-white text-sm font-semibold
                  hover:bg-slate-700 transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                Continuar
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </form>
        )}

        {/* ══ Step 2: Académico ══ */}
        {step === 2 && (
          <form onSubmit={handleStep2} noValidate className="space-y-4">
            {/* Info banner */}
            <div className="flex gap-2.5 items-start bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
              <svg
                className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-xs text-blue-700 leading-relaxed">
                Estos campos aplican solo para estudiantes activos del colegio. Podés finalizar el
                registro sin llenarlos.
              </p>
            </div>

            <Field label="Carnet institucional">
              <TextInput
                placeholder="Carnet del colegio"
                value={s2.carnet}
                onChange={upd(setS2, "carnet")}
                icon={<IcoCard />}
              />
            </Field>

            <Field label="Año académico">
              <SelectInput value={s2.grade} onChange={upd(setS2, "grade")}>
                <option value="">Seleccionar año</option>
                {GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </SelectInput>
            </Field>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setErrors({});
                  setStep(1);
                }}
                className="py-3 px-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-700
                  hover:bg-slate-50 transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Atrás
              </button>
              <button
                type="submit"
                disabled={loading}
                className="py-3 px-4 rounded-xl bg-slate-900 text-white text-sm font-semibold
                  hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed
                  transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2"
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
                    Creando cuenta…
                  </>
                ) : (
                  "Finalizar registro"
                )}
              </button>
            </div>
          </form>
        )}

        {/* Sign in link */}
        <p className="mt-8 text-sm text-slate-500 text-center">
          ¿Ya tenés cuenta?{" "}
          <Link
            to="/autenticacion/iniciar-sesion"
            className="font-semibold text-slate-900 hover:underline underline-offset-2"
          >
            Iniciar sesión
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
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-transparent" />

        {/* Stats */}
        <div className="absolute top-12 left-12 right-12">
          <div className="grid grid-cols-3 gap-3">
            {[
              ["280+", "Integrantes"],
              ["60+", "Años de historia"],
              ["5+", "Agrupaciones"],
            ].map(([num, label]) => (
              <div
                key={label}
                className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl p-3 text-center"
              >
                <p className="text-white text-lg font-bold leading-none">{num}</p>
                <p className="text-white/60 text-[10px] mt-1 font-medium leading-tight">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quote block */}
        <div className="relative z-10 flex flex-col justify-end p-12 pb-14">
          <div className="max-w-sm">
            <div className="w-8 h-0.5 bg-white/50 mb-5" />
            <p className="text-white text-xl font-medium leading-relaxed tracking-tight">
              Formamos músicos, forjamos personas para la vida.
            </p>
            <p className="mt-3 text-white/50 text-sm font-medium">— Banda CEDES Don Bosco</p>
          </div>
        </div>

        {/* Decorative dots */}
        <div className="absolute top-10 right-10 grid grid-cols-5 gap-1.5 opacity-20">
          {Array.from({ length: 25 }).map((_, i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-white" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SignUp;
