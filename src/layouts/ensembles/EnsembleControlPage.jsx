/* eslint-disable react/prop-types */
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation } from "@apollo/client";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import {
  useEnsemblesDashboard,
  useEnsemblePaginated,
  useEnsembleCounts,
  useEnsembleInstrumentStats,
} from "./useEnsembles";
import { ADD_USER_TO_ENSEMBLES, REMOVE_USER_FROM_ENSEMBLES } from "./ensembles.gql.js";
import UserDetailsModal from "../../components/layouts/members/UserDetailsModal";
import { useMembersUtils } from "../../hooks/useMembersUtils";
import { exportEnsemblePDF, exportEnsembleXLSX } from "./ensembleExport";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function userInitials(u) {
  return [u.name, u.firstSurName].filter(Boolean).map((n) => n[0]).join("").toUpperCase();
}
function userFullName(u) {
  return [u.name, u.firstSurName, u.secondSurName].filter(Boolean).join(" ");
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared UI primitives
// ─────────────────────────────────────────────────────────────────────────────

function Avatar({ user }) {
  if (user.avatar) {
    return (
      <img src={user.avatar} alt={userInitials(user)} loading="lazy"
        className="w-9 h-9 rounded-full object-cover flex-shrink-0 ring-2 ring-white shadow-sm" />
    );
  }
  return (
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 text-gray-600 flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm">
      {userInitials(user)}
    </div>
  );
}

function StatePill({ state }) {
  const CONFIG = {
    Activo:   { dot: "bg-emerald-500", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    Inactivo: { dot: "bg-gray-400",    cls: "bg-gray-100  text-gray-500  border-gray-200"      },
    Exalumno: { dot: "bg-blue-400",    cls: "bg-blue-50   text-blue-600  border-blue-200"      },
  };
  const cfg = CONFIG[state] || CONFIG.Inactivo;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {state || "—"}
    </span>
  );
}

function InstrumentPill({ instrument }) {
  if (!instrument) return <span className="text-xs text-gray-300">—</span>;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
      <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
      </svg>
      {instrument}
    </span>
  );
}

function RolePill({ role }) {
  if (!role) return null;
  return (
    <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-semibold bg-purple-50 text-purple-700 border border-purple-100">
      {role}
    </span>
  );
}

// Muestra las agrupaciones de un usuario en el tab "En otras agrupaciones"
function BandsList({ bands = [], currentEnsembleName }) {
  const others = bands.filter((b) => b !== currentEnsembleName);
  if (others.length === 0) return <span className="text-xs text-gray-300">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {others.slice(0, 2).map((b) => (
        <span key={b} className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-semibold bg-violet-50 text-violet-700 border border-violet-200">
          {b}
        </span>
      ))}
      {others.length > 2 && (
        <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-semibold bg-violet-50 text-violet-500">
          +{others.length - 2}
        </span>
      )}
    </div>
  );
}

function SkeletonRow({ cols = 5 }) {
  return (
    <tr className="border-b border-gray-50">
      {Array.from({ length: cols }, (_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-100 rounded-full animate-pulse" style={{ width: `${45 + i * 10}%` }} />
        </td>
      ))}
    </tr>
  );
}

// ── Instrument stats block ────────────────────────────────────────────────

function InstrumentStats({ stats, loading }) {
  const [expanded, setExpanded] = useState(false);
  if (loading && stats.length === 0) {
    return (
      <div className="flex gap-2 flex-wrap mt-2">
        {[1, 2, 3].map((i) => <div key={i} className="h-5 w-20 bg-gray-100 rounded-full animate-pulse" />)}
      </div>
    );
  }
  if (stats.length === 0) return null;
  const visible = expanded ? stats : stats.slice(0, 5);
  const hidden = stats.length - 5;
  return (
    <div className="flex items-center gap-1.5 flex-wrap mt-2">
      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mr-1">Instrumentos</span>
      {visible.map((s) => (
        <span key={s.instrument} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
          {s.instrument}<span className="text-teal-400 font-bold">{s.count}</span>
        </span>
      ))}
      {!expanded && hidden > 0 && (
        <button onClick={() => setExpanded(true)} className="text-[10px] text-blue-500 hover:text-blue-700 font-semibold underline">+{hidden} más</button>
      )}
      {expanded && stats.length > 5 && (
        <button onClick={() => setExpanded(false)} className="text-[10px] text-gray-400 hover:text-gray-600 underline">Ver menos</button>
      )}
    </div>
  );
}

