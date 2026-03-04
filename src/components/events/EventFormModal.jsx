/**
 * EventFormModal.jsx
 *
 * PROBLEMA RAÍZ DETECTADO EN SCREENSHOT:
 * DashboardLayout usa CSS `transform` en un contenedor ancestro.
 * Esto crea un nuevo "containing block" para position:fixed, lo que
 * hace que el modal se renderice inline en el flujo del documento
 * en lugar de cubrir toda la pantalla.
 *
 * SOLUCIÓN DEFINITIVA: ReactDOM.createPortal → monta el modal
 * directamente en document.body, escapando cualquier transform/overflow
 * del layout padre.
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";

// ─── Constants ────────────────────────────────────────────────────────────────
const EVENT_CATEGORIES = [
  { value: "presentation", label: "Presentación", icon: "🎵" },
  { value: "rehearsal", label: "Ensayo", icon: "🎼" },
  { value: "meeting", label: "Reunión", icon: "📋" },
  { value: "activity", label: "Actividad", icon: "🎉" },
  { value: "logistics", label: "Logística", icon: "🚌" },
  { value: "other", label: "Otro", icon: "📌" },
];

const BANDS = [
  "Banda de concierto avanzada",
  "Banda de concierto elemental",
  "Banda de concierto inicial",
  "Banda de concierto intermedia",
  "Banda de marcha",
  "Big Band A",
  "Big Band B",
  "Staff",
  "Padres de familia",
  "Todos",
];

const NOTIFICATION_MODES = [
  {
    value: "NONE",
    label: "Sin notificación",
    description: "No envía ninguna notificación.",
    Icon: BellOffIcon,
    activeStyle: { background: "#1e293b", borderColor: "#1e293b" },
    inactiveIconColor: "#94a3b8",
  },
  {
    value: "DRY_RUN",
    label: "Modo prueba",
    description: "Simula el envío, guarda el payload, no notifica usuarios reales.",
    Icon: TestIcon,
    activeStyle: { background: "#f59e0b", borderColor: "#f59e0b" },
    inactiveIconColor: "#f59e0b",
  },
  {
    value: "LIVE",
    label: "Envío real",
    description: "Envía notificación push a todos los destinatarios.",
    Icon: BellIcon,
    activeStyle: { background: "#059669", borderColor: "#059669" },
    inactiveIconColor: "#059669",
  },
];

const EMPTY_FORM = {
  title: "",
  category: "presentation",
  type: "",
  place: "",
  date: "",
  time: "",
  departure: "",
  arrival: "",
  description: "",
  notificationMode: "NONE",
  audience: [],
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function EventFormModal({ open, mode, initialValues, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
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
    if (open) {
      setForm(
        initialValues
          ? {
              ...EMPTY_FORM,
              ...initialValues,
              date: toInputDate(initialValues.date),
              notificationMode: initialValues.notificationMode ?? "NONE",
            }
          : EMPTY_FORM
      );
      setErrors({});
    }
  }, [open, initialValues]);

  useEffect(() => {
    if (!mounted) return;
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, mounted]);

  const set = (field) => (e) => {
    const value = e?.target !== undefined ? e.target.value : e;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "El título es requerido";
    if (!form.date) e.date = "La fecha es requerida";
    if (!form.type) e.type = "La agrupación es requerida";
    if (!form.category) e.category = "La categoría es requerida";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await onSubmit({
        ...form,
        date: String(new Date(form.date).getTime()),
        audience: form.audience.length ? form.audience : [form.type],
      });
    } catch (err) {
      console.error("[EventFormModal]", err);
    } finally {
      setSaving(false);
    }
  };

  const isEdit = mode === "edit";

  if (!mounted || !open) return null;

  // ─────────────────────────────────────────────────────────────────────────
  // Portal: renderizado directamente en document.body
  // Esto es lo que resuelve el problema del DashboardLayout con transform
  // ─────────────────────────────────────────────────────────────────────────
  return createPortal(
    <>
      {/* ── Backdrop ─────────────────────────────────────────────────────── */}
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          background: "rgba(15,23,42,0.5)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }}
      />

      {/* ── Centering wrapper ─────────────────────────────────────────────── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? "Editar evento" : "Nuevo evento"}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          alignItems: isMobile ? "flex-end" : "center",
          justifyContent: "center",
          padding: isMobile ? 0 : "16px",
        }}
      >
        {/* ── Panel ──────────────────────────────────────────────────────── */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            background: "#ffffff",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.05)",
            width: "100%",
            maxWidth: isMobile ? "100%" : "540px",
            maxHeight: isMobile ? "95dvh" : "88vh",
            borderRadius: isMobile ? "20px 20px 0 0" : "16px",
            overflow: "hidden",
          }}
        >
          {/* Drag handle — mobile only */}
          {isMobile && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "12px 0 6px",
                flexShrink: 0,
              }}
            >
              <div style={{ width: 36, height: 4, borderRadius: 9999, background: "#cbd5e1" }} />
            </div>
          )}

          {/* ── Header ─────────────────────────────────────────────────── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 20px",
              borderBottom: "1px solid #f1f5f9",
              flexShrink: 0,
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#0f172a",
                  lineHeight: 1.25,
                }}
              >
                {isEdit ? "Editar evento" : "Nuevo evento"}
              </h2>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: "#94a3b8", lineHeight: 1.3 }}>
                {isEdit ? "Modifica los datos del evento" : "Completa la información del evento"}
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Cerrar"
              style={{
                marginLeft: 12,
                flexShrink: 0,
                width: 32,
                height: 32,
                borderRadius: 8,
                border: "none",
                background: "#f1f5f9",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CloseIcon />
            </button>
          </div>

          {/* ── Scrollable form ─────────────────────────────────────────── */}
          <form
            onSubmit={handleSubmit}
            noValidate
            style={{ flex: 1, overflowY: "auto", minHeight: 0 }}
          >
            <div
              style={{
                padding: "20px 20px 4px",
                display: "flex",
                flexDirection: "column",
                gap: 24,
              }}
            >
              {/* SECTION: General */}
              <section>
                <SectionHeading title="Información general" />

                {/* Category tiles */}
                <div style={{ marginBottom: 16 }}>
                  <FieldLabel text="Categoría" />
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: 8,
                    }}
                  >
                    {EVENT_CATEGORIES.map((cat) => {
                      const active = form.category === cat.value;
                      return (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => set("category")(cat.value)}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 5,
                            padding: "10px 4px",
                            borderRadius: 12,
                            border: `1.5px solid ${active ? "#0f172a" : "#e2e8f0"}`,
                            background: active ? "#0f172a" : "#ffffff",
                            color: active ? "#ffffff" : "#475569",
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.12s",
                            fontFamily: "inherit",
                          }}
                        >
                          <span style={{ fontSize: 20, lineHeight: 1 }}>{cat.icon}</span>
                          <span style={{ lineHeight: 1.2, textAlign: "center" }}>{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  {errors.category && <FieldError msg={errors.category} />}
                </div>

                <Field label="Título *" error={errors.title}>
                  <input
                    type="text"
                    value={form.title}
                    onChange={set("title")}
                    placeholder="Ej. Festival de Navidad 2026"
                    style={iStyle(!!errors.title)}
                    autoComplete="off"
                  />
                </Field>

                <Field label="Agrupación *" error={errors.type}>
                  <select value={form.type} onChange={set("type")} style={iStyle(!!errors.type)}>
                    <option value="">Seleccionar agrupación…</option>
                    {BANDS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Descripción">
                  <textarea
                    value={form.description}
                    onChange={set("description")}
                    placeholder="Descripción del evento (opcional)"
                    rows={3}
                    style={{ ...iStyle(), resize: "none" }}
                  />
                </Field>
              </section>

              {/* SECTION: Date & Time */}
              <section>
                <SectionHeading title="Fecha y hora" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Field label="Fecha *" error={errors.date}>
                    <input
                      type="date"
                      value={form.date}
                      onChange={set("date")}
                      style={iStyle(!!errors.date)}
                    />
                  </Field>
                  <Field label="Hora del evento">
                    <input type="time" value={form.time} onChange={set("time")} style={iStyle()} />
                  </Field>
                  <Field label="Salida de CEDES">
                    <input
                      type="time"
                      value={form.departure}
                      onChange={set("departure")}
                      style={iStyle()}
                    />
                  </Field>
                  <Field label="Llegada aprox. a CEDES">
                    <input
                      type="time"
                      value={form.arrival}
                      onChange={set("arrival")}
                      style={iStyle()}
                    />
                  </Field>
                </div>
              </section>

              {/* SECTION: Location */}
              <section>
                <SectionHeading title="Ubicación" />
                <Field label="Lugar">
                  <input
                    type="text"
                    value={form.place}
                    onChange={set("place")}
                    placeholder="Ej. Teatro Nacional, San José"
                    style={iStyle()}
                    autoComplete="off"
                  />
                </Field>
              </section>

              {/* SECTION: Notifications */}
              <section>
                <SectionHeading
                  title="Notificaciones push"
                  subtitle="Decide si se envían notificaciones y cómo"
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {NOTIFICATION_MODES.map(
                    ({ value, label, description, Icon, activeStyle, inactiveIconColor }) => {
                      const active = form.notificationMode === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => set("notificationMode")(value)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: "12px 14px",
                            borderRadius: 12,
                            border: `1.5px solid ${active ? activeStyle.borderColor : "#e2e8f0"}`,
                            background: active ? activeStyle.background : "#ffffff",
                            cursor: "pointer",
                            textAlign: "left",
                            width: "100%",
                            fontFamily: "inherit",
                            transition: "all 0.12s",
                          }}
                        >
                          <Icon
                            style={{
                              width: 16,
                              height: 16,
                              flexShrink: 0,
                              color: active ? "#ffffff" : inactiveIconColor,
                            }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p
                              style={{
                                margin: 0,
                                fontSize: 13,
                                fontWeight: 600,
                                color: active ? "#ffffff" : "#0f172a",
                                lineHeight: 1.3,
                              }}
                            >
                              {label}
                            </p>
                            <p
                              style={{
                                margin: "2px 0 0",
                                fontSize: 11,
                                color: active ? "rgba(255,255,255,0.7)" : "#94a3b8",
                                lineHeight: 1.4,
                              }}
                            >
                              {description}
                            </p>
                          </div>
                          {active && (
                            <div
                              style={{
                                flexShrink: 0,
                                width: 20,
                                height: 20,
                                borderRadius: "50%",
                                background: "rgba(255,255,255,0.2)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <CheckIcon style={{ width: 11, height: 11, color: "#ffffff" }} />
                            </div>
                          )}
                        </button>
                      );
                    }
                  )}
                </div>

                {form.notificationMode === "DRY_RUN" && (
                  <NoticeBox
                    color={{ bg: "#fffbeb", border: "#fde68a", text: "#92400e", icon: "#d97706" }}
                  >
                    <strong>Modo prueba activo:</strong> El sistema guardará el payload y la
                    audiencia esperada, pero no enviará ninguna notificación real.
                  </NoticeBox>
                )}
                {form.notificationMode === "LIVE" && (
                  <NoticeBox
                    color={{ bg: "#ecfdf5", border: "#6ee7b7", text: "#065f46", icon: "#059669" }}
                  >
                    <strong>Envío real activado:</strong> Se enviará una notificación push a todos
                    los miembros de <strong>{form.type || "la agrupación seleccionada"}</strong>.
                  </NoticeBox>
                )}
              </section>

              {/* bottom padding so last section isn't hidden by sticky footer */}
              <div style={{ height: 4 }} />
            </div>

            {/* ── Sticky footer ──────────────────────────────────────────── */}
            <div
              style={{
                position: "sticky",
                bottom: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "14px 20px",
                background: "#ffffff",
                borderTop: "1px solid #f1f5f9",
              }}
            >
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#475569",
                  padding: "10px 18px",
                  borderRadius: 12,
                  border: "1.5px solid #e2e8f0",
                  background: "#ffffff",
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.5 : 1,
                  fontFamily: "inherit",
                  transition: "all 0.12s",
                }}
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={saving}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#ffffff",
                  padding: "10px 22px",
                  borderRadius: 12,
                  border: "none",
                  background: saving ? "#94a3b8" : "#0f172a",
                  cursor: saving ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.12s",
                }}
              >
                {saving ? (
                  <>
                    <SpinnerIcon
                      style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }}
                    />
                    Guardando…
                  </>
                ) : (
                  <>
                    <CheckIcon style={{ width: 14, height: 14, color: "#ffffff" }} />
                    {isEdit ? "Guardar cambios" : "Crear evento"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </>,
    document.body
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeading({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <h3
        style={{
          margin: 0,
          fontSize: 10,
          fontWeight: 700,
          color: "#94a3b8",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        }}
      >
        {title}
      </h3>
      {subtitle && <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>{subtitle}</p>}
    </div>
  );
}

function FieldLabel({ text }) {
  return (
    <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 600, color: "#475569" }}>{text}</p>
  );
}

