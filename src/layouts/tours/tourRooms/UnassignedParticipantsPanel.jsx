/* eslint-disable react/prop-types */
/**
 * UnassignedParticipantsPanel
 * Shows participants without a room as draggable chips.
 * Lets the user set sex override per participant (cycles M → F → OTHER → ?).
 */
import { useState } from "react";
import { SEX_CONFIG, SEX_CYCLE, nextSex, calcAge } from "./roomGrouping";

function participantFullName(p) {
  return [p.firstName, p.firstSurname, p.secondSurname].filter(Boolean).join(" ");
}

function ParticipantChip({ participant, sexOverride, onSetSex, onDragStart }) {
  const sexKey = sexOverride || "UNKNOWN";
  const sexCfg = SEX_CONFIG[sexKey];
  const age = calcAge(participant.birthDate);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, participant.id, null)}
      className="flex items-center gap-2 px-2.5 py-1.5 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-gray-300 cursor-grab active:cursor-grabbing transition-all group select-none"
    >
      {/* Sex badge — click to cycle */}
      <button
        onClick={() => onSetSex(participant.id, nextSex(sexKey))}
        title="Clic para cambiar sexo"
        className={`flex-shrink-0 w-5 h-5 rounded-full border text-[10px] font-bold flex items-center justify-center transition-all ${sexCfg.color}`}
      >
        {sexCfg.short}
      </button>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-800 truncate">
          {participantFullName(participant)}
        </p>
        {(age !== null || participant.instrument) && (
          <p className="text-[10px] text-gray-400 truncate">
            {age !== null && <span>{age} años</span>}
            {age !== null && participant.instrument && <span> · </span>}
            {participant.instrument && <span>{participant.instrument}</span>}
          </p>
        )}
      </div>

      {/* Drag handle */}
      <svg
        className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 group-hover:text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
      </svg>
    </div>
  );
}

export default function UnassignedParticipantsPanel({
  participants,
  sexOverrides,
  onSetSex,
  onDragStart,
  onDragOver,
  onDrop,
}) {
  const [search, setSearch] = useState("");

  if (participants.length === 0) return null;

  const filtered = search
    ? participants.filter((p) =>
        participantFullName(p).toLowerCase().includes(search.toLowerCase())
      )
    : participants;

  return (
    <div
      className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col"
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, null)} // drop here = unassign
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Sin habitación</h3>
          <p className="text-xs text-gray-400">{participants.length} participante{participants.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Sex legend */}
      <div className="px-4 py-2 border-b border-gray-50 flex items-center gap-2 flex-wrap">
        <span className="text-[10px] text-gray-400 font-medium">Clic en badge para cambiar sexo:</span>
        {SEX_CYCLE.map((s) => (
          <span key={s} className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${SEX_CONFIG[s].color}`}>
            {SEX_CONFIG[s].short} = {SEX_CONFIG[s].label}
          </span>
        ))}
      </div>

      {/* Search */}
      {participants.length > 6 && (
        <div className="px-4 pt-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar…"
            className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>
      )}

      {/* Chips */}
      <div className="p-4 flex-1 overflow-y-auto space-y-2 min-h-0" style={{ maxHeight: "340px" }}>
        {filtered.length === 0 && participants.length > 0 && (
          <p className="text-xs text-gray-400 text-center py-4">Sin resultados para &ldquo;{search}&rdquo;</p>
        )}
        {filtered.map((p) => (
          <ParticipantChip
            key={p.id}
            participant={p}
            sexOverride={sexOverrides.get(p.id) || null}
            onSetSex={onSetSex}
            onDragStart={onDragStart}
          />
        ))}
      </div>

      {/* Drop indicator */}
      <div className="px-4 py-2 border-t border-dashed border-gray-200 bg-gray-50 text-center">
        <p className="text-[10px] text-gray-400">Arrastrá aquí para quitar de habitación</p>
      </div>
    </div>
  );
}
