/* eslint-disable react/prop-types */
/**
 * EventLogisticsPage.jsx
 * Logística de presentaciones — light theme
 * Mismo estilo visual que AttendancePage / PerformanceAttendancePage existentes
 *
 * Wrapeado en DashboardLayout + DashboardNavbar + Footer
 * Tabs: Configurar / Excluidos / Asistencia
 */

import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { gql } from "@apollo/client";
import PropTypes from "prop-types";

// ─── Layout components (del proyecto existente) ───────────────────────────────
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import { Card } from "@mui/material";
import { mapInstrumentToSection } from "utils/sectionMapper";

// ─────────────────────────────────────────────────────────────────────────────
// GQL — mover a graphql/queries.js y graphql/mutations.js en producción
// ─────────────────────────────────────────────────────────────────────────────

const GET_EVENTS = gql`
  query GetEvents {
    getEvents {
      id
      title
      date
    }
  }
`;

const GET_USERS_BY_ID = gql`
  query GetUserById {
    getUser {
      id
      name
      firstSurName
      role
      instrument
    }
  }
`;

const GET_EVENT_ROSTER = gql`
  query GetEventRoster($eventId: ID!, $filter: RosterFilterInput) {
    getEventRoster(eventId: $eventId, filter: $filter) {
      id
      assignmentGroup
      busNumber
      plannedBusNumbers
      transportPlan {
        mode
        primaryBus
        secondaryBus
        primaryCapacity
      }
      excludedFromEvent
      excludedFromTransport
      exclusionReason
      attendanceStatus
      attendanceMarkedBy {
        id
        name
        firstSurName
      }
      attendanceMarkedAt
      isStaff
      user {
        id
        name
        firstSurName
        secondSurName
        instrument
      }
    }
  }
`;

const GET_EVENT_BUS_SUMMARY = gql`
  query GetEventBusSummary($eventId: ID!) {
    getEventBusSummary(eventId: $eventId) {
      buses {
        busNumber
        count
        plannedCount
        confirmedCount
        groupSummary {
          group
          count
        }
        members {
          id
          assignmentGroup
          user {
            id
            name
            firstSurName
            secondSurName
          }
        }
      }
      unassigned {
        id
        assignmentGroup
        user {
          id
          name
          firstSurName
          secondSurName
        }
      }
      unassignedCount
    }
  }
`;

const GET_EVENT_ATTENDANCE_SUMMARY = gql`
  query GetEventAttendanceSummary($eventId: ID!) {
    getEventAttendanceSummary(eventId: $eventId) {
      total
      convoked
      excluded
      present
      absent
      late
      pending
      attendanceRate
    }
  }
`;

const INITIALIZE_EVENT_ROSTER = gql`
  mutation InitializeEventRoster($eventId: ID!) {
    initializeEventRoster(eventId: $eventId) {
      id
    }
  }
`;

const ASSIGN_BUS_TO_GROUP = gql`
  mutation AssignBusToGroup(
    $eventId: ID!
    $assignmentGroup: String!
    $busNumber: Int!
    $options: AssignBusOptions
  ) {
    assignBusToGroup(
      eventId: $eventId
      assignmentGroup: $assignmentGroup
      busNumber: $busNumber
      options: $options
    ) {
      id
      busNumber
      plannedBusNumbers
      assignmentGroup
    }
  }
`;

const SET_EXCLUSION = gql`
  mutation SetExclusion($eventId: ID!, $userId: ID!, $exclusion: ExclusionInput!) {
    setExclusion(eventId: $eventId, userId: $userId, exclusion: $exclusion) {
      id
      excludedFromEvent
      excludedFromTransport
      exclusionReason
      user {
        id
        name
        firstSurName
      }
    }
  }
`;

