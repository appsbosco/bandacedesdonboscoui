/* eslint-disable react/prop-types */

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useLazyQuery, useQuery, useMutation } from "@apollo/client";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { GET_USERS_BY_ID } from "graphql/queries";
import {
  GET_EVENTS,
  GET_TICKETS,
  GET_EVENT_STATS,
  UPDATE_PAYMENT,
  UPDATE_TICKET_QUANTITY,
  CANCEL_TICKET,
  DELETE_TICKET,
  RESEND_TICKET_EMAIL,
  StatusBadge,
  StatCard,
  EmptyState,
  Spinner,
  getHolderName,
  getHolderEmail,
  TYPE_META,
  fmt,
} from "./Shared";

const STATUS_TABS = [
  { value: "", label: "Todos" },
  { value: "pending_payment", label: "Pendientes" },
  { value: "paid", label: "Pagados" },
  { value: "checked_in", label: "Ingresaron" },
  { value: "fully_used", label: "Usados" },
  { value: "cancelled", label: "Cancelados" },
];

const TICKET_ADMIN_ROLES = new Set(["Admin", "Director", "Dirección Logística", "Tickets Admin"]);

function formatEventDate(date) {
  if (!date) return "Fecha pendiente";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Fecha pendiente";

  return parsed.toLocaleDateString("es-CR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function EventCard({ event, isSelected, onClick }) {
  const capacity = Number(event.ticketLimit || 0);
  const issued = Number(event.totalTickets || 0);
  const remaining = Math.max(0, capacity - issued);
  const pct = capacity > 0 ? Math.min(100, (issued / capacity) * 100) : 0;
  const isFull = capacity > 0 && issued >= capacity;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`bg-white rounded-2xl border shadow-sm hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group overflow-hidden text-left ${
        isSelected ? "border-gray-900 ring-2 ring-gray-900/10" : "border-gray-200"
      }`}
    >
      <div
        className={`h-1 w-full ${
          isSelected ? "bg-gray-900" : isFull ? "bg-red-400" : "bg-emerald-400"
        }`}
      />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-gray-900 truncate group-hover:text-gray-700 transition-colors">
              {event.name}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <svg
                className="w-3.5 h-3.5 text-gray-400 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-xs text-gray-500 truncate">{formatEventDate(event.date)}</span>
            </div>
          </div>
          <span
            className={`text-xs px-2 py-1 rounded-full font-semibold border ${
              isSelected
                ? "bg-gray-900 text-white border-gray-900"
                : isFull
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-emerald-50 text-emerald-700 border-emerald-200"
            }`}
          >
            {isSelected ? "Activo" : isFull ? "Lleno" : "Disponible"}
          </span>
        </div>

        {event.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-4">{event.description}</p>
        )}

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-xs">
            <span className="font-medium text-gray-700">Capacidad</span>
            <span className="text-gray-400">
              {issued} / {capacity}
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isFull ? "bg-red-400" : "bg-blue-500"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">{remaining} cupos disponibles</span>
          <span className="text-xs font-bold text-gray-700">{fmt(event.price || 0)}</span>
        </div>
      </div>
    </button>
  );
}

