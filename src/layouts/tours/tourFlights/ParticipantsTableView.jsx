/* eslint-disable react/prop-types */
/**
 * ParticipantsTableView — table of tour participants grouped by itinerary,
 * with an "Exportar a Excel" action.
 */
import { useState } from "react";
import { exportTourParticipantsXLSX } from "./tourParticipantsExport";

function participantFullName(p) {
  return [p.firstName, p.firstSurname, p.secondSurname].filter(Boolean).join(" ");
}

function visaBadge(p) {
  if (p.visaStatus === "DENIED") {
    return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700">Negada</span>;
  }
  if (p.visaStatus === "APPROVED") {
    return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Aprobada</span>;
  }
  return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">—</span>;
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

function roleLabel(p, isLeader, fallback = "Pasajero") {
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
    return { key: it.id, name: it.name, members };
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
  itineraries = [],
  unassignedParticipants = [],
  loading = false,
}) {
  const [exporting, setExporting] = useState(false);
  const [filter, setFilter] = useState("all");

  const groups = buildGroups(itineraries, unassignedParticipants);
  const total = groups.reduce((sum, g) => sum + g.members.length, 0);

  const visibleGroups = filter === "all" ? groups : groups.filter((g) => g.key === filter);
  const visibleTotal = visibleGroups.reduce((sum, g) => sum + g.members.length, 0);

  const handleExport = async () => {
    setExporting(true);
    try {
      if (filter === "all") {
        await exportTourParticipantsXLSX({ tourName, itineraries, unassignedParticipants });
      } else if (filter === "unassigned") {
        await exportTourParticipantsXLSX({ tourName, itineraries: [], unassignedParticipants });
      } else {
        const only = itineraries.filter((it) => it.id === filter);
        await exportTourParticipantsXLSX({ tourName, itineraries: only, unassignedParticipants: [] });
      }
    } finally {
      setExporting(false);
    }
  };

  if (loading && total === 0) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-gray-100 rounded-xl" />)}
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
          {filter !== "all" && <span> de {total}</span>}
        </p>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-2xl active:scale-[0.98] transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m-9 7h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          {exporting ? "Exportando…" : "Exportar a Excel"}
        </button>
      </div>

      {/* Itinerary filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <FilterPill
          active={filter === "all"}
          onClick={() => setFilter("all")}
          label="Todos"
          count={total}
        />
        {groups.map((g) => (
          <FilterPill
            key={g.key}
            active={filter === g.key}
            onClick={() => setFilter(g.key)}
            label={g.name}
            count={g.members.length}
            emoji={g.key === "unassigned" ? "⚠️" : "🗓️"}
          />
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-wide">Nombre completo</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-wide">Cédula</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-wide">Instrumento</th>
                {filter === "all" && (
                  <th className="text-left px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-wide">Itinerario</th>
                )}
                <th className="text-left px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-wide">Rol</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-wide">Visa</th>
              </tr>
            </thead>
            <tbody>
              {visibleTotal === 0 ? (
                <tr>
                  <td colSpan={filter === "all" ? 6 : 5} className="px-4 py-6 text-xs text-gray-400 italic text-center">
                    Sin participantes en este grupo.
                  </td>
                </tr>
              ) : (
                visibleGroups.map((group) => (
                  <GroupRows key={group.key} group={group} showItineraryColumn={filter === "all"} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FilterPill({ active, onClick, label, count, emoji }) {
  return (
    <button
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

function GroupRows({ group, showItineraryColumn }) {
  return (
    <>
      {group.members.map((p) => (
        <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50">
          <td className="px-4 py-2.5 text-gray-900 font-medium">{participantFullName(p) || "—"}</td>
          <td className="px-4 py-2.5 text-gray-500">{p.identification || "—"}</td>
          <td className="px-4 py-2.5 text-gray-500">{p.instrument || "—"}</td>
          {showItineraryColumn && (
            <td className="px-4 py-2.5 text-gray-500">{group.name}</td>
          )}
          <td className="px-4 py-2.5">
            {p.__role === "Líder" ? (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">Líder</span>
            ) : p.__role === "Staff" ? (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700">Staff</span>
            ) : (
              <span className="text-xs text-gray-400">{p.__role}</span>
            )}
          </td>
          <td className="px-4 py-2.5">{visaBadge(p)}</td>
        </tr>
      ))}
    </>
  );
}
