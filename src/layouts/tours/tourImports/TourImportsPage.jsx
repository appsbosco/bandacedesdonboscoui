/* eslint-disable react/prop-types */

/**
 * TourImportsPage
 * Recibe tourId y tourName como props desde TourDetailPage.
 * El tourId viene del objeto tour cargado via useParams en TourDetailPage.
 */
import { useTourImports } from "./useTourImports";
import ImportWizardModal from "./ImportWizardModal";
import ImportBatchList from "./ImportBatchList";

export default function TourImportsPage({ tourId, tourName }) {
  const {
    wizardOpen,
    step,
    previewData,
    confirmResult,
    errorMsg,
    batches,
    batchesLoading,
    openWizard,
    closeWizard,
    handlePreview,
    handleConfirm,
    handleCancelBatch,
    handleRetry,
  } = useTourImports(tourId);

  // Stats summary from confirmed batches
  const totalImported = batches
    .filter((b) => b.status === "CONFIRMED")
    .reduce((acc, b) => acc + (b.stats?.valid ?? 0), 0);

  const confirmedCount = batches.filter((b) => b.status === "CONFIRMED").length;
  const previewCount = batches.filter((b) => b.status === "PREVIEW").length;

  return (
    <div className="space-y-5">
      {/* Sub-header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-base font-bold text-gray-900">Importación de participantes</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Importá participantes desde un archivo Excel a la gira{" "}
            <span className="font-semibold">{tourName}</span>
          </p>
        </div>
        <button
          onClick={openWizard}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-bold rounded-2xl active:scale-[0.98] transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          Importar desde Excel
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <p className="text-2xl font-bold text-gray-900">{totalImported}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total importados</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <p className="text-2xl font-bold text-emerald-600">{confirmedCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">Importaciones confirmadas</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <p className="text-2xl font-bold text-blue-600">{previewCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">En vista previa</p>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
        <svg
          className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-xs text-blue-700">
          La importación es un proceso de <strong>2 pasos</strong>: primero se valida el archivo
          (vista previa con errores y duplicados) y luego se confirma para insertar solo los
          registros válidos.
        </p>
      </div>

      {/* Batch history */}
      {batchesLoading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-2xl" />
          ))}
        </div>
      ) : (
        <ImportBatchList batches={batches} onCancel={handleCancelBatch} />
      )}

      {/* Wizard modal */}
      <ImportWizardModal
        isOpen={wizardOpen}
        step={step}
        previewData={previewData}
        confirmResult={confirmResult}
        errorMsg={errorMsg}
        onClose={closeWizard}
        onPreview={handlePreview}
        onConfirm={handleConfirm}
        onRetry={handleRetry}
      />
    </div>
  );
}
