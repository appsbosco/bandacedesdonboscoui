/* eslint-disable react/prop-types */
/**
 * ParticipantsTableView — table of tour participants grouped by itinerary,
 * with an "Exportar a Excel" action.
 */
import { useMemo, useState } from "react";
import { exportTourParticipantsXLSX } from "./tourParticipantsExport";
import ReassignParticipantModal from "./ReassignParticipantModal";

const EMPTY_LIST = [];

function participantFullName(p) {
  return [p.firstName, p.firstSurname, p.secondSurname].filter(Boolean).join(" ");
}

function normalizeSearchValue(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .trim();
}

function visaBadge(p) {
  if (p.visaStatus === "DENIED") {
    return (
      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700">
        Negada
      </span>
    );
  }
  if (p.visaStatus === "APPROVED") {
    return (
      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
        Aprobada
      </span>
    );
  }
  return (
    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
      —
    </span>
  );
}

function isLeaderOrStaff(p, leaderIds) {
  return leaderIds.has(p.id) || p.role === "STAFF";
}

function sortMembers(members) {
  return [...members].sort((a, b) => {
    if (a.__priority !== b.__priority) return a.__priority - b.__priority;
    if (a.__priority === 0) {
      return participantFullName(a).localeCompare(participantFullName(b), "es");
    }
    const sectionA = (a.instrument || "").trim();
    const sectionB = (b.instrument || "").trim();
    const bySection = sectionA.localeCompare(sectionB, "es");
    if (bySection !== 0) return bySection;
    return participantFullName(a).localeCompare(participantFullName(b), "es");
  });
}

function roleLabel(p, isLeader, fallback = "Integrante/Pasajero") {
  if (isLeader) return "Líder";
  if (p.role === "STAFF") return "Staff";
  return fallback;
}

function buildGroups(itineraries, unassignedParticipants) {
  const groups = itineraries.map((it) => {
    const leaderIds = new Set((it.leaders || []).map((l) => l.id));
    const members = sortMembers(
      (it.participants || []).map((p) => ({
        ...p,
        __role: roleLabel(p, leaderIds.has(p.id)),
        __priority: isLeaderOrStaff(p, leaderIds) ? 0 : 1,
      }))
    );
    return { key: it.id, name: it.name, members, isLocked: Boolean(it.isLocked) };
  });

  if (unassignedParticipants.length > 0) {
    const noLeaders = new Set();
    groups.push({
      key: "unassigned",
      name: "Sin itinerario",
      members: sortMembers(
        unassignedParticipants.map((p) => ({
          ...p,
          __role: roleLabel(p, false, "—"),
          __priority: isLeaderOrStaff(p, noLeaders) ? 0 : 1,
        }))
      ),
    });
  }

  return groups;
}

