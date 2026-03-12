// src/layouts/dashboard/components/StatsRow.jsx
import PropTypes from "prop-types";

// getDaysUntil duplicado localmente para no crear dependencia circular
// con Dashboard.jsx. Es una función pura de 1 línea.
function getDaysUntil(dateMs) {
  return Math.ceil((new Date(Number(dateMs)) - new Date()) / (1000 * 60 * 60 * 24));
}

export function StatsRow({ presentations }) {
  const today = new Date();

  const thisMonth = presentations.filter((e) => {
    const d = new Date(Number(e.date));
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  }).length;

  const next = presentations[0];
  const daysToNext = next ? Math.max(0, getDaysUntil(next.date)) : null;
  const bands = new Set(presentations.map((e) => e.type).filter(Boolean)).size;
  const isUrgent = daysToNext !== null && daysToNext <= 7;

  const stats = [
    {
      n: presentations.length,
      label: "Presentaciones",
      sub: "próximas",
      accentColor: "#2563eb",
      accentBg: "#eff6ff",
      icon: (
        <svg
          width="15"
          height="15"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
          />
        </svg>
      ),
    },
    {
      n: thisMonth,
      label: "Este mes",
      sub: "presentaciones",
      accentColor: "#7c3aed",
      accentBg: "#f5f3ff",
      icon: (
        <svg
          width="15"
          height="15"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
          />
        </svg>
      ),
    },
    {
      n: daysToNext !== null ? daysToNext : "—",
      label:
        daysToNext === 0
          ? "¡Hoy!"
          : daysToNext === 1
          ? "Mañana"
          : daysToNext !== null
          ? `${daysToNext} días`
          : "Sin fecha",
      sub: "próxima presentación",
      accentColor: isUrgent ? "#dc2626" : "#d97706",
      accentBg: isUrgent ? "#fef2f2" : "#fffbeb",
      icon: (
        <svg
          width="15"
          height="15"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      n: bands,
      label: "Agrupaciones",
      sub: "participando",
      accentColor: "#059669",
      accentBg: "#ecfdf5",
      icon: (
        <svg
          width="15"
          height="15"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: 8,
        marginTop: 20,
      }}
      className="lg:grid-cols-4"
    >
      {stats.map((s, i) => (
        <div
          key={i}
          style={{
            background: "#ffffff",
            borderRadius: 16,
            padding: "16px 18px",
            border: "1px solid #f0f0f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            display: "flex",
            flexDirection: "column",
            gap: 0,
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 9,
              background: s.accentBg,
              color: s.accentColor,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
              flexShrink: 0,
            }}
          >
            {s.icon}
          </div>

          {/* Number */}
          <p
            style={{
              margin: 0,
              fontSize: "clamp(24px, 2.8vw, 32px)",
              fontWeight: 700,
              color: "#111111",
              letterSpacing: "-0.04em",
              lineHeight: 1,
              fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif",
            }}
          >
            {s.n}
          </p>

          {/* Label */}
          <p
            style={{
              margin: "6px 0 2px",
              fontSize: 12,
              fontWeight: 600,
              color: "#333333",
              letterSpacing: "-0.01em",
            }}
          >
            {s.label}
          </p>

          {/* Sub */}
          <p style={{ margin: 0, fontSize: 11, color: "#b0b0b0", fontWeight: 400 }}>{s.sub}</p>
        </div>
      ))}
    </div>
  );
}

StatsRow.propTypes = {
  presentations: PropTypes.array.isRequired,
};
