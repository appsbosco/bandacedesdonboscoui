/* eslint-disable react/prop-types */

/**
 * Formations list page — /formations
 *
 * Shows saved parade formations with ability to create, open, and delete.
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFormationsList } from "./useFormations.js";
import { ZONE_LABEL } from "./formationEngine.js";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, type, onClose }) {
  React.useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [message, onClose]);
  return (
    <div
      className={[
        "fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-white text-sm",
        type === "error" ? "bg-red-600" : "bg-slate-900",
      ].join(" ")}
    >
      {type === "error" ? "⚠" : "✓"} {message}
    </div>
  );
}

// ── Formation card ────────────────────────────────────────────────────────────

function FormationCard({ formation, onDelete, deleting }) {
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const zoneCounts = formation.zoneMemberCounts || [];
  const totalMembers = zoneCounts.reduce((sum, z) => sum + (z.count || 0), 0);
  const zoneSummary = zoneCounts
    .filter((z) => z.count > 0)
    .slice(0, 3)
    .map((z) => `${ZONE_LABEL[z.zone] || z.zone}: ${z.count}`)
    .join(" · ");

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-800 truncate">{formation.name}</h3>
          <p className="text-xs text-slate-400 mt-0.5">Desfile: {fmtDate(formation.date)}</p>
        </div>
        <span
          className={[
            "text-xs font-semibold px-2 py-0.5 rounded-full shrink-0",
            formation.type === "DOUBLE"
              ? "bg-purple-100 text-purple-700"
              : "bg-indigo-100 text-indigo-700",
          ].join(" ")}
        >
          {formation.type === "DOUBLE" ? "2 bloques" : "1 bloque"}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="text-indigo-500 font-bold">{totalMembers}</span> músicos
        </span>
        <span className="text-slate-300">|</span>
        <span className="truncate">{zoneSummary || "Sin zonas"}</span>
      </div>

      {formation.notes && (
        <p className="mt-2 text-xs text-slate-400 italic truncate">{formation.notes}</p>
      )}

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={() => navigate(`/formations/${formation.id}`)}
          className="flex-1 py-1.5 bg-black text-white text-xs font-semibold rounded-lg hover:bg-gray-700 transition-colors"
        >
          Ver / Editar
        </button>

        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="px-3 py-1.5 border border-slate-200 text-slate-400 text-xs rounded-lg hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-colors"
          >
            Eliminar
          </button>
        ) : (
          <button
            onClick={() => {
              onDelete(formation.id);
              setConfirmDelete(false);
            }}
            disabled={deleting}
            className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            ¿Confirmar?
          </button>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FormationsPage() {
  const navigate = useNavigate();
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const { formations, loading, error, deleting, handleDelete, toast, setToast } = useFormationsList(
    { year: yearFilter }
  );

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}

        {/* Header */}
        <div className="max-w-5xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Formaciones BCDB</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Distribución de músicos por sección y posición
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(Number(e.target.value))}
              className="border border-slate-300 rounded-xl px-6.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <button
              onClick={() => navigate("/formations/new")}
              className="px-4 py-2 bg-black text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition-colors"
            >
              + Nueva formación
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-5xl mx-auto">
          {loading && <div className="text-center py-16 text-slate-400 text-sm">Cargando…</div>}

          {error && (
            <div className="text-center py-16 text-red-500 text-sm">Error: {error.message}</div>
          )}

          {!loading && !error && formations.length === 0 && (
            <div className="text-center py-20">
              <div className="text-5xl mb-3">🎷</div>
              <p className="text-slate-500 text-sm">
                No hay formaciones guardadas para {yearFilter}.
              </p>
              <button
                onClick={() => navigate("/formations/new")}
                className="mt-4 px-5 py-2 bg-black text-white text-sm font-semibold rounded-xl hover:bg-gray-600 transition-colors"
              >
                Crear primera formación
              </button>
            </div>
          )}

          {!loading && formations.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {formations.map((f) => (
                <FormationCard
                  key={f.id}
                  formation={f}
                  onDelete={handleDelete}
                  deleting={deleting}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
