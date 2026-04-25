/* eslint-disable react/prop-types */
import { useState, useMemo } from "react";
import { useTourDocuments } from "./useTourDocuments";
import DocumentEditModal from "./DocumentEditModal";
import DocumentDetailDrawer from "./DocumentDetailDrawer";
import { Toast } from "../TourHelpers";
import {
  getExpiryStatus,
  getDaysUntilExpiry,
  EXPIRY_WARNING_DAYS,
} from "../utils/tourAgeRules";

// ── Constants ─────────────────────────────────────────────────────────────────

const OVERALL_STATUS_CONFIG = {
  COMPLETE: { label: "Completo", bg: "#ECFDF5", color: "#065F46", border: "#A7F3D0", dot: "#10B981" },
  INCOMPLETE: { label: "Incompleto", bg: "#FFFBEB", color: "#92400E", border: "#FDE68A", dot: "#F59E0B" },
  EXPIRED: { label: "Vencido", bg: "#FEF2F2", color: "#991B1B", border: "#FECACA", dot: "#EF4444" },
  EXPIRING: { label: "Por vencer", bg: "#FFF7ED", color: "#9A3412", border: "#FED7AA", dot: "#F97316" },
};

const EXPIRY_STATUS_STYLES = {
  ok: { color: "#059669" },
  warning: { color: "#D97706" },
  expired: { color: "#DC2626", fontWeight: 700 },
  missing: { color: "#9CA3AF" },
};

const STATUS_FILTERS = [
  { value: "ALL", label: "Todos" },
  { value: "COMPLETE", label: "Completos" },
  { value: "INCOMPLETE", label: "Incompletos" },
  { value: "EXPIRED", label: "Vencidos" },
  { value: "EXPIRING", label: "Por vencer" },
];

// Quick filter definitions — each has a key and a predicate(participant, refDate)
const QUICK_FILTERS = [
  // Passport
  {
    key: "noPassport",
    label: "Sin pasaporte",
    emoji: "🔴",
    category: "passport",
    test: (p) => !p.passportNumber,
  },
  {
    key: "passportExpired",
    label: "Pasaporte vencido",
    emoji: "❌",
    category: "passport",
    test: (p) => p.passportNumber && getExpiryStatus(p.passportExpiry) === "expired",
  },
  {
    key: "passportExpiring",
    label: `Pasaporte por vencer (≤${EXPIRY_WARNING_DAYS}d)`,
    emoji: "⚠️",
    category: "passport",
    test: (p) => p.passportNumber && getExpiryStatus(p.passportExpiry) === "warning",
  },
  {
    key: "noPassportExpiry",
    label: "Sin fecha venc. pasaporte",
    emoji: "📅",
    category: "passport",
    test: (p) => p.passportNumber && !p.passportExpiry,
  },
  // Visa
  {
    key: "noVisa",
    label: "Sin visa",
    emoji: "🔵",
    category: "visa",
    test: (p) => !p.hasVisa,
  },
  {
    key: "hasVisa",
    label: "Con visa",
    emoji: "✅",
    category: "visa",
    test: (p) => p.hasVisa,
  },
  {
    key: "visaDenied",
    label: "Visa negada",
    emoji: "🛑",
    category: "visa",
    test: (p) => p.visaStatus === "DENIED",
  },
  {
    key: "visaDeniedFirst",
    label: "1ra negativa",
    emoji: "1️⃣",
    category: "visa",
    test: (p) => p.visaStatus === "DENIED" && p.visaDeniedCount === 1,
  },
  {
    key: "visaDeniedSecond",
    label: "2da negativa",
    emoji: "2️⃣",
    category: "visa",
    test: (p) => p.visaStatus === "DENIED" && p.visaDeniedCount === 2,
  },
  {
    key: "visaDeniedMulti",
    label: "3+ negativas",
    emoji: "3️⃣",
    category: "visa",
    test: (p) => p.visaStatus === "DENIED" && p.visaDeniedCount >= 3,
  },
  {
    key: "visaExpired",
    label: "Visa vencida",
    emoji: "❌",
    category: "visa",
    test: (p) => p.hasVisa && getExpiryStatus(p.visaExpiry) === "expired",
  },
  {
    key: "visaExpiring",
    label: `Visa por vencer (≤${EXPIRY_WARNING_DAYS}d)`,
    emoji: "⚠️",
    category: "visa",
    test: (p) => p.hasVisa && getExpiryStatus(p.visaExpiry) === "warning",
  },
  {
    key: "noVisaExpiry",
    label: "Sin fecha venc. visa",
    emoji: "📅",
    category: "visa",
    test: (p) => p.hasVisa && !p.visaExpiry,
  },
  // Exit permit
  {
    key: "missingPermit",
    label: "Falta permiso salida",
    emoji: "🚨",
    category: "permit",
    test: (p) => p._exitRequired && !p.hasExitPermit,
  },
  {
    key: "hasPermit",
    label: "Con permiso salida",
    emoji: "✅",
    category: "permit",
    test: (p) => p._exitRequired && p.hasExitPermit,
  },
  // Age
  {
    key: "adults",
    label: "Adultos",
    emoji: "🧑",
    category: "age",
    test: (p) => p._isAdult === true,
  },
  {
    key: "minors",
    label: "Menores de edad",
    emoji: "👶",
    category: "age",
    test: (p) => p._isAdult === false,
  },
  {
    key: "noBirthDate",
    label: "Sin fecha nacimiento",
    emoji: "❓",
    category: "age",
    test: (p) => !p.birthDate,
  },
];

