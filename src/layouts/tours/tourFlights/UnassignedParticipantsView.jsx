/* eslint-disable react/prop-types */
/**
 * UnassignedParticipantsView — participants not assigned to any itinerary,
 * with a quick "Asignar a itinerario" action per row.
 */
import { useState } from "react";

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

function AssignDropdown({ participant, itineraries, onAssign }) {
  const [open, setOpen] = useState(false);
  const available = itineraries.filter((it) => (it.seatsRemaining ?? 0) > 0);

  if (available.length === 0) {
    return <span className="text-[11px] text-gray-400 italic">Sin itinerarios con cupo</span>;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-gray-700 text-white text-xs font-bold rounded-xl transition-all"
      >
        Asignar a itinerario
        <span className="text-[10px]">▾</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-2xl shadow-lg z-20 overflow-hidden">
            {available.map((it) => (
              <button
                key={it.id}
                onClick={() => {
                  setOpen(false);
                  onAssign(it, participant.id);
                }}
                className="w-full text-left px-3 py-2.5 text-xs hover:bg-gray-50 transition-all border-b border-gray-50 last:border-0"
              >
                <p className="font-semibold text-gray-900">{it.name}</p>
                <p className="text-gray-400">{it.seatsRemaining} cupo{it.seatsRemaining !== 1 ? "s" : ""} disponible{it.seatsRemaining !== 1 ? "s" : ""}</p>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function UnassignedParticipantsView({
  participants = [],
  itineraries = [],
  onAssign,
  loading = false,
}) {
  if (loading && participants.length === 0) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-gray-100 rounded-2xl" />)}
      </div>
    );
  }

  if (participants.length === 0) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-10 text-center">
        <p className="text-3xl mb-2">✅</p>
        <h3 className="text-sm font-bold text-emerald-800 mb-1">Todos los participantes tienen itinerario</h3>
        <p className="text-xs text-emerald-600">Cada participante de la gira está asignado a un itinerario.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
        <p className="text-xs text-amber-800">
          <strong>{participants.length}</strong> participante{participants.length !== 1 ? "s" : ""} sin itinerario asignado.
        </p>
      </div>
      <div className="space-y-2">
        {sortParticipants(participants).map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-2xl"
          >
            <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
              {[p.firstName, p.firstSurname].filter(Boolean).map((n) => n[0]).join("").toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold text-gray-900 truncate">{participantFullName(p)}</p>
                {p.role === "STAFF" && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 flex-shrink-0">Staff</span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {p.identification || "—"}
                {p.instrument && <span className="ml-2 text-gray-400">{p.instrument}</span>}
              </p>
            </div>
            <AssignDropdown participant={p} itineraries={itineraries} onAssign={onAssign} />
          </div>
        ))}
      </div>
    </div>
  );
}
