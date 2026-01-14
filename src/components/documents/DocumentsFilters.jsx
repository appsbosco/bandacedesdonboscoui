import React, { useState } from "react";
import { DOCUMENT_TYPES, DOCUMENT_STATUSES } from "../../utils/constants";
import PropTypes from "prop-types";

/**
 * DocumentFilters - Filtros rápidos para la lista de documentos
 */
export function DocumentFilters({ filters, onFilterChange }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const documentTypes = Object.values(DOCUMENT_TYPES);
  const statuses = Object.values(DOCUMENT_STATUSES);

  const handleFilterChange = (key, value) => {
    onFilterChange({
      ...filters,
      [key]: value === filters[key] ? null : value,
    });
  };

  const clearFilters = () => {
    onFilterChange({});
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="mb-6">
      {/* Header con toggle */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <svg
            className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          Filtros
          {activeFiltersCount > 0 && (
            <span className="px-2 py-0.5 bg-primary-500/20 text-primary-400 text-xs rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {activeFiltersCount > 0 && (
          <button
            onClick={clearFilters}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Filtros expandidos */}
      {isExpanded && (
        <div className="space-y-4 animate-fade-in  bg-white shadow-lg shadow-slate-200/60 ring-1 ring-slate-200 py-4 px-4 rounded-3xl">
          {/* Filtro por tipo */}
          <div>
            <label className="block text-xs text-slate-500 mb-2">Tipo de documento</label>
            <div className="flex flex-wrap gap-2">
              {documentTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleFilterChange("type", type.id)}
                  className={`
                    px-3 py-1.5 text-xs font-medium rounded-lg transition-all
                    ${
                      filters.type === type.id
                        ? "bg-primary-500/20 text-primary-400 border border-primary-500/50"
                        : "bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600"
                    }
                  `}
                >
                  {type.label}

                  {/* <span className="mr-1">{type.icon}</span> */}
                </button>
              ))}
            </div>
          </div>

          {/* Filtro por estado */}
          <div>
            <label className="block text-xs text-slate-500 mb-2">Estado</label>
            <div className="flex flex-wrap gap-2">
              {statuses.map((status) => (
                <button
                  key={status.id}
                  onClick={() => handleFilterChange("status", status.id)}
                  className={`
                    px-3 py-1.5 text-xs font-medium rounded-lg transition-all
                    ${
                      filters.status === status.id
                        ? "bg-primary-500/20 text-primary-400 border border-primary-500/50"
                        : "bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600"
                    }
                  `}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filtro por expiración */}
          <div>
            <label className="block text-xs text-slate-500 mb-2">Expiración</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleFilterChange("expired", true)}
                className={`
                  px-3 py-1.5 text-xs font-medium rounded-lg transition-all
                  ${
                    filters.expired === true
                      ? "bg-red-500/20 text-red-400 border border-red-500/50"
                      : "bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600"
                  }
                `}
              >
                Expirados
              </button>
              <button
                onClick={() => handleFilterChange("expiresInDays", 30)}
                className={`
                  px-3 py-1.5 text-xs font-medium rounded-lg transition-all
                  ${
                    filters.expiresInDays === 30
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/50"
                      : "bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600"
                  }
                `}
              >
                Expira en 30 días
              </button>
              <button
                onClick={() => handleFilterChange("expiresInDays", 90)}
                className={`
                  px-3 py-1.5 text-xs font-medium rounded-lg transition-all
                  ${
                    filters.expiresInDays === 90
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/50"
                      : "bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600"
                  }
                `}
              >
                Expira en 90 días
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pills de filtros activos (cuando está colapsado) */}
      {!isExpanded && activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.type && (
            <span className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded-lg flex items-center gap-1">
              {DOCUMENT_TYPES[filters.type]?.label}
              <button onClick={() => handleFilterChange("type", null)} className="hover:text-white">
                ×
              </button>
            </span>
          )}
          {filters.status && (
            <span className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded-lg flex items-center gap-1">
              {DOCUMENT_STATUSES[filters.status]?.label}
              <button
                onClick={() => handleFilterChange("status", null)}
                className="hover:text-white"
              >
                ×
              </button>
            </span>
          )}
          {filters.expired && (
            <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-lg flex items-center gap-1">
              Expirados
              <button
                onClick={() => handleFilterChange("expired", null)}
                className="hover:text-red-300"
              >
                ×
              </button>
            </span>
          )}
          {filters.expiresInDays && (
            <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-lg flex items-center gap-1">
              Expira en {filters.expiresInDays} días
              <button
                onClick={() => handleFilterChange("expiresInDays", null)}
                className="hover:text-amber-300"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default DocumentFilters;

DocumentFilters.propTypes = {
  filters: PropTypes.shape({
    type: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    status: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    expired: PropTypes.bool,
    expiresInDays: PropTypes.number,
  }),
  onFilterChange: PropTypes.func.isRequired,
};

DocumentFilters.defaultProps = {
  filters: {},
};
