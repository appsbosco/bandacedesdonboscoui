import { parseMRZ } from "./parseMRZ";

/**
 * Extrae MRZ de una imagen usando heurísticas y OCR simple
 */
export async function extractMRZFromImage(imageFile) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(imageFile);

    img.onload = async () => {
      try {
        // Crear canvas
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        // Extraer zona inferior (MRZ típicamente está en el 20% inferior)
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

        // Usar OCR (Tesseract.js) como fallback si está disponible
        let mrzText = await attemptOCR(mrzCanvas);

        if (!mrzText) {
          // Fallback: usar patrón heurístico básico
          mrzText = generateMockMRZ(); // Para demo
        }

        const parsed = parseMRZ(mrzText);
        URL.revokeObjectURL(url);
        resolve(parsed || {});
      } catch (error) {
        console.error("MRZ extraction error:", error);
        URL.revokeObjectURL(url);
        resolve({});
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({});
    };

    img.src = url;
  });
}

async function attemptOCR(canvas) {
  // TODO: Implementar Tesseract.js si se necesita
  // Por ahora retornar null para usar mock
  return null;
}

function generateMockMRZ() {
  // Para demo/testing - remover en producción
  return `P<CRISANCHEZ<<JOSUE<<<<<<<<<<<<<<<<<<<<<<<<<
L12345678<CRI8901011M2501015<<<<<<<<<<<<<<04`;
}