function PaymentBar({ amountPaid, total }) {
  const pct = total > 0 ? Math.min(100, (amountPaid / total) * 100) : 0;
  return (
    <div className="w-28">
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>{fmt(amountPaid)}</span>
        <span>{pct.toFixed(0)}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            pct >= 100 ? "bg-green-500" : "bg-amber-400"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function TicketList() {
  const navigate = useNavigate();
  const { eventId: routeEventId } = useParams();
  const [eventId, setEventId] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState("");
  const [payingId, setPayingId] = useState(null);
  const [updatingQuantityId, setUpdatingQuantityId] = useState(null);
  const [resendingId, setResendingId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const openMenuRef = useRef(null);

  const { data: eventsData, loading: eventsLoading } = useQuery(GET_EVENTS);
  const { data: currentUserData } = useQuery(GET_USERS_BY_ID);
  const [loadTickets, { data: ticketsData, loading: ticketsLoading, refetch }] = useLazyQuery(
    GET_TICKETS,
    { fetchPolicy: "cache-and-network" }
  );
  const { data: statsData, refetch: refetchStats } = useQuery(GET_EVENT_STATS, {
    variables: { eventId },
    skip: !eventId,
  });

  const [updatePayment, { loading: paying }] = useMutation(UPDATE_PAYMENT, {
    onCompleted: () => {
      setPayingId(null);
      refetch?.();
      refetchStats?.();
    },
  });
  const [updateTicketQuantity] = useMutation(UPDATE_TICKET_QUANTITY, {
    onCompleted: (data) => {
      const updated = data?.updateTicketQuantity;
      setUpdatingQuantityId(null);
      setSuccess(
        updated
          ? `Cantidad actualizada a ${updated.ticketQuantity} entrada${
              updated.ticketQuantity !== 1 ? "s" : ""
            }.`
          : "Cantidad actualizada correctamente."
      );
      refetch?.();
      refetchStats?.();
    },
    onError: (mutationError) => {
      setUpdatingQuantityId(null);
      setError(mutationError.message || "No se pudo actualizar la cantidad");
    },
  });
  const [resendTicketEmail, { loading: resending }] = useMutation(
    RESEND_TICKET_EMAIL,
    {
      onCompleted: () => {
        setResendingId(null);
        setSuccess("Entradas reenviadas correctamente.");
      },
      onError: (mutationError) => {
        setResendingId(null);
        setError(mutationError.message || "No se pudieron reenviar las entradas");
      },
    }
  );
  const [cancelTicket] = useMutation(CANCEL_TICKET, {
    onCompleted: () => {
      setCancellingId(null);
      setSuccess("Entrada anulada correctamente. El QR quedó inválido.");
      refetch?.();
      refetchStats?.();
    },
    onError: (mutationError) => {
      setCancellingId(null);
      setError(mutationError.message || "No se pudo anular la entrada");
    },
  });
  const [deleteTicket] = useMutation(DELETE_TICKET, {
    onCompleted: () => {
      setDeletingId(null);
      setSuccess("Entrada eliminada permanentemente.");
      refetch?.();
      refetchStats?.();
    },
    onError: (mutationError) => {
      setDeletingId(null);
      setError(mutationError.message || "No se pudo eliminar la entrada");
    },
  });

  const stats = statsData?.getEventStats;
  const events = useMemo(() => eventsData?.getEventsT || [], [eventsData]);
  const isEventDetailPage = Boolean(routeEventId);
  const canAdministerTicketEmails = TICKET_ADMIN_ROLES.has(currentUserData?.getUser?.role || "");

  useEffect(() => {
    if (!openMenuId) return undefined;

    const handleClickOutside = (event) => {
      if (openMenuRef.current && !openMenuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuId]);

  useEffect(() => {
    const id = routeEventId || "";
    setEventId(id);
    setSearch("");
    setStatusTab("");
    setOpenMenuId(null);
    setError(null);
    setSuccess(null);

    const ev = events.find((e) => e.id === id);
    setSelectedEvent(ev || null);

    if (id) {
      loadTickets({ variables: { eventId: id } });
    }
  }, [events, loadTickets, routeEventId]);

  const handleEventOpen = useCallback(
    (id) => {
      if (!id) return;
      navigate(`/lista-entradas/${id}`);
    },
    [navigate]
  );

  const handleBackToEvents = useCallback(() => {
    setEventId("");
    setSelectedEvent(null);
    setOpenMenuId(null);
    navigate("/lista-entradas");
  }, [navigate]);

  const handleRefresh = useCallback(() => {
    refetch?.();
    refetchStats?.();
  }, [refetch, refetchStats]);

  const handleCancelTicket = useCallback(
    async (ticket) => {
      if (!ticket?.id || ticket.status === "cancelled") return;

      const label = getHolderName(ticket);
      const confirmed = window.confirm(
        `Se anulará la entrada de ${label}. Esta acción invalidará el QR y la marcará como cancelada.`
      );
      if (!confirmed) return;

      const reason =
        window.prompt("Motivo de anulación (opcional):", "Anulada desde gestión de entradas") ||
        undefined;

      setOpenMenuId(null);
      setError(null);
      setSuccess(null);
      setCancellingId(ticket.id);

      await cancelTicket({
        variables: {
          ticketId: ticket.id,
          reason,
          cancelledBy: currentUserData?.getUser?.id || undefined,
        },
      });
    },
    [cancelTicket, currentUserData]
  );

  const handleDeleteTicket = useCallback(
    async (ticket) => {
      if (!ticket?.id) return;

      const label = getHolderName(ticket);
      const confirmed = window.confirm(
        `Vas a eliminar permanentemente la entrada de ${label}. Esta acción sí borra el registro y ajusta el cupo del evento.`
      );
      if (!confirmed) return;

      setOpenMenuId(null);
      setError(null);
      setSuccess(null);
      setDeletingId(ticket.id);

      await deleteTicket({
        variables: {
          ticketId: ticket.id,
        },
      });
    },
    [deleteTicket]
  );

  const handleUpdateTicketQuantity = useCallback(
    async (ticket) => {
      if (!ticket?.id || ticket.status === "cancelled") return;

      const label = getHolderName(ticket);
      const rawValue = window.prompt(
        `Nueva cantidad de entradas para ${label}:`,
        String(ticket.ticketQuantity || 1)
      );
      if (rawValue === null) return;

      const nextQuantity = Number(rawValue);
      if (!Number.isInteger(nextQuantity) || nextQuantity <= 0) {
        setError("La cantidad debe ser un número entero mayor a 0");
        return;
      }
      if (nextQuantity < Number(ticket.scans || 0)) {
        setError(
          `No se puede bajar a ${nextQuantity}; ya hay ${ticket.scans} ingreso(s) registrados`
        );
        return;
      }
      if (nextQuantity === Number(ticket.ticketQuantity || 1)) {
        setOpenMenuId(null);
        return;
      }

      setOpenMenuId(null);
      setError(null);
      setSuccess(null);
      setUpdatingQuantityId(ticket.id);

      await updateTicketQuantity({
        variables: {
          ticketId: ticket.id,
          ticketQuantity: nextQuantity,
        },
      });
    },
    [updateTicketQuantity]
  );

  const tickets = useMemo(() => {
    const all = ticketsData?.getTickets || [];
    return all.filter((t) => {
      const q = search.toLowerCase();
      const matchS = !statusTab || t.status === statusTab;
      const matchQ =
        !q ||
        getHolderName(t).toLowerCase().includes(q) ||
        getHolderEmail(t).toLowerCase().includes(q) ||
        (t.raffleNumbers || []).some((n) => n.includes(q));
      return matchS && matchQ;
    });
  }, [ticketsData, search, statusTab]);

  const totalCollected = useMemo(() => tickets.reduce((s, t) => s + t.amountPaid, 0), [tickets]);
  const totalDue = useMemo(
    () => tickets.reduce((s, t) => s + t.ticketQuantity * (selectedEvent?.price || 0), 0),
    [tickets, selectedEvent]
  );

  if (eventsLoading)
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <Spinner />
        </div>
        <Footer />
      </DashboardLayout>
    );

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            {isEventDetailPage && (
              <button
                onClick={handleBackToEvents}
                className="mb-3 inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
              >
                <span>←</span>
                Volver a eventos
              </button>
            )}
            <h1 className="text-xl font-semibold text-gray-900">
              {isEventDetailPage
                ? selectedEvent?.name || "Entradas del evento"
                : "Gestión de entradas"}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {isEventDetailPage
                ? "Gestiona entradas, pagos, ingresos y acciones administrativas"
                : "Selecciona un evento para gestionar sus entradas"}
            </p>
          </div>
          {eventId && (
            <button
              onClick={handleRefresh}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-600 bg-white hover:bg-gray-50 transition-colors"
            >
              Actualizar
            </button>
          )}
        </div>

        {!isEventDetailPage && (
          <div className="mb-6">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Eventos</h2>
                <p className="text-xs text-gray-500">
                  {events.length} evento{events.length !== 1 ? "s" : ""} disponible
                  {events.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {events.length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center">
                <p className="text-sm font-semibold text-gray-900">Sin eventos registrados</p>
                <p className="text-xs text-gray-500 mt-1">
                  Crea un evento para comenzar a gestionar entradas.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {events.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    isSelected={event.id === eventId}
                    onClick={() => handleEventOpen(event.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {!eventId ? (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
            {/* <EmptyState
              icon="📋"
              title="Selecciona un evento"
              subtitle="Elige una tarjeta de evento para ver sus entradas"
            /> */}
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {success && (
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <span className="text-lg">✅</span>
                <span className="text-sm text-green-700 font-medium flex-1">{success}</span>
                <button
                  onClick={() => setSuccess(null)}
                  className="text-green-500 hover:text-green-700 text-lg"
                >
                  ✕
                </button>
              </div>
            )}
            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <span className="text-lg">⚠️</span>
                <span className="text-sm text-red-700 flex-1">{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-600 text-lg"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Stats */}
            {stats && (
              <>
                {/* Capacity bar */}
                <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-gray-800">{stats.eventName}</span>
                    <span className="text-gray-400">
                      {stats.totalIssued} / {stats.capacity} emitidas
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{
                        width: `${
                          stats.capacity > 0 ? (stats.totalIssued / stats.capacity) * 100 : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard
                    icon="🎟"
                    label="Emitidas"
                    value={stats.totalIssued}
                    sub={`${stats.remaining} disponibles`}
                  />
                  <StatCard
                    icon="✅"
                    label="Pagadas"
                    value={stats.totalPaid}
                    sub={`${
                      stats.totalIssued > 0
                        ? ((stats.totalPaid / stats.totalIssued) * 100).toFixed(0)
                        : 0
                    }%`}
                  />
                  <StatCard icon="⏳" label="Pendientes" value={stats.totalPending} />
                  <StatCard icon="🚪" label="Ingresaron" value={stats.totalCheckedIn} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <StatCard
                    icon="💵"
                    label="Recaudado"
                    value={fmt(stats.totalCollected || 0)}
                    sub={`Meta teórica ${fmt(
                      (stats.totalIssued || 0) * (selectedEvent?.price || 0)
                    )}`}
                  />
                  <StatCard
                    icon="📈"
                    label="Cobro promedio"
                    value={fmt(
                      stats.totalIssued > 0 ? (stats.totalCollected || 0) / stats.totalIssued : 0
                    )}
                    sub="Monto promedio por ticket emitido"
                  />
                </div>
              </>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-48">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  🔍
                </span>
                <input
                  className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="Buscar por nombre, correo o número de rifa…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Status tabs */}
              <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                {STATUS_TABS.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setStatusTab(tab.value)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                      statusTab === tab.value
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab.label}
                    {tab.value && ticketsData?.getTickets && (
                      <span className="ml-1 opacity-50">
                        {ticketsData.getTickets.filter((t) => t.status === tab.value).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              {ticketsLoading ? (
                <div className="flex justify-center py-16">
                  <Spinner />
                </div>
              ) : tickets.length === 0 ? (
                <EmptyState
                  icon="🔎"
                  title="Sin resultados"
                  subtitle={
                    search || statusTab ? "Ajusta los filtros" : "No hay entradas para este evento"
                  }
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">
                          Estado
                        </th>
                        <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">
                          Titular
                        </th>
                        <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3 hidden md:table-cell">
                          Correo
                        </th>
                        <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">
                          Tipo
                        </th>
                        <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">
                          Ingresos
                        </th>
                        <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">
                          Rifa
                        </th>
                        <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">
                          Pago
                        </th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {tickets.map((ticket) => {
                        const total = ticket.ticketQuantity * (selectedEvent?.price || 0);
                        const isPaying = payingId === ticket.id && paying;
                        const isUpdatingQuantity = updatingQuantityId === ticket.id;
                        const isResending = resendingId === ticket.id && resending;
                        const isCancelling = cancellingId === ticket.id;
                        const isDeleting = deletingId === ticket.id;
                        const tm = TYPE_META[ticket.type] || { label: ticket.type, icon: "🎟" };
                        return (
                          <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <StatusBadge status={ticket.status} />
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-medium text-gray-800">
                                {getHolderName(ticket)}
                              </span>
                              <span className="block text-xs text-gray-400">
                                {ticket.ticketQuantity} entrada
                                {ticket.ticketQuantity !== 1 ? "s" : ""}
                              </span>
                              {ticket.source === "excel_import" && (
                                <span className="block text-[11px] text-indigo-500 font-medium">
                                  Importado
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-400 font-mono hidden md:table-cell">
                              {getHolderEmail(ticket)}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                              {tm.icon} {tm.label}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`font-mono text-xs ${
                                  ticket.scans > 0 ? "text-blue-600" : "text-gray-400"
                                }`}
                              >
                                {ticket.scans}/{ticket.ticketQuantity}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs font-mono text-gray-400 hidden lg:table-cell">
                              {ticket.raffleNumbers?.length ? ticket.raffleNumbers.join(", ") : "—"}
                            </td>
                            <td className="px-4 py-3">
                              {selectedEvent && (
                                <PaymentBar amountPaid={ticket.amountPaid} total={total} />
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-2">
                                <div className="flex items-start gap-2">
                                  {!ticket.paid && ticket.type !== "courtesy" && (
                                    <button
                                      onClick={() => {
                                        const rem = total - ticket.amountPaid;
                                        if (rem <= 0) return;
                                        setPayingId(ticket.id);
                                        updatePayment({
                                          variables: { ticketId: ticket.id, amountPaid: rem },
                                        });
                                      }}
                                      disabled={isPaying}
                                      className="flex items-center gap-1.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                                    >
                                      {isPaying ? <Spinner /> : "Completar pago"}
                                    </button>
                                  )}

                                  <div
                                    className="relative"
                                    ref={openMenuId === ticket.id ? openMenuRef : null}
                                  >
                                    <button
                                      onClick={() =>
                                        setOpenMenuId((current) =>
                                          current === ticket.id ? null : ticket.id
                                        )
                                      }
                                      disabled={isUpdatingQuantity || isCancelling || isDeleting}
                                      className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors disabled:opacity-50"
                                      aria-label="Más acciones"
                                    >
                                      ⋯
                                    </button>

                                    {openMenuId === ticket.id && (
                                      <div className="absolute right-0 top-10 z-20 min-w-[180px] rounded-xl border border-gray-200 bg-white shadow-lg p-1.5">
                                        {ticket.status !== "cancelled" && (
                                          <button
                                            onClick={() => handleUpdateTicketQuantity(ticket)}
                                            disabled={
                                              isUpdatingQuantity || isCancelling || isDeleting
                                            }
                                            className="w-full flex items-center rounded-lg px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                                          >
                                            {isUpdatingQuantity
                                              ? "Actualizando…"
                                              : "Editar cantidad"}
                                          </button>
                                        )}
                                        {ticket.status !== "cancelled" && (
                                          <button
                                            onClick={() => handleCancelTicket(ticket)}
                                            disabled={isCancelling || isDeleting}
                                            className="w-full flex items-center rounded-lg px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50"
                                          >
                                            {isCancelling ? "Anulando…" : "Anular entrada"}
                                          </button>
                                        )}
                                        <button
                                          onClick={() => handleDeleteTicket(ticket)}
                                          disabled={isDeleting || isCancelling}
                                          className="w-full flex items-center rounded-lg px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                                        >
                                          {isDeleting ? "Eliminando…" : "Eliminar"}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {canAdministerTicketEmails && ticket.status !== "cancelled" && (
                                  <button
                                    onClick={() => {
                                      setError(null);
                                      setSuccess(null);
                                      setResendingId(ticket.id);
                                      resendTicketEmail({
                                        variables: { ticketId: ticket.id },
                                      });
                                    }}
                                    disabled={isResending}
                                    className="flex items-center gap-1.5 text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50"
                                  >
                                    {isResending ? <Spinner /> : "Reenviar entradas"}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {tickets.length > 0 && (
                <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                  <span>
                    {tickets.length} entrada{tickets.length !== 1 ? "s" : ""}
                  </span>
                  {selectedEvent && (
                    <span className="font-mono">
                      {fmt(totalCollected)} / {fmt(totalDue)}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </DashboardLayout>
  );
}
