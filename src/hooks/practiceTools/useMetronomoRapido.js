import { useState, useRef, useCallback, useEffect } from "react";
import { BPM_MIN, BPM_MAX } from "../../modules/practica/constants/index";

const CONFIG_DEFAULT = {
  bpm: 120, pulsaciones: 4, subdivision: 1, sonido: "click", volumen: 0.8,
};

const LS_KEY = "practica_quick_v1";

function leerLocalStorage() {
  try {
    const g = localStorage.getItem(LS_KEY);
    return g ? { ...CONFIG_DEFAULT, ...JSON.parse(g) } : CONFIG_DEFAULT;
  } catch {
    return CONFIG_DEFAULT;
  }
}

function escribirLocalStorage(config) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(config)); } catch {}
}

export function useMetronomoRapido(motorRef) {
  const [config, setConfig] = useState(leerLocalStorage);
  const [ejecutando, setEjecutando] = useState(false);
  const [pulso, setPulso] = useState({ beat: 0, acento: false });
  const configRef = useRef(config);
  const tapsRef = useRef([]);

  configRef.current = config;

  // Sincronizar con backend al montar (si hay datos del servidor se llaman desde el padre)
  const sincronizarDesdeServidor = useCallback((serverConfig) => {
    if (!serverConfig) return;
    const merged = { ...CONFIG_DEFAULT, ...serverConfig };
    setConfig(merged);
    escribirLocalStorage(merged);
  }, []);

  const actualizar = useCallback((parche) => {
    setConfig((c) => {
      const nueva = { ...c, ...parche };
      escribirLocalStorage(nueva);
      // Si el motor está corriendo, reiniciar con nueva config
      const motor = motorRef.current;
      if (motor && motor.estado === "reproduciendo") {
        motor.detener();
        motor.onTick = (tick) => {
          if (!tick.esSubdivision) setPulso({ beat: tick.numeroBeat - 1, acento: tick.esAcento });
        };
        motor.iniciarSimple(nueva);
      } else if (motor) {
        motor.actualizarSonido(nueva.sonido, nueva.volumen);
      }
      return nueva;
    });
  }, [motorRef]);

  const alternar = useCallback(() => {
    const motor = motorRef.current;
    if (!motor) return;
    if (ejecutando) {
      motor.detener();
      setEjecutando(false);
      setPulso({ beat: 0, acento: false });
    } else {
      motor.onTick = (tick) => {
        if (!tick.esSubdivision) setPulso({ beat: tick.numeroBeat - 1, acento: tick.esAcento });
      };
      motor.onFin = () => {};
      motor.iniciarSimple(configRef.current);
      setEjecutando(true);
    }
  }, [ejecutando, motorRef]);

  const tap = useCallback(() => {
    const ahora = Date.now();
    tapsRef.current = [...tapsRef.current.filter((t) => ahora - t < 5000), ahora];
    if (tapsRef.current.length >= 2) {
      const intervalos = tapsRef.current.slice(1).map((t, i) => t - tapsRef.current[i]);
      const promedio = intervalos.reduce((a, b) => a + b) / intervalos.length;
      const bpm = Math.round(60000 / promedio);
      if (bpm >= BPM_MIN && bpm <= BPM_MAX) actualizar({ bpm });
    }
  }, [actualizar]);

  useEffect(() => {
    if (pulso.acento && navigator.vibrate) navigator.vibrate(20);
  }, [pulso.acento]);

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      if (motorRef.current?.estado === "reproduciendo") {
        motorRef.current.detener();
      }
    };
  }, [motorRef]);

  return { config, ejecutando, pulso, alternar, actualizar, tap, sincronizarDesdeServidor };
}