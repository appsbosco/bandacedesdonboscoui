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
