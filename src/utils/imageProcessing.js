/**
 * Image Processing Utilities
 * Funciones para recortar y mejorar imágenes capturadas
 */

/**
 * Recorta una imagen al área de escaneo especificada
 * @param {HTMLCanvasElement|HTMLVideoElement} source - Fuente de imagen
 * @param {Object} cropArea - Área a recortar {x, y, width, height} en porcentajes (0-1)
 * @param {Object} outputSize - Tamaño de salida opcional {width, height}
 * @returns {HTMLCanvasElement}
 */

// src/utils/imageProcessing.js
export function cropToScanArea(source, cropArea, maxOutput = null) {
  const sourceWidth = source.videoWidth || source.width;
  const sourceHeight = source.videoHeight || source.height;

  const cropX = Math.round(cropArea.x * sourceWidth);
  const cropY = Math.round(cropArea.y * sourceHeight);
  const cropW = Math.round(cropArea.width * sourceWidth);
  const cropH = Math.round(cropArea.height * sourceHeight);

  let outW = cropW;
  let outH = cropH;

  if (maxOutput?.maxWidth || maxOutput?.maxHeight) {
    const s = Math.min(
      (maxOutput.maxWidth ?? cropW) / cropW,
      (maxOutput.maxHeight ?? cropH) / cropH,
      1
    );
    outW = Math.round(cropW * s);
    outH = Math.round(cropH * s);
  }

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;

  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, cropX, cropY, cropW, cropH, 0, 0, outW, outH);

  return canvas;
}

export function enhanceForOCR(canvas, options = {}) {
  const { contrast = 1.1, brightness = 0, sharpen = false } = options;

  const ctx = canvas.getContext("2d");
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = clamp((data[i] - 128) * contrast + 128 + brightness);
    data[i + 1] = clamp((data[i + 1] - 128) * contrast + 128 + brightness);
    data[i + 2] = clamp((data[i + 2] - 128) * contrast + 128 + brightness);
  }

  if (sharpen) applySharpening(imageData);

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

function clamp(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function applySharpening(imageData) {
  const { data, width, height } = imageData;
  const original = new Uint8ClampedArray(data);
  const kernel = [0, -0.3, 0, -0.3, 2.2, -0.3, 0, -0.3, 0];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const kidx = ((y + ky) * width + (x + kx)) * 4 + c;
            sum += original[kidx] * kernel[(ky + 1) * 3 + (kx + 1)];
          }
        }
        data[idx + c] = clamp(sum);
      }
    }
  }
}

export function captureHighQualityFrame(video) {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0);
  return canvas;
}

export function processScannedDocument(video, scanArea, options = {}) {
  const { enhance = false } = options;
  const fullFrame = captureHighQualityFrame(video);
  const cropped = cropToScanArea(fullFrame, scanArea);

  if (enhance) {
    return enhanceForOCR(cropped, { contrast: 1.05, brightness: 0, sharpen: false });
  }
  return cropped;
}

// export function cropToScanArea(source, cropArea, maxOutput = null) {
//   const sourceWidth = source.videoWidth || source.width;
//   const sourceHeight = source.videoHeight || source.height;

//   const cropX = Math.round(cropArea.x * sourceWidth);
//   const cropY = Math.round(cropArea.y * sourceHeight);
//   const cropW = Math.round(cropArea.width * sourceWidth);
//   const cropH = Math.round(cropArea.height * sourceHeight);

//   let outW = cropW;
//   let outH = cropH;

//   if (maxOutput?.maxWidth || maxOutput?.maxHeight) {
//     const s = Math.min(
//       (maxOutput.maxWidth ?? cropW) / cropW,
//       (maxOutput.maxHeight ?? cropH) / cropH,
//       1
//     );
//     outW = Math.round(cropW * s);
//     outH = Math.round(cropH * s);
//   }

//   const canvas = document.createElement("canvas");
//   canvas.width = outW;
//   canvas.height = outH;

//   const ctx = canvas.getContext("2d");
//   ctx.imageSmoothingEnabled = true;
//   ctx.imageSmoothingQuality = "high";
//   ctx.drawImage(source, cropX, cropY, cropW, cropH, 0, 0, outW, outH);

//   return canvas;
// }

// /**
//  * Aplica mejoras básicas para OCR
//  * - Aumenta contraste
//  * - Aplica ligera nitidez
//  * @param {HTMLCanvasElement} canvas - Canvas de entrada
//  * @param {Object} options - Opciones de mejora
//  * @returns {HTMLCanvasElement}
//  */
// export function enhanceForOCR(canvas, options = {}) {
//   const {
//     contrast = 1.15,
//     brightness = 0, // Ajuste de brillo (-255 a 255)
//     sharpen = true, // Aplicar nitidez
//   } = options;

//   const ctx = canvas.getContext("2d");
//   const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
//   const data = imageData.data;

