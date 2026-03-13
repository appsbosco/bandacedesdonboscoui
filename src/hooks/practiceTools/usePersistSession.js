import { useEffect, useRef } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { GET_MIS_QUICK_SETTINGS }  from "../../graphql/queries/practiceTools.js";
import { GUARDAR_QUICK_SETTINGS }   from "../../graphql/mutations/practiceTools.js";

/**
 * usePersistQuickSettings
 * ─────────────────────────────────────────────────────────
 * Sincroniza la configuración del metrónomo rápido con el backend.
 *
 * FIX: onCompleted no es confiable en Apollo Client v3.8+ cuando
 * fetchPolicy es "network-only" y el componente ya está montado.
 * Usamos useEffect sobre `data` con un ref para ejecutar el callback
 * solo una vez al recibir datos del servidor.
 *
 * Debounce de 1.5s en escritura para no saturar la API mientras el
 * usuario arrastra el slider de BPM.
 * ─────────────────────────────────────────────────────────
 */
export function usePersistQuickSettings(config, userId, onServerData) {
  const serverDataEntregadaRef = useRef(false);

  const { data } = useQuery(GET_MIS_QUICK_SETTINGS, {
    skip: !userId,
    fetchPolicy: "network-only",
  });

  // FIX: reemplaza onCompleted — solo sincronizar desde servidor una vez al montar
  useEffect(() => {
    if (serverDataEntregadaRef.current) return;
    if (!data?.misQuickSettings) return;
    serverDataEntregadaRef.current = true;
    onServerData(data.misQuickSettings);
  }, [data, onServerData]);

  const [guardar] = useMutation(GUARDAR_QUICK_SETTINGS);

  // Escritura con debounce — fallo silencioso para no interrumpir la práctica
  useEffect(() => {
    if (!userId || !config) return;
    const timer = setTimeout(() => {
      guardar({
        variables: {
          input: {
            bpm:         config.bpm,
            pulsaciones: config.pulsaciones,
            subdivision: config.subdivision,
            sonido:      config.sonido,
            volumen:     config.volumen,
          },
        },
      }).catch(() => {});
    }, 1500);
    return () => clearTimeout(timer);
  }, [config, userId, guardar]);

  return { serverSettings: data?.misQuickSettings ?? null };
}