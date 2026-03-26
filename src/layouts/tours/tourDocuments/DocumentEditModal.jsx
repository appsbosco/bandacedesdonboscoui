/* eslint-disable react/prop-types */
/**
 * DocumentEditModal — edición documental de un participante.
 * Para participantes vinculados, passport / visa / permiso llegan sincronizados
 * desde Documents y acá solo se permiten notas.
 *
 * FIXES:
 * - Fechas en formato dd/mm/yyyy con inputs separados (evita bug del mes 24)
 * - Toggle con estilos inline para evitar problemas de Tailwind JIT
 * - Permiso de salida oculto para mayores de edad
 */
import { useState, useEffect } from "react";
import { getAgeAtDate } from "../utils/tourAgeRules";

// ── Date helpers ──────────────────────────────────────────────────────────────

/**
 * Parse ISO string → { day, month, year } strings for the three separate inputs.
 * Uses UTC to avoid timezone-shift bugs.
 */
function isoToParts(isoString) {
  if (!isoString) return { day: "", month: "", year: "" };
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return { day: "", month: "", year: "" };
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = String(d.getUTCFullYear());
  return { day, month, year };
}

/**
 * Build ISO string from parts. Returns null if incomplete or invalid.
 * Validates that day/month/year form a real calendar date.
 */
function partsToIso({ day, month, year }) {
  if (!day || !month || !year || year.length < 4) return null;
  const d = parseInt(day, 10);
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);
  if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
  if (m < 1 || m > 12) return null;
  if (d < 1 || d > 31) return null;
  // Use UTC noon to avoid any timezone offset shifting the date
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  // Guard against Feb 30 etc.
  if (date.getUTCMonth() !== m - 1) return null;
  return date.toISOString();
}

function participantFullName(p) {
  return [p.firstName, p.firstSurname, p.secondSurname].filter(Boolean).join(" ");
}

// ── DateInput: three-field dd / mm / yyyy ──────────────────────────────────

