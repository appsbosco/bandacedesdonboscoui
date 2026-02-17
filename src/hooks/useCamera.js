import { useState, useCallback, useRef, useEffect } from "react";

/**
 * Camera access hook — production-grade, zero leaks.
 *
 * - Requests 1280x720 rear camera by default
 * - Tracks stream in ref for reliable cleanup
 * - Spanish error messages
 * - Cleanup on unmount guaranteed
 */
export function useCamera(options = {}) {
  const {
    facingMode = "environment",
    idealWidth = 1280,
    idealHeight = 720,
  } = options;

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    setIsReady(false);

    // Stop any existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const msg = "Tu navegador no soporta acceso a la cámara";
      setError(msg);
      throw new Error(msg);
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: idealWidth },
          height: { ideal: idealHeight },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsReady(true);
      return stream;
    } catch (err) {
      let msg = "Error al acceder a la cámara";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        msg =
          "Permiso de cámara denegado. Permite el acceso en la configuración de tu navegador.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        msg = "No se encontró ninguna cámara en tu dispositivo.";
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        msg = "La cámara está siendo usada por otra aplicación.";
      } else if (err.name === "OverconstrainedError") {
        msg = "La cámara no cumple con los requisitos necesarios.";
      }
      setError(msg);
      throw err;
    }
  }, [facingMode, idealWidth, idealHeight]);

  // Cleanup on unmount — guaranteed track stop
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  return { videoRef, isReady, error, startCamera, stopCamera };
}

export default useCamera;
