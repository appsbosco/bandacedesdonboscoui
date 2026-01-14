import React from "react";
import PropTypes from "prop-types";

export default function HelpSheet({ onClose, documentType }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg p-8 animate-slide-up shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          aria-label="Cerrar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <h3 className="text-2xl font-bold text-gray-900 mb-6">Consejos para una buena captura</h3>

        <div className="space-y-6">
          {/* Tip 1 */}
          <div className="flex items-start">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Buena iluminación</h4>
              <p className="text-sm text-gray-600">
                Asegúrate de tener suficiente luz. Evita sombras directas sobre el documento.
              </p>
            </div>
          </div>

          {/* Tip 2 */}
          <div className="flex items-start">
            <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Ángulo frontal</h4>
              <p className="text-sm text-gray-600">
                Sostén el documento paralelo a la cámara. El marco se volverá verde cuando esté bien
                alineado.
              </p>
            </div>
          </div>

          {/* Tip 3 */}
          <div className="flex items-start">
            <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mr-4">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Mantén estable</h4>
              <p className="text-sm text-gray-600">
                Evita movimientos. La captura es automática cuando detecte que todo está perfecto.
              </p>
            </div>
          </div>

          {/* MRZ tip for passport */}
          {documentType === "PASSPORT" && (
            <div className="flex items-start bg-blue-50 rounded-xl p-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm mb-1">Zona MRZ</h4>
                <p className="text-xs text-gray-700">
                  Coloca las dos líneas de texto en la parte inferior del pasaporte dentro de la
                  banda azul del marco.
                </p>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl transition-colors"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}

HelpSheet.propTypes = {
  onClose: PropTypes.func.isRequired,
  documentType: PropTypes.oneOf(["PASSPORT", "VISA"]).isRequired,
};
