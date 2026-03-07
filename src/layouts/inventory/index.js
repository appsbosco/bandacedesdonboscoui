/* eslint-disable react/prop-types */
import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@apollo/client";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { useInventoriesPaginated, useInventoryStats, useAdminCleanup } from "./useInventory";
import InventoryDrawer from "./InventoryDrawer";
import { ASSIGN_INVENTORY_TO_USER, UNASSIGN_INVENTORY, USERS_SEARCH } from "./inventory.gql.js";

// ── Shared helpers ────────────────────────────────────────────────────────────

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

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fullName(user) {
  if (!user) return "—";
  return [user.name, user.firstSurName, user.secondSurName].filter(Boolean).join(" ");
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [message, onClose]);
  return (
    <div
      className={[
        "fixed bottom-5 right-5 z-[1350] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium",
        type === "error" ? "bg-red-600" : "bg-slate-900",
      ].join(" ")}
    >
      <span>{message}</span>
      <button onClick={onClose} className="opacity-70 hover:opacity-100 text-lg leading-none">
        &times;
      </button>
    </div>
  );
}

// ── Assign modal ──────────────────────────────────────────────────────────────

function AssignModal({ inventoryId, currentUser, onClose, onDone }) {
  const [search, setSearch] = useState("");
  const [debouncedQ, setQ] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState(null);
  const timer = useRef(null);

  const handleSearch = (val) => {
    setSearch(val);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setQ(val), 300);
  };

  const { data, loading } = useQuery(USERS_SEARCH, {
    variables: { filter: { searchText: debouncedQ || undefined }, pagination: { limit: 20 } },
    fetchPolicy: "cache-and-network",
  });

  const users = data?.usersPaginated?.items || [];

  const [assign, { loading: assigning }] = useMutation(ASSIGN_INVENTORY_TO_USER, {
    onCompleted: () => {
      onDone("Instrumento asignado correctamente");
      onClose();
    },
    onError: (e) => setError(e.message),
  });

  const handleAssign = () => {
    if (!selectedId) return;
    setError(null);
    assign({ variables: { inventoryId, userId: selectedId } });
  };

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              {currentUser ? "Cambiar asignación" : "Asignar instrumento"}
            </h3>
            {currentUser && (
              <p className="text-xs text-slate-500 mt-0.5">Asignado a: {fullName(currentUser)}</p>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-6 pt-4 pb-2 flex-shrink-0">
          <div className="relative">
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
              autoFocus
              type="text"
              placeholder="Buscar por nombre, carnet…"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 transition"
            />
          </div>
        </div>

        {/* User list */}
        <div className="flex-1 overflow-y-auto px-4 pb-2">
          {loading ? (
            <div className="space-y-2 py-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-8">Sin resultados</p>
          ) : (
            <div className="space-y-1 py-2">
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setSelectedId(u.id === selectedId ? null : u.id)}
                  className={[
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition",
                    selectedId === u.id
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-transparent hover:bg-slate-50 hover:border-slate-200",
                  ].join(" ")}
                >
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">
                    {(u.name || u.firstSurName || "?")[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div
                      className={`text-sm font-medium truncate ${
                        selectedId === u.id ? "text-white" : "text-slate-800"
                      }`}
                    >
                      {fullName(u)}
                    </div>
                    <div
                      className={`text-xs truncate ${
                        selectedId === u.id ? "text-slate-300" : "text-slate-500"
                      }`}
                    >
                      {u.carnet && `${u.carnet} · `}
                      {u.role}
                      {u.instrument && ` · ${u.instrument}`}
                    </div>
                  </div>
                  {selectedId === u.id && (
                    <svg
                      className="w-4 h-4 text-white ml-auto flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mb-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex-shrink-0">
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            Cancelar
          </button>
          <button
            disabled={!selectedId || assigning}
            onClick={handleAssign}
            className="px-5 py-2 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-40 transition"
          >
            {assigning ? "Asignando…" : "Asignar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Cleanup modal ─────────────────────────────────────────────────────────────

function CleanupModal({ onClose, onDone }) {
  const { dryRun, execute, loading } = useAdminCleanup();
  const [preview, setPreview] = useState(null);
  const [step, setStep] = useState("idle"); // idle | confirming | done

  useEffect(() => {
    dryRun().then((res) => {
      setPreview(res);
      setStep(res.count === 0 ? "done" : "confirming");
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleExecute = async () => {
    const res = await execute();
    setPreview(res);
    setStep("done");
    onDone(res.message);
  };

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-amber-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-slate-900">Limpiar registros inválidos</h3>
          </div>

          {loading && !preview && <p className="text-sm text-slate-500">Analizando registros…</p>}

          {preview && step === "confirming" && (
            <p className="text-sm text-slate-700">
              Se encontraron <strong className="text-red-600">{preview.count}</strong> registro(s)
              sin usuario asignado. ¿Confirma la eliminación permanente?
            </p>
          )}

          {preview && step === "done" && (
            <p className="text-sm text-slate-700">
              {preview.count === 0
                ? "No se encontraron registros inválidos. La base de datos está limpia."
                : preview.message}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            {step === "done" ? "Cerrar" : "Cancelar"}
          </button>
          {step === "confirming" && (
            <button
              disabled={loading}
              onClick={handleExecute}
              className="px-5 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-40 transition"
            >
              {loading ? "Eliminando…" : "Eliminar"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Unassign confirm ──────────────────────────────────────────────────────────

function UnassignConfirm({ item, onClose, onDone }) {
  const [unassign, { loading }] = useMutation(UNASSIGN_INVENTORY, {
    onCompleted: () => {
      onDone("Instrumento eliminado del inventario");
      onClose();
    },
    onError: (e) => onDone(e.message, "error"),
  });

  const user = item.user || {};
  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-slate-900">Desasignar instrumento</h3>
          </div>
          <p className="text-sm text-slate-600">
            Esto eliminará el registro de{" "}
            <strong>
              {item.brand} {item.model}
            </strong>
            {user.id && (
              <>
                {" "}
                asignado a <strong>{fullName(user)}</strong>
              </>
            )}{" "}
            del inventario.
          </p>
          <p className="text-xs text-red-600 mt-2">Esta acción no se puede deshacer.</p>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            Cancelar
          </button>
          <button
            disabled={loading}
            onClick={() => unassign({ variables: { inventoryId: item.id } })}
            className="px-5 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-40 transition"
          >
            {loading ? "Eliminando…" : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
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

// ── Skeleton row ──────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-100">
      {[140, 120, 100, 80, 160, 90, 80].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3.5 bg-slate-100 rounded animate-pulse" style={{ width: w }} />
        </td>
      ))}
    </tr>
  );
}

// ── Filter bar ────────────────────────────────────────────────────────────────

function FilterBar({ filter, setSearchText, setFilterField, clearFilters, conditionOptions }) {
  const [inputVal, setInputVal] = useState("");
  const timer = useRef(null);

  const handleSearchChange = (val) => {
    setInputVal(val);

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setSearchText(val); // IMPORTANT: aquí sí dispara refetch
    }, 350);
  };

  const hasFilters = Boolean(inputVal || filter.condition || filter.status);

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
          placeholder="Buscar marca, modelo, serie, placa, usuario…"
          value={inputVal}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 placeholder-slate-400 transition"
        />
      </div>

      <select
        value={filter.condition || ""}
        onChange={(e) => setFilterField("condition", e.target.value)}
        className="py-2 pl-3 pr-8 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20 transition appearance-none cursor-pointer"
      >
        <option value="">Todas las tenencias</option>
        {(conditionOptions?.length
          ? conditionOptions
          : [{ value: "Propio" }, { value: "Institucional" }]
        ).map(({ value }) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>

      <select
        value={filter.status || ""}
        onChange={(e) => setFilterField("status", e.target.value)}
        className="py-2 pl-3 pr-8 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20 transition appearance-none cursor-pointer"
      >
        <option value="">Todos los estados mant.</option>
        <option value="ON_TIME">Al día</option>
        <option value="DUE_SOON">Por vencer</option>
        <option value="OVERDUE">Vencido</option>
        <option value="NOT_APPLICABLE">N/A</option>
      </select>

      {hasFilters && (
        <button
          onClick={() => {
            if (timer.current) clearTimeout(timer.current);
            setInputVal("");
            clearFilters();
            setSearchText(""); // <- para asegurar que backend quede limpio ya
          }}
          className="px-3 py-2 text-sm text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
        >
          Limpiar
        </button>
      )}
    </div>
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
  const [assignTarget, setAssignTarget] = useState(null); // { id, user } for modal
  const [unassignTarget, setUnassignTarget] = useState(null); // item for unassign confirm
  const [showCleanup, setShowCleanup] = useState(false);
  const [activeStatFilter, setActiveStatFilter] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => setToast({ message, type }), []);

  const {
    items,
    total,
    totalPages,
    loading,
    filter,
    pagination,
    setPagination,
    facets,
    setSearchText,
    setFilterField,
    clearFilters,
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

  // Called by the drawer after maintenance saves — keep drawer open
  function handleDrawerMutationDone(message, type = "success") {
    showToast(message, type);
    refetch();
    statsHook.refetch();
  }

  function handleMutationDone(message, type = "success") {
    showToast(message, type);
    refetch();
    statsHook.refetch();
    setSelectedItem(null);
  }

  const conditionOptions = facets.byCondition || [];

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <div className="px-4 pb-10 pt-2 min-h-screen bg-slate-50">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Instrumentos</h1>
            <p className="text-sm text-slate-500 mt-0.5">Inventario de instrumentos y equipos</p>
          </div>
          <button
            onClick={() => setShowCleanup(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Limpiar registros inválidos
          </button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatsCard
            label="Total"
            value={stats.total}
            colorClass="text-slate-900"
            loading={statsHook.loading}
            onClick={() => {
              setActiveStatFilter(null);
              setFilterField("status", "");
            }}
            active={false}
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
            label="Por vencer (30d)"
            value={stats.dueSoon}
            colorClass="text-amber-600"
            loading={statsHook.loading}
            onClick={() => handleStatClick("DUE_SOON")}
            active={activeStatFilter === "DUE_SOON"}
          />
          <StatsCard
            label="Mant. vencido"
            value={stats.overdue}
            colorClass="text-red-600"
            loading={statsHook.loading}
            onClick={() => handleStatClick("OVERDUE")}
            active={activeStatFilter === "OVERDUE"}
          />
        </div>

        {/* Table card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <FilterBar
              filter={filter}
              setSearchText={setSearchText}
              setFilterField={setFilterField}
              clearFilters={clearFilters}
              conditionOptions={conditionOptions}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {[
                    "Instrumento",
                    "Marca / Modelo",
                    "Serie / Placa",
                    "Tenencia",
                    "Usuario asignado",
                    "Estado mant.",
                    "Acciones",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && items.length === 0 ? (
                  Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-slate-400 text-sm">
                      Sin instrumentos para los filtros seleccionados
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const user = item.user || null;
                    const status = item.status || "NOT_APPLICABLE";
                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className={[
                          "border-b border-slate-100 cursor-pointer transition-colors",
                          selectedItem?.id === item.id ? "bg-slate-900/5" : "hover:bg-slate-50/80",
                        ].join(" ")}
                      >
                        {/* Instrumento */}
                        <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                          {item.instrumentType || user?.instrument || "—"}
                        </td>

                        {/* Marca / Modelo */}
                        <td className="px-4 py-3">
                          <div className="text-slate-800">{item.brand || "—"}</div>
                          {item.model && <div className="text-xs text-slate-400">{item.model}</div>}
                        </td>

                        {/* Serie / Placa */}
                        <td className="px-4 py-3 text-slate-600 text-xs">
                          {item.serie && <div>{item.serie}</div>}
                          {item.numberId && <div className="text-slate-400">{item.numberId}</div>}
                          {!item.serie && !item.numberId && "—"}
                        </td>

                        {/* Tenencia (condition) */}
                        <td className="px-4 py-3">
                          {item.condition ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 ring-1 ring-slate-200">
                              {item.condition}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>

                        {/* Usuario asignado */}
                        <td className="px-4 py-3">
                          {user ? (
                            <div>
                              <div className="text-slate-800 font-medium">{fullName(user)}</div>
                              <div className="text-xs text-slate-400 mt-0.5">
                                {user.carnet && `${user.carnet} · `}
                                {user.role}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-red-500 italic">Sin asignar</span>
                          )}
                        </td>

                        {/* Estado mantenimiento */}
                        <td className="px-4 py-3">
                          <div>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_PILL[status]}`}
                            >
                              {STATUS_LABEL[status]}
                            </span>
                            {item.nextMaintenanceDueAt && (
                              <div className="text-xs text-slate-400 mt-0.5">
                                {formatDate(item.nextMaintenanceDueAt)}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setAssignTarget({ id: item.id, user: item.user })}
                              className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition whitespace-nowrap"
                            >
                              {item.user ? "Cambiar" : "Asignar"}
                            </button>
                            {item.user && (
                              <button
                                onClick={() => setUnassignTarget(item)}
                                className="px-2.5 py-1 text-xs font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition whitespace-nowrap"
                              >
                                Desasignar
                              </button>
                            )}
                          </div>
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

      {/* Detail drawer (maintenance timeline) */}
      {selectedItem && (
        <InventoryDrawer
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onMutationDone={handleDrawerMutationDone}
        />
      )}

      {/* Assign/reassign modal */}
      {assignTarget && (
        <AssignModal
          inventoryId={assignTarget.id}
          currentUser={assignTarget.user}
          onClose={() => setAssignTarget(null)}
          onDone={(msg) => {
            handleMutationDone(msg);
            setAssignTarget(null);
          }}
        />
      )}

      {/* Unassign (delete) confirm */}
      {unassignTarget && (
        <UnassignConfirm
          item={unassignTarget}
          onClose={() => setUnassignTarget(null)}
          onDone={(msg, type) => {
            handleMutationDone(msg, type);
            setUnassignTarget(null);
          }}
        />
      )}

      {/* Admin cleanup modal */}
      {showCleanup && (
        <CleanupModal
          onClose={() => setShowCleanup(false)}
          onDone={(msg) => {
            showToast(msg);
            refetch();
            statsHook.refetch();
            setShowCleanup(false);
          }}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <Footer />
    </DashboardLayout>
  );
};

export default InventoryPage;
