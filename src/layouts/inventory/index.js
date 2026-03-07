/* eslint-disable react/prop-types */

import { useState, useEffect } from "react";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { useInventoriesPaginated, useInventoryStats } from "./useInventory";

function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);
  if (!toast) return null;
  return (
    <div
      className={[
        "fixed bottom-5 right-5 z-[1350] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium",
        toast.type === "error" ? "bg-red-600" : "bg-slate-900",
      ].join(" ")}
    >
      <span>{toast.message}</span>
      <button onClick={onDismiss} className="opacity-70 hover:opacity-100 text-lg leading-none">
        &times;
      </button>
    </div>
  );
}
import InventoryDrawer from "./InventoryDrawer";

// ── Status helpers ────────────────────────────────────────────────────────────

const STATUS_LABEL = {
  ON_TIME: "Al día",
  DUE_SOON: "Por vencer",
  OVERDUE: "Vencido",
  NOT_APPLICABLE: "N/A",
};

const STATUS_PILL = {
  ON_TIME: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  DUE_SOON: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  OVERDUE: "bg-red-50 text-red-700 ring-1 ring-red-200",
  NOT_APPLICABLE: "bg-slate-100 text-slate-500 ring-1 ring-slate-200",
};

const OWNERSHIP_LABEL = {
  PERSONAL: "Personal",
  INSTITUTIONAL: "Institucional",
  BORROWED: "Préstamo",
};

const OWNERSHIP_PILL = {
  PERSONAL: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
  INSTITUTIONAL: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
  BORROWED: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
};

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ── Stats card ────────────────────────────────────────────────────────────────

function StatsCard({ label, value, colorClass, loading, onClick, active }) {
  return (
    <button
      onClick={onClick}
      className={[
        "flex flex-col gap-1 px-5 py-4 rounded-xl border transition-all text-left w-full",
        active
          ? "border-slate-900 bg-slate-900 text-white shadow-lg"
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm",
      ].join(" ")}
    >
      <span className={`text-2xl font-bold tabular-nums ${active ? "text-white" : colorClass}`}>
        {loading ? "…" : value}
      </span>
      <span className={`text-xs font-medium ${active ? "text-slate-300" : "text-slate-500"}`}>
        {label}
      </span>
    </button>
  );
}

// ── Filter bar ────────────────────────────────────────────────────────────────

function FilterBar({ filter, setSearchText, setFilterField, clearFilters }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Buscar por marca, modelo, serie…"
          defaultValue={filter.searchText || ""}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 placeholder-slate-400 transition"
        />
      </div>

      <select
        value={filter.ownership || ""}
        onChange={(e) => setFilterField("ownership", e.target.value)}
        className="py-2 pl-3 pr-8 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20 transition appearance-none cursor-pointer"
      >
        <option value="">Todas las tenencias</option>
        <option value="PERSONAL">Personal</option>
        <option value="INSTITUTIONAL">Institucional</option>
        <option value="BORROWED">Préstamo</option>
      </select>

      <select
        value={filter.status || ""}
        onChange={(e) => setFilterField("status", e.target.value)}
        className="py-2 pl-3 pr-8 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20 transition appearance-none cursor-pointer"
      >
        <option value="">Todos los estados</option>
        <option value="ON_TIME">Al día</option>
        <option value="DUE_SOON">Por vencer</option>
        <option value="OVERDUE">Vencido</option>
        <option value="NOT_APPLICABLE">N/A</option>
      </select>

      {(filter.searchText || filter.ownership || filter.status) && (
        <button
          onClick={clearFilters}
          className="px-3 py-2 text-sm text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
        >
          Limpiar
        </button>
      )}
    </div>
  );
}

// ── Skeleton row ──────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-100">
      {[160, 120, 100, 90, 110, 100].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className={`h-3.5 bg-slate-100 rounded animate-pulse`} style={{ width: w }} />
        </td>
      ))}
    </tr>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────

