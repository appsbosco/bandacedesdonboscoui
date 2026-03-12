/* eslint-disable react/prop-types */
import { useState, useEffect, useRef } from "react";
import { MotorMetronomo } from "../../engine/MotorMetronomo.js";
import { PanelAfinador } from "../tuner/PanelAfinador.jsx";
import { PanelMetronomo } from "../metronome/PanelMetronomo.jsx";
import { PanelGuia } from "../guide/PanelGuia.jsx";

const TABS = [
  { id: "afinador",   label: "Afinador" },
  { id: "metronomo",  label: "Metrónomo" },
  { id: "guia",       label: "Guía" },
];

/**
 * PracticaPage — Componente raíz del módulo de práctica musical
 * Props:
 *   userId: string | null — ID del usuario autenticado. Si es null, funciona sin persistencia en BD.
 */
export default function PracticaPage({ userId = null }) {
  const [tab, setTab]   = useState("afinador");
  const [a4, setA4]     = useState(440);
  const motorRef        = useRef(null);

  useEffect(() => {
    motorRef.current = new MotorMetronomo();
    return () => { motorRef.current?.destruir(); };
  }, []);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
              Herramientas musicales
            </p>
            <h1
              className="text-xl font-black text-gray-900 leading-tight tracking-tight"
              style={{ fontFamily: "'Georgia', serif" }}
            >
              Afinador &amp; Metrónomo
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Pitch · Tempo · Compás · Práctica avanzada
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
            </svg>
          </div>
        </div>

        {/* Tabs principales */}
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex -mb-px" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
                  tab === t.id
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-400 hover:text-gray-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-5xl mx-auto" role="tabpanel">
        {tab === "afinador" && (
          <PanelAfinador a4={a4} setA4={setA4} />
        )}
        {tab === "metronomo" && (
          <div className="min-h-[calc(100vh-120px)] flex flex-col">
            <PanelMetronomo motorRef={motorRef} userId={userId} />
          </div>
        )}
        {tab === "guia" && (
          <PanelGuia />
        )}
      </div>
    </div>
  );
}