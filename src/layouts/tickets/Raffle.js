/* eslint-disable react/prop-types */

import React, { useState, useMemo } from "react";
import { useQuery, useLazyQuery } from "@apollo/client";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { GET_EVENTS, GET_RAFFLE_NUMBERS, StatCard, EmptyState, Spinner } from "./Shared";

function WinnerModal({ winner, onClose }) {
  if (!winner) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-5xl mb-4">🎉</div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
          ¡Número ganador!
        </p>
        <p className="text-6xl font-bold text-gray-900 tracking-tight font-mono mb-6">
          {winner.number}
        </p>
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-left mb-6">
          <p className="font-semibold text-gray-900 text-sm">{winner.buyerName || "—"}</p>
          {winner.buyerEmail && <p className="text-xs text-gray-500 mt-0.5">{winner.buyerEmail}</p>}
          <span
            className={`inline-block mt-2 text-xs font-medium px-2.5 py-1 rounded-full ${
              winner.paid
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}
          >
            {winner.paid ? "✓ Pagado" : "⏳ Pendiente"}
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-full bg-gray-900 text-white rounded-xl py-3 text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

export default function Raffle() {
  const [eventId, setEventId] = useState("");
  const [search, setSearch] = useState("");
  const [paidFilter, setPaidFilter] = useState("all");
  const [winner, setWinner] = useState(null);
  const [drawing, setDrawing] = useState(false);
  const [view, setView] = useState("grid");

  const { data: eventsData } = useQuery(GET_EVENTS);
  const [loadNumbers, { data: raffleData, loading }] = useLazyQuery(GET_RAFFLE_NUMBERS);

  const allNumbers = raffleData?.getTicketsNumbers || [];

  const filtered = useMemo(
    () =>
      allNumbers.filter((e) => {
        const q = search.toLowerCase();
        const matchQ =
          !q ||
          e.number.includes(q) ||
          e.buyerName?.toLowerCase().includes(q) ||
          e.buyerEmail?.toLowerCase().includes(q);
        const matchP =
          paidFilter === "all" ||
          (paidFilter === "paid" && e.paid) ||
          (paidFilter === "pending" && !e.paid);
        return matchQ && matchP;
      }),
    [allNumbers, search, paidFilter]
  );

  const paidCount = allNumbers.filter((e) => e.paid).length;
  const pendingCount = allNumbers.filter((e) => !e.paid).length;

  const drawWinner = async (paidOnly) => {
    const pool = paidOnly ? allNumbers.filter((e) => e.paid) : allNumbers;
    if (!pool.length) return;
    setDrawing(true);
    setWinner(null);
    await new Promise((r) => setTimeout(r, 800));
    setWinner(pool[Math.floor(Math.random() * pool.length)]);
    setDrawing(false);
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Rifa</h1>
            <p className="text-sm text-gray-500 mt-0.5">Administra y sortea los números de rifa</p>
          </div>
          <select
            value={eventId}
            onChange={(e) => {
              setEventId(e.target.value);
              setWinner(null);
              if (e.target.value) loadNumbers({ variables: { eventId: e.target.value } });
            }}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 min-w-52"
          >
            <option value="">Selecciona un evento…</option>
            {eventsData?.getEventsT
              ?.filter((e) => e.raffleEnabled)
              .map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name}
                </option>
              ))}
          </select>
        </div>

        {!eventId ? (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
            <EmptyState
              icon="🎰"
              title="Selecciona un evento"
              subtitle="Solo se muestran eventos con rifa habilitada"
            />
          </div>
        ) : loading ? (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm flex justify-center py-20">
            <Spinner />
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard icon="🎟" label="Total" value={allNumbers.length} />
              <StatCard icon="✅" label="Pagados" value={paidCount} />
              <StatCard icon="⏳" label="Pendientes" value={pendingCount} />
              <StatCard
                icon="%"
                label="% Pagado"
                value={
                  allNumbers.length
                    ? `${((paidCount / allNumbers.length) * 100).toFixed(0)}%`
                    : "0%"
                }
              />
            </div>

            {/* Draw panel */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-wrap items-center gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-800">Sortear ganador</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Selecciona si participan solo los pagados o todos
                </p>
              </div>
              <div className="ml-auto flex gap-2">
                <button
                  onClick={() => drawWinner(true)}
                  disabled={drawing || paidCount === 0}
                  className="flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-40"
                >
                  {drawing ? (
                    <>
                      <Spinner /> Sorteando…
                    </>
                  ) : (
                    "🎲 Solo pagados"
                  )}
                </button>
                <button
                  onClick={() => drawWinner(false)}
                  disabled={drawing || allNumbers.length === 0}
                  className="flex items-center gap-2 border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-40"
                >
                  Todos
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-48">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  🔍
                </span>
                <input
                  className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="Buscar número o nombre…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                {[
                  { v: "all", l: "Todos" },
                  { v: "paid", l: "Pagados" },
                  { v: "pending", l: "Pendientes" },
                ].map((o) => (
                  <button
                    key={o.v}
                    onClick={() => setPaidFilter(o.v)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                      paidFilter === o.v
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {o.l}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setView((v) => (v === "grid" ? "list" : "grid"))}
                className="border border-gray-200 text-gray-600 text-xs font-medium px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors bg-white"
              >
                {view === "grid" ? "☰ Lista" : "⊞ Grilla"}
              </button>
            </div>

            {/* Numbers */}
            {filtered.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
                <EmptyState icon="🎰" title="Sin números" subtitle="Prueba ajustando los filtros" />
              </div>
            ) : view === "grid" ? (
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-wrap gap-3">
                {filtered.map((entry) => (
                  <div
                    key={entry.number}
                    className={`w-16 h-16 rounded-full flex flex-col items-center justify-center border-2 transition-all ${
                      winner?.number === entry.number
                        ? "border-yellow-400 bg-yellow-50 scale-110 shadow-md"
                        : entry.paid
                        ? "border-green-200 bg-green-50"
                        : "border-amber-200 bg-amber-50"
                    }`}
                  >
                    <span
                      className={`font-mono text-sm font-bold leading-tight ${
                        entry.paid ? "text-green-700" : "text-amber-700"
                      }`}
                    >
                      {entry.number}
                    </span>
                    <span
                      className={`text-[9px] font-semibold uppercase tracking-wider leading-none ${
                        entry.paid ? "text-green-500" : "text-amber-500"
                      }`}
                    >
                      {entry.paid ? "ok" : "pend"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">
                          Número
                        </th>
                        <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">
                          Titular
                        </th>
                        <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3 hidden md:table-cell">
                          Correo
                        </th>
                        <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filtered.map((entry) => (
                        <tr
                          key={entry.number}
                          className={`hover:bg-gray-50 transition-colors ${
                            winner?.number === entry.number ? "bg-yellow-50" : ""
                          }`}
                        >
                          <td className="px-4 py-3">
                            <span className="font-mono font-bold text-gray-900 text-base">
                              {entry.number}
                            </span>
                            {winner?.number === entry.number && (
                              <span className="ml-2 text-sm">🏆</span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-800">
                            {entry.buyerName || "—"}
                          </td>
                          <td className="px-4 py-3 text-xs font-mono text-gray-400 hidden md:table-cell">
                            {entry.buyerEmail || "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                                entry.paid
                                  ? "bg-green-50 text-green-700 border border-green-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  entry.paid ? "bg-green-500" : "bg-amber-400"
                                }`}
                              />
                              {entry.paid ? "Pagado" : "Pendiente"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
                  {filtered.length} números
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <WinnerModal winner={winner} onClose={() => setWinner(null)} />
      <Footer />
    </DashboardLayout>
  );
}
