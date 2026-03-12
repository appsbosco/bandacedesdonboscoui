/* eslint-disable react/prop-types */
import { useState } from "react";
import { COMPASES_DISPONIBLES, SUBDIVISIONES, PRESETS_ACENTO } from "../../../../../modules/practica/constants/index.js";
import { generarPatronAcento } from "../../../../../modules/practica/utils/teoria.js";

export function EditorSeccion({ seccion, onActualizar, onCerrar }) {
  const [mostrarPresets, setMostrarPresets] = useState(false);

  if (!seccion) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-16 px-8">
        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-gray-700 mb-1">Selecciona una sección</p>
        <p className="text-xs text-gray-400 leading-relaxed">
          Toca cualquier sección del timeline para editarla aquí
        </p>
      </div>
    );
  }

  const presets = PRESETS_ACENTO[String(seccion.compas.numerador)] || [];

  const actualizarTempo = (parche) =>
    onActualizar(seccion.id, { tempo: { ...seccion.tempo, ...parche } });

  return (
    <div className="flex flex-col h-full">
      {/* Header sticky */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
        <h3 className="text-sm font-bold text-gray-900">Editar sección</h3>
        {onCerrar && (
          <button onClick={onCerrar}
            className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
            aria-label="Cerrar editor">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-5 p-5">

          {/* Nombre */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
              Nombre
            </label>
            <input
              type="text"
              value={seccion.nombre}
              onChange={(e) => onActualizar(seccion.id, { nombre: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold
                text-gray-900 focus:outline-none focus:border-gray-400 transition-colors bg-white"
              placeholder="Ej: Intro, Verso, Coro…"
              maxLength={80}
            />
          </div>

          {/* Compás + Repeticiones */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                Compás
              </label>
              <select
                value={`${seccion.compas.numerador}/${seccion.compas.denominador}`}
                onChange={(e) => {
                  const [num, den] = e.target.value.split("/").map(Number);
                  onActualizar(seccion.id, {
                    compas: { numerador: num, denominador: den },
                    patronAcento: generarPatronAcento(num),
                  });
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold
                  text-gray-900 focus:outline-none focus:border-gray-400 bg-white"
              >
                {COMPASES_DISPONIBLES.map((c) => (
                  <option key={`${c.num}/${c.den}`} value={`${c.num}/${c.den}`}>
                    {c.num}/{c.den}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                Repeticiones
              </label>
              <input
                type="number" min={1} max={999} value={seccion.repeticiones}
                onChange={(e) => onActualizar(seccion.id, {
                  repeticiones: Math.max(1, parseInt(e.target.value) || 1),
                })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold
                  text-gray-900 focus:outline-none focus:border-gray-400 text-center bg-white"
              />
            </div>
          </div>

          {/* Tempo */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                Tempo
              </label>
              <button
                onClick={() => {
                  if (seccion.tempo.tipo === "fijo") {
                    actualizarTempo({ tipo: "curva", inicio: seccion.tempo.bpm, fin: seccion.tempo.bpm + 20, curva: "lineal" });
                  } else {
                    actualizarTempo({ tipo: "fijo", bpm: seccion.tempo.inicio || 120 });
                  }
                }}
                className="text-[11px] font-semibold text-gray-500 hover:text-gray-700 underline underline-offset-2 transition-colors"
              >
                {seccion.tempo.tipo === "fijo" ? "Añadir curva" : "Tempo fijo"}
              </button>
            </div>

            {seccion.tempo.tipo === "fijo" ? (
              <div>
                <input
                  type="number" min={20} max={300} value={seccion.tempo.bpm}
                  onChange={(e) => actualizarTempo({ bpm: Math.max(20, Math.min(300, parseInt(e.target.value) || 120)) })}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xl font-black
                    text-gray-900 focus:outline-none focus:border-gray-400 text-center bg-white font-mono"
                />
                <p className="text-[10px] text-gray-400 text-center mt-1.5">BPM constante</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "inicio", label: "Inicio BPM", val: seccion.tempo.inicio },
                    { key: "fin",    label: "Final BPM",  val: seccion.tempo.fin    },
                  ].map(({ key, label, val }) => (
                    <div key={key}>
                      <label className="block text-[10px] text-gray-400 mb-1.5">{label}</label>
                      <input
                        type="number" min={20} max={300} value={val}
                        onChange={(e) => actualizarTempo({ [key]: Math.max(20, Math.min(300, parseInt(e.target.value) || 120)) })}
                        className="w-full px-2 py-2 rounded-lg border border-gray-200 text-sm font-bold
                          text-center text-gray-900 focus:outline-none bg-white"
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1.5">Tipo de curva</label>
                  <select value={seccion.tempo.curva}
                    onChange={(e) => actualizarTempo({ curva: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none bg-white">
                    <option value="lineal">Lineal — cambio constante</option>
                    <option value="exponencial">Exponencial — acelera al final</option>
                    <option value="logaritmica">Logarítmica — acelera al inicio</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 bg-white rounded-lg px-3 py-2 border border-gray-100">
                  <span>{seccion.tempo.inicio < seccion.tempo.fin ? "↗ Accelerando" : "↘ Ritardando"}</span>
                  <span className="font-semibold text-gray-700 ml-auto">
                    {Math.abs((seccion.tempo.fin || 0) - (seccion.tempo.inicio || 0))} BPM
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Subdivisión */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
              Subdivisión
            </label>
            <div className="flex gap-1.5">
              {SUBDIVISIONES.map((s) => (
                <button key={s.v}
                  onClick={() => onActualizar(seccion.id, { subdivision: s.v })}
                  className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    seccion.subdivision === s.v
                      ? "bg-gray-900 border-gray-900 text-white"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}>
                  <span className="block text-base">{s.simbolo}</span>
                  <span className="text-[9px] text-gray-400">{s.etiqueta}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Acentos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                Acentos
              </label>
              {presets.length > 0 && (
                <button onClick={() => setMostrarPresets(!mostrarPresets)}
                  className="text-[11px] font-semibold text-gray-500 hover:text-gray-700 transition-colors">
                  {mostrarPresets ? "Ocultar" : "Presets"}
                </button>
              )}
            </div>

            {mostrarPresets && presets.length > 0 && (
              <div className="mb-3 rounded-xl bg-gray-50 border border-gray-100 p-3 flex flex-col gap-1.5">
                {presets.map((p, i) => (
                  <button key={i}
                    onClick={() => { onActualizar(seccion.id, { patronAcento: p.patron }); setMostrarPresets(false); }}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white
                      border border-transparent hover:border-gray-200 transition-all text-left">
                    <span className="text-xs font-semibold text-gray-700">{p.nombre}</span>
                    <span className="text-xs text-gray-400 font-mono tracking-widest">
                      {p.patron.map((v) => (v ? "●" : "○")).join(" ")}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-1.5 flex-wrap">
              {(seccion.patronAcento || []).map((acento, i) => (
                <button key={i}
                  onClick={() => {
                    const nuevo = [...seccion.patronAcento];
                    nuevo[i] = nuevo[i] ? 0 : 1;
                    onActualizar(seccion.id, { patronAcento: nuevo });
                  }}
                  className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                    acento ? "bg-gray-900 text-white shadow-sm" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                  aria-pressed={!!acento}
                  aria-label={`Beat ${i + 1}: ${acento ? "acento activado" : "sin acento"}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-2">
              Activa o desactiva los beats con acento
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}