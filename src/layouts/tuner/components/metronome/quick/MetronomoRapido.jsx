/* eslint-disable react/prop-types */
import { useEffect } from "react";
import { useMetronomoRapido } from "../../../../../hooks/practiceTools/useMetronomoRapido.js";
import { usePersistQuickSettings } from "../../../../../hooks/practiceTools/usePersistSession.js";
import { NumericStepper } from "../../shared/NumericStepper.jsx";
import { SUBDIVISIONES, SONIDOS_METRO, PRESETS_BPM } from "../../../../../modules/practica/constants/index.js";

/**
 * MetronomoRapido — Rediseño UI/UX
 * ─────────────────────────────────────────────────────────
 * Diagnóstico del original:
 * - BPM + slider + label "Tempo" flotando sin agrupación clara
 * - Los pulsos visuales muy pequeños y sin contexto de compás
 * - El botón Play centralmente correcto pero visualmente pequeño para una acción principal
 * - "Tap" y el display de compás con poco énfasis
 * - Sonido/Volumen mezclados sin jerarquía en la misma card
 * - Subdivisiones sin label de ayuda visual suficiente
 *
 * Mejoras:
 * - BPM hero con NumericStepper: gran protagonismo central
 * - Slider de tempo directamente debajo del BPM, sin gap
 * - Pulsos visuales más grandes, con animación de flash más legible
 * - Botón Play/Stop de mayor tamaño (w-24 h-24) → acción principal obvia en <1s
 * - Tap como acción secundaria bien ubicada, botón con feedback visual activo
 * - Display de compás integrado en la fila de controles como chip editable
 * - Presets de tempo con altura uniforme y nombre + BPM bien jerarquizados
 * - Compás con botones más anchos → mejor área táctil en móvil
 * - Subdivisión con símbolo + etiqueta breve
 * - Card de ajustes (sonido/volumen) con separación visual interna clara
 * - Lógica: intacta al 100%
 * ─────────────────────────────────────────────────────────
 */

const COMPASES_RAPIDO = [
  { beats: 2, label: "2/4" },
  { beats: 3, label: "3/4" },
  { beats: 4, label: "4/4" },
  { beats: 5, label: "5/4" },
  { beats: 7, label: "7/4" },
];

