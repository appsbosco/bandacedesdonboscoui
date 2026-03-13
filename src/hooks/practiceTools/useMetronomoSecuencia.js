import { useState, useCallback, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  GET_MIS_SECUENCIAS,
  GET_ULTIMA_SECUENCIA,
} from "../../graphql/queries/practiceTools.js";
import {
  CREAR_SECUENCIA,
  ACTUALIZAR_SECUENCIA,
  MARCAR_ULTIMA_SECUENCIA,
} from "../../graphql/mutations/practiceTools.js";

const SS_KEY = "practica_seq_borrador_v1";

export function crearSeccionNueva(sobreescribir = {}) {
  const uid = `sec_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  return {
    id: uid,
    seccionId: uid,
    nombre: "Nueva sección",
    compas: { numerador: 4, denominador: 4 },
    tempo: { tipo: "fijo", bpm: 120 },
    subdivision: 1,
    patronAcento: [1, 0, 0, 0],
    repeticiones: 4,
    ...sobreescribir,
  };
}

const SECCIONES_EJEMPLO = [
  crearSeccionNueva({ nombre: "Intro",      tempo: { tipo: "fijo", bpm: 80  }, repeticiones: 2 }),
  crearSeccionNueva({ nombre: "Desarrollo", tempo: { tipo: "fijo", bpm: 100 }, repeticiones: 4 }),
  crearSeccionNueva({ nombre: "Clímax",     tempo: { tipo: "curva", inicio: 100, fin: 120, curva: "lineal" }, repeticiones: 4 }),
];

function leerBorrador() {
  try {
    const g = sessionStorage.getItem(SS_KEY);
    if (g) {
      const p = JSON.parse(g);
      if (Array.isArray(p) && p.length > 0) return p;
    }
  } catch {}
  return null;
}

function escribirBorrador(secciones) {
  try { sessionStorage.setItem(SS_KEY, JSON.stringify(secciones)); } catch {}
}

export function useMetronomoSecuencia(motorRef, userId) {
  const [secciones, setSecciones]           = useState(() => leerBorrador() || SECCIONES_EJEMPLO);
  const [estadoRepro, setEstadoRepro]       = useState("detenido");
  const [tickActual, setTickActual]         = useState(null);
  const [countIn, setCountIn]               = useState(true);
  const [countInBeats, setCountInBeats]     = useState(2);
  const [sonido, setSonido]                 = useState("click");
  const [volumen, setVolumen]               = useState(0.8);
  const [secuenciaActualId, setSecuenciaActualId] = useState(null);
  const [guardandoEnBD, setGuardandoEnBD]   = useState(false);
  const [errores, setErrores]               = useState(null);

  // ── Borrador ─────────────────────────────────────────────
  useEffect(() => {
    if (secciones.length > 0) escribirBorrador(secciones);
  }, [secciones]);

  // ── GraphQL queries ──────────────────────────────────────
  const { data: dataSecuencias } = useQuery(GET_MIS_SECUENCIAS, {
    skip: !userId,
    fetchPolicy: "cache-and-network",
  });

  // FIX: onCompleted no es confiable en Apollo v3.8+ — usar useEffect sobre `data`
  const { data: dataUltima } = useQuery(GET_ULTIMA_SECUENCIA, {
    skip: !userId,
    fetchPolicy: "network-only",
  });

  const ultimaCargadaRef = useRef(false);
  useEffect(() => {
    // Solo cargar una vez al montar, y solo si no hay borrador local
    if (ultimaCargadaRef.current) return;
    if (!dataUltima?.ultimaSecuencia) return;
    if (leerBorrador()) return; // Hay borrador local — el usuario lo tiene como prioridad
    ultimaCargadaRef.current = true;
    cargarSecuencia(dataUltima.ultimaSecuencia);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataUltima]);

  // ── GraphQL mutations ────────────────────────────────────
  // FIX: refetchQueries con string del operationName, no el DocumentNode
  const [mutCrear]        = useMutation(CREAR_SECUENCIA,    { refetchQueries: ["MisSecuencias"] });
  const [mutActualizar]   = useMutation(ACTUALIZAR_SECUENCIA);
  const [mutMarcarUltima] = useMutation(MARCAR_ULTIMA_SECUENCIA);

  // ── Carga de secuencia desde BD ──────────────────────────
  const cargarSecuencia = useCallback((seq) => {
    setSecciones(
      seq.secciones.map((s) => ({
        ...s,
        // Garantizar que id y seccionId estén siempre sincronizados
        id: s.seccionId || s.id,
        seccionId: s.seccionId || s.id,
      }))
    );
    setCountIn(seq.countIn ?? true);
    setCountInBeats(seq.countInBeats ?? 2);
    setSonido(seq.sonido ?? "click");
    setVolumen(seq.volumen ?? 0.8);
    setSecuenciaActualId(seq.id);
  }, []);

  // ── Guardar en BD ────────────────────────────────────────
  const guardarEnBD = useCallback(async (nombre, descripcion = "") => {
    if (!userId) return null;
    setGuardandoEnBD(true);
    setErrores(null);

    // FIX: no destruir `id` — el campo que el backend espera es `seccionId`
    // Preservar `id` local para que el motor siga funcionando tras guardar
    const seccionesParaBD = secciones.map((sec) => ({
      seccionId: sec.seccionId || sec.id,
      nombre: sec.nombre,
      compas: sec.compas,
      tempo: sec.tempo,
      subdivision: sec.subdivision,
      patronAcento: sec.patronAcento,
      repeticiones: sec.repeticiones,
    }));

    const input = {
      nombre,
      descripcion,
      secciones: seccionesParaBD,
      countIn,
      countInBeats,
      sonido,
      volumen,
    };

    try {
      if (secuenciaActualId) {
        const { data } = await mutActualizar({ variables: { id: secuenciaActualId, input } });
        return data.actualizarSecuencia;
      } else {
        const { data } = await mutCrear({ variables: { input } });
        const newId = data.crearSecuencia.id;
        setSecuenciaActualId(newId);
        // Marcar como última usada (no bloquear si falla)
        mutMarcarUltima({ variables: { id: newId } }).catch(() => {});
        return data.crearSecuencia;
      }
    } catch (e) {
      setErrores(e.message);
      return null;
    } finally {
      setGuardandoEnBD(false);
    }
  }, [userId, secciones, countIn, countInBeats, sonido, volumen, secuenciaActualId,
      mutCrear, mutActualizar, mutMarcarUltima]);

  // ── Motor: reproducción ──────────────────────────────────
  const arrancarMotor = useCallback((desdeId) => {
    const motor = motorRef.current;
    if (!motor) return;
    motor.onTick = (tick) => setTickActual(tick);
    motor.onFin  = () => { setEstadoRepro("detenido"); setTickActual(null); };
    motor.reproducir(secciones, desdeId, countIn, countInBeats, sonido, volumen);
    setEstadoRepro("reproduciendo");
  }, [motorRef, secciones, countIn, countInBeats, sonido, volumen]);

  const pausarReanudar = useCallback(() => {
    const motor = motorRef.current;
    if (!motor) return;
    if (estadoRepro === "reproduciendo") {
      motor.pausar();
      setEstadoRepro("pausado");
    } else if (estadoRepro === "pausado") {
      motor.reproducir(secciones, undefined, countIn, countInBeats, sonido, volumen);
      setEstadoRepro("reproduciendo");
    } else {
      arrancarMotor();
    }
  }, [estadoRepro, arrancarMotor, motorRef, secciones, countIn, countInBeats, sonido, volumen]);

  const detener = useCallback(() => {
    motorRef.current?.detener();
    setEstadoRepro("detenido");
    setTickActual(null);
  }, [motorRef]);

  const reproducirDesde = useCallback((id) => {
    motorRef.current?.detener();
    setTimeout(() => arrancarMotor(id), 30);
  }, [arrancarMotor, motorRef]);

  // ── CRUD secciones ───────────────────────────────────────
  const agregarSeccion = useCallback(() => {
    const nueva = crearSeccionNueva({ nombre: `Sección ${secciones.length + 1}` });
    setSecciones((s) => [...s, nueva]);
    return nueva.id;
  }, [secciones.length]);

  const eliminarSeccion = useCallback((id) => {
    setSecciones((s) => s.filter((sec) => sec.id !== id));
  }, []);

  const duplicarSeccion = useCallback((seccion) => {
    const uid = `sec_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const copia = crearSeccionNueva({
      ...seccion,
      id: uid,
      seccionId: uid,
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
    setSecciones((s) => s.map((sec) => sec.id === id ? { ...sec, ...parche } : sec));
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

  // ── Export / Import local (JSON) ─────────────────────────
  const exportarJSON = useCallback(() => {
    const preset = {
      nombre: "Preset",
      secciones,
      countIn, countInBeats, sonido, volumen,
      fecha: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(preset, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `secuencia-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [secciones, countIn, countInBeats, sonido, volumen]);

  const importarJSON = useCallback((archivo) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const preset = JSON.parse(e.target.result);
        if (Array.isArray(preset.secciones)) {
          setSecciones(preset.secciones.map((s) => {
            const uid = s.seccionId || s.id || `sec_${Date.now()}_${Math.random().toString(36).slice(2)}`;
            return { ...s, id: uid, seccionId: uid };
          }));
          if (preset.countIn     !== undefined) setCountIn(preset.countIn);
          if (preset.countInBeats !== undefined) setCountInBeats(preset.countInBeats);
          if (preset.sonido)                    setSonido(preset.sonido);
          if (preset.volumen     !== undefined) setVolumen(preset.volumen);
          setSecuenciaActualId(null);
        }
      } catch { console.error("Error al importar JSON"); }
    };
    reader.readAsText(archivo);
  }, []);

  return {
    secciones,
    estadoRepro,
    tickActual,
    countIn,    setCountIn,
    countInBeats, setCountInBeats,
    sonido,     setSonido,
    volumen,    setVolumen,
    secuenciaActualId,
    secuenciasEnBD: dataSecuencias?.misSecuencias || [],
    guardandoEnBD,
    errores,
    cargarSecuencia,
    guardarEnBD,
    pausarReanudar,
    detener,
    reproducirDesde,
    agregarSeccion,
    eliminarSeccion,
    duplicarSeccion,
    actualizarSeccion,
    moverSeccion,
    exportarJSON,
    importarJSON,
  };
}