const BULK_MARK_ATTENDANCE = gql`
  mutation BulkMarkAttendance($eventId: ID!, $entries: [BulkAttendanceEntryInput!]!) {
    bulkMarkAttendance(eventId: $eventId, entries: $entries) {
      id
      attendanceStatus
      busNumber
      user {
        id
        name
        firstSurName
      }
    }
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const BUSES = [1, 2, 3, 4, 5, 6];
const MAX_BUS_CAPACITY = 55;
const STAFF_ROLES = new Set(["Staff", "Dirección Logística"]);

const SECTIONS_ORDER = [
  "FLAUTAS",
  "CLARINETES",
  "SAXOFONES",
  "TROMPETAS",
  "TROMBONES",
  "TUBAS",
  "EUFONIOS",
  "CORNOS",
  "MALLETS",
  "PERCUSION",
  "COLOR_GUARD",
  "DANZA",
  "NO_APLICA",
];

const SECTION_LABELS = {
  FLAUTAS: "Flautas",
  CLARINETES: "Clarinetes",
  SAXOFONES: "Saxofones",
  TROMPETAS: "Trompetas",
  TROMBONES: "Trombones",
  TUBAS: "Tubas",
  EUFONIOS: "Eufonios",
  CORNOS: "Cornos",
  MALLETS: "Mallets",
  PERCUSION: "Percusión",
  COLOR_GUARD: "Color Guard",
  DANZA: "Danza",
  NO_APLICA: "Sin sección",
  STAFF: "Staff",
};

const BUS_PALETTE = {
  1: {
    bg: "bg-sky-50",
    border: "border-sky-200",
    badge: "bg-sky-100 text-sky-700",
    dot: "bg-sky-500",
    bar: "bg-sky-500",
    ring: "ring-sky-300",
  },
  2: {
    bg: "bg-violet-50",
    border: "border-violet-200",
    badge: "bg-violet-100 text-violet-700",
    dot: "bg-violet-500",
    bar: "bg-violet-500",
    ring: "ring-violet-300",
  },
  3: {
    bg: "bg-rose-50",
    border: "border-rose-200",
    badge: "bg-rose-100 text-rose-700",
    dot: "bg-rose-500",
    bar: "bg-rose-500",
    ring: "ring-rose-300",
  },
  4: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    badge: "bg-amber-100 text-amber-700",
    dot: "bg-amber-500",
    bar: "bg-amber-500",
    ring: "ring-amber-300",
  },
  5: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    badge: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-500",
    bar: "bg-emerald-500",
    ring: "ring-emerald-300",
  },
  6: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    badge: "bg-orange-100 text-orange-700",
    dot: "bg-orange-500",
    bar: "bg-orange-500",
    ring: "ring-orange-300",
  },
};

const ATTENDANCE_CONFIG = {
  PENDING: {
    label: "Pendiente",
    short: "—",
    bg: "bg-gray-100",
    text: "text-gray-500",
    dot: "bg-gray-300",
  },
  PRESENT: {
    label: "Presente",
    short: "P",
    bg: "bg-emerald-500",
    text: "text-white",
    dot: "bg-emerald-400",
  },
  ABSENT: { label: "Ausente", short: "A", bg: "bg-red-500", text: "text-white", dot: "bg-red-400" },
};

// ─────────────────────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────────────────────

const fullName = (u) =>
  `${u?.name || ""} ${u?.firstSurName || ""} ${u?.secondSurName || ""}`.trim();

const initials = (u) => `${(u?.name || " ")[0]}${(u?.firstSurName || " ")[0]}`.toUpperCase();

const groupRoster = (entries) => {
  const map = {};
  (entries || []).forEach((e) => {
    const g = e.assignmentGroup || "NO_APLICA";
    if (!map[g]) map[g] = [];
    map[g].push(e);
  });
  return map;
};

const getPlannedBuses = (entry) => {
  const planned = Array.isArray(entry?.plannedBusNumbers)
    ? entry.plannedBusNumbers.filter(Boolean)
    : [];
  if (planned.length > 0) return [...new Set(planned)].sort((a, b) => a - b);
  return entry?.busNumber ? [entry.busNumber] : [];
};

const getGroupPlanning = (entries = []) => {
  const activeEntries = entries.filter(
    (entry) => !entry.excludedFromEvent && !entry.excludedFromTransport
  );
  const sample = activeEntries[0] || null;
  const actualBuses = [
    ...new Set(activeEntries.map((entry) => entry.busNumber).filter(Boolean)),
  ].sort((a, b) => a - b);
  const plannedBuses = sample ? getPlannedBuses(sample) : [];
  const plan = sample?.transportPlan || null;
  const hasFlexiblePlan =
    plan?.mode === "FLEX" && plannedBuses.length > 1 && plan.primaryBus && plan.secondaryBus;

  return {
    activeEntries,
    sample,
    actualBuses,
    plannedBuses,
    actualAssignedCount: activeEntries.filter((entry) => entry.busNumber).length,
    unassignedCount: activeEntries.filter((entry) => !entry.busNumber).length,
    hasFlexiblePlan,
    plan,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// SHARED MICRO COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

// Toast — top-right, igual que AttendancePage
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  const bgColor =
    {
      success: "bg-emerald-500",
      error: "bg-red-500",
      info: "bg-blue-600",
      warning: "bg-amber-500",
    }[type] || "bg-blue-600";

  return (
    <div
      className={`fixed top-4 right-4 ${bgColor} text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg shadow-lg z-[1350] animate-slide-in-right flex items-center gap-3 max-w-sm`}
    >
      {type === "success" && (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )}
      <span className="font-medium text-sm sm:text-base flex-1">{message}</span>
      <button onClick={onClose} className="ml-auto hover:opacity-75">
        <svg
          className="w-4 h-4 sm:w-5 sm:h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
};

Toast.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(["success", "error", "info", "warning"]),
  onClose: PropTypes.func.isRequired,
};

// Spinner — idéntico al de AttendancePage
const Spinner = ({ size = "md" }) => {
  const s = { sm: "w-4 h-4", md: "w-5 h-5", lg: "w-8 h-8" }[size];
  return (
    <svg
      className={`animate-spin ${s} text-blue-600`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

// Avatar con iniciales — mismo gradiente azul que AttendancePage
const UserAvatar = ({ user, size = "md", busNumber }) => {
  const sizes = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-12 h-12 text-base" };
  const bp = busNumber ? BUS_PALETTE[busNumber] : null;
  return (
    <div
      className={`
      flex-shrink-0 ${sizes[size]} rounded-full
      bg-gradient-to-br from-blue-400 to-blue-600
      flex items-center justify-center text-white font-bold
      ${bp ? `ring-2 ${bp.ring}` : ""}
    `}
    >
      {initials(user)}
    </div>
  );
};

UserAvatar.propTypes = {
  user: PropTypes.object.isRequired,
  size: PropTypes.string,
  busNumber: PropTypes.number,
};

// Badge bus
const BusBadge = ({ busNumber, small }) => {
  if (!busNumber)
    return (
      <span
        className={`${
          small ? "text-xs px-1.5 py-0.5" : "text-sm px-2 py-0.5"
        } rounded bg-gray-100 text-gray-400 font-mono font-bold`}
      >
        —
      </span>
    );
  const bp = BUS_PALETTE[busNumber] || BUS_PALETTE[1];
  return (
    <span
      className={`${
        small ? "text-xs px-1.5 py-0.5" : "text-sm px-2 py-0.5"
      } rounded font-mono font-bold ${bp.badge}`}
    >
      B{busNumber}
    </span>
  );
};

BusBadge.propTypes = { busNumber: PropTypes.number, small: PropTypes.bool };

const BusPlanChips = ({ buses, small = false }) => {
  if (!buses?.length) return null;
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {buses.map((bus) => (
        <BusBadge key={bus} busNumber={bus} small={small} />
      ))}
    </div>
  );
};

BusPlanChips.propTypes = {
  buses: PropTypes.arrayOf(PropTypes.number),
  small: PropTypes.bool,
};

const BusOptionButton = ({ busNumber, selected, onClick, disabled }) => {
  const bp = BUS_PALETTE[busNumber] || BUS_PALETTE[1];
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        "flex items-center justify-center rounded-full border h-11 w-11 transition-all",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
        selected
          ? `${bp.bg} ${bp.border} ${bp.badge} shadow-sm ring-2 ${bp.ring}`
          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50",
        disabled ? "opacity-50 cursor-not-allowed" : "",
      ].join(" ")}
    >
      <span
        className={[
          "inline-flex h-8 w-8 items-center justify-center rounded-full",
          selected ? bp.badge : "bg-gray-100 text-gray-500",
        ].join(" ")}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M8 6v2m8-2v2M6 10h12m-9 8v-2m6 2v-2m-8 2h10a2 2 0 002-2V8a2 2 0 00-2-2H7a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      </span>
    </button>
  );
};

BusOptionButton.propTypes = {
  busNumber: PropTypes.number.isRequired,
  selected: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

const StatusChipButton = ({ statusKey, isActive, onClick, disabled }) => {
  const config = ATTENDANCE_CONFIG[statusKey];
  const idleStyles = {
    PRESENT:
      "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300",
    ABSENT: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-300",
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        "rounded-full border h-11 w-11 text-sm font-bold transition-all flex items-center justify-center",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
        isActive
          ? `${config.bg} ${config.text} border-transparent shadow-md`
          : idleStyles[statusKey],
        disabled ? "opacity-40 cursor-not-allowed" : "",
      ].join(" ")}
      aria-label={config.label}
      title={config.label}
    >
      {statusKey === "PRESENT" ? "P" : "A"}
    </button>
  );
};

StatusChipButton.propTypes = {
  statusKey: PropTypes.oneOf(["PRESENT", "ABSENT"]).isRequired,
  isActive: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

// Barra de ocupación
const OccupancyBar = ({ count, max = MAX_BUS_CAPACITY, busNumber }) => {
  const pct = Math.min((count / max) * 100, 100);
  const bp = BUS_PALETTE[busNumber] || BUS_PALETTE[1];
  const overflow = count > max;
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span
          className={`text-xs font-mono font-semibold ${
            overflow ? "text-red-600" : "text-gray-600"
          }`}
        >
          {count}/{max}
        </span>
        {overflow && <span className="text-xs text-red-600 font-medium">Excede cupo</span>}
      </div>
      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            overflow ? "bg-red-500" : bp.bar
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

OccupancyBar.propTypes = {
  count: PropTypes.number.isRequired,
  max: PropTypes.number,
  busNumber: PropTypes.number,
};

// Toggle switch
const Toggle = ({ value, onChange, colorOn = "bg-blue-600" }) => (
  <button
    type="button"
    onClick={() => onChange(!value)}
    className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
      value ? colorOn : "bg-gray-200"
    }`}
  >
    <span
      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
        value ? "translate-x-5" : ""
      }`}
    />
  </button>
);

Toggle.propTypes = {
  value: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  colorOn: PropTypes.string,
};

// Stat card
const StatCard = ({ label, value, color = "text-gray-900", highlight }) => (
  <div
    className={`rounded-xl p-3 text-center border ${
      highlight ? "bg-amber-50 border-amber-200" : "bg-white border-gray-200"
    }`}
  >
    <div className={`text-xl sm:text-2xl font-bold font-mono ${color}`}>{value}</div>
    <div className="text-xs text-gray-500 mt-0.5 leading-tight">{label}</div>
  </div>
);

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  color: PropTypes.string,
  highlight: PropTypes.bool,
};

// ─────────────────────────────────────────────────────────────────────────────
// MODAL — bottom sheet en mobile
// ─────────────────────────────────────────────────────────────────────────────

const Modal = ({ title, children, onClose, actions }) => (
  <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
    <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <div className="px-5 py-4 max-h-[65vh] overflow-y-auto">{children}</div>
      {actions && <div className="flex gap-3 px-5 pb-5 pt-2">{actions}</div>}
    </div>
  </div>
);

Modal.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
  onClose: PropTypes.func.isRequired,
  actions: PropTypes.node,
};

// ─────────────────────────────────────────────────────────────────────────────
// TAB BAR — misma estética del sistema existente
// ─────────────────────────────────────────────────────────────────────────────

const TABS = [
  {
    id: "config",
    label: "Configurar",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
  {
    id: "exclusions",
    label: "Excluidos",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
        />
      </svg>
    ),
  },
  {
    id: "attendance",
    label: "Asistencia",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
];

const TabBar = ({ active, onChange, tabs }) => (
  <div className="flex border-b border-gray-200 bg-white">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => onChange(tab.id)}
        className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 text-xs font-semibold transition-all border-b-2
          ${
            active === tab.id
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50"
          }`}
      >
        {tab.icon}
        <span>{tab.label}</span>
      </button>
    ))}
  </div>
);

