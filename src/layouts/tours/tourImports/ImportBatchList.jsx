/* eslint-disable react/prop-types */

const BATCH_STATUS_CONFIG = {
  PREVIEW: { label: "Vista previa", className: "bg-blue-50 text-blue-700 border-blue-200" },
  CONFIRMED: {
    label: "Confirmado",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  CANCELLED: { label: "Cancelado", className: "bg-gray-100 text-gray-500 border-gray-200" },
};

function formatDate(val) {
  if (!val) return "—";
  return new Date(Number(val) || val).toLocaleDateString("es-CR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ImportBatchList({ batches = [], onCancel }) {
  if (batches.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
        <p className="text-3xl mb-2">📭</p>
        <p className="text-sm font-bold text-gray-700">Sin importaciones</p>
        <p className="text-xs text-gray-400 mt-1">El historial de importaciones aparecerá aquí.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-gray-100">
        <h3 className="text-sm font-bold text-gray-900">Historial de importaciones</h3>
      </div>

      <div className="divide-y divide-gray-100">
        {batches.map((batch) => {
          const cfg = BATCH_STATUS_CONFIG[batch.status] || BATCH_STATUS_CONFIG.CANCELLED;
          return (
            <div
              key={batch.id}
              className="px-5 py-4 flex items-start justify-between gap-4 hover:bg-gray-50 transition-colors"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-gray-900 truncate">
                    {batch.fileName}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.className}`}
                  >
                    {cfg.label}
                  </span>
                </div>

                {batch.sheetName && (
                  <p className="text-xs text-gray-400">Hoja: {batch.sheetName}</p>
                )}

                {batch.stats && (
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-blue-600 font-semibold">{batch.stats.total} filas</span>
                    <span className="text-emerald-600">✓ {batch.stats.valid} válidas</span>
                    {batch.stats.invalid > 0 && (
                      <span className="text-red-500">✗ {batch.stats.invalid} errores</span>
                    )}
                    {batch.stats.duplicates > 0 && (
                      <span className="text-amber-500">⊘ {batch.stats.duplicates} duplicadas</span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-3 text-xs text-gray-400">
                  {batch.createdBy && (
                    <span>
                      {batch.createdBy.name} {batch.createdBy.firstSurName}
                    </span>
                  )}
                  <span>{formatDate(batch.createdAt)}</span>
                  {batch.confirmedAt && <span>· Confirmado: {formatDate(batch.confirmedAt)}</span>}
                </div>
              </div>

              {batch.status === "PREVIEW" && onCancel && (
                <button
                  onClick={() => onCancel(batch.id)}
                  className="flex-shrink-0 text-xs text-red-500 hover:text-red-700 font-semibold px-3 py-1.5 rounded-xl hover:bg-red-50 transition-colors border border-transparent hover:border-red-200"
                >
                  Cancelar
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
