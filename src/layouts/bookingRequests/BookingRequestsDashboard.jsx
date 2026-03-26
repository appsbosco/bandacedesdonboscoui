import { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useMutation, useQuery } from "@apollo/client";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import {
  GET_BOOKING_REQUESTS,
  UPDATE_BOOKING_REQUEST_STATUS,
} from "layouts/agrupaciones/bookingRequests.gql";

const STATUS_OPTIONS = [
  { value: "", label: "Todos los estados" },
  { value: "NEW", label: "Nueva" },
  { value: "IN_REVIEW", label: "En revisión" },
  { value: "CONTACTED", label: "Contactada" },
  { value: "QUOTED", label: "Cotizada" },
  { value: "CLOSED", label: "Cerrada" },
];

const ENSEMBLE_OPTIONS = [
  { value: "", label: "Todas las agrupaciones" },
  { value: "BANDAS_DE_CONCIERTO", label: "Bandas de Concierto" },
  { value: "BIG_BAND", label: "Big Band" },
  { value: "BANDA_DE_MARCHA", label: "Banda de Marcha" },
  { value: "CIMARRONA", label: "Cimarrona" },
];

const STATUS_LABELS = Object.fromEntries(STATUS_OPTIONS.map((item) => [item.value, item.label]));
const ENSEMBLE_LABELS = Object.fromEntries(
  ENSEMBLE_OPTIONS.map((item) => [item.value, item.label])
);
const EVENT_TYPE_LABELS = {
  CONCERT: "Concierto",
  FESTIVAL: "Festival",
  PARADE: "Desfile",
  WEDDING: "Boda",
  CORPORATE: "Evento corporativo",
  INSTITUTIONAL: "Evento institucional",
  COMMUNITY: "Evento comunal",
  PRIVATE: "Celebración privada",
  PROTOCOL: "Acto protocolario",
  OTHER: "Otro",
};
const STATUS_STYLES = {
  NEW: "border-sky-100 bg-sky-50 text-sky-700",
  IN_REVIEW: "border-amber-100 bg-amber-50 text-amber-700",
  CONTACTED: "border-violet-100 bg-violet-50 text-violet-700",
  QUOTED: "border-emerald-100 bg-emerald-50 text-emerald-700",
  CLOSED: "border-slate-200 bg-slate-100 text-slate-600",
};
const BUDGET_CURRENCY_LABELS = {
  CRC: "CRC",
  USD: "USD",
};

