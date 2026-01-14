import React from "react";
import PropTypes from "prop-types";
import { DOCUMENT_TYPES } from "../../utils/constants";

/**
 * WizardStep1 - Selección del tipo de documento (Light UI)
 */
export function WizardStep1({ selectedType, onSelectType, onNext, isCreating }) {
  const documentTypes = Object.values(DOCUMENT_TYPES);

  const canContinue = !!selectedType && !isCreating;

  return (
    <div className="px-4 py-6 sm:px-6">
      {/* Card container */}
      <div className="mx-auto max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-5 sm:px-6 pt-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-50 ring-1 ring-primary-100 flex items-center justify-center shadow-sm">
              <svg
                className="w-8 h-8 text-primary-600"
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

            <h2 className="text-xl font-semibold text-slate-900 mb-2">Tipo de Documento</h2>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">
              Selecciona el tipo de documento que deseas escanear
            </p>
          </div>
        </div>

        {/* Grid */}
        <div className="px-5 sm:px-6 pb-2">
          <div className="grid  gap-3">
            {documentTypes.map((type) => {
              const isSelected = selectedType === type.id;

              return (
                <button
                  key={type.id}
                  onClick={() => onSelectType(type.id)}
                  aria-pressed={isSelected}
                  className={`
        relative w-full p-5 rounded-3xl text-left transition-all duration-200
        ring-1 shadow-sm hover:shadow-md
        focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2
        ${
          isSelected
            ? "bg-emerald-50 ring-emerald-300 shadow-md"
            : "bg-white ring-slate-200 hover:ring-slate-300 hover:bg-slate-50"
        }
      `}
                >
                  {/* CHECK IZQUIERDA (siempre visible) */}
                  <div className="absolute top-5 left-5">
                    <div
                      className={`
            w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200
            ${
              isSelected
                ? "bg-emerald-600 text-white shadow-lg ring-4 ring-emerald-100 scale-105"
                : "bg-white text-slate-400 ring-2 ring-slate-200"
            }
          `}
                    >
                      {isSelected ? (
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                      )}
                    </div>
                  </div>

                  {/* Contenido centrado */}
                  <div className="flex flex-col items-center text-center px-10">
                    <div className="text-3xl mb-2">{type.icon}</div>
                    <div className="font-semibold text-slate-900 text-base">{type.label}</div>
                    <div className="text-sm text-slate-500 mt-1 line-clamp-2">
                      {type.description}
                    </div>

                    {type.hasMRZ && (
                      <div className="mt-4 inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs rounded-full ring-1 ring-emerald-200">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        MRZ
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer / CTA */}
        <div className="px-5 sm:px-6 py-5 mt-6 border-t border-slate-200 bg-white/80 backdrop-blur-md">
          <button
            onClick={onNext}
            disabled={!selectedType || isCreating}
            className={`
      w-full py-4 rounded-2xl font-semibold transition-all duration-200 touch-target
      shadow-lg ring-1
      focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2
      active:scale-[0.99]
      ${
        canContinue
          ? "bg-gradient-to-r from-sky-600  hover:from-sky-700 hover:to-sky-600 text-white ring-sky-300"
          : "bg-slate-100 text-slate-400 ring-slate-200 cursor-not-allowed"
      }
    `}
          >
            {isCreating ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
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
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Creando documento...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Continuar
                <span
                  className={`${canContinue ? "bg-white/15" : "bg-slate-200"} rounded-full p-2`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </span>
              </span>
            )}
          </button>

          {!selectedType && (
            <p className="text-center text-xs text-slate-500 mt-3">
              Elegí un tipo de documento para continuar
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default WizardStep1;

WizardStep1.propTypes = {
  selectedType: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onSelectType: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  isCreating: PropTypes.bool,
};

WizardStep1.defaultProps = {
  selectedType: null,
  isCreating: false,
};
