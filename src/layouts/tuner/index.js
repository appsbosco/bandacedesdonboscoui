/* eslint-disable react/prop-types */
/**
 * AfinadorMetronomo.jsx
 * ─────────────────────────────────────────────────────────────
 * Módulo premium de Afinador + Metrónomo
 * Stack: React funcional · Tailwind CSS · Web Audio API
 * Idioma: Español completo
 * ─────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ════════════════════════════════════════════════════════════
// UTILS DE TEORÍA MUSICAL
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
  "C#": "D♭",
  "D#": "E♭",
  "F#": "G♭",
  "G#": "A♭",
  "A#": "B♭",
};

function construirNotas(a4 = 440) {
  const notas = [];
  for (let midi = 21; midi <= 108; midi++) {
    const semitonos = midi - 69;
    const freq = a4 * Math.pow(2, semitonos / 12);
    const octava = Math.floor(midi / 12) - 1;
    const indice = midi % 12;
    const nombre = NOMBRES_NOTAS[indice];
    const nombreEn = NOMBRES_ANGLOSAJONES[indice];
    notas.push({
      midi,
      freq,
      nombre,
      nombreEn,
      octava,
      enarmonico: ENARMONICOS[nombre] || null,
    });
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

// ════════════════════════════════════════════════════════════
// UTILS DE AUDIO
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
  const [estadoMic, setEstadoMic] = useState("inactivo"); // inactivo | solicitando | activo | error
  const [errorMic, setErrorMic] = useState(null);

  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const freqSuavizadaRef = useRef(null);
  const notaEstableRef = useRef(null);
  const contadorEstableRef = useRef(0);
  const centsSuavizadosRef = useRef(0);

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
      setEstadoMic("activo");
      setErrorMic(null);
      bucle();
    } catch (e) {
      setErrorMic(e.message || "Acceso al micrófono denegado");
      setEstadoMic("error");
    }
  }, [estadoMic]);

  const detener = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    analyserRef.current = null;
    streamRef.current = null;
    freqSuavizadaRef.current = null;
    notaEstableRef.current = null;
    contadorEstableRef.current = 0;
    centsSuavizadosRef.current = 0;
    setEstadoMic("inactivo");
    setEstado({ nota: null, freq: 0, cents: 0, confianza: 0, activo: false });
  }, []);

  function bucle() {
    if (!analyserRef.current) return;
    const buf = new Float32Array(analyserRef.current.fftSize);
    analyserRef.current.getFloatTimeDomainData(buf);
    const nivel = calcularRMS(buf);

    if (nivel < 0.007) {
      freqSuavizadaRef.current = null;
      contadorEstableRef.current = 0;
      centsSuavizadosRef.current = 0;
      setEstado((s) => ({ ...s, nota: null, freq: 0, cents: 0, confianza: 0, activo: false }));
    } else {
      const ventana = aplicarVentanaHamming(buf);
      const pitch = algoritmoyYIN(ventana, audioCtxRef.current.sampleRate);

      if (pitch > 50 && pitch < 2200) {
        const alpha = 0.2;
        freqSuavizadaRef.current =
          freqSuavizadaRef.current == null
            ? pitch
            : alpha * pitch + (1 - alpha) * freqSuavizadaRef.current;

        const notas = construirNotas(a4Ref.current);
        const cercana = notaMasCercana(freqSuavizadaRef.current, notas);
        const centsRaw = calcularCents(freqSuavizadaRef.current, cercana.freq);
        const alphaCents = 0.3;
        centsSuavizadosRef.current =
          alphaCents * centsRaw + (1 - alphaCents) * centsSuavizadosRef.current;

        const claveNota = cercana.nombre + cercana.octava;
        if (notaEstableRef.current === claveNota) {
          contadorEstableRef.current++;
        } else {
          notaEstableRef.current = claveNota;
          contadorEstableRef.current = 1;
        }

        if (contadorEstableRef.current >= 3) {
          const confianza = Math.min(1, nivel * 12);
          setEstado({
            nota: cercana,
            freq: freqSuavizadaRef.current,
            cents: centsSuavizadosRef.current,
            confianza,
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
// HOOK: useMetronomo
// ════════════════════════════════════════════════════════════

const CONFIG_DEFECTO = {
  bpm: 120,
  pulsacionesPorCompas: 4,
  subdivision: 1,
  sonido: "click",
  volumen: 0.8,
  ejecutando: false,
};

function useMetronomo() {
  const [config, setConfig] = useState(() => {
    try {
      const guardado = localStorage.getItem("metronomo_config_v2");
      return guardado ? { ...CONFIG_DEFECTO, ...JSON.parse(guardado) } : CONFIG_DEFECTO;
    } catch {
      return CONFIG_DEFECTO;
    }
  });

  const [pulso, setPulso] = useState({ beat: 0, sub: 0, acento: false });
  const audioCtxRef = useRef(null);
  const schedulerRef = useRef(null);
  const siguienteNotaRef = useRef(0);
  const beatActualRef = useRef(0);
  const configRef = useRef(config);
  configRef.current = config;
  const tapsRef = useRef([]);

  const obtenerCtx = () => {
    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtxRef.current.state === "suspended") audioCtxRef.current.resume();
    return audioCtxRef.current;
  };

  function programarClick(tiempo, esAcento) {
    const ctx = obtenerCtx();
    const vol = configRef.current.volumen;
    const sonido = configRef.current.sonido;

    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(esAcento ? vol : vol * 0.55, tiempo);
    gain.gain.exponentialRampToValueAtTime(0.001, tiempo + 0.06);

    const osc = ctx.createOscillator();
    osc.connect(gain);

    switch (sonido) {
      case "click":
        osc.type = "square";
        osc.frequency.setValueAtTime(esAcento ? 1700 : 1100, tiempo);
        break;
      case "madera":
        osc.type = "triangle";
        osc.frequency.setValueAtTime(esAcento ? 750 : 550, tiempo);
        break;
      case "digital":
        osc.type = "sine";
        osc.frequency.setValueAtTime(esAcento ? 2200 : 1400, tiempo);
        break;
      default: // suave
        osc.type = "sine";
        osc.frequency.setValueAtTime(esAcento ? 880 : 660, tiempo);
    }
    osc.start(tiempo);
    osc.stop(tiempo + 0.07);
  }

  function scheduler() {
    const ctx = obtenerCtx();
    const cfg = configRef.current;
    const segPorBeat = 60 / cfg.bpm;
    const segPorSub = segPorBeat / cfg.subdivision;
    const totalSubs = cfg.pulsacionesPorCompas * cfg.subdivision;

    while (siguienteNotaRef.current < ctx.currentTime + 0.12) {
      const subIndex = beatActualRef.current % totalSubs;
      const beatIndex = Math.floor(subIndex / cfg.subdivision);
      const esAcento = subIndex === 0;
      programarClick(siguienteNotaRef.current, esAcento);

      const capBeat = beatIndex;
      const capAccent = esAcento;
      const tiempoProg = siguienteNotaRef.current;

      setTimeout(() => {
        setPulso({ beat: capBeat, sub: subIndex, acento: capAccent });
        if (navigator.vibrate && capAccent) navigator.vibrate(25);
      }, Math.max(0, (tiempoProg - ctx.currentTime) * 1000 - 15));

      siguienteNotaRef.current += segPorSub;
      beatActualRef.current++;
    }
    schedulerRef.current = setTimeout(scheduler, 20);
  }

  const iniciar = useCallback(() => {
    const ctx = obtenerCtx();
    siguienteNotaRef.current = ctx.currentTime + 0.05;
    beatActualRef.current = 0;
    scheduler();
    setConfig((c) => {
      const nuevo = { ...c, ejecutando: true };
      try {
        localStorage.setItem("metronomo_config_v2", JSON.stringify(nuevo));
      } catch {}
      return nuevo;
    });
  }, []);

  const detener = useCallback(() => {
    clearTimeout(schedulerRef.current);
    setPulso({ beat: 0, sub: 0, acento: false });
    setConfig((c) => {
      const nuevo = { ...c, ejecutando: false };
      try {
        localStorage.setItem("metronomo_config_v2", JSON.stringify(nuevo));
      } catch {}
      return nuevo;
    });
  }, []);

  const alternar = useCallback(() => {
    if (configRef.current.ejecutando) detener();
    else iniciar();
  }, [iniciar, detener]);

  const actualizar = useCallback((parche) => {
    setConfig((c) => {
      const nuevo = { ...c, ...parche };
      try {
        localStorage.setItem("metronomo_config_v2", JSON.stringify(nuevo));
      } catch {}
      return nuevo;
    });
    if (configRef.current.ejecutando) {
      clearTimeout(schedulerRef.current);
      setTimeout(() => {
        const ctx = obtenerCtx();
        siguienteNotaRef.current = ctx.currentTime + 0.05;
        beatActualRef.current = 0;
        scheduler();
      }, 15);
    }
  }, []);

  const tap = useCallback(() => {
    const ahora = Date.now();
    tapsRef.current = [...tapsRef.current.filter((t) => ahora - t < 4000), ahora];
    if (tapsRef.current.length >= 2) {
      const intervalos = tapsRef.current.slice(1).map((t, i) => t - tapsRef.current[i]);
      const promedio = intervalos.reduce((a, b) => a + b) / intervalos.length;
      const bpm = Math.round(60000 / promedio);
      if (bpm >= 20 && bpm <= 300) actualizar({ bpm });
    }
  }, [actualizar]);

  useEffect(
    () => () => {
      clearTimeout(schedulerRef.current);
    },
    []
  );

  return { config, pulso, alternar, actualizar, tap, iniciar, detener };
}

// ════════════════════════════════════════════════════════════
// COMPONENTE: MedidorAfinacion (semicírculo con aguja)
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
  const colorPunto = !activo ? "#e5e7eb" : afinado ? "#16a34a" : "#374151";

  return (
    <div className="flex flex-col items-center select-none">
      <svg viewBox="0 0 300 140" className="w-72 sm:w-80 h-36 sm:h-40">
        {/* Zona roja izquierda */}
        <path
          d="M 38 130 A 112 112 0 0 1 78 42"
          fill="none"
          stroke="#fecaca"
          strokeWidth="12"
          strokeLinecap="round"
          opacity="0.6"
        />
        {/* Zona ámbar izquierda */}
        <path
          d="M 78 42 A 112 112 0 0 1 116 22"
          fill="none"
          stroke="#fde68a"
          strokeWidth="12"
          strokeLinecap="round"
          opacity="0.6"
        />
        {/* Zona verde */}
        <path
          d="M 116 22 A 112 112 0 0 1 184 22"
          fill="none"
          stroke="#bbf7d0"
          strokeWidth="12"
          strokeLinecap="round"
          opacity="0.8"
        />
        {/* Zona ámbar derecha */}
        <path
          d="M 184 22 A 112 112 0 0 1 222 42"
          fill="none"
          stroke="#fde68a"
          strokeWidth="12"
          strokeLinecap="round"
          opacity="0.6"
        />
        {/* Zona roja derecha */}
        <path
          d="M 222 42 A 112 112 0 0 1 262 130"
          fill="none"
          stroke="#fecaca"
          strokeWidth="12"
          strokeLinecap="round"
          opacity="0.6"
        />

        {/* Marcas de ticks */}
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

        {/* Etiquetas */}
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

        {/* Aguja */}
        <line
          x1={cx}
          y1={cy}
          x2={nx}
          y2={ny}
          stroke={colorAguja}
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{ transition: "all 0.1s ease-out" }}
        />
        {/* Punto central */}
        <circle cx={cx} cy={cy} r="6" fill={colorPunto} style={{ transition: "fill 0.2s" }} />
        <circle cx={cx} cy={cy} r="3" fill="white" />
      </svg>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// COMPONENTE: EstadoAfinacion
