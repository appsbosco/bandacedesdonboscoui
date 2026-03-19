import React, { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { MY_DOCUMENTS, ALL_DOCUMENTS } from "../../graphql/documents/documents.gql.js";
import { DocumentList } from "../../components/documents/DocumentList";
import { DocumentFilters } from "../../components/documents/DocumentsFilters.jsx";
import { GET_USERS_BY_ID } from "graphql/queries";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Card from "@mui/material/Card";
import SoftBox from "components/SoftBox";
import PropTypes from "prop-types";

function mergeDocumentsResult(previousResult, fetchMoreResult, resultKey) {
  if (!fetchMoreResult?.[resultKey]) return previousResult;

  const previousDocuments = previousResult?.[resultKey]?.documents || [];
  const nextDocuments = fetchMoreResult[resultKey].documents || [];
  const seen = new Set(previousDocuments.map((doc) => doc.id || doc._id));
  const mergedDocuments = [...previousDocuments];

  nextDocuments.forEach((doc) => {
    const docId = doc.id || doc._id;
    if (seen.has(docId)) return;
    seen.add(docId);
    mergedDocuments.push(doc);
  });

  return {
    ...fetchMoreResult,
    [resultKey]: {
      ...fetchMoreResult[resultKey],
      documents: mergedDocuments,
    },
  };
}

function isAdmin(user) {
  if (!user) return false;

  return user.role === "Admin" || user?.roles?.includes("Admin");
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
function TabButton({ active, onClick, children, count }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all
        ${
          active
            ? "bg-slate-900 text-white shadow-sm"
            : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
        }
      `}
    >
      {children}
      {count != null && (
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-bold
          ${active ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"}`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

TabButton.propTypes = {
  active: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  count: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

// ── Vista "Mis documentos" ─────────────────────────────────────────────────────
function MyDocumentsView() {
  const [filters, setFilters] = useState({});
  const [pagination, setPagination] = useState({ limit: 20, skip: 0 });

  const { data, loading, error, fetchMore } = useQuery(MY_DOCUMENTS, {
    variables: {
      filters: Object.keys(filters).length > 0 ? filters : undefined,
      pagination,
    },
    fetchPolicy: "cache-and-network",
  });

  const documents = data?.myDocuments?.documents || [];
  const paginationInfo = data?.myDocuments?.pagination;
  const hasMore = paginationInfo?.hasMore || false;

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
    setPagination({ limit: 20, skip: 0 });
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!hasMore) return;
    fetchMore({
      variables: {
        filters: Object.keys(filters).length > 0 ? filters : undefined,
        pagination: { limit: 20, skip: documents.length },
      },
      updateQuery: (previousResult, { fetchMoreResult }) =>
        mergeDocumentsResult(previousResult, fetchMoreResult, "myDocuments"),
    });
  }, [hasMore, documents.length, fetchMore, filters]);

  return (
    <div className="space-y-4">
      <DocumentFilters filters={filters} onFilterChange={handleFilterChange} />
      <DocumentList
        documents={documents}
        loading={loading}
        error={error}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        loadingMore={loading && documents.length > 0}
        emptyMessage="Aún no tienes documentos"
      />
    </div>
  );
}

// ── Vista "Todos los documentos" (Admin) ──────────────────────────────────────
const STATUS_OPTIONS = [
  { value: "", label: "Todos los estados" },
  { value: "UPLOADED", label: "Subido" },
  { value: "CAPTURE_ACCEPTED", label: "Captura aceptada" },
  { value: "OCR_PENDING", label: "OCR pendiente" },
  { value: "OCR_PROCESSING", label: "OCR procesando" },
  { value: "OCR_SUCCESS", label: "OCR exitoso" },
  { value: "OCR_FAILED", label: "OCR fallido" },
  { value: "VERIFIED", label: "Verificado" },
  { value: "REJECTED", label: "Rechazado" },
];

const TYPE_OPTIONS = [
  { value: "", label: "Todos los tipos" },
  { value: "PASSPORT", label: "Pasaporte" },
  { value: "VISA", label: "Visa" },
  { value: "PERMISO_SALIDA", label: "Permiso de salida" },
  { value: "OTHER", label: "Otro" },
];

function AdminDocumentsView() {
  const [pagination, setPagination] = useState({ limit: 20, skip: 0 });
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerInput, setOwnerInput] = useState("");

  const buildFilters = useCallback((overrides = {}) => {
    const f = {};
    const nextStatus = overrides.statusFilter ?? statusFilter;
    const nextType = overrides.typeFilter ?? typeFilter;
    const nextOwnerName = overrides.ownerName ?? ownerName;

    if (nextStatus) f.status = nextStatus;
    if (nextType) f.type = nextType;
    if (nextOwnerName) f.ownerName = nextOwnerName;
    return Object.keys(f).length > 0 ? f : undefined;
  }, [statusFilter, typeFilter, ownerName]);

  const { data, loading, error, fetchMore, refetch } = useQuery(ALL_DOCUMENTS, {
    variables: { filters: buildFilters(), pagination },
    fetchPolicy: "cache-and-network",
  });

  const documents = data?.allDocuments?.documents || [];
  const paginationInfo = data?.allDocuments?.pagination;
  const hasMore = paginationInfo?.hasMore || false;
  const total = paginationInfo?.total ?? 0;

  const applyFilters = useCallback(() => {
    setPagination({ limit: 20, skip: 0 });
    refetch({ filters: buildFilters(), pagination: { limit: 20, skip: 0 } });
  }, [buildFilters, refetch]);

  const handleLoadMore = useCallback(() => {
    if (!hasMore) return;
    fetchMore({
      variables: {
        filters: buildFilters(),
        pagination: { limit: 20, skip: documents.length },
      },
      updateQuery: (previousResult, { fetchMoreResult }) =>
        mergeDocumentsResult(previousResult, fetchMoreResult, "allDocuments"),
    });
  }, [hasMore, documents.length, fetchMore, statusFilter, typeFilter, ownerName]);

  const handleOwnerSearch = (e) => {
    e.preventDefault();
    const trimmedOwnerName = ownerInput.trim();
    setOwnerName(trimmedOwnerName);
    setPagination({ limit: 20, skip: 0 });
    refetch({
      filters: buildFilters({ ownerName: trimmedOwnerName }),
      pagination: { limit: 20, skip: 0 },
    });
  };

  const clearFilters = () => {
    setStatusFilter("");
    setTypeFilter("");
    setOwnerName("");
    setOwnerInput("");
    setPagination({ limit: 20, skip: 0 });
    refetch({ filters: undefined, pagination: { limit: 20, skip: 0 } });
  };

  const hasActiveFilters = statusFilter || typeFilter || ownerName;

  return (
    <div className="space-y-4">
      {/* Filtros admin */}
      <div className="bg-white rounded-2xl ring-1 ring-slate-200 shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">Filtros</span>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Status */}
          <div>
            <label className="block text-xs text-slate-500 mb-1 font-medium">Estado</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
              }}
              onBlur={applyFilters}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400 text-slate-700"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs text-slate-500 mb-1 font-medium">Tipo</label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
              }}
              onBlur={applyFilters}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400 text-slate-700"
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Owner ID search */}
        <div>
          <label className="block text-xs text-slate-500 mb-1 font-medium">
            Filtrar por nombre de usuario
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={ownerInput}
              onChange={(e) => setOwnerInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleOwnerSearch(e)}
              placeholder="Nombre o apellido.."
              className="flex-1 text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400 text-slate-700 font-mono"
            />
            <button
              onClick={handleOwnerSearch}
              className="px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition-colors"
            >
              Buscar
            </button>
          </div>
          {ownerName && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="text-xs text-slate-400">Filtrando por:</span>
              <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded-lg text-slate-600">
                {ownerName}
              </span>
              <button
                onClick={() => {
                  setOwnerName("");
                  setOwnerInput("");
                  setPagination({ limit: 20, skip: 0 });
                  refetch({
                    filters: buildFilters({ ownerName: "" }),
                    pagination: { limit: 20, skip: 0 },
                  });
                }}
                className="text-xs text-red-400 hover:text-red-600"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Contador */}
      {!loading && (
        <div className="flex items-center gap-2 px-1">
          <span className="text-sm text-slate-500">
            {total} documento{total !== 1 ? "s" : ""} encontrado{total !== 1 ? "s" : ""}
          </span>
          {hasActiveFilters && (
            <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full ring-1 ring-amber-200 font-medium">
              Filtros activos
            </span>
          )}
        </div>
      )}

      <DocumentList
        documents={documents}
        loading={loading}
        error={error}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        loadingMore={loading && documents.length > 0}
        emptyMessage="No se encontraron documentos"
        showOwner // prop para que DocumentList muestre el owner en cada card
      />
    </div>
  );
}

