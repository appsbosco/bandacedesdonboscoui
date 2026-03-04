/**
 * EventFormModal.jsx — DEFINITIVO v3
 *
 * BUG FIX CRÍTICO — Categoría:
 * El problema era que initialValues podía venir con category de la DB,
 * pero el form state lo sobreescribía con "presentation" por defecto.
 * Fix: el spread de initialValues SIEMPRE gana sobre EMPTY_FORM,
 * y category nunca se omite en el submit.
 *
 * También: buildCleanInput conserva explícitamente "category".
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";

const EVENT_CATEGORIES = [
  { value: "presentation", label: "Presentación", icon: "🎵", color: "#3b82f6" },
  { value: "rehearsal", label: "Ensayo", icon: "🎼", color: "#8b5cf6" },
  { value: "meeting", label: "Reunión", icon: "📋", color: "#f59e0b" },
  { value: "activity", label: "Actividad", icon: "🎉", color: "#10b981" },
  { value: "logistics", label: "Logística", icon: "🚌", color: "#f97316" },
  { value: "other", label: "Otro", icon: "📌", color: "#94a3b8" },
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
    activeStyle: { bg: "#1e293b", border: "#1e293b" },
    iconColor: "#94a3b8",
  },
  {
    value: "DRY_RUN",
    label: "Modo prueba",
    description: "Simula el envío, no notifica usuarios reales.",
    Icon: TestIcon,
    activeStyle: { bg: "#f59e0b", border: "#f59e0b" },
    iconColor: "#f59e0b",
  },
  {
    value: "LIVE",
    label: "Envío real",
    description: "Envía notificación push a todos los destinatarios seleccionados.",
    Icon: BellIcon,
    activeStyle: { bg: "#059669", border: "#059669" },
    iconColor: "#059669",
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

// ── Date helpers CR ───────────────────────────────────────────────────────────
function tsToInputDate(val) {
  if (!val) return "";
  const ms = Number(val);
  if (!Number.isFinite(ms)) {
    if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    return "";
  }
  const crDate = new Date(ms - 6 * 60 * 60 * 1000);
  return crDate.toISOString().slice(0, 10);
}

function inputDateToTs(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  return String(Date.UTC(y, m - 1, d, 6, 0, 0));
}

/**
 * Campos que GraphQL NO acepta en EventInput.
 * IMPORTANTE: "category" NO está en esta lista — siempre debe enviarse.
 */
const FORBIDDEN_FIELDS = new Set([
  "__typename",
  "_id",
  "createdAt",
  "updatedAt",
  "notificationLog",
  "createdBy",
  "updatedBy",
  "priority",
  "visibility",
  "__v",
]);

