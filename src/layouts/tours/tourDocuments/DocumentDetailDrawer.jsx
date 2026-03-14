/* eslint-disable react/prop-types */
/**
 * DocumentDetailDrawer — vista completa de documentos de un participante.
 * FIXES:
 * - Eliminado el JSON debug completo
 * - Permiso de salida no muestra sección para adultos
 * - Fechas corregidas con UTC para evitar off-by-one
 */
import { getAgeAtDate, getDaysUntilExpiry, getExpiryStatus, isExitPermitRequired } from "../utils/tourAgeRules";

function participantFullName(p) {
  return [p.firstName, p.firstSurname, p.secondSurname].filter(Boolean).join(" ");
}

function formatDate(iso) {
  if (!iso) return "—";
  // Parse as UTC to avoid timezone shift
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-CR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-CR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const EXPIRY_STATUS_CONFIG = {
  ok: { label: "Vigente", bg: "#ECFDF5", color: "#065F46", border: "#A7F3D0" },
  warning: { label: "Por vencer", bg: "#FFFBEB", color: "#92400E", border: "#FDE68A" },
  expired: { label: "Vencido", bg: "#FEF2F2", color: "#991B1B", border: "#FECACA" },
  missing: { label: "Sin fecha", bg: "#F9FAFB", color: "#9CA3AF", border: "#E5E7EB" },
};

function ExpiryBadge({ date }) {
  const status = getExpiryStatus(date);
  const cfg = EXPIRY_STATUS_CONFIG[status];
  const days = getDaysUntilExpiry(date);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "2px 8px",
        borderRadius: "9999px",
        fontSize: "11px",
        fontWeight: 600,
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {cfg.label}
      {days !== null && status !== "missing" && (
        <span style={{ opacity: 0.7 }}>
          ({days >= 0 ? `${days}d` : `hace ${Math.abs(days)}d`})
        </span>
      )}
    </span>
  );
}

function DetailRow({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "16px",
        padding: "10px 0",
        borderBottom: "1px solid #F9FAFB",
      }}
    >
      <span style={{ fontSize: "12px", color: "#9CA3AF", fontWeight: 500, flexShrink: 0, width: "144px" }}>
        {label}
      </span>
      <span style={{ fontSize: "12px", color: "#111827", fontWeight: 500, textAlign: "right" }}>
        {value ?? "—"}
      </span>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <p
      style={{
        fontSize: "10px",
        fontWeight: 700,
        color: "#9CA3AF",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        margin: "0 0 8px 0",
      }}
    >
      {children}
    </p>
  );
}

function Card({ children }) {
  return (
    <div
      style={{
        background: "#F9FAFB",
        borderRadius: "16px",
        padding: "4px 16px",
      }}
    >
      {children}
    </div>
  );
}

