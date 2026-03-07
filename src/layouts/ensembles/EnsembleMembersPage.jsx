/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import MembersTable from "components/ui/MembersTable";
import BulkAssignModal from "./BulkAssignModal";
import { useMembersPaginated, useEnsemblesRef, useEnsemblesDashboard } from "./useEnsembles";

// ── Toast ───────────────────────────────────────────────────────────────────
function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  if (!toast) return null;
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[1200] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold text-white transition-all ${
        toast.type === "error" ? "bg-red-600" : "bg-gray-900"
      }`}
    >
      <span>{toast.message}</span>
      <button onClick={onDismiss} className="opacity-60 hover:opacity-100 text-base leading-none">
        ✕
      </button>
    </div>
  );
}

// ── Filter bar ──────────────────────────────────────────────────────────────
function FilterBar({ filter, facets, setSearchText, setFilterField, clearFilters }) {
  const [inputValue, setInputValue] = useState(filter.searchText || "");
  const debounceRef = useRef(null);

  const handleSearch = (e) => {
    const val = e.target.value;
    setInputValue(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearchText(val), 300);
  };

  const hasActiveFilters =
    filter.searchText || filter.state || filter.role || filter.instrument;

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* Search */}
      <div className="relative flex-1 min-w-48">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">⌕</span>
        <input
          type="text"
          value={inputValue}
          onChange={handleSearch}
          placeholder="Buscar por nombre, email…"
          className="w-full pl-7 pr-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-gray-300"
        />
      </div>

      {/* State filter */}
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

      {/* Role filter */}
      <select
        value={filter.role || ""}
        onChange={(e) => setFilterField("role", e.target.value)}
        className="py-2 px-3 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-gray-300"
      >
        <option value="">Rol</option>
        {(facets.byRole || []).map((f) => (
          <option key={f.value} value={f.value}>
            {f.value} ({f.count})
          </option>
        ))}
      </select>

      {/* Instrument filter */}
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

      {hasActiveFilters && (
        <button
          onClick={() => {
            setInputValue("");
            clearFilters();
          }}
          className="py-2 px-3 rounded-xl border border-red-100 bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-all"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function EnsembleMembersPage() {
  const { key: ensembleKey } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const allEnsembles = useEnsemblesRef();
  const { ensembles: ensembleList } = useEnsemblesDashboard();

  // Find current ensemble meta for page header
  const currentEnsemble = ensembleList.find((e) => e.key === ensembleKey) || null;

  const {
    items, total, facets, loading,
    filter, pagination, setPagination,
    setSearchText, setFilterField, clearFilters,
    selectedIds, toggleSelect, selectAll, clearSelection,
    bulkModal, setBulkModal, handleBulkApply,
    adding, removing,
    toast, setToast,
  } = useMembersPaginated({
    queryType: "ensemble",
    ensembleKey,
  });

  // Open assign modal when ?assign=1 is present in URL
  useEffect(() => {
    if (searchParams.get("assign") === "1") {
      setBulkModal({ open: true, mode: "add" });
    }
  }, [searchParams, setBulkModal]);

  const applying = adding || removing;

  const bulkActions = (
    <div className="flex gap-2">
      <button
        onClick={() => setBulkModal({ open: true, mode: "add" })}
        className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-all"
      >
        Agregar a agrupación
      </button>
      <button
        onClick={() => setBulkModal({ open: true, mode: "remove" })}
        className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition-all"
      >
        Remover de agrupación
      </button>
    </div>
  );

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <div className="px-4 pb-10 pt-2 space-y-5 max-w-screen-xl">
        {/* Breadcrumb + header */}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <button
            onClick={() => navigate("/ensembles")}
            className="hover:text-gray-700 transition-colors"
          >
            Agrupaciones
          </button>
          <span>›</span>
          <span className="text-gray-700 font-semibold">
            {currentEnsemble?.name || ensembleKey}
          </span>
        </div>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {currentEnsemble?.name || ensembleKey}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {total} miembro{total !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => setBulkModal({ open: true, mode: "add" })}
            className="px-4 py-2 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-gray-700 transition-all"
          >
            + Asignar miembros
          </button>
        </div>

        {/* Filters */}
        <FilterBar
          filter={filter}
          facets={facets}
          setSearchText={setSearchText}
          setFilterField={setFilterField}
          clearFilters={clearFilters}
        />

        {/* Table */}
        <MembersTable
          items={items}
          total={total}
          page={pagination.page}
          limit={pagination.limit}
          loading={loading}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onSelectAll={selectAll}
          onClearSelection={clearSelection}
          onPageChange={(p) => setPagination((prev) => ({ ...prev, page: p }))}
          bulkActions={bulkActions}
        />
      </div>
      <Footer />

      {/* Bulk assign / remove modal */}
      <BulkAssignModal
        isOpen={bulkModal.open}
        mode={bulkModal.mode}
        selectedCount={selectedIds.size}
        ensembles={allEnsembles}
        onClose={() => setBulkModal({ open: false, mode: "add" })}
        onApply={handleBulkApply}
        applying={applying}
        result={null}
        onClearResult={() => {}}
      />

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </DashboardLayout>
  );
}
