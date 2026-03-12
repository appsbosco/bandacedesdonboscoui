import PropTypes from "prop-types";

export function WelcomeHeader({ user, isAdmin, onAddEvent }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches";
  const firstName = user?.name ?? "músico";
  const today = new Date().toLocaleDateString("es-CR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const [weekday, ...rest] = today.split(", ");
  const datePart = rest.join(", ");

  return (
    <div style={{ background: "#ffffff", borderBottom: "1px solid #f0f0f0", marginBottom: 0 }}>
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "28px 24px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <p
            style={{
              margin: "0 0 4px",
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "#a1a1a1",
            }}
          >
            Banda CEDES Don Bosco &nbsp;·&nbsp; {weekday.charAt(0).toUpperCase() + weekday.slice(1)}
          </p>
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(22px, 3.5vw, 34px)",
              fontWeight: 700,
              color: "#111111",
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
              fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif",
            }}
          >
            {greeting}, <span style={{ color: "#111111" }}>{firstName}</span>
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "#b0b0b0", letterSpacing: "0.01em" }}>
            {datePart.charAt(0).toUpperCase() + datePart.slice(1)}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={onAddEvent}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "10px 18px",
              borderRadius: 12,
              border: "1.5px solid #e5e5e5",
              background: "#ffffff",
              color: "#111111",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              letterSpacing: "-0.01em",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
              transition: "background 0.12s, border-color 0.12s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f7f7f7";
              e.currentTarget.style.borderColor = "#d0d0d0";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#ffffff";
              e.currentTarget.style.borderColor = "#e5e5e5";
            }}
          >
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: 6,
                background: "#111111",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg
                width="9"
                height="9"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="3"
                stroke="#ffffff"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </span>
            Nuevo evento
          </button>
        )}
      </div>
    </div>
  );
}

WelcomeHeader.propTypes = {
  user: PropTypes.shape({ name: PropTypes.string }),
  isAdmin: PropTypes.bool,
  onAddEvent: PropTypes.func.isRequired,
};
