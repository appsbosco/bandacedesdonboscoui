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

/**
 * Map viewport-relative scanArea to video-native coordinates.
 * Needed because the <video> uses object-cover, which scales & crops
 * the feed to fill the viewport — overlay percentages are viewport-relative
 * but drawImage needs video-native percentages.
 */
export function mapScanAreaToVideo(scanArea, video, viewportW, viewportH) {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh || !viewportW || !viewportH) return scanArea;

  const videoRatio = vw / vh;
  const vpRatio = viewportW / viewportH;

  let offsetX = 0;
  let offsetY = 0;
  let visibleW = 1;
  let visibleH = 1;

  if (videoRatio > vpRatio) {
    // Video wider than viewport → left/right cropped
    const scale = viewportH / vh;
    const dispW = vw * scale;
    const crop = (dispW - viewportW) / 2 / dispW;
    offsetX = crop;
    visibleW = 1 - 2 * crop;
  } else {
    // Video taller than viewport → top/bottom cropped
    const scale = viewportW / vw;
    const dispH = vh * scale;
    const crop = (dispH - viewportH) / 2 / dispH;
    offsetY = crop;
    visibleH = 1 - 2 * crop;
  }

  return {
    x: offsetX + scanArea.x * visibleW,
    y: offsetY + scanArea.y * visibleH,
    width: scanArea.width * visibleW,
    height: scanArea.height * visibleH,
  };
}

export function processScannedDocument(video, scanArea, options = {}) {
  const { enhance = false, viewportW, viewportH } = options;

  // If viewport dimensions provided, compensate for object-cover crop
  const mappedArea = (viewportW && viewportH)
    ? mapScanAreaToVideo(scanArea, video, viewportW, viewportH)
    : scanArea;

  const fullFrame = captureHighQualityFrame(video);
  const cropped = cropToScanArea(fullFrame, mappedArea);

  if (enhance) {
    return enhanceForOCR(cropped, { contrast: 1.05, brightness: 0, sharpen: false });
  }
  return cropped;
}

/**
 * Normalize a captured document image to consistent dimensions.
 * Ensures all output images have the same orientation and aspect ratio
 * regardless of how the document was captured.
 *
 * @param {HTMLCanvasElement} sourceCanvas — cropped/rectified document image
 * @param {Object} opts
 * @param {number} opts.targetWidth — desired output width (default 1200)
 * @param {number} opts.aspectRatio — document aspect ratio w/h (default 1.42 for passport)
 * @returns {HTMLCanvasElement}
 */
export function normalizeDocumentImage(sourceCanvas, opts = {}) {
  const { targetWidth = 1200, aspectRatio = 1.42 } = opts;
  const targetHeight = Math.round(targetWidth / aspectRatio);

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Fill white background first (avoids transparent edges from perspective warp)
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // Scale source to fit target, preserving aspect ratio
  const srcW = sourceCanvas.width;
  const srcH = sourceCanvas.height;
  const srcRatio = srcW / srcH;
  const tgtRatio = targetWidth / targetHeight;

  let drawW, drawH, drawX, drawY;
  if (srcRatio > tgtRatio) {
    // Source is wider — fit by width
    drawW = targetWidth;
    drawH = Math.round(targetWidth / srcRatio);
    drawX = 0;
    drawY = Math.round((targetHeight - drawH) / 2);
  } else {
    // Source is taller — fit by height
    drawH = targetHeight;
    drawW = Math.round(targetHeight * srcRatio);
    drawX = Math.round((targetWidth - drawW) / 2);
    drawY = 0;
  }

  ctx.drawImage(sourceCanvas, 0, 0, srcW, srcH, drawX, drawY, drawW, drawH);

  return canvas;
}

/**
 * Extract the MRZ region from a document image.
 * MRZ is located at the bottom of the document:
 * - TD3 (passport): bottom ~25% of the page, 2 lines of 44 chars
 * - TD1 (ID card):  bottom ~33% of the page, 3 lines of 30 chars
 *
 * The extracted region is enhanced for OCR (higher contrast, sharpened).
 *
 * @param {HTMLCanvasElement} sourceCanvas — full document image
 * @param {string} documentType — "PASSPORT" | "VISA" | "ID_CARD"
 * @returns {HTMLCanvasElement} — MRZ region, enhanced for OCR
 */
export function extractMRZRegion(sourceCanvas, documentType = "PASSPORT") {
  const w = sourceCanvas.width;
  const h = sourceCanvas.height;

  // MRZ occupies the bottom portion of the document
  const mrzHeightPct = documentType === "ID_CARD" ? 0.38 : 0.30;
  const mrzY = Math.round(h * (1 - mrzHeightPct));
  const mrzH = h - mrzY;

  // Add small horizontal margin to avoid border artifacts
  const marginX = Math.round(w * 0.02);

  const canvas = document.createElement("canvas");
  canvas.width = w - 2 * marginX;
  canvas.height = mrzH;

  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(sourceCanvas, marginX, mrzY, canvas.width, mrzH, 0, 0, canvas.width, mrzH);

  // Enhance for OCR: boost contrast, convert towards grayscale, sharpen
  return enhanceForOCR(canvas, { contrast: 1.3, brightness: 5, sharpen: true });
}

/**
 * Generate all image variants needed for the document pipeline.
 *
 * @param {HTMLCanvasElement} capturedCanvas — the raw captured image
 * @param {string} documentType
 * @param {number} aspectRatio
 * @returns {{ raw: HTMLCanvasElement, normalized: HTMLCanvasElement, mrzRoi: HTMLCanvasElement|null }}
 */
export function generateAllImageVariants(capturedCanvas, documentType, aspectRatio = 1.42) {
  const needsMRZ = ["PASSPORT", "VISA"].includes(documentType?.toUpperCase());

  const normalized = normalizeDocumentImage(capturedCanvas, {
    targetWidth: 1200,
    aspectRatio,
  });

  const mrzRoi = needsMRZ ? extractMRZRegion(normalized, documentType) : null;

  return {
    raw: capturedCanvas,
    normalized,
    mrzRoi,
  };
}
