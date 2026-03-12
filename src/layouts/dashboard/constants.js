// src/layouts/dashboard/constants.js
// Constantes compartidas entre Dashboard.jsx y sus sub-componentes.
// Al tenerlas aquí, DashboardTabs y StatsRow no necesitan importar
// desde el archivo principal (lo que causaría imports circulares).

export const BAND_COLORS = {
  "Banda de concierto avanzada": {
    bg: "bg-blue-600",
    text: "text-blue-700",
    light: "bg-blue-50",
    dot: "#2563EB",
  },
  "Banda de concierto elemental": {
    bg: "bg-emerald-600",
    text: "text-emerald-700",
    light: "bg-emerald-50",
    dot: "#059669",
  },
  "Banda de concierto inicial": {
    bg: "bg-violet-600",
    text: "text-violet-700",
    light: "bg-violet-50",
    dot: "#7C3AED",
  },
  "Banda de concierto intermedia": {
    bg: "bg-amber-600",
    text: "text-amber-700",
    light: "bg-amber-50",
    dot: "#D97706",
  },
  "Banda de marcha": { bg: "bg-red-600", text: "text-red-700", light: "bg-red-50", dot: "#DC2626" },
  "Big Band A": { bg: "bg-cyan-600", text: "text-cyan-700", light: "bg-cyan-50", dot: "#0891B2" },
  "Big Band B": { bg: "bg-pink-600", text: "text-pink-700", light: "bg-pink-50", dot: "#DB2777" },
};

export const TABS = [
  { key: "presentation", label: "Presentaciones", emoji: "🎵" },
  { key: "rehearsal", label: "Ensayos", emoji: "🎼" },
  { key: "activity", label: "Actividades", emoji: "🎉" },
  { key: "other", label: "Otros", emoji: "📌" },
];
