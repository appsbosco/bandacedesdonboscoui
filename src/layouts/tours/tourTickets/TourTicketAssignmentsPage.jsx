/* eslint-disable react/prop-types */
import { useMemo, useState } from "react";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client";
import { Download, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { GET_TOUR_ITINERARIES } from "../tourFlights/tourItineraries.gql";
import { participantFullName } from "./ticketMatching";
import { materializeProtectedUrl } from "./ticketUpload";
import {
  DELETE_TOUR_PARTICIPANT_TICKET,
  GET_TICKET_DOWNLOAD,
  REASSIGN_TOUR_PARTICIPANT_TICKET,
  TOUR_PARTICIPANT_TICKETS,
} from "./tourTickets.gql";

function ticketParticipantName(ticket) {
  return participantFullName(ticket.participant);
}

export default function TourTicketAssignmentsPage({ tourId }) {
  const [itineraryFilter, setItineraryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState(null);
  const { data: itineraryData, loading: loadingItineraries } = useQuery(GET_TOUR_ITINERARIES, {
    variables: { tourId },
    skip: !tourId,
    fetchPolicy: "cache-and-network",
  });
  const {
    data: ticketData,
    loading: loadingTickets,
    error,
    refetch,
  } = useQuery(TOUR_PARTICIPANT_TICKETS, {
    variables: { tourId },
    skip: !tourId,
    fetchPolicy: "cache-and-network",
  });
  const [reassignTicket, { loading: reassigning }] = useMutation(REASSIGN_TOUR_PARTICIPANT_TICKET);
  const [deleteTicket, { loading: deleting }] = useMutation(DELETE_TOUR_PARTICIPANT_TICKET);
  const [getDownload] = useLazyQuery(GET_TICKET_DOWNLOAD, { fetchPolicy: "network-only" });
  const itineraries = itineraryData?.getTourItineraries || [];
  const tickets = ticketData?.tourParticipantTickets || [];
  const countsByItinerary = useMemo(
    () =>
      tickets.reduce((counts, ticket) => {
        counts[ticket.itinerary.id] = (counts[ticket.itinerary.id] || 0) + 1;
        return counts;
      }, {}),
    [tickets]
  );
  const visibleTickets = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tickets.filter((ticket) => {
      if (itineraryFilter !== "all" && ticket.itinerary.id !== itineraryFilter) return false;
      if (!query) return true;
      return [ticketParticipantName(ticket), ticket.originalName, ticket.itinerary.name]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [tickets, itineraryFilter, search]);
  const editItinerary = itineraries.find((item) => item.id === editing?.itineraryId);

  const openFile = async (ticket, disposition) => {
    try {
      setNotice(null);
      const { data } = await getDownload({ variables: { ticketId: ticket.id, disposition } });
      const result = await materializeProtectedUrl(data.getTourParticipantTicketDownload.url);
      const anchor = document.createElement("a");
      anchor.href = result.url;
      anchor.target = disposition === "inline" ? "_blank" : "_self";
      anchor.rel = "noreferrer";
      if (disposition === "attachment") anchor.download = ticket.originalName;
      anchor.click();
      if (result.revoke) window.setTimeout(() => URL.revokeObjectURL(result.url), 30000);
    } catch (downloadError) {
      setNotice({ type: "error", message: downloadError.message });
    }
  };

  const startEditing = (ticket) => {
    setNotice(null);
    setEditing({
      ticketId: ticket.id,
      itineraryId: ticket.itinerary.id,
      participantId: ticket.participant.id,
    });
  };

  const saveAssignment = async () => {
    try {
      await reassignTicket({
        variables: {
          id: editing.ticketId,
          input: {
            itineraryId: editing.itineraryId,
            participantId: editing.participantId,
          },
        },
      });
      setEditing(null);
      setNotice({ type: "success", message: "La asignación se actualizó correctamente." });
      await refetch();
    } catch (mutationError) {
      setNotice({ type: "error", message: mutationError.message });
    }
  };

  const removeAssignment = async (ticket) => {
    const confirmed = window.confirm(
      `¿Eliminar el tiquete asignado a ${ticketParticipantName(
        ticket
      )}? El PDF privado también será eliminado y esta acción no se puede deshacer.`
    );
    if (!confirmed) return;
    try {
      setNotice(null);
      const { data } = await deleteTicket({ variables: { id: ticket.id } });
      setNotice({
        type: data.deleteTourParticipantTicket.cleanupPending ? "error" : "success",
        message: data.deleteTourParticipantTicket.cleanupPending
          ? "La asignación se eliminó, pero la limpieza del archivo requiere revisión."
          : "La asignación y su archivo privado fueron eliminados.",
      });
      await refetch();
    } catch (mutationError) {
      setNotice({ type: "error", message: mutationError.message });
    }
  };

  if (loadingTickets || loadingItineraries)
    return <div className="h-52 animate-pulse rounded-2xl bg-gray-100" />;

  return (
    <section className="space-y-4" aria-labelledby="assigned-tickets-heading">
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 id="assigned-tickets-heading" className="text-sm font-bold text-gray-800">
            Tiquetes asignados
          </h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Revisa, corrige o elimina las asignaciones actuales de la gira.
          </p>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(220px,0.7fr)]">
          <label className="text-xs font-medium text-gray-500">
            Itinerario
            <select
              value={itineraryFilter}
              onChange={(event) => setItineraryFilter(event.target.value)}
              className="mt-1.5 block h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-normal text-gray-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">Todos los itinerarios · {tickets.length} tiquetes</option>
              {itineraries.map((itinerary) => (
                <option key={itinerary.id} value={itinerary.id}>
                  {itinerary.name} · {countsByItinerary[itinerary.id] || 0} tiquetes
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-gray-500">
            Buscar
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Participante o archivo"
              className="mt-1.5 block h-10 w-full rounded-xl border border-gray-200 px-3 text-sm font-normal text-gray-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
        </div>
      </div>

      {(error || notice) && (
        <div
          role="status"
          className={`rounded-xl border p-3 text-sm ${
            error || notice?.type === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {error?.message || notice?.message}
        </div>
      )}

      {!visibleTickets.length ? (
        <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center">
          <p className="text-sm font-semibold text-gray-700">No hay tiquetes en esta selección</p>
          <p className="mt-1 text-xs text-gray-500">
            Cambia el itinerario o importa un nuevo lote de PDF.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-xs">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Participante</th>
                  <th className="px-4 py-3 font-semibold">Itinerario</th>
                  <th className="px-4 py-3 font-semibold">Archivo</th>
                  <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visibleTickets.map((ticket) => (
                  <tr key={ticket.id} className="align-top">
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-gray-800">{ticketParticipantName(ticket)}</p>
                      <p className="mt-0.5 text-[10px] text-gray-400">
                        {ticket.participant.instrument || ticket.participant.role || "Participante"}
                      </p>
                    </td>
                    <td className="max-w-[280px] px-4 py-3.5 text-gray-600">
                      {ticket.itinerary.name}
                    </td>
                    <td className="max-w-[260px] px-4 py-3.5">
                      <p className="truncate text-gray-600" title={ticket.originalName}>
                        {ticket.originalName}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openFile(ticket, "inline")}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 font-semibold text-gray-600 hover:bg-gray-100"
                        >
                          <ExternalLink size={14} aria-hidden="true" /> Abrir
                        </button>
                        <button
                          type="button"
                          onClick={() => openFile(ticket, "attachment")}
                          title="Descargar PDF"
                          aria-label={`Descargar tiquete de ${ticketParticipantName(ticket)}`}
                          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                        >
                          <Download size={15} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => startEditing(ticket)}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 font-semibold text-blue-600 hover:bg-blue-50"
                        >
                          <Pencil size={14} aria-hidden="true" /> Editar
                        </button>
                        <button
                          type="button"
                          disabled={deleting}
                          onClick={() => removeAssignment(ticket)}
                          title="Eliminar asignación"
                          aria-label={`Eliminar tiquete de ${ticketParticipantName(ticket)}`}
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 size={15} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editing && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <h3 className="text-sm font-bold text-gray-800">Corregir asignación</h3>
          <p className="mt-0.5 text-xs text-gray-500">
            El PDF se conserva; solamente cambiará el itinerario o participante asociado.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="text-xs font-medium text-gray-600">
              Itinerario correcto
              <select
                value={editing.itineraryId}
                onChange={(event) =>
                  setEditing({
                    ...editing,
                    itineraryId: event.target.value,
                    participantId: "",
                  })
                }
                className="mt-1.5 block h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-normal"
              >
                {itineraries.map((itinerary) => (
                  <option key={itinerary.id} value={itinerary.id}>
                    {itinerary.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium text-gray-600">
              Participante correcto
              <select
                value={editing.participantId}
                onChange={(event) => setEditing({ ...editing, participantId: event.target.value })}
                className="mt-1.5 block h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-normal"
              >
                <option value="">Seleccionar participante…</option>
                {(editItinerary?.participants || []).map((participant) => (
                  <option key={participant.id} value={participant.id}>
                    {participantFullName(participant)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-white"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!editing.participantId || reassigning}
              onClick={saveAssignment}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-gray-300"
            >
              {reassigning ? "Guardando…" : "Guardar cambio"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
