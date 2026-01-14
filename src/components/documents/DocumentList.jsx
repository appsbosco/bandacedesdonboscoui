import React from "react";
import PropTypes from "prop-types";
import { DocumentCard } from "./DocumentCard";
import { DocumentListSkeleton } from "../ui/Skeleton";

/**
 * DocumentList - Light UI
 */
export function DocumentList({
  documents,
  loading,
  error,
  hasMore,
  onLoadMore,
  loadingMore,
  emptyMessage = "No hay documentos",
}) {
  // Carga inicial
  if (loading && (!documents || documents.length === 0)) {
    return <DocumentListSkeleton count={5} />;
  }

  // Error
  if (error) {
    return (
      <div className="text-center py-10">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-rose-50 ring-1 ring-rose-200 flex items-center justify-center shadow-sm">
          <svg
            className="w-7 h-7 text-rose-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h3 className="text-lg font-semibold text-slate-900 mb-1">No se pudo cargar</h3>
        <p className="text-slate-600 text-sm">
          {error.message || "Ocurrió un error. Intenta de nuevo."}
        </p>
      </div>
    );
  }

  // Vacío
  if (!documents || documents.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-50 ring-1 ring-slate-200 flex items-center justify-center shadow-sm">
          <svg
            className="w-7 h-7 text-slate-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>

        <h3 className="text-lg font-semibold text-slate-900 mb-1">{emptyMessage}</h3>
        <p className="text-slate-600 text-sm">Escanea tu primer documento para comenzar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Lista */}
      {documents.map((doc) => (
        <DocumentCard key={doc.id} document={doc} />
      ))}

      {/* Load more */}
      {hasMore && (
        <div className="pt-4">
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            className="
              w-full py-3.5 rounded-2xl font-semibold
              bg-white text-slate-900
              ring-1 ring-slate-200
              hover:bg-slate-50 hover:ring-slate-300
              transition-colors
              shadow-sm
              disabled:opacity-60 disabled:cursor-not-allowed
              focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2
            "
          >
            {loadingMore ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5 text-slate-700"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Cargando...
              </span>
            ) : (
              "Cargar más"
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default DocumentList;

DocumentList.propTypes = {
  documents: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
    })
  ),
  loading: PropTypes.bool,
  error: PropTypes.shape({
    message: PropTypes.string,
  }),
  hasMore: PropTypes.bool,
  onLoadMore: PropTypes.func,
  loadingMore: PropTypes.bool,
  emptyMessage: PropTypes.string,
};

DocumentList.defaultProps = {
  documents: [],
  loading: false,
  error: null,
  hasMore: false,
  onLoadMore: undefined,
  loadingMore: false,
  emptyMessage: "No hay documentos",
};
