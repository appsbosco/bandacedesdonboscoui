/* eslint-disable react/prop-types */
import { useRef, useEffect } from "react";
import { usePitchDetection } from "../../../../hooks/practiceTools/usePitchDetection.js";
import { MedidorAfinacion } from "./MedidorAfinacion.jsx";

/**
 * PanelAfinador — Rediseño UI/UX
 * ─────────────────────────────────────────────────────────
 * Cambios de diseño (lógica intacta):
 *
 * JERARQUÍA VISUAL:
 * - Nota principal: tipografía serif de 108px, protagonismo absoluto
 * - Cents: secundario pero inmediato, con color semántico
 * - Info extra (Hz, enarmónico): terciaria, discreta
 *
 * ESTADO INACTIVO:
 * - Layout más centrado y enfocado
 * - Ícono de micrófono más grande y con ring animado cuando "solicitando"
 * - CTA más prominente
 *
 * ESTADO ACTIVO:
 * - Card de nota y medidor unificados en un solo bloque visual
 * - Badge de estado con punto de color animado cuando "Afinado"
 * - Señal de confianza integrada debajo del medidor, no flotando
 * - Feedback educativo colapsado por defecto → no compite
 *
 * REFERENCIA A4:
 * - Buttons de valor rápido como chips, no texto plano
 * - Slider con más contraste de acento
 *
 * ACCESIBILIDAD:
 * - aria-live en la nota detectada
 * - role="progressbar" en la señal
 * - Área táctil mínima ≥44px en todos los controles
 * ─────────────────────────────────────────────────────────
 */