export function MetronomoRapido({ motorRef, userId }) {
  const { config, ejecutando, pulso, alternar, actualizar, tap, sincronizarDesdeServidor } =
    useMetronomoRapido(motorRef);

  usePersistQuickSettings(config, userId, sincronizarDesdeServidor);

  return (
    <div className="flex flex-col items-center gap-7 px-5 py-8 max-w-lg mx-auto w-full">

      {/* ── TEMPO (protagonista) ─────────────────────────── */}
      <div className="flex flex-col items-center gap-3 w-full">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          Tempo
        </span>

        <NumericStepper
          valor={config.bpm}
          onChange={(v) => actualizar({ bpm: v })}
          min={20}
          max={300}
          unit="BPM"
          displaySize="hero"
        />

        <input
          type="range"
          min={20}
          max={300}
          value={config.bpm}
          onChange={(e) => actualizar({ bpm: Number(e.target.value) })}
          className="w-full max-w-xs h-1.5 accent-gray-900 cursor-pointer"
          aria-label="Slider de tempo"
        />
      </div>

      {/* ── PULSOS VISUALES ─────────────────────────────── */}
      <div
        className="flex gap-3 justify-center items-center py-1"
        aria-live="polite"
        aria-label={`Beat ${(pulso.beat ?? 0) + 1} de ${config.pulsaciones}`}
      >
        {Array.from({ length: config.pulsaciones }).map((_, i) => {
          const activo   = ejecutando && pulso.beat === i;
          const esAcento = i === 0;
          return (
            <div
              key={i}
              className={`rounded-full border-2 transition-all duration-75 ${
                activo
                  ? esAcento
                    ? "bg-gray-900 border-gray-900 scale-125 shadow-md"
                    : "bg-gray-400 border-gray-400 scale-110"
                  : esAcento
                  ? "bg-transparent border-gray-700"
                  : "bg-transparent border-gray-300"
              }`}
              style={{ width: esAcento ? 24 : 18, height: esAcento ? 24 : 18 }}
            />
          );
        })}
      </div>

      {/* ── CONTROLES PRINCIPALES ───────────────────────── */}
      <div className="flex items-center gap-5">
        {/* Tap tempo */}
        <button
          onClick={tap}
          className="flex flex-col items-center gap-1 px-5 py-3 rounded-xl border border-gray-200
            bg-white text-gray-700 hover:bg-gray-50 active:scale-95 active:bg-gray-100
            transition-all duration-100 select-none min-w-[64px]"
          aria-label="Tap tempo — toca al ritmo para detectar BPM"
        >
          <span className="text-sm font-bold">Tap</span>
          <span className="text-[9px] text-gray-400 uppercase tracking-widest">tempo</span>
        </button>

        {/* Play / Stop — acción principal */}
        <button
          onClick={alternar}
          className={`w-24 h-24 rounded-2xl flex items-center justify-center text-white
            shadow-sm transition-all duration-150 active:scale-95 flex-shrink-0 ${
            ejecutando
              ? "bg-gray-900 hover:bg-gray-700"
              : "bg-gray-900 hover:bg-gray-700"
          }`}
          aria-label={ejecutando ? "Detener metrónomo" : "Iniciar metrónomo"}
        >
          {ejecutando ? (
            /* Pause */
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="5" width="4" height="14" rx="1.5" />
              <rect x="14" y="5" width="4" height="14" rx="1.5" />
            </svg>
          ) : (
            /* Play */
            <svg className="w-9 h-9" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Compás actual — chip */}
        <div className="flex flex-col items-center gap-1 min-w-[64px]">
          <span
            className="text-xl font-black text-gray-900 tabular-nums leading-none"
            style={{ fontFamily: "'Georgia', serif" }}
          >
            {config.pulsaciones}/4
          </span>
          <span className="text-[9px] text-gray-400 uppercase tracking-widest">compás</span>
        </div>
      </div>

      {/* ── PRESETS DE TEMPO ────────────────────────────── */}
      <div className="w-full">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">
          Indicaciones de tempo
        </p>
        <div className="grid grid-cols-3 gap-2">
          {PRESETS_BPM.map((p) => {
            const activo = config.bpm === p.bpm;
            return (
              <button
                key={p.bpm}
                onClick={() => actualizar({ bpm: p.bpm })}
                className={`py-3 rounded-xl text-xs font-semibold transition-all duration-100 ${
                  activo
                    ? "bg-gray-900 text-white shadow-sm"
                    : "bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span className="block font-bold mb-0.5">{p.nombre}</span>
                <span className={`text-[10px] ${activo ? "text-gray-400" : "text-gray-400"}`}>
                  {p.bpm}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── COMPÁS ──────────────────────────────────────── */}
      <div className="w-full">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">
          Compás
        </p>
        <div className="flex gap-2 flex-wrap">
          {COMPASES_RAPIDO.map((c) => (
            <button
              key={c.label}
              onClick={() => actualizar({ pulsaciones: c.beats })}
              className={`flex-1 min-w-[52px] py-2.5 rounded-xl border text-sm font-bold
                transition-all duration-100 ${
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

      {/* ── SUBDIVISIÓN ─────────────────────────────────── */}
      <div className="w-full">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">
          Subdivisión
        </p>
        <div className="flex gap-2">
          {SUBDIVISIONES.map((s) => (
            <button
              key={s.v}
              onClick={() => actualizar({ subdivision: s.v })}
              className={`flex-1 py-3 rounded-xl border text-xs font-semibold
                transition-all duration-100 ${
                config.subdivision === s.v
                  ? "bg-gray-900 border-gray-900 text-white"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span className="block text-lg leading-tight">{s.simbolo}</span>
              <span className={`text-[9px] mt-0.5 block ${
                config.subdivision === s.v ? "text-gray-400" : "text-gray-400"
              }`}>
                {s.etiqueta}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── AJUSTES: SONIDO Y VOLUMEN ────────────────────── */}
      <div className="w-full bg-gray-50 rounded-2xl border border-gray-200 p-4 flex flex-col gap-4">

        {/* Sonido */}
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">
            Sonido del click
          </p>
          <div className="flex gap-2 flex-wrap">
            {SONIDOS_METRO.map((s) => (
              <button
                key={s.v}
                onClick={() => actualizar({ sonido: s.v })}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-100 ${
                  config.sonido === s.v
                    ? "bg-gray-900 text-white shadow-sm"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {s.etiqueta}
              </button>
            ))}
          </div>
        </div>

        {/* Volumen */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Volumen
            </p>
            <span className="text-xs text-gray-500 font-mono tabular-nums">
              {Math.round(config.volumen * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={config.volumen}
            onChange={(e) => actualizar({ volumen: Number(e.target.value) })}
            className="w-full h-1.5 accent-gray-900 cursor-pointer"
            aria-label="Volumen del metrónomo"
          />
        </div>
      </div>

    </div>
  );
}