import { useEffect, useCallback } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { GET_MIS_QUICK_SETTINGS } from "../../graphql/queries/practiceTools.js";
import { GUARDAR_QUICK_SETTINGS } from "../../graphql/mutations/practiceTools.js";

/**
 * Hook para sincronizar la configuración rápida del metrónomo con el backend.
 * Debounce de 1.5s para evitar llamadas excesivas mientras el usuario arrastra el slider.
 */
export function usePersistQuickSettings(config, userId, onServerData) {
  const { data } = useQuery(GET_MIS_QUICK_SETTINGS, {
    skip: !userId,
    fetchPolicy: "network-only",
    onCompleted: (data) => {
      if (data?.misQuickSettings) onServerData(data.misQuickSettings);
    },
  });

  const [guardar] = useMutation(GUARDAR_QUICK_SETTINGS);

  useEffect(() => {
    if (!userId || !config) return;
    const timer = setTimeout(() => {
      guardar({
        variables: {
          input: {
            bpm: config.bpm,
            pulsaciones: config.pulsaciones,
            subdivision: config.subdivision,
            sonido: config.sonido,
            volumen: config.volumen,
          },
        },
      }).catch(() => {}); // Fallo silencioso, no interrumpe la práctica
    }, 1500);
    return () => clearTimeout(timer);
  }, [config, userId, guardar]);

  return { serverSettings: data?.misQuickSettings };
}