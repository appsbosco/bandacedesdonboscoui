import { useState, useEffect, useRef, useCallback } from "react";
import { aplicarVentanaHamming, calcularRMS, algoritmoyYIN } from "../../modules/practica/utils/dsp.js";
import { construirNotas, notaMasCercana, calcularCents } from "../../modules/practica/utils/teoria.js";

export function usePitchDetection(a4Ref) {
  const [estado, setEstado] = useState({
    nota: null, freq: 0, cents: 0, confianza: 0, activo: false,
  });
  const [estadoMic, setEstadoMic] = useState("inactivo");
  const [errorMic, setErrorMic] = useState(null);

  const audioCtxRef  = useRef(null);
  const analyserRef  = useRef(null);
  const streamRef    = useRef(null);
  const rafRef       = useRef(null);
  const freqSuavRef  = useRef(null);
  const notaEstRef   = useRef(null);
  const contadorRef  = useRef(0);
  const centsSuavRef = useRef(0);
  const activoRef    = useRef(false);

  const bucle = useCallback(() => {
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
        freqSuavRef.current = freqSuavRef.current == null
          ? pitch
          : alpha * pitch + (1 - alpha) * freqSuavRef.current;

        const notas = construirNotas(a4Ref.current);
        const cercana = notaMasCercana(freqSuavRef.current, notas);
        const centsRaw = calcularCents(freqSuavRef.current, cercana.freq);
        centsSuavRef.current = 0.3 * centsRaw + 0.7 * centsSuavRef.current;

        const clave = cercana.nombre + cercana.octava;
        if (notaEstRef.current === clave) contadorRef.current++;
        else { notaEstRef.current = clave; contadorRef.current = 1; }

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
  }, [a4Ref]);

  const iniciar = useCallback(async () => {
    if (estadoMic === "activo") return;
    setEstadoMic("solicitando");
    setErrorMic(null);
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
      bucle();
    } catch (e) {
      setErrorMic(e.message || "Acceso denegado al micrófono");
      setEstadoMic("error");
    }
  }, [estadoMic, bucle]);

  const detener = useCallback(() => {
    activoRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    analyserRef.current = null;
    streamRef.current = null;
    freqSuavRef.current = null;
    notaEstRef.current = null;
    contadorRef.current = 0;
    centsSuavRef.current = 0;
    setEstadoMic("inactivo");
    setEstado({ nota: null, freq: 0, cents: 0, confianza: 0, activo: false });
  }, []);

  useEffect(() => () => detener(), [detener]);

  return { estado, estadoMic, errorMic, iniciar, detener };
}