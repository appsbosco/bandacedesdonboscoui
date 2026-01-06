import React, { useState } from "react";
import { Select } from "../ui/Select";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import PropTypes from "prop-types";

export function DocumentsFilters({ filters, onFiltersChange }) {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleChange = (key, value) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
  };

  const handleReset = () => {
    const resetFilters = {};
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  const quickFilters = [
    { label: "Todos", days: null },
    { label: "Expiran en 7 días", days: 7 },
    { label: "Expiran en 30 días", days: 30 },
    { label: "Expiran en 60 días", days: 60 },
    { label: "Expiran en 90 días", days: 90 },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
        <Button variant="ghost" size="sm" onClick={handleReset}>
          Limpiar
        </Button>
      </div>

      {/* Quick filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {quickFilters.map((filter, index) => (
          <button
            key={index}
            onClick={() => {
              handleChange("expiresInDays", filter.days);
              onFiltersChange({ ...localFilters, expiresInDays: filter.days });
            }}
            className={`
              px-3 py-1.5 rounded-full text-sm font-medium transition-colors
              ${
                localFilters.expiresInDays === filter.days
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }
            `}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Select
          label="Tipo"
          value={localFilters.type || ""}
          onChange={(e) => handleChange("type", e.target.value || null)}
          options={[
            { label: "Pasaporte", value: "PASSPORT" },
            { label: "Visa", value: "VISA" },
          ]}
          placeholder="Todos"
        />

        <Select
          label="Estado"
          value={localFilters.status || ""}
          onChange={(e) => handleChange("status", e.target.value || null)}
          options={[
            { label: "Subido", value: "UPLOADED" },
            { label: "Datos Capturados", value: "DATA_CAPTURED" },
            { label: "Verificado", value: "VERIFIED" },
            { label: "Rechazado", value: "REJECTED" },
          ]}
          placeholder="Todos"
        />

        <Select
          label="Fuente"
          value={localFilters.source || ""}
          onChange={(e) => handleChange("source", e.target.value || null)}
          options={[
            { label: "Manual", value: "MANUAL" },
            { label: "OCR", value: "OCR" },
          ]}
          placeholder="Todas"
        />

        <Input
          label="Expira antes de"
          type="date"
          value={localFilters.expiresBefore || ""}
          onChange={(e) => handleChange("expiresBefore", e.target.value || null)}
        />
      </div>

      <div className="mt-4 flex gap-2">
        <Button onClick={handleApply} variant="primary" size="sm">
          Aplicar Filtros
        </Button>
      </div>
    </div>
  );
}
DocumentsFilters.propTypes = {
  filters: PropTypes.shape({
    type: PropTypes.oneOf(["PASSPORT", "VISA", null]),
    status: PropTypes.oneOf(["UPLOADED", "DATA_CAPTURED", "VERIFIED", "REJECTED", null]),
    source: PropTypes.oneOf(["MANUAL", "OCR", null]),
    expiresBefore: PropTypes.oneOfType([PropTypes.string, PropTypes.oneOf([null])]),
    expiresInDays: PropTypes.oneOfType([PropTypes.number, PropTypes.oneOf([null])]),
  }).isRequired,
  onFiltersChange: PropTypes.func.isRequired,
};