function DateInput({ label, value, onChange }) {
  // value is { day, month, year }
  const set = (field, v) => {
    // Allow only digits
    const clean = v.replace(/\D/g, "");
    onChange({ ...value, [field]: clean });
  };

  const isComplete = value.day && value.month && value.year && value.year.length === 4;
  const iso = isComplete ? partsToIso(value) : null;
  const isInvalid = isComplete && !iso;

  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: "11px",
          fontWeight: 600,
          color: "#6B7280",
          marginBottom: "6px",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </label>
      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
        <input
          type="text"
          inputMode="numeric"
          maxLength={2}
          placeholder="DD"
          value={value.day}
          onChange={(e) => set("day", e.target.value)}
          style={{
            width: "52px",
            padding: "8px 10px",
            fontSize: "14px",
            border: `1px solid ${isInvalid ? "#F87171" : "#E5E7EB"}`,
            borderRadius: "10px",
            outline: "none",
            textAlign: "center",
            fontVariantNumeric: "tabular-nums",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#111827")}
          onBlur={(e) => (e.target.style.borderColor = isInvalid ? "#F87171" : "#E5E7EB")}
        />
        <span style={{ color: "#9CA3AF", fontWeight: 700 }}>/</span>
        <input
          type="text"
          inputMode="numeric"
          maxLength={2}
          placeholder="MM"
          value={value.month}
          onChange={(e) => set("month", e.target.value)}
          style={{
            width: "52px",
            padding: "8px 10px",
            fontSize: "14px",
            border: `1px solid ${isInvalid ? "#F87171" : "#E5E7EB"}`,
            borderRadius: "10px",
            outline: "none",
            textAlign: "center",
            fontVariantNumeric: "tabular-nums",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#111827")}
          onBlur={(e) => (e.target.style.borderColor = isInvalid ? "#F87171" : "#E5E7EB")}
        />
        <span style={{ color: "#9CA3AF", fontWeight: 700 }}>/</span>
        <input
          type="text"
          inputMode="numeric"
          maxLength={4}
          placeholder="AAAA"
          value={value.year}
          onChange={(e) => set("year", e.target.value)}
          style={{
            width: "70px",
            padding: "8px 10px",
            fontSize: "14px",
            border: `1px solid ${isInvalid ? "#F87171" : "#E5E7EB"}`,
            borderRadius: "10px",
            outline: "none",
            textAlign: "center",
            fontVariantNumeric: "tabular-nums",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#111827")}
          onBlur={(e) => (e.target.style.borderColor = isInvalid ? "#F87171" : "#E5E7EB")}
        />
        {isComplete && (
          <span
            style={{
              fontSize: "11px",
              color: iso ? "#059669" : "#EF4444",
              fontWeight: 600,
            }}
          >
            {iso ? "✓" : "Fecha inválida"}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Toggle with inline styles (avoids Tailwind JIT class issues) ──────────────

function Toggle({ label, checked, onChange, description }) {
  return (
    <button
      type="button"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        cursor: "pointer",
        border: "none",
        background: "transparent",
        padding: 0,
        width: "100%",
        textAlign: "left",
      }}
      onClick={() => onChange(!checked)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onChange(!checked);
        }
      }}
    >
      {/* Track */}
      <div
        style={{
          position: "relative",
          width: "40px",
          height: "24px",
          borderRadius: "9999px",
          backgroundColor: checked ? "#111827" : "#D1D5DB",
          transition: "background-color 0.2s ease",
          flexShrink: 0,
          marginTop: "1px",
        }}
      >
        {/* Thumb */}
        <span
          style={{
            position: "absolute",
            top: "4px",
            left: checked ? "20px" : "4px",
            width: "16px",
            height: "16px",
            backgroundColor: "#fff",
            borderRadius: "9999px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            transition: "left 0.2s ease",
          }}
        />
      </div>
      <div>
        <span style={{ fontSize: "14px", color: "#374151", fontWeight: 500 }}>{label}</span>
        {description && (
          <p style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "2px" }}>{description}</p>
        )}
      </div>
    </button>
  );
}

// ── TextField ─────────────────────────────────────────────────────────────────

function Field({ label, placeholder, value, onChange, readOnly = false }) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: "11px",
          fontWeight: 600,
          color: "#6B7280",
          marginBottom: "6px",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        readOnly={readOnly}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "8px 12px",
          fontSize: "14px",
          border: "1px solid #E5E7EB",
          borderRadius: "10px",
          outline: "none",
          boxSizing: "border-box",
          background: readOnly ? "#F9FAFB" : "#fff",
          color: readOnly ? "#6B7280" : "#111827",
          cursor: readOnly ? "default" : "text",
        }}
        onFocus={(e) => {
          if (!readOnly) e.target.style.borderColor = "#111827";
        }}
        onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
      />
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <div
      style={{
        border: "1px solid #F3F4F6",
        borderRadius: "16px",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
      }}
    >
      <p
        style={{
          fontSize: "10px",
          fontWeight: 700,
          color: "#9CA3AF",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          margin: 0,
        }}
      >
        {title}
      </p>
      {children}
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

export default function DocumentEditModal({ participant, refDate, onSave, onClose, saving }) {
  const [passportNumber, setPassportNumber] = useState("");
  const [passportDate, setPassportDate] = useState({ day: "", month: "", year: "" });
  const [hasVisa, setHasVisa] = useState(false);
  const [visaDate, setVisaDate] = useState({ day: "", month: "", year: "" });
  const [hasExitPermit, setHasExitPermit] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!participant) return;
    setPassportNumber(participant.passportNumber || "");
    setPassportDate(isoToParts(participant.passportExpiry));
    setHasVisa(participant.hasVisa || false);
    setVisaDate(isoToParts(participant.visaExpiry));
    setHasExitPermit(participant.hasExitPermit || false);
    setNotes(participant.notes || "");
  }, [participant]);

  if (!participant) return null;
  const isSyncedFromDocuments = Boolean(participant.linkedUser);

  const ageAtTour =
    refDate && participant.birthDate
      ? getAgeAtDate(participant.birthDate, refDate)
      : null;
  const isAdult = ageAtTour !== null ? ageAtTour >= 18 : null;

  const passportIso = partsToIso(passportDate);
  const visaIso = partsToIso(visaDate);

  const canSave = isSyncedFromDocuments
    ? true
    : (
        // passport date either empty or valid
        (!passportDate.day || passportIso) &&
        // visa date either empty or valid (only matters if hasVisa)
        (!hasVisa || !visaDate.day || visaIso)
      );

  const handleSubmit = () => {
    if (!canSave) return;
    const input = isSyncedFromDocuments
      ? {
          notes: notes.trim() || null,
        }
      : {
          passportNumber: passportNumber.trim() || null,
          passportExpiry: passportIso || null,
          hasVisa,
          visaExpiry: hasVisa ? visaIso || null : null,
          hasExitPermit,
          notes: notes.trim() || null,
        };
    onSave(participant.id, input);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        background: "rgba(15,23,42,0.55)",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={(e) => {
        if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
          if (e.target === e.currentTarget) {
            e.preventDefault();
            onClose();
          }
        }
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "24px",
          boxShadow: "0 25px 60px rgba(0,0,0,0.2)",
          width: "100%",
          maxWidth: "480px",
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "24px 24px 16px",
            borderBottom: "1px solid #F3F4F6",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#111827" }}>
              {isSyncedFromDocuments ? "Datos sincronizados" : "Editar documentos"}
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#6B7280", fontWeight: 600 }}>
              {participantFullName(participant)}
            </p>
            {ageAtTour !== null && refDate && (
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#9CA3AF" }}>
                {ageAtTour} años al inicio de la gira ·{" "}
                <span style={{ color: isAdult ? "#059669" : "#D97706", fontWeight: 600 }}>
                  {isAdult ? "Adulto" : "Menor de edad"}
                </span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: "16px",
              color: "#9CA3AF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#F3F4F6";
              e.currentTarget.style.color = "#374151";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#9CA3AF";
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            padding: "24px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {isSyncedFromDocuments && (
            <div
              style={{
                padding: "12px 14px",
                background: "#EFF6FF",
                border: "1px solid #BFDBFE",
                borderRadius: "14px",
                color: "#1D4ED8",
                fontSize: "12px",
                lineHeight: 1.5,
              }}
            >
              Pasaporte, visa y permiso de salida se administran en Documents para
              participantes vinculados. Esta pantalla solo conserva notas locales.
            </div>
          )}

          {/* Passport */}
          <Section title="Pasaporte">
            {isSyncedFromDocuments ? (
              <>
                <Field
                  label="Número de pasaporte"
                  placeholder="Ej: A1234567"
                  value={participant.passportNumber || "—"}
                  onChange={() => {}}
                  readOnly
                />
                <div style={{ fontSize: "12px", color: "#6B7280" }}>
                  Vence:{" "}
                  {participant.passportExpiry
                    ? new Date(participant.passportExpiry).toLocaleDateString("es-CR")
                    : "—"}
                </div>
              </>
            ) : (
              <>
                <Field
                  label="Número de pasaporte"
                  placeholder="Ej: A1234567"
                  value={passportNumber}
                  onChange={setPassportNumber}
                />
                <DateInput
                  label="Fecha de vencimiento (DD/MM/AAAA)"
                  value={passportDate}
                  onChange={setPassportDate}
                />
              </>
            )}
          </Section>

          {/* Visa */}
          <Section title="Visa">
            {isSyncedFromDocuments ? (
              <div style={{ fontSize: "13px", color: "#374151", lineHeight: 1.5 }}>
                <div>
                  Estado: <strong>{participant.hasVisa ? "Registrada" : "No registrada"}</strong>
                </div>
                <div>
                  Vence:{" "}
                  {participant.hasVisa && participant.visaExpiry
                    ? new Date(participant.visaExpiry).toLocaleDateString("es-CR")
                    : "—"}
                </div>
              </div>
            ) : (
              <>
                <Toggle
                  label="Tiene visa"
                  checked={hasVisa}
                  onChange={setHasVisa}
                />
                {hasVisa && (
                  <DateInput
                    label="Vencimiento de visa (DD/MM/AAAA)"
                    value={visaDate}
                    onChange={setVisaDate}
                  />
                )}
              </>
            )}
          </Section>

          {/* Exit permit — only show for minors or when age is unknown */}
          {isAdult !== true && (
            <Section title="Permiso de salida de menores">
              {isAdult === false ? (
                <div
                  style={{
                    padding: "8px 12px",
                    background: "#FFFBEB",
                    borderRadius: "10px",
                    border: "1px solid #FDE68A",
                    fontSize: "12px",
                    color: "#92400E",
                    marginBottom: "4px",
                  }}
                >
                  ⚠️ Requerido — participante es menor de edad al inicio de la gira.
                </div>
              ) : (
                <div
                  style={{
                    padding: "8px 12px",
                    background: "#F9FAFB",
                    borderRadius: "10px",
                    fontSize: "12px",
                    color: "#6B7280",
                    marginBottom: "4px",
                  }}
                >
                  Sin fecha de nacimiento registrada. Verificar si aplica.
                </div>
              )}
              {isSyncedFromDocuments ? (
                <div style={{ fontSize: "13px", color: "#374151" }}>
                  Estado: <strong>{participant.hasExitPermit ? "Registrado" : "Pendiente"}</strong>
                </div>
              ) : (
                <Toggle
                  label="Tiene permiso de salida"
                  checked={hasExitPermit}
                  onChange={setHasExitPermit}
                />
              )}
            </Section>
          )}

          {/* Notes */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: 600,
                color: "#6B7280",
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Notas{" "}
              <span style={{ textTransform: "none", fontWeight: 400 }}>(opcional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Observaciones documentales..."
              style={{
                width: "100%",
                padding: "8px 12px",
                fontSize: "14px",
                border: "1px solid #E5E7EB",
                borderRadius: "10px",
                outline: "none",
                resize: "none",
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#111827")}
              onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px 24px",
            display: "flex",
            gap: "12px",
          }}
        >
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "14px",
              border: "1px solid #E5E7EB",
              background: "#fff",
              color: "#374151",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !canSave}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "14px",
              border: "none",
              background: saving || !canSave ? "#6B7280" : "#111827",
              color: "#fff",
              fontWeight: 700,
              fontSize: "14px",
              cursor: saving || !canSave ? "not-allowed" : "pointer",
              opacity: saving || !canSave ? 0.6 : 1,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!saving && canSave) e.currentTarget.style.background = "#374151";
            }}
            onMouseLeave={(e) => {
              if (!saving && canSave) e.currentTarget.style.background = "#111827";
            }}
          >
            {saving ? "Guardando…" : isSyncedFromDocuments ? "Guardar notas" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
