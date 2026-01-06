/**
 * Recorta y endereza documento usando perspectiva
 */

/**
 * Realiza warp perspective y retorna imagen recortada
 * @param {HTMLCanvasElement} canvas - Canvas con la imagen original
 * @param {Array} points - Array de 4 puntos [TL, TR, BR, BL]
 * @returns {Object} - { url, blob } de la imagen procesada
 */
export async function cropAndWarpDocument(canvas, points) {
  const cv = window.cv;
  if (!cv) throw new Error("OpenCV not loaded");

  // Crear mat desde canvas
  let src = cv.imread(canvas);
  let dst = new cv.Mat();

  try {
    // Calcular dimensiones del documento
    const [tl, tr, br, bl] = points;

    const widthTop = Math.hypot(tr.x - tl.x, tr.y - tl.y);
    const widthBottom = Math.hypot(br.x - bl.x, br.y - bl.y);
    const heightLeft = Math.hypot(bl.x - tl.x, bl.y - tl.y);
    const heightRight = Math.hypot(br.x - tr.x, br.y - tr.y);

    const maxWidth = Math.max(widthTop, widthBottom);
    const maxHeight = Math.max(heightLeft, heightRight);

    // Tamaño estándar de pasaporte (proporción 1.4:1)
    const outputWidth = 1400;
    const outputHeight = 1000;

    // Puntos de origen (documento detectado)
    const srcPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
      tl.x,
      tl.y,
      tr.x,
      tr.y,
      br.x,
      br.y,
      bl.x,
      bl.y,
    ]);

    // Puntos de destino (rectángulo)
    const dstPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
      0,
      0,
      outputWidth,
      0,
      outputWidth,
      outputHeight,
      0,
      outputHeight,
    ]);

    // Calcular matriz de transformación
    const M = cv.getPerspectiveTransform(srcPoints, dstPoints);

    // Aplicar transformación
    cv.warpPerspective(
      src,
      dst,
      M,
      new cv.Size(outputWidth, outputHeight),
      cv.INTER_LINEAR,
      cv.BORDER_CONSTANT,
      new cv.Scalar(255, 255, 255, 255)
    );

    // Mejorar la imagen
    enhanceDocument(dst);

    // Convertir a canvas
    const outputCanvas = document.createElement("canvas");
    cv.imshow(outputCanvas, dst);

    // Convertir a blob
    const blob = await new Promise((resolve) => {
      outputCanvas.toBlob(resolve, "image/jpeg", 0.95);
    });

    const url = URL.createObjectURL(blob);

    // Cleanup
    srcPoints.delete();
    dstPoints.delete();
    M.delete();

    return { url, blob };
  } finally {
    src.delete();
    dst.delete();
  }
}

/**
 * Mejora la calidad del documento escaneado
 * @param {cv.Mat} mat - Imagen a mejorar (se modifica in-place)
 */
function enhanceDocument(mat) {
  const cv = window.cv;

  // Convertir a escala de grises
  let gray = new cv.Mat();
  cv.cvtColor(mat, gray, cv.COLOR_RGBA2GRAY);

  // Ecualización de histograma adaptativa (CLAHE)
  let clahe = new cv.CLAHE(2.0, new cv.Size(8, 8));
  let enhanced = new cv.Mat();
  clahe.apply(gray, enhanced);

  // Threshold adaptativo para mejorar contraste
  let binary = new cv.Mat();
  cv.adaptiveThreshold(
    enhanced,
    binary,
    255,
    cv.ADAPTIVE_THRESH_GAUSSIAN_C,
    cv.THRESH_BINARY,
    11,
    2
  );

  // Convertir de vuelta a color (para mantener compatibilidad)
  cv.cvtColor(enhanced, mat, cv.COLOR_GRAY2RGBA);

  // Cleanup
  gray.delete();
  enhanced.delete();
  binary.delete();
}

/**
 * Redimensiona imagen manteniendo proporción
 * @param {Blob} blob - Imagen original
 * @param {number} maxWidth - Ancho máximo
 * @param {number} maxHeight - Alto máximo
 * @returns {Promise<Blob>} - Imagen redimensionada
 */
export async function resizeImage(blob, maxWidth = 1920, maxHeight = 1080) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;

      // Calcular nuevas dimensiones
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(resolve, "image/jpeg", 0.92);
      URL.revokeObjectURL(img.src);
    };

    img.onerror = reject;
    img.src = URL.createObjectURL(blob);
  });
}
