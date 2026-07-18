import PropTypes from "prop-types";
import { useEffect, useState } from "react";

const USER_FIELDS = [
  { name: "name", label: "Nombre", required: true },
  { name: "firstSurName", label: "Primer apellido", required: true },
  { name: "secondSurName", label: "Segundo apellido", required: true },
  { name: "birthday", label: "Fecha de nacimiento", type: "date" },
  { name: "carnet", label: "Carnet" },
  { name: "phone", label: "Celular", required: true, type: "tel" },
];

const PARENT_FIELDS = [
  { name: "name", label: "Nombre", required: true },
  { name: "firstSurName", label: "Primer apellido", required: true },
  { name: "secondSurName", label: "Segundo apellido", required: true },
  { name: "phone", label: "Celular", required: true, type: "tel" },
];

const REQUIRED_FIELDS = ["name", "firstSurName", "secondSurName", "phone"];

const USER_ROLES = [
  "Admin",
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

function normalizeDate(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function buildInitialValues(profile, fields) {
  const values = fields.reduce((acc, field) => {
    const value = profile?.[field.name] || "";
    acc[field.name] = field.type === "date" ? normalizeDate(value) : value;
    return acc;
  }, {});

  if (profile?.role) values.role = profile.role;
  return values;
}

export default function ProfileEditModal({
  open,
  accountType,
  profile,
  canManageRole,
  loading,
  error,
  successMessage,
  onClose,
  onSubmit,
}) {
  const fields = accountType === "parent" ? PARENT_FIELDS : USER_FIELDS;
  const [values, setValues] = useState(() => buildInitialValues(profile, fields));
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (open) {
      setValues(buildInitialValues(profile, fields));
      setFormError("");
    }
  }, [fields, open, profile]);

  if (!open) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = fields.reduce((acc, field) => {
      acc[field.name] = typeof values[field.name] === "string"
        ? values[field.name].trim()
        : values[field.name];
      return acc;
    }, {});

    if (accountType === "user" && canManageRole) {
      payload.role = values.role;
    }

    const missing = REQUIRED_FIELDS.some((field) => !payload[field]);
    if (missing) {
      setFormError("Nombre, apellidos y celular son requeridos.");
      return;
    }

    setFormError("");
    await onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center px-4 py-6">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        aria-label="Cerrar edición de información personal"
        onClick={loading ? undefined : onClose}
      />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Editar información general</h2>
            <p className="mt-1 text-sm text-slate-500">
              El correo y los datos administrativos se mantienen como solo lectura.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="ml-4 flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            aria-label="Cerrar"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
          <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Email
            </span>
            <p className="mt-1 text-sm font-medium text-slate-700">{profile?.email || "N/A"}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <label key={field.name} className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  {field.label}
                  {field.required && <span className="ml-1 text-red-500">*</span>}
                </span>
                <input
                  type={field.type || "text"}
                  name={field.name}
                  value={values[field.name] || ""}
                  onChange={handleChange}
                  disabled={loading}
                  className="block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-700 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
                />
              </label>
            ))}
          </div>

          {accountType === "user" && canManageRole && (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50/70 p-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-800">
                  Rol de la plataforma
                </span>
                <select
                  name="role"
                  value={values.role || "Admin"}
                  onChange={handleChange}
                  disabled={loading}
                  className="block w-full rounded-xl border border-amber-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:bg-slate-50 disabled:text-slate-400"
                >
                  {USER_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </label>
              <p className="mt-2 text-xs leading-relaxed text-amber-800">
                Este cambio modifica los permisos y las secciones disponibles en tu cuenta. La
                opción Admin te permite regresar al acceso administrativo completo.
              </p>
            </div>
          )}

          {(formError || error) && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {formError || error}
            </div>
          )}
          {successMessage && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {successMessage}
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading && (
              <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            )}
            Guardar cambios
          </button>
        </div>
      </form>
    </div>
  );
}

ProfileEditModal.propTypes = {
  open: PropTypes.bool.isRequired,
  accountType: PropTypes.oneOf(["user", "parent"]).isRequired,
  profile: PropTypes.object,
  canManageRole: PropTypes.bool,
  loading: PropTypes.bool,
  error: PropTypes.string,
  successMessage: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

ProfileEditModal.defaultProps = {
  profile: null,
  canManageRole: false,
  loading: false,
  error: "",
  successMessage: "",
};
