/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { useLazyQuery, useQuery } from "@apollo/client";
import { Plane } from "lucide-react";
import { GET_TICKET_DOWNLOAD, MY_TOUR_PARTICIPANT_TICKET } from "./tourTickets.gql";
import { materializeProtectedUrl } from "./ticketUpload";
import { calculateCountdown, getNextDeparture } from "./ticketCountdown";

function participantName(participant) {
  return [participant?.firstName, participant?.firstSurname, participant?.secondSurname]
    .filter(Boolean)
    .join(" ");
}

function FlightCountdown({ flight }) {
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const countdown = calculateCountdown(flight.departureAt, currentTime);
  const units = [
    [countdown.days, "Días"],
    [countdown.hours, "Horas"],
    [countdown.minutes, "Minutos"],
    [countdown.seconds, "Segundos"],
  ];

  return (
    <div
      role="timer"
      aria-live="off"
      aria-label={`Faltan ${countdown.days} días, ${countdown.hours} horas, ${countdown.minutes} minutos y ${countdown.seconds} segundos para la próxima salida`}
      className="rounded-[24px] bg-slate-100/80 px-3 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:px-4 sm:py-5"
    >
      <div className="px-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600">
          Tu próximo vuelo
        </p>
        <p className="mt-1 text-xs font-semibold text-slate-600">Cuenta regresiva para la salida</p>
      </div>
      <div className="mt-4 grid grid-cols-4 divide-x divide-slate-200/80" aria-hidden="true">
        {units.map(([value, label]) => (
          <div key={label} className="px-1.5 py-2 text-center text-slate-950 sm:px-2">
            <strong className="block text-2xl font-black tabular-nums tracking-tight sm:text-3xl">
              {String(value).padStart(2, "0")}
            </strong>
            <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TourTicketViewer({ ticket, url, loading, error }) {
  if (loading)
    return (
      <div
        className="min-h-[420px] rounded-2xl bg-slate-100 animate-pulse"
        aria-label="Cargando vista previa"
      />
    );
  if (error || !url)
    return (
      <div className="min-h-[280px] rounded-2xl border border-amber-200 bg-amber-50 flex flex-col items-center justify-center p-8 text-center">
        <span className="text-3xl" aria-hidden="true">
          📄
        </span>
        <p className="mt-3 text-sm font-bold text-amber-900">Vista previa no disponible</p>
        <p className="mt-1 text-xs text-amber-700">
          No fue posible mostrar la vista previa. Puedes intentar descargar o abrir el archivo.
        </p>
      </div>
    );
  return (
    <object
      data={url}
      type="application/pdf"
      title={`Vista previa de ${ticket.originalName}`}
      className="w-full min-h-[480px] rounded-2xl bg-slate-100"
    >
      <p className="p-6 text-sm">No fue posible mostrar la vista previa.</p>
    </object>
  );
}

export default function TourTicketTab({
  tourId,
  participant,
  previewState = null,
  previewTicket = null,
}) {
  const participantId = participant?.id || null;
  const { data, loading, error, refetch } = useQuery(MY_TOUR_PARTICIPANT_TICKET, {
    variables: { tourId, participantId },
    skip: !tourId || Boolean(previewState),
    fetchPolicy: "cache-and-network",
  });
  const [getDownload] = useLazyQuery(GET_TICKET_DOWNLOAD, { fetchPolicy: "network-only" });
  const [preview, setPreview] = useState({ url: null, loading: false, error: null, revoke: false });
  const ticket =
    previewState === "assigned" ? previewTicket : data?.myTourParticipantTicket || null;
  const [currentDepartureTime, setCurrentDepartureTime] = useState(Date.now());
  const nextFlight = getNextDeparture(ticket?.itinerary?.flights, currentDepartureTime);

  useEffect(() => {
    const interval = window.setInterval(() => setCurrentDepartureTime(Date.now()), 60000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    let active = true;
    let objectUrl = null;
    if (previewState === "assigned" && ticket?.url) {
      setPreview({ url: ticket.url, loading: false, error: null, revoke: false });
      return undefined;
    }
    if (!ticket?.id) {
      setPreview({ url: null, loading: false, error: null, revoke: false });
      return undefined;
    }
    setPreview({ url: null, loading: true, error: null, revoke: false });
    getDownload({ variables: { ticketId: ticket.id, disposition: "inline" } })
      .then(({ data: downloadData }) =>
        materializeProtectedUrl(downloadData.getTourParticipantTicketDownload.url)
      )
      .then((result) => {
        if (!active) {
          if (result.revoke) URL.revokeObjectURL(result.url);
          return;
        }
        objectUrl = result.revoke ? result.url : null;
        setPreview({ ...result, loading: false, error: null });
      })
      .catch(
        (downloadError) =>
          active && setPreview({ url: null, loading: false, error: downloadError, revoke: false })
      );
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [ticket?.id, ticket?.url, previewState, getDownload]);

  const download = async (disposition) => {
    try {
      if (previewState === "assigned" && ticket.url) {
        const anchor = document.createElement("a");
        anchor.href = ticket.url;
        anchor.target = disposition === "inline" ? "_blank" : "_self";
        if (disposition === "attachment") anchor.download = ticket.originalName;
        anchor.click();
        return;
      }
      const { data: downloadData } = await getDownload({
        variables: { ticketId: ticket.id, disposition },
      });
      const result = await materializeProtectedUrl(
        downloadData.getTourParticipantTicketDownload.url
      );
      const anchor = document.createElement("a");
      anchor.href = result.url;
      anchor.target = disposition === "inline" ? "_blank" : "_self";
      anchor.rel = "noreferrer";
      if (disposition === "attachment") anchor.download = ticket.originalName;
      anchor.click();
      if (result.revoke) window.setTimeout(() => URL.revokeObjectURL(result.url), 30_000);
    } catch (downloadError) {
      setPreview((current) => ({ ...current, error: downloadError }));
    }
  };

  if ((loading || previewState === "loading") && !ticket)
    return (
      <div className="space-y-4 animate-pulse" aria-label="Cargando tiquete">
        <div className="h-28 bg-gray-100 rounded-2xl" />
        <div className="h-96 bg-gray-100 rounded-2xl" />
      </div>
    );
  if (error || previewState === "error")
    return (
      <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <p className="text-2xl">⚠️</p>
        <p className="mt-2 text-sm font-bold text-red-800">No se pudo cargar el tiquete</p>
        <p className="mt-1 text-xs text-red-600">
          {error?.message || "Este es el estado que verá el integrante si falla la consulta."}
        </p>
        {!previewState && (
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 text-xs font-bold text-red-800 underline"
          >
            Reintentar
          </button>
        )}
      </div>
    );
  if (!ticket || previewState === "empty")
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
        <h3 className="text-sm font-semibold text-gray-700">Sin tiquete aéreo</h3>
        <p className="mt-1 text-xs text-gray-500">
          Todavía no se ha asignado un tiquete aéreo a este participante.
        </p>
      </div>
    );

  return (
    <section className="space-y-4" aria-labelledby="ticket-heading">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 id="ticket-heading" className="text-sm font-bold text-gray-800">
              Tiquete aéreo
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">{participantName(ticket.participant)}</p>
          </div>
          <span className="px-2.5 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-semibold">
            Asignado
          </span>
        </div>
        <div className="space-y-4 px-5 py-5">
          <div>
            <p className="text-xs font-medium text-gray-400">Tu itinerario</p>
            <p className="mt-0.5 text-sm font-semibold text-gray-700">{ticket.itinerary.name}</p>
          </div>
          {nextFlight ? (
            <>
              <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm">
                  <Plane size={18} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {nextFlight.origin} <span className="text-gray-400">→</span>{" "}
                    {nextFlight.destination}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {new Date(nextFlight.departureAt).toLocaleString("es-CR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      hour: "numeric",
                      minute: "2-digit",
                      timeZone: nextFlight.departureTimeZone || undefined,
                    })}
                  </p>
                </div>
              </div>
              <FlightCountdown flight={nextFlight} />
            </>
          ) : (
            <p className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-xs text-gray-500">
              Este itinerario no tiene una próxima salida programada.
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => download("attachment")}
          className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          Descargar PDF
        </button>
        <button
          type="button"
          onClick={() => download("inline")}
          className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
        >
          Abrir en una nueva pestaña
        </button>
      </div>
      <TourTicketViewer
        ticket={ticket}
        url={preview.url}
        loading={preview.loading}
        error={preview.error}
      />
    </section>
  );
}