function Field({ label, error, children }) {
  return (
    <div style={{ marginBottom: error ? 4 : 12 }}>
      <label
        style={{
          display: "block",
          fontSize: 11,
          fontWeight: 600,
          color: "#475569",
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      {children}
      {error && <FieldError msg={error} />}
    </div>
  );
}

function FieldError({ msg }) {
  return (
    <p
      style={{
        margin: "4px 0 8px",
        fontSize: 11,
        color: "#ef4444",
        display: "flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      <span>⚠</span> {msg}
    </p>
  );
}

function NoticeBox({ color, children }) {
  return (
    <div
      style={{
        marginTop: 12,
        display: "flex",
        gap: 10,
        padding: "12px 14px",
        borderRadius: 12,
        border: `1px solid ${color.border}`,
        background: color.bg,
      }}
    >
      <InfoIcon style={{ width: 13, height: 13, color: color.icon, flexShrink: 0, marginTop: 1 }} />
      <p style={{ margin: 0, fontSize: 11, color: color.text, lineHeight: 1.5 }}>{children}</p>
    </div>
  );
}

// ─── Input style helper ───────────────────────────────────────────────────────
function iStyle(hasError = false) {
  return {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 14px",
    fontSize: 13,
    color: "#0f172a",
    background: "#ffffff",
    border: `1.5px solid ${hasError ? "#fca5a5" : "#e2e8f0"}`,
    borderRadius: 12,
    outline: "none",
    fontFamily: "inherit",
    transition: "border-color 0.15s",
    lineHeight: 1.4,
  };
}

function toInputDate(dateVal) {
  if (!dateVal) return "";
  const n = Number(dateVal);
  if (Number.isFinite(n)) return new Date(n).toISOString().slice(0, 10);
  if (typeof dateVal === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) return dateVal;
  return "";
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const CloseIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="#64748b">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

const CheckIcon = ({ style }) => (
  <svg style={style} fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
  </svg>
);

const SpinnerIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none">
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
      style={{ opacity: 0.25 }}
    />
    <path
      fill="currentColor"
      style={{ opacity: 0.75 }}
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
);

const InfoIcon = ({ style }) => (
  <svg style={style} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
    />
  </svg>
);

function BellOffIcon({ style }) {
  return (
    <svg style={style} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.143 17.082a24.248 24.248 0 0 0 3.844.148m-3.844-.148a23.856 23.856 0 0 1-5.455-1.31 8.964 8.964 0 0 0 2.3-5.542m3.155 6.852a3 3 0 0 0 5.667 1.97m1.965-2.277L5 5m14.5 14.5L5 5"
      />
    </svg>
  );
}

function TestIcon({ style }) {
  return (
    <svg style={style} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15m-6.55-11.896c.251.023.501.05.75.082M19.8 15l-1.573 1.573A2.25 2.25 0 0 1 16.636 17H7.364a2.25 2.25 0 0 1-1.591-.659L4.2 15m15.6 0-3.573-3.573"
      />
    </svg>
  );
}

function BellIcon({ style }) {
  return (
    <svg style={style} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
      />
    </svg>
  );
}

// PropTypes

// ─── PropTypes ────────────────────────────────────────────────────────────────
EventFormModal.propTypes = {
  open: PropTypes.bool.isRequired,
  mode: PropTypes.string,
  initialValues: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};
// ─── Sub-component PropTypes ────────────────────────────────────────────────

SectionHeading.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
};

FieldLabel.propTypes = {
  text: PropTypes.string.isRequired,
};

Field.propTypes = {
  label: PropTypes.string.isRequired,
  error: PropTypes.string,
  children: PropTypes.node.isRequired,
};

FieldError.propTypes = {
  msg: PropTypes.string.isRequired,
};

NoticeBox.propTypes = {
  color: PropTypes.shape({
    bg: PropTypes.string.isRequired,
    border: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
  }).isRequired,
  children: PropTypes.node.isRequired,
};

CheckIcon.propTypes = {
  style: PropTypes.object,
};

SpinnerIcon.propTypes = {
  style: PropTypes.object,
};

InfoIcon.propTypes = {
  style: PropTypes.object,
};

BellOffIcon.propTypes = {
  style: PropTypes.object,
};

TestIcon.propTypes = {
  style: PropTypes.object,
};

BellIcon.propTypes = {
  style: PropTypes.object,
};