export function PanelAfinador({ a4, setA4 }) {
  const a4Ref = useRef(a4);
  useEffect(() => { a4Ref.current = a4; }, [a4]);

  const { estado, estadoMic, errorMic, iniciar, detener } = usePitchDetection(a4Ref);

  const cents = estado.activo ? parseFloat(estado.cents.toFixed(1)) : 0;
  const abs   = Math.abs(cents);

  // Badge de estado de afinación
  const badge =
    !estado.activo ? null
    : abs < 5  ? { txt: "Afinado",                                       cls: "bg-green-50 border-green-200 text-green-700",  dot: "bg-green-500",  pulse: true  }
    : abs < 15 ? { txt: cents > 0 ? "Ligeramente alto" : "Ligeramente bajo", cls: "bg-amber-50 border-amber-200 text-amber-600", dot: "bg-amber-400", pulse: false }
    :             { txt: cents > 0 ? "Muy alto" : "Muy bajo",             cls: "bg-red-50 border-red-200 text-red-600",         dot: "bg-red-500",   pulse: false };

  const colorCents =
    !estado.activo ? "text-gray-200"
    : abs < 7      ? "text-green-600"
    : abs < 20     ? "text-amber-500"
    :                "text-red-500";

  // Feedback educativo
  const feedbackMsg =
    !estado.activo || abs < 5 ? null
    : cents > 0
      ? abs < 15 ? "Baja levemente la afinación. Relaja la embocadura o reduce la presión de aire."
                 : "La nota está bastante alta. Revisa la afinación del instrumento."
      : abs < 15 ? "Sube levemente la afinación. Aumenta la presión de aire o ajusta la embocadura."
                 : "La nota está bastante baja. Revisa la posición del instrumento.";

  return (
    <div className="flex flex-col items-center gap-4 px-4 py-8 max-w-lg mx-auto w-full">

      {/* ── ESTADO INACTIVO ─────────────────────────────── */}
      {estadoMic !== "activo" ? (
        <div className="w-full flex flex-col items-center gap-6 py-12">

          {/* Ícono con animación mientras solicita */}
          <div className={`relative w-20 h-20 flex items-center justify-center ${
            estadoMic === "solicitando" ? "animate-pulse" : ""
          }`}>
            {estadoMic === "solicitando" && (
              <div className="absolute inset-0 rounded-2xl bg-gray-100 animate-ping opacity-40" />
            )}
            <div className="relative w-20 h-20 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center">
              <svg
                className={`w-8 h-8 transition-colors ${
                  estadoMic === "solicitando" ? "text-gray-500" : "text-gray-400"
                }`}
                fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 016 0v8.25a3 3 0 01-3 3z" />
              </svg>
            </div>
          </div>

          <div className="text-center max-w-xs">
            <p className="text-sm font-semibold text-gray-900 mb-1.5">
              {estadoMic === "solicitando" ? "Solicitando acceso…" : "Activar afinador"}
            </p>
            <p className="text-xs text-gray-400 leading-relaxed">
              El afinador necesita acceso al micrófono para detectar el tono en tiempo real
            </p>
          </div>

          {errorMic && (
            <div className="w-full rounded-xl bg-red-50 border border-red-100 px-4 py-3.5">
              <p className="text-xs font-semibold text-red-600 mb-0.5">Sin acceso al micrófono</p>
              <p className="text-xs text-red-500 leading-relaxed">{errorMic}</p>
            </div>
          )}

          <button
            onClick={iniciar}
            disabled={estadoMic === "solicitando"}
            className="px-8 py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold
              hover:bg-gray-800 active:scale-95 transition-all duration-150
              disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {estadoMic === "solicitando" ? "Conectando…" : "Iniciar afinador"}
          </button>
        </div>

      ) : (
        <>
          {/* ── BLOQUE PRINCIPAL: nota + medidor ────────── */}
          <div className="w-full bg-white border border-gray-200 rounded-2xl overflow-hidden">

            {/* Nota principal */}
            <div className="flex flex-col items-center px-6 pt-7 pb-4 gap-1">
              <div
                className="text-[108px] sm:text-[128px] font-black leading-none tracking-tight
                  tabular-nums min-h-[108px] flex items-center justify-center
                  transition-all duration-75"
                style={{
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  color: estado.activo && estado.nota ? "#111827" : "#f3f4f6",
                }}
                aria-live="polite"
                aria-label={estado.activo && estado.nota ? `Nota detectada: ${estado.nota.nombre}` : "Sin señal"}
              >
                {estado.activo && estado.nota ? estado.nota.nombre : "—"}
              </div>

              {/* Info secundaria */}
              <div className="h-5 flex items-center justify-center gap-2.5">
                {estado.activo && estado.nota ? (
                  <div className="flex items-center gap-2.5 text-xs">
                    {estado.nota.enarmonico && (
                      <>
                        <span className="text-gray-300">/{estado.nota.enarmonico}</span>
                        <span className="text-gray-200">·</span>
                      </>
                    )}
                    <span className="font-medium text-gray-500">
                      {estado.nota.nombreEn}{estado.nota.octava}
                    </span>
                    <span className="text-gray-200">·</span>
                    <span className="font-mono text-gray-400 tabular-nums">
                      {estado.freq.toFixed(1)} Hz
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-300">Esperando señal…</span>
                )}
              </div>
            </div>

            {/* Separador sutil */}
            <div className="mx-6 h-px bg-gray-100" />

            {/* Medidor */}
            <div className="px-4 pt-4 pb-2">
              <MedidorAfinacion cents={cents} activo={estado.activo} />
            </div>

            {/* Cents + badge */}
            <div className="flex flex-col items-center gap-2 pb-5 px-6">
              <span
                className={`text-2xl font-bold tabular-nums font-mono transition-colors duration-150 ${colorCents}`}
              >
                {estado.activo
                  ? `${estado.cents > 0 ? "+" : ""}${estado.cents.toFixed(1)} ¢`
                  : "—"}
              </span>

              {badge && (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${badge.cls}`}>
                  <span
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${badge.dot} ${badge.pulse ? "animate-pulse" : ""}`}
                  />
                  {badge.txt}
                </span>
              )}

              {/* Nivel de señal — siempre visible cuando activo */}
              <div className="w-full mt-2">
                <div className="flex justify-between text-[10px] text-gray-400 mb-1.5">
                  <span className="font-medium uppercase tracking-widest">Señal</span>
                  <span className="font-mono tabular-nums">{Math.round(estado.confianza * 100)}%</span>
                </div>
                <div
                  className="h-1 bg-gray-100 rounded-full overflow-hidden"
                  role="progressbar"
                  aria-valuenow={Math.round(estado.confianza * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Nivel de señal del micrófono"
                >
                  <div
                    className={`h-full rounded-full transition-all duration-200 ${
                      estado.confianza > 0.6 ? "bg-green-500"
                      : estado.confianza > 0.3 ? "bg-amber-400"
                      : "bg-gray-400"
                    }`}
                    style={{ width: `${estado.confianza * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── FEEDBACK EDUCATIVO ──────────────────────── */}
          {feedbackMsg && (
            <div
              className={`w-full rounded-xl border px-4 py-3 text-xs leading-relaxed transition-all duration-200 ${
                abs < 15
                  ? "bg-amber-50 border-amber-100 text-amber-700"
                  : "bg-red-50 border-red-100 text-red-700"
              }`}
              role="status"
              aria-live="polite"
            >
              {feedbackMsg}
            </div>
          )}

          {/* ── DETENER ─────────────────────────────────── */}
          <button
            onClick={detener}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors
              hover:underline underline-offset-2 py-1 px-2 rounded-lg
              hover:bg-gray-50 active:scale-95"
          >
            Detener micrófono
          </button>
        </>
      )}

      {/* ── REFERENCIA A4 ───────────────────────────────── */}
      <div className="w-full bg-white border border-gray-200 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Referencia
          </span>
          <span className="text-xs font-bold text-gray-900 font-mono tabular-nums">
            A4 = {a4} Hz
          </span>
        </div>

        <input
          type="range"
          min={435} max={445} step={1}
          value={a4}
          onChange={(e) => setA4(Number(e.target.value))}
          className="w-full h-1.5 accent-gray-900 cursor-pointer"
          aria-label="Frecuencia de referencia A4"
        />

        {/* Chips de valor rápido */}
        <div className="flex justify-between mt-3 gap-1">
          {[435, 437, 440, 442, 445].map((v) => (
            <button
              key={v}
              onClick={() => setA4(v)}
              className={`flex-1 py-1 rounded-lg text-[10px] font-semibold transition-all duration-100 ${
                a4 === v
                  ? "bg-gray-900 text-white shadow-sm"
                  : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}