const CATEGORY_LABELS = {
  passport: "Pasaporte",
  visa: "Visa",
  permit: "Permiso salida",
  age: "Edad",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function participantName(p) {
  return [p.firstName, p.firstSurname, p.secondSurname].filter(Boolean).join(" ");
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatRefDate(date) {
  if (!date) return null;
  return new Date(date).toLocaleDateString("es-CR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ExpiryCell({ date }) {
  const status = getExpiryStatus(date);
  const days = getDaysUntilExpiry(date);
  const style = EXPIRY_STATUS_STYLES[status];

  if (status === "missing") {
    return <span style={{ fontSize: "10px", color: "#9CA3AF" }}>Sin fecha</span>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <span style={{ fontSize: "10px", color: "#4B5563" }}>{formatDate(date)}</span>
      <span style={{ fontSize: "10px", ...style }}>
        {days >= 0 ? `${days}d` : `Vencido ${Math.abs(days)}d`}
      </span>
    </div>
  );
}

function PermitCell({ participant }) {
  const { _exitRequired, _isAdult, hasExitPermit } = participant;

  if (_isAdult === true) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <span style={{ fontSize: "11px", color: "#9CA3AF" }}>N/A</span>
        <span style={{ fontSize: "10px", color: "#059669" }}>Adulto</span>
      </div>
    );
  }

  if (!_exitRequired) {
    return <span style={{ fontSize: "11px", color: "#9CA3AF" }}>N/A</span>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      {hasExitPermit ? (
        <>
          <span style={{ color: "#059669", fontWeight: 700, fontSize: "14px" }}>✓</span>
          <span style={{ fontSize: "10px", color: "#059669" }}>Tiene</span>
        </>
      ) : (
        <>
          <span style={{ color: "#F87171", fontWeight: 700, fontSize: "14px" }}>✗</span>
          <span style={{ fontSize: "10px", color: "#EF4444" }}>Falta</span>
        </>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = OVERALL_STATUS_CONFIG[status] || OVERALL_STATUS_CONFIG.INCOMPLETE;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "2px 8px",
        borderRadius: "9999px",
        fontSize: "10px",
        fontWeight: 600,
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: cfg.dot,
          flexShrink: 0,
        }}
      />
      {cfg.label}
    </span>
  );
}

function VisaStatusBadge({ participant }) {
  const isDenied = participant.visaStatus === "DENIED";
  const label =
    participant.visaStatus === "DENIED"
      ? "Visa negada"
      : participant.visaStatus === "APPROVED"
      ? "Aprobada"
      : participant.visaStatus === "EXPIRED"
      ? "Vencida"
      : participant.visaStatus === "PENDING"
      ? "Pendiente"
      : "Sin definir";

  const palette = isDenied
    ? { bg: "#FEF2F2", color: "#B91C1C", border: "#FECACA" }
    : participant.visaStatus === "APPROVED"
    ? { bg: "#ECFDF5", color: "#047857", border: "#A7F3D0" }
    : { bg: "#F9FAFB", color: "#6B7280", border: "#E5E7EB" };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "3px 8px",
          borderRadius: "9999px",
          border: `1px solid ${palette.border}`,
          background: palette.bg,
          color: palette.color,
          fontSize: "10px",
          fontWeight: 700,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
      {participant._visaDeniedLabel && (
        <span style={{ fontSize: "10px", color: isDenied ? "#B91C1C" : "#9CA3AF", fontWeight: 700 }}>
          {participant._visaDeniedLabel}
        </span>
      )}
    </div>
  );
}