function parseDateValue(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(value) {
  const parsed = parseDateValue(value);
  if (!parsed) return "—";

  return parsed.toLocaleDateString("es-CR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function getEventTypeLabel(eventType, eventTypeOther) {
  if (eventType === "OTHER" && eventTypeOther) {
    return `${EVENT_TYPE_LABELS.OTHER}: ${eventTypeOther}`;
  }

  return EVENT_TYPE_LABELS[eventType] || eventType || "—";
}

function getLocationLabel(request) {
  return (
    [request?.venue, request?.province, request?.canton, request?.district]
      .filter(Boolean)
      .join(", ") || "—"
  );
}

function getBudgetLabel(request) {
  if (request?.estimatedBudget == null) return "No indicado";
  const currency = request?.budgetCurrency
    ? ` ${BUDGET_CURRENCY_LABELS[request.budgetCurrency] || request.budgetCurrency}`
    : "";
  return `${request.estimatedBudget}${currency}`;
}

function getInitials(name = "") {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "SR"
  );
}

export default function BookingRequestsDashboard() {
  const [filters, setFilters] = useState({
    ensemble: "",
    status: "",
    dateFrom: "",
    dateTo: "",
    searchText: "",
  });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [statusDraft, setStatusDraft] = useState("NEW");
  const [statusNotesDraft, setStatusNotesDraft] = useState("");

  const queryFilter = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== "" && value != null)
      ),
    [filters]
  );

  const { data, loading, refetch } = useQuery(GET_BOOKING_REQUESTS, {
    variables: { filter: queryFilter },
    fetchPolicy: "cache-and-network",
  });

  const [updateStatus, { loading: savingStatus }] = useMutation(UPDATE_BOOKING_REQUEST_STATUS);
  const requests = data?.getBookingRequests || [];

  const rows = useMemo(
    () =>
      requests.map((item) => ({
        ...item,
        ensembleLabel: ENSEMBLE_LABELS[item.ensemble] || item.ensemble || "—",
        statusLabel: STATUS_LABELS[item.status] || item.status || "—",
        eventTypeLabel: getEventTypeLabel(item.eventType, item.eventTypeOther),
        eventDateLabel: formatDate(item.eventDate),
        createdAtLabel: formatDate(item.createdAt),
        locationLabel: getLocationLabel(item),
      })),
    [requests]
  );

  const handleRowClick = (request) => {
    setSelectedRequest(request);
    setStatusDraft(request.status);
    setStatusNotesDraft(request.statusNotes || "");
  };

  const handleSaveStatus = async () => {
    if (!selectedRequest) return;

    await updateStatus({
      variables: {
        id: selectedRequest.id,
        input: {
          status: statusDraft,
          statusNotes: statusNotesDraft,
        },
      },
    });

    await refetch();
    setSelectedRequest((current) =>
      current
        ? {
            ...current,
            status: statusDraft,
            statusNotes: statusNotesDraft,
          }
        : current
    );
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <div className="space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200/70 ring-1 ring-slate-200">
          <h1 className="text-3xl font-semibold text-slate-900">Solicitudes de contratación</h1>
          <p className="mt-2 text-sm text-slate-500">
            Bandeja administrativa para revisar, filtrar y dar seguimiento a las solicitudes de
            agrupaciones.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <select
              value={filters.ensemble}
              onChange={(event) =>
                setFilters((current) => ({ ...current, ensemble: event.target.value }))
              }
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
            >
              {ENSEMBLE_OPTIONS.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={filters.status}
              onChange={(event) =>
                setFilters((current) => ({ ...current, status: event.target.value }))
              }
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={filters.dateFrom}
              onChange={(event) =>
                setFilters((current) => ({ ...current, dateFrom: event.target.value }))
              }
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
            />

            <input
              type="date"
              value={filters.dateTo}
              onChange={(event) =>
                setFilters((current) => ({ ...current, dateTo: event.target.value }))
              }
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
            />

            <input
              type="search"
              placeholder="Buscar por nombre, correo, empresa…"
              value={filters.searchText}
              onChange={(event) =>
                setFilters((current) => ({ ...current, searchText: event.target.value }))
              }
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
            />
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
          <div className="rounded-3xl bg-white p-4 shadow-sm shadow-slate-200/70 ring-1 ring-slate-200">
            <BookingRequestsTable
              rows={rows}
              loading={loading}
              selectedRequestId={selectedRequest?.id || null}
              onRowClick={handleRowClick}
            />
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200/70 ring-1 ring-slate-200">
            {selectedRequest ? (
              <div className="space-y-5">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
                    {ENSEMBLE_LABELS[selectedRequest.ensemble]}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                    {selectedRequest.fullName}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">{selectedRequest.email}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Info label="Teléfono" value={selectedRequest.phone} />
                  <Info label="Empresa" value={selectedRequest.company || "No indicada"} />
                  <Info
                    label="Tipo de evento"
                    value={getEventTypeLabel(
                      selectedRequest.eventType,
                      selectedRequest.eventTypeOther
                    )}
                  />
                  <Info label="Fecha evento" value={formatDate(selectedRequest.eventDate)} />
                  <Info label="Hora" value={selectedRequest.eventTime} />
                  <Info label="Duración" value={selectedRequest.estimatedDuration} />
                  <Info
                    label="Público esperado (opcional)"
                    value={selectedRequest.expectedAudience ?? "No indicado"}
                  />
                  <Info label="Presupuesto" value={getBudgetLabel(selectedRequest)} />
                </div>

                <Info
                  label="Lugar"
                  value={[
                    selectedRequest.venue,
                    selectedRequest.province,
                    selectedRequest.canton,
                    selectedRequest.district,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                />
                <Info label="Dirección" value={selectedRequest.address} />
                <Info label="Mensaje" value={selectedRequest.message} />

                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="text-sm font-semibold text-slate-700">Seguimiento</p>
                  <div className="mt-4 space-y-4">
                    <select
                      value={statusDraft}
                      onChange={(event) => setStatusDraft(event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                    >
                      {STATUS_OPTIONS.filter((option) => option.value).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <textarea
                      rows="4"
                      value={statusNotesDraft}
                      onChange={(event) => setStatusNotesDraft(event.target.value)}
                      placeholder="Notas internas"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                    />

                    <button
                      onClick={handleSaveStatus}
                      disabled={savingStatus}
                      className="inline-flex items-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:opacity-60"
                    >
                      {savingStatus ? "Guardando..." : "Guardar estado"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center text-sm text-slate-500">
                Selecciona una solicitud para ver su detalle y actualizar el estado.
              </div>
            )}
          </div>
        </div>

        {loading ? <p className="text-sm text-slate-500">Cargando solicitudes...</p> : null}
      </div>

      <Footer />
    </DashboardLayout>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-800">{value}</p>
    </div>
  );
}

Info.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.node]).isRequired,
};

function BookingRequestsTable({ rows, loading, selectedRequestId, onRowClick }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-gray-900">Solicitudes</p>
          {!loading && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
              {rows.length}
            </span>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-gray-500">
                Solicitante
              </th>
              <th className="hidden px-4 py-3 text-left font-semibold uppercase tracking-wide text-gray-500 md:table-cell">
                Agrupación
              </th>
              <th className="hidden px-4 py-3 text-left font-semibold uppercase tracking-wide text-gray-500 lg:table-cell">
                Evento
              </th>
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-gray-500">
                Fecha
              </th>
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-gray-500">
                Estado
              </th>
              <th className="hidden px-4 py-3 text-left font-semibold uppercase tracking-wide text-gray-500 xl:table-cell">
                Lugar
              </th>
              <th className="hidden px-4 py-3 text-left font-semibold uppercase tracking-wide text-gray-500 lg:table-cell">
                Creada
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50">
            {loading && rows.length === 0
              ? Array.from({ length: 6 }, (_, index) => <BookingRequestSkeletonRow key={index} />)
              : null}

            {!loading && rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center">
                  <p className="text-sm font-bold text-gray-900">Sin solicitudes</p>
                  <p className="mt-1 text-xs text-gray-400">
                    Ajusta los filtros o espera nuevos ingresos.
                  </p>
                </td>
              </tr>
            ) : null}

            {rows.map((row) => {
              const isActive = row.id === selectedRequestId;

              return (
                <tr
                  key={row.id}
                  onClick={() => onRowClick(row)}
                  className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                    isActive ? "bg-sky-50/80" : "bg-white"
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-[11px] font-bold text-gray-600">
                        {getInitials(row.fullName)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-900">{row.fullName}</p>
                        <p className="truncate text-[11px] text-gray-400">{row.email}</p>
                        <p className="truncate text-[10px] text-gray-300 md:hidden">
                          {row.ensembleLabel}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-gray-600 md:table-cell">
                    {row.ensembleLabel}
                  </td>
                  <td className="hidden px-4 py-3 text-gray-600 lg:table-cell">
                    {row.eventTypeLabel}
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {row.eventDateLabel}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={row.status} label={row.statusLabel} />
                  </td>
                  <td className="hidden px-4 py-3 text-gray-600 xl:table-cell">
                    {row.locationLabel}
                  </td>
                  <td className="hidden px-4 py-3 text-gray-600 whitespace-nowrap lg:table-cell">
                    {row.createdAtLabel}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

BookingRequestsTable.propTypes = {
  rows: PropTypes.arrayOf(PropTypes.object).isRequired,
  loading: PropTypes.bool.isRequired,
  selectedRequestId: PropTypes.string,
  onRowClick: PropTypes.func.isRequired,
};

BookingRequestsTable.defaultProps = {
  selectedRequestId: null,
};

function StatusBadge({ status, label }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
        STATUS_STYLES[status] || "border-slate-200 bg-slate-100 text-slate-600"
      }`}
    >
      {label}
    </span>
  );
}

StatusBadge.propTypes = {
  status: PropTypes.string,
  label: PropTypes.string.isRequired,
};

StatusBadge.defaultProps = {
  status: "",
};

function BookingRequestSkeletonRow() {
  return (
    <tr className="border-b border-gray-50">
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <td key={item} className="px-4 py-3">
          <div
            className="h-4 animate-pulse rounded-full bg-gray-100"
            style={{ width: `${45 + item * 8}%` }}
          />
        </td>
      ))}
    </tr>
  );
}