// ── Page principal ─────────────────────────────────────────────────────────────
function DocumentsPage() {
  const { data: userData, loading: userLoading } = useQuery(GET_USERS_BY_ID);

  const userRole = userData?.getUser?.role;

  const userIsAdmin = isAdmin({ role: userRole });
  const [activeTab, setActiveTab] = useState("mine");

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <Card>
        <SoftBox p={2}>
          <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-slate-200">
              <div className="max-w-lg mx-auto px-4 py-4">
                <div className="flex items-center justify-between mb-3">
                  <h1 className="text-xl font-semibold text-slate-900">Documentos</h1>
                  {userIsAdmin && (
                    <span className="text-xs px-2.5 py-1 bg-violet-100 text-violet-700 rounded-full ring-1 ring-violet-200 font-semibold">
                      Admin
                    </span>
                  )}
                </div>

                <p className="text-sm text-slate-500 mb-4">
                  Filtra, revisa y escanea nuevos documentos
                </p>

                {/* Tabs — solo visibles para admin */}
                {userIsAdmin && (
                  <div className="flex gap-2 p-1 bg-slate-100 rounded-full w-fit">
                    <TabButton active={activeTab === "mine"} onClick={() => setActiveTab("mine")}>
                      Mis documentos
                    </TabButton>
                    <TabButton active={activeTab === "all"} onClick={() => setActiveTab("all")}>
                      Todos
                    </TabButton>
                  </div>
                )}
              </div>
            </header>

            {/* Content */}
            <main className="max-w-lg mx-auto px-4 py-6">
              {(!userIsAdmin || activeTab === "mine") && <MyDocumentsView />}
              {userIsAdmin && activeTab === "all" && <AdminDocumentsView />}
            </main>

            {/* FAB */}
            <Link
              to="/documents/new"
              className="
                fixed bottom-6 right-6 z-[1200]
                w-14 h-14 rounded-full
                bg-primary-600 hover:bg-primary-500
                text-white
                shadow-xl shadow-primary-200/60
                flex items-center justify-center
                transition-all duration-200 hover:scale-105
                focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-2
              "
              aria-label="Escanear documento"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </Link>
          </div>
        </SoftBox>
      </Card>
    </DashboardLayout>
  );
}

export default DocumentsPage;
