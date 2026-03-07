/**
 * EventHighlights.jsx
 *
 * Reemplaza StatsRow con dos componentes:
 *   1. NextEventBanner  — cuenta regresiva del próximo evento
 *   2. MonthTimeline    — timeline horizontal del mes actual
 *
 * USO en Dashboard.jsx:
 *   import { NextEventBanner, MonthTimeline } from "components/events/EventHighlights";
 *
 *   // Reemplazar <StatsRow ... /> con:
 *   <NextEventBanner event={upcomingEvents[0]} />
 *   <MonthTimeline events={upcomingEvents} />
 */

import PropTypes from "prop-types";
import { useMemo } from "react";

// ─── helpers ──────────────────────────────────────────────────────────────────
function getDaysUntil(dateMs) {
  return Math.ceil((new Date(Number(dateMs)) - new Date()) / (1000 * 60 * 60 * 24));
}

function formatShortDate(dateMs) {
  return new Date(Number(dateMs)).toLocaleDateString("es-CR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

// ─── NextEventBanner ──────────────────────────────────────────────────────────
/**
 * Banner del próximo evento. Muestra días/horas/minutos restantes.
 * Si no hay evento próximo, no renderiza nada.
 */
export function NextEventBanner({ event }) {
  if (!event) return null;

  const days = getDaysUntil(event.date);
  const isToday = days === 0;
  const isTomorrow = days === 1;
  const isUrgent = days <= 3;

  // Colores según urgencia
  const accent = isToday
    ? { bg: "#dc2626", text: "#fff", soft: "#fef2f2", label: "#dc2626" }
    : isTomorrow
    ? { bg: "#ea580c", text: "#fff", soft: "#fff7ed", label: "#ea580c" }
    : isUrgent
    ? { bg: "#d97706", text: "#fff", soft: "#fffbeb", label: "#d97706" }
    : { bg: "#0f172a", text: "#fff", soft: "#f8fafc", label: "#0f172a" };

  return (
    <div
      style={{
        background: "#ffffff",
        border: `1px solid #f0f0f0`,
        borderRadius: 18,
        padding: "20px 22px",
        marginTop: 20,
        display: "flex",
        alignItems: "center",
        gap: 20,
        flexWrap: "wrap",
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Acento izquierdo */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          background: accent.bg,
          borderRadius: "18px 0 0 18px",
        }}
      />

      {/* Countdown pill */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: accent.soft,
          borderRadius: 14,
          padding: "14px 22px",
          minWidth: 90,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: isToday || isTomorrow ? 20 : 34,
            fontWeight: 800,
            color: accent.label,
            lineHeight: 1,
            letterSpacing: "-0.04em",
            fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif",
          }}
        >
          {isToday ? "¡HOY!" : isTomorrow ? "MAÑANA" : days}
        </span>
        {!isToday && !isTomorrow && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: accent.label,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginTop: 2,
              opacity: 0.8,
            }}
          >
            días
          </span>
        )}
      </div>

      {/* Info del evento */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: "0 0 3px",
            fontSize: 10,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "#94a3b8",
          }}
        >
          Próximo evento
        </p>
        <p
          style={{
            margin: "0 0 4px",
            fontSize: 16,
            fontWeight: 700,
            color: "#0f172a",
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {event.name}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", marginTop: 2 }}>
          {event.type && (
            <span style={{ fontSize: 12, color: "#475569", fontWeight: 500 }}>🎵 {event.type}</span>
          )}
          {event.location && (
            <span style={{ fontSize: 12, color: "#475569", fontWeight: 500 }}>
              📍 {event.location}
            </span>
          )}
          <span style={{ fontSize: 12, color: "#94a3b8" }}>
            {formatShortDate(event.date)}
            {event.time ? ` · ${event.time}` : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
NextEventBanner.propTypes = {
  event: PropTypes.object,
};

// ─── MonthTimeline ────────────────────────────────────────────────────────────
/**
 * Timeline horizontal del mes. Marca hoy con una línea vertical,
 * y pone puntos de colores por categoría de evento.
 */
const CATEGORY_COLOR = {
  presentation: "#2563eb",
  rehearsal: "#7c3aed",
  activity: "#059669",
  other: "#d97706",
};

const CATEGORY_EMOJI = {
  presentation: "🎵",
  rehearsal: "🎼",
  activity: "🎉",
  other: "📌",
};

function resolveCategory(event) {
  const cat = (event.category ?? "").toLowerCase();
  if (cat === "presentation") return "presentation";
  if (cat === "rehearsal") return "rehearsal";
  if (cat === "activity") return "activity";
  return "other";
}

export function MonthTimeline({ events }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayDay = today.getDate();

  // Solo eventos de este mes
  const monthEvents = useMemo(() => {
    return events.filter((e) => {
      const d = new Date(Number(e.date));
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [events, year, month]);

  // Agrupar por día
  const byDay = useMemo(() => {
    const map = {};
    monthEvents.forEach((e) => {
      const day = new Date(Number(e.date)).getDate();
      if (!map[day]) map[day] = [];
      map[day].push(e);
    });
    return map;
  }, [monthEvents]);

  const monthName = today.toLocaleDateString("es-CR", { month: "long", year: "numeric" });
  const todayPct = ((todayDay - 0.5) / daysInMonth) * 100;

  // Días con eventos para mostrar en la leyenda inferior
  const eventDays = Object.keys(byDay)
    .map(Number)
    .sort((a, b) => a - b);

  if (monthEvents.length === 0) return null;

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #f0f0f0",
        borderRadius: 18,
        padding: "18px 22px 16px",
        marginTop: 10,
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "#94a3b8",
          }}
        >
          {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
        </p>
        <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>
          {monthEvents.length} evento{monthEvents.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Timeline track */}
      <div style={{ position: "relative", height: 36 }}>
        {/* Fondo del track */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            right: 0,
            height: 2,
            background: "#f1f5f9",
            borderRadius: 99,
            transform: "translateY(-50%)",
          }}
        />

        {/* Progreso hasta hoy */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            width: `${todayPct}%`,
            height: 2,
            background: "#cbd5e1",
            borderRadius: 99,
            transform: "translateY(-50%)",
          }}
        />

        {/* Línea de HOY */}
        <div
          style={{
            position: "absolute",
            left: `${todayPct}%`,
            top: 0,
            bottom: 0,
            width: 2,
            background: "#0f172a",
            borderRadius: 99,
            transform: "translateX(-50%)",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: -18,
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: 9,
              fontWeight: 700,
              color: "#0f172a",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              whiteSpace: "nowrap",
            }}
          >
            hoy
          </span>
        </div>

        {/* Puntos de eventos */}
        {Object.entries(byDay).map(([dayStr, evts]) => {
          const day = Number(dayStr);
          const pct = ((day - 0.5) / daysInMonth) * 100;
          const isPast = day < todayDay;
          const isEventToday = day === todayDay;
          // Tomar color del primer evento del día
          const cat = resolveCategory(evts[0]);
          const color = CATEGORY_COLOR[cat];
          const count = evts.length;

          return (
            <div
              key={day}
              title={evts.map((e) => e.name).join(" · ")}
              style={{
                position: "absolute",
                left: `${pct}%`,
                top: "50%",
                transform: "translate(-50%, -50%)",
                width: isEventToday ? 14 : 10,
                height: isEventToday ? 14 : 10,
                borderRadius: "50%",
                background: isPast ? "#cbd5e1" : color,
                border: isEventToday ? `2px solid ${color}` : "2px solid #fff",
                boxShadow: isEventToday ? `0 0 0 3px ${color}33` : "none",
                cursor: "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "transform 0.15s",
              }}
            >
              {count > 1 && (
                <span
                  style={{
                    position: "absolute",
                    top: -8,
                    right: -6,
                    fontSize: 8,
                    fontWeight: 700,
                    background: color,
                    color: "#fff",
                    borderRadius: 99,
                    padding: "0 3px",
                    lineHeight: "12px",
                    minWidth: 12,
                    textAlign: "center",
                  }}
                >
                  {count}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Etiquetas de días con eventos */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "6px 8px",
          marginTop: 12,
          borderTop: "1px solid #f8fafc",
          paddingTop: 12,
        }}
      >
        {eventDays.map((day) => {
          const evts = byDay[day];
          const cat = resolveCategory(evts[0]);
          const color = CATEGORY_COLOR[cat];
          const emoji = CATEGORY_EMOJI[cat];
          const isPast = day < todayDay;
          const d = new Date(year, month, day);
          const label = d.toLocaleDateString("es-CR", { weekday: "short", day: "numeric" });

          return (
            <div
              key={day}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11,
                fontWeight: 500,
                color: isPast ? "#94a3b8" : "#334155",
                background: isPast ? "#f8fafc" : `${color}11`,
                border: `1px solid ${isPast ? "#f1f5f9" : `${color}33`}`,
                borderRadius: 8,
                padding: "4px 8px",
              }}
            >
              <span style={{ fontSize: 10 }}>{emoji}</span>
              <span style={{ color: isPast ? "#94a3b8" : color, fontWeight: 700 }}>
                {label.charAt(0).toUpperCase() + label.slice(1)}
              </span>
              {evts.length > 1 && <span style={{ color: "#94a3b8" }}>·{evts.length}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
MonthTimeline.propTypes = {
  events: PropTypes.array.isRequired,
};
