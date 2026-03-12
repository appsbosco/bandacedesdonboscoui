/* eslint-disable react/prop-types */
import { useState } from "react";
import { MetronomoRapido } from "./quick/MetronomoRapido.jsx";
import { MetronomoSecuencia } from "./sequence/MetronomoSecuencia.jsx";

export function PanelMetronomo({ motorRef, userId }) {
  const [modo, setModo] = useState("rapido");

  return (
    <div className="flex flex-col h-full">

      {/* Sub-tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto w-full px-6">
          <div className="flex gap-1">
            {[
              { id: "rapido",    label: "Rápido" },
              { id: "secuencia", label: "Secuencia" },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setModo(m.id)}
                className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
                  modo === m.id
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenido */}
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