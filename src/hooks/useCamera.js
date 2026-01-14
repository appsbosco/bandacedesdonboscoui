import { useState, useCallback, useRef, useEffect } from "react";

/**
 * Hook para manejar acceso y control de la cámara
 */
export function useCamera(options = {}) {
  const {
    facingMode = "environment", // 'user' para frontal, 'environment' para trasera
    idealWidth = 1920,
    idealHeight = 1080,
    onError,
  } = options;

  const [state, setState] = useState({
    isInitializing: false,
    isReady: false,
    error: null,
    stream: null,
    capabilities: null,
  });

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Obtener stream de cámara
  const startCamera = useCallback(async () => {
    setState((prev) => ({ ...prev, isInitializing: true, error: null }));

    try {
      // Verificar soporte
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Tu navegador no soporta acceso a la cámara");
      }

      // Configuración de constraints
      const constraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: idealWidth },
          height: { ideal: idealHeight },
          aspectRatio: { ideal: 16 / 9 },
        },
        audio: false,
      };

      // Solicitar stream
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      streamRef.current = stream;

      // Obtener capabilities si está disponible
      const track = stream.getVideoTracks()[0];
      let capabilities = null;

      if (track.getCapabilities) {
        capabilities = track.getCapabilities();
      }

      // Conectar al video element si existe
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setState({
        isInitializing: false,
        isReady: true,
        error: null,
        stream,
        capabilities,
      });

      return stream;
    } catch (error) {
      console.error("Camera error:", error);

      let errorMessage = "Error al acceder a la cámara";

      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        errorMessage =
          "Permiso de cámara denegado. Por favor, permite el acceso en la configuración de tu navegador.";
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        errorMessage = "No se encontró ninguna cámara en tu dispositivo.";
      } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
        errorMessage = "La cámara está siendo usada por otra aplicación.";
      } else if (error.name === "OverconstrainedError") {
        errorMessage = "La cámara no cumple con los requisitos necesarios.";
      }

      setState({
        isInitializing: false,
        isReady: false,
        error: errorMessage,
        stream: null,
        capabilities: null,
      });

      if (onError) {
        onError(errorMessage);
      }

      throw error;
    }
  }, [facingMode, idealWidth, idealHeight, onError]);

  // Detener cámara
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setState({
      isInitializing: false,
      isReady: false,
      error: null,
      stream: null,
      capabilities: null,
    });
  }, []);

  // Cambiar cámara (frontal/trasera)
  const switchCamera = useCallback(async () => {
    stopCamera();

    const newFacingMode = facingMode === "environment" ? "user" : "environment";

    return startCamera();
  }, [facingMode, stopCamera, startCamera]);

  // Aplicar torch (flash) si está disponible
  const setTorch = useCallback(async (enabled) => {
    if (!streamRef.current) return false;

    const track = streamRef.current.getVideoTracks()[0];

    try {
      if (track.applyConstraints) {
        await track.applyConstraints({
          advanced: [{ torch: enabled }],
        });
        return true;
      }
    } catch (error) {
      console.warn("Torch not supported:", error);
    }

    return false;
  }, []);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    ...state,
    videoRef,
    startCamera,
    stopCamera,
    switchCamera,
    setTorch,
  };
}

export default useCamera;