// ── Export dropdown ───────────────────────────────────────────────────────

function ExportDropdown({ onExport, exporting }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((v) => !v)} disabled={exporting}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 text-xs font-semibold hover:bg-gray-50 disabled:opacity-40 transition-all whitespace-nowrap">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
        {exporting ? "Exportando…" : "Exportar"}
        <svg xmlns="http://www.w3.org/2000/svg" className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden">
          <button onClick={() => { setOpen(false); onExport("pdf"); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors">
            <svg className="w-4 h-4 text-red-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M7 2a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V8l-6-6H7zm5 1l5 5h-5V3zM9 13h6v1H9v-1zm0 2h6v1H9v-1zm0-4h6v1H9v-1z" /></svg>
            Descargar PDF
          </button>
          <button onClick={() => { setOpen(false); onExport("xlsx"); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
            <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3a2 2 0 012-2h8l6 6v14a2 2 0 01-2 2H5a2 2 0 01-2-2V3zm11 0v5h5L14 3zm-4 8l-2 3 2 3H8l-1.5-2.5L5 14H3l2.5-3.5L3 7h2l1.5 2.5L8 7h2l-2 4zm4 0v6h5v-1h-4v-1.5h3v-1h-3V12h4v-1h-5z" /></svg>
            Descargar Excel
          </button>
        </div>
      )}
    </div>
  );
}

// ── Filter bar ────────────────────────────────────────────────────────────

