/* eslint-disable react/prop-types */
/**
 * AfinadorMetronomo.jsx
 * ─────────────────────────────────────────────────────────────
 * Módulo premium: Afinador · Metrónomo · Guía Musical
 * Stack: React funcional · Tailwind CSS · Web Audio API
 * Idioma: Español completo
 * Versión: 2.0 — Motor unificado, modo secciones, audio profesional
 * ─────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ════════════════════════════════════════════════════════════
// CONSTANTES GLOBALES Y DATOS DE REFERENCIA
// ════════════════════════════════════════════════════════════

const NOMBRES_NOTAS = [
  "Do",
  "Do#",
  "Re",
  "Re#",
  "Mi",
  "Fa",
  "Fa#",
  "Sol",
  "Sol#",
  "La",
  "La#",
  "Si",
];
const NOMBRES_ANGLOSAJONES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const ENARMONICOS = {
  "Do#": "Re♭",
  "Re#": "Mi♭",
  "Fa#": "Sol♭",
  "Sol#": "La♭",
  "La#": "Si♭",
};

const COMPASES_DISPONIBLES = [
  { num: 2, den: 4 },
  { num: 3, den: 4 },
  { num: 4, den: 4 },
  { num: 5, den: 4 },
  { num: 6, den: 4 },
  { num: 7, den: 4 },
  { num: 3, den: 8 },
  { num: 5, den: 8 },
  { num: 6, den: 8 },
  { num: 7, den: 8 },
  { num: 9, den: 8 },
  { num: 12, den: 8 },
];

const SUBDIVISIONES = [
  { v: 1, etiqueta: "Negras", simbolo: "♩" },
  { v: 2, etiqueta: "Corcheas", simbolo: "♪" },
  { v: 3, etiqueta: "Tresillos", simbolo: "³" },
  { v: 4, etiqueta: "Semicorcheas", simbolo: "♬" },
];

const SONIDOS_METRO = [
  { v: "click", etiqueta: "Click" },
  { v: "madera", etiqueta: "Madera" },
  { v: "digital", etiqueta: "Digital" },
  { v: "suave", etiqueta: "Suave" },
];

const PRESETS_ACENTO = {
  2: [
    { nombre: "Estándar", patron: [1, 0] },
    { nombre: "Doble", patron: [1, 1] },
  ],
  3: [
    { nombre: "Vals", patron: [1, 0, 0] },
    { nombre: "Todos", patron: [1, 1, 1] },
  ],
  4: [
    { nombre: "Estándar", patron: [1, 0, 0, 0] },
    { nombre: "2 y 4", patron: [0, 1, 0, 1] },
    { nombre: "1 y 3", patron: [1, 0, 1, 0] },
    { nombre: "Todos", patron: [1, 1, 1, 1] },
  ],
  5: [
    { nombre: "3+2", patron: [1, 0, 0, 1, 0] },
    { nombre: "2+3", patron: [1, 0, 1, 0, 0] },
    { nombre: "Estándar", patron: [1, 0, 0, 0, 0] },
  ],
  6: [
    { nombre: "3+3", patron: [1, 0, 0, 1, 0, 0] },
    { nombre: "2+2+2", patron: [1, 0, 1, 0, 1, 0] },
    { nombre: "Estándar", patron: [1, 0, 0, 0, 0, 0] },
  ],
  7: [
    { nombre: "2+2+3", patron: [1, 0, 1, 0, 1, 0, 0] },
    { nombre: "3+2+2", patron: [1, 0, 0, 1, 0, 1, 0] },
    { nombre: "2+3+2", patron: [1, 0, 1, 0, 0, 1, 0] },
    { nombre: "Estándar", patron: [1, 0, 0, 0, 0, 0, 0] },
  ],
  9: [
    { nombre: "3+3+3", patron: [1, 0, 0, 1, 0, 0, 1, 0, 0] },
    { nombre: "Estándar", patron: [1, 0, 0, 0, 0, 0, 0, 0, 0] },
  ],
  12: [
    { nombre: "3+3+3+3", patron: [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0] },
    { nombre: "4+4+4", patron: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0] },
    { nombre: "Estándar", patron: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  ],
};

const PRESETS_BPM_RAPIDO = [
  { bpm: 60, nombre: "Largo" },
  { bpm: 76, nombre: "Andante" },
  { bpm: 96, nombre: "Moderato" },
  { bpm: 120, nombre: "Allegro" },
  { bpm: 144, nombre: "Vivace" },
  { bpm: 176, nombre: "Presto" },
];

// ════════════════════════════════════════════════════════════
// UTILS: TEORÍA MUSICAL
// ════════════════════════════════════════════════════════════

function construirNotas(a4 = 440) {
  const notas = [];
  for (let midi = 21; midi <= 108; midi++) {
    const semitonos = midi - 69;
    const freq = a4 * Math.pow(2, semitonos / 12);
    const octava = Math.floor(midi / 12) - 1;
    const indice = midi % 12;
    const nombre = NOMBRES_NOTAS[indice];
    const nombreEn = NOMBRES_ANGLOSAJONES[indice];
    notas.push({ midi, freq, nombre, nombreEn, octava, enarmonico: ENARMONICOS[nombre] || null });
  }
  return notas;
}

function notaMasCercana(freq, notas) {
  let mejor = null,
    mejorDiff = Infinity;
  for (const n of notas) {
    const diff = Math.abs(freq - n.freq);
    if (diff < mejorDiff) {
      mejorDiff = diff;
      mejor = n;
    }
  }
  return mejor;
}

function calcularCents(freq, freqRef) {
  return 1200 * Math.log2(freq / freqRef);
}

function generarPatronAcento(numerador) {
  return Array.from({ length: numerador }, (_, i) => (i === 0 ? 1 : 0));
}

// ════════════════════════════════════════════════════════════
// UTILS: AUDIO / DSP
// ════════════════════════════════════════════════════════════

function aplicarVentanaHamming(buf) {
  const out = new Float32Array(buf.length);
  for (let i = 0; i < buf.length; i++) {
    out[i] = buf[i] * (0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (buf.length - 1)));
  }
  return out;
}

function calcularRMS(buf) {
  let suma = 0;
  for (let i = 0; i < buf.length; i++) suma += buf[i] * buf[i];
  return Math.sqrt(suma / buf.length);
}

function algoritmoyYIN(buf, sampleRate) {
  const umbral = 0.08;
  const mitad = Math.floor(buf.length / 2);
  const d = new Float32Array(mitad);
  for (let tau = 1; tau < mitad; tau++) {
    for (let i = 0; i < mitad; i++) {
      const delta = buf[i] - buf[i + tau];
      d[tau] += delta * delta;
    }
  }
  d[0] = 1;
  let acumulado = 0;
  for (let tau = 1; tau < mitad; tau++) {
    acumulado += d[tau];
    d[tau] = acumulado === 0 ? 0 : (d[tau] * tau) / acumulado;
  }
  let tau = 2;
  while (tau < mitad) {
    if (d[tau] < umbral) {
      while (tau + 1 < mitad && d[tau + 1] < d[tau]) tau++;
      break;
    }
    tau++;
  }
  if (tau === mitad || d[tau] >= umbral) return -1;
  const x0 = tau > 1 ? tau - 1 : tau;
  const x2 = tau < mitad - 1 ? tau + 1 : tau;
  if (x0 === tau) return d[tau] <= d[x2] ? sampleRate / tau : sampleRate / x2;
  if (x2 === tau) return d[tau] <= d[x0] ? sampleRate / tau : sampleRate / x0;
  const s0 = d[x0],
    s1 = d[tau],
    s2 = d[x2];
  const a = (s0 + s2 - 2 * s1) / 2;
  const b = (s2 - s0) / 2;
  const refinado = a === 0 ? tau : tau - b / (2 * a);
  return sampleRate / refinado;
}

// ════════════════════════════════════════════════════════════
// MOTOR DE AUDIO: MetronomeEngine (clase pura, sin React)
// Usa AudioContext.currentTime para timing preciso (no setTimeout)
// Lookahead de 100ms, intervalo de schedule de 25ms
// ════════════════════════════════════════════════════════════

class MotorMetronomo {
  constructor() {
    this.ctx = null;
    this.ticks = [];
    this.tickIndex = 0;
    this.startTime = 0;
    this.pauseOffset = 0;
    this.estado = "detenido"; // detenido | reproduciendo | pausado
    this.timerID = null;
    this.lookahead = 0.1;
    this.intervaloSchedule = 25;
    this.onTick = null;
    this.onFin = null;
    this._sonido = "click";
    this._volumen = 0.8;
  }

  _obtenerCtx() {
    if (!this.ctx || this.ctx.state === "closed") {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  }

  _calcularBpm(tempo, progreso) {
    if (tempo.tipo === "fijo") return tempo.bpm;
    const { inicio, fin, curva } = tempo;
    const rango = fin - inicio;
    switch (curva) {
      case "exponencial":
        return inicio + rango * Math.pow(progreso, 2);
      case "logaritmica":
        return inicio + rango * Math.sqrt(Math.max(0, progreso));
      default:
        return inicio + rango * progreso; // lineal
    }
  }

  compilar(secciones, desdeSeccionId, countInHabilitado, countInBeats) {
    this.ticks = [];
    let tiempoActual = 0;

    let seccionesACompilar = secciones;
    if (desdeSeccionId !== undefined) {
      const idx = secciones.findIndex((s) => s.id === desdeSeccionId);
      if (idx !== -1) seccionesACompilar = secciones.slice(idx);
    }

    // Count-in
    if (countInHabilitado && countInBeats > 0 && seccionesACompilar.length > 0) {
      const primera = seccionesACompilar[0];
      const bpmCountIn = primera.tempo.tipo === "fijo" ? primera.tempo.bpm : primera.tempo.inicio;
      const durBeat = 60 / bpmCountIn;
      for (let i = 0; i < countInBeats; i++) {
        this.ticks.push({
          tiempo: tiempoActual,
          esAcento: i === 0,
          seccionId: -1,
          nombreSeccion: "Preparación",
          numeroBeat: i + 1,
          numeroCompas: 0,
          bpmActual: bpmCountIn,
        });
        tiempoActual += durBeat;
      }
    }

    for (const sec of seccionesACompilar) {
      const beatsTotal = sec.repeticiones * sec.compas.numerador;
      for (let compas = 0; compas < sec.repeticiones; compas++) {
        for (let beat = 0; beat < sec.compas.numerador; beat++) {
          const beatAbsoluto = compas * sec.compas.numerador + beat;
          const progreso = beatsTotal > 0 ? beatAbsoluto / beatsTotal : 0;
          const bpm = this._calcularBpm(sec.tempo, progreso);
          const durBeat = 60 / bpm;
          const esAcento = Array.isArray(sec.patronAcento)
            ? sec.patronAcento[beat] === 1
            : beat === 0;

          this.ticks.push({
            tiempo: tiempoActual,
            esAcento,
            seccionId: sec.id,
            nombreSeccion: sec.nombre,
            numeroBeat: beat + 1,
            numeroCompas: compas + 1,
            bpmActual: Math.round(bpm * 10) / 10,
          });
          tiempoActual += durBeat;

          // Subdivisiones
          if (sec.subdivision > 1) {
            const durSub = durBeat / sec.subdivision;
            for (let s = 1; s < sec.subdivision; s++) {
              this.ticks.push({
                tiempo: tiempoActual - durBeat + durSub * s,
                esAcento: false,
                seccionId: sec.id,
                nombreSeccion: sec.nombre,
                numeroBeat: beat + 1,
                numeroCompas: compas + 1,
                bpmActual: Math.round(bpm * 10) / 10,
                esSubdivision: true,
              });
            }
          }
        }
      }
    }

    // Ordenar por tiempo (subdivisiones pueden quedar desorden)
    this.ticks.sort((a, b) => a.tiempo - b.tiempo);
  }

  _tocarClick(tiempo, esAcento, esCountIn, sonido, volumen) {
    if (!this.ctx) return;
    const gain = this.ctx.createGain();
    gain.connect(this.ctx.destination);

    const volBase = esCountIn ? volumen * 0.7 : volumen;
    const volFinal = esAcento ? volBase : volBase * 0.5;
    gain.gain.setValueAtTime(0, tiempo);
    gain.gain.linearRampToValueAtTime(volFinal, tiempo + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.001, tiempo + 0.055);

    const osc = this.ctx.createOscillator();
    osc.connect(gain);

    let freqAc, freqNorm, tipo;
    switch (sonido) {
      case "madera":
        freqAc = 750;
        freqNorm = 550;
        tipo = "triangle";
        break;
      case "digital":
        freqAc = 2200;
        freqNorm = 1400;
        tipo = "sine";
        break;
      case "suave":
        freqAc = 880;
        freqNorm = 660;
        tipo = "sine";
        break;
      default:
        freqAc = 1700;
        freqNorm = 1100;
        tipo = "square"; // click
    }
    if (esCountIn) {
      freqAc = 1400;
      freqNorm = 1000;
      tipo = "sine";
    }

    osc.type = tipo;
    osc.frequency.setValueAtTime(esAcento ? freqAc : freqNorm, tiempo);
    osc.start(tiempo);
    osc.stop(tiempo + 0.06);
  }

  _scheduler() {
    if (this.estado !== "reproduciendo" || !this.ctx) return;
    const ahora = this.ctx.currentTime;
    const ventana = ahora - this.startTime + this.lookahead;

    while (this.tickIndex < this.ticks.length && this.ticks[this.tickIndex].tiempo < ventana) {
      const tick = this.ticks[this.tickIndex];
      const tiempoAbs = this.startTime + tick.tiempo;
      const esCountIn = tick.numeroCompas === 0;

      this._tocarClick(tiempoAbs, tick.esAcento, esCountIn, this._sonido, this._volumen);

      if (this.onTick) {
        const delay = Math.max(0, (tiempoAbs - ahora) * 1000);
        setTimeout(() => {
          if (this.estado === "reproduciendo") this.onTick(tick);
        }, delay);
      }
      this.tickIndex++;
    }

    if (this.tickIndex >= this.ticks.length) {
      clearInterval(this.timerID);
      this.timerID = null;
      this.estado = "detenido";
      if (this.onFin) setTimeout(() => this.onFin(), 200);
      return;
    }
  }

  reproducir(secciones, desdeSeccionId, countIn, countInBeats, sonido, volumen) {
    if (this.estado === "reproduciendo") return;
    this._sonido = sonido;
    this._volumen = volumen;
    const ctx = this._obtenerCtx();

    if (this.estado === "pausado" && desdeSeccionId === undefined) {
      // Reanudar
      this.startTime = ctx.currentTime - this.pauseOffset;
      this.estado = "reproduciendo";
      this.timerID = setInterval(() => this._scheduler(), this.intervaloSchedule);
      return;
    }

    this.compilar(secciones, desdeSeccionId, countIn, countInBeats);
    if (this.ticks.length === 0) return;

    this.estado = "reproduciendo";
    this.tickIndex = 0;
    this.startTime = ctx.currentTime + 0.05;
    this.timerID = setInterval(() => this._scheduler(), this.intervaloSchedule);
  }

  pausar() {
    if (this.estado !== "reproduciendo") return;
    this.pauseOffset = this.ctx ? this.ctx.currentTime - this.startTime : 0;
    clearInterval(this.timerID);
    this.timerID = null;
    this.estado = "pausado";
  }

  detener() {
    clearInterval(this.timerID);
    this.timerID = null;
    this.estado = "detenido";
    this.tickIndex = 0;
    this.pauseOffset = 0;
  }

  // Metrónomo simple (loop infinito)
  iniciarSimple(config) {
    // Para modo rápido, construimos sección infinita
    const seccion = {
      id: "rapido",
      nombre: "Rápido",
      compas: { numerador: config.pulsaciones, denominador: 4 },
      tempo: { tipo: "fijo", bpm: config.bpm },
      subdivision: config.subdivision,
      patronAcento: generarPatronAcento(config.pulsaciones),
      repeticiones: 9999,
    };
    this._sonido = config.sonido;
    this._volumen = config.volumen;
    const ctx = this._obtenerCtx();
    this.compilar([seccion], undefined, false, 0);
    this.estado = "reproduciendo";
    this.tickIndex = 0;
    this.startTime = ctx.currentTime + 0.05;
    this.timerID = setInterval(() => this._scheduler(), this.intervaloSchedule);
  }

  actualizarSonido(sonido, volumen) {
    this._sonido = sonido;
    this._volumen = volumen;
  }

  async exportarWAV(secciones, countIn, countInBeats, onProgreso) {
    this.compilar(secciones, undefined, countIn, countInBeats);
    if (this.ticks.length === 0) throw new Error("Sin contenido");
    const ultimoTick = this.ticks[this.ticks.length - 1];
    const duracion = ultimoTick.tiempo + 1;
    const sampleRate = 44100;
    const offCtx = new OfflineAudioContext(1, Math.ceil(duracion * sampleRate), sampleRate);

    this.ticks.forEach((tick, i) => {
      const esCountIn = tick.numeroCompas === 0;
      this._renderClickOffline(offCtx, tick.tiempo, tick.esAcento, esCountIn);
      if (onProgreso && i % 20 === 0) onProgreso((i / this.ticks.length) * 0.6);
    });

    onProgreso?.(0.6);
    const buffer = await offCtx.startRendering();
    onProgreso?.(0.8);
    const blob = this._audioBufferAWav(buffer);
    onProgreso?.(1);
    return blob;
  }

  _renderClickOffline(ctx, tiempo, esAcento, esCountIn) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const freqAc = esCountIn ? 1400 : 1200;
    const freqNorm = esCountIn ? 1000 : 800;
    osc.type = "sine";
    osc.frequency.value = esAcento ? freqAc : freqNorm;
    gain.gain.setValueAtTime(0, tiempo);
    gain.gain.linearRampToValueAtTime(esAcento ? 0.3 : 0.15, tiempo + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.001, tiempo + 0.055);
    osc.start(tiempo);
    osc.stop(tiempo + 0.06);
  }

  _audioBufferAWav(buffer) {
    const length = buffer.length * 2;
    const ab = new ArrayBuffer(44 + length);
    const view = new DataView(ab);
    let pos = 0;
    const s16 = (v) => {
      view.setUint16(pos, v, true);
      pos += 2;
    };
    const s32 = (v) => {
      view.setUint32(pos, v, true);
      pos += 4;
    };
    s32(0x46464952);
    s32(36 + length);
    s32(0x45564157);
    s32(0x20746d66);
    s32(16);
    s16(1);
    s16(1);
    s32(buffer.sampleRate);
    s32(buffer.sampleRate * 2);
    s16(2);
    s16(16);
    s32(0x61746164);
    s32(length);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const s = Math.max(-1, Math.min(1, data[i]));
      view.setInt16(pos, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      pos += 2;
    }
    return new Blob([ab], { type: "audio/wav" });
  }

  destruir() {
    this.detener();
    this.ctx?.close();
    this.ctx = null;
  }
}

// ════════════════════════════════════════════════════════════
// HOOK: usePitchDetection
// ════════════════════════════════════════════════════════════

function usePitchDetection(a4Ref) {
  const [estado, setEstado] = useState({
    nota: null,
    freq: 0,
    cents: 0,
    confianza: 0,
    activo: false,
  });
  const [estadoMic, setEstadoMic] = useState("inactivo");
  const [errorMic, setErrorMic] = useState(null);

  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const freqSuavRef = useRef(null);
  const notaEstableRef = useRef(null);
  const contadorRef = useRef(0);
  const centsSuavRef = useRef(0);
  const activoRef = useRef(false);

  const iniciar = useCallback(async () => {
    if (estadoMic === "activo") return;
    setEstadoMic("solicitando");
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === "suspended") await ctx.resume();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      const fuente = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 4096;
      fuente.connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      streamRef.current = stream;
      activoRef.current = true;
      setEstadoMic("activo");
      setErrorMic(null);
      bucle();
    } catch (e) {
      setErrorMic(e.message || "Acceso denegado");
      setEstadoMic("error");
    }
  }, [estadoMic]);

  const detener = useCallback(() => {
    activoRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    analyserRef.current = null;
    streamRef.current = null;
    freqSuavRef.current = null;
    notaEstableRef.current = null;
    contadorRef.current = 0;
    centsSuavRef.current = 0;
    setEstadoMic("inactivo");
    setEstado({ nota: null, freq: 0, cents: 0, confianza: 0, activo: false });
  }, []);

  function bucle() {
    if (!activoRef.current || !analyserRef.current) return;
    const buf = new Float32Array(analyserRef.current.fftSize);
    analyserRef.current.getFloatTimeDomainData(buf);
    const nivel = calcularRMS(buf);

    if (nivel < 0.007) {
      freqSuavRef.current = null;
      contadorRef.current = 0;
      centsSuavRef.current = 0;
      setEstado((s) => ({ ...s, nota: null, freq: 0, cents: 0, confianza: 0, activo: false }));
    } else {
      const ventana = aplicarVentanaHamming(buf);
      const pitch = algoritmoyYIN(ventana, audioCtxRef.current.sampleRate);
      if (pitch > 50 && pitch < 2200) {
        const alpha = 0.2;
        freqSuavRef.current =
          freqSuavRef.current == null ? pitch : alpha * pitch + (1 - alpha) * freqSuavRef.current;
        const notas = construirNotas(a4Ref.current);
        const cercana = notaMasCercana(freqSuavRef.current, notas);
        const centsRaw = calcularCents(freqSuavRef.current, cercana.freq);
        centsSuavRef.current = 0.3 * centsRaw + 0.7 * centsSuavRef.current;
        const clave = cercana.nombre + cercana.octava;
        if (notaEstableRef.current === clave) contadorRef.current++;
        else {
          notaEstableRef.current = clave;
          contadorRef.current = 1;
        }
        if (contadorRef.current >= 3) {
          setEstado({
            nota: cercana,
            freq: freqSuavRef.current,
            cents: centsSuavRef.current,
            confianza: Math.min(1, nivel * 12),
            activo: true,
          });
        }
      }
    }
    rafRef.current = requestAnimationFrame(bucle);
  }

  useEffect(() => () => detener(), []);
  return { estado, estadoMic, errorMic, iniciar, detener };
}

// ════════════════════════════════════════════════════════════
// HOOK: useMetronomoRapido
// ════════════════════════════════════════════════════════════

const CONFIG_RAPIDO_DEFAULT = {
  bpm: 120,
  pulsaciones: 4,
  subdivision: 1,
  sonido: "click",
  volumen: 0.8,
};

function useMetronomoRapido(motor) {
  const [config, setConfig] = useState(() => {
    try {
      const g = localStorage.getItem("metro_rapido_v3");
      return g ? { ...CONFIG_RAPIDO_DEFAULT, ...JSON.parse(g) } : CONFIG_RAPIDO_DEFAULT;
    } catch {
      return CONFIG_RAPIDO_DEFAULT;
    }
  });
  const [ejecutando, setEjecutando] = useState(false);
  const [pulso, setPulso] = useState({ beat: 0, acento: false });
  const configRef = useRef(config);
  configRef.current = config;
  const tapsRef = useRef([]);

  const guardar = (nueva) => {
    try {
      localStorage.setItem("metro_rapido_v3", JSON.stringify(nueva));
    } catch {}
  };

  const actualizar = useCallback(
    (parche) => {
      setConfig((c) => {
        const nueva = { ...c, ...parche };
        guardar(nueva);
        if (motor.current?.estado === "reproduciendo") {
          motor.current.detener();
          setTimeout(() => {
            if (motor.current) {
              motor.current.onTick = (tick) =>
                !tick.esSubdivision &&
                setPulso({ beat: tick.numeroBeat - 1, acento: tick.esAcento });
              motor.current.iniciarSimple(nueva);
            }
          }, 20);
        }
        motor.current?.actualizarSonido(nueva.sonido, nueva.volumen);
        return nueva;
      });
    },
    [motor]
  );

  const alternar = useCallback(() => {
    if (!motor.current) return;
    if (ejecutando) {
      motor.current.detener();
      setEjecutando(false);
      setPulso({ beat: 0, acento: false });
    } else {
      motor.current.onTick = (tick) =>
        !tick.esSubdivision && setPulso({ beat: tick.numeroBeat - 1, acento: tick.esAcento });
      motor.current.onFin = () => {};
      motor.current.iniciarSimple(configRef.current);
      setEjecutando(true);
    }
  }, [ejecutando, motor]);

  const tap = useCallback(() => {
    const ahora = Date.now();
    tapsRef.current = [...tapsRef.current.filter((t) => ahora - t < 5000), ahora];
    if (tapsRef.current.length >= 2) {
      const intervalos = tapsRef.current.slice(1).map((t, i) => t - tapsRef.current[i]);
      const promedio = intervalos.reduce((a, b) => a + b) / intervalos.length;
      const bpm = Math.round(60000 / promedio);
      if (bpm >= 20 && bpm <= 300) actualizar({ bpm });
    }
  }, [actualizar]);

  // Vibración en acento
  useEffect(() => {
    if (pulso.acento && navigator.vibrate) navigator.vibrate(20);
  }, [pulso]);

  return { config, ejecutando, pulso, alternar, actualizar, tap };
}

// ════════════════════════════════════════════════════════════
// HOOK: useMetronomoSecuencia
// ════════════════════════════════════════════════════════════

function crearSeccion(sobreescribir = {}) {
  return {
    id: Date.now() + Math.random(),
    nombre: "Nueva sección",
    compas: { numerador: 4, denominador: 4 },
    tempo: { tipo: "fijo", bpm: 120 },
    subdivision: 1,
    patronAcento: [1, 0, 0, 0],
    repeticiones: 4,
    ...sobreescribir,
  };
}

function useMetronomoSecuencia(motor) {
  const [secciones, setSecciones] = useState(() => {
    try {
      const g = sessionStorage.getItem("metro_secciones_v3");
      if (g) {
        const parsed = JSON.parse(g);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      crearSeccion({
        nombre: "Intro",
        compas: { numerador: 4, denominador: 4 },
        tempo: { tipo: "fijo", bpm: 96 },
        repeticiones: 2,
      }),
      crearSeccion({ nombre: "Desarrollo", tempo: { tipo: "fijo", bpm: 120 }, repeticiones: 4 }),
      crearSeccion({
        nombre: "Clímax",
        tempo: { tipo: "curva", inicio: 120, fin: 150, curva: "lineal" },
        repeticiones: 4,
      }),
    ];
  });
  const [estadoRepro, setEstadoRepro] = useState("detenido");
  const [tickActual, setTickActual] = useState(null);
  const [countIn, setCountIn] = useState(true);
  const [countInBeats, setCountInBeats] = useState(2);
  const [sonido, setSonido] = useState("click");
  const [volumen, setVolumen] = useState(0.8);

  useEffect(() => {
    if (secciones.length > 0) {
      try {
        sessionStorage.setItem("metro_secciones_v3", JSON.stringify(secciones));
      } catch {}
    }
  }, [secciones]);

  const arrancarMotor = useCallback(
    (desdeId) => {
      if (!motor.current) return;
      motor.current.onTick = (tick) => setTickActual(tick);
      motor.current.onFin = () => {
        setEstadoRepro("detenido");
        setTickActual(null);
      };
      motor.current.reproducir(secciones, desdeId, countIn, countInBeats, sonido, volumen);
      setEstadoRepro("reproduciendo");
    },
    [motor, secciones, countIn, countInBeats, sonido, volumen]
  );

  const pausarReanudar = useCallback(() => {
    if (!motor.current) return;
    if (estadoRepro === "reproduciendo") {
      motor.current.pausar();
      setEstadoRepro("pausado");
    } else if (estadoRepro === "pausado") {
      motor.current.reproducir(secciones, undefined, countIn, countInBeats, sonido, volumen);
      setEstadoRepro("reproduciendo");
    } else {
      arrancarMotor();
    }
  }, [estadoRepro, arrancarMotor, motor, secciones, countIn, countInBeats, sonido, volumen]);

  const detener = useCallback(() => {
    motor.current?.detener();
    setEstadoRepro("detenido");
    setTickActual(null);
  }, [motor]);

  const reproducirDesde = useCallback(
    (id) => {
      motor.current?.detener();
      setTimeout(() => arrancarMotor(id), 30);
    },
    [arrancarMotor, motor]
  );

  const agregarSeccion = useCallback(() => {
    const nueva = crearSeccion({ nombre: `Sección ${secciones.length + 1}` });
    setSecciones((s) => [...s, nueva]);
    return nueva.id;
  }, [secciones.length]);

  const eliminarSeccion = useCallback((id) => {
    setSecciones((s) => s.filter((sec) => sec.id !== id));
  }, []);

  const duplicarSeccion = useCallback((seccion) => {
    const copia = crearSeccion({
      ...seccion,
      id: Date.now() + Math.random(),
      nombre: `${seccion.nombre} (copia)`,
    });
    setSecciones((s) => {
      const idx = s.findIndex((x) => x.id === seccion.id);
      const nuevo = [...s];
      nuevo.splice(idx + 1, 0, copia);
      return nuevo;
    });
  }, []);

  const actualizarSeccion = useCallback((id, parche) => {
    setSecciones((s) => s.map((sec) => (sec.id === id ? { ...sec, ...parche } : sec)));
  }, []);

  const moverSeccion = useCallback((idx, dir) => {
    setSecciones((s) => {
      const nuevo = [...s];
      const destino = idx + dir;
      if (destino < 0 || destino >= nuevo.length) return s;
      [nuevo[idx], nuevo[destino]] = [nuevo[destino], nuevo[idx]];
      return nuevo;
    });
  }, []);

  const guardarPreset = useCallback(() => {
    const preset = { nombre: "Preset", secciones, fecha: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(preset, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `metro-preset-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [secciones]);

  const cargarPreset = useCallback((archivo) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const preset = JSON.parse(e.target.result);
        if (Array.isArray(preset.secciones)) setSecciones(preset.secciones);
      } catch {
        console.error("Error al cargar preset");
      }
    };
    reader.readAsText(archivo);
  }, []);

  return {
    secciones,
    estadoRepro,
    tickActual,
    countIn,
    setCountIn,
    countInBeats,
    setCountInBeats,
    sonido,
    setSonido,
    volumen,
    setVolumen,
    pausarReanudar,
    detener,
    reproducirDesde,
    agregarSeccion,
    eliminarSeccion,
    duplicarSeccion,
    actualizarSeccion,
    moverSeccion,
    guardarPreset,
    cargarPreset,
    motor,
  };
}

// ════════════════════════════════════════════════════════════
// UI: MedidorAfinacion (semicírculo con aguja)
// ════════════════════════════════════════════════════════════

function MedidorAfinacion({ cents, activo }) {
  const limitado = Math.max(-50, Math.min(50, cents));
  const angulo = (limitado / 50) * 65;
  const rad = (angulo * Math.PI) / 180;
  const cx = 150,
    cy = 130,
    r = 100;
  const nx = cx + r * Math.sin(rad);
  const ny = cy - r * Math.cos(rad);
  const afinado = Math.abs(cents) < 7;
  const ligeramente = Math.abs(cents) < 20;
  const colorAguja = !activo
    ? "#d1d5db"
    : afinado
    ? "#16a34a"
    : ligeramente
    ? "#d97706"
    : "#dc2626";

  return (
    <div className="flex flex-col items-center select-none">
      <svg viewBox="0 0 300 140" className="w-full max-w-xs h-36">
        {[
          { d: "M 38 130 A 112 112 0 0 1 78 42", color: "#fecaca" },
          { d: "M 78 42 A 112 112 0 0 1 116 22", color: "#fde68a" },
          { d: "M 116 22 A 112 112 0 0 1 184 22", color: "#bbf7d0" },
          { d: "M 184 22 A 112 112 0 0 1 222 42", color: "#fde68a" },
          { d: "M 222 42 A 112 112 0 0 1 262 130", color: "#fecaca" },
        ].map(({ d, color }, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            opacity="0.7"
          />
        ))}
        {[-50, -25, 0, 25, 50].map((v) => {
          const a = ((v / 50) * 65 * Math.PI) / 180;
          const x1 = cx + (r - 14) * Math.sin(a),
            y1 = cy - (r - 14) * Math.cos(a);
          const x2 = cx + (r + 2) * Math.sin(a),
            y2 = cy - (r + 2) * Math.cos(a);
          return (
            <line
              key={v}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={v === 0 ? "#16a34a" : "#9ca3af"}
              strokeWidth={v === 0 ? 2.5 : 1.5}
              strokeLinecap="round"
            />
          );
        })}
        <text
          x="30"
          y="138"
          fill="#9ca3af"
          fontSize="10"
          textAnchor="middle"
          fontFamily="system-ui"
        >
          -50
        </text>
        <text
          x="270"
          y="138"
          fill="#9ca3af"
          fontSize="10"
          textAnchor="middle"
          fontFamily="system-ui"
        >
          +50
        </text>
        <text
          x="150"
          y="14"
          fill="#16a34a"
          fontSize="10"
          textAnchor="middle"
          fontFamily="system-ui"
          fontWeight="600"
        >
          0
        </text>
        <line
          x1={cx}
          y1={cy}
          x2={nx}
          y2={ny}
          stroke={colorAguja}
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{ transition: "all 0.08s ease-out" }}
        />
        <circle
          cx={cx}
          cy={cy}
          r="6"
          fill={activo ? "#1f2937" : "#e5e7eb"}
          style={{ transition: "fill 0.2s" }}
        />
        <circle cx={cx} cy={cy} r="2.5" fill="white" />
      </svg>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// UI: PanelAfinador
// ════════════════════════════════════════════════════════════

function PanelAfinador({ a4, setA4 }) {
  const a4Ref = useRef(a4);
  useEffect(() => {
    a4Ref.current = a4;
  }, [a4]);
  const { estado, estadoMic, errorMic, iniciar, detener } = usePitchDetection(a4Ref);

  const cents = estado.activo ? parseFloat(estado.cents.toFixed(1)) : 0;
  const abs = Math.abs(cents);
  const afinado = (activo) => activo && abs < 5;
  const estadoLabel = !estado.activo
    ? null
    : abs < 5
    ? { txt: "Afinado", cls: "bg-green-50 border-green-200 text-green-700" }
    : abs < 15
    ? {
        txt: cents > 0 ? "Ligeramente alto" : "Ligeramente bajo",
        cls: "bg-amber-50 border-amber-200 text-amber-600",
      }
    : { txt: cents > 0 ? "Muy alto" : "Muy bajo", cls: "bg-red-50 border-red-200 text-red-600" };

  return (
    <div className="flex flex-col items-center gap-6 px-4 py-8 max-w-lg mx-auto w-full">
      {estadoMic !== "activo" ? (
        <div className="flex flex-col items-center gap-5 py-10 w-full">
          <div className="w-20 h-20 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 016 0v8.25a3 3 0 01-3 3z"
              />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-900 mb-1">
              {estadoMic === "solicitando" ? "Solicitando acceso…" : "Activar micrófono"}
            </p>
            <p className="text-xs text-gray-400">Necesario para detectar el tono</p>
          </div>
          {errorMic && (
            <div className="w-full rounded-xl bg-red-50 border border-red-100 px-4 py-3">
              <p className="text-xs text-red-600 font-medium">Sin acceso al micrófono</p>
              <p className="text-xs text-red-500 mt-0.5">{errorMic}</p>
            </div>
          )}
          <button
            onClick={iniciar}
            disabled={estadoMic === "solicitando"}
            className="px-8 py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 active:scale-95 transition-all disabled:opacity-50 shadow-sm"
          >
            {estadoMic === "solicitando" ? "Conectando…" : "Iniciar afinador"}
          </button>
        </div>
      ) : (
        <>
          {/* Nota detectada */}
          <div className="flex flex-col items-center gap-2 w-full">
            <div
              className="text-[88px] sm:text-[110px] font-black leading-none tracking-tight text-gray-900 tabular-nums min-h-[100px] flex items-center justify-center"
              style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
            >
              {estado.activo && estado.nota ? (
                estado.nota.nombre
              ) : (
                <span className="text-gray-200">—</span>
              )}
            </div>
            {estado.activo && estado.nota && (
              <div className="flex items-center gap-2.5 text-sm text-gray-400 flex-wrap justify-center">
                {estado.nota.enarmonico && (
                  <span className="text-gray-300">/ {estado.nota.enarmonico}</span>
                )}
                <span>
                  {estado.nota.nombreEn}
                  {estado.nota.octava}
                </span>
                <span className="text-gray-200">·</span>
                <span className="font-mono text-gray-500">{estado.freq.toFixed(1)} Hz</span>
              </div>
            )}
          </div>

          {/* Medidor */}
          <MedidorAfinacion cents={cents} activo={estado.activo} />

          {/* Cents + estado */}
          <div className="flex flex-col items-center gap-3">
            <span
              className={`text-2xl font-bold tabular-nums font-mono ${
                !estado.activo
                  ? "text-gray-200"
                  : abs < 7
                  ? "text-green-600"
                  : abs < 20
                  ? "text-amber-600"
                  : "text-red-600"
              }`}
            >
              {estado.activo ? `${estado.cents > 0 ? "+" : ""}${estado.cents.toFixed(1)} ¢` : "—"}
            </span>
            {estadoLabel && (
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${estadoLabel.cls}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    abs < 5 ? "bg-green-500" : abs < 15 ? "bg-amber-400" : "bg-red-500"
                  }`}
                />
                {estadoLabel.txt}
              </span>
            )}
          </div>

          {/* Feedback educativo */}
          {estado.activo && estado.nota && abs >= 5 && (
            <div
              className={`w-full rounded-xl border px-4 py-3 text-xs leading-relaxed ${
                abs < 15
                  ? "bg-amber-50 border-amber-100 text-amber-700"
                  : "bg-red-50 border-red-100 text-red-700"
              }`}
            >
              {cents > 0
                ? abs < 15
                  ? "Baja levemente la afinación. Relaja la embocadura o reduce la presión de aire."
                  : "La nota está bastante alta. Revisa la afinación del instrumento."
                : abs < 15
                ? "Sube levemente la afinación. Aumenta la presión de aire o ajusta la embocadura."
                : "La nota está bastante baja. Revisa la posición del instrumento."}
            </div>
          )}

          {/* Nivel de señal */}
          {estado.activo && (
            <div className="w-full">
              <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                <span>Señal</span>
                <span className="font-mono">{Math.round(estado.confianza * 100)}%</span>
              </div>
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-800 rounded-full transition-all duration-200"
                  style={{ width: `${estado.confianza * 100}%` }}
                />
              </div>
            </div>
          )}

          <button
            onClick={detener}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors underline-offset-2 hover:underline"
          >
            Detener micrófono
          </button>
        </>
      )}

      {/* Configuración de referencia A4 */}
      <div className="w-full mt-2 bg-gray-50 rounded-2xl border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
            Referencia
          </span>
          <span className="text-xs font-bold text-gray-900 font-mono">A4 = {a4} Hz</span>
        </div>
        <input
          type="range"
          min={435}
          max={445}
          step={1}
          value={a4}
          onChange={(e) => setA4(Number(e.target.value))}
          className="w-full h-1.5 accent-gray-900"
        />
        <div className="flex justify-between text-[10px] text-gray-400 mt-1.5">
          {[435, 437, 440, 442, 445].map((v) => (
            <span key={v}>{v}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// UI: MetronomoRapido
// ════════════════════════════════════════════════════════════

function MetronomoRapido({ motor }) {
  const { config, ejecutando, pulso, alternar, actualizar, tap } = useMetronomoRapido(motor);
  const [inputBpm, setInputBpm] = useState(String(config.bpm));

  useEffect(() => {
    setInputBpm(String(config.bpm));
  }, [config.bpm]);

  const compases = [
    { beats: 2, label: "2/4" },
    { beats: 3, label: "3/4" },
    { beats: 4, label: "4/4" },
    { beats: 5, label: "5/4" },
    { beats: 7, label: "7/4" },
  ];

  return (
    <div className="flex flex-col items-center gap-6 px-4 py-8 max-w-lg mx-auto w-full">
      {/* BPM grande */}
      <div className="flex flex-col items-center gap-1 w-full">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          Tempo
        </label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => actualizar({ bpm: Math.max(20, config.bpm - 1) })}
            className="w-11 h-11 rounded-xl border border-gray-200 text-gray-700 text-lg hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center font-light select-none"
          >
            −
          </button>
          <div className="flex flex-col items-center">
            <input
              type="number"
              value={inputBpm}
              onChange={(e) => setInputBpm(e.target.value)}
              onBlur={() => {
                const v = Math.max(20, Math.min(300, Number(inputBpm)));
                actualizar({ bpm: v });
                setInputBpm(String(v));
              }}
              onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
              className="w-36 text-center text-7xl font-black bg-transparent text-gray-900 outline-none leading-none tabular-nums"
              style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
            />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
              BPM
            </span>
          </div>
          <button
            onClick={() => actualizar({ bpm: Math.min(300, config.bpm + 1) })}
            className="w-11 h-11 rounded-xl border border-gray-200 text-gray-700 text-lg hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center font-light select-none"
          >
            +
          </button>
        </div>
        <input
          type="range"
          min={20}
          max={300}
          value={config.bpm}
          onChange={(e) => actualizar({ bpm: Number(e.target.value) })}
          className="w-full max-w-xs h-1.5 accent-gray-900 mt-2"
        />
      </div>

      {/* Pulsos visuales */}
      <div className="flex gap-2.5 justify-center items-center py-1">
        {Array.from({ length: config.pulsaciones }).map((_, i) => {
          const activo = ejecutando && pulso.beat === i;
          const esAcento = i === 0;
          return (
            <div
              key={i}
              className={`rounded-full transition-all duration-75 border-2 ${
                activo
                  ? esAcento
                    ? "bg-gray-900 border-gray-900 scale-125 shadow-lg"
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

      {/* Controles principales */}
      <div className="flex items-center gap-4">
        <button
          onClick={tap}
          className="px-5 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all select-none"
        >
          Tap
        </button>
        <button
          onClick={alternar}
          className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white shadow-sm transition-all active:scale-95 ${
            ejecutando ? "bg-red-600 hover:bg-red-700" : "bg-gray-900 hover:bg-gray-700"
          }`}
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
        <div className="px-4 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 text-center min-w-[60px] select-none">
          {config.pulsaciones}/4
        </div>
      </div>

      {/* Presets de tempo */}
      <div className="w-full">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
          Indicaciones de tempo
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {PRESETS_BPM_RAPIDO.map((p) => (
            <button
              key={p.bpm}
              onClick={() => actualizar({ bpm: p.bpm })}
              className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                config.bpm === p.bpm
                  ? "bg-gray-900 text-white"
                  : "bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className="block">{p.nombre}</span>
              <span
                className={`text-[10px] ${
                  config.bpm === p.bpm ? "text-gray-400" : "text-gray-400"
                }`}
              >
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
          {compases.map((c) => (
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
              className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-all ${
                config.subdivision === s.v
                  ? "bg-gray-900 border-gray-900 text-white"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {s.simbolo}
            </button>
          ))}
        </div>
      </div>

      {/* Sonido y volumen */}
      <div className="w-full bg-gray-50 rounded-2xl border border-gray-100 p-4 flex flex-col gap-4">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
            Sonido del click
          </p>
          <div className="flex gap-1.5 flex-wrap">
            {SONIDOS_METRO.map((s) => (
              <button
                key={s.v}
                onClick={() => actualizar({ sonido: s.v })}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  config.sonido === s.v
                    ? "bg-gray-900 text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {s.etiqueta}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="flex justify-between mb-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Volumen</p>
            <span className="text-xs text-gray-500 font-mono">
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
            className="w-full h-1.5 accent-gray-900"
          />
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// UI: EditorSeccion (panel lateral de edición)
// ════════════════════════════════════════════════════════════

function EditorSeccion({ seccion, onActualizar, onCerrar }) {
  const [mostrarPresetsAcento, setMostrarPresetsAcento] = useState(false);

  if (!seccion) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-16 px-8">
        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z"
            />
          </svg>
        </div>
        <p className="text-sm font-semibold text-gray-700 mb-1">Selecciona una sección</p>
        <p className="text-xs text-gray-400 leading-relaxed">
          Haz clic en una sección del timeline para editarla
        </p>
      </div>
    );
  }

  const presets = PRESETS_ACENTO[String(seccion.compas.numerador)] || [];

  const actualizarTempo = (parche) => {
    onActualizar(seccion.id, { tempo: { ...seccion.tempo, ...parche } });
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
        <h3 className="text-sm font-bold text-gray-900">Editar sección</h3>
        {onCerrar && (
          <button
            onClick={onCerrar}
            className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <svg
              className="w-4 h-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

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
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-900 focus:outline-none focus:border-gray-400 transition-colors bg-white"
            placeholder="Ej: Intro, Verso, Coro..."
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
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-900 focus:outline-none focus:border-gray-400 bg-white"
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
              type="number"
              min={1}
              max={999}
              value={seccion.repeticiones}
              onChange={(e) =>
                onActualizar(seccion.id, {
                  repeticiones: Math.max(1, parseInt(e.target.value) || 1),
                })
              }
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-900 focus:outline-none focus:border-gray-400 text-center bg-white"
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
                  onActualizar(seccion.id, {
                    tempo: {
                      tipo: "curva",
                      inicio: seccion.tempo.bpm,
                      fin: seccion.tempo.bpm + 20,
                      curva: "lineal",
                    },
                  });
                } else {
                  onActualizar(seccion.id, { tempo: { tipo: "fijo", bpm: seccion.tempo.inicio } });
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
                type="number"
                min={20}
                max={300}
                value={seccion.tempo.bpm}
                onChange={(e) =>
                  actualizarTempo({
                    bpm: Math.max(20, Math.min(300, parseInt(e.target.value) || 120)),
                  })
                }
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xl font-black text-gray-900 focus:outline-none focus:border-gray-400 text-center bg-white font-mono"
              />
              <p className="text-[10px] text-gray-400 text-center mt-1.5">BPM constante</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1.5">Inicio BPM</label>
                  <input
                    type="number"
                    min={20}
                    max={300}
                    value={seccion.tempo.inicio}
                    onChange={(e) =>
                      actualizarTempo({
                        inicio: Math.max(20, Math.min(300, parseInt(e.target.value) || 120)),
                      })
                    }
                    className="w-full px-2 py-2 rounded-lg border border-gray-200 text-sm font-bold text-center text-gray-900 focus:outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1.5">Final BPM</label>
                  <input
                    type="number"
                    min={20}
                    max={300}
                    value={seccion.tempo.fin}
                    onChange={(e) =>
                      actualizarTempo({
                        fin: Math.max(20, Math.min(300, parseInt(e.target.value) || 120)),
                      })
                    }
                    className="w-full px-2 py-2 rounded-lg border border-gray-200 text-sm font-bold text-center text-gray-900 focus:outline-none bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-1.5">Tipo de curva</label>
                <select
                  value={seccion.tempo.curva}
                  onChange={(e) => actualizarTempo({ curva: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none bg-white"
                >
                  <option value="lineal">Lineal</option>
                  <option value="exponencial">Exponencial (accel. natural)</option>
                  <option value="logaritmica">Logarítmica (rit. natural)</option>
                </select>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 bg-white rounded-lg px-3 py-2 border border-gray-100">
                {seccion.tempo.inicio < seccion.tempo.fin ? "↗ Accelerando" : "↘ Ritardando"}
                <span className="font-semibold text-gray-700 ml-auto">
                  {Math.abs(seccion.tempo.fin - seccion.tempo.inicio)} BPM
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
              <button
                key={s.v}
                onClick={() => onActualizar(seccion.id, { subdivision: s.v })}
                className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-all ${
                  seccion.subdivision === s.v
                    ? "bg-gray-900 border-gray-900 text-white"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className="block text-base">{s.simbolo}</span>
                <span
                  className={`text-[9px] ${
                    seccion.subdivision === s.v ? "text-gray-400" : "text-gray-400"
                  }`}
                >
                  {s.etiqueta}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Patrón de acentos */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Acentos
            </label>
            {presets.length > 0 && (
              <button
                onClick={() => setMostrarPresetsAcento(!mostrarPresetsAcento)}
                className="text-[11px] font-semibold text-gray-500 hover:text-gray-700 transition-colors"
              >
                {mostrarPresetsAcento ? "Ocultar presets" : "Ver presets"}
              </button>
            )}
          </div>
          {mostrarPresetsAcento && presets.length > 0 && (
            <div className="mb-3 rounded-xl bg-gray-50 border border-gray-100 p-3 flex flex-col gap-1.5">
              {presets.map((p, i) => (
                <button
                  key={i}
                  onClick={() => {
                    onActualizar(seccion.id, { patronAcento: p.patron });
                    setMostrarPresetsAcento(false);
                  }}
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 transition-all text-left"
                >
                  <span className="text-xs font-semibold text-gray-700">{p.nombre}</span>
                  <span className="text-xs text-gray-400 font-mono">
                    {p.patron.map((v) => (v ? "●" : "○")).join(" ")}
                  </span>
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-1.5 flex-wrap">
            {seccion.patronAcento.map((acento, i) => (
              <button
                key={i}
                onClick={() => {
                  const nuevo = [...seccion.patronAcento];
                  nuevo[i] = nuevo[i] ? 0 : 1;
                  onActualizar(seccion.id, { patronAcento: nuevo });
                }}
                className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                  acento
                    ? "bg-gray-900 text-white shadow-sm"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-2">
            Toca los números para activar o desactivar acentos
          </p>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// UI: TarjetaSeccion (fila del timeline)
// ════════════════════════════════════════════════════════════

function TarjetaSeccion({
  seccion,
  index,
  total,
  tickActual,
  seleccionada,
  onSeleccionar,
  onEliminar,
  onDuplicar,
  onMover,
  onReproducirDesde,
}) {
  const enReproduccion = tickActual?.seccionId === seccion.id;
  const esCountIn = tickActual?.numeroCompas === 0;

  return (
    <div
      onClick={() => onSeleccionar(seccion.id)}
      className={`rounded-2xl border transition-all cursor-pointer ${
        enReproduccion && !esCountIn
          ? "border-gray-400 bg-gray-50 shadow-sm"
          : seleccionada
          ? "border-gray-300 bg-white shadow-sm"
          : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      <div className="px-4 py-4">
        <div className="flex items-start gap-3">
          {/* Índice + estado */}
          <div className="flex flex-col items-center gap-1 mt-0.5">
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-lg font-mono ${
                enReproduccion && !esCountIn
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {index + 1}
            </span>
            {enReproduccion && !esCountIn && tickActual && (
              <span className="text-[9px] text-gray-500 font-mono tabular-nums whitespace-nowrap">
                {tickActual.numeroCompas}/{Math.ceil(seccion.repeticiones)}
              </span>
            )}
          </div>

          {/* Info principal */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h4 className="text-sm font-bold text-gray-900 truncate">{seccion.nombre}</h4>
              <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg">
                {seccion.compas.numerador}/{seccion.compas.denominador}
              </span>
              {seccion.tempo.tipo === "curva" && (
                <span className="text-[10px] font-semibold text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-lg">
                  {seccion.tempo.inicio < seccion.tempo.fin ? "↗ Accel." : "↘ Rit."}
                </span>
              )}
            </div>
            <div className="flex gap-3 text-xs text-gray-400">
              <span className="font-mono">
                {seccion.tempo.tipo === "fijo"
                  ? `${seccion.tempo.bpm} BPM`
                  : `${seccion.tempo.inicio}→${seccion.tempo.fin} BPM`}
              </span>
              <span>×{seccion.repeticiones}</span>
              <span>{SUBDIVISIONES.find((s) => s.v === seccion.subdivision)?.simbolo}</span>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onReproducirDesde(seccion.id)}
              title="Reproducir desde aquí"
              className="w-7 h-7 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors flex items-center justify-center"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
            <button
              onClick={() => onMover(index, -1)}
              disabled={index === 0}
              title="Subir"
              className="w-7 h-7 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors flex items-center justify-center text-xs font-bold"
            >
              ↑
            </button>
            <button
              onClick={() => onMover(index, 1)}
              disabled={index === total - 1}
              title="Bajar"
              className="w-7 h-7 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors flex items-center justify-center text-xs font-bold"
            >
              ↓
            </button>
            <button
              onClick={() => onDuplicar(seccion)}
              title="Duplicar"
              className="w-7 h-7 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"
                />
              </svg>
            </button>
            <button
              onClick={() => onEliminar(seccion.id)}
              title="Eliminar"
              className="w-7 h-7 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// UI: MetronomoSecuencia (panel completo)
// ════════════════════════════════════════════════════════════

function MetronomoSecuencia({ motor }) {
  const seq = useMetronomoSecuencia(motor);
  const [seccionEditando, setSeccionEditando] = useState(null);
  const [panelEditorAbierto, setPanelEditorAbierto] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [progresoExportar, setProgresoExportar] = useState(0);

  const seleccionarSeccion = (id) => {
    setSeccionEditando(id);
    setPanelEditorAbierto(true);
  };

  const seccionActual = seq.secciones.find((s) => s.id === seccionEditando);

  const agregarNuevaSeccion = () => {
    const id = seq.agregarSeccion();
    setTimeout(() => {
      seleccionarSeccion(id);
    }, 50);
  };

  const exportarAudio = async () => {
    if (!motor.current || seq.secciones.length === 0) return;
    try {
      setExportando(true);
      setProgresoExportar(0);
      const blob = await motor.current.exportarWAV(
        seq.secciones,
        seq.countIn,
        seq.countInBeats,
        setProgresoExportar
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `metro-${Date.now()}.wav`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error al exportar:", err);
    } finally {
      setExportando(false);
      setProgresoExportar(0);
    }
  };

  const icono =
    seq.estadoRepro === "reproduciendo" ? (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <rect x="6" y="5" width="4" height="14" rx="1.5" />
        <rect x="14" y="5" width="4" height="14" rx="1.5" />
      </svg>
    ) : seq.estadoRepro === "pausado" ? (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M8 5v14l11-7z" />
      </svg>
    ) : (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M8 5v14l11-7z" />
      </svg>
    );

  const etiquetaBoton =
    seq.estadoRepro === "reproduciendo"
      ? "Pausar"
      : seq.estadoRepro === "pausado"
      ? "Reanudar"
      : "Reproducir";

  return (
    <div className="flex flex-col lg:flex-row min-h-0 h-full">
      {/* Panel principal: Timeline */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Barra de transporte */}
        <div
          className={`sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-3 ${
            seq.tickActual ? "" : ""
          }`}
        >
          {seq.tickActual && (
            <div
              className={`mb-3 rounded-xl px-4 py-2.5 flex items-center gap-4 ${
                seq.tickActual.numeroCompas === 0
                  ? "bg-amber-50 border border-amber-100"
                  : "bg-gray-900"
              }`}
            >
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-bold ${
                    seq.tickActual.numeroCompas === 0 ? "text-amber-700" : "text-white"
                  }`}
                >
                  {seq.tickActual.numeroCompas === 0
                    ? `Preparación · Beat ${seq.tickActual.numeroBeat}`
                    : seq.tickActual.nombreSeccion}
                </p>
                <p
                  className={`text-xs ${
                    seq.tickActual.numeroCompas === 0 ? "text-amber-600" : "text-gray-400"
                  }`}
                >
                  {seq.tickActual.numeroCompas > 0 &&
                    `Compás ${seq.tickActual.numeroCompas} · Beat ${seq.tickActual.numeroBeat} · `}
                  {seq.tickActual.bpmActual} BPM
                </p>
              </div>
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg transition-all ${
                  seq.tickActual.esAcento
                    ? seq.tickActual.numeroCompas === 0
                      ? "bg-amber-500 text-white scale-110"
                      : "bg-white text-gray-900 scale-110"
                    : seq.tickActual.numeroCompas === 0
                    ? "bg-amber-100 text-amber-700"
                    : "bg-gray-700 text-gray-300"
                }`}
              >
                {seq.tickActual.numeroBeat}
              </div>
            </div>
          )}
          <div className="flex items-center gap-2.5">
            <button
              onClick={seq.pausarReanudar}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                seq.estadoRepro === "reproduciendo"
                  ? "bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100"
                  : "bg-gray-900 text-white hover:bg-gray-700"
              }`}
            >
              {icono}
              {etiquetaBoton}
            </button>
            {(seq.estadoRepro === "reproduciendo" || seq.estadoRepro === "pausado") && (
              <button
                onClick={seq.detener}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-red-50 border border-red-100 text-red-600 hover:bg-red-100 transition-all"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                </svg>
                Detener
              </button>
            )}
            <button
              onClick={agregarNuevaSeccion}
              className="ml-auto flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-sm border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Sección
            </button>
          </div>
        </div>

        {/* Lista de secciones */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {seq.secciones.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z"
                  />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Sin secciones</p>
              <p className="text-xs text-gray-400 mb-5">Crea tu primera sección de práctica</p>
              <button
                onClick={agregarNuevaSeccion}
                className="px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-all"
              >
                Crear sección
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {seq.secciones.map((sec, i) => (
                <TarjetaSeccion
                  key={sec.id}
                  seccion={sec}
                  index={i}
                  total={seq.secciones.length}
                  tickActual={seq.tickActual}
                  seleccionada={seccionEditando === sec.id}
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

        {/* Opciones de configuración + Presets */}
        <div className="border-t border-gray-100 px-4 py-4 bg-white">
          <div className="flex flex-col gap-3">
            {/* Count-in */}
            <div className="flex items-center gap-3 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div
                  onClick={() => seq.setCountIn(!seq.countIn)}
                  className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                    seq.countIn ? "bg-gray-900" : "bg-gray-200"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      seq.countIn ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-700">Count-in</span>
              </label>
              {seq.countIn && (
                <select
                  value={seq.countInBeats}
                  onChange={(e) => seq.setCountInBeats(Number(e.target.value))}
                  className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 focus:outline-none bg-white"
                >
                  <option value={1}>1 beat</option>
                  <option value={2}>2 beats</option>
                  <option value={4}>4 beats</option>
                </select>
              )}
            </div>

            {/* Sonido y volumen de secuencia */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex gap-1">
                {SONIDOS_METRO.map((s) => (
                  <button
                    key={s.v}
                    onClick={() => {
                      seq.setSonido(s.v);
                      motor.current?.actualizarSonido(s.v, seq.volumen);
                    }}
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
                <span className="text-xs text-gray-500">Vol</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={seq.volumen}
                  onChange={(e) => {
                    seq.setVolumen(Number(e.target.value));
                    motor.current?.actualizarSonido(seq.sonido, Number(e.target.value));
                  }}
                  className="w-20 h-1 accent-gray-900"
                />
              </div>
            </div>

            {/* Acciones presets/export */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={seq.guardarPreset}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition-all"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                  />
                </svg>
                Guardar preset
              </button>
              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition-all cursor-pointer">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
                Cargar preset
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && seq.cargarPreset(e.target.files[0])}
                />
              </label>
              <button
                onClick={exportarAudio}
                disabled={exportando || seq.secciones.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z"
                  />
                </svg>
                {exportando ? `Exportando ${Math.round(progresoExportar * 100)}%` : "Exportar WAV"}
              </button>
            </div>
            {exportando && (
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-900 rounded-full transition-all"
                  style={{ width: `${progresoExportar * 100}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Panel editor — sticky en desktop, modal en mobile */}
      <div
        className={`
        lg:w-80 xl:w-96 lg:border-l border-gray-100 bg-white
        ${
          panelEditorAbierto
            ? "fixed inset-0 z-50 lg:relative lg:inset-auto lg:z-auto overflow-y-auto"
            : "hidden lg:flex lg:flex-col"
        }
      `}
      >
        <EditorSeccion
          seccion={seccionActual}
          onActualizar={seq.actualizarSeccion}
          onCerrar={() => setPanelEditorAbierto(false)}
        />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// UI: PanelMetronomo (Rápido + Secuencia)
// ════════════════════════════════════════════════════════════

function PanelMetronomo({ motor }) {
  const [modoMetro, setModoMetro] = useState("rapido");

  return (
    <div className="flex flex-col h-full">
      {/* Toggle Rápido / Secuencia */}
      <div className="flex border-b border-gray-100 bg-white">
        <div className="max-w-2xl mx-auto w-full px-4">
          <div className="flex">
            {[
              { id: "rapido", label: "Rápido" },
              { id: "secuencia", label: "Secuencia" },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setModoMetro(m.id)}
                className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all -mb-px ${
                  modoMetro === m.id
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-400 hover:text-gray-700"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {modoMetro === "rapido" ? (
        <div className="flex-1 overflow-y-auto">
          <MetronomoRapido motor={motor} />
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <MetronomoSecuencia motor={motor} />
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// UI: PanelGuia
// ════════════════════════════════════════════════════════════

const CONTENIDO_GUIA = [
  {
    titulo: "¿Qué es un compás?",
    contenido:
      "Un compás es la unidad de medida del tiempo en la música. Define cuántos pulsos ocurren antes de que el ciclo se repita. En notación musical, se escribe como fracción: el numerador indica cuántos tiempos tiene el compás, y el denominador indica qué figura recibe un tiempo.",
  },
  {
    titulo: "Compases simples vs. compuestos",
    contenido:
      "En un compás simple, cada tiempo se divide en dos partes iguales (división binaria). Los más comunes son 2/4, 3/4 y 4/4.\n\nEn un compás compuesto, cada tiempo se divide en tres partes iguales (división ternaria). Los más comunes son 6/8, 9/8 y 12/8. Dan una sensación más fluida, típica del vals o la jiga.",
  },
  {
    titulo: "Compases asimétricos: 5/4 y 7/4",
    contenido:
      "Los compases asimétricos no se dividen en grupos iguales. El 5/4 puede sentirse como 3+2 o 2+3, y el 7/4 como 2+2+3, 3+2+2 o 2+3+2. El truco es encontrar la agrupación interna y practicarla hasta que el patrón sea natural.\n\nEjemplos: 'Take Five' de Dave Brubeck (5/4), 'Money' de Pink Floyd (7/4).",
  },
  {
    titulo: "Cómo sentir el 6/8",
    contenido:
      "El 6/8 tiene 6 corcheas por compás, agrupadas en 2 grupos de 3. El acento cae en la primera corchea de cada grupo. Aunque hay 6 notas, se siente como 2 pulsos principales. Intenta contar '1-2-3 / 2-2-3' mientras caminas.",
  },
  {
    titulo: "Subdivisiones: qué son y para qué sirven",
    contenido:
      "Las subdivisiones dividen cada pulso en partes más pequeñas. Practicar con subdivisiones activas ayuda a mantener el pulso interno estable.\n\nNegras: 1 click por tiempo. Corcheas: 2 por tiempo (binario). Tresillos: 3 por tiempo. Semicorcheas: 4 por tiempo.\n\nUsar subdivisiones activas es la técnica más efectiva para solidificar el pulso antes de aumentar el tempo.",
  },
  {
    titulo: "Tempo con curva: accel. y rit.",
    contenido:
      "Un accelerando (accel.) sube gradualmente el tempo. Un ritardando (rit.) lo baja. En el modo Secuencia puedes configurar curvas de tempo para practicar estas transiciones de manera controlada.\n\nLa curva lineal sube/baja de forma constante. La exponencial acelera más al final. La logarítmica acelera más al principio.",
  },
  {
    titulo: "Estrategia de práctica efectiva",
    contenido:
      "1. Empieza siempre a un tempo donde puedas tocar sin errores.\n2. Usa subdivisiones para solidificar el pulso antes de subir tempo.\n3. Sube el BPM en incrementos de 5-10 por sesión.\n4. Alterna entre tempos lentos y objetivo para mayor retención.\n5. Practica difíciles pasajes en loop con las secciones del metrónomo avanzado.",
  },
];

const TABLA_COMPASES = [
  { comp: "2/4", tipo: "Simple", pulsos: 2, div: "Binaria", ej: "Marcha" },
  { comp: "3/4", tipo: "Simple", pulsos: 3, div: "Binaria", ej: "Vals" },
  { comp: "4/4", tipo: "Simple", pulsos: 4, div: "Binaria", ej: "Pop, Rock" },
  { comp: "5/4", tipo: "Simple", pulsos: 5, div: "Binaria", ej: "Asimétrico" },
  { comp: "7/4", tipo: "Simple", pulsos: 7, div: "Binaria", ej: "Asimétrico" },
  { comp: "6/8", tipo: "Compuesto", pulsos: 2, div: "Ternaria", ej: "Jiga, Barcarola" },
  { comp: "9/8", tipo: "Compuesto", pulsos: 3, div: "Ternaria", ej: "Reel irlandés" },
  { comp: "12/8", tipo: "Compuesto", pulsos: 4, div: "Ternaria", ej: "Blues, Slow" },
];

function PanelGuia() {
  const [abierto, setAbierto] = useState(null);
  return (
    <div className="px-4 py-6 max-w-xl mx-auto w-full">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900">Guía musical</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Conceptos esenciales de compás, ritmo y práctica.
        </p>
      </div>

      <div className="flex flex-col gap-2 mb-6">
        {CONTENIDO_GUIA.map((sec, i) => (
          <div key={i} className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
            <button
              onClick={() => setAbierto(abierto === i ? null : i)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-semibold text-gray-900">{sec.titulo}</span>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-3 ${
                  abierto === i ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {abierto === i && (
              <div className="px-5 pb-5 border-t border-gray-100">
                <p className="text-sm text-gray-600 leading-relaxed mt-3 whitespace-pre-line">
                  {sec.contenido}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Tabla referencia */}
      <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900">Referencia rápida de compases</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {TABLA_COMPASES.map((f) => (
            <div key={f.comp} className="flex items-center px-5 py-3 gap-4">
              <span className="text-base font-black text-gray-900 w-12 flex-shrink-0 font-mono">
                {f.comp}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-700">{f.ej}</p>
                <p className="text-xs text-gray-400">
                  {f.pulsos} pulsos · División {f.div.toLowerCase()}
                </p>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  f.tipo === "Simple"
                    ? "bg-blue-50 border-blue-100 text-blue-600"
                    : "bg-amber-50 border-amber-100 text-amber-600"
                }`}
              >
                {f.tipo}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// COMPONENTE RAÍZ: AfinadorMetronomo
// ════════════════════════════════════════════════════════════

const TABS_PRINCIPALES = [
  { id: "afinador", label: "Afinador" },
  { id: "metronomo", label: "Metrónomo" },
  { id: "guia", label: "Guía" },
];

export default function AfinadorMetronomo() {
  const [tab, setTab] = useState("afinador");
  const [a4, setA4] = useState(440);

  // Motor compartido — una sola instancia por toda la app
  const motorRef = useRef(null);
  useEffect(() => {
    motorRef.current = new MotorMetronomo();
    return () => {
      motorRef.current?.destruir();
    };
  }, []);

  return (
    <div
      className="min-h-screen bg-white font-sans"
      style={{ fontFamily: "'system-ui', '-apple-system', sans-serif" }}
    >
      {/* Cabecera */}
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
              Afinador & Metrónomo
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Pitch · Tempo · Compás · Práctica avanzada
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
            <svg
              className="w-5 h-5 text-gray-700"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z"
              />
            </svg>
          </div>
        </div>

        {/* Tabs principales */}
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex border-b border-gray-200 -mb-px">
            {TABS_PRINCIPALES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all -mb-px ${
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

      {/* Contenido por tab */}
      <div className="max-w-5xl mx-auto">
        {tab === "afinador" && <PanelAfinador a4={a4} setA4={setA4} />}
        {tab === "metronomo" && (
          <div className="min-h-[calc(100vh-120px)]">
            <PanelMetronomo motor={motorRef} />
          </div>
        )}
        {tab === "guia" && <PanelGuia />}
      </div>
    </div>
  );
}
