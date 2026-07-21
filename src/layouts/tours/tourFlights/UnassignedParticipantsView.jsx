/* eslint-disable react/prop-types */
/**
 * UnassignedParticipantsView — participants not assigned to any itinerary,
 * with a quick "Asignar a itinerario" action per row.
 */
import { useState } from "react";
import ReassignParticipantModal from "./ReassignParticipantModal";

const EMPTY_PARTICIPANTS = [];
const EMPTY_ITINERARIES = [];

function participantFullName(p) {
  return [p.firstName, p.firstSurname, p.secondSurname].filter(Boolean).join(" ");
}

function sortParticipants(participants) {
  return [...participants].sort((a, b) => {
    const pa = a.role === "STAFF" ? 0 : 1;
    const pb = b.role === "STAFF" ? 0 : 1;
    if (pa !== pb) return pa - pb;
    if (pa === 0) {
      return participantFullName(a).localeCompare(participantFullName(b), "es");
    }
    const sectionA = (a.instrument || "").trim();
    const sectionB = (b.instrument || "").trim();
    const bySection = sectionA.localeCompare(sectionB, "es");
    if (bySection !== 0) return bySection;
    return participantFullName(a).localeCompare(participantFullName(b), "es");
  });
}

function getMissingItineraryReason(participant, tourEndDate) {
  if (participant.visaStatus === "DENIED") {
    return { label: "Visa denegada", blocking: true, tone: "red" };
  }
  if (!participant.hasVisa) {
    return { label: "Sin visa vigente", blocking: true, tone: "red" };
  }
  if (!participant.visaExpiry) {
    return { label: "Visa sin fecha de vencimiento", blocking: true, tone: "amber" };
  }
  if (tourEndDate && new Date(participant.visaExpiry) < new Date(tourEndDate)) {
    return { label: "La visa vence antes de terminar la gira", blocking: true, tone: "red" };
  }
  if (participant.visaStatus !== "APPROVED") {
    return { label: `Visa ${participant.visaStatus?.toLowerCase() || "sin revisar"}`, blocking: true, tone: "amber" };
  }
  return { label: "Visa válida · pendiente de asignación", blocking: false, tone: "emerald" };
}

export default function UnassignedParticipantsView({
  participants = EMPTY_PARTICIPANTS,
  itineraries = EMPTY_ITINERARIES,
  onAssign,
  assigning = false,
  loading = false,
  tourEndDate,
}) {
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const hasUnlockedItinerary = itineraries.some((itinerary) => !itinerary.isLocked);

  if (loading && participants.length === 0) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 bg-gray-100 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (participants.length === 0) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-10 text-center">
        <p className="text-3xl mb-2">✅</p>
        <h3 className="text-sm font-bold text-emerald-800 mb-1">
          Todos los participantes tienen itinerario
        </h3>
        <p className="text-xs text-emerald-600">
          Cada participante de la gira está asignado a un itinerario.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
        <p className="text-xs text-amber-800">
          <strong>{participants.length}</strong> participante{participants.length !== 1 ? "s" : ""}{" "}
          sin itinerario asignado.
        </p>
      </div>
      <div className="space-y-2">
        {sortParticipants(participants).map((p) => {
          const reason = getMissingItineraryReason(p, tourEndDate);
          const reasonClass =
            reason.tone === "red"
              ? "bg-red-50 text-red-700 border-red-200"
              : reason.tone === "amber"
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-emerald-50 text-emerald-700 border-emerald-200";
          return (
          <div
            key={p.id}
            className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-2xl"
          >
            <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
              {[p.firstName, p.firstSurname]
                .filter(Boolean)
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {participantFullName(p)}
                </p>
                {p.role === "STAFF" && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 flex-shrink-0">
                    Staff
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {p.identification || "—"}
                {p.instrument && <span className="ml-2 text-gray-400">{p.instrument}</span>}
              </p>
              <span className={`mt-1.5 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${reasonClass}`}>
                {reason.label}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedParticipant(p)}
              disabled={!hasUnlockedItinerary || assigning || reason.blocking}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gray-900 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Asignar a itinerario
            </button>
          </div>
          );
        })}
      </div>

      <ReassignParticipantModal
        participant={selectedParticipant}
        itineraries={itineraries}
        onClose={() => setSelectedParticipant(null)}
        onConfirm={(_, targetItineraryId, participantId) =>
          onAssign(targetItineraryId, participantId)
        }
        loading={assigning}
      />
    </div>
  );
}
