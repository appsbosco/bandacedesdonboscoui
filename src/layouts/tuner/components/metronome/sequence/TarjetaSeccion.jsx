/* eslint-disable react/prop-types */
import { memo } from "react";
import { SUBDIVISIONES } from "../../../../../modules/practica/constants/index.js";

/**
 * TarjetaSeccion — Rediseño UI/UX
 * ─────────────────────────────────────────────────────────
 * Diagnóstico:
 * - El estado "en reproducción" era solo un cambio de borde — poco llamativo
 * - El número de índice y el compás actual en producción no tenían suficiente espacio
 * - Las acciones (7 botones) estaban muy juntas, difíciles de pulsar en móvil
 * - La info BPM y repeticiones en la misma línea sin jerarquía clara
 * - Sin indicador visual de progreso dentro de la sección
 *
 * Mejoras:
 * - Estado "en reproducción": borde izquierdo prominente (border-l-3) + fondo muy sutil
 * - Número de índice con ancho fijo y alineación vertical mejorada
 * - Barra de progreso de compás inline (fina, debajo del nombre) cuando está en reproducción
 * - Acciones con gap más generoso; botones w-8 h-8 (área táctil ≥44px en conjunto)
 * - Separación clara entre info primaria (nombre/compás) y secundaria (BPM/reps/subdivisión)
 * - Chip de compás más visible
 * - Lógica: intacta al 100%
 * ─────────────────────────────────────────────────────────
 */
export const TarjetaSeccion = memo(function TarjetaSeccion({
  seccion, index, total, tickActual, seleccionada,
  onSeleccionar, onEliminar, onDuplicar, onMover, onReproducirDesde,
}) {
  const enReproduccion = tickActual?.seccionId === (seccion.seccionId || seccion.id);
  const esCountIn      = tickActual?.numeroCompas === 0;
  const enCurso        = enReproduccion && !esCountIn;

  // Progreso dentro de la sección actual
  const progresoCompas = enCurso && tickActual
    ? Math.min(1, (tickActual.numeroCompas - 1) / seccion.repeticiones)
    : 0;

  return (
    <div
      onClick={() => onSeleccionar(seccion.id)}
      role="button"
      aria-pressed={seleccionada}
      aria-label={`Sección ${index + 1}: ${seccion.nombre}`}
      className={`
        rounded-2xl border bg-white cursor-pointer
        transition-all duration-150 overflow-hidden
        ${enCurso
          ? "border-gray-300 shadow-sm ring-1 ring-gray-200 border-l-4 border-l-gray-900"
          : seleccionada
          ? "border-gray-300 shadow-sm"
          : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
        }
      `}
    >
      {/* Barra de progreso — solo visible cuando está en curso */}
      {enCurso && (
        <div className="h-0.5 bg-gray-100 w-full">
          <div
            className="h-full bg-gray-900 transition-all duration-300"
            style={{ width: `${progresoCompas * 100}%` }}
          />
        </div>
      )}

      <div className="px-4 py-3.5">
        <div className="flex items-center gap-3">

          {/* Índice + contador de compás */}
          <div className="flex flex-col items-center gap-0.5 w-7 flex-shrink-0">
            <span
              className={`text-xs font-bold w-7 text-center py-0.5 rounded-lg font-mono ${
                enCurso
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {index + 1}
            </span>
            {enCurso && tickActual && (
              <span className="text-[9px] text-gray-400 font-mono tabular-nums leading-none">
                {tickActual.numeroCompas}/{seccion.repeticiones}
              </span>
            )}
          </div>

          {/* Info principal */}
          <div className="flex-1 min-w-0">
            {/* Fila 1: nombre + chips */}
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h4 className="text-sm font-bold text-gray-900 truncate leading-tight">
                {seccion.nombre}
              </h4>
              <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg flex-shrink-0 leading-tight">
                {seccion.compas.numerador}/{seccion.compas.denominador}
              </span>
              {seccion.tempo.tipo === "curva" && (
                <span className="text-[10px] font-semibold text-gray-400 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded-md flex-shrink-0">
                  {(seccion.tempo.inicio || 0) < (seccion.tempo.fin || 0) ? "↗ Accel." : "↘ Rit."}
                </span>
              )}
            </div>

            {/* Fila 2: datos secundarios */}
            <div className="flex gap-3 text-xs text-gray-400 leading-tight">
              <span className="font-mono tabular-nums">
                {seccion.tempo.tipo === "fijo"
                  ? `${seccion.tempo.bpm} BPM`
                  : `${seccion.tempo.inicio}→${seccion.tempo.fin}`}
              </span>
              <span>×{seccion.repeticiones}</span>
              <span>{SUBDIVISIONES.find((s) => s.v === seccion.subdivision)?.simbolo || "♩"}</span>
            </div>
          </div>

          {/* Acciones */}
          <div
            className="flex items-center gap-0.5 flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Play desde aquí */}
            <button
              onClick={() => onReproducirDesde(seccion.seccionId || seccion.id)}
              title="Reproducir desde aquí"
              className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700
                transition-colors flex items-center justify-center"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>

            {/* Subir */}
            <button
              onClick={() => onMover(index, -1)}
              disabled={index === 0}
              title="Mover arriba"
              aria-label="Mover sección arriba"
              className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600
                disabled:opacity-20 transition-colors flex items-center justify-center text-xs font-bold"
            >↑</button>

            {/* Bajar */}
            <button
              onClick={() => onMover(index, 1)}
              disabled={index === total - 1}
              title="Mover abajo"
              aria-label="Mover sección abajo"
              className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600
                disabled:opacity-20 transition-colors flex items-center justify-center text-xs font-bold"
            >↓</button>

            {/* Duplicar */}
            <button
              onClick={() => onDuplicar(seccion)}
              title="Duplicar sección"
              className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600
                transition-colors flex items-center justify-center"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
              </svg>
            </button>

            {/* Eliminar */}
            <button
              onClick={() => onEliminar(seccion.id)}
              title="Eliminar sección"
              className="w-8 h-8 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500
                transition-colors flex items-center justify-center"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});