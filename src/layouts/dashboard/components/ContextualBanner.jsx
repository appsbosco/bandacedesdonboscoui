/**
 * ContextualBanner.jsx
 *
 * Reemplaza StatsRow con una frase inteligente y contextual
 * que cambia según cuándo es el próximo evento.
 *
 * USO en Dashboard.jsx:
 *   import ContextualBanner from "components/events/ContextualBanner";
 *
 *   // Reemplazar <StatsRow ... /> con:
 *   <ContextualBanner
 *     upcomingEvents={upcomingEvents}
 *     rehearsals={eventsByTab.rehearsal}
 *   />
 */

import PropTypes from "prop-types";
import { useMemo } from "react";

function getDaysUntil(dateMs) {
  return Math.ceil((new Date(Number(dateMs)) - new Date()) / (1000 * 60 * 60 * 24));
}

function getNextRehearsalBeforeEvent(rehearsals, eventDateMs) {
  return rehearsals.filter((r) => {
    const d = Number(r.date);
    return d >= Date.now() && d < Number(eventDateMs);
  });
}

function buildPhrase({ nextEvent, rehearsalsBeforeEvent, totalEvents }) {
  if (!nextEvent) {
    return {
      main: "Sin presentaciones próximas — buen momento para ensayar.",
      urgency: "neutral",
    };
  }

  const days = getDaysUntil(nextEvent.date);
  const name = nextEvent.name ?? "el próximo evento";
  const rehearsalCount = rehearsalsBeforeEvent.length;
  const rehearsalText =
    rehearsalCount === 0
      ? "sin ensayos programados antes"
      : rehearsalCount === 1
      ? "1 ensayo en el camino"
      : `${rehearsalCount} ensayos en el camino`;

  if (days < 0) {
    return { main: "No hay presentaciones próximas por ahora.", urgency: "neutral" };
  }

  if (days === 0) {
    const timeText = nextEvent.time ? ` a las ${nextEvent.time}` : "";
    return {
      main: `¡Hoy es el día — ${name}${timeText}!`,
      urgency: "today",
    };
  }

  if (days === 1) {
    return {
      main: `¡Mañana es ${name}! ${
        rehearsalText === "sin ensayos programados antes"
          ? "Todo listo."
          : `Último día de preparación.`
      }`,
      urgency: "urgent",
    };
  }

  if (days <= 7) {
    return {
      main: `En ${days} días es ${name} — ${rehearsalText}.`,
      urgency: "urgent",
    };
  }

  if (days <= 30) {
    return {
      main: `Quedan ${days} días para ${name} — ${rehearsalText}.`,
      urgency: "soon",
    };
  }

  return {
    main: `${name} se acerca — ${days} días y ${rehearsalText}.`,
    urgency: "calm",
  };
}

const URGENCY_STYLES = {
  today: { bar: "#dc2626", dot: "#dc2626", text: "#7f1d1d" },
  urgent: { bar: "#ea580c", dot: "#ea580c", text: "#7c2d12" },
  soon: { bar: "#0f172a", dot: "#0f172a", text: "#0f172a" },
  calm: { bar: "#64748b", dot: "#64748b", text: "#334155" },
  neutral: { bar: "#cbd5e1", dot: "#94a3b8", text: "#64748b" },
};

export default function ContextualBanner({ upcomingEvents, rehearsals }) {
  const nextPresentation = useMemo(
    () =>
      upcomingEvents.find((e) => (e.category ?? "").toLowerCase() === "presentation") ??
      upcomingEvents[0] ??
      null,
    [upcomingEvents]
  );

  const rehearsalsBeforeEvent = useMemo(
    () => (nextPresentation ? getNextRehearsalBeforeEvent(rehearsals, nextPresentation.date) : []),
    [rehearsals, nextPresentation]
  );

  const { main, urgency } = useMemo(
    () =>
      buildPhrase({
        nextEvent: nextPresentation,
        rehearsalsBeforeEvent,
        totalEvents: upcomingEvents.length,
      }),
    [nextPresentation, rehearsalsBeforeEvent, upcomingEvents.length]
  );

  const style = URGENCY_STYLES[urgency];

  const today = new Date();
  const monthLabel = today.toLocaleDateString("es-CR", { month: "long", year: "numeric" });
  const totalLabel =
    upcomingEvents.length === 0
      ? "Sin eventos próximos"
      : upcomingEvents.length === 1
      ? "1 evento próximo"
      : `${upcomingEvents.length} eventos próximos`;

  return (
    <div
      style={{
        marginTop: 20,
        padding: "20px 22px",
        background: "#ffffff",
        border: "1px solid #f0f0f0",
        borderRadius: 16,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        display: "flex",
        alignItems: "center",
        gap: 18,
      }}
    >
      {/* Dot de urgencia */}
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: style.dot,
          flexShrink: 0,
          marginTop: 1,
          boxShadow:
            urgency === "today" || urgency === "urgent" ? `0 0 0 3px ${style.dot}22` : "none",
        }}
      />

      {/* Texto */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: "clamp(13px, 1.8vw, 15px)",
            fontWeight: 600,
            color: style.text,
            letterSpacing: "-0.01em",
            lineHeight: 1.4,
          }}
        >
          {main}
        </p>

        {/* Meta secundaria */}
        <p style={{ margin: "5px 0 0", fontSize: 11, color: "#94a3b8", fontWeight: 400 }}>
          {monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}
          &nbsp;·&nbsp;
          {totalLabel}
        </p>
      </div>
    </div>
  );
}

ContextualBanner.propTypes = {
  upcomingEvents: PropTypes.array.isRequired,
  rehearsals: PropTypes.array.isRequired,
};