export default function DocumentDetailDrawer({ participant, refDate, onClose, onEdit }) {
  if (!participant) return null;

  const ageAtTour =
    refDate && participant.birthDate
      ? getAgeAtDate(participant.birthDate, refDate)
      : null;
  const isAdult = ageAtTour !== null ? ageAtTour >= 18 : null;
  const exitRequired = isExitPermitRequired(participant.birthDate, refDate);

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1290,
          background: "rgba(0,0,0,0.3)",
          backdropFilter: "blur(4px)",
        }}
        onClick={onClose}
      />

      {/* Modal container */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1300,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
        }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
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
                {participantFullName(participant)}
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#9CA3AF" }}>
                {participant.identification}
              </p>
              {ageAtTour !== null && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                  <span style={{ fontSize: "12px", color: "#6B7280" }}>
                    {ageAtTour} años al inicio de la gira
                  </span>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      padding: "2px 7px",
                      borderRadius: "9999px",
                      background: isAdult ? "#ECFDF5" : "#FFFBEB",
                      color: isAdult ? "#065F46" : "#92400E",
                      border: `1px solid ${isAdult ? "#A7F3D0" : "#FDE68A"}`,
                    }}
                  >
                    {isAdult ? "Adulto" : "Menor"}
                  </span>
                </div>
              )}
              {!refDate && (
                <p style={{ fontSize: "12px", color: "#F97316", marginTop: "4px" }}>
                  ⚠️ Sin fecha de inicio de gira — no se puede determinar mayoría de edad.
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
              flex: 1,
              overflowY: "auto",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            {/* Passport */}
            <section>
              <SectionTitle>Pasaporte</SectionTitle>
              <Card>
                <DetailRow
                  label="Número"
                  value={
                    participant.passportNumber ? (
                      <span style={{ fontFamily: "monospace" }}>{participant.passportNumber}</span>
                    ) : (
                      <span style={{ color: "#EF4444" }}>Sin registrar</span>
                    )
                  }
                />
                <DetailRow
                  label="Vencimiento"
                  value={
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span>{formatDate(participant.passportExpiry)}</span>
                      <ExpiryBadge date={participant.passportExpiry} />
                    </div>
                  }
                />
              </Card>
            </section>

            {/* Visa */}
            <section>
              <SectionTitle>Visa</SectionTitle>
              <Card>
                <DetailRow
                  label="Tiene visa"
                  value={
                    participant.hasVisa ? (
                      <span style={{ color: "#059669", fontWeight: 700 }}>Sí</span>
                    ) : (
                      <span style={{ color: "#9CA3AF" }}>No</span>
                    )
                  }
                />
                {participant.hasVisa && (
                  <DetailRow
                    label="Vencimiento"
                    value={
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>{formatDate(participant.visaExpiry)}</span>
                        <ExpiryBadge date={participant.visaExpiry} />
                      </div>
                    }
                  />
                )}
              </Card>
            </section>

            {/* Exit permit — only for minors or unknown age */}
            {isAdult !== true && (
              <section>
                <SectionTitle>Permiso de salida de menores</SectionTitle>
                <Card>
                  <DetailRow label="Requerido" value={exitRequired ? "Sí" : "No"} />
                  <DetailRow
                    label="Tiene permiso"
                    value={
                      participant.hasExitPermit ? (
                        <span style={{ color: "#059669", fontWeight: 700 }}>Sí</span>
                      ) : exitRequired ? (
                        <span style={{ color: "#EF4444", fontWeight: 700 }}>No — Faltante</span>
                      ) : (
                        <span style={{ color: "#9CA3AF" }}>No</span>
                      )
                    }
                  />
                  {isAdult === null && (
                    <div style={{ padding: "8px 0" }}>
                      <p style={{ fontSize: "12px", color: "#F97316", margin: 0 }}>
                        Sin fecha de nacimiento — verifique si aplica permiso.
                      </p>
                    </div>
                  )}
                </Card>
              </section>
            )}

            {/* Participant data */}
            <section>
              <SectionTitle>Datos del participante</SectionTitle>
              <Card>
                <DetailRow label="Nombre" value={participantFullName(participant)} />
                <DetailRow label="Cédula/Pasaporte" value={participant.identification} />
                <DetailRow label="Fecha de nacimiento" value={formatDate(participant.birthDate)} />
                <DetailRow label="Instrumento" value={participant.instrument} />
                <DetailRow label="Grado" value={participant.grade} />
                <DetailRow label="Rol" value={participant.role} />
                <DetailRow label="Estado" value={participant.status} />
                <DetailRow
                  label="Notas"
                  value={
                    participant.notes ? (
                      participant.notes
                    ) : (
                      <span style={{ color: "#D1D5DB" }}>Sin notas</span>
                    )
                  }
                />
              </Card>
            </section>

            {/* Audit */}
            <section>
              <SectionTitle>Auditoría</SectionTitle>
              <Card>
                <DetailRow
                  label="ID"
                  value={
                    <span style={{ fontFamily: "monospace", fontSize: "10px" }}>
                      {participant.id}
                    </span>
                  }
                />
                <DetailRow label="Creado" value={formatDateTime(participant.createdAt)} />
                <DetailRow label="Actualizado" value={formatDateTime(participant.updatedAt)} />
                {participant.addedBy && (
                  <DetailRow
                    label="Agregado por"
                    value={`${participant.addedBy.name || ""} ${participant.addedBy.firstSurName || ""}`.trim()}
                  />
                )}
              </Card>
            </section>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: "12px 24px 24px",
              borderTop: "1px solid #F3F4F6",
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
              Cerrar
            </button>
            <button
              onClick={() => {
                onClose();
                onEdit(participant);
              }}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "14px",
                border: "none",
                background: "#111827",
                color: "#fff",
                fontWeight: 700,
                fontSize: "14px",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#374151")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#111827")}
            >
              Editar documentos
            </button>
          </div>
        </div>
      </div>
    </>
  );
}