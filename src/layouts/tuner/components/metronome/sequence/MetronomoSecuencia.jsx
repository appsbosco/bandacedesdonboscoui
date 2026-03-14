/* eslint-disable react/prop-types */
import { useState, useCallback } from "react";
import { useMetronomoSecuencia } from "../../../../../hooks/practiceTools/useMetronomoSecuencia.js";
import { TarjetaSeccion }        from "./TarjetaSeccion.jsx";
import { EditorSeccion }         from "./EditorSeccion.jsx";
import { ToggleSwitch }          from "../../shared/ToggleSwitch.jsx";
import { SONIDOS_METRO }         from "../../../../../modules/practica/constants/index.js";

/**
 * MetronomoSecuencia — Rediseño UI/UX
 * ─────────────────────────────────────────────────────────
 * Diagnóstico:
 * - Transport bar sin altura fija → el display de tick "empuja" el layout al aparecer
 * - El display de tick (oscuro) aparece arriba del transport → orden antinatural
 * - La barra inferior mezcla count-in, sonido, volumen y acciones sin separación visual
 * - "Guardar en cuenta" enterrado entre JSON/WAV — tiene la mayor importancia para user con BD
 * - El panel editor en mobile era un `fixed inset-0` sin animación de entrada
 * - El modal de guardar sin autofocus ni Enter → UX rota en desktop
 *
 * Mejoras:
 * - Transport siempre visible con altura mínima fija (no hace salto de layout)
 * - Display de tick DENTRO del transport, no encima
 * - Barra inferior dividida en 3 zonas claras: playback config / acciones
 * - "Guardar en cuenta" con jerarquía visual mayor (bg-gray-900)
 * - Panel editor en mobile como bottom sheet con overlay
 * - Modal con autoFocus correcto + submit con Enter
 * - Lógica: intacta al 100%
 * ─────────────────────────────────────────────────────────
 */
