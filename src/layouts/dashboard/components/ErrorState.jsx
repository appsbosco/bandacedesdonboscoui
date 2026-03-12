import PropTypes from "prop-types";

export function ErrorState({ msg }) {
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 20,
          padding: 32,
          textAlign: "center",
          maxWidth: 360,
          border: "1px solid #fecaca",
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
        <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
          Error cargando datos
        </h3>
        <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>{msg}</p>
      </div>
    </div>
  );
}

ErrorState.propTypes = { msg: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired };
