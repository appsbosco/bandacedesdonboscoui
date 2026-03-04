/**
 * EventDrawer.jsx
 * Panel de detalles de un evento — slide-over desde la derecha.
 *
 * PROBLEMA DEL ORIGINAL:
 * Cada campo se renderizaba como una fila full-width (border-bottom),
 * creando un layout de "tabla de Excel" que ocupaba toda la pantalla.
 *
 * REDISEÑO:
 * - Portal para escapar transforms del DashboardLayout
 * - Imagen compacta con overlay de datos encima
 * - Info en grid 2 columnas (no filas full-width)
 * - Sección de acciones admin limpia en el footer
 * - Máx. 480px de ancho, nunca más
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { formatDateEs, normalizeTimeTo12h } from "utils/dateHelpers";
import { getEventImage } from "utils/eventHelpers";

const CATEGORY_META = {
  presentation: { label: "Presentación", icon: "🎵", color: "#3b82f6" },
  rehearsal: { label: "Ensayo", icon: "🎼", color: "#8b5cf6" },
  meeting: { label: "Reunión", icon: "📋", color: "#f59e0b" },
  activity: { label: "Actividad", icon: "🎉", color: "#10b981" },
  logistics: { label: "Logística", icon: "🚌", color: "#f97316" },
  other: { label: "Otro", icon: "📌", color: "#94a3b8" },
};

const NOTIFICATION_LABELS = {
  NONE: { label: "Sin notificación", bg: "#f1f5f9", color: "#64748b" },
  DRY_RUN: { label: "Modo prueba", bg: "#fef3c7", color: "#92400e" },
  LIVE: { label: "Envío real", bg: "#d1fae5", color: "#065f46" },
};

export default function EventDrawer({ open, event, isAdmin, onClose, onEdit, onDelete }) {
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll
  useEffect(() => {
    if (!mounted) return;
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, mounted]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 200);
  };

  if (!mounted || !open || !event) return null;

  const cat = CATEGORY_META[event.category] ?? CATEGORY_META.other;
  const imgSrc = getEventImage(event.type);
  const notifMeta = NOTIFICATION_LABELS[event.notificationMode] ?? NOTIFICATION_LABELS.NONE;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          background: "rgba(15,23,42,0.4)",
          backdropFilter: "blur(3px)",
          opacity: closing ? 0 : 1,
          transition: "opacity 0.2s ease",
        }}
        aria-hidden="true"
      />

      {/* Drawer panel — slides in from right */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={event.title}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          width: "100%",
          maxWidth: 480,
          background: "#ffffff",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.12)",
          display: "flex",
          flexDirection: "column",
          transform: closing ? "translateX(100%)" : "translateX(0)",
          transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
          overflowY: "auto",
        }}
      >
        {/* ── Header: imagen + close + título encima ───────────────────── */}
        <div style={{ position: "relative", height: 200, flexShrink: 0 }}>
          <img
            src={imgSrc}
            alt={event.type ?? "Evento"}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
              display: "block",
            }}
          />
          {/* Dark overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.1) 100%)",
            }}
          />

          {/* Close button */}
          <button
            onClick={handleClose}
            aria-label="Cerrar"
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(4px)",
              border: "none",
              color: "#ffffff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CloseIcon />
          </button>

          {/* Category badge */}
          <div style={{ position: "absolute", top: 14, left: 14 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11,
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: 99,
                background: "rgba(0,0,0,0.5)",
                backdropFilter: "blur(4px)",
                color: "#ffffff",
              }}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </span>
          </div>

          {/* Title + type over image */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: "16px 20px",
            }}
          >
            {event.type && (
              <p
                style={{
                  margin: "0 0 4px",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.7)",
                }}
              >
                {event.type}
              </p>
            )}
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 800,
                color: "#ffffff",
                lineHeight: 1.3,
                textShadow: "0 1px 4px rgba(0,0,0,0.3)",
              }}
            >
              {event.title}
            </h2>
          </div>
        </div>

        {/* ── Body ─────────────────────────────────────────────────────── */}
        <div
          style={{ flex: 1, padding: "20px", display: "flex", flexDirection: "column", gap: 20 }}
        >
          {/* Description */}
          {event.description && (
            <p style={{ margin: 0, fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>
              {event.description}
            </p>
          )}

          {/* Info grid — 2 columnas */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
            }}
          >
            <InfoCell icon={<CalIcon />} label="Fecha" value={formatDateEs(event.date)} wide />
            {event.time && (
              <InfoCell icon={<ClockIcon />} label="Hora" value={normalizeTimeTo12h(event.time)} />
            )}
            {event.place && <InfoCell icon={<PinIcon />} label="Lugar" value={event.place} wide />}
            {event.departure && (
              <InfoCell
                icon={<BusIcon />}
                label="Salida de CEDES"
                value={normalizeTimeTo12h(event.departure)}
              />
            )}
            {event.arrival && (
              <InfoCell
                icon={<HomeIcon />}
                label="Llegada aprox."
                value={normalizeTimeTo12h(event.arrival)}
              />
            )}
          </div>

          {/* Notification badge */}
          {event.notificationMode && event.notificationMode !== "NONE" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <BellIcon />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "3px 10px",
                  borderRadius: 99,
                  background: notifMeta.bg,
                  color: notifMeta.color,
                }}
              >
                {notifMeta.label}
              </span>
              {event.audience?.length > 0 && (
                <span style={{ fontSize: 11, color: "#94a3b8" }}>
                  → {event.audience.join(", ")}
                </span>
              )}
            </div>
          )}

          {/* Divider */}
          <div style={{ height: 1, background: "#f1f5f9" }} />

          {/* Timestamps */}
          <div style={{ display: "flex", gap: 16 }}>
            {event.createdAt && (
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 10,
                    fontWeight: 600,
                    color: "#cbd5e1",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Creado
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>
                  {new Date(Number(event.createdAt) || event.createdAt).toLocaleDateString("es-CR")}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer: admin actions ─────────────────────────────────────── */}
        {isAdmin && (
          <div
            style={{
              flexShrink: 0,
              padding: "14px 20px",
              borderTop: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 10,
              background: "#ffffff",
            }}
          >
            <button
              onClick={() => {
                onDelete(event);
                handleClose();
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                fontWeight: 600,
                padding: "8px 16px",
                borderRadius: 10,
                border: "1.5px solid #fecaca",
                background: "#fff1f2",
                color: "#ef4444",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.12s",
              }}
            >
              <TrashIcon />
              Eliminar
            </button>
            <button
              onClick={() => {
                onEdit(event);
                handleClose();
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                fontWeight: 700,
                padding: "8px 18px",
                borderRadius: 10,
                border: "none",
                background: "#0f172a",
                color: "#ffffff",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.12s",
              }}
            >
              <EditIcon />
              Editar
            </button>
          </div>
        )}
      </div>
    </>,
    document.body
  );
}