export function MetronomoSecuencia({ motorRef, userId }) {
  const seq = useMetronomoSecuencia(motorRef, userId);

  const [seccionEditandoId, setSeccionEditandoId]   = useState(null);
  const [panelEditorAbierto, setPanelEditorAbierto] = useState(false);
  const [exportando, setExportando]                 = useState(false);
  const [progresoExportar, setProgresoExportar]     = useState(0);
  const [modalGuardar, setModalGuardar]             = useState(false);
  const [nombreGuardar, setNombreGuardar]           = useState("");

  const seccionActual = seq.secciones.find(
    (s) => s.id === seccionEditandoId || s.seccionId === seccionEditandoId
  );

  const seleccionarSeccion = useCallback((id) => {
    setSeccionEditandoId(id);
    setPanelEditorAbierto(true);
  }, []);

  const agregarNuevaSeccion = useCallback(() => {
    const id = seq.agregarSeccion();
    setTimeout(() => seleccionarSeccion(id), 50);
  }, [seq, seleccionarSeccion]);

  const exportarAudio = async () => {
    if (!motorRef.current || seq.secciones.length === 0) return;
    try {
      setExportando(true);
      const blob = await motorRef.current.exportarWAV(
        seq.secciones, seq.countIn, seq.countInBeats, setProgresoExportar
      );
      const url = URL.createObjectURL(blob);
      const a   = document.createElement("a");
      a.href     = url;
      a.download = `secuencia-${Date.now()}.wav`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error al exportar WAV:", err);
    } finally {
      setExportando(false);
      setProgresoExportar(0);
    }
  };

  const confirmarGuardar = async () => {
    if (!nombreGuardar.trim()) return;
    await seq.guardarEnBD(nombreGuardar.trim());
    setModalGuardar(false);
    setNombreGuardar("");
  };

  const { estadoRepro } = seq;
  const etiquetaBoton = estadoRepro === "reproduciendo" ? "Pausar"
    : estadoRepro === "pausado" ? "Reanudar" : "Reproducir";

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-0">

      {/* ── PANEL PRINCIPAL ─────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">

        {/* Transport bar — altura mínima fija para evitar saltos de layout */}
        <div className="sticky top-0 z-20 bg-white border-b border-gray-100 min-h-[56px]">

          {/* Display de tick activo */}
          {seq.tickActual && (
            <div className={`mx-4 mt-3 mb-0 rounded-xl px-4 py-2.5 flex items-center gap-3 ${
              seq.tickActual.numeroCompas === 0
                ? "bg-amber-50 border border-amber-100"
                : "bg-gray-900"
            }`}>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold truncate leading-tight ${
                  seq.tickActual.numeroCompas === 0 ? "text-amber-700" : "text-white"
                }`}>
                  {seq.tickActual.numeroCompas === 0
                    ? `Preparación · Beat ${seq.tickActual.numeroBeat}`
                    : seq.tickActual.nombreSeccion}
                </p>
                <p className={`text-xs leading-tight ${
                  seq.tickActual.numeroCompas === 0 ? "text-amber-600" : "text-gray-400"
                }`}>
                  {seq.tickActual.numeroCompas > 0 && `Compás ${seq.tickActual.numeroCompas} · `}
                  Beat {seq.tickActual.numeroBeat} · {seq.tickActual.bpmActual} BPM
                </p>
              </div>
              {/* Indicador de beat */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                font-black text-lg transition-all duration-75 flex-shrink-0 tabular-nums ${
                seq.tickActual.esAcento
                  ? seq.tickActual.numeroCompas === 0
                    ? "bg-amber-500 text-white scale-110"
                    : "bg-white text-gray-900 scale-110"
                  : seq.tickActual.numeroCompas === 0
                  ? "bg-amber-100 text-amber-700"
                  : "bg-gray-700 text-gray-300"
              }`}
                style={{ fontFamily: "'Georgia', serif" }}
              >
                {seq.tickActual.numeroBeat}
              </div>
            </div>
          )}

          {/* Botones de transporte */}
          <div className="flex items-center gap-2 px-4 py-3">
            <button
              onClick={seq.pausarReanudar}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm
                transition-all active:scale-95 ${
                estadoRepro === "reproduciendo"
                  ? "bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100"
                  : "bg-gray-900 text-white hover:bg-gray-700"
              }`}
              aria-label={etiquetaBoton}
            >
              {estadoRepro === "reproduciendo" ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="5" width="4" height="14" rx="1.5" />
                  <rect x="14" y="5" width="4" height="14" rx="1.5" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
              {etiquetaBoton}
            </button>

            {(estadoRepro === "reproduciendo" || estadoRepro === "pausado") && (
              <button
                onClick={seq.detener}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm
                  bg-red-50 border border-red-100 text-red-600 hover:bg-red-100
                  transition-all active:scale-95"
                aria-label="Detener reproducción"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                </svg>
                Detener
              </button>
            )}

            <button
              onClick={agregarNuevaSeccion}
              className="ml-auto flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold
                text-sm border border-gray-200 text-gray-700 hover:bg-gray-50
                transition-all active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Sección
            </button>
          </div>
        </div>

        {/* ── TIMELINE ──────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {seq.secciones.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Sin secciones</p>
              <p className="text-xs text-gray-400 mb-5 leading-relaxed">
                Crea tu primera sección de práctica
              </p>
              <button
                onClick={agregarNuevaSeccion}
                className="px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold
                  hover:bg-gray-700 transition-all"
              >
                Crear primera sección
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {seq.secciones.map((sec, i) => (
                <TarjetaSeccion
                  key={sec.id || sec.seccionId}
                  seccion={sec}
                  index={i}
                  total={seq.secciones.length}
                  tickActual={seq.tickActual}
                  seleccionada={seccionEditandoId === sec.id}
                  onSeleccionar={seleccionarSeccion}
                  onEliminar={seq.eliminarSeccion}
                  onDuplicar={seq.duplicarSeccion}
                  onMover={seq.moverSeccion}
                  onReproducirDesde={seq.reproducirDesde}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── BARRA INFERIOR ──────────────────────────────── */}
        <div className="border-t border-gray-100 px-4 pt-3 pb-4 bg-white flex flex-col gap-3">

          {/* Zona 1: Playback config (count-in + sonido + volumen) */}
          <div className="flex items-center gap-3 flex-wrap">
            <ToggleSwitch activo={seq.countIn} onChange={seq.setCountIn} label="Count-in" />
            {seq.countIn && (
              <select
                value={seq.countInBeats}
                onChange={(e) => seq.setCountInBeats(Number(e.target.value))}
                className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold
                  text-gray-700 focus:outline-none bg-white"
              >
                <option value={1}>1 beat</option>
                <option value={2}>2 beats</option>
                <option value={4}>4 beats</option>
              </select>
            )}

            {/* Separador visual */}
            <div className="h-4 w-px bg-gray-200 hidden sm:block" />

            <div className="flex gap-1">
              {SONIDOS_METRO.map((s) => (
                <button key={s.v}
                  onClick={() => { seq.setSonido(s.v); motorRef.current?.actualizarSonido(s.v, seq.volumen); }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    seq.sonido === s.v
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {s.etiqueta}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-gray-400">Vol</span>
              <input
                type="range" min={0} max={1} step={0.1} value={seq.volumen}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  seq.setVolumen(v);
                  motorRef.current?.actualizarSonido(seq.sonido, v);
                }}
                className="w-20 h-1 accent-gray-900 cursor-pointer"
                aria-label="Volumen de la secuencia"
              />
            </div>
          </div>

          {/* Zona 2: Acciones de archivo */}
          <div className="flex gap-2 flex-wrap items-center">
            {/* Guardar en cuenta — acción prioritaria si hay userId */}
            {userId && (
              <button
                onClick={() => { setNombreGuardar(""); setModalGuardar(true); }}
                disabled={seq.guardandoEnBD}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white
                  text-xs font-semibold hover:bg-gray-700 disabled:opacity-50 transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                </svg>
                {seq.guardandoEnBD ? "Guardando…" : "Guardar"}
              </button>
            )}

            {/* JSON export */}
            <button
              onClick={seq.exportarJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700
                text-xs font-semibold hover:bg-gray-200 transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              JSON
            </button>

            {/* JSON import */}
            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100
              text-gray-700 text-xs font-semibold hover:bg-gray-200 transition-all cursor-pointer">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              Importar
              <input
                type="file" accept=".json" className="hidden"
                onChange={(e) => e.target.files?.[0] && seq.importarJSON(e.target.files[0])}
              />
            </label>

            {/* WAV export */}
            <button
              onClick={exportarAudio}
              disabled={exportando || seq.secciones.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700
                text-xs font-semibold hover:bg-gray-200 disabled:opacity-40
                disabled:cursor-not-allowed transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
              </svg>
              {exportando ? `${Math.round(progresoExportar * 100)}%` : "WAV"}
            </button>
          </div>

          {/* Barra de progreso de exportación */}
          {exportando && (
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gray-900 rounded-full transition-all duration-300"
                style={{ width: `${progresoExportar * 100}%` }}
              />
            </div>
          )}

          {/* Error de BD */}
          {seq.errores && (
            <p className="text-xs text-red-500 font-medium">{seq.errores}</p>
          )}
        </div>
      </div>

      {/* ── PANEL EDITOR ──────────────────────────────────── */}
      {/* Desktop: columna fija lateral | Mobile: bottom sheet con overlay */}
      <>
        {/* Overlay mobile */}
        {panelEditorAbierto && (
          <div
            className="fixed inset-0 bg-black/20 z-40 lg:hidden"
            onClick={() => setPanelEditorAbierto(false)}
          />
        )}

        <div className={`
          bg-white overflow-y-auto
          lg:w-80 xl:w-96 lg:border-l lg:border-gray-100 lg:flex lg:flex-col
          ${panelEditorAbierto
            ? "fixed bottom-0 left-0 right-0 z-50 max-h-[85dvh] rounded-t-2xl border-t border-gray-200 shadow-2xl lg:relative lg:inset-auto lg:shadow-none lg:rounded-none lg:border-0"
            : "hidden lg:flex"}
        `}>
          <EditorSeccion
            seccion={seccionActual}
            onActualizar={seq.actualizarSeccion}
            onCerrar={() => setPanelEditorAbierto(false)}
          />
        </div>
      </>

      {/* ── MODAL GUARDAR EN BD ───────────────────────────── */}
      {modalGuardar && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center
          bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-sm font-bold text-gray-900 mb-1">Guardar secuencia</h3>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              Se guardará en tu cuenta y estará disponible desde cualquier dispositivo.
            </p>
            <input
              type="text"
              placeholder="Nombre de la secuencia…"
              value={nombreGuardar}
              onChange={(e) => setNombreGuardar(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirmarGuardar()}
              autoFocus
              maxLength={120}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold
                text-gray-900 focus:outline-none focus:border-gray-400 transition-colors mb-4"
            />
            {seq.errores && (
              <p className="text-xs text-red-500 mb-3">{seq.errores}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setModalGuardar(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold
                  text-gray-600 hover:bg-gray-50 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarGuardar}
                disabled={!nombreGuardar.trim() || seq.guardandoEnBD}
                className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold
                  hover:bg-gray-700 disabled:opacity-40 transition-all"
              >
                {seq.guardandoEnBD ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}