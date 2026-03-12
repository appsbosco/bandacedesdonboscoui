import PropTypes from "prop-types";

export function EmptyState({ isAdmin, onAddEvent }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 20,
        border: "2px dashed #e2e8f0",
        padding: "48px 24px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 48, marginBottom: 12 }}>🎵</div>
      <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
        Sin eventos próximos
      </h3>
      <p
        style={{
          margin: "0 0 20px",
          fontSize: 13,
          color: "#94a3b8",
          maxWidth: 280,
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        No hay eventos programados en esta categoría.
      </p>
      {isAdmin && (
        <button
          onClick={onAddEvent}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            fontWeight: 700,
            padding: "10px 20px",
            borderRadius: 12,
            border: "none",
            background: "#0f172a",
            color: "#fff",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          <svg
            width="14"
            height="14"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2.5"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Crear evento
        </button>
      )}
    </div>
  );
}

EmptyState.propTypes = { isAdmin: PropTypes.bool, onAddEvent: PropTypes.func.isRequired };
