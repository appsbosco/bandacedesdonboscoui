// FILE: src/utils/perspectiveTransform.js

/**
 * Perspective Transform Utilities
 * - Uses OpenCV warpPerspective if window.cv is ready
 * - Falls back to pure JS warpPerspective otherwise
 */

function computeTransformMatrix(srcPoints, dstPoints) {
  const A = [];
  const b = [];

  for (let i = 0; i < 4; i++) {
    const sx = srcPoints[i].x;
    const sy = srcPoints[i].y;
    const dx = dstPoints[i].x;
    const dy = dstPoints[i].y;

    A.push([sx, sy, 1, 0, 0, 0, -dx * sx, -dx * sy]);
    A.push([0, 0, 0, sx, sy, 1, -dy * sx, -dy * sy]);
    b.push(dx);
    b.push(dy);
  }

  const n = 8;
  const augmented = A.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(augmented[row][col]) > Math.abs(augmented[maxRow][col])) {
        maxRow = row;
      }
    }
    [augmented[col], augmented[maxRow]] = [augmented[maxRow], augmented[col]];
    if (Math.abs(augmented[col][col]) < 1e-10) continue;

    for (let row = col + 1; row < n; row++) {
      const factor = augmented[row][col] / augmented[col][col];
      for (let j = col; j <= n; j++) augmented[row][j] -= factor * augmented[col][j];
    }
  }

  const h = new Array(8).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = augmented[i][n];
    for (let j = i + 1; j < n; j++) sum -= augmented[i][j] * h[j];
    h[i] = Math.abs(augmented[i][i]) > 1e-10 ? sum / augmented[i][i] : 0;
  }

  return [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1];
}

function transformPoint(x, y, matrix) {
  const w = matrix[6] * x + matrix[7] * y + matrix[8];
  return {
    x: (matrix[0] * x + matrix[1] * y + matrix[2]) / w,
    y: (matrix[3] * x + matrix[4] * y + matrix[5]) / w,
  };
}

function bilinearSample(imageData, x, y) {
  const { data, width, height } = imageData;
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(x0 + 1, width - 1);
  const y1 = Math.min(y0 + 1, height - 1);

  if (x0 < 0 || y0 < 0 || x0 >= width || y0 >= height) return [255, 255, 255, 255];

  const fx = x - x0;
  const fy = y - y0;

  const idx00 = (y0 * width + x0) * 4;
  const idx01 = (y0 * width + x1) * 4;
  const idx10 = (y1 * width + x0) * 4;
  const idx11 = (y1 * width + x1) * 4;

  const out = [];
  for (let c = 0; c < 4; c++) {
    const v00 = data[idx00 + c];
    const v01 = data[idx01 + c];
    const v10 = data[idx10 + c];
    const v11 = data[idx11 + c];
    const v0 = v00 * (1 - fx) + v01 * fx;
    const v1 = v10 * (1 - fx) + v11 * fx;
    out.push(Math.round(v0 * (1 - fy) + v1 * fy));
  }
  return out;
}

export function warpPerspective(source, corners, options = {}) {
  const { outputWidth = null, outputHeight = null, aspectRatio = null, padding = 0 } = options;

  const srcWidth = source.videoWidth || source.width;
  const srcHeight = source.videoHeight || source.height;

  const topWidth = Math.hypot(corners[1].x - corners[0].x, corners[1].y - corners[0].y);
  const bottomWidth = Math.hypot(corners[2].x - corners[3].x, corners[2].y - corners[3].y);
  const leftHeight = Math.hypot(corners[3].x - corners[0].x, corners[3].y - corners[0].y);
  const rightHeight = Math.hypot(corners[2].x - corners[1].x, corners[2].y - corners[1].y);

  const avgWidth = (topWidth + bottomWidth) / 2;
  const avgHeight = (leftHeight + rightHeight) / 2;

  let outW, outH;
  if (outputWidth && outputHeight) {
    outW = outputWidth;
    outH = outputHeight;
  } else if (aspectRatio) {
    if (avgWidth / avgHeight > aspectRatio) {
      outW = Math.round(avgWidth);
      outH = Math.round(avgWidth / aspectRatio);
    } else {
      outH = Math.round(avgHeight);
      outW = Math.round(avgHeight * aspectRatio);
    }
  } else {
    outW = Math.round(avgWidth);
    outH = Math.round(avgHeight);
  }

  outW += padding * 2;
  outH += padding * 2;

  const maxSize = 2200;
  if (outW > maxSize || outH > maxSize) {
    const s = maxSize / Math.max(outW, outH);
    outW = Math.round(outW * s);
    outH = Math.round(outH * s);
  }

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");

  const srcCanvas = document.createElement("canvas");
  srcCanvas.width = srcWidth;
  srcCanvas.height = srcHeight;
  const srcCtx = srcCanvas.getContext("2d");
  srcCtx.drawImage(source, 0, 0);
  const srcImageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);

  const dstCorners = [
    { x: padding, y: padding },
    { x: outW - padding, y: padding },
    { x: outW - padding, y: outH - padding },
    { x: padding, y: outH - padding },
  ];

  const matrix = computeTransformMatrix(dstCorners, corners);

  const outImageData = ctx.createImageData(outW, outH);
  const outData = outImageData.data;

  for (let y = 0; y < outH; y++) {
    for (let x = 0; x < outW; x++) {
      const srcPoint = transformPoint(x, y, matrix);
      const [r, g, b, a] = bilinearSample(srcImageData, srcPoint.x, srcPoint.y);
      const idx = (y * outW + x) * 4;
      outData[idx] = r;
      outData[idx + 1] = g;
      outData[idx + 2] = b;
      outData[idx + 3] = a;
    }
  }

  ctx.putImageData(outImageData, 0, 0);
  return canvas;
}

