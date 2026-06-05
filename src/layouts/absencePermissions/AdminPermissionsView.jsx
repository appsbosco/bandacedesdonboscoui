/* eslint-disable react/prop-types */
import React, { useState, useMemo } from "react";
import { useQuery } from "@apollo/client";
import { PermissionRequestCard } from "./components/PermissionRequestCard";
import { PermissionReviewModal } from "./components/PermissionReviewModal";
import {
  GET_ABSENCE_PERMISSIONS_ADMIN,
  GET_EVENTS_FOR_PERMISSION_FORM,
} from "./absencePermissions.gql";
import { formatPermissionDate, parsePermissionDate } from "./dateUtils";

const STATUS_FILTERS = [
  { value: "", label: "Todos" },
  { value: "PENDING", label: "Pendientes" },
  { value: "APPROVED", label: "Aprobados" },
  { value: "REJECTED", label: "Rechazados" },
  { value: "CANCELLED", label: "Cancelados" },
];

const TYPE_FILTERS = [
  { value: "", label: "Todos" },
  { value: "REHEARSAL", label: "Ensayos" },
  { value: "PERFORMANCE", label: "Presentaciones" },
];

const PERMISSION_TYPE_FILTERS = [
  { value: "", label: "Todas" },
  { value: "ABSENCE", label: "Ausencias" },
  { value: "LATE_ARRIVAL", label: "Llegadas tardías" },
  { value: "EARLY_WITHDRAWAL", label: "Retiros anticipados" },
];
const EMPTY_PERMISSIONS = [];
const METRIC_COLOR_MAP = {
  yellow: "bg-amber-50 border-amber-200 text-amber-700",
  green: "bg-emerald-50 border-emerald-200 text-emerald-700",
  red: "bg-red-50 border-red-200 text-red-700",
  blue: "bg-blue-50 border-blue-200 text-blue-700",
  gray: "bg-gray-50 border-gray-200 text-gray-600",
};