//   // Aplicar contraste y brillo
//   // const factor = (259 * (contrast * 128 + 255)) / (255 * (259 - contrast * 128));

//   for (let i = 0; i < data.length; i += 4) {
//     data[i] = clamp((data[i] - 128) * contrast + 128 + brightness);
//     data[i + 1] = clamp((data[i + 1] - 128) * contrast + 128 + brightness);
//     data[i + 2] = clamp((data[i + 2] - 128) * contrast + 128 + brightness);
//   }

//   if (sharpen) applySharpening(imageData);

//   ctx.putImageData(imageData, 0, 0);
//   return canvas;
// }

// /**
//  * Clampa un valor entre 0 y 255
//  */
// function clamp(value) {
//   return Math.max(0, Math.min(255, Math.round(value)));
// }

// /**
//  * Aplica filtro de nitidez usando kernel de convolución
//  * @param {ImageData} imageData
//  */
// function applySharpening(imageData) {
//   const { data, width, height } = imageData;
//   const original = new Uint8ClampedArray(data);

//   // Kernel de nitidez suave
//   // [ 0, -1,  0]
//   // [-1,  5, -1]
//   // [ 0, -1,  0]
//   const kernel = [0, -0.5, 0, -0.5, 3, -0.5, 0, -0.5, 0]; // Versión suave

//   for (let y = 1; y < height - 1; y++) {
//     for (let x = 1; x < width - 1; x++) {
//       const idx = (y * width + x) * 4;

//       for (let c = 0; c < 3; c++) {
//         // RGB
//         let sum = 0;

//         for (let ky = -1; ky <= 1; ky++) {
//           for (let kx = -1; kx <= 1; kx++) {
//             const kidx = ((y + ky) * width + (x + kx)) * 4 + c;
//             sum += original[kidx] * kernel[(ky + 1) * 3 + (kx + 1)];
//           }
//         }

//         data[idx + c] = clamp(sum);
//       }
//     }
//   }
// }

// /**
//  * Convierte imagen a escala de grises (útil para algunos OCR)
//  * @param {HTMLCanvasElement} canvas
//  * @returns {HTMLCanvasElement}
//  */
// export function convertToGrayscale(canvas) {
//   const ctx = canvas.getContext("2d");
//   const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
//   const data = imageData.data;

//   for (let i = 0; i < data.length; i += 4) {
//     const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
//     data[i] = gray; // R
//     data[i + 1] = gray; // G
//     data[i + 2] = gray; // B
//   }

//   ctx.putImageData(imageData, 0, 0);
//   return canvas;
// }

// /**
//  * Aplica umbralización adaptativa (binarización)
//  * Útil para documentos con fondo irregular
//  * @param {HTMLCanvasElement} canvas
//  * @param {number} blockSize - Tamaño del bloque para calcular umbral local
//  * @returns {HTMLCanvasElement}
//  */
// export function adaptiveThreshold(canvas, blockSize = 15) {
//   const ctx = canvas.getContext("2d");
//   const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
//   const { data, width, height } = imageData;

//   // Primero convertir a grayscale
//   const gray = new Uint8Array(width * height);
//   for (let i = 0; i < data.length; i += 4) {
//     gray[i / 4] = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
//   }

//   // Calcular umbral adaptativo
//   const halfBlock = Math.floor(blockSize / 2);

//   for (let y = 0; y < height; y++) {
//     for (let x = 0; x < width; x++) {
//       // Calcular media local
//       let sum = 0;
//       let count = 0;

//       for (let dy = -halfBlock; dy <= halfBlock; dy++) {
//         for (let dx = -halfBlock; dx <= halfBlock; dx++) {
//           const nx = x + dx;
//           const ny = y + dy;

//           if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
//             sum += gray[ny * width + nx];
//             count++;
//           }
//         }
//       }

//       const localMean = sum / count;
//       const idx = (y * width + x) * 4;
//       const pixelValue = gray[y * width + x];

//       // Binarizar con offset
//       const threshold = localMean - 10;
//       const binary = pixelValue > threshold ? 255 : 0;

//       data[idx] = binary;
//       data[idx + 1] = binary;
//       data[idx + 2] = binary;
//     }
//   }

//   ctx.putImageData(imageData, 0, 0);
//   return canvas;
// }

// /**
//  * Detecta y corrige perspectiva básica
//  * (Implementación simplificada - para corrección avanzada usar OpenCV.js)
//  * @param {HTMLCanvasElement} canvas
//  * @param {Array} corners - 4 esquinas detectadas [{x, y}, ...]
//  * @returns {HTMLCanvasElement}
//  */
// export function correctPerspective(canvas, corners) {
//   if (!corners || corners.length !== 4) {
//     console.warn("Perspective correction requires exactly 4 corners");
//     return canvas;
//   }

//   // Ordenar esquinas: top-left, top-right, bottom-right, bottom-left
//   const sorted = orderCorners(corners);