export function denormalizeCorners(normalizedCorners, width, height) {
  return normalizedCorners.map((c) => ({ x: c.x * width, y: c.y * height }));
}

function warpPerspectiveOpenCV(source, pixelCorners, outW, outH, padding = 0) {
  const cv = typeof window !== "undefined" ? window.cv : null;
  if (!cv || !cv.Mat || !cv.warpPerspective) return null;

  const srcWidth = source.videoWidth || source.width;
  const srcHeight =
    source.videoHeight || source.videoHeight === 0 ? source.height : source.videoHeight;

  const srcCanvas = document.createElement("canvas");
  srcCanvas.width = srcWidth;
  srcCanvas.height = srcHeight;
  const srcCtx = srcCanvas.getContext("2d");
  srcCtx.drawImage(source, 0, 0);

  const srcMat = cv.imread(srcCanvas);
  const dstMat = new cv.Mat();

  const srcPts = cv.matFromArray(4, 1, cv.CV_32FC2, [
    pixelCorners[0].x,
    pixelCorners[0].y,
    pixelCorners[1].x,
    pixelCorners[1].y,
    pixelCorners[2].x,
    pixelCorners[2].y,
    pixelCorners[3].x,
    pixelCorners[3].y,
  ]);

  const dstPts = cv.matFromArray(4, 1, cv.CV_32FC2, [
    padding,
    padding,
    outW - padding,
    padding,
    outW - padding,
    outH - padding,
    padding,
    outH - padding,
  ]);

  const M = cv.getPerspectiveTransform(srcPts, dstPts);
  cv.warpPerspective(
    srcMat,
    dstMat,
    M,
    new cv.Size(outW, outH),
    cv.INTER_LINEAR,
    cv.BORDER_CONSTANT,
    new cv.Scalar(255, 255, 255, 255)
  );

  const outCanvas = document.createElement("canvas");
  outCanvas.width = outW;
  outCanvas.height = outH;
  cv.imshow(outCanvas, dstMat);

  srcMat.delete();
  dstMat.delete();
  srcPts.delete();
  dstPts.delete();
  M.delete();

  return outCanvas;
}

export function rectifyDocument(source, normalizedCorners, options = {}) {
  const srcWidth = source.videoWidth || source.width;
  const srcHeight = source.videoHeight || source.height;

  const pixelCorners = denormalizeCorners(normalizedCorners, srcWidth, srcHeight);

  const { outputWidth = null, outputHeight = null, aspectRatio = null, padding = 0 } = options;

  const topWidth = Math.hypot(
    pixelCorners[1].x - pixelCorners[0].x,
    pixelCorners[1].y - pixelCorners[0].y
  );
  const bottomWidth = Math.hypot(
    pixelCorners[2].x - pixelCorners[3].x,
    pixelCorners[2].y - pixelCorners[3].y
  );
  const leftHeight = Math.hypot(
    pixelCorners[3].x - pixelCorners[0].x,
    pixelCorners[3].y - pixelCorners[0].y
  );
  const rightHeight = Math.hypot(
    pixelCorners[2].x - pixelCorners[1].x,
    pixelCorners[2].y - pixelCorners[1].y
  );

  const avgWidth = (topWidth + bottomWidth) / 2;
  const avgHeight = (leftHeight + rightHeight) / 2;

  let outW, outH;
  if (outputWidth && outputHeight) {
    outW = outputWidth;
    outH = outputHeight;
  } else if (aspectRatio) {
    if (avgWidth / avgHeight > aspectRatio) {
      outW = Math.round(avgWidth);
      outH = Math.round(avgWidth / aspectRatio);
    } else {
      outH = Math.round(avgHeight);
      outW = Math.round(avgHeight * aspectRatio);
    }
  } else {
    outW = Math.round(avgWidth);
    outH = Math.round(avgHeight);
  }

  outW += padding * 2;
  outH += padding * 2;

  const maxSize = 2200;
  if (outW > maxSize || outH > maxSize) {
    const s = maxSize / Math.max(outW, outH);
    outW = Math.round(outW * s);
    outH = Math.round(outH * s);
  }

  const cvCanvas = warpPerspectiveOpenCV(source, pixelCorners, outW, outH, padding);
  if (cvCanvas) return cvCanvas;

  return warpPerspective(source, pixelCorners, { outputWidth: outW, outputHeight: outH, padding });
}

export default rectifyDocument;
