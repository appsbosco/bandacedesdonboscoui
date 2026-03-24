/* eslint-disable react/prop-types */

import React, { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { GET_USERS_BY_ID } from "graphql/queries";
import {
  GET_EVENTS,
  GET_MY_TICKETS,
  EmptyState,
  Spinner,
  StatCard,
  StatusBadge,
  TYPE_META,
  fmt,
} from "./Shared";

const STATUS_TABS = [
  { value: "", label: "Todas" },
  { value: "pending_payment", label: "Pendientes" },
  { value: "paid", label: "Pagadas" },
  { value: "checked_in", label: "Ingresadas" },
  { value: "partially_used", label: "Parciales" },
  { value: "fully_used", label: "Usadas" },
  { value: "cancelled", label: "Canceladas" },
];

function formatDate(date) {
  if (!date) return "Fecha no disponible";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Fecha no disponible";
  return new Intl.DateTimeFormat("es-CR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

export default function MyTickets() {
  const [statusTab, setStatusTab] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  const { data: userData, loading: userLoading } = useQuery(GET_USERS_BY_ID);
  const { data: eventsData } = useQuery(GET_EVENTS);
  const { data: ticketsData, loading: ticketsLoading, error: ticketsError } = useQuery(GET_MY_TICKETS, {
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
  });

  const currentUser = userData?.getUser || null;
  const eventsMap = useMemo(() => {
    const entries = eventsData?.getEventsT || [];
    return Object.fromEntries(entries.map((event) => [String(event.id), event]));
  }, [eventsData]);

  const tickets = useMemo(() => {
    const all = ticketsData?.getMyTickets || [];
    return all.filter((ticket) => !statusTab || ticket.status === statusTab);
  }, [ticketsData, statusTab]);

  const selectedTicket = useMemo(() => {
    if (!tickets.length) return null;
    return tickets.find((ticket) => ticket.id === selectedTicketId) || tickets[0];
  }, [tickets, selectedTicketId]);

  const stats = useMemo(() => {
    const all = ticketsData?.getMyTickets || [];
    const active = all.filter((ticket) => ticket.status !== "cancelled").length;
    const paid = all.filter((ticket) => ticket.paid || ticket.type === "courtesy").length;
    const totalEntries = all.reduce((sum, ticket) => sum + (ticket.ticketQuantity || 0), 0);
    return { total: all.length, active, paid, totalEntries };
  }, [ticketsData]);

  if (userLoading || ticketsLoading) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <Spinner />
        </div>
        <Footer />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Mis entradas</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Consulta tu QR y el estado actual de tus entradas
            </p>
          </div>
          {currentUser && (
            <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm">
              <p className="text-sm font-medium text-gray-900">
                {currentUser.name} {currentUser.firstSurName}
              </p>
              <p className="text-xs text-gray-400 mt-1">{currentUser.email}</p>
            </div>
          )}
        </div>

        {ticketsError ? (
          <div className="bg-white border border-red-100 rounded-2xl shadow-sm">
            <EmptyState
              icon="⚠️"
              title="No se pudieron cargar tus entradas"
              subtitle={ticketsError.message || "Intenta nuevamente más tarde"}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard icon="🎟" label="Tickets" value={stats.total} sub="Registros asignados" />
              <StatCard icon="🟢" label="Activos" value={stats.active} sub="No cancelados" />
              <StatCard icon="✅" label="Pagados" value={stats.paid} sub="Pagos al día" />
              <StatCard
                icon="🔢"
                label="Entradas"
                value={stats.totalEntries}
                sub="Cantidad total disponible"
              />
            </div>

            {stats.total === 0 ? (
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
                <EmptyState
                  icon="🎫"
                  title="Todavía no tienes entradas"
                  subtitle="Cuando te asignen una, la verás aquí con su QR y su estado."
                />
              </div>
            ) : (
              <>
                <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto w-fit">
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
                    </button>
                  ))}
                </div>

                {tickets.length === 0 ? (
                  <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
                    <EmptyState
                      icon="🔎"
                      title="No hay entradas con ese estado"
                      subtitle="Prueba con otro filtro para ver tus entradas."
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-[380px_minmax(0,1fr)] gap-5 items-start">
                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-800">Tus tickets</p>
                      </div>
                      <div className="max-h-[720px] overflow-y-auto">
                        {tickets.map((ticket) => {
                          const event = eventsMap[String(ticket.eventId)];
                          const isSelected = selectedTicket?.id === ticket.id;
                          const totalDue = (ticket.ticketQuantity || 0) * Number(event?.price || 0);
                          return (
                            <button
                              key={ticket.id}
                              onClick={() => setSelectedTicketId(ticket.id)}
                              className={`w-full px-4 py-4 text-left border-b border-gray-50 transition-colors ${
                                isSelected ? "bg-gray-50" : "hover:bg-gray-50"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-gray-900 truncate">
                                    {event?.name || "Evento"}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {formatDate(event?.date || ticket.createdAt)}
                                  </p>
                                </div>
                                <StatusBadge status={ticket.status} />
                              </div>
                              <p className="text-xs text-gray-500 mt-3">
                                {TYPE_META[ticket.type]?.icon} {TYPE_META[ticket.type]?.label} ·{" "}
                                {ticket.ticketQuantity} entrada
                                {ticket.ticketQuantity !== 1 ? "s" : ""}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                Pagado {fmt(ticket.amountPaid || 0)} de {fmt(totalDue)}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {selectedTicket && (
                      <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6">
                        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                          <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                              Ticket seleccionado
                            </p>
                            <h2 className="text-2xl font-semibold text-gray-900">
                              {eventsMap[String(selectedTicket.eventId)]?.name || "Evento"}
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                              {formatDate(
                                eventsMap[String(selectedTicket.eventId)]?.date || selectedTicket.createdAt
                              )}
                            </p>
                          </div>
                          <StatusBadge status={selectedTicket.status} />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-6 items-start">
                          <div className="rounded-3xl border border-gray-100 bg-gray-50 p-5">
                            {selectedTicket.qrCode ? (
                              <img
                                src={selectedTicket.qrCode}
                                alt="Código QR de la entrada"
                                className="w-full rounded-2xl bg-white p-4 border border-gray-100"
                              />
                            ) : (
                              <div className="aspect-square rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-sm text-gray-400">
                                QR no disponible
                              </div>
                            )}
                            <p className="text-xs text-center text-gray-400 mt-3">
                              Presenta este QR en el ingreso del evento.
                            </p>
                          </div>

                          <div className="grid sm:grid-cols-2 gap-3">
                            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                Tipo
                              </span>
                              <p className="text-sm font-medium text-gray-900 mt-2">
                                {TYPE_META[selectedTicket.type]?.icon}{" "}
                                {TYPE_META[selectedTicket.type]?.label}
                              </p>
                            </div>
                            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                Cantidad
                              </span>
                              <p className="text-sm font-medium text-gray-900 mt-2">
                                {selectedTicket.ticketQuantity} entrada
                                {selectedTicket.ticketQuantity !== 1 ? "s" : ""}
                              </p>
                            </div>
                            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                Ingresos usados
                              </span>
                              <p className="text-sm font-medium text-gray-900 mt-2">
                                {selectedTicket.scans}/{selectedTicket.ticketQuantity}
                              </p>
                            </div>
                            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                Pago
                              </span>
                              <p className="text-sm font-medium text-gray-900 mt-2">
                                {fmt(selectedTicket.amountPaid || 0)} /{" "}
                                {fmt(
                                  (selectedTicket.ticketQuantity || 0) *
                                    Number(eventsMap[String(selectedTicket.eventId)]?.price || 0)
                                )}
                              </p>
                            </div>
                            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 sm:col-span-2">
                              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                Estado actual
                              </span>
                              <div className="mt-3">
                                <StatusBadge status={selectedTicket.status} />
                              </div>
                              <p className="text-xs text-gray-500 mt-3">
                                {selectedTicket.status === "pending_payment"
                                  ? "Esta entrada todavía tiene pago pendiente."
                                  : selectedTicket.status === "cancelled"
                                  ? "La entrada fue cancelada y ya no es válida."
                                  : selectedTicket.status === "fully_used"
                                  ? "Todas las entradas de este ticket ya fueron utilizadas."
                                  : selectedTicket.status === "partially_used"
                                  ? "Ya se usó parte de las entradas incluidas en este ticket."
                                  : selectedTicket.status === "checked_in"
                                  ? "La entrada ya registró ingreso."
                                  : "Tu entrada está lista para presentarse en el evento."}
                              </p>
                            </div>
                            {selectedTicket.raffleNumbers?.length ? (
                              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 sm:col-span-2">
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                  Números de rifa
                                </span>
                                <div className="flex flex-wrap gap-2 mt-3">
                                  {selectedTicket.raffleNumbers.map((number) => (
                                    <span
                                      key={number}
                                      className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-white text-gray-700 border border-gray-200"
                                    >
                                      {number}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
      <Footer />
    </DashboardLayout>
  );
}