//   // Calcular dimensiones de salida
//   const widthTop = distance(sorted[0], sorted[1]);
//   const widthBottom = distance(sorted[3], sorted[2]);
//   const heightLeft = distance(sorted[0], sorted[3]);
//   const heightRight = distance(sorted[1], sorted[2]);

//   const outputWidth = Math.max(widthTop, widthBottom);
//   const outputHeight = Math.max(heightLeft, heightRight);

//   // Crear canvas de salida
//   const output = document.createElement("canvas");
//   output.width = outputWidth;
//   output.height = outputHeight;
//   const outCtx = output.getContext("2d");

//   // Para una transformación de perspectiva real, necesitaríamos WebGL o OpenCV.js
//   // Esta es una aproximación usando transformaciones afines por segmentos

//   const srcCtx = canvas.getContext("2d");
//   const srcData = srcCtx.getImageData(0, 0, canvas.width, canvas.height);
//   const dstData = outCtx.createImageData(outputWidth, outputHeight);

//   // Mapeo inverso: para cada pixel de salida, encontrar el pixel fuente
//   for (let y = 0; y < outputHeight; y++) {
//     for (let x = 0; x < outputWidth; x++) {
//       // Interpolación bilineal de las esquinas
//       const u = x / outputWidth;
//       const v = y / outputHeight;

//       // Calcular posición en imagen fuente
//       const topX = sorted[0].x + u * (sorted[1].x - sorted[0].x);
//       const topY = sorted[0].y + u * (sorted[1].y - sorted[0].y);
//       const bottomX = sorted[3].x + u * (sorted[2].x - sorted[3].x);
//       const bottomY = sorted[3].y + u * (sorted[2].y - sorted[3].y);

//       const srcX = Math.round(topX + v * (bottomX - topX));
//       const srcY = Math.round(topY + v * (bottomY - topY));

//       if (srcX >= 0 && srcX < canvas.width && srcY >= 0 && srcY < canvas.height) {
//         const srcIdx = (srcY * canvas.width + srcX) * 4;
//         const dstIdx = (y * outputWidth + x) * 4;

//         dstData.data[dstIdx] = srcData.data[srcIdx];
//         dstData.data[dstIdx + 1] = srcData.data[srcIdx + 1];
//         dstData.data[dstIdx + 2] = srcData.data[srcIdx + 2];
//         dstData.data[dstIdx + 3] = srcData.data[srcIdx + 3];
//       }
//     }
//   }

//   outCtx.putImageData(dstData, 0, 0);
//   return output;
// }

// /**
//  * Calcula distancia entre dos puntos
//  */
// function distance(p1, p2) {
//   return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
// }

// /**
//  * Ordena 4 esquinas en orden: TL, TR, BR, BL
//  */
// function orderCorners(corners) {
//   // Encontrar centroid
//   const cx = corners.reduce((s, p) => s + p.x, 0) / 4;
//   const cy = corners.reduce((s, p) => s + p.y, 0) / 4;

//   // Clasificar por cuadrante relativo al centro
//   const topLeft = corners.find((p) => p.x < cx && p.y < cy) || corners[0];
//   const topRight = corners.find((p) => p.x >= cx && p.y < cy) || corners[1];
//   const bottomRight = corners.find((p) => p.x >= cx && p.y >= cy) || corners[2];
//   const bottomLeft = corners.find((p) => p.x < cx && p.y >= cy) || corners[3];

//   return [topLeft, topRight, bottomRight, bottomLeft];
// }

// /**
//  * Captura frame de alta calidad desde video
//  * @param {HTMLVideoElement} video
//  * @returns {HTMLCanvasElement}
//  */
// export function captureHighQualityFrame(video) {
//   const canvas = document.createElement("canvas");
//   canvas.width = video.videoWidth;
//   canvas.height = video.videoHeight;

//   const ctx = canvas.getContext("2d");
//   ctx.drawImage(video, 0, 0);

//   return canvas;
// }

// /**
//  * Pipeline completo de procesamiento para documento escaneado
//  * @param {HTMLVideoElement} video - Video source
//  * @param {Object} scanArea - Área de escaneo
//  * @param {Object} options - Opciones de procesamiento
//  * @returns {HTMLCanvasElement}
//  */
// export function processScannedDocument(video, scanArea, options = {}) {
//   const { enhance = true, targetWidth = 1600, targetHeight = 1200 } = options;

//   // 1. Capturar frame de alta calidad
//   const fullFrame = captureHighQualityFrame(video);

//   // 2. Recortar al área de escaneo
//   const cropped = cropToScanArea(fullFrame, scanArea, { maxWidth: 2048, maxHeight: 2048 });

//   // 3. Mejorar para OCR (opcional)
//   if (enhance) {
//     return enhanceForOCR(cropped, { contrast: 1.1, brightness: 0, sharpen: true });
//   }

//   return cropped;
// }
