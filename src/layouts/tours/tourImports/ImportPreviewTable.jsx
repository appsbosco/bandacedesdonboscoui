/* eslint-disable react/prop-types */

import { useState } from "react";

const STATUS_TABS = [
  { id: "all", label: "Todas" },
  { id: "VALID", label: "Válidas" },
  { id: "INVALID", label: "Con errores" },
  { id: "DUPLICATE", label: "Duplicadas" },
];

const ROW_STATUS_CONFIG = {
  VALID: { label: "Válida", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  INVALID: { label: "Error", className: "bg-red-50 text-red-700 border-red-200" },
  DUPLICATE: { label: "Duplicada", className: "bg-amber-50 text-amber-700 border-amber-200" },
};

function rowBg(status) {
  if (status === "INVALID") return "bg-red-50/40";
  if (status === "DUPLICATE") return "bg-amber-50/40";
  return "";
}

export default function ImportPreviewTable({ rows = [] }) {
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");

  const getStatus = (row) => {
    if (row.isDuplicate) return "DUPLICATE";
    if (!row.isValid) return "INVALID";
    return "VALID";
  };

  const count = (id) =>
    id === "all" ? rows.length : rows.filter((r) => getStatus(r) === id).length;

  const filtered = rows.filter((r) => {
    const matchTab = activeTab === "all" || getStatus(r) === activeTab;
    const term = search.toLowerCase();
    const matchSearch =
      !search ||
      `${r.firstName} ${r.firstSurname}`.toLowerCase().includes(term) ||
      (r.identification || "").toLowerCase().includes(term) ||
      (r.email || "").toLowerCase().includes(term);
    return matchTab && matchSearch;
  });

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
          {STATUS_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === t.id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
              <span
                className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === t.id ? "bg-gray-100 text-gray-600" : "bg-gray-200 text-gray-500"
                }`}
              >
                {count(t.id)}
              </span>
            </button>
          ))}
        </div>

        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar nombre, cédula…"
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
          />
        </div>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-2xl overflow-hidden">
        {/* Header — desktop */}
        <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-widest">
          <div className="col-span-1">#</div>
          <div className="col-span-3">Nombre</div>
          <div className="col-span-2">Cédula</div>
          <div className="col-span-2">Correo</div>
          <div className="col-span-2">Rol</div>
          <div className="col-span-2">Estado</div>
        </div>

        <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400">Sin filas para mostrar.</div>
          ) : (
            filtered.map((row) => {
              const status = getStatus(row);
              const cfg = ROW_STATUS_CONFIG[status];
              return (
                <div key={row.rowIndex} className={`px-4 py-3 text-xs ${rowBg(status)} group`}>
                  {/* Desktop layout */}
                  <div className="hidden sm:grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-1 text-gray-400 font-mono">{row.rowNumber}</div>
                    <div className="col-span-3 font-semibold text-gray-900 truncate">
                      {row.firstName} {row.firstSurname}
                    </div>
                    <div className="col-span-2 text-gray-600 font-mono">
                      {row.identification || "—"}
                    </div>
                    <div className="col-span-2 text-gray-500 truncate">{row.email || "—"}</div>
                    <div className="col-span-2 text-gray-600">{row.role || "—"}</div>
                    <div className="col-span-2 flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.className}`}
                      >
                        {cfg.label}
                      </span>
                      {row.errors?.length > 0 && (
                        <div className="relative group/tooltip">
                          <svg
                            className="w-3.5 h-3.5 text-red-400 cursor-help"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <div className="absolute bottom-5 left-0 hidden group-hover/tooltip:block z-10 bg-gray-900 text-white text-[10px] rounded-xl p-2 min-w-[180px] shadow-xl">
                            {row.errors.join(", ")}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mobile layout */}
                  <div className="sm:hidden space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">
                        {row.firstName} {row.firstSurname}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.className}`}
                      >
                        {cfg.label}
                      </span>
                    </div>
                    <div className="text-gray-500">
                      {row.identification || "Sin cédula"} · {row.role || "Sin rol"}
                    </div>
                    {row.errors?.length > 0 && (
                      <p className="text-red-500">{row.errors.join(", ")}</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
