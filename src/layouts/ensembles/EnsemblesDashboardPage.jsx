/* eslint-disable react/prop-types */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { useEnsemblesDashboard } from "./useEnsembles";

const CATEGORY_LABEL = {
  MARCHING: "Marcha",
  BIG_BAND: "Big Band",
  CONCERT: "Concierto",
  OTHER: "Otro",
};

const CATEGORY_ACCENT = {
  MARCHING: "bg-rose-50 border-rose-100 text-rose-600",
  BIG_BAND: "bg-amber-50 border-amber-100 text-amber-600",
  CONCERT: "bg-blue-50 border-blue-100 text-blue-600",
  OTHER: "bg-gray-50 border-gray-200 text-gray-500",
};

const CATEGORY_BAR = {
  MARCHING: "bg-rose-400",
  BIG_BAND: "bg-amber-400",
  CONCERT: "bg-blue-400",
  OTHER: "bg-gray-300",
};

function EnsembleCard({ ensemble, onView, onAssign }) {
  const pillCls = CATEGORY_ACCENT[ensemble.category] || CATEGORY_ACCENT.OTHER;
  const barCls = CATEGORY_BAR[ensemble.category] || CATEGORY_BAR.OTHER;
  // Visual fill — treat 60 as a soft reference cap, clamp at 100%
  const pct = Math.min(100, (ensemble.memberCount / 60) * 100);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-bold text-gray-900 text-sm leading-tight truncate">{ensemble.name}</p>
          <span className={`inline-flex mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${pillCls}`}>
            {CATEGORY_LABEL[ensemble.category] || ensemble.category}
          </span>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-2xl font-bold text-gray-900 leading-none">{ensemble.memberCount}</p>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">miembros</p>
        </div>
      </div>

      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barCls}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onView(ensemble)}
          className="flex-1 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-all"
        >
          Ver miembros
        </button>
        <button
          onClick={() => onAssign(ensemble)}
          className="flex-1 py-2 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-gray-700 transition-all"
        >
          Asignar
        </button>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i} className="h-44 bg-gray-100 rounded-2xl animate-pulse" />
      ))}
    </div>
  );
}

// Preserve category order
const CATEGORY_ORDER = ["MARCHING", "BIG_BAND", "CONCERT", "OTHER"];

export default function EnsemblesDashboardPage() {
  const navigate = useNavigate();
  const { ensembles, loading } = useEnsemblesDashboard();
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? ensembles.filter((e) =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        (CATEGORY_LABEL[e.category] || "").toLowerCase().includes(search.toLowerCase())
      )
    : ensembles;

  const grouped = filtered.reduce((acc, e) => {
    const cat = e.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(e);
    return acc;
  }, {});

  const orderedCategories = CATEGORY_ORDER.filter((c) => grouped[c]);

  const handleView = (ensemble) => navigate(`/ensembles/${ensemble.key}/members`);
  const handleAssign = (ensemble) => navigate(`/ensembles/${ensemble.key}/members?assign=1`);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <div className="px-4 pb-10 pt-2 space-y-8 max-w-screen-xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Agrupaciones</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {ensembles.length} agrupación{ensembles.length !== 1 ? "es" : ""} registrada
              {ensembles.length !== 1 ? "s" : ""}
            </p>
          </div>
          {/* Global search */}
          <div className="relative min-w-52">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">⌕</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar agrupación…"
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all"
            />
          </div>
        </div>

        {loading ? (
          <Skeleton />
        ) : ensembles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-4xl mb-3">🎺</p>
            <p className="text-sm font-bold text-gray-900">Sin agrupaciones</p>
            <p className="text-xs text-gray-500 mt-1">
              Las agrupaciones aparecerán aquí una vez registradas.
            </p>
          </div>
        ) : (
          orderedCategories.map((category) => (
            <div key={category}>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                {CATEGORY_LABEL[category] || category}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {grouped[category].map((e) => (
                  <EnsembleCard
                    key={e.key}
                    ensemble={e}
                    onView={handleView}
                    onAssign={handleAssign}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
      <Footer />
    </DashboardLayout>
  );
}
