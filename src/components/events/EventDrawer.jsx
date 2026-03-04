/**
 * EventDrawer.jsx — DEFINITIVO v3
 * Diseño premium: fondo oscuro para header, tipografía contrastada,
 * info grid limpio. Bottom sheet en mobile, slide-over en desktop.
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { formatDateEs, normalizeTimeTo12h } from "utils/dateHelpers";
import { getEventImage } from "utils/eventHelpers";

const CATEGORY_META = {
  presentation: { label: "Presentación", icon: "🎵", accent: "#3b82f6" },
  rehearsal: { label: "Ensayo", icon: "🎼", accent: "#8b5cf6" },
  meeting: { label: "Reunión", icon: "📋", accent: "#f59e0b" },
  activity: { label: "Actividad", icon: "🎉", accent: "#10b981" },
  logistics: { label: "Logística", icon: "🚌", accent: "#f97316" },
  other: { label: "Otro", icon: "📌", accent: "#94a3b8" },
};

const NOTIF_META = {
  NONE: { label: "Sin notificación", bg: "#f1f5f9", color: "#64748b" },
  DRY_RUN: { label: "Modo prueba", bg: "#fef3c7", color: "#92400e" },
  LIVE: { label: "Envío real", bg: "#d1fae5", color: "#065f46" },
};

export default function EventDrawer({ open, event, isAdmin, onClose, onEdit, onDelete }) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Animación de entrada/salida
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, mounted]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 240);
  };

  if (!mounted || !open || !event) return null;

  const catKey = (event.category ?? "other").toLowerCase();
  const cat = CATEGORY_META[catKey] ?? CATEGORY_META.other;
  const notif = NOTIF_META[event.notificationMode] ?? NOTIF_META.NONE;
  const imgSrc = getEventImage(event.type);

  const panelStyle = isMobile
    ? {
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        maxHeight: "92dvh",
        background: "#ffffff",
        borderRadius: "22px 22px 0 0",
        boxShadow: "0 -20px 60px rgba(0,0,0,0.2)",
        display: "flex",
        flexDirection: "column",
        transform: visible ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.28s cubic-bezier(0.32,0.72,0,1)",
        overflowY: "auto",
      }
    : {
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        width: "min(480px, 100vw)",
        background: "#ffffff",
        boxShadow: "-16px 0 60px rgba(0,0,0,0.12)",
        display: "flex",
        flexDirection: "column",
        transform: visible ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.28s cubic-bezier(0.32,0.72,0,1)",
        overflowY: "auto",
      };

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          background: "rgba(2,8,23,0.55)",
          backdropFilter: "blur(4px)",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.24s ease",
        }}
      />

      <div role="dialog" aria-modal="true" aria-label={event.title} style={panelStyle}>
        {/* Mobile drag handle */}
        {isMobile && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "12px 0 8px",
              flexShrink: 0,
              background: "#ffffff",
            }}
          >
            <div style={{ width: 38, height: 4, borderRadius: 99, background: "#e2e8f0" }} />
          </div>
        )}

        {/* ── Hero imagen con overlay oscuro ───────────────────────────── */}
        <div style={{ position: "relative", height: isMobile ? 180 : 220, flexShrink: 0 }}>
          <img
            src={imgSrc}
            alt={event.type ?? "Evento"}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center top",
              display: "block",
            }}
          />

          {/* Gradient overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(2,8,23,0.25) 0%, rgba(2,8,23,0.7) 60%, rgba(2,8,23,0.88) 100%)",
            }}
          />

          {/* Botón cerrar */}
          {!isMobile && (
            <button
              onClick={handleClose}
              aria-label="Cerrar"
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.15)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#ffffff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CloseIcon />
            </button>
          )}

          {/* Pill de categoría */}
          <div style={{ position: "absolute", top: 16, left: 16 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11,
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: 99,
                background: "rgba(255,255,255,0.15)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.25)",
                color: "#ffffff",
              }}
            >
              {cat.icon} {cat.label}
            </span>
          </div>

          {/* Título + agrupación sobre imagen */}
          <div
            style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 20px 20px" }}
          >
            {event.type && (
              <p
                style={{
                  margin: "0 0 4px",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.6)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {event.type}
              </p>
            )}
            <h2
              style={{
                margin: 0,
                fontSize: isMobile ? 20 : 22,
                fontWeight: 800,
                color: "#ffffff",
                lineHeight: 1.25,
                textShadow: "0 2px 8px rgba(0,0,0,0.3)",
                fontFamily: "Georgia, serif",
              }}
            >
              {event.title}
            </h2>
          </div>
        </div>

        {/* ── Acento de color de categoría ─────────────────────────────── */}
        <div style={{ height: 3, background: cat.accent, flexShrink: 0 }} />

        {/* ── Body ─────────────────────────────────────────────────────── */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {/* Descripción */}
          {event.description && (
            <p style={{ margin: 0, fontSize: 13, color: "#475569", lineHeight: 1.7 }}>
              {event.description}
            </p>
          )}

          {/* Info grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <Chip
              icon={<CalIcon />}
              label="Fecha"
              value={formatDateEs(event.date)}
              wide
              accent={cat.accent}
            />
            {event.time && (
              <Chip
                icon={<ClockIcon />}
                label="Hora"
                value={normalizeTimeTo12h(event.time)}
                accent={cat.accent}
              />
            )}
            {event.place && (
              <Chip icon={<PinIcon />} label="Lugar" value={event.place} wide accent={cat.accent} />
            )}
            {event.departure && (
              <Chip
                icon={<BusIcon />}
                label="Salida"
                value={normalizeTimeTo12h(event.departure)}
                accent={cat.accent}
              />
            )}
            {event.arrival && (
              <Chip
                icon={<HomeIcon />}
                label="Llegada aprox."
                value={normalizeTimeTo12h(event.arrival)}
                accent={cat.accent}
              />
            )}
          </div>

          {/* Notif badge */}
          {event.notificationMode && event.notificationMode !== "NONE" && (
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "4px 12px",
                  borderRadius: 99,
                  background: notif.bg,
                  color: notif.color,
                }}
              >
                {notif.label}
              </span>
              {event.audience?.length > 0 && (
                <span style={{ fontSize: 11, color: "#94a3b8" }}>
                  → {event.audience.join(", ")}
                </span>
              )}
            </div>
          )}

          {event.createdAt && (
            <p style={{ margin: 0, fontSize: 11, color: "#cbd5e1" }}>
              Creado el{" "}
              {new Date(Number(event.createdAt) || event.createdAt).toLocaleDateString("es-CR")}
            </p>
          )}
        </div>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        {isAdmin ? (
          <div
            style={{
              flexShrink: 0,
              padding: "12px 20px",
              borderTop: "1px solid #f8fafc",
              display: "flex",
              alignItems: "center",
              background: "#ffffff",
              gap: 10,
            }}
          >
            {isMobile && (
              <button
                onClick={handleClose}
                style={{
                  flex: 1,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#64748b",
                  padding: "10px",
                  borderRadius: 12,
                  border: "1.5px solid #f1f5f9",
                  background: "#f8fafc",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Cerrar
              </button>
            )}
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
                padding: "10px 16px",
                borderRadius: 12,
                border: "1.5px solid #fecaca",
                background: "#fff1f2",
                color: "#ef4444",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <TrashIcon /> Eliminar
            </button>
            <button
              onClick={() => {
                onEdit(event);
                handleClose();
              }}
              style={{
                flex: isMobile ? 1 : "none",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                fontSize: 13,
                fontWeight: 700,
                padding: "10px 20px",
                borderRadius: 12,
                border: "none",
                background: "#0f172a",
                color: "#ffffff",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <EditIcon /> Editar
            </button>
          </div>
        ) : (
          isMobile && (
            <div style={{ flexShrink: 0, padding: "12px 20px", borderTop: "1px solid #f8fafc" }}>
              <button
                onClick={handleClose}
                style={{
                  width: "100%",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#64748b",
                  padding: "11px",
                  borderRadius: 12,
                  border: "1.5px solid #f1f5f9",
                  background: "#f8fafc",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Cerrar
              </button>
            </div>
          )
        )}
      </div>
    </>,
    document.body
  );
}

// ─── Chip (info cell) ─────────────────────────────────────────────────────────
function Chip({ icon, label, value, wide, accent }) {
  return (
    <div
      style={{
        gridColumn: wide ? "span 2" : "span 1",
        padding: "10px 12px",
        borderRadius: 12,
        background: "#f8fafc",
        border: "1px solid #f1f5f9",
        minWidth: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
        <span style={{ color: accent, display: "flex", opacity: 0.7 }}>{icon}</span>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
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
Chip.propTypes = {
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  wide: PropTypes.bool,
  accent: PropTypes.string,
};

// Icons
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
  <svg
    width="11"
    height="11"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="2.5"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25"
    />
  </svg>
);
const ClockIcon = () => (
  <svg
    width="11"
    height="11"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="2.5"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
    />
  </svg>
);
const PinIcon = () => (
  <svg
    width="11"
    height="11"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="2.5"
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
    />
  </svg>
);
const BusIcon = () => (
  <svg
    width="11"
    height="11"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="2.5"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
    />
  </svg>
);
const HomeIcon = () => (
  <svg
    width="11"
    height="11"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="2.5"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
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

EventDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  event: PropTypes.object,
  isAdmin: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
