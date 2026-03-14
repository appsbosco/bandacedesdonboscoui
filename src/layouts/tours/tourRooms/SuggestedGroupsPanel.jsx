/* eslint-disable react/prop-types */
/**
 * SuggestedGroupsPanel
 * Shows auto-computed sex+age groups with "Crear habitaciones" action.
 */
import { useMemo } from "react";
import { computeGroups, suggestRoomsFromGroup, groupRoomPrefix, SEX_CONFIG } from "./roomGrouping";

function participantFullName(p) {
  return [p.firstName, p.firstSurname].filter(Boolean).join(" ");
}

function GroupCard({ group, onCreateRooms, creating }) {
  const prefix = groupRoomPrefix(group);
  // Uses optimalRoomSizes internally — capacity varies per room, everyone is assigned
  const roomSuggestions = useMemo(
    () => suggestRoomsFromGroup(group.participants, { prefix }),
    [group, prefix]
  );
  const sexCfg = SEX_CONFIG[group.sex] || SEX_CONFIG.UNKNOWN;

  // Summarize room sizes for the description (e.g. "3×5 · 1×4")
  const sizeSummary = useMemo(() => {
    const freq = {};
    for (const s of roomSuggestions) {
      freq[s.capacity] = (freq[s.capacity] || 0) + 1;
    }
    return Object.entries(freq)
      .sort((a, b) => Number(b[0]) - Number(a[0]))
      .map(([size, count]) => `${count}×${size}`)
      .join(" · ");
  }, [roomSuggestions]);

  const totalAssigned = roomSuggestions.reduce((acc, s) => acc + s.participants.length, 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${sexCfg.color}`}>
            {sexCfg.short}
          </span>
          <div>
            <p className="text-xs font-bold text-gray-900">{group.label}</p>
            <p className="text-[10px] text-gray-400">
              {totalAssigned} participante{totalAssigned !== 1 ? "s" : ""}{" "}
              →{" "}
              {roomSuggestions.length} hab.{" "}
              <span className="font-semibold text-gray-500">{sizeSummary}</span>
            </p>
          </div>
        </div>
        <button
          onClick={() => onCreateRooms(group)}
          disabled={creating}
          className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-gray-700 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
        >
          {creating ? (
            "Creando…"
          ) : (
            <>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Crear habitaciones
            </>
          )}
        </button>
      </div>

      {/* Room breakdown preview — shows actual sizes and participants */}
      <div className="px-4 pb-3 flex flex-wrap gap-1.5">
        {roomSuggestions.map((suggestion) => (
          <div
            key={suggestion.index}
            className="flex items-center gap-1 px-2 py-1 bg-gray-50 border border-gray-100 rounded-lg"
          >
            <span className="text-[10px] font-bold text-gray-600">{suggestion.capacity}p</span>
            <span className="text-[10px] text-gray-400">
              {suggestion.participants.map((p) => participantFullName(p)).join(", ")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SuggestedGroupsPanel({
  unassignedParticipants,
  sexOverrides,
  onCreateRooms,
  bulkCreating,
}) {
  const groups = useMemo(
    () => computeGroups(unassignedParticipants, { sexOverrides }),
    [unassignedParticipants, sexOverrides]
  );

  if (unassignedParticipants.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
        <p className="text-2xl mb-2">✓</p>
        <p className="text-xs font-semibold text-gray-600 mb-1">Sin participantes sin asignar</p>
        <p className="text-xs text-gray-400">
          Todos los participantes ya tienen habitación.
        </p>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
        <p className="text-xs text-gray-400">Sin grupos para mostrar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
          Grupos sugeridos
        </p>
        <p className="text-[10px] text-gray-400">
          Tamaños automáticos: 5→4→3 · todos asignados
        </p>
      </div>
      {groups.map((group) => (
        <GroupCard
          key={group.key}
          group={group}
          onCreateRooms={onCreateRooms}
          creating={bulkCreating}
        />
      ))}
    </div>
  );
}
