/* eslint-disable react/prop-types */
/**
 * EnsembleControlPage — 2-tab control center for a single ensemble.
 *
 * FIXES vs previous version:
 *   - Checkbox: td onClick removed; only input onClick stopPropagation + onChange toggles (no double-toggle)
 *   - Disponibles badge shows immediately from ensembleCounts query (not skipped)
 *   - "+ Agregar" switches tab AND focuses search input via ref
 *   - Selection clears on tab/page/filter change
 *   - Only eligible musician roles appear (enforced server-side + shown here)
 *   - Instrument stats shown in header
 *   - Role + Instrument visible in every row (no hidden breakpoint)
 */
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

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function userInitials(u) {
  return [u.name, u.firstSurName]
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}
function userFullName(u) {
  return [u.firstSurName, u.secondSurName, u.name].filter(Boolean).join(" ");
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function Avatar({ user }) {
  if (user.avatar) {
    return (
      <img
        src={user.avatar}
        alt={userInitials(user)}
        loading="lazy"
        className="w-9 h-9 rounded-full object-cover flex-shrink-0 ring-2 ring-white"
      />
    );
  }
  return (
    <div className="w-9 h-9 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
      {userInitials(user)}
    </div>
  );
}

function StatePill({ state }) {
  const CLS = {
    Activo: "bg-emerald-50 text-emerald-700 border-emerald-100",
    Inactivo: "bg-gray-100  text-gray-500  border-gray-200",
    Exalumno: "bg-blue-50   text-blue-600  border-blue-100",
  };
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
        CLS[state] || "bg-gray-100 text-gray-500 border-gray-200"
      }`}
    >
      {state || "—"}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-50">
      {[0, 1, 2, 3].map((i) => (
        <td key={i} className="px-4 py-3">
          <div
            className="h-4 bg-gray-100 rounded-full animate-pulse"
            style={{ width: `${50 + i * 12}%` }}
          />
        </td>
      ))}
    </tr>
  );
}

// ── Instrument stats block ─────────────────────────────────────────────────

function InstrumentStats({ stats, loading }) {
  const [expanded, setExpanded] = useState(false);

  if (loading && stats.length === 0) {
    return (
      <div className="flex gap-2 flex-wrap mt-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-5 w-20 bg-gray-100 rounded-full animate-pulse" />
        ))}
      </div>
    );
  }
  if (stats.length === 0) return null;

  const visible = expanded ? stats : stats.slice(0, 5);
  const hidden = stats.length - 5;

  return (
    <div className="flex items-center gap-1.5 flex-wrap mt-2">
      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mr-1">
        Instrumentos
      </span>
      {visible.map((s) => (
        <span
          key={s.instrument}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700 border border-gray-200"
        >
          {s.instrument}
          <span className="text-gray-400 font-normal">{s.count}</span>
        </span>
      ))}
      {!expanded && hidden > 0 && (
        <button
          onClick={() => setExpanded(true)}
          className="text-[10px] text-blue-500 hover:text-blue-700 font-semibold underline"
        >
          +{hidden} más
        </button>
      )}
      {expanded && stats.length > 5 && (
        <button
          onClick={() => setExpanded(false)}
          className="text-[10px] text-gray-400 hover:text-gray-600 underline"
        >
          Ver menos
        </button>
      )}
    </div>
  );
}

// ── Filter bar ────────────────────────────────────────────────────────────────
// inputRef is forwarded to the search <input> so parent can focus it programmatically.

function FilterBar({ filter, facets, setSearchText, setFilterField, clearFilters, inputRef }) {
  const [inputVal, setInputVal] = useState(filter.searchText || "");
  const timer = useRef(null);

  // Reset local input when filter is externally cleared
  useEffect(() => {
    if (!filter.searchText) setInputVal("");
  }, [filter.searchText]);

  const handleChange = (e) => {
    const v = e.target.value;
    setInputVal(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setSearchText(v), 300);
  };

  const hasFilters = Boolean(filter.searchText || filter.state || filter.instrument);

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <div className="relative flex-1 min-w-52">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">
          ⌕
        </span>
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={handleChange}
          placeholder="Buscar por nombre, email, carnet…"
          className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all"
        />
      </div>

      <select
        value={filter.state || ""}
        onChange={(e) => setFilterField("state", e.target.value)}
        className="py-2 px-3 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-gray-300"
      >
        <option value="">Estado</option>
        {(facets.byState || []).map((f) => (
          <option key={f.value} value={f.value}>
            {f.value} ({f.count})
          </option>
        ))}
      </select>

      <select
        value={filter.instrument || ""}
        onChange={(e) => setFilterField("instrument", e.target.value)}
        className="py-2 px-3 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-gray-300"
      >
        <option value="">Instrumento</option>
        {(facets.byInstrument || []).map((f) => (
          <option key={f.value} value={f.value}>
            {f.value} ({f.count})
          </option>
        ))}
      </select>

      {hasFilters && (
        <button
          onClick={() => {
            setInputVal("");
            clearFilters();
          }}
          className="py-2 px-3 rounded-xl border border-red-100 bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-all"
        >
          Limpiar
        </button>
      )}
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────

function Pagination({ page, limit, total, onPageChange, onLimitChange }) {
  const totalPages = Math.ceil(total / limit);
  const pages = [];
  for (let p = Math.max(1, page - 2); p <= Math.min(totalPages, page + 2); p++) pages.push(p);
  if (total === 0) return null;

  return (
    <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between gap-3 text-xs flex-wrap">
      <div className="flex items-center gap-2 text-gray-500">
        <span>
          {(page - 1) * limit + 1}–{Math.min(page * limit, total)} de {total}
        </span>
        <select
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          className="ml-2 py-1 px-2 rounded-lg border border-gray-200 bg-white text-xs focus:outline-none"
        >
          {[10, 25, 50].map((v) => (
            <option key={v} value={v}>
              {v} por página
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-all"
        >
          ‹
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${
              p === page
                ? "bg-gray-900 text-white"
                : "border border-gray-200 hover:bg-gray-50 text-gray-700"
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-all"
        >
          ›
        </button>
      </div>
    </div>
  );
}

// ── Inline bulk action bar ────────────────────────────────────────────────────

function BulkBar({ count, tabType, applying, onAction, onClear }) {
  if (count === 0) return null;
  const isAdd = tabType === "available";
  return (
    <div
      className={`px-4 py-2.5 flex items-center gap-3 flex-wrap border-b ${
        isAdd ? "bg-blue-50 border-blue-100" : "bg-red-50 border-red-100"
      }`}
    >
      <span className={`text-xs font-semibold ${isAdd ? "text-blue-700" : "text-red-700"}`}>
        {count} seleccionado{count !== 1 ? "s" : ""}
      </span>
      <button
        onClick={onClear}
        className={`text-xs underline ${
          isAdd ? "text-blue-500 hover:text-blue-700" : "text-red-400 hover:text-red-600"
        }`}
      >
        Limpiar
      </button>
      <button
        onClick={onAction}
        disabled={applying}
        className={`ml-auto px-4 py-1.5 rounded-xl text-xs font-bold text-white disabled:opacity-40 transition-all ${
          isAdd ? "bg-blue-600 hover:bg-blue-700" : "bg-red-600 hover:bg-red-700"
        }`}
      >
        {applying
          ? "Aplicando…"
          : isAdd
          ? `Agregar ${count} a esta agrupación`
          : `Remover ${count} de esta agrupación`}
      </button>
    </div>
  );
}

// ── Ensemble table ────────────────────────────────────────────────────────────

function EnsembleTable({ tabType, hook, applying, onBulkAction, onRowClick, searchInputRef }) {
  const {
    items,
    total,
    facets,
    loading,
    filter,
    pagination,
    setPagination,
    setSearchText,
    setFilterField,
    clearFilters,
    selectedIds,
    toggleSelect,
    selectAll,
    clearSelection,
  } = hook;

  const allSelected = items.length > 0 && items.every((u) => selectedIds.has(u.id));

  const handlePageChange = (p) => setPagination((prev) => ({ ...prev, page: p }));
  const handleLimitChange = (lim) =>
    setPagination({ page: 1, limit: lim, sortBy: "firstSurName", sortDir: "asc" });

  const emptyMessage =
    tabType === "members"
      ? {
          icon: "👥",
          title: "Sin miembros",
          sub: "Esta agrupación aún no tiene miembros asignados.",
        }
      : {
          icon: "✅",
          title: "Todos asignados",
          sub: "Todos los integrantes ya son miembros de esta agrupación.",
        };

  return (
    <div className="space-y-3">
      <FilterBar
        filter={filter}
        facets={facets}
        setSearchText={setSearchText}
        setFilterField={setFilterField}
        clearFilters={clearFilters}
        inputRef={searchInputRef}
      />

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Bulk bar */}
        <BulkBar
          count={selectedIds.size}
          tabType={tabType}
          applying={applying}
          onAction={() => onBulkAction(Array.from(selectedIds))}
          onClear={clearSelection}
        />

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={allSelected ? clearSelection : selectAll}
                    className="rounded border-gray-300 accent-gray-900"
                  />
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                  Miembro
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                  Rol / Instrumento
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap hidden sm:table-cell">
                  Estado
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap hidden lg:table-cell">
                  Agrupaciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && items.length === 0 ? (
                Array.from({ length: 8 }, (_, i) => <SkeletonRow key={i} />)
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <p className="text-3xl mb-2">{emptyMessage.icon}</p>
                    <p className="text-sm font-bold text-gray-900">{emptyMessage.title}</p>
                    <p className="text-xs text-gray-400 mt-1">{emptyMessage.sub}</p>
                  </td>
                </tr>
              ) : (
                items.map((user) => {
                  const isSelected = selectedIds.has(user.id);
                  return (
                    <tr
                      key={user.id}
                      onClick={() => onRowClick(user)}
                      className={`transition-colors cursor-pointer ${
                        isSelected ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-gray-50"
                      }`}
                    >
                      {/* ── Checkbox ──
                            ONLY input onChange toggles selection.
                            input onClick stops propagation so tr onClick (open drawer) doesn't fire.
                            No handler on <td> — avoids the double-toggle bug. */}
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => toggleSelect(user.id)}
                          className="rounded border-gray-300 accent-gray-900 cursor-pointer"
                        />
                      </td>

                      {/* Name + email */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar user={user} />
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate leading-tight">
                              {userFullName(user)}
                            </p>
                            <p className="text-gray-400 truncate text-[11px]">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role + Instrument — always visible */}
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          {user.role && (
                            <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-semibold bg-purple-50 text-purple-700 border border-purple-100">
                              {user.role}
                            </span>
                          )}
                          {user.instrument && (
                            <p className="text-[11px] text-gray-500 font-medium">
                              {user.instrument}
                            </p>
                          )}
                          {!user.role && !user.instrument && (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <StatePill state={user.state} />
                      </td>

                      {/* Agrupaciones */}
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {(user.bands || []).length === 0 ? (
                          <span className="text-xs text-gray-300">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {user.bands.slice(0, 2).map((b) => (
                              <span
                                key={b}
                                className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-semibold bg-gray-100 text-gray-600 border border-gray-200"
                              >
                                {b}
                              </span>
                            ))}
                            {user.bands.length > 2 && (
                              <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-semibold bg-gray-100 text-gray-500">
                                +{user.bands.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
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
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
        />
      </div>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, 4500);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  if (!toast) return null;
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[1350] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold text-white whitespace-nowrap ${
        toast.type === "error" ? "bg-red-600" : "bg-gray-900"
      }`}
    >
      <span>{toast.message}</span>
      <button onClick={onDismiss} className="opacity-60 hover:opacity-100 ml-1">
        ✕
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORY_LABEL = {
  MARCHING: "Marcha",
  BIG_BAND: "Big Band",
  CONCERT: "Concierto",
  OTHER: "Otro",
};
const CATEGORY_BADGE = {
  MARCHING: "bg-rose-50 text-rose-600 border-rose-100",
  BIG_BAND: "bg-amber-50 text-amber-600 border-amber-100",
  CONCERT: "bg-blue-50 text-blue-600 border-blue-100",
  OTHER: "bg-gray-100 text-gray-500 border-gray-200",
};