export default function ParticipantsTableView({
  tourName,
  itineraries = EMPTY_LIST,
  unassignedParticipants = EMPTY_LIST,
  loading = false,
  onRemove,
  onReassign,
  removing = false,
  reassigning = false,
}) {
  const [exporting, setExporting] = useState(false);
  const [itineraryFilter, setItineraryFilter] = useState("all");
  const [instrumentFilter, setInstrumentFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [reassignSelection, setReassignSelection] = useState(null);
  const [removingParticipantId, setRemovingParticipantId] = useState(null);

  const groups = useMemo(
    () => buildGroups(itineraries, unassignedParticipants),
    [itineraries, unassignedParticipants]
  );
  const total = groups.reduce((sum, g) => sum + g.members.length, 0);

  const instruments = useMemo(
    () =>
      [
        ...new Set(
          groups.flatMap((group) => group.members.map((p) => p.instrument?.trim())).filter(Boolean)
        ),
      ].sort((a, b) => a.localeCompare(b, "es")),
    [groups]
  );

  const normalizedSearch = normalizeSearchValue(searchTerm);
  const visibleGroups = groups
    .filter((group) => itineraryFilter === "all" || group.key === itineraryFilter)
    .map((group) => ({
      ...group,
      members: group.members.filter((participant) => {
        const matchesInstrument =
          instrumentFilter === "all" || participant.instrument?.trim() === instrumentFilter;
        const searchableText = normalizeSearchValue(
          `${participantFullName(participant)} ${participant.instrument || ""}`
        );
        return (
          matchesInstrument && (!normalizedSearch || searchableText.includes(normalizedSearch))
        );
      }),
    }));
  const visibleTotal = visibleGroups.reduce((sum, g) => sum + g.members.length, 0);
  const hasActiveFilters =
    itineraryFilter !== "all" || instrumentFilter !== "all" || normalizedSearch.length > 0;

  const clearFilters = () => {
    setItineraryFilter("all");
    setInstrumentFilter("all");
    setSearchTerm("");
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const visibleByKey = new Map(visibleGroups.map((group) => [group.key, group.members]));
      const filteredItineraries = itineraries
        .filter((itinerary) => visibleByKey.has(itinerary.id))
        .map((itinerary) => ({
          ...itinerary,
          participants: visibleByKey.get(itinerary.id),
          leaders: (itinerary.leaders || []).filter((leader) =>
            visibleByKey.get(itinerary.id).some((participant) => participant.id === leader.id)
          ),
        }));

      await exportTourParticipantsXLSX({
        tourName,
        itineraries: filteredItineraries,
        unassignedParticipants: visibleByKey.get("unassigned") || [],
      });
    } finally {
      setExporting(false);
    }
  };

  const handleRemove = async (group, participant) => {
    const confirmed = window.confirm(
      `¿Quitar a ${participantFullName(participant)} de ${
        group.name
      }? Quedará sin itinerario asignado.`
    );
    if (!confirmed) return;

    setRemovingParticipantId(participant.id);
    try {
      await onRemove(group.key, [participant.id]);
    } finally {
      setRemovingParticipantId(null);
    }
  };

  if (loading && total === 0) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 bg-gray-100 rounded-xl" />
        ))}
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-10 text-center">
        <p className="text-3xl mb-2">📋</p>
        <p className="text-sm font-bold text-gray-900">Sin participantes registrados</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-gray-500">
          <strong>{visibleTotal}</strong> participante{visibleTotal !== 1 ? "s" : ""}
          {hasActiveFilters && <span> de {total}</span>}
        </p>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting || visibleTotal === 0}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-2xl active:scale-[0.98] transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m-9 7h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
          {exporting ? "Exportando…" : "Exportar a Excel"}
        </button>
      </div>

      {/* Itinerary filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <FilterPill
          active={itineraryFilter === "all"}
          onClick={() => setItineraryFilter("all")}
          label="Todos"
          count={total}
        />
        {groups.map((g) => (
          <FilterPill
            key={g.key}
            active={itineraryFilter === g.key}
            onClick={() => setItineraryFilter(g.key)}
            label={g.name}
            count={g.members.length}
            emoji={g.key === "unassigned" ? "⚠️" : g.isLocked ? "🔒" : "🗓️"}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(190px,auto)_auto] sm:items-center">
        <label className="relative block">
          <span className="sr-only">Buscar participante</span>
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por nombre, apellido o instrumento"
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 hover:border-gray-300 focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
          />
        </label>

        <label className="relative block">
          <span className="sr-only">Filtrar por instrumento</span>
          <select
            value={instrumentFilter}
            onChange={(event) => setInstrumentFilter(event.target.value)}
            className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pl-3 pr-9 text-sm text-gray-700 outline-none transition-colors hover:border-gray-300 focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
          >
            <option value="all">Todos los instrumentos</option>
            {instruments.map((instrument) => (
              <option key={instrument} value={instrument}>
                {instrument}
              </option>
            ))}
          </select>
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m6 9 6 6 6-6" />
          </svg>
        </label>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="justify-self-start rounded-lg px-2 py-2 text-xs font-semibold text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 sm:justify-self-end"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  Nombre completo
                </th>
                <th className="text-left px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  Cédula
                </th>
                <th className="text-left px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  Instrumento
                </th>
                {itineraryFilter === "all" && (
                  <th className="text-left px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                    Itinerario
                  </th>
                )}
                <th className="text-left px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  Rol
                </th>
                <th className="text-left px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  Visa
                </th>
                <th className="text-right px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleTotal === 0 ? (
                <tr>
                  <td
                    colSpan={itineraryFilter === "all" ? 7 : 6}
                    className="px-4 py-6 text-xs text-gray-400 italic text-center"
                  >
                    {hasActiveFilters
                      ? "No hay participantes que coincidan con los filtros."
                      : "Sin participantes en este grupo."}
                  </td>
                </tr>
              ) : (
                visibleGroups.map((group) => (
                  <GroupRows
                    key={group.key}
                    group={group}
                    showItineraryColumn={itineraryFilter === "all"}
                    onReassign={(participant) =>
                      setReassignSelection({ participant, sourceGroup: group })
                    }
                    onRemove={(participant) => handleRemove(group, participant)}
                    removingParticipantId={removingParticipantId}
                    actionsDisabled={removing || reassigning || group.isLocked}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ReassignParticipantModal
        participant={reassignSelection?.participant}
        sourceItinerary={itineraries.find(
          (itinerary) => itinerary.id === reassignSelection?.sourceGroup.key
        )}
        itineraries={itineraries}
        onClose={() => setReassignSelection(null)}
        onConfirm={onReassign}
        loading={reassigning}
      />
    </div>
  );
}

function FilterPill({ active, onClick, label, count, emoji }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
        active
          ? "bg-gray-900 border-gray-900 text-white"
          : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
      }`}
    >
      {emoji && <span>{emoji}</span>}
      <span>{label}</span>
      <span className={active ? "text-gray-300" : "text-gray-400"}>({count})</span>
    </button>
  );
}

function GroupRows({
  group,
  showItineraryColumn,
  onReassign,
  onRemove,
  removingParticipantId,
  actionsDisabled,
}) {
  return (
    <>
      {group.members.map((p) => (
        <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50">
          <td className="px-4 py-2.5 text-gray-900 font-medium">{participantFullName(p) || "—"}</td>
          <td className="px-4 py-2.5 text-gray-500">{p.identification || "—"}</td>
          <td className="px-4 py-2.5 text-gray-500">{p.instrument || "—"}</td>
          {showItineraryColumn && (
            <td className="px-4 py-2.5 text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                {group.name}
                {group.isLocked && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                    🔒 Bloqueado
                  </span>
                )}
              </span>
            </td>
          )}
          <td className="px-4 py-2.5">
            {p.__role === "Líder" ? (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                Líder
              </span>
            ) : p.__role === "Staff" ? (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
                Staff
              </span>
            ) : (
              <span className="text-xs text-gray-400">{p.__role}</span>
            )}
          </td>
          <td className="px-4 py-2.5">{visaBadge(p)}</td>
          <td className="px-4 py-2.5">
            {group.key === "unassigned" ? (
              <span className="block text-right text-xs text-gray-300">—</span>
            ) : (
              <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => onReassign(p)}
                  disabled={actionsDisabled}
                  className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Reasignar
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(p)}
                  disabled={actionsDisabled}
                  className="rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {removingParticipantId === p.id ? "Quitando…" : "Quitar"}
                </button>
              </div>
            )}
          </td>
        </tr>
      ))}
    </>
  );
}
