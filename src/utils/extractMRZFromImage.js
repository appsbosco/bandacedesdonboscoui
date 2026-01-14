import { parseMRZ } from "./mrzParser";

/**
 * Extrae MRZ de una imagen
 * IMPORTANTE: Retorna objeto vacío si no puede extraer, NO datos inventados
 */
export async function extractMRZFromImage(imageFile) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(imageFile);

    img.onload = async () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        // Extraer zona inferior (MRZ)
        const mrzHeight = Math.floor(img.height * 0.2);
        const mrzCanvas = document.createElement("canvas");
        mrzCanvas.width = img.width;
        mrzCanvas.height = mrzHeight;
        const mrzCtx = mrzCanvas.getContext("2d");
        mrzCtx.drawImage(
          canvas,
          0,
          img.height - mrzHeight,
          img.width,
          mrzHeight,
          0,
          0,
          img.width,
          mrzHeight
        );

        // Intentar OCR (si Tesseract está disponible)
        let mrzText = await attemptOCR(mrzCanvas);

        if (mrzText) {
          const parsed = parseMRZ(mrzText);
          URL.revokeObjectURL(url);
          resolve(parsed || { needsManualReview: true });
        } else {
          // NO hay OCR disponible → retornar vacío para revisión manual
          URL.revokeObjectURL(url);
          resolve({ needsManualReview: true });
        }
      } catch (error) {
        console.error("MRZ extraction error:", error);
        URL.revokeObjectURL(url);
        resolve({ needsManualReview: true });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ needsManualReview: true });
    };

    img.src = url;
  });
}

async function attemptOCR(canvas) {
  // Verificar si Tesseract está disponible
  if (typeof window !== "undefined" && window.Tesseract) {
    try {
      const worker = await window.Tesseract.createWorker("eng");
      const {
        data: { text },
      } = await worker.recognize(canvas);
      await worker.terminate();
      return text;
    } catch (error) {
      console.error("Tesseract OCR error:", error);
      return null;
    }
  }

  // Sin Tesseract, retornar null
  return null;
}
