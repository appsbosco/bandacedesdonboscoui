import React, { useState } from "react";
import { useQuery } from "@apollo/client";
import { useNavigate } from "react-router-dom";
import { MY_DOCUMENTS } from "../../graphql/documents.gql";
import { ExpirationSummaryCards } from "./ExpirationSummaryCards";
import { DocumentsFilters } from "./DocumentsFilters";
import { DocumentsTable } from "./DocumentsTable";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";
import { TableSkeleton } from "../ui/Skeleton";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import SoftBox from "components/SoftBox";

export function DocumentsDashboard() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({});
  const [pagination, setPagination] = useState({ limit: 20, skip: 0 });

  const { data, loading, error, fetchMore } = useQuery(MY_DOCUMENTS, {
    variables: { filters, pagination },
    fetchPolicy: "cache-and-network",
  });

  const documents = data?.myDocuments?.documents || [];
  const paginationInfo = data?.myDocuments?.pagination;

  const handleLoadMore = () => {
    fetchMore({
      variables: {
        pagination: {
          limit: pagination.limit,
          skip: pagination.skip + pagination.limit,
        },
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;

        return {
          myDocuments: {
            ...fetchMoreResult.myDocuments,
            documents: [...prev.myDocuments.documents, ...fetchMoreResult.myDocuments.documents],
          },
        };
      },
    });

    setPagination((prev) => ({
      ...prev,
      skip: prev.skip + prev.limit,
    }));
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error cargando documentos: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Document Vault</h1>
              <p className="text-gray-600 mt-1">
                Administra tus pasaportes y visas de forma segura
              </p>
            </div>
            <Button
              onClick={() => navigate("/documents/new")}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              }
            >
              Agregar Documento
            </Button>
          </div>

          {/* Summary Cards */}
          <ExpirationSummaryCards />

          {/* Filters */}
          <DocumentsFilters
            filters={filters}
            onFiltersChange={(newFilters) => {
              setFilters(newFilters);
              setPagination({ limit: 20, skip: 0 });
            }}
          />

          {/* Documents List/Table */}
          {loading && !data ? (
            <div className="bg-white rounded-lg shadow p-6">
              <TableSkeleton rows={5} columns={5} />
            </div>
          ) : documents.length === 0 ? (
            <EmptyState
              icon="📄"
              title="No tienes documentos"
              description="Comienza agregando tu primer pasaporte o visa para mantener un registro seguro y organizado."
              action
              actionLabel="Agregar Documento"
              onAction={() => navigate("/documents/new")}
            />
          ) : (
            <>
              <DocumentsTable documents={documents} loading={loading} />

              {/* Pagination */}
              {paginationInfo?.hasMore && (
                <div className="mt-6 text-center">
                  <Button variant="secondary" onClick={handleLoadMore} loading={loading}>
                    Cargar Más
                  </Button>
                  <p className="text-sm text-gray-500 mt-2">
                    Mostrando {documents.length} de {paginationInfo.total} documentos
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </SoftBox>
    </DashboardLayout>
  );
}
