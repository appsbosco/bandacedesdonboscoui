/* eslint-disable react/prop-types */
import { useState } from "react";
import { MetronomoRapido } from "./quick/MetronomoRapido.jsx";
import { MetronomoSecuencia } from "./sequence/MetronomoSecuencia.jsx";

/**
 * PanelMetronomo — Rediseño UI/UX
 * ─────────────────────────────────────────────────────────
 * Mejoras:
 * - Sub-tabs con SegmentedControl visual en lugar de underline-tabs anidados
 *   (evita confusión con los tabs padre de PracticaPage)
 * - Padding y max-width consistente con el resto de paneles
 * - Lógica: intacta
 * ─────────────────────────────────────────────────────────
 */
const MODOS = [
  { id: "rapido",    label: "Rápido" },
  { id: "secuencia", label: "Secuencia" },
];

export function PanelMetronomo({ motorRef, userId }) {
  const [modo, setModo] = useState("rapido");

  return (
    <div className="flex flex-col h-full">

      {/* Sub-navegación: control segmentado contenido */}
      <div className="bg-white border-b border-gray-100 px-5 sm:px-6 py-3">
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1 max-w-[200px]">
          {MODOS.map((m) => (
            <button
              key={m.id}
              onClick={() => setModo(m.id)}
              aria-pressed={modo === m.id}
              className={`
                flex-1 py-1.5 rounded-lg text-xs font-semibold
                transition-all duration-150 leading-none select-none
                ${modo === m.id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"}
              `}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido del modo */}
      {modo === "rapido" ? (
        <div className="flex-1 overflow-y-auto">
          <MetronomoRapido motorRef={motorRef} userId={userId} />
        </div>
      ) : (
        <div className="flex-1 overflow-hidden min-h-0">
          <MetronomoSecuencia motorRef={motorRef} userId={userId} />
        </div>
      )}
    </div>
  );
}