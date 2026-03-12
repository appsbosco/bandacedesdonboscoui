/* eslint-disable react/prop-types */
import { useEffect } from "react";
import { useMetronomoRapido } from "../../../../../hooks/practiceTools/useMetronomoRapido.js";
import { usePersistQuickSettings } from "../../../../../hooks/practiceTools/usePersistSession.js";
import { NumericStepper } from "../../shared/NumericStepper.jsx";
import { SUBDIVISIONES, SONIDOS_METRO, PRESETS_BPM } from "../../../../../modules/practica/constants/index.js";

const COMPASES_RAPIDO = [
  { beats: 2, label: "2/4" }, { beats: 3, label: "3/4" },
  { beats: 4, label: "4/4" }, { beats: 5, label: "5/4" },
  { beats: 7, label: "7/4" },
];

export function MetronomoRapido({ motorRef, userId }) {
  const { config, ejecutando, pulso, alternar, actualizar, tap, sincronizarDesdeServidor } =
    useMetronomoRapido(motorRef);

  // Persistencia en BD con debounce
  usePersistQuickSettings(config, userId, sincronizarDesdeServidor);

  return (
    <div className="flex flex-col items-center gap-6 px-4 py-8 max-w-lg mx-auto w-full">

      {/* BPM con stepper */}
      <div className="flex flex-col items-center gap-2 w-full">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tempo</span>
        <NumericStepper
          valor={config.bpm} onChange={(v) => actualizar({ bpm: v })}
          min={20} max={300}
        />
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest -mt-1">BPM</span>
        <input
          type="range" min={20} max={300} value={config.bpm}
          onChange={(e) => actualizar({ bpm: Number(e.target.value) })}
          className="w-full max-w-xs h-1.5 accent-gray-900 mt-1"
          aria-label="Slider de tempo"
        />
      </div>

      {/* Pulsos visuales */}
      <div className="flex gap-2.5 justify-center items-center py-2" aria-live="polite" aria-label="Pulsos del metrónomo">
        {Array.from({ length: config.pulsaciones }).map((_, i) => {
          const activo = ejecutando && pulso.beat === i;
          const esAcento = i === 0;
          return (
            <div
              key={i}
              className={`rounded-full transition-all duration-75 border-2 ${
                activo
                  ? esAcento
                    ? "bg-gray-900 border-gray-900 scale-125 shadow-md"
                    : "bg-gray-500 border-gray-500 scale-110"
                  : esAcento
                  ? "bg-transparent border-gray-800"
                  : "bg-transparent border-gray-300"
              }`}
              style={{ width: esAcento ? 22 : 16, height: esAcento ? 22 : 16 }}
            />
          );
        })}
      </div>

      {/* Play / Tap / Compás */}
      <div className="flex items-center gap-4">
        <button
          onClick={tap}
          className="px-5 py-3 rounded-xl border border-gray-200 text-sm font-semibold
            text-gray-700 hover:bg-gray-50 active:scale-95 transition-all select-none"
          aria-label="Tap tempo"
        >
          Tap
        </button>
        <button
          onClick={alternar}
          className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white
            shadow-sm transition-all active:scale-95 ${
            ejecutando ? "bg-red-600 hover:bg-red-700" : "bg-gray-900 hover:bg-gray-700"
          }`}
          aria-label={ejecutando ? "Pausar metrónomo" : "Iniciar metrónomo"}
        >
          {ejecutando ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="5" width="4" height="14" rx="1.5" />
              <rect x="14" y="5" width="4" height="14" rx="1.5" />
            </svg>
          ) : (
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        <div className="px-4 py-3 rounded-xl border border-gray-200 text-sm font-bold
          text-gray-700 text-center min-w-[60px] select-none">
          {config.pulsaciones}/4
        </div>
      </div>

      {/* Presets de tempo */}
      <div className="w-full">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
          Indicaciones de tempo
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {PRESETS_BPM.map((p) => (
            <button
              key={p.bpm}
              onClick={() => actualizar({ bpm: p.bpm })}
              className={`py-2.5 rounded-xl text-xs font-semibold transition-all ${
                config.bpm === p.bpm
                  ? "bg-gray-900 text-white"
                  : "bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className="block">{p.nombre}</span>
              <span className={`text-[10px] ${config.bpm === p.bpm ? "text-gray-400" : "text-gray-400"}`}>
                {p.bpm}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Compás */}
      <div className="w-full">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Compás</p>
        <div className="flex gap-1.5 flex-wrap">
          {COMPASES_RAPIDO.map((c) => (
            <button
              key={c.label}
              onClick={() => actualizar({ pulsaciones: c.beats })}
              className={`px-3.5 py-2 rounded-xl border text-sm font-bold transition-all ${
                config.pulsaciones === c.beats
                  ? "bg-gray-900 border-gray-900 text-white"
                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Subdivisión */}
      <div className="w-full">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
          Subdivisión
        </p>
        <div className="flex gap-1.5">
          {SUBDIVISIONES.map((s) => (
            <button
              key={s.v}
              onClick={() => actualizar({ subdivision: s.v })}
              className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                config.subdivision === s.v
                  ? "bg-gray-900 border-gray-900 text-white"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span className="block text-base">{s.simbolo}</span>
              <span className="text-[9px] text-gray-400">{s.etiqueta}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sonido y volumen */}
      <div className="w-full bg-gray-50 rounded-2xl border border-gray-100 p-4 flex flex-col gap-4">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
            Sonido
          </p>
          <div className="flex gap-1.5 flex-wrap">
            {SONIDOS_METRO.map((s) => (
              <button key={s.v} onClick={() => actualizar({ sonido: s.v })}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  config.sonido === s.v
                    ? "bg-gray-900 text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}>
                {s.etiqueta}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="flex justify-between mb-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Volumen</p>
            <span className="text-xs text-gray-500 font-mono">{Math.round(config.volumen * 100)}%</span>
          </div>
          <input type="range" min={0} max={1} step={0.05} value={config.volumen}
            onChange={(e) => actualizar({ volumen: Number(e.target.value) })}
            className="w-full h-1.5 accent-gray-900"
            aria-label="Volumen del metrónomo"
          />
        </div>
      </div>
    </div>
  );
}