function FilterBar({ filter, facets, setSearchText, setFilterField, clearFilters, inputRef, showBandsFilter = false }) {
  const [inputVal, setInputVal] = useState(filter.searchText || "");
  const timer = useRef(null);
  useEffect(() => { if (!filter.searchText) setInputVal(""); }, [filter.searchText]);
  const handleChange = (e) => {
    const v = e.target.value;
    setInputVal(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setSearchText(v), 300);
  };
  const hasFilters = Boolean(filter.searchText || filter.state || filter.instrument || filter.band);
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <div className="relative flex-1 min-w-52">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">⌕</span>
        <input ref={inputRef} type="text" value={inputVal} onChange={handleChange}
          placeholder="Buscar por nombre, email, carnet…"
          className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all" />
      </div>
      <select value={filter.state || ""} onChange={(e) => setFilterField("state", e.target.value)}
        className="py-2 px-3 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-gray-300">
        <option value="">Estado</option>
        {(facets.byState || []).map((f) => <option key={f.value} value={f.value}>{f.value} ({f.count})</option>)}
      </select>
      <select value={filter.instrument || ""} onChange={(e) => setFilterField("instrument", e.target.value)}
        className="py-2 px-3 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-gray-300">
        <option value="">Instrumento</option>
        {(facets.byInstrument || []).map((f) => <option key={f.value} value={f.value}>{f.value} ({f.count})</option>)}
      </select>
      {/* Filtro por agrupación de origen — solo en tab "En otras agrupaciones" */}
      {showBandsFilter && (facets.byEnsemble || []).length > 0 && (
        <select value={filter.band || ""} onChange={(e) => setFilterField("band", e.target.value)}
          className="py-2 px-3 rounded-xl border border-violet-200 bg-violet-50 text-violet-700 text-xs focus:outline-none focus:ring-2 focus:ring-violet-300">
          <option value="">Agrupación de origen</option>
          {(facets.byEnsemble || []).map((f) => <option key={f.value} value={f.value}>{f.value} ({f.count})</option>)}
        </select>
      )}
      {hasFilters && (
        <button onClick={() => { setInputVal(""); clearFilters(); }}
          className="py-2 px-3 rounded-xl border border-red-100 bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-all">
          Limpiar
        </button>
      )}
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────

function Pagination({ page, limit, total, onPageChange, onLimitChange }) {
  const totalPages = Math.ceil(total / limit);
  const pages = [];
  for (let p = Math.max(1, page - 2); p <= Math.min(totalPages, page + 2); p++) pages.push(p);
  if (total === 0) return null;
  return (
    <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between gap-3 text-xs flex-wrap">
      <div className="flex items-center gap-2 text-gray-500">
        <span>{(page - 1) * limit + 1}–{Math.min(page * limit, total)} de {total}</span>
        <select value={limit} onChange={(e) => onLimitChange(Number(e.target.value))}
          className="ml-2 py-1 px-2 rounded-lg border border-gray-200 bg-white text-xs focus:outline-none">
          {[10, 25, 50].map((v) => <option key={v} value={v}>{v} por página</option>)}
        </select>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(page - 1)} disabled={page <= 1}
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-all">‹</button>
        {pages.map((p) => (
          <button key={p} onClick={() => onPageChange(p)}
            className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${p === page ? "bg-gray-900 text-white" : "border border-gray-200 hover:bg-gray-50 text-gray-700"}`}>
            {p}
          </button>
        ))}
        <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-all">›</button>
      </div>
    </div>
  );
}

// ── Bulk bar ──────────────────────────────────────────────────────────────

function BulkBar({ totalSelected, pageSelectedCount, tabType, applying, onAction, onClear }) {
  if (totalSelected === 0) return null;
  const isRemove = tabType === "members";
  const colorCls = isRemove ? "bg-red-50 border-red-100" : "bg-blue-50 border-blue-100";
  const textCls  = isRemove ? "text-red-700" : "text-blue-700";
  const btnCls   = isRemove ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700";
  const actionLabel = isRemove
    ? `Remover ${totalSelected} de esta agrupación`
    : `Agregar ${totalSelected} a esta agrupación`;

  return (
    <div className={`px-4 py-2.5 flex items-center gap-3 flex-wrap border-b ${colorCls}`}>
      <div className={`flex items-center gap-2 text-xs font-semibold ${textCls}`}>
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span>
          {totalSelected} seleccionado{totalSelected !== 1 ? "s" : ""}
          {pageSelectedCount < totalSelected && (
            <span className="font-normal opacity-75 ml-1">({pageSelectedCount} en esta página)</span>
          )}
        </span>
      </div>
      <button onClick={onClear} className={`text-xs underline ${isRemove ? "text-red-400 hover:text-red-600" : "text-blue-500 hover:text-blue-700"}`}>
        Limpiar selección
      </button>
      <button onClick={onAction} disabled={applying}
        className={`ml-auto px-4 py-1.5 rounded-xl text-xs font-bold text-white disabled:opacity-40 transition-all ${btnCls}`}>
        {applying ? "Aplicando…" : actionLabel}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EnsembleTable — tabla reutilizable para los 3 tabs
// tabType: "members" | "available" | "in_other"
// ─────────────────────────────────────────────────────────────────────────────

function EnsembleTable({
  tabType,
  hook,
  applying,
  onBulkAction,
  onRowClick,
  searchInputRef,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onClearSelection,
  currentEnsembleName,
}) {
  const { items, total, facets, loading, filter, pagination, setPagination, setSearchText, setFilterField, clearFilters } = hook;

  const pageSelectedCount = items.filter((u) => selectedIds.has(u.id)).length;
  const allPageSelected   = items.length > 0 && pageSelectedCount === items.length;

  const headerCheckRef = useRef(null);
  useEffect(() => {
    if (headerCheckRef.current) {
      headerCheckRef.current.indeterminate = !allPageSelected && pageSelectedCount > 0;
    }
  }, [allPageSelected, pageSelectedCount]);

  // Columna extra: "Agrupaciones" solo en tab in_other
  const showBandsCol = tabType === "in_other";

  const EMPTY = {
    members:   { icon: "👥", title: "Sin miembros",        sub: "Esta agrupación aún no tiene miembros asignados." },
    available: { icon: "✅", title: "Sin disponibles",      sub: "No hay integrantes sin agrupación en el sistema." },
    in_other:  { icon: "🎼", title: "Ninguno en otras",    sub: "Todos los integrantes disponibles están libres o ya son miembros aquí." },
  };
  const empty = EMPTY[tabType];

  return (
    <div className="space-y-3">
      <FilterBar
        filter={filter}
        facets={facets}
        setSearchText={setSearchText}
        setFilterField={setFilterField}
        clearFilters={clearFilters}
        inputRef={searchInputRef}
        showBandsFilter={showBandsCol}
      />

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <BulkBar
          totalSelected={selectedIds.size}
          pageSelectedCount={pageSelectedCount}
          tabType={tabType}
          applying={applying}
          onAction={() => onBulkAction(Array.from(selectedIds))}
          onClear={onClearSelection}
        />

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="w-10 px-4 py-3">
                  <input
                    ref={headerCheckRef}
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={allPageSelected
                      ? () => items.forEach((u) => selectedIds.has(u.id) && onToggleSelect(u.id))
                      : () => onSelectAll(items.map((u) => u.id))
                    }
                    className="rounded border-gray-300 accent-gray-900"
                  />
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Miembro</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Instrumento</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Estado</th>
                {showBandsCol && (
                  <th className="px-4 py-3 text-left font-semibold text-violet-500 uppercase tracking-wide whitespace-nowrap hidden lg:table-cell">
                    En agrupaciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && items.length === 0 ? (
                Array.from({ length: 8 }, (_, i) => <SkeletonRow key={i} cols={showBandsCol ? 5 : 4} />)
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={showBandsCol ? 5 : 4} className="py-16 text-center">
                    <p className="text-3xl mb-2">{empty.icon}</p>
                    <p className="text-sm font-bold text-gray-900">{empty.title}</p>
                    <p className="text-xs text-gray-400 mt-1">{empty.sub}</p>
                  </td>
                </tr>
              ) : (
                items.map((user) => {
                  const isSelected = selectedIds.has(user.id);
                  return (
                    <tr
                      key={user.id}
                      onClick={() => onRowClick(user)}
                      className={`transition-colors cursor-pointer ${isSelected ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-gray-50"}`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => onToggleSelect(user.id)}
                          className="rounded border-gray-300 accent-gray-900 cursor-pointer"
                        />
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar user={user} />
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate leading-tight">{userFullName(user)}</p>
                            <p className="text-gray-400 truncate text-[11px]">{user.email}</p>
                            {user.role && <div className="mt-0.5"><RolePill role={user.role} /></div>}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <InstrumentPill instrument={user.instrument} />
                      </td>

                      <td className="px-4 py-3">
                        <StatePill state={user.state} />
                      </td>

                      {showBandsCol && (
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <BandsList bands={user.bands || []} currentEnsembleName={currentEnsembleName} />
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={pagination.page}
          limit={pagination.limit}
          total={total}
          onPageChange={(p) => setPagination((prev) => ({ ...prev, page: p }))}
          onLimitChange={(lim) => setPagination({ page: 1, limit: lim, sortBy: "firstSurName", sortDir: "asc" })}
        />
      </div>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────

function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, 4500);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);
  if (!toast) return null;
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[1350] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold text-white whitespace-nowrap ${toast.type === "error" ? "bg-red-600" : "bg-gray-900"}`}>
      <span>{toast.message}</span>
      <button onClick={onDismiss} className="opacity-60 hover:opacity-100 ml-1">✕</button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab config
// ─────────────────────────────────────────────────────────────────────────────

const TABS = [
  {
    key: "members",
    label: "Miembros",
    queryType: "members",
    // color del badge de selección pendiente
    selBadgeColor: "bg-red-500",
  },
  {
    key: "available",
    label: "Disponibles",
    queryType: "available",
    selBadgeColor: "bg-blue-500",
  },
  {
    key: "in_other",
    label: "En otras agrupaciones",
    queryType: "in_other",
    selBadgeColor: "bg-violet-500",
  },
];

const CATEGORY_LABEL = { MARCHING: "Marcha", BIG_BAND: "Big Band", CONCERT: "Concierto", OTHER: "Otro" };
const CATEGORY_BADGE = {
  MARCHING: "bg-rose-50 text-rose-600 border-rose-100",
  BIG_BAND:  "bg-amber-50 text-amber-600 border-amber-100",
  CONCERT:   "bg-blue-50 text-blue-600 border-blue-100",
  OTHER:     "bg-gray-100 text-gray-500 border-gray-200",
};

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function EnsembleControlPage() {
  const { key: ensembleKey } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { ensembles, refetch: refetchEnsembles } = useEnsemblesDashboard();
  const ensemble = ensembles.find((e) => e.key === ensembleKey) || null;

  // Tab inicial: 0=Miembros, 1=Disponibles, 2=En otras (assign=1 → Disponibles)
  const [activeTab, setActiveTab] = useState(() => {
    if (searchParams.get("assign") === "1") return 1;
    return 0;
  });

  // Tres hooks, uno por tab — cada uno suspendido cuando su tab no está activo
  const membersHook   = useEnsemblePaginated(ensembleKey, "members",   activeTab !== 0);
  const availableHook = useEnsemblePaginated(ensembleKey, "available", activeTab !== 1);
  const inOtherHook   = useEnsemblePaginated(ensembleKey, "in_other",  activeTab !== 2);

  const hooks = [membersHook, availableHook, inOtherHook];
  const activeHook = hooks[activeTab];

  const countsHook = useEnsembleCounts(ensembleKey);
  const { stats: instrStats, loading: instrLoading, refetch: refetchInstrStats } = useEnsembleInstrumentStats(ensembleKey);

  const availableSearchRef = useRef(null);
  const inOtherSearchRef   = useRef(null);

  // ── Selección persistente (3 Sets, uno por tab) ───────────────────────────
  const [membersSelected,   setMembersSelected]   = useState(() => new Set());
  const [availableSelected, setAvailableSelected] = useState(() => new Set());
  const [inOtherSelected,   setInOtherSelected]   = useState(() => new Set());

  const selectionSets    = [membersSelected,   availableSelected,   inOtherSelected];
  const selectionSetters = [setMembersSelected, setAvailableSelected, setInOtherSelected];

  const selectedIds  = selectionSets[activeTab];
  const setSelectedIds = selectionSetters[activeTab];

  const handleToggleSelect = useCallback((id) => {
    setSelectedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, [setSelectedIds]);

  const handleSelectAll = useCallback((ids) => {
    setSelectedIds((prev) => { const n = new Set(prev); ids.forEach((id) => n.add(id)); return n; });
  }, [setSelectedIds]);

  const handleClearSelection = useCallback(() => setSelectedIds(new Set()), [setSelectedIds]);

  // ── Tab change ─────────────────────────────────────────────────────────────
  const handleTabChange = useCallback((idx) => {
    setActiveTab(idx);
    if (idx === 1) setTimeout(() => availableSearchRef.current?.focus(), 80);
    if (idx === 2) setTimeout(() => inOtherSearchRef.current?.focus(), 80);
  }, []);

  // ── Otros estados ──────────────────────────────────────────────────────────
  const [selectedUser, setSelectedUser] = useState(null);
  const { userRole, getMedicalRecordForUserId, deleteUserAndMedicalRecord } = useMembersUtils();
  const medicalRecord = selectedUser ? getMedicalRecordForUserId(selectedUser.id) : null;
  const canDeleteUser = userRole === "Admin" || userRole === "Director";

  const [toast, setToast]     = useState(null);
  const [exporting, setExporting] = useState(false);
  const showToast = useCallback((msg, type = "success") => setToast({ message: msg, type }), []);

  const handleExport = useCallback(async (format) => {
    setExporting(true);
    try {
      const tabLabel = TABS[activeTab].label;
      const members = activeHook.items;
      if (format === "pdf") { await exportEnsemblePDF({ ensemble, members, tabLabel }); showToast(`PDF de "${tabLabel}" descargado`); }
      else { await exportEnsembleXLSX({ ensemble, members, tabLabel }); showToast(`Excel de "${tabLabel}" descargado`); }
    } catch (err) { console.error(err); showToast("Error al exportar.", "error"); }
    finally { setExporting(false); }
  }, [activeTab, activeHook.items, ensemble, showToast]);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const refetchAll = useCallback(() => {
    membersHook.refetch(); availableHook.refetch(); inOtherHook.refetch();
    countsHook.refetch(); refetchInstrStats(); refetchEnsembles();
  }, [membersHook, availableHook, inOtherHook, countsHook, refetchInstrStats, refetchEnsembles]);

  const [addMutation, { loading: adding }] = useMutation(ADD_USER_TO_ENSEMBLES, {
    onCompleted: (data) => {
      const r = data?.addUserToEnsembles;
      const parts = [`${r.updatedCount} agregado${r.updatedCount !== 1 ? "s" : ""}`];
      if (r.skippedCount > 0) parts.push(`${r.skippedCount} omitido${r.skippedCount !== 1 ? "s" : ""}`);
      showToast(parts.join(" · "));
      // Limpiar la selección del tab que ejecutó la acción (1 o 2)
      if (activeTab === 1) setAvailableSelected(new Set());
      if (activeTab === 2) setInOtherSelected(new Set());
      refetchAll();
    },
    onError: (e) => showToast(e.message, "error"),
  });

  const [removeMutation, { loading: removing }] = useMutation(REMOVE_USER_FROM_ENSEMBLES, {
    onCompleted: (data) => {
      const r = data?.removeUserFromEnsembles;
      const parts = [`${r.updatedCount} removido${r.updatedCount !== 1 ? "s" : ""}`];
      if (r.skippedCount > 0) parts.push(`${r.skippedCount} omitido${r.skippedCount !== 1 ? "s" : ""}`);
      showToast(parts.join(" · "));
      setMembersSelected(new Set());
      refetchAll();
    },
    onError: (e) => showToast(e.message, "error"),
  });

  const handleBulkAction = useCallback((userIds) => {
    if (!userIds.length) return;
    if (activeTab === 0) {
      removeMutation({ variables: { userIds, ensembleKeys: [ensembleKey] } });
    } else {
      // Tab 1 (Disponibles) o Tab 2 (En otras agrupaciones) → agregar
      addMutation({ variables: { userIds, ensembleKeys: [ensembleKey] } });
    }
  }, [activeTab, ensembleKey, addMutation, removeMutation]);

  const applying = adding || removing;

  // Counts para los badges
  const tabCounts = [
    countsHook.membersTotal   ?? "—",
    countsHook.availableTotal ?? "—",
    countsHook.inOtherTotal   ?? "—",
  ];

  const categoryBadgeCls = CATEGORY_BADGE[ensemble?.category] || CATEGORY_BADGE.OTHER;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <div className="px-4 pb-10 pt-2 max-w-screen-xl">

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
          <button onClick={() => navigate("/ensembles")} className="hover:text-gray-700 transition-colors">Agrupaciones</button>
          <span>›</span>
          <span className="text-gray-700 font-semibold">{ensemble?.name || ensembleKey}</span>
        </div>

        {/* Header card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 mb-5">
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg my-auto font-bold text-gray-900 leading-tight">{ensemble?.name || ensembleKey}</h1>
                {ensemble?.category && (
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${categoryBadgeCls}`}>
                    {CATEGORY_LABEL[ensemble.category] || ensemble.category}
                  </span>
                )}
              </div>
              <InstrumentStats stats={instrStats} loading={instrLoading} />
            </div>

            <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
              {/* Quick actions */}
              <button onClick={() => handleTabChange(1)} className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all whitespace-nowrap">
                + Agregar
              </button>
              <button onClick={() => handleTabChange(0)} className="px-4 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition-all whitespace-nowrap">
                − Remover
              </button>
              <ExportDropdown onExport={handleExport} exporting={exporting} />
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-gray-200 mb-5 overflow-x-auto">
          {TABS.map(({ key, label, selBadgeColor }, i) => {
            const count     = tabCounts[i];
            const selCount  = selectionSets[i].size;
            const isActive  = i === activeTab;
            return (
              <button
                key={key}
                onClick={() => handleTabChange(i)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px whitespace-nowrap ${
                  isActive ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400 hover:text-gray-700"
                }`}
              >
                {label}
                {/* Contador total */}
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${isActive ? "bg-gray-100 text-gray-700" : "bg-gray-50 text-gray-400"}`}>
                  {count}
                </span>
                {/* Badge de selección pendiente (solo si hay algo seleccionado) */}
                {selCount > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white ${selBadgeColor}`}>
                    {selCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {activeTab === 0 && (
          <EnsembleTable
            tabType="members"
            hook={membersHook}
            applying={applying}
            onBulkAction={handleBulkAction}
            onRowClick={setSelectedUser}
            selectedIds={membersSelected}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
            onClearSelection={handleClearSelection}
            currentEnsembleName={ensemble?.name}
          />
        )}
        {activeTab === 1 && (
          <EnsembleTable
            tabType="available"
            hook={availableHook}
            applying={applying}
            onBulkAction={handleBulkAction}
            onRowClick={setSelectedUser}
            searchInputRef={availableSearchRef}
            selectedIds={availableSelected}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
            onClearSelection={handleClearSelection}
            currentEnsembleName={ensemble?.name}
          />
        )}
        {activeTab === 2 && (
          <EnsembleTable
            tabType="in_other"
            hook={inOtherHook}
            applying={applying}
            onBulkAction={handleBulkAction}
            onRowClick={setSelectedUser}
            searchInputRef={inOtherSearchRef}
            selectedIds={inOtherSelected}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
            onClearSelection={handleClearSelection}
            currentEnsembleName={ensemble?.name}
          />
        )}
      </div>
      <Footer />

      <UserDetailsModal
        open={!!selectedUser}
        user={selectedUser}
        userRole={userRole}
        medicalRecord={medicalRecord}
        canDeleteUser={canDeleteUser}
        onClose={() => setSelectedUser(null)}
        onConfirmDelete={async ({ userId, medicalRecordId }) => {
          try {
            const ok = await deleteUserAndMedicalRecord({ userId, medicalRecordId });
            if (ok) { setSelectedUser(null); activeHook.refetch(); }
            return ok;
          } catch { return false; }
        }}
      />

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </DashboardLayout>
  );
}