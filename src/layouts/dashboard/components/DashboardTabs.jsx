// src/layouts/dashboard/components/DashboardTabs.jsx
import PropTypes from "prop-types";
import { TABS, BAND_COLORS } from "../constants"; // ← fix: desde constants, no desde ../Dashboard

// ─── BandPill (local, no necesita ser exportado) ──────────────────────────────
function BandPill({ label, active, dot, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 11,
        fontWeight: 600,
        padding: "5px 12px",
        borderRadius: 99,
        border: `1.5px solid ${active ? "#0f172a" : "#e2e8f0"}`,
        background: active ? "#0f172a" : "#fff",
        color: active ? "#fff" : "#475569",
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      {active && dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: dot,
            display: "inline-block",
          }}
        />
      )}
      {label}
    </button>
  );
}

BandPill.propTypes = {
  label: PropTypes.string.isRequired,
  active: PropTypes.bool,
  dot: PropTypes.string,
  onClick: PropTypes.func.isRequired,
};

// ─── DashboardTabs ────────────────────────────────────────────────────────────
export function DashboardTabs({
  activeTab,
  eventsByTab,
  availableBands,
  bandFilter,
  filteredEvents,
  onTabChange,
  onBandFilterChange,
}) {
  return (
    <div style={{ marginTop: 32 }}>
      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          background: "#f1f5f9",
          borderRadius: 14,
          padding: 4,
          gap: 2,
          overflowX: "auto",
        }}
      >
        {TABS.map((tab) => {
          const count = eventsByTab[tab.key]?.length ?? 0;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              style={{
                flex: 1,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "9px 14px",
                borderRadius: 11,
                border: "none",
                background: active ? "#ffffff" : "transparent",
                color: active ? "#0f172a" : "#64748b",
                fontSize: 12,
                fontWeight: active ? 700 : 500,
                cursor: "pointer",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
                transition: "all 0.15s",
                boxShadow: active ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}
            >
              <span style={{ fontSize: 14 }}>{tab.emoji}</span>
              <span>{tab.label}</span>
              {count > 0 && (
                <span
                  style={{
                    minWidth: 18,
                    height: 18,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 99,
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "0 5px",
                    background: active ? "#0f172a" : "#e2e8f0",
                    color: active ? "#ffffff" : "#64748b",
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filtro de banda — solo visible en tab de presentaciones con 2+ bandas */}
      {activeTab === "presentation" && availableBands.length > 1 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
          <BandPill
            label="Todas"
            active={bandFilter === "all"}
            onClick={() => onBandFilterChange("all")}
          />
          {availableBands.map((band) => (
            <BandPill
              key={band}
              label={band}
              active={bandFilter === band}
              dot={BAND_COLORS[band]?.dot}
              onClick={() => onBandFilterChange(band === bandFilter ? "all" : band)}
            />
          ))}
        </div>
      )}

      {/* Conteo de resultados */}
      <p style={{ margin: "14px 0 16px", fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>
        {filteredEvents.length === 0
          ? "Sin eventos próximos en esta categoría"
          : `${filteredEvents.length} evento${filteredEvents.length !== 1 ? "s" : ""} próximo${
              filteredEvents.length !== 1 ? "s" : ""
            }`}
      </p>
    </div>
  );
}

DashboardTabs.propTypes = {
  activeTab: PropTypes.string.isRequired,
  eventsByTab: PropTypes.object.isRequired,
  availableBands: PropTypes.array.isRequired,
  bandFilter: PropTypes.string.isRequired,
  filteredEvents: PropTypes.array.isRequired,
  onTabChange: PropTypes.func.isRequired,
  onBandFilterChange: PropTypes.func.isRequired,
};
