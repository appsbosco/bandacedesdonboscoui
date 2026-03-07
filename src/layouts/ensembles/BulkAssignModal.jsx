/* eslint-disable react/prop-types */
/**
 * BulkAssignModal — bulk add or remove users from ensembles.
 * Shows ensemble selector (excluding MARCHING for remove mode).
 */
import { useState, useEffect } from "react";

const CATEGORY_LABEL = {
  MARCHING: "Marcha",
  BIG_BAND: "Big Band",
  CONCERT: "Concierto",
  OTHER: "Otro",
};

export default function BulkAssignModal({
  isOpen,
  mode = "add",      // "add" | "remove"
  selectedCount = 0,
  ensembles = [],
  onClose,
  onApply,
  applying,
  result,
  onClearResult,
}) {
  const [selectedKeys, setSelectedKeys] = useState(new Set());

  useEffect(() => {
    if (isOpen) setSelectedKeys(new Set());
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const selectable = mode === "remove"
    ? ensembles.filter((e) => !e.isDefault)
    : ensembles;

  const toggleKey = (key) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const grouped = selectable.reduce((acc, e) => {
    const cat = e.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(e);
    return acc;
  }, {});

  const handleApply = () => {
    if (selectedKeys.size === 0) return;
    onApply(Array.from(selectedKeys), mode);
  };

  const isAdd = mode === "add";

  return (
    <div
      className="fixed inset-0 z-[1300] flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isAdd ? "Agregar a agrupaciones" : "Remover de agrupaciones"}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedCount} usuario{selectedCount !== 1 ? "s" : ""} seleccionado{selectedCount !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Result banner */}
        {result && (
          <div className="mx-6 mt-4 p-4 rounded-2xl border text-xs bg-emerald-50 border-emerald-200">
            <p className="font-bold text-gray-800 mb-1">Resultado</p>
            <p className="text-gray-600">✓ {result.updatedCount} actualizado{result.updatedCount !== 1 ? "s" : ""}</p>
            {result.skippedCount > 0 && (
              <p className="text-gray-500">{result.skippedCount} omitido{result.skippedCount !== 1 ? "s" : ""}</p>
            )}
            {(result.errors || []).length > 0 && (
              <div className="mt-2 space-y-0.5">
                {result.errors.slice(0, 5).map((e, i) => (
                  <p key={i} className="text-red-600">✗ {e.reason}</p>
                ))}
              </div>
            )}
            <button onClick={onClearResult} className="mt-2 text-gray-400 hover:text-gray-600 underline">Cerrar</button>
          </div>
        )}

        {/* Body */}
        <div className="p-6 space-y-5 max-h-96 overflow-y-auto">
          {!isAdd && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-700">
              La <strong>Banda de marcha</strong> nunca puede removerse.
            </div>
          )}

          {Object.entries(grouped).map(([category, list]) => (
            <div key={category}>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                {CATEGORY_LABEL[category] || category}
              </p>
              <div className="space-y-2">
                {list.map((ensemble) => {
                  const isSelected = selectedKeys.has(ensemble.key);
                  return (
                    <div
                      key={ensemble.key}
                      onClick={() => toggleKey(ensemble.key)}
                      className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? isAdd
                            ? "bg-blue-50 border-blue-300"
                            : "bg-red-50 border-red-300"
                          : "bg-gray-50 border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? isAdd ? "bg-blue-600 border-blue-600" : "bg-red-600 border-red-600"
                            : "border-gray-300"
                        }`}
                      >
                        {isSelected && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{ensemble.name}</p>
                        <p className="text-xs text-gray-400">{ensemble.memberCount} miembro{ensemble.memberCount !== 1 ? "s" : ""}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3 border-t border-gray-100 pt-4">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-2xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleApply}
            disabled={selectedKeys.size === 0 || applying}
            className={`flex-1 py-2.5 rounded-2xl font-bold text-sm text-white disabled:opacity-40 transition-all ${
              isAdd ? "bg-blue-600 hover:bg-blue-700" : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {applying
              ? "Aplicando…"
              : isAdd
              ? `Agregar a ${selectedKeys.size} agrupación${selectedKeys.size !== 1 ? "es" : ""}`
              : `Remover de ${selectedKeys.size} agrupación${selectedKeys.size !== 1 ? "es" : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}
