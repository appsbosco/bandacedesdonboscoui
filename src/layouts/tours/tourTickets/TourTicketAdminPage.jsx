/* eslint-disable react/prop-types */
import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { GET_TOUR_ITINERARIES } from "../tourFlights/tourItineraries.gql";
import TourTicketImportPage from "./TourTicketImportPage";
import TourTicketTab from "./TourTicketTab";
import { participantFullName } from "./ticketMatching";

const DEMO_PDF =
  "data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCA2MTIgNzkyXSAvUmVzb3VyY2VzIDw8IC9Gb250IDw8IC9GMSA0IDAgUiA+PiA+PiAvQ29udGVudHMgNSAwIFIgPj4KZW5kb2JqCjQgMCBvYmoKPDwgL1R5cGUgL0ZvbnQgL1N1YnR5cGUgL1R5cGUxIC9CYXNlRm9udCAvSGVsdmV0aWNhLUJvbGQgPj4KZW5kb2JqCjUgMCBvYmoKPDwgL0xlbmd0aCA4MSA+PgpzdHJlYW0KQlQgL0YxIDI0IFRmIDcyIDcwMCBUZCAoVElRVUVURSBBRVJFTyAtIERFTU8pIFRqIDAgLTQwIFRkIC9GMSAxMiBUZiAoU2luIGRhdG9zIHBlcnNvbmFsZXMpIFRqIEVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTggMDAwMDAgbiAKMDAwMDAwMDExNSAwMDAwMCBuIAowMDAwMDAwMjQxIDAwMDAwIG4gCjAwMDAwMDAzMjEgMDAwMDAgbiAKdHJhaWxlcgo8PCAvU2l6ZSA2IC9Sb290IDEgMCBSID4+CnN0YXJ0eHJlZgo0NTIKJSVFT0Y=";
const PREVIEW_STATES = [
  { id: "assigned", label: "Tiquete asignado" },
  { id: "empty", label: "Sin tiquete" },
  { id: "loading", label: "Cargando" },
  { id: "error", label: "Error" },
];

export default function TourTicketAdminPage({ tourId }) {
  const [view, setView] = useState("import");
  const [itineraryId, setItineraryId] = useState("");
  const [participantId, setParticipantId] = useState("");
  const [previewState, setPreviewState] = useState("assigned");
  const { data, loading } = useQuery(GET_TOUR_ITINERARIES, {
    variables: { tourId },
    skip: !tourId,
    fetchPolicy: "cache-and-network",
  });
  const itineraries = data?.getTourItineraries || [];
  const itinerary = itineraries.find((item) => item.id === itineraryId) || itineraries[0] || null;
  const participants = itinerary?.participants || [];
  const participant =
    participants.find((item) => item.id === participantId) || participants[0] || null;
  const previewTicket = useMemo(() => {
    if (!participant) return null;

    const currentTime = Date.now();
    const upcomingFlights = (itinerary?.flights || []).filter(
      (flight) => new Date(flight.departureAt).getTime() > currentTime
    );
    const previewFlights = upcomingFlights.length
      ? itinerary.flights
      : [
          {
            id: "preview-flight",
            origin: itinerary?.flights?.[0]?.origin || "San José",
            destination: itinerary?.flights?.[0]?.destination || "Los Ángeles",
            departureAt: new Date(currentTime + 12 * 86400000 + 5 * 3600000).toISOString(),
            departureTimeZone: "America/Costa_Rica",
          },
        ];

    return {
      id: "admin-preview",
      version: 1,
      originalName: `${participantFullName(participant).toUpperCase()}, 26DEC 0500 SAN JOSE.pdf`,
      bytes: 184320,
      assignedAt: new Date().toISOString(),
      participant,
      itinerary: {
        id: itinerary?.id || "preview",
        name: itinerary?.name || "Itinerario de demostración",
        flights: previewFlights,
      },
      url: DEMO_PDF,
    };
  }, [participant, itinerary]);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-2xl w-fit">
        <button
          type="button"
          onClick={() => setView("import")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            view === "import" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
          }`}
        >
          Importar tiquetes
        </button>
        <button
          type="button"
          onClick={() => setView("preview")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            view === "preview" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
          }`}
        >
          Vista del integrante
        </button>
      </div>
      {view === "import" ? (
        <TourTicketImportPage tourId={tourId} />
      ) : (
        <section className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-800">Vista del integrante</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Selecciona un participante para revisar su pantalla.
              </p>
            </div>
            <div className="p-5 grid md:grid-cols-3 gap-4">
              <label className="text-xs font-medium text-gray-500">
                Itinerario
                <select
                  value={itinerary?.id || ""}
                  disabled={loading || !itineraries.length}
                  onChange={(event) => {
                    setItineraryId(event.target.value);
                    setParticipantId("");
                  }}
                  className="mt-1.5 block w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm font-normal text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                >
                  {itineraries.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-medium text-gray-500">
                Integrante
                <select
                  value={participant?.id || ""}
                  disabled={!participants.length}
                  onChange={(event) => setParticipantId(event.target.value)}
                  className="mt-1.5 block w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm font-normal text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                >
                  {participants.map((item) => (
                    <option key={item.id} value={item.id}>
                      {participantFullName(item)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-medium text-gray-500">
                Estado
                <select
                  value={previewState}
                  onChange={(event) => setPreviewState(event.target.value)}
                  className="mt-1.5 block w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm font-normal text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                >
                  {PREVIEW_STATES.map((state) => (
                    <option key={state.id} value={state.id}>
                      {state.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          {participant ? (
            <div>
              <TourTicketTab
                tourId={tourId}
                participant={participant}
                previewState={previewState}
                previewTicket={previewTicket}
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              Este itinerario todavía no tiene participantes asignados.
            </div>
          )}
        </section>
      )}
    </div>
  );
}