function Pagination({ page, totalPages, total, limit, setPagination }) {
  if (totalPages <= 1) return null;
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-white rounded-b-xl">
      <span className="text-xs text-slate-500">
        {start}–{end} de {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          disabled={page <= 1}
          onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
          className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition"
        >
          ‹ Anterior
        </button>
        <span className="px-3 py-1.5 text-sm text-slate-700 font-medium">
          {page} / {totalPages}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
          className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition"
        >
          Siguiente ›
        </button>
      </div>
      <select
        value={limit}
        onChange={(e) => setPagination((p) => ({ ...p, limit: Number(e.target.value), page: 1 }))}
        className="py-1.5 pl-2 pr-6 text-xs rounded-lg border border-slate-200 bg-white text-slate-600 cursor-pointer appearance-none"
      >
        {[10, 25, 50, 100].map((n) => (
          <option key={n} value={n}>
            {n} / página
          </option>
        ))}
      </select>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const InventoryPage = () => {
  const listHook = useInventoriesPaginated();
  const statsHook = useInventoryStats();
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeStatFilter, setActiveStatFilter] = useState(null);

  const {
    items,
    total,
    totalPages,
    loading,
    filter,
    pagination,
    setPagination,
    setSearchText,
    setFilterField,
    clearFilters,
    toast,
    setToast,
    refetch,
  } = listHook;

  const { stats } = statsHook;

  function handleStatClick(statusKey) {
    if (activeStatFilter === statusKey) {
      setActiveStatFilter(null);
      setFilterField("status", "");
    } else {
      setActiveStatFilter(statusKey);
      setFilterField("status", statusKey);
    }
  }

  function handleRowClick(item) {
    setSelectedItem(item);
  }

  function handleDrawerClose() {
    setSelectedItem(null);
  }

  function handleMutationDone() {
    refetch();
    statsHook.refetch();
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <div className="px-4 pb-10 pt-2 min-h-screen bg-slate-50">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Inventario</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Instrumentos y equipos registrados en el sistema
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatsCard
            label="Total registros"
            value={stats.total}
            colorClass="text-slate-900"
            loading={statsHook.loading}
            onClick={() => handleStatClick(null)}
            active={activeStatFilter === null && false}
          />
          <StatsCard
            label="Al día"
            value={stats.onTime}
            colorClass="text-emerald-600"
            loading={statsHook.loading}
            onClick={() => handleStatClick("ON_TIME")}
            active={activeStatFilter === "ON_TIME"}
          />
          <StatsCard
            label="Por vencer (30 días)"
            value={stats.dueSoon}
            colorClass="text-amber-600"
            loading={statsHook.loading}
            onClick={() => handleStatClick("DUE_SOON")}
            active={activeStatFilter === "DUE_SOON"}
          />
          <StatsCard
            label="Mantenimiento vencido"
            value={stats.overdue}
            colorClass="text-red-600"
            loading={statsHook.loading}
            onClick={() => handleStatClick("OVERDUE")}
            active={activeStatFilter === "OVERDUE"}
          />
        </div>

        {/* Table card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Filter bar */}
          <div className="px-4 py-3 border-b border-slate-100">
            <FilterBar
              filter={filter}
              setSearchText={setSearchText}
              setFilterField={setFilterField}
              clearFilters={clearFilters}
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Integrante
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Instrumento
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Marca / Modelo
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Tenencia
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Próximo mant.
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading && items.length === 0 ? (
                  Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-400 text-sm">
                      Sin registros para los filtros seleccionados
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const user = item.user || {};
                    const fullName = [user.name, user.firstSurName, user.secondSurName]
                      .filter(Boolean)
                      .join(" ");
                    const status = item.status || "NOT_APPLICABLE";
                    const ownership = item.ownership || "PERSONAL";
                    return (
                      <tr
                        key={item.id}
                        onClick={() => handleRowClick(item)}
                        className={[
                          "border-b border-slate-100 cursor-pointer transition-colors",
                          selectedItem?.id === item.id ? "bg-slate-900/5" : "hover:bg-slate-50/80",
                        ].join(" ")}
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800">{fullName || "—"}</div>
                          {user.carnet && (
                            <div className="text-xs text-slate-400 mt-0.5">{user.carnet}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {item.instrumentType || user.instrument || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-slate-800">{item.brand || "—"}</div>
                          {item.model && (
                            <div className="text-xs text-slate-400 mt-0.5">{item.model}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${OWNERSHIP_PILL[ownership]}`}
                          >
                            {OWNERSHIP_LABEL[ownership]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-xs">
                          {formatDate(item.nextMaintenanceDueAt)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_PILL[status]}`}
                          >
                            {STATUS_LABEL[status]}
                          </span>
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
            totalPages={totalPages}
            total={total}
            limit={pagination.limit}
            setPagination={setPagination}
          />
        </div>
      </div>

      {/* Detail drawer */}
      {selectedItem && (
        <InventoryDrawer
          item={selectedItem}
          onClose={handleDrawerClose}
          onMutationDone={handleMutationDone}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <Footer />
    </DashboardLayout>
  );
};

export default InventoryPage;