const TABS = ["Miembros", "Disponibles"];

export default function EnsembleControlPage() {
  const { key: ensembleKey } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { ensembles, refetch: refetchEnsembles } = useEnsemblesDashboard();
  const ensemble = ensembles.find((e) => e.key === ensembleKey) || null;

  // Tab — default to Disponibles when ?assign=1
  const [activeTab, setActiveTab] = useState(() => (searchParams.get("assign") === "1" ? 1 : 0));

  // Per-tab paginated hooks (skip = inactive tab)
  const membersHook = useEnsemblePaginated(ensembleKey, "members", activeTab !== 0);
  const availableHook = useEnsemblePaginated(ensembleKey, "available", activeTab !== 1);
  const activeHook = activeTab === 0 ? membersHook : availableHook;

  // Counts hook — always runs, gives accurate badge values without visiting each tab
  const countsHook = useEnsembleCounts(ensembleKey);

  // Instrument stats hook — always runs
  const {
    stats: instrStats,
    loading: instrLoading,
    refetch: refetchInstrStats,
  } = useEnsembleInstrumentStats(ensembleKey);

  // Ref to focus Available tab's search on "+ Agregar"
  const availableSearchRef = useRef(null);

  // User details drawer
  const [selectedUser, setSelectedUser] = useState(null);
  const { userRole, getMedicalRecordForUserId, deleteUserAndMedicalRecord } = useMembersUtils();
  const medicalRecord = selectedUser ? getMedicalRecordForUserId(selectedUser.id) : null;
  const canDeleteUser = userRole === "Admin" || userRole === "Director";

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = useCallback((msg, type = "success") => setToast({ message: msg, type }), []);

  // Tab change — clears both selections
  const handleTabChange = useCallback(
    (idx) => {
      setActiveTab(idx);
      membersHook.clearSelection();
      availableHook.clearSelection();
      // Focus search when switching to Disponibles
      if (idx === 1) {
        setTimeout(() => availableSearchRef.current?.focus(), 80);
      }
    },
    [membersHook, availableHook]
  );

  // ── Mutations ────────────────────────────────────────────────────────────

  const [addMutation, { loading: adding }] = useMutation(ADD_USER_TO_ENSEMBLES, {
    onCompleted: (data) => {
      const r = data?.addUserToEnsembles;
      const parts = [`${r.updatedCount} agregado${r.updatedCount !== 1 ? "s" : ""}`];
      if (r.skippedCount > 0)
        parts.push(`${r.skippedCount} omitido${r.skippedCount !== 1 ? "s" : ""}`);
      showToast(parts.join(" · "));
      availableHook.clearSelection();
      availableHook.refetch();
      membersHook.refetch();
      countsHook.refetch();
      refetchInstrStats();
      refetchEnsembles();
    },
    onError: (e) => showToast(e.message, "error"),
  });

  const [removeMutation, { loading: removing }] = useMutation(REMOVE_USER_FROM_ENSEMBLES, {
    onCompleted: (data) => {
      const r = data?.removeUserFromEnsembles;
      const parts = [`${r.updatedCount} removido${r.updatedCount !== 1 ? "s" : ""}`];
      if (r.skippedCount > 0)
        parts.push(`${r.skippedCount} omitido${r.skippedCount !== 1 ? "s" : ""}`);
      showToast(parts.join(" · "));
      membersHook.clearSelection();
      membersHook.refetch();
      availableHook.refetch();
      countsHook.refetch();
      refetchInstrStats();
      refetchEnsembles();
    },
    onError: (e) => showToast(e.message, "error"),
  });

  const handleBulkAction = useCallback(
    (userIds) => {
      if (!userIds.length) return;
      if (activeTab === 0) {
        removeMutation({ variables: { userIds, ensembleKeys: [ensembleKey] } });
      } else {
        addMutation({ variables: { userIds, ensembleKeys: [ensembleKey] } });
      }
    },
    [activeTab, ensembleKey, addMutation, removeMutation]
  );

  const applying = adding || removing;

  // ── Badge values from counts hook (always accurate) ─────────────────────
  const membersTotal = countsHook.membersTotal ?? "—";
  const availableTotal = countsHook.availableTotal ?? "—";

  const categoryBadgeCls = CATEGORY_BADGE[ensemble?.category] || CATEGORY_BADGE.OTHER;

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <div className="px-4 pb-10 pt-2 max-w-screen-xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
          <button
            onClick={() => navigate("/ensembles")}
            className="hover:text-gray-700 transition-colors"
          >
            Agrupaciones
          </button>
          <span>›</span>
          <span className="text-gray-700 font-semibold">{ensemble?.name || ensembleKey}</span>
        </div>

        {/* Header card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 mb-5">
          <div className="flex flex-wrap items-start gap-4">
            {/* Title + badge + instrument stats */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg my-auto font-bold text-gray-900 leading-tight">
                  {ensemble?.name || ensembleKey}
                </h1>
                {ensemble?.category && (
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${categoryBadgeCls}`}
                  >
                    {CATEGORY_LABEL[ensemble.category] || ensemble.category}
                  </span>
                )}
              </div>
              <InstrumentStats stats={instrStats} loading={instrLoading} />
            </div>

            {/* Stat pills + quick actions */}
            <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
              {/* Miembros pill */}
              <button
                onClick={() => handleTabChange(0)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                  activeTab === 0
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                Miembros
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === 0 ? "bg-white/20" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {membersTotal}
                </span>
              </button>

              {/* Disponibles pill */}
              <button
                onClick={() => handleTabChange(1)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                  activeTab === 1
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                Disponibles
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === 1 ? "bg-white/20" : "bg-blue-50 text-blue-600"
                  }`}
                >
                  {availableTotal}
                </span>
              </button>

              {/* Quick actions */}
              <button
                onClick={() => handleTabChange(1)}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all whitespace-nowrap"
              >
                + Agregar
              </button>
              <button
                onClick={() => handleTabChange(0)}
                className="px-4 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition-all whitespace-nowrap"
              >
                − Remover
              </button>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-gray-200 mb-5">
          {TABS.map((label, i) => (
            <button
              key={label}
              onClick={() => handleTabChange(i)}
              className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px ${
                i === activeTab
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-400 hover:text-gray-700"
              }`}
            >
              {label}
              <span
                className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                  i === activeTab ? "bg-gray-100 text-gray-700" : "bg-gray-50 text-gray-400"
                }`}
              >
                {i === 0 ? membersTotal : availableTotal}
              </span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 0 && (
          <EnsembleTable
            tabType="members"
            hook={membersHook}
            applying={applying}
            onBulkAction={handleBulkAction}
            onRowClick={setSelectedUser}
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
          />
        )}
      </div>
      <Footer />

      {/* User details drawer */}
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
            if (ok) {
              setSelectedUser(null);
              activeHook.refetch();
            }
            return ok;
          } catch {
            return false;
          }
        }}
      />

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </DashboardLayout>
  );
}
