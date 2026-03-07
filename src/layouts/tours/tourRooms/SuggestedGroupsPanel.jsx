/* eslint-disable react/prop-types */
/**
 * SuggestedGroupsPanel
 * Shows auto-computed sex+age groups with "Crear habitaciones" action.
 */
import { useMemo } from "react";
import { computeGroups, suggestRoomsFromGroup, SEX_CONFIG } from "./roomGrouping";

function participantFullName(p) {
  return [p.firstName, p.firstSurname].filter(Boolean).join(" ");
}

function GroupCard({ group, capacity, onCreateRooms, creating }) {
  const roomSuggestions = useMemo(
    () => suggestRoomsFromGroup(group.participants, capacity),
    [group, capacity]
  );
  const sexCfg = SEX_CONFIG[group.sex] || SEX_CONFIG.UNKNOWN;

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
              {group.participants.length} participante{group.participants.length !== 1 ? "s" : ""}{" "}
              →{" "}
              {roomSuggestions.length} habitación{roomSuggestions.length !== 1 ? "es" : ""} de{" "}
              ≤{capacity}
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

      {/* Room breakdown preview */}
      <div className="px-4 pb-3 flex flex-wrap gap-1.5">
        {roomSuggestions.map((suggestion) => (
          <div
            key={suggestion.index}
            className="flex items-center gap-1 px-2 py-1 bg-gray-50 border border-gray-100 rounded-lg"
          >
            <span className="text-[10px] font-semibold text-gray-500">#{suggestion.index}</span>
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
  capacity,
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
          Asignando sexo con el badge · Creando de capacidad {capacity}
        </p>
      </div>
      {groups.map((group) => (
        <GroupCard
          key={group.key}
          group={group}
          capacity={capacity}
          onCreateRooms={onCreateRooms}
          creating={bulkCreating}
        />
      ))}
    </div>
  );
}