function MetricCard({ label, value, color }) {
  return (
    <div className={`rounded-2xl border px-4 py-3 ${METRIC_COLOR_MAP[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium mt-0.5 opacity-80">{label}</p>
    </div>
  );
}

function compareByClosestUpcoming(a, b) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dateA = parsePermissionDate(a.date);
  const dateB = parsePermissionDate(b.date);
  const timeA = dateA?.getTime?.() ?? Number.POSITIVE_INFINITY;
  const timeB = dateB?.getTime?.() ?? Number.POSITIVE_INFINITY;
  const aIsUpcoming = timeA >= today.getTime();
  const bIsUpcoming = timeB >= today.getTime();

  if (aIsUpcoming !== bIsUpcoming) return aIsUpcoming ? -1 : 1;
  return aIsUpcoming ? timeA - timeB : timeB - timeA;
}

export function AdminPermissionsView() {
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [permissionTypeFilter, setPermissionTypeFilter] = useState("");
  const [eventFilter, setEventFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [detailPermission, setDetailPermission] = useState(null);

  const filter = useMemo(() => {
    const f = {};
    if (statusFilter) f.requestStatus = statusFilter;
    if (typeFilter) f.targetType = typeFilter;
    if (permissionTypeFilter) f.permissionType = permissionTypeFilter;
    if (eventFilter) f.eventId = eventFilter;
    if (startDate) f.startDate = startDate;
    if (endDate) f.endDate = endDate;
    return Object.keys(f).length ? f : undefined;
  }, [statusFilter, typeFilter, permissionTypeFilter, eventFilter, startDate, endDate]);

  const { data: eventsData } = useQuery(GET_EVENTS_FOR_PERMISSION_FORM, {
    fetchPolicy: "cache-and-network",
  });
  const eventOptionsByCategory = useMemo(() => {
    const events = (eventsData?.getEvents ?? [])
      .filter((event) => event.category === "rehearsal" || event.category === "presentation")
      .sort(compareByClosestUpcoming);

    return {
      rehearsal: events.filter((event) => event.category === "rehearsal"),
      presentation: events.filter((event) => event.category === "presentation"),
    };
  }, [eventsData]);

  const { data, loading, refetch } = useQuery(GET_ABSENCE_PERMISSIONS_ADMIN, {
    variables: { filter, limit: 100 },
    fetchPolicy: "cache-and-network",
  });

  const permissions = data?.getAbsencePermissionsAdmin?.items ?? EMPTY_PERMISSIONS;
  const total = data?.getAbsencePermissionsAdmin?.totalCount ?? 0;

  const metrics = useMemo(() => {
    const all = permissions;
    return {
      pending: all.filter((p) => p.requestStatus === "PENDING").length,
      approved: all.filter((p) => p.requestStatus === "APPROVED").length,
      rejected: all.filter((p) => p.requestStatus === "REJECTED").length,
      justified: all.filter((p) => p.justificationStatus === "JUSTIFIED").length,
      notJustified: all.filter((p) => p.justificationStatus === "NOT_JUSTIFIED").length,
    };
  }, [permissions]);

  const refetchQueries = [
    { query: GET_ABSENCE_PERMISSIONS_ADMIN, variables: { filter, limit: 100 } },
  ];

  const activeFiltersCount = [
    statusFilter,
    typeFilter,
    permissionTypeFilter,
    eventFilter,
    startDate,
    endDate,
  ].filter(Boolean).length;

  function handleTypeFilterChange(value) {
    setTypeFilter(value);
    setEventFilter("");
  }

  function handleRehearsalEventFilterChange(value) {
    setTypeFilter("REHEARSAL");
    setEventFilter(value);
  }

  function handlePresentationEventFilterChange(value) {
    setTypeFilter("PERFORMANCE");
    setEventFilter(value);
  }

  const selectedRehearsalEvent = typeFilter === "REHEARSAL" ? eventFilter : "";
  const selectedPresentationEvent = typeFilter === "PERFORMANCE" ? eventFilter : "";

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Permisos de asistencia</h1>
          <p className="text-sm text-gray-500 mt-1">
            Revisá y gestioná todas las solicitudes de permiso.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Actualizar
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <MetricCard label="Pendientes" value={metrics.pending} color="yellow" />
        <MetricCard label="Aprobados" value={metrics.approved} color="green" />
        <MetricCard label="Rechazados" value={metrics.rejected} color="red" />
        <MetricCard label="Justificados" value={metrics.justified} color="blue" />
        <MetricCard label="No justificados" value={metrics.notJustified} color="gray" />
      </div>

      {/* Filter bar */}
      <div className="space-y-3">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Tipo de permiso
          </p>
          <div className="flex flex-wrap gap-1.5">
            {PERMISSION_TYPE_FILTERS.map((filterOption) => (
              <button
                key={filterOption.value}
                type="button"
                onClick={() => setPermissionTypeFilter(filterOption.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  permissionTypeFilter === filterOption.value
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {filterOption.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Actividad
          </p>
          <div className="flex flex-wrap gap-1.5">
            {TYPE_FILTERS.map((filterOption) => (
              <button
                key={filterOption.value}
                type="button"
                onClick={() => handleTypeFilterChange(filterOption.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  typeFilter === filterOption.value
                    ? "bg-blue-600 text-white"
                    : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                }`}
              >
                {filterOption.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="permissions-rehearsal-event-filter"
              className="mb-1 block text-xs font-medium text-gray-500"
            >
              Ensayo
            </label>
            <select
              id="permissions-rehearsal-event-filter"
              value={selectedRehearsalEvent}
              onChange={(event) => handleRehearsalEventFilterChange(event.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los ensayos</option>
              {eventOptionsByCategory.rehearsal.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title} · {formatPermissionDate(event.date)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="permissions-presentation-event-filter"
              className="mb-1 block text-xs font-medium text-gray-500"
            >
              Presentación
            </label>
            <select
              id="permissions-presentation-event-filter"
              value={selectedPresentationEvent}
              onChange={(event) => handlePresentationEventFilterChange(event.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las presentaciones</option>
              {eventOptionsByCategory.presentation.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title} · {formatPermissionDate(event.date)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1.5 flex-wrap flex-1">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  statusFilter === f.value
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeFiltersCount > 0
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            Filtros{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ""}
          </button>
        </div>

        {showFilters && (
          <div className="bg-gray-50 rounded-2xl p-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="permissions-start-date"
                className="block text-xs font-medium text-gray-500 mb-1"
              >
                Desde
              </label>
              <input
                id="permissions-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label
                htmlFor="permissions-end-date"
                className="block text-xs font-medium text-gray-500 mb-1"
              >
                Hasta
              </label>
              <input
                id="permissions-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setPermissionTypeFilter("");
                setTypeFilter("");
                setEventFilter("");
                setStartDate("");
                setEndDate("");
              }}
              className="text-xs text-gray-400 hover:text-gray-600 underline sm:col-span-2"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-36 bg-gray-100 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : permissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <p className="font-semibold text-gray-700">Sin solicitudes</p>
          <p className="text-sm text-gray-400 mt-1">
            No hay permisos que coincidan con los filtros aplicados.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-gray-400">
            {total} solicitud{total !== 1 ? "es" : ""} en total
          </p>
          {permissions.map((p) => (
            <PermissionRequestCard
              key={p.id}
              permission={p}
              showStudent
              onViewDetail={setDetailPermission}
            />
          ))}
        </div>
      )}

      {/* Review modal */}
      <PermissionReviewModal
        permission={detailPermission}
        isOpen={Boolean(detailPermission)}
        onClose={() => setDetailPermission(null)}
        refetchQueries={refetchQueries}
      />
    </div>
  );
}