// ════════════════════════════════════════════════════════════

function EstadoAfinacion({ cents, activo, nota }) {
  if (!activo || !nota)
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-400 text-xs font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-pulse" />
        Esperando señal
      </span>
    );

  const abs = Math.abs(cents);
  if (abs < 5)
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
        Afinado
      </span>
    );
  if (cents > 20)
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        Muy alto
      </span>
    );
  if (cents < -20)
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-600 text-xs font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
        Muy bajo
      </span>
    );
  if (cents > 0)
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-600 text-xs font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        Ligeramente alto
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-600 text-xs font-semibold">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
      Ligeramente bajo
    </span>
  );
}

// ════════════════════════════════════════════════════════════
// COMPONENTE: FeedbackAfinacion
// ════════════════════════════════════════════════════════════

function FeedbackAfinacion({ cents, activo, nota }) {
  if (!activo || !nota) return null;
  const abs = Math.abs(cents);

  let mensaje = null;
  if (abs < 5) {
    mensaje = {
      texto: "Perfecta afinación. Mantén el tono.",
      color: "text-green-700",
      bg: "bg-green-50 border-green-100",
    };
  } else if (abs < 15) {
    mensaje = {
      texto:
        cents > 0
          ? "Baja un poco la afinación. Relaja levemente la embocadura o reduce la presión de aire."
          : "Sube un poco la afinación. Aumenta la presión de aire o ajusta la embocadura.",
      color: "text-amber-700",
      bg: "bg-amber-50 border-amber-100",
    };
  } else {
    mensaje = {
      texto:
        cents > 0
          ? "La nota está bastante alta. Revisa la afinación del instrumento y relaja la embocadura."
          : "La nota está bastante baja. Revisa la posición del instrumento y aumenta el soporte de aire.",
      color: "text-red-700",
      bg: "bg-red-50 border-red-100",
    };
  }

  return (
    <div className={`w-full max-w-sm rounded-xl border px-4 py-3 ${mensaje.bg}`}>
      <p className={`text-xs leading-relaxed ${mensaje.color}`}>{mensaje.texto}</p>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// COMPONENTE: PanelAfinador
// ════════════════════════════════════════════════════════════

function PanelAfinador({ a4, setA4 }) {
  const a4Ref = useRef(a4);
  useEffect(() => {
    a4Ref.current = a4;
  }, [a4]);
  const { estado, estadoMic, errorMic, iniciar, detener } = usePitchDetection(a4Ref);

  const centsDisplay = estado.activo ? parseFloat(estado.cents.toFixed(1)) : 0;

  return (
    <div className="flex flex-col items-center gap-5 px-4 py-6">
      {/* Estado del micrófono */}
      {estadoMic !== "activo" ? (
        <div className="flex flex-col items-center gap-4 py-8">
          <button
            onClick={iniciar}
            disabled={estadoMic === "solicitando"}
            className="w-16 h-16 rounded-2xl bg-gray-900 hover:bg-gray-700 active:scale-95 transition-all flex items-center justify-center shadow-sm disabled:opacity-50"
          >
            <svg
              className="w-7 h-7 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 0 1 6 0v8.25a3 3 0 0 1-3 3z"
              />
            </svg>
          </button>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-900">
              {estadoMic === "solicitando" ? "Solicitando acceso…" : "Iniciar afinador"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Se necesita permiso al micrófono</p>
          </div>
          {errorMic && (
            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 max-w-xs">
              <p className="text-xs text-red-600 font-medium">Error de micrófono</p>
              <p className="text-xs text-red-500 mt-0.5">{errorMic}</p>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Nota detectada */}
          <div className="flex flex-col items-center gap-1 w-full">
            <div
              className="text-[90px] sm:text-[110px] font-black leading-none tracking-tight text-gray-900 tabular-nums min-h-[100px] flex items-center justify-center"
              style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
            >
              {estado.activo && estado.nota ? (
                estado.nota.nombre
              ) : (
                <span className="text-gray-200">—</span>
              )}
            </div>
            {estado.activo && estado.nota && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                {estado.nota.enarmonico && (
                  <span className="text-gray-300">/ {estado.nota.enarmonico}</span>
                )}
                <span>
                  {estado.nota.nombreEn}
                  {estado.nota.octava}
                </span>
                <span className="text-gray-300">·</span>
                <span className="font-mono">{estado.freq.toFixed(1)} Hz</span>
              </div>
            )}
          </div>

          {/* Medidor */}
          <MedidorAfinacion cents={centsDisplay} activo={estado.activo} />

          {/* Cents */}
          <div className="text-center">
            <span
              className={`text-2xl font-bold tabular-nums ${
                !estado.activo
                  ? "text-gray-300"
                  : Math.abs(estado.cents) < 7
                  ? "text-green-600"
                  : Math.abs(estado.cents) < 20
                  ? "text-amber-600"
                  : "text-red-600"
              }`}
            >
              {estado.activo ? `${estado.cents > 0 ? "+" : ""}${estado.cents.toFixed(1)} ¢` : "—"}
            </span>
          </div>

          {/* Estado */}
          <EstadoAfinacion cents={estado.cents} activo={estado.activo} nota={estado.nota} />

          {/* Feedback educativo */}
          <FeedbackAfinacion cents={estado.cents} activo={estado.activo} nota={estado.nota} />

          {/* Señal */}
          {estado.activo && (
            <div className="w-full max-w-sm">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Nivel de señal</span>
                <span>{Math.round(estado.confianza * 100)}%</span>
              </div>
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-900 rounded-full transition-all duration-200"
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

      {/* Configuración de referencia */}
      <div className="w-full max-w-sm mt-2 bg-gray-50 rounded-2xl border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
            Afinación de referencia
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
          <span>435</span>
          <span>437</span>
          <span>440</span>
          <span>442</span>
          <span>445</span>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// DATOS DE COMPASES
// ════════════════════════════════════════════════════════════

const COMPASES_SIMPLES = [
  { beats: 2, label: "2/4", descripcion: "Dos tiempos de negra" },
  { beats: 3, label: "3/4", descripcion: "Vals — tres tiempos" },
  { beats: 4, label: "4/4", descripcion: "Común — cuatro tiempos" },
  { beats: 5, label: "5/4", descripcion: "Cinco tiempos — asimétrico" },
  { beats: 7, label: "7/4", descripcion: "Siete tiempos — asimétrico" },
];

const COMPASES_COMPUESTOS = [
  { beats: 2, label: "6/8", descripcion: "Dos grupos de tres corcheas", subdivision: 3 },
  { beats: 3, label: "9/8", descripcion: "Tres grupos de tres corcheas", subdivision: 3 },
  { beats: 4, label: "12/8", descripcion: "Cuatro grupos de tres corcheas", subdivision: 3 },
];

const SUBDIVISIONES = [
  { v: 1, etiqueta: "Negras", simbolo: "♩" },
  { v: 2, etiqueta: "Corcheas", simbolo: "♩ ♩" },
  { v: 3, etiqueta: "Tresillos", simbolo: "3" },
  { v: 4, etiqueta: "Semicorcheas", simbolo: "♬" },
];

const SONIDOS = [
  { v: "suave", etiqueta: "Suave" },
  { v: "click", etiqueta: "Click" },
  { v: "madera", etiqueta: "Madera" },
  { v: "digital", etiqueta: "Digital" },
];

const PRESETS_BPM = [60, 72, 90, 100, 120, 140, 160, 180];

// ════════════════════════════════════════════════════════════
// COMPONENTE: PulsosVisuales
// ════════════════════════════════════════════════════════════

function PulsosVisuales({ pulso, pulsacionesPorCompas, subdivision, ejecutando }) {
  return (
    <div className="flex gap-2 justify-center items-center py-2">
      {Array.from({ length: pulsacionesPorCompas }).map((_, i) => {
        const activo = ejecutando && pulso.beat === i;
        const esAcento = i === 0;
        return (
          <div key={i} className="flex flex-col items-center gap-1">
            <div
              className={`rounded-full border-2 transition-all duration-75 ${
                activo
                  ? esAcento
                    ? "bg-gray-900 border-gray-900 scale-110 shadow-md"
                    : "bg-gray-500 border-gray-500 scale-105"
                  : esAcento
                  ? "bg-transparent border-gray-900"
                  : "bg-transparent border-gray-300"
              }`}
              style={{ width: esAcento ? 20 : 16, height: esAcento ? 20 : 16 }}
            />
            {subdivision > 1 && (
              <div className="flex gap-0.5">
                {Array.from({ length: subdivision }).map((_, s) => {
                  const subActivo =
                    ejecutando && pulso.beat === i && pulso.sub === i * subdivision + s;
                  return (
                    <div
                      key={s}
                      className={`w-1 h-1 rounded-full transition-all duration-75 ${
                        subActivo ? "bg-gray-700" : "bg-gray-200"
                      }`}
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// COMPONENTE: PanelMetronomo
// ════════════════════════════════════════════════════════════

function PanelMetronomo() {
  const { config, pulso, alternar, actualizar, tap } = useMetronomo();
  const [bpmInput, setBpmInput] = useState(String(config.bpm));
  const [tipoCompas, setTipoCompas] = useState("simple");

  useEffect(() => {
    setBpmInput(String(config.bpm));
  }, [config.bpm]);

  const compasesActuales = tipoCompas === "simple" ? COMPASES_SIMPLES : COMPASES_COMPUESTOS;

  const seleccionarCompas = (compas) => {
    if (tipoCompas === "compuesto") {
      actualizar({ pulsacionesPorCompas: compas.beats, subdivision: compas.subdivision });
    } else {
      actualizar({ pulsacionesPorCompas: compas.beats });
    }
  };

  const compasSeleccionado = compasesActuales.find((c) => c.beats === config.pulsacionesPorCompas);

  const etiquetaCompas =
    tipoCompas === "compuesto"
      ? COMPASES_COMPUESTOS.find((c) => c.beats === config.pulsacionesPorCompas)?.label
      : `${config.pulsacionesPorCompas}/4`;

  return (
    <div className="flex flex-col items-center gap-6 px-4 py-6">
      {/* BPM principal */}
      <div className="flex flex-col items-center gap-2 w-full">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tempo</span>
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              const v = Math.max(20, config.bpm - 1);
              actualizar({ bpm: v });
            }}
            className="w-11 h-11 rounded-xl border border-gray-200 text-gray-700 text-xl font-light hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center"
          >
            −
          </button>
          <div className="flex flex-col items-center">
            <input
              type="number"
              value={bpmInput}
              onChange={(e) => setBpmInput(e.target.value)}
              onBlur={() => {
                const v = Math.max(20, Math.min(300, Number(bpmInput)));
                actualizar({ bpm: v });
                setBpmInput(String(v));
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.target.blur();
              }}
              className="w-32 text-center text-7xl font-black bg-transparent text-gray-900 outline-none leading-none tabular-nums"
              style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
            />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
              BPM
            </span>
          </div>
          <button
            onClick={() => {
              const v = Math.min(300, config.bpm + 1);
              actualizar({ bpm: v });
            }}
            className="w-11 h-11 rounded-xl border border-gray-200 text-gray-700 text-xl font-light hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center"
          >
            +
          </button>
        </div>

        {/* Slider BPM */}
        <input
          type="range"
          min={20}
          max={300}
          step={1}
          value={config.bpm}
          onChange={(e) => actualizar({ bpm: Number(e.target.value) })}
          className="w-full max-w-sm h-1.5 accent-gray-900 mt-1"
        />
      </div>

      {/* Pulsos visuales */}
      <PulsosVisuales
        pulso={pulso}
        pulsacionesPorCompas={config.pulsacionesPorCompas}
        subdivision={config.subdivision}
        ejecutando={config.ejecutando}
      />

      {/* Start / Stop + Tap */}
      <div className="flex items-center gap-4">
        <button
          onClick={tap}
          className="px-5 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all"
        >
          Tap
        </button>
        <button
          onClick={alternar}
          className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white shadow-sm transition-all active:scale-95 ${
            config.ejecutando ? "bg-red-600 hover:bg-red-700" : "bg-gray-900 hover:bg-gray-700"
          }`}
        >
          {config.ejecutando ? (
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="5" width="4" height="14" rx="1.5" />
              <rect x="14" y="5" width="4" height="14" rx="1.5" />
            </svg>
          ) : (
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        <div className="px-5 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 text-center min-w-[60px]">
          {etiquetaCompas || "4/4"}
        </div>
      </div>

      {/* Presets BPM */}
      <div className="w-full max-w-sm">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
          Tempo rápido
        </p>
        <div className="flex gap-1.5 flex-wrap">
          {PRESETS_BPM.map((p) => (
            <button
              key={p}
              onClick={() => actualizar({ bpm: p })}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                config.bpm === p
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Tipo de compás */}
      <div className="w-full max-w-sm">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
          Tipo de compás
        </p>
        <div className="flex gap-1.5 bg-gray-100 rounded-xl p-1">
          {["simple", "compuesto"].map((tipo) => (
            <button
              key={tipo}
              onClick={() => setTipoCompas(tipo)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                tipoCompas === tipo ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
              }`}
            >
              {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Selector de compás */}
      <div className="w-full max-w-sm">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Compás</p>
        <div className="flex gap-1.5 flex-wrap">
          {compasesActuales.map((c) => (
            <button
              key={c.label}
              onClick={() => seleccionarCompas(c)}
              className={`px-3 py-2 rounded-xl border text-sm font-bold transition-all ${
                compasSeleccionado?.label === c.label
                  ? "bg-gray-900 border-gray-900 text-white"
                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        {compasSeleccionado && (
          <p className="text-xs text-gray-400 mt-2">{compasSeleccionado.descripcion}</p>
        )}
      </div>

      {/* Subdivisión */}
      <div className="w-full max-w-sm">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
          Subdivisión
        </p>
        <div className="flex gap-1.5">
          {SUBDIVISIONES.map((s) => (
            <button
              key={s.v}
              onClick={() => actualizar({ subdivision: s.v })}
              disabled={tipoCompas === "compuesto"}
              className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-all ${
                config.subdivision === s.v && tipoCompas !== "compuesto"
                  ? "bg-gray-900 border-gray-900 text-white"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              }`}
            >
              {s.simbolo}
            </button>
          ))}
        </div>
        {tipoCompas === "compuesto" && (
          <p className="text-xs text-gray-400 mt-2">
            Los compases compuestos tienen subdivisión ternaria fija.
          </p>
        )}
      </div>

      {/* Sonido y volumen */}
      <div className="w-full max-w-sm bg-gray-50 rounded-2xl border border-gray-100 p-4 flex flex-col gap-4">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
            Sonido
          </p>
          <div className="flex gap-1.5 flex-wrap">
            {SONIDOS.map((s) => (
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
            <span className="text-xs text-gray-500">{Math.round(config.volumen * 100)}%</span>
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
// COMPONENTE: PanelGuia
// ════════════════════════════════════════════════════════════

const SECCIONES_GUIA = [
  {
    titulo: "¿Qué es un compás?",
    contenido:
      "Un compás es la unidad de medida del tiempo en la música. Define cuántos pulsos ocurren antes de que el ciclo se repita. En notación musical, se escribe como una fracción: el numerador indica cuántos tiempos tiene el compás, y el denominador indica qué figura recibe un tiempo.",
  },
  {
    titulo: "Compases simples vs. compuestos",
    contenido:
      "En un compás simple, cada tiempo se divide en dos partes iguales (división binaria). Los más comunes son 2/4, 3/4 y 4/4.\n\nEn un compás compuesto, cada tiempo se divide en tres partes iguales (división ternaria). Los más comunes son 6/8, 9/8 y 12/8. Estos dan una sensación más fluida y balanceada, típica del vals o la jiga.",
  },
  {
    titulo: "Cómo sentir el 6/8",
    contenido:
      "El 6/8 tiene 6 corcheas por compás, agrupadas en 2 grupos de 3. El acento cae en la primera corchea de cada grupo. Aunque hay 6 notas, se siente como 2 pulsos principales. Intenta contar '1-2-3 / 2-2-3' mientras caminas.",
  },
  {
    titulo: "Cómo sentir el 9/8 y 12/8",
    contenido:
      "El 9/8 tiene 3 pulsos ternarios (cuenta: 1-2-3 / 2-2-3 / 3-2-3). El 12/8 tiene 4 pulsos ternarios (cuenta: 1-2-3 / 2-2-3 / 3-2-3 / 4-2-3). Ambos tienen esa sensación ondulante y fluida característica de la música compuesta.",
  },
  {
    titulo: "¿Qué son las subdivisiones?",
    contenido:
      "Las subdivisiones dividen cada pulso en partes más pequeñas. Practicar con subdivisiones ayuda a mantener el pulso interno estable. Por ejemplo, en 4/4 con subdivisión de corcheas, cada tiempo se divide en dos; con tresillos, en tres partes iguales.",
  },
  {
    titulo: "Cómo usar el metrónomo",
    contenido:
      "Empieza siempre a un tempo donde puedas tocar sin errores. Aumenta el BPM gradualmente (5-10 BPM a la vez) conforme dominas el pasaje. Practica con subdivisiones para solidificar el pulso. Usa el tap tempo para encontrar el pulso de una grabación.",
  },
];

function PanelGuia() {
  const [abierto, setAbierto] = useState(null);

  return (
    <div className="px-4 py-6">
      <div className="max-w-xl mx-auto">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900">Guía musical</h2>
          <p className="text-sm text-gray-500 mt-0.5">Conceptos esenciales de compás y ritmo.</p>
        </div>

        <div className="flex flex-col gap-2">
          {SECCIONES_GUIA.map((sec, i) => (
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

        {/* Tabla de referencia de compases */}
        <div className="mt-6 rounded-2xl border border-gray-200 overflow-hidden bg-white">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900">Referencia rápida de compases</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {[
              { compas: "2/4", tipo: "Simple", pulsos: 2, division: "Binaria", ejemplo: "Marcha" },
              { compas: "3/4", tipo: "Simple", pulsos: 3, division: "Binaria", ejemplo: "Vals" },
              {
                compas: "4/4",
                tipo: "Simple",
                pulsos: 4,
                division: "Binaria",
                ejemplo: "Pop, Rock",
              },
              {
                compas: "5/4",
                tipo: "Simple",
                pulsos: 5,
                division: "Binaria",
                ejemplo: "Asimétrico",
              },
              {
                compas: "6/8",
                tipo: "Compuesto",
                pulsos: 2,
                division: "Ternaria",
                ejemplo: "Jiga, Barcarola",
              },
              {
                compas: "9/8",
                tipo: "Compuesto",
                pulsos: 3,
                division: "Ternaria",
                ejemplo: "Reel irlandés",
              },
              {
                compas: "12/8",
                tipo: "Compuesto",
                pulsos: 4,
                division: "Ternaria",
                ejemplo: "Blues, Slow",
              },
            ].map((fila) => (
              <div key={fila.compas} className="flex items-center px-5 py-3 gap-4">
                <span className="text-base font-black text-gray-900 w-12 flex-shrink-0">
                  {fila.compas}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-700">{fila.ejemplo}</p>
                  <p className="text-xs text-gray-400">
                    {fila.pulsos} pulsos · División {fila.division.toLowerCase()}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    fila.tipo === "Simple"
                      ? "bg-blue-50 border-blue-100 text-blue-600"
                      : "bg-amber-50 border-amber-100 text-amber-600"
                  }`}
                >
                  {fila.tipo}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL: AfinadorMetronomo
// ════════════════════════════════════════════════════════════

const TABS = [
  { id: "afinador", etiqueta: "Afinador" },
  { id: "metronomo", etiqueta: "Metrónomo" },
  { id: "guia", etiqueta: "Guía" },
];

export default function AfinadorMetronomo() {
  const [tab, setTab] = useState("afinador");
  const [a4, setA4] = useState(440);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Encabezado */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-5 flex items-start justify-between">
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
            <p className="text-xs text-gray-400 mt-0.5">Detección de pitch · Tempo · Compás</p>
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
                d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25"
              />
            </svg>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex border-b border-gray-200 -mb-px">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all -mb-px ${
                  tab === t.id
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-400 hover:text-gray-700"
                }`}
              >
                {t.etiqueta}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-2xl mx-auto">
        {tab === "afinador" && <PanelAfinador a4={a4} setA4={setA4} />}
        {tab === "metronomo" && <PanelMetronomo />}
        {tab === "guia" && <PanelGuia />}
      </div>
    </div>
  );
}
