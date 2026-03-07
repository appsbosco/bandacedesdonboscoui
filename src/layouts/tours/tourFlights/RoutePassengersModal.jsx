/* eslint-disable react/prop-types */
/**
 * RoutePassengersModal — assign / remove participants from a TourRoute.
 *
 * Props:
 *   route        — TourRoute object (with route.participants already loaded)
 *   allRoutes    — all routes in this tour (to detect cross-route conflicts)
 *   tourId       — for participant query
 *   onAssign     — async (participantIds) => RouteAssignResult
 *   onRemove     — async (routeId, participantIds) => void
 *   result       — last RouteAssignResult (shown as banner)
 *   onClearResult
 */
import { useState, useEffect } from "react";
import { useQuery, gql } from "@apollo/client";

const GET_TOUR_PARTICIPANTS_FOR_ROUTE = gql`
  query GetTourParticipantsForRouteModal($tourId: ID!) {
    getTourParticipants(tourId: $tourId) {
      id
      firstName
      firstSurname
      secondSurname
      identification
      instrument
    }
  }
`;

function participantName(p) {
  return [p.firstName, p.firstSurname, p.secondSurname].filter(Boolean).join(" ");
}

export default function RoutePassengersModal({
  isOpen,
  route,
  allRoutes = [],
  tourId,
  onClose,
  onAssign,
  onRemove,
  applying,
  result,
  onClearResult,
}) {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("add"); // "add" | "remove"

  const { data, loading } = useQuery(GET_TOUR_PARTICIPANTS_FOR_ROUTE, {
    variables: { tourId },
    skip: !isOpen || !tourId,
    fetchPolicy: "cache-and-network",
  });

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set());
      setSearch("");
      setTab("add");
    }
  }, [isOpen, route?.id]);

  if (!isOpen || !route) return null;

  const allParticipants = data?.getTourParticipants || [];

  // Participants already in THIS route
  const inThisRouteIds = new Set((route.participants || []).map((p) => p.id));

  // Participants in a DIFFERENT route of the SAME direction in this tour
  const sameDirectionRoutes = allRoutes.filter(
    (r) => r.id !== route.id && r.direction === route.direction
  );
  const inOtherRouteMap = new Map(); // participantId → routeName
  for (const r of sameDirectionRoutes) {
    for (const p of r.participants || []) {
      if (!inOtherRouteMap.has(p.id)) {
        inOtherRouteMap.set(p.id, r.name);
      }
    }
  }

  const available = allParticipants.filter(
    (p) => !inThisRouteIds.has(p.id) && !inOtherRouteMap.has(p.id)
  );
  const inOtherRoute = allParticipants.filter((p) => inOtherRouteMap.has(p.id));
  const assigned = (route.participants || []);

  const filteredAvailable = search
    ? available.filter((p) => participantName(p).toLowerCase().includes(search.toLowerCase()))
    : available;

  const filteredAssigned = search
    ? assigned.filter((p) => participantName(p).toLowerCase().includes(search.toLowerCase()))
    : assigned;

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (tab === "add") setSelectedIds(new Set(available.map((p) => p.id)));
    else setSelectedIds(new Set(assigned.map((p) => p.id)));
  };
  const clearSelection = () => setSelectedIds(new Set());

  const handleApply = async () => {
    if (selectedIds.size === 0) return;
    if (tab === "add") {
      await onAssign(Array.from(selectedIds));
    } else {
      await onRemove(route.id, Array.from(selectedIds));
    }
    setSelectedIds(new Set());
  };

  const dirLabel = route.direction === "OUTBOUND" ? "Ida" : "Vuelta";
  const dirEmoji = route.direction === "OUTBOUND" ? "🛫" : "🛬";

  return (
    <div
      className="fixed inset-0 z-[1300] flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] min-h-0">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Pasajeros de ruta</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                <span className="font-semibold text-slate-700">
                  {dirEmoji} {route.name}
                </span>
                {" · "}{dirLabel}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all flex-shrink-0"
            >
              ✕
            </button>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 mt-3">
            <Pill color="blue" label={`${available.length} disponible${available.length !== 1 ? "s" : ""}`} />
            {inThisRouteIds.size > 0 && (
              <Pill color="emerald" label={`${inThisRouteIds.size} asignado${inThisRouteIds.size !== 1 ? "s" : ""}`} />
            )}
            {inOtherRoute.length > 0 && (
              <Pill color="amber" label={`${inOtherRoute.length} en otra ruta`} />
            )}
          </div>

          {/* Tab switcher */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl w-fit mt-3">
            {[
              { id: "add",    label: "Agregar" },
              { id: "remove", label: "Remover" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setSelectedIds(new Set()); }}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  tab === t.id
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Result banner */}
        {result && (
          <div
            className={`mx-6 mt-4 p-4 rounded-2xl border text-xs flex-shrink-0 ${
              (result.conflicts || []).length > 0
                ? "bg-amber-50 border-amber-200"
                : "bg-emerald-50 border-emerald-200"
            }`}
          >
            <p className="font-bold text-gray-800 mb-1">Resultado</p>
            {result.assigned > 0 && (
              <p className="text-gray-600">✓ {result.assigned} asignado{result.assigned !== 1 ? "s" : ""}</p>
            )}
            {result.removed > 0 && (
              <p className="text-gray-600">✓ {result.removed} removido{result.removed !== 1 ? "s" : ""}</p>
            )}
            {(result.conflicts || []).length > 0 && (
              <div className="mt-2 space-y-1">
                {result.conflicts.map((c, i) => (
                  <p key={`${c.participantId}-${i}`} className="text-amber-700">
                    ⚠ <strong>{c.participantName}</strong> — ya está en &ldquo;{c.conflictingRoute}&rdquo;
                  </p>
                ))}
              </div>
            )}
            <button
              onClick={onClearResult}
              className="mt-2 text-gray-400 hover:text-gray-600 underline"
            >
              Cerrar aviso
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-4">
          {loading ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-gray-100 rounded-2xl" />
              ))}
            </div>
          ) : (
            <>
              {/* Search */}
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar participante…"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />

              {/* ADD tab */}
              {tab === "add" && (
                <>
                  {filteredAvailable.length > 0 ? (
                    <section>
                      <div className="flex items-center justify-between mb-2">
                        <SectionHeader label="Disponibles" count={filteredAvailable.length} />
                        <div className="flex items-center gap-2">
                          {selectedIds.size > 0 && (
                            <button onClick={clearSelection} className="text-xs text-gray-400 hover:text-gray-600 underline">
                              Deseleccionar
                            </button>
                          )}
                          <button onClick={selectAll} className="text-xs text-blue-600 hover:text-blue-800 font-semibold">
                            Todos
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {filteredAvailable.map((p) => (
                          <ParticipantRow
                            key={p.id}
                            participant={p}
                            selected={selectedIds.has(p.id)}
                            onToggle={() => toggleSelect(p.id)}
                          />
                        ))}
                      </div>
                    </section>
                  ) : (
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center">
                      <p className="text-xs text-blue-700 font-medium">
                        {inThisRouteIds.size > 0
                          ? "✓ Todos los participantes disponibles ya están en esta ruta."
                          : "No hay participantes disponibles."}
                      </p>
                    </div>
                  )}

                  {/* In other route (blocked) */}
                  {inOtherRoute.length > 0 && (
                    <section>
                      <SectionHeader
                        label="En otra ruta de ida/vuelta"
                        count={inOtherRoute.length}
                        subtitle="Removelos de su ruta actual para asignarlos aquí"
                      />
                      <div className="space-y-2">
                        {inOtherRoute.map((p) => (
                          <div key={p.id} className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-100 rounded-2xl opacity-80">
                            <Avatar participant={p} color="amber" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">{participantName(p)}</p>
                              <p className="text-xs text-amber-700">{inOtherRouteMap.get(p.id)}</p>
                            </div>
                            <span className="text-xs text-amber-600 font-semibold px-2 py-1 bg-amber-100 rounded-lg">Bloqueado</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </>
              )}

              {/* REMOVE tab */}
              {tab === "remove" && (
                <>
                  {filteredAssigned.length > 0 ? (
                    <section>
                      <div className="flex items-center justify-between mb-2">
                        <SectionHeader label="Asignados" count={filteredAssigned.length} />
                        {selectedIds.size > 0 && (
                          <button onClick={clearSelection} className="text-xs text-gray-400 hover:text-gray-600 underline">
                            Deseleccionar
                          </button>
                        )}
                      </div>
                      <div className="space-y-2">
                        {filteredAssigned.map((p) => (
                          <ParticipantRow
                            key={p.id}
                            participant={p}
                            selected={selectedIds.has(p.id)}
                            onToggle={() => toggleSelect(p.id)}
                            removeMode
                          />
                        ))}
                      </div>
                    </section>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-xs text-gray-400">Esta ruta no tiene pasajeros asignados.</p>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex-shrink-0 border-t border-gray-100 pt-4 space-y-2">
          {selectedIds.size > 0 && (
            <button
              onClick={handleApply}
              disabled={applying}
              className={`w-full py-2.5 rounded-2xl font-bold text-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2 ${
                tab === "add"
                  ? "bg-gray-900 hover:bg-gray-700 text-white"
                  : "bg-red-600 hover:bg-red-700 text-white"
              }`}
            >
              {applying
                ? "Procesando…"
                : tab === "add"
                ? `Asignar ${selectedIds.size} a esta ruta`
                : `Remover ${selectedIds.size} de esta ruta`}
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Internal components ───────────────────────────────────────────────────────

function ParticipantRow({ participant, selected, onToggle, removeMode = false }) {
  return (
    <div
      onClick={onToggle}
      className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
        selected
          ? removeMode
            ? "bg-red-50 border-red-300"
            : "bg-blue-50 border-blue-300"
          : "bg-gray-50 border-gray-100 hover:border-gray-200"
      }`}
    >
      <div
        className={`w-4 h-4 rounded flex items-center justify-center border-2 flex-shrink-0 transition-all ${
          selected
            ? removeMode
              ? "bg-red-600 border-red-600"
              : "bg-blue-600 border-blue-600"
            : "border-gray-300"
        }`}
      >
        {selected && (
          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <Avatar participant={participant} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">
          {[participant.firstName, participant.firstSurname, participant.secondSurname].filter(Boolean).join(" ")}
        </p>
        <p className="text-xs text-gray-500">
          {participant.identification}
          {participant.instrument && (
            <span className="ml-2 text-gray-400">{participant.instrument}</span>
          )}
        </p>
      </div>
    </div>
  );
}

function Avatar({ participant, color = "gray" }) {
  const colors = {
    gray: "bg-gray-200 text-gray-600",
    amber: "bg-amber-200 text-amber-800",
    blue: "bg-blue-200 text-blue-800",
  };
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${colors[color] || colors.gray}`}>
      {[participant.firstName, participant.firstSurname]
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .toUpperCase()}
    </div>
  );
}

function Pill({ color, label }) {
  const styles = {
    blue: "bg-blue-100 text-blue-700",
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    gray: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[color]}`}>{label}</span>
  );
}

function SectionHeader({ label, count, subtitle }) {
  return (
    <div className="mb-2">
      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
        {label}
        {count !== undefined && <span className="text-gray-300 font-normal">({count})</span>}
      </h4>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  );
}
