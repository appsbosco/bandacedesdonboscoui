import { useState, useCallback, useRef, useEffect } from "react";
import { createWorker } from "tesseract.js";
import { detectMRZ, extractFromOCRText } from "../utils/mrzParser";

/**
 * Hook para ejecutar OCR con Tesseract.js
 */
export function useOCR(options = {}) {
  const { language = "eng", onProgress } = options;

  const [state, setState] = useState({
    isInitializing: false,
    isProcessing: false,
    isReady: false,
    progress: 0,
    error: null,
  });

  const workerRef = useRef(null);
  const isInitializedRef = useRef(false);

  // Inicializar worker
  const initialize = useCallback(async () => {
    if (isInitializedRef.current && workerRef.current) {
      return workerRef.current;
    }

    setState((prev) => ({ ...prev, isInitializing: true, error: null }));

    try {
      const worker = await createWorker(language, 1, {
        logger: (info) => {
          if (info.status === "recognizing text") {
            const progress = Math.round(info.progress * 100);
            setState((prev) => ({ ...prev, progress }));
            if (onProgress) {
              onProgress(progress, info.status);
            }
          }
        },
      });

      workerRef.current = worker;
      isInitializedRef.current = true;

      setState((prev) => ({
        ...prev,
        isInitializing: false,
        isReady: true,
      }));

      return worker;
    } catch (error) {
      console.error("OCR initialization error:", error);
      setState((prev) => ({
        ...prev,
        isInitializing: false,
        error: "Error al inicializar el reconocimiento de texto",
      }));
      throw error;
    }
  }, [language, onProgress]);

  // Ejecutar OCR en una imagen
  const recognize = useCallback(
    async (image) => {
      setState((prev) => ({ ...prev, isProcessing: true, progress: 0, error: null }));

      try {
        // Inicializar si es necesario
        const worker = await initialize();

        // Ejecutar reconocimiento
        const { data } = await worker.recognize(image);

        setState((prev) => ({
          ...prev,
          isProcessing: false,
          progress: 100,
        }));

        // Detectar MRZ en el texto
        const mrzResult = detectMRZ(data.text);

        // Extraer datos adicionales del texto
        const extractedFromText = extractFromOCRText(data.text);

        return {
          text: data.text,
          confidence: data.confidence,
          mrz: mrzResult,
          extracted: mrzResult?.parsed || extractedFromText,
          words: data.words,
          lines: data.lines,
        };
      } catch (error) {
        console.error("OCR error:", error);
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error: "Error al procesar la imagen",
        }));
        throw error;
      }
    },
    [initialize]
  );

  // Terminar worker
  const terminate = useCallback(async () => {
    if (workerRef.current) {
      await workerRef.current.terminate();
      workerRef.current = null;
      isInitializedRef.current = false;
    }

    setState({
      isInitializing: false,
      isProcessing: false,
      isReady: false,
      progress: 0,
      error: null,
    });
  }, []);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  return {
    ...state,
    initialize,
    recognize,
    terminate,
  };
}
