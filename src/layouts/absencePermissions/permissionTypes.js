export const PERMISSION_TYPE_OPTIONS = [
  {
    value: "ABSENCE",
    label: "No asistirá",
    badgeLabel: "Ausencia",
    description: "No podrá asistir a la actividad.",
  },
  {
    value: "LATE_ARRIVAL",
    label: "Llegará tarde",
    badgeLabel: "Llegada tardía",
    description: "Se incorporará después de la hora indicada.",
  },
  {
    value: "EARLY_WITHDRAWAL",
    label: "Se retirará antes",
    badgeLabel: "Retiro anticipado",
    description: "Necesita retirarse antes de finalizar.",
  },
];

export function getPermissionType(type) {
  return (
    PERMISSION_TYPE_OPTIONS.find((option) => option.value === type) ??
    PERMISSION_TYPE_OPTIONS[0]
  );
}

export function getPermissionTypeLabel(type) {
  return getPermissionType(type).badgeLabel;
}

export function getPermissionReasonLabel(type) {
  if (type === "LATE_ARRIVAL") return "Motivo de la llegada tardía";
  if (type === "EARLY_WITHDRAWAL") return "Motivo del retiro anticipado";
  return "Motivo de la ausencia";
}

