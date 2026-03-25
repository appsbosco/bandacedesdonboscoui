/**
 * imageProcessing.js
 * Minimal image utilities for document capture.
 * Perspective correction and MRZ extraction are handled server-side.
 */

/**
 * Crop video/canvas to the scan area region.
 * scanArea: { x, y, width, height } in display pixels (CSS coords on the video element)
 * Returns a new canvas with the cropped content, or null on error.
 */
export function cropToScanArea(source, scanArea, reuseCanvas = null) {
  if (!source || !scanArea) return null;

  const srcW = source.videoWidth  || source.width;
  const srcH = source.videoHeight || source.height;
  if (!srcW || !srcH) return null;

  // scanArea is in CSS/display space; compute scale to actual pixel space
  const displayW = source.offsetWidth  || source.clientWidth  || srcW;
  const displayH = source.offsetHeight || source.clientHeight || srcH;
  const scaleX = srcW / displayW;
  const scaleY = srcH / displayH;

  // Account for object-fit: cover offset
  const videoAspect   = srcW / srcH;
  const displayAspect = displayW / displayH;
  let offsetX = 0, offsetY = 0, renderedW = srcW, renderedH = srcH;
  if (videoAspect > displayAspect) {
    renderedW = srcH * displayAspect;
    offsetX   = (srcW - renderedW) / 2;
  } else {
    renderedH = srcW / displayAspect;
    offsetY   = (srcH - renderedH) / 2;
  }

  const sx = Math.round(offsetX + scanArea.x * (renderedW / displayW));
  const sy = Math.round(offsetY + scanArea.y * (renderedH / displayH));
  const sw = Math.round(scanArea.width  * (renderedW / displayW));
  const sh = Math.round(scanArea.height * (renderedH / displayH));

  const canvas = reuseCanvas || document.createElement('canvas');
  canvas.width  = sw;
  canvas.height = sh;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh);
  return canvas;
}

/**
 * Capture the scan area from a video element as a Blob.
 * Returns Promise<Blob>
 */
export function captureFrameBlob(videoEl, scanArea, mimeType = 'image/jpeg', quality = 0.92) {
  const canvas = cropToScanArea(videoEl, scanArea);
  if (!canvas) return Promise.reject(new Error('Capture failed: invalid source or scan area'));
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => (blob ? resolve(blob) : reject(new Error('canvas.toBlob returned null'))),
      mimeType,
      quality
    );
  });
}

/**
 * Capture the scan area from a video element as a data URL.
 */
export function captureFrameDataURL(videoEl, scanArea, mimeType = 'image/jpeg', quality = 0.92) {
  const canvas = cropToScanArea(videoEl, scanArea);
  if (!canvas) throw new Error('Capture failed: invalid source or scan area');
  return canvas.toDataURL(mimeType, quality);
}
