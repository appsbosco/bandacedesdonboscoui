/* eslint-disable react/prop-types */
import { useRef, useEffect } from "react";
import { usePitchDetection } from "../../../../hooks/practiceTools/usePitchDetection.js";
import { MedidorAfinacion } from "./MedidorAfinacion.jsx";

export function PanelAfinador({ a4, setA4 }) {
  const a4Ref = useRef(a4);
  useEffect(() => { a4Ref.current = a4; }, [a4]);

  const { estado, estadoMic, errorMic, iniciar, detener } = usePitchDetection(a4Ref);

  const cents = estado.activo ? parseFloat(estado.cents.toFixed(1)) : 0;
  const abs   = Math.abs(cents);

  const estadoLabel = !estado.activo ? null
    : abs < 5  ? { txt: "Afinado",           cls: "bg-green-50 border-green-200 text-green-700",  dot: "bg-green-500" }
    : abs < 15 ? { txt: cents > 0 ? "Ligeramente alto" : "Ligeramente bajo", cls: "bg-amber-50 border-amber-200 text-amber-600", dot: "bg-amber-400" }
    :            { txt: cents > 0 ? "Muy alto" : "Muy bajo", cls: "bg-red-50 border-red-200 text-red-600", dot: "bg-red-500" };

  return (
    <div className="flex flex-col items-center gap-5 px-4 py-8 max-w-lg mx-auto w-full">

      {estadoMic !== "activo" ? (
        /* ── Estado inactivo ── */
        <div className="w-full flex flex-col items-center gap-6 py-10">
          <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
            <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 016 0v8.25a3 3 0 01-3 3z" />
            </svg>
          </div>

          <div className="text-center">
            <p className="text-sm font-semibold text-gray-900 mb-1">
              {estadoMic === "solicitando" ? "Solicitando acceso…" : "Activar afinador"}
            </p>
            <p className="text-xs text-gray-400 leading-relaxed">
              El afinador necesita acceso al micrófono para detectar el tono
            </p>
          </div>

          {errorMic && (
            <div className="w-full rounded-xl bg-red-50 border border-red-100 px-4 py-3">
              <p className="text-xs font-semibold text-red-600 mb-0.5">Sin acceso al micrófono</p>
              <p className="text-xs text-red-500">{errorMic}</p>
            </div>
          )}

          <button
            onClick={iniciar}
            disabled={estadoMic === "solicitando"}
            className="px-8 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold
              hover:bg-gray-800 active:scale-95 transition-all disabled:opacity-50"
          >
            {estadoMic === "solicitando" ? "Conectando…" : "Iniciar afinador"}
          </button>
        </div>

      ) : (
        <>
          {/* ── Nota detectada ── */}
          <div className="w-full bg-white border border-gray-200 rounded-2xl px-6 py-6 flex flex-col items-center gap-2">
            <div
              className="text-[100px] sm:text-[120px] font-black leading-none tracking-tight text-gray-900
                tabular-nums min-h-[108px] flex items-center justify-center"
              style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
              aria-live="polite"
              aria-label={estado.activo && estado.nota ? `Nota: ${estado.nota.nombre}` : "Sin señal"}
            >
              {estado.activo && estado.nota
                ? estado.nota.nombre
                : <span className="text-gray-100">—</span>}
            </div>

            {estado.activo && estado.nota ? (
              <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap justify-center">
                {estado.nota.enarmonico && (
                  <span className="text-gray-300">/ {estado.nota.enarmonico}</span>
                )}
                <span className="font-medium text-gray-500">{estado.nota.nombreEn}{estado.nota.octava}</span>
                <span className="text-gray-200">·</span>
                <span className="font-mono text-gray-400">{estado.freq.toFixed(1)} Hz</span>
              </div>
            ) : (
              <p className="text-xs text-gray-300">Esperando señal…</p>
            )}
          </div>

          {/* ── Medidor semicircular ── */}
          <div className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-4">
            <MedidorAfinacion cents={cents} activo={estado.activo} />

            <div className="flex flex-col items-center gap-2 mt-1">
              <span
                className={`text-xl font-bold tabular-nums font-mono transition-colors ${
                  !estado.activo ? "text-gray-200"
                  : abs < 7  ? "text-green-600"
                  : abs < 20 ? "text-amber-500"
                  :             "text-red-500"
                }`}
              >
                {estado.activo ? `${estado.cents > 0 ? "+" : ""}${estado.cents.toFixed(1)} ¢` : "—"}
              </span>

              {estadoLabel && (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${estadoLabel.cls}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${estadoLabel.dot}`} />
                  {estadoLabel.txt}
                </span>
              )}
            </div>
          </div>

          {/* ── Feedback educativo ── */}
          {estado.activo && estado.nota && abs >= 5 && (
            <div className={`w-full rounded-xl border px-4 py-3 text-xs leading-relaxed ${
              abs < 15
                ? "bg-amber-50 border-amber-100 text-amber-700"
                : "bg-red-50 border-red-100 text-red-700"
            }`} role="status">
              {cents > 0
                ? abs < 15
                  ? "Baja levemente la afinación. Relaja la embocadura o reduce la presión de aire."
                  : "La nota está bastante alta. Revisa la afinación del instrumento."
                : abs < 15
                ? "Sube levemente la afinación. Aumenta la presión de aire o ajusta la embocadura."
                : "La nota está bastante baja. Revisa la posición del instrumento."}
            </div>
          )}

          {/* ── Nivel de señal ── */}
          {estado.activo && (
            <div className="w-full">
              <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                <span>Señal</span>
                <span className="font-mono">{Math.round(estado.confianza * 100)}%</span>
              </div>
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={Math.round(estado.confianza * 100)}
                aria-valuemin={0}
                aria-valuemax={100}>
                <div
                  className="h-full bg-gray-800 rounded-full transition-all duration-200"
                  style={{ width: `${estado.confianza * 100}%` }}
                />
              </div>
            </div>
          )}

          <button
            onClick={detener}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors hover:underline underline-offset-2 mt-1"
          >
            Detener micrófono
          </button>
        </>
      )}

      {/* ── Referencia A4 ── */}
      <div className="w-full bg-white border border-gray-200 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Referencia
          </span>
          <span className="text-xs font-bold text-gray-900 font-mono">A4 = {a4} Hz</span>
        </div>
        <input
          type="range" min={435} max={445} step={1} value={a4}
          onChange={(e) => setA4(Number(e.target.value))}
          className="w-full h-1.5 accent-gray-900"
          aria-label="Frecuencia de referencia A4"
        />
        <div className="flex justify-between mt-2">
          {[435, 437, 440, 442, 445].map((v) => (
            <button
              key={v}
              onClick={() => setA4(v)}
              className={`text-[10px] transition-colors px-1 py-0.5 rounded ${
                a4 === v
                  ? "text-gray-900 font-bold"
                  : "text-gray-400 hover:text-gray-600"
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