// ─── InfoCell ─────────────────────────────────────────────────────────────────
function InfoCell({ icon, label, value, wide = false }) {
  return (
    <div
      style={{
        gridColumn: wide ? "span 2" : "span 1",
        padding: "12px 14px",
        borderRadius: 12,
        background: "#f8fafc",
        border: "1px solid #f1f5f9",
        minWidth: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
        <span style={{ color: "#94a3b8", display: "flex" }}>{icon}</span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          {label}
        </span>
      </div>
      <p
        style={{
          margin: 0,
          fontSize: 13,
          fontWeight: 700,
          color: "#0f172a",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </p>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const CloseIcon = () => (
  <svg
    width="16"
    height="16"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="2.5"
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);
const CalIcon = () => (
  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25"
    />
  </svg>
);
const ClockIcon = () => (
  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
    />
  </svg>
);
const PinIcon = () => (
  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
    />
  </svg>
);
const BusIcon = () => (
  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
    />
  </svg>
);
const HomeIcon = () => (
  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
    />
  </svg>
);
const BellIcon = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#94a3b8">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
    />
  </svg>
);
const EditIcon = () => (
  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"
    />
  </svg>
);
const TrashIcon = () => (
  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
    />
  </svg>
);

// ─── PropTypes ────────────────────────────────────────────────────────────────
EventDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  event: PropTypes.object,
  isAdmin: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

InfoCell.propTypes = {
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  wide: PropTypes.bool,
};
