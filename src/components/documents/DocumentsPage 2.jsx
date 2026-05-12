import React, { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { MY_DOCUMENTS } from "../../graphql/documents/documents.gql.js";
import { DocumentList } from "../../components/documents/DocumentList";
import { DocumentFilters } from "../../components/documents/DocumentsFilters.jsx";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Card from "@mui/material/Card";
import SoftBox from "components/SoftBox";

/**
 * DocumentsPage - Light UI
 */
function DocumentsPage() {
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
        pagination: {
          limit: 20,
          skip: documents.length,
        },
      },
    });
  }, [hasMore, documents.length, fetchMore]);

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <Card className="text">
        <SoftBox p={2}>
          {/* Page wrapper */}
          <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-slate-200">
              <div className="max-w-lg mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                  <h1 className="text-xl font-semibold text-slate-900 my-auto">Mis Documentos</h1>

                  {paginationInfo?.total > 0 && (
                    <span className="px-4 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full ring-1 ring-slate-200">
                      {paginationInfo.total} documento{paginationInfo.total !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {/* Subtitulo */}
                <p className="text-sm text-slate-500 mt-3">
                  Filtra, revisa y escanea nuevos documentos
                </p>
              </div>
            </header>

            {/* Content */}
            <main className="max-w-lg mx-auto px-4 py-6">
              {/* Filters card */}
              <div className="rounded-3xlp-4 mb-4">
                <DocumentFilters filters={filters} onFilterChange={handleFilterChange} />
              </div>

              {/* List card */}
              <div className="rounded-3xl ">
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
            </main>

            {/* FAB */}
            <Link
              to="/documents/new"
              className="
                fixed bottom-6 right-6 z-50
                w-14 h-14 rounded-full
                bg-primary-600 hover:bg-primary-500
                text-white
                shadow-xl shadow-primary-200/60
                flex items-center justify-center
                transition-all duration-200 hover:scale-105
                focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-2
              "
              aria-label="Escanear documento"
              title="Escanear documento"
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

            {/* Tooltip simple (mejor accesibilidad que opacity hover en div pointer-events-none) */}
            <div className="fixed bottom-6 right-24 z-50 hidden sm:block">
              <div className="px-3 py-1.5 bg-slate-900 text-white text-sm rounded-xl shadow-lg opacity-0 hover:opacity-100 transition-opacity">
                Escanear documento
              </div>
            </div>
          </div>
        </SoftBox>
      </Card>
    </DashboardLayout>
  );
}

export default DocumentsPage;
