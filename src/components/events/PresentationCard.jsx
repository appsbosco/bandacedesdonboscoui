/**
 * PresentationCard.jsx — DEFINITIVO v3
 * Card compacta para grid secundario. Imagen fija h-36, info densa.
 */

import PropTypes from "prop-types";
import { formatDateEs, normalizeTimeTo12h } from "utils/dateHelpers";
import { getEventImage } from "utils/eventHelpers";

export default function PresentationCard({
  event,
  isAdmin,
  bandColors,
  getDaysUntil,
  getUrgencyLabel,
  onViewDetails,
  onEdit,
  onDelete,
}) {
  const days = getDaysUntil(event.date);
  const urgency = getUrgencyLabel(days);
  const colors = bandColors[event.type] ?? { text: "text-slate-600", light: "bg-slate-100" };
  const imgSrc = getEventImage(event.type);

  return (
    <div
      onClick={() => onViewDetails(event)}
      className="group"
      style={{
        background: "#ffffff",
        borderRadius: 18,
        overflow: "hidden",
        boxShadow: "0 2px 12px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.04)",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow 0.2s, transform 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.06)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.04)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Imagen fija */}
      <div style={{ position: "relative", height: 128, flexShrink: 0, overflow: "hidden" }}>
        <img
          src={imgSrc}
          alt={event.type ?? "Evento"}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            display: "block",
            transition: "transform 0.5s",
          }}
          className="group-hover:scale-105"
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)",
          }}
        />

        {/* Urgency badge top-right */}
        <div style={{ position: "absolute", top: 10, right: 10 }}>
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full ${urgency.color}`}
            style={{ fontSize: 10 }}
          >
            {urgency.label}
          </span>
        </div>

        {/* Admin buttons top-left */}
        {isAdmin && (
          <div
            style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 5 }}
            onClick={(e) => e.stopPropagation()}
          >
            <MiniBtn onClick={() => onEdit(event)} title="Editar">
              <svg
                width="10"
                height="10"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"
                />
              </svg>
            </MiniBtn>
            <MiniBtn onClick={() => onDelete(event)} title="Eliminar" danger>
              <svg
                width="10"
                height="10"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                />
              </svg>
            </MiniBtn>
          </div>
        )}

        {/* Band name bottom-left */}
        {event.type && (
          <div style={{ position: "absolute", bottom: 8, left: 10, right: 10 }}>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors.light} ${colors.text}`}
              style={{
                fontSize: 10,
                display: "inline-block",
                maxWidth: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {event.type}
            </span>
          </div>
        )}
      </div>

      {/* Contenido */}
      <div
        style={{
          flex: 1,
          padding: "12px 14px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <h4
          style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#0f172a", lineHeight: 1.35 }}
          className="line-clamp-2"
        >
          {event.title}
        </h4>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <Row icon="📅" text={formatDateEs(event.date)} />
          {event.time && <Row icon="🕐" text={normalizeTimeTo12h(event.time)} />}
          {event.place && <Row icon="📍" text={event.place} />}
          {event.departure && (
            <Row icon="🚌" text={`Salida: ${normalizeTimeTo12h(event.departure)}`} muted />
          )}
        </div>

        <div
          style={{
            marginTop: "auto",
            paddingTop: 8,
            borderTop: "1px solid #f8fafc",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>Ver detalles →</span>
        </div>
      </div>
    </div>
  );
}

function Row({ icon, text, muted = false }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <span style={{ fontSize: 10, lineHeight: 1 }}>{icon}</span>
      <span
        style={{
          fontSize: 11,
          color: muted ? "#94a3b8" : "#64748b",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          flex: 1,
        }}
      >
        {text}
      </span>
    </div>
  );
}
Row.propTypes = {
  icon: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  muted: PropTypes.bool,
};

function MiniBtn({ onClick, title, danger = false, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 22,
        height: 22,
        borderRadius: 6,
        background: "rgba(255,255,255,0.9)",
        backdropFilter: "blur(4px)",
        border: "none",
        color: danger ? "#ef4444" : "#374151",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
      }}
    >
      {children}
    </button>
  );
}
MiniBtn.propTypes = {
  onClick: PropTypes.func.isRequired,
  title: PropTypes.string,
  danger: PropTypes.bool,
  children: PropTypes.node.isRequired,
};

PresentationCard.propTypes = {
  event: PropTypes.object.isRequired,
  isAdmin: PropTypes.bool,
  bandColors: PropTypes.object.isRequired,
  getDaysUntil: PropTypes.func.isRequired,
  getUrgencyLabel: PropTypes.func.isRequired,
  onViewDetails: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