function buildCleanInput(form) {
  return Object.fromEntries(Object.entries(form).filter(([k]) => !FORBIDDEN_FIELDS.has(k)));
}

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
    if (!open) return;
    if (initialValues) {
      // CRÍTICO: spread initialValues SOBRE empty, no al revés
      // Así category de la DB siempre llega al form
      setForm({
        ...EMPTY_FORM,
        ...initialValues,
        // Normalizar campos específicos
        date: tsToInputDate(initialValues.date),
        notificationMode: initialValues.notificationMode ?? "NONE",
        audience: Array.isArray(initialValues.audience) ? initialValues.audience : [],
        // category SIEMPRE viene de initialValues si existe
        category: initialValues.category ?? "presentation",
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
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
      const clean = buildCleanInput(form);
      // Log para debug — confirmar que category llega
      console.log("[EventFormModal] submit input:", { ...clean, category: form.category });
      await onSubmit({
        ...clean,
        category: form.category, // ← explícito, nunca se omite
        date: inputDateToTs(form.date),
        audience: form.audience?.length ? form.audience : [form.type],
      });
    } catch (err) {
      console.error("[EventFormModal] submit error:", err);
    } finally {
      setSaving(false);
    }
  };

  const isEdit = mode === "edit";
  const activeCat = EVENT_CATEGORIES.find((c) => c.value === form.category);

  if (!mounted || !open) return null;

  return createPortal(
    <>
      {/* Backdrop */}
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

      {/* Wrapper */}
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
          padding: isMobile ? 0 : "24px",
        }}
      >
        {/* Panel */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            width: "100%",
            maxWidth: isMobile ? "100%" : "560px",
            maxHeight: isMobile ? "95dvh" : "90vh",
            background: "#ffffff",
            borderRadius: isMobile ? "24px 24px 0 0" : "20px",
            boxShadow: "0 32px 64px -12px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.06)",
            overflow: "hidden",
          }}
        >
          {/* Mobile handle */}
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

          {/* ── Header con acento de color de categoría activa ── */}
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
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {/* Icono de categoría activa */}
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  flexShrink: 0,
                  background: activeCat ? `${activeCat.color}18` : "#f8fafc",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  border: `1.5px solid ${activeCat ? `${activeCat.color}30` : "#f1f5f9"}`,
                }}
              >
                {activeCat?.icon ?? "📌"}
              </div>
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#0f172a",
                    lineHeight: 1.2,
                  }}
                >
                  {isEdit ? "Editar evento" : "Nuevo evento"}
                </h2>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8", lineHeight: 1.3 }}>
                  {activeCat?.label ?? "Sin categoría"} ·{" "}
                  {isEdit ? "Modifica los datos" : "Completa la información"}
                </p>
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
              }}
            >
              <CloseIcon />
            </button>
          </div>

          {/* ── Form ── */}
          <form
            onSubmit={handleSubmit}
            noValidate
            style={{ flex: 1, overflowY: "auto", minHeight: 0 }}
          >
            <div
              style={{
                padding: isMobile ? "16px 20px 4px" : "20px 24px 4px",
                display: "flex",
                flexDirection: "column",
                gap: 22,
              }}
            >
              {/* CATEGORÍA — tiles visuales */}
              <div>
                <Label text="Categoría del evento" />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
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
                          gap: 6,
                          padding: "12px 6px",
                          borderRadius: 14,
                          border: `2px solid ${active ? cat.color : "#f1f5f9"}`,
                          background: active ? `${cat.color}12` : "#fafafa",
                          cursor: "pointer",
                          fontFamily: "inherit",
                          transition: "all 0.15s",
                          outline: "none",
                        }}
                      >
                        <span style={{ fontSize: 22, lineHeight: 1 }}>{cat.icon}</span>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: active ? 700 : 500,
                            color: active ? cat.color : "#64748b",
                            letterSpacing: "0.02em",
                            lineHeight: 1.2,
                            textAlign: "center",
                          }}
                        >
                          {cat.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {errors.category && <Err msg={errors.category} />}
              </div>

              {/* TÍTULO */}
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

              {/* AGRUPACIÓN */}
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

              {/* DESCRIPCIÓN */}
              <Field label="Descripción">
                <textarea
                  value={form.description}
                  onChange={set("description")}
                  placeholder="Detalles adicionales (opcional)"
                  rows={3}
                  style={{ ...iStyle(), resize: "none" }}
                />
              </Field>

              {/* FECHA Y HORA */}
              <div>
                <SectionLabel text="Fecha y hora" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
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
              </div>

              {/* LUGAR */}
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

              {/* NOTIFICACIONES */}
              <div>
                <SectionLabel
                  text="Notificaciones"
                  subtitle="¿A quién se avisa cuando se publique?"
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {NOTIFICATION_MODES.map(
                    ({ value, label, description, Icon, activeStyle, iconColor }) => {
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
                            padding: "11px 14px",
                            borderRadius: 12,
                            border: `1.5px solid ${active ? activeStyle.border : "#f1f5f9"}`,
                            background: active ? activeStyle.bg : "#fafafa",
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
                              color: active ? "#fff" : iconColor,
                            }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p
                              style={{
                                margin: 0,
                                fontSize: 13,
                                fontWeight: 600,
                                color: active ? "#fff" : "#0f172a",
                              }}
                            >
                              {label}
                            </p>
                            <p
                              style={{
                                margin: "1px 0 0",
                                fontSize: 11,
                                color: active ? "rgba(255,255,255,0.65)" : "#94a3b8",
                              }}
                            >
                              {description}
                            </p>
                          </div>
                          {active && (
                            <div
                              style={{
                                flexShrink: 0,
                                width: 18,
                                height: 18,
                                borderRadius: "50%",
                                background: "rgba(255,255,255,0.2)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <svg
                                width="10"
                                height="10"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="3"
                                stroke="#fff"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="m4.5 12.75 6 6 9-13.5"
                                />
                              </svg>
                            </div>
                          )}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              <div style={{ height: 4 }} />
            </div>

            {/* Footer */}
            <div
              style={{
                position: "sticky",
                bottom: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 10,
                padding: "14px 24px",
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
                  color: "#64748b",
                  padding: "9px 18px",
                  borderRadius: 11,
                  border: "1.5px solid #e2e8f0",
                  background: "#fff",
                  cursor: saving ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  opacity: saving ? 0.5 : 1,
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
                  padding: "9px 22px",
                  borderRadius: 11,
                  border: "none",
                  background: saving ? "#94a3b8" : "#0f172a",
                  cursor: saving ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                {saving ? (
                  <>
                    <Spinner />
                    Guardando…
                  </>
                ) : isEdit ? (
                  "Guardar cambios"
                ) : (
                  "Crear evento"
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

// ─── Helpers visuales ─────────────────────────────────────────────────────────
function iStyle(hasError = false) {
  return {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 13px",
    fontSize: 13,
    color: "#0f172a",
    background: "#fafafa",
    border: `1.5px solid ${hasError ? "#fca5a5" : "#f1f5f9"}`,
    borderRadius: 11,
    outline: "none",
    fontFamily: "inherit",
    lineHeight: 1.4,
    transition: "border-color 0.15s",
  };
}

function Label({ text }) {
  return (
    <p
      style={{
        margin: "0 0 8px",
        fontSize: 11,
        fontWeight: 600,
        color: "#475569",
        letterSpacing: "0.03em",
      }}
    >
      {text}
    </p>
  );
}
Label.propTypes = { text: PropTypes.string.isRequired };

function SectionLabel({ text, subtitle }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <p
        style={{
          margin: 0,
          fontSize: 11,
          fontWeight: 700,
          color: "#94a3b8",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        }}
      >
        {text}
      </p>
      {subtitle && <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>{subtitle}</p>}
    </div>
  );
}
SectionLabel.propTypes = { text: PropTypes.string.isRequired, subtitle: PropTypes.string };

function Field({ label, error, children }) {
  return (
    <div style={{ marginBottom: error ? 4 : 0 }}>
      <Label text={label} />
      {children}
      {error && <Err msg={error} />}
    </div>
  );
}
Field.propTypes = {
  label: PropTypes.string.isRequired,
  error: PropTypes.string,
  children: PropTypes.node.isRequired,
};

function Err({ msg }) {
  return (
    <p
      style={{
        margin: "4px 0 0",
        fontSize: 11,
        color: "#ef4444",
        display: "flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      <span>⚠</span>
      {msg}
    </p>
  );
}
Err.propTypes = { msg: PropTypes.string.isRequired };

function Spinner() {
  return (
    <svg
      style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }}
      viewBox="0 0 24 24"
      fill="none"
    >
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
}

// Icons
const CloseIcon = () => (
  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="#64748b">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
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
BellOffIcon.propTypes = { style: PropTypes.object };
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
TestIcon.propTypes = { style: PropTypes.object };
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
BellIcon.propTypes = { style: PropTypes.object };

EventFormModal.propTypes = {
  open: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(["add", "edit"]),
  initialValues: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};