TabBar.propTypes = {
  active: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  tabs: PropTypes.array.isRequired,
};

// ─────────────────────────────────────────────────────────────────────────────
// TAB 1 — CONFIGURAR
// ─────────────────────────────────────────────────────────────────────────────

const GroupCard = ({ group, entries, eventId, onAssigned, isAdmin }) => {
  const [selectedBus, setSelectedBus] = useState("");
  const [maxCap, setMaxCap] = useState(MAX_BUS_CAPACITY);
  const [overflowBus, setOverflowBus] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [loading, setLoading] = useState(false);

  const [assignBus] = useMutation(ASSIGN_BUS_TO_GROUP);

  const {
    activeEntries,
    actualBuses,
    plannedBuses,
    actualAssignedCount,
    unassignedCount,
    hasFlexiblePlan,
    plan,
  } = useMemo(() => getGroupPlanning(entries), [entries]);

  const handleAssign = async () => {
    if (!selectedBus || !isAdmin) return;
    setLoading(true);
    try {
      await assignBus({
        variables: {
          eventId,
          assignmentGroup: group,
          busNumber: parseInt(selectedBus),
          options: overflowBus
            ? { maxCapacity: parseInt(maxCap), overflowBus: parseInt(overflowBus) }
            : null,
        },
      });
      onAssigned?.();
      setShowOptions(false);
      setSelectedBus("");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {SECTION_LABELS[group] || group}
            </p>
            <span className="text-xs text-gray-400 font-mono shrink-0">
              {activeEntries.length} {activeEntries.length === 1 ? "persona" : "personas"}
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {hasFlexiblePlan ? (
              <>
                <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                  Seccion dividida
                </span>
                <BusPlanChips buses={plannedBuses} small />
              </>
            ) : plannedBuses.length === 1 ? (
              <BusBadge busNumber={plannedBuses[0]} small />
            ) : (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                Sin plan
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {actualBuses.length > 0 && (
            <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
              {actualAssignedCount} confirmados
            </span>
          )}
          {unassignedCount > 0 && (
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              {unassignedCount} por ubicar
            </span>
          )}
        </div>
      </div>

      <div className="px-4 pb-3">
        {hasFlexiblePlan ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Esta seccion se reparte por cupo.{" "}
            {Math.min(activeEntries.length, plan?.primaryCapacity || activeEntries.length)} irian en
            Bus {plan?.primaryBus} y{" "}
            {Math.max(activeEntries.length - (plan?.primaryCapacity || 0), 0)} en Bus{" "}
            {plan?.secondaryBus}. La persona que pasa asistencia decide quien sube a cual bus.
          </div>
        ) : plannedBuses.length === 1 ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            Toda la seccion va en el Bus {plannedBuses[0]}.
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            Todavia no hay plan de transporte para esta seccion.
          </div>
        )}
      </div>

      {/* Members preview */}
      <div className="px-4 pb-3 flex flex-wrap gap-1.5">
        {activeEntries.slice(0, 10).map((e) => (
          <div key={e.id} title={fullName(e.user)}>
            <UserAvatar
              user={e.user}
              size="sm"
              busNumber={hasFlexiblePlan ? e.busNumber || null : e.busNumber || plannedBuses[0]}
            />
          </div>
        ))}
        {activeEntries.length > 10 && (
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500 font-mono font-semibold">
            +{activeEntries.length - 10}
          </div>
        )}
      </div>

      {/* Assignment controls — Admin only */}
      {isAdmin && (
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
          <div className="flex gap-2">
            <select
              value={selectedBus}
              onChange={(e) => setSelectedBus(e.target.value)}
              className="flex-1 border border-gray-300 text-gray-900 text-sm rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Bus principal…</option>
              {BUSES.map((b) => (
                <option key={b} value={b}>
                  Bus {b}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowOptions((v) => !v)}
              className={`px-3 py-2 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500
                ${
                  showOptions
                    ? "bg-blue-50 border-blue-300 text-blue-700"
                    : "border-gray-300 text-gray-500 bg-white hover:bg-gray-50"
                }`}
              title="División de grupo"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>

            <button
              onClick={handleAssign}
              disabled={!selectedBus || loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 flex items-center gap-1.5"
            >
              {loading ? <Spinner size="sm" /> : "Guardar plan"}
            </button>
          </div>

          {showOptions && (
            <div className="mt-3 p-3 bg-white border border-gray-200 rounded-xl space-y-3">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                División de grupo
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Cupo máximo</label>
                  <input
                    type="number"
                    value={maxCap}
                    min={1}
                    max={MAX_BUS_CAPACITY}
                    onChange={(e) => setMaxCap(e.target.value)}
                    className="w-full border border-gray-300 text-gray-900 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Resto en bus</label>
                  <select
                    value={overflowBus}
                    onChange={(e) => setOverflowBus(e.target.value)}
                    className="w-full border border-gray-300 text-gray-900 text-sm rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Ninguno</option>
                    {BUSES.filter((b) => b !== parseInt(selectedBus)).map((b) => (
                      <option key={b} value={b}>
                        Bus {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Si definis un segundo bus, la seccion quedara flexible: no se asignan personas
                especificas, solo los buses permitidos y el cupo del bus principal.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

GroupCard.propTypes = {
  group: PropTypes.string.isRequired,
  entries: PropTypes.array.isRequired,
  eventId: PropTypes.string.isRequired,
  onAssigned: PropTypes.func,
  isAdmin: PropTypes.bool,
};

const BusOverviewCard = ({ bus, summary }) => {
  const bp = BUS_PALETTE[bus] || BUS_PALETTE[1];
  const busData = summary?.buses?.find((b) => b.busNumber === bus);
  const plannedCount = busData?.plannedCount || 0;
  const confirmedCount = busData?.confirmedCount || 0;

  return (
    <div className={`${bp.bg} border ${bp.border} rounded-xl p-3 shadow-sm`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${bp.dot}`} />
          <span className="text-sm font-bold text-gray-900">Bus {bus}</span>
        </div>
        <span className="text-xs text-gray-500 font-mono">
          {plannedCount}/{MAX_BUS_CAPACITY}
        </span>
      </div>
      <OccupancyBar count={plannedCount} busNumber={bus} />
      <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
        <span>Planificados</span>
        <span className="font-mono font-semibold text-gray-700">{plannedCount}</span>
      </div>
      <div className="mt-1 flex items-center justify-between text-[11px] text-gray-500">
        <span>Confirmados</span>
        <span className="font-mono font-semibold text-gray-700">{confirmedCount}</span>
      </div>
      {busData?.groupSummary?.length > 0 && (
        <div className="mt-2 space-y-0.5">
          {busData.groupSummary.map((gs) => (
            <div key={gs.group} className="flex items-center justify-between">
              <span className="text-xs text-gray-500">{SECTION_LABELS[gs.group] || gs.group}</span>
              <span className="text-xs font-mono font-semibold text-gray-700">{gs.count}</span>
            </div>
          ))}
        </div>
      )}
      {plannedCount === 0 && <p className="text-xs text-gray-400 mt-1 text-center">Sin plan</p>}
    </div>
  );
};

BusOverviewCard.propTypes = { bus: PropTypes.number.isRequired, summary: PropTypes.object };

const ConfigTab = ({ eventId, roster, busSummary, isAdmin, onRefetch }) => {
  const grouped = useMemo(() => groupRoster(roster), [roster]);
  const activeRoster = useMemo(
    () =>
      (roster || []).filter((entry) => !entry.excludedFromEvent && !entry.excludedFromTransport),
    [roster]
  );
  const plannedCount = activeRoster.filter((entry) => getPlannedBuses(entry).length > 0).length;
  const pendingPlacementCount = activeRoster.filter(
    (entry) => getPlannedBuses(entry).length > 1 && !entry.busNumber
  ).length;
  const orderedGroups = SECTIONS_ORDER.filter((s) => grouped[s]?.length > 0);

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Total" value={(roster || []).length} />
        <StatCard label="Con plan" value={plannedCount} color="text-emerald-600" />
        <StatCard
          label="Pendientes por ubicar"
          value={pendingPlacementCount}
          color={pendingPlacementCount > 0 ? "text-amber-600" : "text-gray-400"}
          highlight={pendingPlacementCount > 0}
        />
      </div>

      {/* Bus overview */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Estado de buses
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {BUSES.map((b) => (
            <BusOverviewCard key={b} bus={b} summary={busSummary} />
          ))}
        </div>
      </div>

      {/* Groups */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Grupos</p>
        {orderedGroups.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-xl py-10 text-center">
            <p className="text-sm text-gray-400">Sin grupos. Inicializa el roster primero.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orderedGroups.map((g) => (
              <GroupCard
                key={g}
                group={g}
                entries={grouped[g]}
                eventId={eventId}
                onAssigned={onRefetch}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

ConfigTab.propTypes = {
  eventId: PropTypes.string.isRequired,
  roster: PropTypes.array,
  busSummary: PropTypes.object,
  isAdmin: PropTypes.bool,
  onRefetch: PropTypes.func,
};

// ─────────────────────────────────────────────────────────────────────────────
// TAB 2 — EXCLUIDOS
// ─────────────────────────────────────────────────────────────────────────────

const ExclusionRow = ({ entry, eventId, onDone, isAdmin }) => {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState(entry.exclusionReason || "");
  const [excTransport, setExcTransport] = useState(entry.excludedFromTransport);

  const [setExclusionMut] = useMutation(SET_EXCLUSION);

  const handleReincorporate = async () => {
    setLoading(true);
    try {
      await setExclusionMut({
        variables: {
          eventId,
          userId: entry.user.id,
          exclusion: {
            excludedFromEvent: false,
            excludedFromTransport: false,
            exclusionReason: "",
          },
        },
      });
      onDone?.();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await setExclusionMut({
        variables: {
          eventId,
          userId: entry.user.id,
          exclusion: {
            excludedFromEvent: entry.excludedFromEvent,
            excludedFromTransport: excTransport,
            exclusionReason: reason,
          },
        },
      });
      onDone?.();
      setShowModal(false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="group flex items-center gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors">
        <UserAvatar user={entry.user} size="md" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{fullName(entry.user)}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs text-gray-500">
              {SECTION_LABELS[entry.assignmentGroup] || entry.assignmentGroup}
            </span>
            {entry.excludedFromEvent && (
              <span className="text-xs bg-red-100 text-red-700 border border-red-200 px-1.5 py-0.5 rounded">
                Del evento
              </span>
            )}
            {entry.excludedFromTransport && !entry.excludedFromEvent && (
              <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded">
                Sin transporte
              </span>
            )}
            {entry.exclusionReason && (
              <span className="text-xs text-gray-400 italic truncate max-w-[130px]">
                {entry.exclusionReason}
              </span>
            )}
          </div>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowModal(true)}
              className="text-xs text-gray-400 hover:text-gray-700 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              Editar
            </button>
            <button
              onClick={handleReincorporate}
              disabled={loading}
              className="text-xs bg-emerald-50 hover:bg-emerald-500 text-emerald-700 hover:text-white border border-emerald-200 hover:border-emerald-500 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 font-semibold flex items-center gap-1"
            >
              {loading ? <Spinner size="sm" /> : "Reincorporar"}
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <Modal
          title="Editar exclusión"
          onClose={() => setShowModal(false)}
          actions={
            <>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Spinner size="sm" /> : "Guardar"}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <UserAvatar user={entry.user} size="md" />
              <div>
                <p className="text-sm font-semibold text-gray-900">{fullName(entry.user)}</p>
                <p className="text-xs text-gray-500">{SECTION_LABELS[entry.assignmentGroup]}</p>
              </div>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-gray-700">Excluir del transporte</span>
              <Toggle value={excTransport} onChange={setExcTransport} colorOn="bg-amber-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">Motivo</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ej: Viaja por su cuenta"
                className="w-full border border-gray-300 text-gray-900 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
              />
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

ExclusionRow.propTypes = {
  entry: PropTypes.object.isRequired,
  eventId: PropTypes.string.isRequired,
  onDone: PropTypes.func,
  isAdmin: PropTypes.bool,
};

const ExcludePersonModal = ({ eventId, roster, onDone, onClose }) => {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [reason, setReason] = useState("");
  const [excTransport, setExcTransport] = useState(false);
  const [excEvent, setExcEvent] = useState(true);
  const [loading, setLoading] = useState(false);

  const [setExclusionMut] = useMutation(SET_EXCLUSION);

  const available = (roster || []).filter((e) => {
    if (e.excludedFromEvent) return false;
    return !search || fullName(e.user).toLowerCase().includes(search.toLowerCase());
  });

  const handleConfirm = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await setExclusionMut({
        variables: {
          eventId,
          userId: selected.user.id,
          exclusion: {
            excludedFromEvent: excEvent,
            excludedFromTransport: excTransport,
            exclusionReason: reason,
          },
        },
      });
      onDone?.();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Excluir persona"
      onClose={onClose}
      actions={
        <>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selected || loading}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {loading ? <Spinner size="sm" /> : "Excluir"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {!selected ? (
          <>
            <div className="relative">
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar persona…"
                className="w-full border border-gray-300 text-gray-900 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
              />
            </div>
            <div className="space-y-1 max-h-52 overflow-y-auto">
              {available.slice(0, 30).map((e) => (
                <button
                  key={e.id}
                  onClick={() => setSelected(e)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left"
                >
                  <UserAvatar user={e.user} size="sm" busNumber={e.busNumber} />
                  <div>
                    <p className="text-sm text-gray-900 font-medium">{fullName(e.user)}</p>
                    <p className="text-xs text-gray-400">{SECTION_LABELS[e.assignmentGroup]}</p>
                  </div>
                </button>
              ))}
              {available.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">Sin resultados</p>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <UserAvatar user={selected.user} size="md" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{fullName(selected.user)}</p>
                <p className="text-xs text-gray-500">{SECTION_LABELS[selected.assignmentGroup]}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-gray-700">Excluir del evento completo</span>
                <Toggle value={excEvent} onChange={setExcEvent} colorOn="bg-red-600" />
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-gray-700">Excluir del transporte</span>
                <Toggle value={excTransport} onChange={setExcTransport} colorOn="bg-amber-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">
                  Motivo (opcional)
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ej: Viaja por su cuenta"
                  className="w-full border border-gray-300 text-gray-900 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                />
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

ExcludePersonModal.propTypes = {
  eventId: PropTypes.string.isRequired,
  roster: PropTypes.array,
  onDone: PropTypes.func,
  onClose: PropTypes.func.isRequired,
};

const ExclusionsTab = ({ eventId, roster, isAdmin, onRefetch }) => {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");

  const excluded = (roster || []).filter((e) => e.excludedFromEvent || e.excludedFromTransport);
  const filtered = search
    ? excluded.filter((e) => fullName(e.user).toLowerCase().includes(search.toLowerCase()))
    : excluded;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <StatCard
          label="Excluidos del evento"
          value={excluded.filter((e) => e.excludedFromEvent).length}
          color="text-red-600"
        />
        <StatCard
          label="Sin transporte"
          value={excluded.filter((e) => e.excludedFromTransport && !e.excludedFromEvent).length}
          color="text-amber-600"
        />
      </div>

      {isAdmin && (
        <button
          onClick={() => setShowModal(true)}
          className="w-full py-3 border-2 border-dashed border-red-200 hover:border-red-300 hover:bg-red-50 text-red-600 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Excluir persona
        </button>
      )}

      {excluded.length > 5 && (
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar en excluidos…"
            className="w-full border border-gray-300 text-gray-900 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 bg-white"
          />
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <svg
              className="w-12 h-12 text-gray-200 mx-auto mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-gray-400">
              {excluded.length === 0 ? "Sin exclusiones registradas" : "Sin resultados"}
            </p>
          </div>
        ) : (
          filtered.map((e) => (
            <ExclusionRow
              key={e.id}
              entry={e}
              eventId={eventId}
              onDone={onRefetch}
              isAdmin={isAdmin}
            />
          ))
        )}
      </div>

      {showModal && (
        <ExcludePersonModal
          eventId={eventId}
          roster={roster}
          onDone={onRefetch}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

ExclusionsTab.propTypes = {
  eventId: PropTypes.string.isRequired,
  roster: PropTypes.array,
  isAdmin: PropTypes.bool,
  onRefetch: PropTypes.func,
};

// ─────────────────────────────────────────────────────────────────────────────
// TAB 3 — ASISTENCIA — mismo patrón que AttendancePage
// ─────────────────────────────────────────────────────────────────────────────

const getAttendanceDraft = (entry, localAttendance) => {
  const local = localAttendance?.[entry.user.id];
  return {
    attendanceStatus: local?.attendanceStatus || entry.attendanceStatus || "PENDING",
    busNumber: local?.busNumber !== undefined ? local.busNumber : entry.busNumber || null,
  };
};

const AttendancePersonRow = ({ entry, localValue, onChange, canEdit, searchTerm }) => {
  const draft = getAttendanceDraft(entry, { [entry.user.id]: localValue });
  const status = draft.attendanceStatus;
  const cfg = ATTENDANCE_CONFIG[status] || ATTENDANCE_CONFIG.PENDING;
  const plannedBuses = getPlannedBuses(entry);
  const requiresBusChoice = plannedBuses.length > 1 && status === "PRESENT";
  const busMissing = requiresBusChoice && !draft.busNumber;

  const highlight = (text) => {
    if (!searchTerm) return text;
    const esc = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return String(text).replace(
      new RegExp(`(${esc})`, "gi"),
      '<mark class="bg-yellow-200 font-semibold">$1</mark>'
    );
  };

  const rowBg =
    status === "PRESENT" ? "bg-emerald-50" : status === "ABSENT" ? "bg-red-50" : "hover:bg-gray-50";

  return (
    <div className={`group px-4 py-3 border-b border-gray-100 transition-colors ${rowBg}`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="relative flex-shrink-0">
            <UserAvatar
              user={entry.user}
              size="md"
              busNumber={draft.busNumber || entry.busNumber}
            />
            <div
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${cfg.dot}`}
            />
          </div>

          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-semibold text-gray-900 truncate"
              dangerouslySetInnerHTML={{ __html: highlight(fullName(entry.user)) }}
            />
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs text-gray-500">{SECTION_LABELS[entry.assignmentGroup]}</span>
              {plannedBuses.length === 1 && <BusBadge busNumber={plannedBuses[0]} small />}
              {plannedBuses.length > 1 && <BusPlanChips buses={plannedBuses} small />}
            </div>
          </div>
        </div>

        <div className="shrink-0">
          <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm">
            <div className="flex items-center gap-2">
              <StatusChipButton
                statusKey="PRESENT"
                disabled={!canEdit}
                isActive={status === "PRESENT"}
                onClick={() => onChange(entry.user.id, "PRESENT", draft.busNumber)}
              />
              <StatusChipButton
                statusKey="ABSENT"
                disabled={!canEdit}
                isActive={status === "ABSENT"}
                onClick={() => onChange(entry.user.id, "ABSENT", null)}
              />
              {plannedBuses.length > 1 && (
                <div className="ml-1 flex items-center gap-1.5 border-l border-gray-200 pl-2">
                  {plannedBuses.map((bus) => (
                    <div key={`mini-${bus}`} className="flex items-center gap-1">
                      <BusOptionButton
                        busNumber={bus}
                        selected={draft.busNumber === bus}
                        disabled={!canEdit}
                        onClick={() =>
                          onChange(
                            entry.user.id,
                            status === "ABSENT" || status === "PENDING" ? "PRESENT" : status,
                            draft.busNumber === bus ? null : bus
                          )
                        }
                      />
                      <span className="text-[10px] font-semibold text-gray-400">B{bus}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {plannedBuses.length > 1 && busMissing && status === "PRESENT" && (
              <div className="mt-1 text-[10px] font-semibold text-red-500 text-right">Bus</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

AttendancePersonRow.propTypes = {
  entry: PropTypes.object.isRequired,
  localValue: PropTypes.shape({
    attendanceStatus: PropTypes.string,
    busNumber: PropTypes.number,
  }),
  onChange: PropTypes.func.isRequired,
  canEdit: PropTypes.bool,
  searchTerm: PropTypes.string,
};

const AttendanceTab = ({ eventId, roster, summary, isAdmin, userSection, onRefetch }) => {
  const [localAttendance, setLocalAttendance] = useState({});
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [groupFilter, setGroupFilter] = useState("ALL");

  const [bulkMarkAttendance] = useMutation(BULK_MARK_ATTENDANCE);
  const canEdit = true; // en prod: chequear role

  const eligible = useMemo(() => {
    let list = (roster || []).filter((e) => !e.excludedFromEvent);
    if (!isAdmin && userSection) list = list.filter((e) => e.assignmentGroup === userSection);
    return list;
  }, [roster, isAdmin, userSection]);

  const groups = useMemo(() => {
    const gs = [...new Set(eligible.map((e) => e.assignmentGroup))];
    return gs.sort((a, b) => SECTIONS_ORDER.indexOf(a) - SECTIONS_ORDER.indexOf(b));
  }, [eligible]);

  const displayed = useMemo(() => {
    let list = eligible;
    if (groupFilter !== "ALL") list = list.filter((e) => e.assignmentGroup === groupFilter);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((e) => fullName(e.user).toLowerCase().includes(s));
    }
    return list;
  }, [eligible, groupFilter, search]);

  const hasUnsaved = Object.keys(localAttendance).length > 0;
  const unsavedCount = Object.keys(localAttendance).length;

  const handleChange = (userId, attendanceStatus, busNumber) =>
    setLocalAttendance((prev) => ({
      ...prev,
      [userId]: {
        attendanceStatus,
        busNumber,
      },
    }));

  const handleMarkAll = (status) => {
    const updates = {};
    displayed.forEach((e) => {
      const currentDraft = getAttendanceDraft(e, localAttendance);
      updates[e.user.id] = {
        attendanceStatus: status,
        busNumber: currentDraft.busNumber,
      };
    });
    setLocalAttendance((prev) => ({ ...prev, ...updates }));
  };

  const handleSave = async () => {
    if (!hasUnsaved) return;
    const missingBus = displayed.filter((entry) => {
      const draft = getAttendanceDraft(entry, localAttendance);
      return (
        ["PRESENT", "LATE"].includes(draft.attendanceStatus) &&
        getPlannedBuses(entry).length > 1 &&
        !draft.busNumber
      );
    });

    if (missingBus.length > 0) {
      setToast({
        message: "Falta confirmar el bus real para algunas personas con seccion dividida",
        type: "warning",
      });
      return;
    }

    setIsSaving(true);
    try {
      const entries = Object.entries(localAttendance).map(([userId, value]) => ({
        userId,
        attendanceStatus: value.attendanceStatus,
        busNumber: value.busNumber ?? null,
      }));
      await bulkMarkAttendance({ variables: { eventId, entries } });
      setLocalAttendance({});
      onRefetch?.();
      setToast({ message: `${entries.length} registros guardados`, type: "success" });
    } catch (e) {
      setToast({ message: e.message || "Error al guardar", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const statsVisible = useMemo(() => {
    const get = (entry) => getAttendanceDraft(entry, localAttendance).attendanceStatus;
    return {
      present: displayed.filter((e) => get(e) === "PRESENT").length,
      absent: displayed.filter((e) => get(e) === "ABSENT").length,
      pending: displayed.filter((e) => !get(e) || get(e) === "PENDING").length,
    };
  }, [displayed, localAttendance]);

  return (
    <div className="space-y-4 pb-28">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        <StatCard label="Presentes" value={statsVisible.present} color="text-emerald-600" />
        <StatCard label="Ausentes" value={statsVisible.absent} color="text-red-600" />
        <StatCard label="Pendientes" value={statsVisible.pending} color="text-gray-400" />
      </div>

      {/* Quick mark all — igual que AttendancePage */}
      {canEdit && (
        <div className="flex gap-2">
          <button
            onClick={() => handleMarkAll("PRESENT")}
            className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1"
          >
            ✓ Todos presentes
          </button>
          <button
            onClick={() => handleMarkAll("ABSENT")}
            className="flex-1 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs sm:text-sm font-semibold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1"
          >
            ✕ Todos ausentes
          </button>
        </div>
      )}

      {/* Search + group filter — mismo patrón que AttendancePage SearchAndFilters */}
      <div className="space-y-2">
        {!isAdmin && userSection && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
            Estas pasando asistencia solo para tu seccion:{" "}
            <strong>{SECTION_LABELS[userSection] || userSection}</strong>.
          </div>
        )}
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar persona…"
            className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:placeholder-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900 transition-all"
          />
          {search && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button
                onClick={() => setSearch("")}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Group pills — solo admin */}
        {isAdmin && groups.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setGroupFilter("ALL")}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                groupFilter === "ALL"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              Todos
            </button>
            {groups.map((g) => (
              <button
                key={g}
                onClick={() => setGroupFilter(g)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  groupFilter === g
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {SECTION_LABELS[g] || g}
              </button>
            ))}
          </div>
        )}

        {search && (
          <p className="text-xs text-gray-500">
            {displayed.length} resultado{displayed.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* List */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {displayed.length === 0 ? (
          <div className="py-14 text-center px-4">
            <svg
              className="w-14 h-14 text-gray-200 mx-auto mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <p className="text-sm text-gray-400">
              {eligible.length === 0
                ? "Roster vacío o sin inicializar"
                : `Sin resultados para "${search}"`}
            </p>
          </div>
        ) : (
          displayed.map((e) => (
            <AttendancePersonRow
              key={e.id}
              entry={e}
              localValue={localAttendance[e.user.id]}
              onChange={handleChange}
              canEdit={canEdit}
              searchTerm={search}
            />
          ))
        )}
      </div>

      {/* Save bar — idéntico al ActionBar de AttendancePage */}
      {hasUnsaved && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 sm:px-6 py-3 sm:py-4 shadow-lg z-[1200]">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
            <span className="text-sm font-medium text-amber-600">
              {unsavedCount} {unsavedCount === 1 ? "cambio" : "cambios"} sin guardar
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setLocalAttendance({})}
                disabled={isSaving}
                className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Descartar
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-5 sm:px-8 py-2 sm:py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Spinner size="sm" />
                    <span className="hidden sm:inline">Guardando…</span>
                  </>
                ) : (
                  "Guardar asistencia"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

AttendanceTab.propTypes = {
  eventId: PropTypes.string.isRequired,
  roster: PropTypes.array,
  summary: PropTypes.object,
  isAdmin: PropTypes.bool,
  userSection: PropTypes.string,
  onRefetch: PropTypes.func,
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE — wrapeado en DashboardLayout como el resto del sistema
// ─────────────────────────────────────────────────────────────────────────────

const EventLogisticsPage = () => {
  const [selectedEvent, setSelectedEvent] = useState("");
  const [activeTab, setActiveTab] = useState("config");
  const [toast, setToast] = useState(null);

  const { data: userData } = useQuery(GET_USERS_BY_ID);
  const currentUser = userData?.getUser;
  const isAdmin = currentUser?.role === "Admin";
  const userSection = STAFF_ROLES.has(currentUser?.role)
    ? "STAFF"
    : mapInstrumentToSection(currentUser?.instrument);

  const { data: eventsData } = useQuery(GET_EVENTS);
  const events = eventsData?.getEvents || [];

  const {
    data: rosterData,
    loading: rosterLoading,
    refetch: refetchRoster,
  } = useQuery(GET_EVENT_ROSTER, {
    variables: { eventId: selectedEvent },
    skip: !selectedEvent,
    fetchPolicy: "cache-and-network",
  });

  const { data: busSummaryData, refetch: refetchBusSummary } = useQuery(GET_EVENT_BUS_SUMMARY, {
    variables: { eventId: selectedEvent },
    skip: !selectedEvent,
  });

  const { data: summaryData, refetch: refetchSummary } = useQuery(GET_EVENT_ATTENDANCE_SUMMARY, {
    variables: { eventId: selectedEvent },
    skip: !selectedEvent,
  });

  const [initRoster, { loading: isInitializing }] = useMutation(INITIALIZE_EVENT_ROSTER);

  const roster = rosterData?.getEventRoster || [];
  const busSummary = busSummaryData?.getEventBusSummary;
  const summary = summaryData?.getEventAttendanceSummary;
  const rosterEmpty = selectedEvent && !rosterLoading && roster.length === 0;
  const selectedEventDetails = events.find((e) => e.id === selectedEvent);
  const visibleTabs = isAdmin ? TABS : TABS.filter((tab) => tab.id === "attendance");

  useEffect(() => {
    if (!selectedEvent) return;

    console.log("[PerformanceAttendance] visibility check", {
      selectedEvent,
      selectedEventTitle: selectedEventDetails?.title || null,
      currentUserId: currentUser?.id || null,
      currentUserRole: currentUser?.role || null,
      isAdmin,
      rosterLoading,
      rosterLength: roster.length,
      rosterEmpty,
      shouldShowInitializeBanner: Boolean(
        isAdmin && selectedEvent && !rosterLoading && roster.length === 0
      ),
    });
  }, [
    selectedEvent,
    selectedEventDetails?.title,
    currentUser?.id,
    currentUser?.role,
    isAdmin,
    rosterLoading,
    roster.length,
    rosterEmpty,
  ]);

  useEffect(() => {
    if (!selectedEvent || isAdmin) return;
    setActiveTab("attendance");
  }, [selectedEvent, isAdmin]);

  const handleRefetch = useCallback(async () => {
    await Promise.all([refetchRoster(), refetchBusSummary(), refetchSummary()]);
  }, [refetchRoster, refetchBusSummary, refetchSummary]);

  const handleEventSelect = (id) => {
    setSelectedEvent(id);
    setActiveTab(isAdmin ? "config" : "attendance");
  };

  const handleInitRoster = async () => {
    try {
      console.log("[PerformanceAttendance] initialize roster click", {
        selectedEvent,
        selectedEventTitle: selectedEventDetails?.title || null,
        currentUserId: currentUser?.id || null,
        currentUserRole: currentUser?.role || null,
      });
      await initRoster({ variables: { eventId: selectedEvent } });
      await handleRefetch();
      setToast({ message: "Roster inicializado correctamente", type: "success" });
    } catch (e) {
      console.error("[PerformanceAttendance] initialize roster error", e);
      setToast({ message: e.message || "Error al inicializar", type: "error" });
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <SoftBox py={3}>
        <Card>
          {/* ── Card header ─────────────────────────────────────────────── */}
          <SoftBox p={3}>
            {/* Title row */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
              <SoftTypography variant="h6">
                Logística de presentaciones
                {selectedEventDetails && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    — {selectedEventDetails.title}
                  </span>
                )}
              </SoftTypography>

              {/* Summary pills */}
              {summary && selectedEvent && (
                <div className="flex flex-wrap gap-2">
                  {[
                    {
                      label: "Convocados",
                      val: summary.convoked,
                      cls: "bg-blue-50 text-blue-700 border-blue-200",
                    },
                    {
                      label: "Presentes",
                      val: summary.present,
                      cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
                    },
                    {
                      label: "Ausentes",
                      val: summary.absent,
                      cls: "bg-red-50 text-red-700 border-red-200",
                    },
                    {
                      label: "Excluidos",
                      val: summary.excluded,
                      cls: "bg-gray-100 text-gray-600 border-gray-200",
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${s.cls}`}
                    >
                      <span className="font-mono font-bold">{s.val}</span>
                      <span>{s.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Event selector */}
            <div className="relative max-w-sm">
              <select
                value={selectedEvent}
                onChange={(e) => handleEventSelect(e.target.value)}
                className="w-full border border-gray-300 text-gray-900 text-sm font-medium rounded-xl px-4 py-2.5 pr-10 appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar evento…</option>
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>

            {/* Initialize roster banner */}
            {isAdmin && rosterEmpty && (
              <div className="mt-3 flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-amber-800">Roster no inicializado</p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    Genera la lista de convocados para este evento
                  </p>
                </div>
                <button
                  onClick={handleInitRoster}
                  disabled={isInitializing}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1"
                >
                  {isInitializing ? <Spinner size="sm" /> : "Inicializar roster"}
                </button>
              </div>
            )}
          </SoftBox>

          {/* Tab bar */}
          {selectedEvent && (
            <TabBar active={activeTab} onChange={setActiveTab} tabs={visibleTabs} />
          )}

          {/* Tab content area */}
          <SoftBox
            sx={{
              "& .MuiTableRow-root:not(:last-child)": {
                "& td": {
                  borderBottom: ({ borders: { borderWidth, borderColor } }) =>
                    `${borderWidth[1]} solid ${borderColor}`,
                },
              },
            }}
          >
            {!selectedEvent ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <svg
                  className="w-16 h-16 text-gray-200 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <h3 className="text-base font-semibold text-gray-700 mb-1">Selecciona un evento</h3>
                <p className="text-sm text-gray-400 max-w-xs">
                  Elige un evento para gestionar logística de transporte y asistencia
                </p>
              </div>
            ) : rosterLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <Spinner size="lg" />
                  <p className="text-sm text-gray-500 mt-3">Cargando roster…</p>
                </div>
              </div>
            ) : (
              <div className="px-3 sm:px-4 py-4 bg-gray-50 min-h-[400px]">
                {isAdmin && activeTab === "config" && (
                  <ConfigTab
                    eventId={selectedEvent}
                    roster={roster}
                    busSummary={busSummary}
                    isAdmin={isAdmin}
                    onRefetch={handleRefetch}
                  />
                )}
                {isAdmin && activeTab === "exclusions" && (
                  <ExclusionsTab
                    eventId={selectedEvent}
                    roster={roster}
                    isAdmin={isAdmin}
                    onRefetch={handleRefetch}
                  />
                )}
                {activeTab === "attendance" && (
                  <AttendanceTab
                    eventId={selectedEvent}
                    roster={roster}
                    summary={summary}
                    isAdmin={isAdmin}
                    userSection={userSection}
                    onRefetch={handleRefetch}
                  />
                )}
              </div>
            )}
          </SoftBox>
        </Card>
      </SoftBox>

      <Footer />

      {/* Global toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        .animate-slide-in-right { animation: slide-in-right 0.3s ease-out; }

        @keyframes slide-up {
          from { transform: translateY(16px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.25s ease-out; }

        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        mark { background-color: #fef08a; font-weight: 600; border-radius: 2px; }
      `}</style>
    </DashboardLayout>
  );
};

export default EventLogisticsPage;
