/**
 * Utilidades para evaluar calidad de captura
 */

/**
 * Calcula la nitidez usando varianza del Laplaciano
 * @param {cv.Mat} grayMat - Imagen en escala de grises
 * @returns {number} - Score de nitidez (mayor = más nítido)
 */
export function calculateSharpness(grayMat) {
  const cv = window.cv;
  if (!cv || !grayMat) return 0;

  let laplacian = new cv.Mat();
  let mean = new cv.Mat();
  let stddev = new cv.Mat();

  try {
    // Aplicar Laplaciano
    cv.Laplacian(grayMat, laplacian, cv.CV_64F);

    // Calcular varianza
    cv.meanStdDev(laplacian, mean, stddev);

    const variance = Math.pow(stddev.data64F[0], 2);

    return variance;
  } finally {
    laplacian.delete();
    mean.delete();
    stddev.delete();
  }
}

/**
 * Calcula el brillo promedio de la imagen
 * @param {cv.Mat} srcMat - Imagen fuente
 * @returns {number} - Brillo promedio (0-255)
 */
export function calculateBrightness(srcMat) {
  const cv = window.cv;
  if (!cv || !srcMat) return 0;

  let gray = new cv.Mat();
  let mean = new cv.Mat();
  let stddev = new cv.Mat();

  try {
    // Convertir a escala de grises si es necesario
    if (srcMat.channels() > 1) {
      cv.cvtColor(srcMat, gray, cv.COLOR_RGBA2GRAY);
    } else {
      gray = srcMat.clone();
    }

    // Calcular media
    cv.meanStdDev(gray, mean, stddev);

    return mean.data64F[0];
  } finally {
    if (gray && gray !== srcMat) gray.delete();
    mean.delete();
    stddev.delete();
  }
}

/**
 * Detecta movimiento comparando dos frames
 * @param {ImageData} prevFrame - Frame anterior
 * @param {ImageData} currentFrame - Frame actual
 * @returns {number} - Score de movimiento (mayor = más movimiento)
 */
export function detectMotion(prevFrame, currentFrame) {
  if (!prevFrame || !currentFrame) return 0;

  const data1 = prevFrame.data;
  const data2 = currentFrame.data;

  let diff = 0;
  const sampleSize = 1000; // Muestrear para performance
  const step = Math.floor(data1.length / (sampleSize * 4));

  for (let i = 0; i < data1.length; i += step * 4) {
    const r = Math.abs(data1[i] - data2[i]);
    const g = Math.abs(data1[i + 1] - data2[i + 1]);
    const b = Math.abs(data1[i + 2] - data2[i + 2]);
    diff += (r + g + b) / 3;
  }

  return diff / sampleSize;
}

/**
 * Analiza el histograma para detectar sub/sobre exposición
 * @param {cv.Mat} grayMat - Imagen en escala de grises
 * @returns {Object} - { underexposed, overexposed, balanced }
 */
export function analyzeHistogram(grayMat) {
  const cv = window.cv;
  if (!cv || !grayMat) return { underexposed: false, overexposed: false, balanced: true };

  let hist = new cv.Mat();
  let mask = new cv.Mat();

  try {
    // Calcular histograma
    cv.calcHist(new cv.MatVector([grayMat]), [0], mask, hist, [256], [0, 256]);

    // Analizar distribución
    let darkPixels = 0;
    let brightPixels = 0;
    let totalPixels = 0;

    for (let i = 0; i < 256; i++) {
      const count = hist.data32F[i];
      totalPixels += count;

      if (i < 50) darkPixels += count;
      if (i > 205) brightPixels += count;
    }

    const darkRatio = darkPixels / totalPixels;
    const brightRatio = brightPixels / totalPixels;

    return {
      underexposed: darkRatio > 0.6,
      overexposed: brightRatio > 0.6,
      balanced: darkRatio < 0.4 && brightRatio < 0.4,
    };
  } finally {
    hist.delete();
    mask.delete();
  }
}

/**
 * Calcula score de contraste
 * @param {cv.Mat} grayMat - Imagen en escala de grises
 * @returns {number} - Score de contraste
 */
export function calculateContrast(grayMat) {
  const cv = window.cv;
  if (!cv || !grayMat) return 0;

  let mean = new cv.Mat();
  let stddev = new cv.Mat();

  try {
    cv.meanStdDev(grayMat, mean, stddev);
    return stddev.data64F[0];
  } finally {
    mean.delete();
    stddev.delete();
  }
}