function FilterChip({ filter, active, count, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "4px 10px",
        borderRadius: "9999px",
        fontSize: "11px",
        fontWeight: 600,
        border: `1px solid ${active ? "#6366F1" : "#E5E7EB"}`,
        background: active ? "#EEF2FF" : "#fff",
        color: active ? "#4338CA" : "#6B7280",
        cursor: "pointer",
        transition: "all 0.15s",
        whiteSpace: "nowrap",
      }}
    >
      <span>{filter.emoji}</span>
      <span>{filter.label}</span>
      {count !== undefined && (
        <span
          style={{
            background: active ? "#6366F1" : "#E5E7EB",
            color: active ? "#fff" : "#374151",
            borderRadius: "9999px",
            padding: "0 5px",
            fontSize: "10px",
            fontWeight: 700,
            minWidth: "16px",
            textAlign: "center",
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TourDocumentsPage({ tourId, tourName, tour }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [activeQuickFilters, setActiveQuickFilters] = useState(new Set());
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const {
    participants,
    loading,
    error,
    refDate,
    hasRefDate,
    docCounts,
    detailParticipant,
    openDetail,
    closeDetail,
    editParticipant,
    openEdit,
    closeEdit,
    handleSave,
    saving,
    toast,
    setToast,
  } = useTourDocuments(tourId, tour);

  // Enrich with _isAdult for filter predicates
  const enriched = useMemo(
    () =>
      participants.map((p) => ({
        ...p,
        _isAdult: p._exitRequired === false && !!p.birthDate && !!refDate
          ? true
          : p._exitRequired === true
          ? false
          : !p.birthDate
          ? null
          : null,
      })),
    [participants, refDate]
  );

  // Compute counts per quick filter on all participants (for badges)
  const quickFilterCounts = useMemo(() => {
    const counts = {};
    QUICK_FILTERS.forEach((f) => {
      counts[f.key] = enriched.filter((p) => f.test(p)).length;
    });
    return counts;
  }, [enriched]);

  const toggleQuickFilter = (key) => {
    setActiveQuickFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const clearAllFilters = () => {
    setActiveQuickFilters(new Set());
    setStatusFilter("ALL");
    setSearch("");
  };

  const filtered = useMemo(() => {
    return enriched.filter((p) => {
      if (statusFilter !== "ALL" && p._docStatus !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const name = participantName(p).toLowerCase();
        if (!name.includes(q) && !p.identification?.toLowerCase().includes(q)) return false;
      }
      // All active quick filters must pass (AND logic)
      for (const key of activeQuickFilters) {
        const f = QUICK_FILTERS.find((qf) => qf.key === key);
        if (f && !f.test(p)) return false;
      }
      return true;
    });
  }, [enriched, statusFilter, search, activeQuickFilters]);

  const hasActiveFilters = activeQuickFilters.size > 0 || statusFilter !== "ALL" || search;

  // Group quick filters by category
  const filtersByCategory = useMemo(() => {
    const groups = {};
    QUICK_FILTERS.forEach((f) => {
      if (!groups[f.category]) groups[f.category] = [];
      groups[f.category].push(f);
    });
    return groups;
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div>
        <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#111827" }}>
          Documentos de la gira
        </h2>
        <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6B7280" }}>
          Pasaportes, visas y permisos de salida de{" "}
          <strong>{tourName}</strong>
        </p>
        <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#2563EB" }}>
          Los participantes vinculados sincronizan pasaporte, visa y permiso desde Documents.
        </p>
        {hasRefDate ? (
          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#059669" }}>
            ✓ Fecha referencia: {formatRefDate(refDate)} — regla adulto/menor aplicada
          </p>
        ) : (
          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#F97316" }}>
            ⚠️ Sin fecha de inicio de gira — no se puede determinar mayoría de edad.
          </p>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        <StatCard value={docCounts.COMPLETE} label="Completos" color="#059669" />
        <StatCard value={docCounts.INCOMPLETE} label="Incompletos" color="#D97706" />
        <StatCard value={docCounts.EXPIRED} label="Vencidos" color="#DC2626" />
        <StatCard value={docCounts.EXPIRING} label={`Por vencer (≤${EXPIRY_WARNING_DAYS}d)`} color="#EA580C" />
      </div>

      {/* Search + status filter bar */}
      {enriched.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {/* Search */}
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o cédula…"
              style={{
                flex: 1,
                minWidth: "180px",
                padding: "8px 12px",
                fontSize: "13px",
                border: "1px solid #E5E7EB",
                borderRadius: "10px",
                outline: "none",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#111827")}
              onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
            />

            {/* Status pill group */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "2px",
                padding: "3px",
                background: "#F3F4F6",
                borderRadius: "10px",
                flexShrink: 0,
              }}
            >
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  style={{
                    padding: "5px 10px",
                    borderRadius: "8px",
                    border: "none",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                    background: statusFilter === f.value ? "#fff" : "transparent",
                    color: statusFilter === f.value ? "#111827" : "#6B7280",
                    boxShadow: statusFilter === f.value ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                    transition: "all 0.15s",
                    whiteSpace: "nowrap",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Toggle filter panel */}
            <button
              onClick={() => setShowFilterPanel((v) => !v)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "10px",
                border: `1px solid ${showFilterPanel || activeQuickFilters.size > 0 ? "#6366F1" : "#E5E7EB"}`,
                background: showFilterPanel || activeQuickFilters.size > 0 ? "#EEF2FF" : "#fff",
                color: showFilterPanel || activeQuickFilters.size > 0 ? "#4338CA" : "#6B7280",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <span>🔍</span>
              <span>Filtros</span>
              {activeQuickFilters.size > 0 && (
                <span
                  style={{
                    background: "#6366F1",
                    color: "#fff",
                    borderRadius: "9999px",
                    padding: "0 6px",
                    fontSize: "10px",
                    fontWeight: 700,
                  }}
                >
                  {activeQuickFilters.size}
                </span>
              )}
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                style={{
                  padding: "8px 12px",
                  borderRadius: "10px",
                  border: "1px solid #FECACA",
                  background: "#FEF2F2",
                  color: "#DC2626",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                ✕ Limpiar
              </button>
            )}
          </div>

          {/* Quick filter panel */}
          {showFilterPanel && (
            <div
              style={{
                background: "#fff",
                border: "1px solid #E5E7EB",
                borderRadius: "16px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              {Object.entries(filtersByCategory).map(([cat, filters]) => (
                <div key={cat}>
                  <p
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "#9CA3AF",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {CATEGORY_LABELS[cat]}
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {filters.map((f) => (
                      <FilterChip
                        key={f.key}
                        filter={f}
                        active={activeQuickFilters.has(f.key)}
                        count={quickFilterCounts[f.key]}
                        onClick={() => toggleQuickFilter(f.key)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Active filter chips summary */}
          {activeQuickFilters.size > 0 && !showFilterPanel && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {[...activeQuickFilters].map((key) => {
                const f = QUICK_FILTERS.find((qf) => qf.key === key);
                if (!f) return null;
                return (
                  <button
                    key={key}
                    onClick={() => toggleQuickFilter(key)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "3px 8px 3px 10px",
                      borderRadius: "9999px",
                      fontSize: "11px",
                      fontWeight: 600,
                      border: "1px solid #6366F1",
                      background: "#EEF2FF",
                      color: "#4338CA",
                      cursor: "pointer",
                    }}
                  >
                    {f.emoji} {f.label}
                    <span style={{ opacity: 0.6, marginLeft: "2px" }}>✕</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState message={error.message} />
      ) : enriched.length === 0 ? (
        <EmptyState />
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0", fontSize: "13px", color: "#9CA3AF" }}>
          Sin participantes que coincidan con los filtros.{" "}
          <button
            onClick={clearAllFilters}
            style={{ color: "#6366F1", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            border: "1px solid #E5E7EB",
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            overflow: "hidden",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: "13px", minWidth: "700px", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #F3F4F6", background: "#F9FAFB" }}>
                  {["Participante", "Pasaporte", "Vence pasaporte", "Visa", "Vence visa", "Permiso salida", "Estado", ""].map(
                    (h, i) => (
                      <th
                        key={i}
                        style={{
                          padding: "10px 12px",
                          fontSize: "10px",
                          fontWeight: 700,
                          color: "#9CA3AF",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          textAlign: i === 0 ? "left" : i === 7 ? "right" : "center",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, idx) => (
                  <tr
                    key={p.id}
                    style={{
                      borderBottom: idx < filtered.length - 1 ? "1px solid #F9FAFB" : "none",
                      background: p._visaDenied ? "#FFF5F5" : "transparent",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = p._visaDenied ? "#FEE2E2" : "#F9FAFB")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = p._visaDenied ? "#FFF5F5" : "transparent")}
                  >
                    {/* Participant */}
                    <td style={{ padding: "10px 12px" }}>
                      <p style={{ margin: 0, fontWeight: 600, color: "#111827", fontSize: "13px" }}>
                        {participantName(p)}
                      </p>
                      {p._visaDenied && (
                        <p style={{ margin: "3px 0 0", fontSize: "10px", color: "#B91C1C", fontWeight: 700 }}>
                          Visa negada{p._visaDeniedLabel ? ` · ${p._visaDeniedLabel}` : ""}
                        </p>
                      )}
                      <p style={{ margin: "1px 0 0", fontSize: "11px", color: "#9CA3AF" }}>
                        {p.identification}
                      </p>
                      {p.instrument && (
                        <p style={{ margin: "1px 0 0", fontSize: "11px", color: "#9CA3AF" }}>
                          {p.instrument}
                        </p>
                      )}
                    </td>

                    {/* Passport number */}
                    <td style={{ padding: "10px 12px", textAlign: "center" }}>
                      {p.passportNumber ? (
                        <div>
                          <span style={{ color: "#059669", fontWeight: 700, fontSize: "14px" }}>✓</span>
                          <p style={{ margin: "2px 0 0", fontSize: "10px", color: "#9CA3AF", fontFamily: "monospace" }}>
                            {p.passportNumber}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <span style={{ color: "#F87171", fontWeight: 700, fontSize: "14px" }}>✗</span>
                          <p style={{ margin: "2px 0 0", fontSize: "10px", color: "#EF4444" }}>Falta</p>
                        </div>
                      )}
                    </td>

                    {/* Passport expiry */}
                    <td style={{ padding: "10px 12px", textAlign: "center" }}>
                      {p.passportNumber ? (
                        <ExpiryCell date={p.passportExpiry} />
                      ) : (
                        <span style={{ color: "#D1D5DB", fontSize: "12px" }}>—</span>
                      )}
                    </td>

                    {/* Visa */}
                    <td style={{ padding: "10px 12px", textAlign: "center" }}>
                      <VisaStatusBadge participant={p} />
                    </td>

                    {/* Visa expiry */}
                    <td style={{ padding: "10px 12px", textAlign: "center" }}>
                      {p.visaStatus === "DENIED" ? (
                        <span style={{ color: "#DC2626", fontSize: "10px", fontWeight: 700 }}>
                          Bloqueada
                        </span>
                      ) : p.hasVisa ? (
                        <ExpiryCell date={p.visaExpiry} />
                      ) : (
                        <span style={{ color: "#D1D5DB", fontSize: "12px" }}>—</span>
                      )}
                    </td>

                    {/* Exit permit */}
                    <td style={{ padding: "10px 12px", textAlign: "center" }}>
                      <PermitCell participant={p} />
                    </td>

                    {/* Status */}
                    <td style={{ padding: "10px 12px", textAlign: "center" }}>
                      <StatusBadge status={p._docStatus} />
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "10px 12px", textAlign: "right" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "6px" }}>
                        <button
                          onClick={() => openDetail(p)}
                          style={{
                            padding: "4px 10px",
                            fontSize: "11px",
                            fontWeight: 600,
                            color: "#374151",
                            border: "1px solid #E5E7EB",
                            borderRadius: "8px",
                            background: "#fff",
                            cursor: "pointer",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
                        >
                          Ver
                        </button>
                        <button
                          onClick={() => openEdit(p)}
                          style={{
                            padding: "4px 10px",
                            fontSize: "11px",
                            fontWeight: 700,
                            color: "#fff",
                            border: "none",
                            borderRadius: "8px",
                            background: "#111827",
                            cursor: "pointer",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#374151")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "#111827")}
                        >
                          {p.linkedUser ? "Notas" : "Editar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div
            style={{
              padding: "8px 16px",
              borderTop: "1px solid #F3F4F6",
              background: "#F9FAFB",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "11px", color: "#9CA3AF" }}>
              {filtered.length} de {enriched.length} participante{enriched.length !== 1 ? "s" : ""}
              {activeQuickFilters.size > 0 && (
                <span style={{ color: "#6366F1", fontWeight: 600 }}>
                  {" "}· {activeQuickFilters.size} filtro{activeQuickFilters.size !== 1 ? "s" : ""} activo{activeQuickFilters.size !== 1 ? "s" : ""}
                </span>
              )}
            </span>
            <span style={{ fontSize: "11px", color: "#9CA3AF" }}>
              Alerta vencimiento: ≤{EXPIRY_WARNING_DAYS} días
            </span>
          </div>
        </div>
      )}

      {/* Modals */}
      {detailParticipant && (
        <DocumentDetailDrawer
          participant={detailParticipant}
          refDate={refDate}
          onClose={closeDetail}
          onEdit={openEdit}
        />
      )}

      {editParticipant && (
        <DocumentEditModal
          participant={editParticipant}
          refDate={refDate}
          onSave={handleSave}
          onClose={closeEdit}
          saving={saving}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// ── Shared sub-components ──────────────────────────────────────────────────────

function StatCard({ value, label, color }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "16px",
        border: "1px solid #E5E7EB",
        padding: "16px",
      }}
    >
      <p style={{ margin: 0, fontSize: "24px", fontWeight: 700, color }}>{value}</p>
      <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#6B7280" }}>{label}</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          style={{
            height: "52px",
            background: "#F3F4F6",
            borderRadius: "12px",
            animation: "pulse 1.5s infinite",
          }}
        />
      ))}
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div
      style={{
        background: "#FEF2F2",
        border: "1px solid #FECACA",
        borderRadius: "16px",
        padding: "32px",
        textAlign: "center",
      }}
    >
      <p style={{ fontSize: "24px", margin: "0 0 8px" }}>⚠️</p>
      <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#991B1B" }}>
        Error al cargar documentos
      </p>
      <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#EF4444" }}>{message}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        background: "#F9FAFB",
        border: "1px dashed #D1D5DB",
        borderRadius: "16px",
        padding: "48px",
        textAlign: "center",
      }}
    >
      <p style={{ fontSize: "40px", margin: "0 0 12px" }}>📄</p>
      <h3 style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 700, color: "#111827" }}>
        Sin participantes
      </h3>
      <p style={{ margin: 0, fontSize: "12px", color: "#6B7280" }}>
        Importá participantes desde la pestaña Importación para ver su estado documental.
      </p>
    </div>
  );
}
