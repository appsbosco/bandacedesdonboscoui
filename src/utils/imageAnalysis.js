/**
 * Image Analysis Utilities - VERSIÓN MEJORADA
 * Umbrales más estrictos para evitar fotos sobre-expuestas
 */

/**
 * Calcula la varianza Laplaciana para medir el enfoque
 */
// src/utils/imageAnalysis.js
export function calculateBlurScore(imageData) {
  const { data, width, height } = imageData;
  let sum = 0;
  let sumSq = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const center = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      const top =
        (data[((y - 1) * width + x) * 4] +
          data[((y - 1) * width + x) * 4 + 1] +
          data[((y - 1) * width + x) * 4 + 2]) /
        3;
      const bottom =
        (data[((y + 1) * width + x) * 4] +
          data[((y + 1) * width + x) * 4 + 1] +
          data[((y + 1) * width + x) * 4 + 2]) /
        3;
      const left =
        (data[(y * width + x - 1) * 4] +
          data[(y * width + x - 1) * 4 + 1] +
          data[(y * width + x - 1) * 4 + 2]) /
        3;
      const right =
        (data[(y * width + x + 1) * 4] +
          data[(y * width + x + 1) * 4 + 1] +
          data[(y * width + x + 1) * 4 + 2]) /
        3;
      const laplacian = Math.abs(4 * center - top - bottom - left - right);
      sum += laplacian;
      sumSq += laplacian * laplacian;
      count++;
    }
  }

  const mean = sum / count;
  const variance = sumSq / count - mean * mean;
  return Math.min(variance / 400, 1);
}

export function calculateBrightness(imageData) {
  const { data } = imageData;
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  return sum / (data.length / 4);
}

export function calculateGlare(imageData, threshold = 245) {
  const { data } = imageData;
  let saturatedCount = 0;
  const totalPixels = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] > threshold && data[i + 1] > threshold && data[i + 2] > threshold) {
      saturatedCount++;
    }
  }
  return saturatedCount / totalPixels;
}

export function calculateAlignment(imageData) {
  const { data, width, height } = imageData;
  let horizontalEdges = 0;
  let verticalEdges = 0;
  let totalEdges = 0;

  for (let y = 1; y < height - 1; y += 2) {
    for (let x = 1; x < width - 1; x += 2) {
      const idx = (y * width + x) * 4;
      const getGray = (i) => (data[i] + data[i + 1] + data[i + 2]) / 3;
      const center = getGray(idx);
      const left = getGray((y * width + x - 1) * 4);
      const right = getGray((y * width + x + 1) * 4);
      const top = getGray(((y - 1) * width + x) * 4);
      const bottom = getGray(((y + 1) * width + x) * 4);
      const gx = Math.abs(right - left);
      const gy = Math.abs(bottom - top);
      const edgeStrength = Math.sqrt(gx * gx + gy * gy);

      if (edgeStrength > 25) {
        totalEdges++;
        if (gx > gy * 1.5) verticalEdges++;
        else if (gy > gx * 1.5) horizontalEdges++;
      }
    }
  }

  const alignedEdges = horizontalEdges + verticalEdges;
  const alignmentScore = totalEdges > 0 ? alignedEdges / totalEdges : 0;
  return {
    horizontalScore: totalEdges > 0 ? horizontalEdges / totalEdges : 0,
    verticalScore: totalEdges > 0 ? verticalEdges / totalEdges : 0,
    alignmentScore: Math.min(alignmentScore * 1.3, 1),
  };
}

export function detectDocumentInScanArea(
  imageData,
  scanArea = { x: 0.05, y: 0.25, width: 0.9, height: 0.5 }
) {
  const { data, width, height } = imageData;

  const areaX = Math.floor(scanArea.x * width);
  const areaY = Math.floor(scanArea.y * height);
  const areaW = Math.floor(scanArea.width * width);
  const areaH = Math.floor(scanArea.height * height);

  const margin = 8;
  let edgeContrast = 0;
  let edgeSamples = 0;

  // Top edge
  for (let x = areaX + margin; x < areaX + areaW - margin; x += 4) {
    const insideIdx = ((areaY + margin) * width + x) * 4;
    const outsideIdx = ((areaY - margin) * width + x) * 4;
    if (outsideIdx >= 0) {
      const insideGray = (data[insideIdx] + data[insideIdx + 1] + data[insideIdx + 2]) / 3;
      const outsideGray = (data[outsideIdx] + data[outsideIdx + 1] + data[outsideIdx + 2]) / 3;
      edgeContrast += Math.abs(insideGray - outsideGray);
      edgeSamples++;
    }
  }

  // Bottom edge
  for (let x = areaX + margin; x < areaX + areaW - margin; x += 4) {
    const insideIdx = ((areaY + areaH - margin) * width + x) * 4;
    const outsideIdx = ((areaY + areaH + margin) * width + x) * 4;
    if (outsideIdx < data.length) {
      const insideGray = (data[insideIdx] + data[insideIdx + 1] + data[insideIdx + 2]) / 3;
      const outsideGray = (data[outsideIdx] + data[outsideIdx + 1] + data[outsideIdx + 2]) / 3;
      edgeContrast += Math.abs(insideGray - outsideGray);
      edgeSamples++;
    }
  }

  // Left edge
  for (let y = areaY + margin; y < areaY + areaH - margin; y += 4) {
    const insideIdx = (y * width + areaX + margin) * 4;
    const outsideIdx = (y * width + areaX - margin) * 4;
    if (outsideIdx >= 0) {
      const insideGray = (data[insideIdx] + data[insideIdx + 1] + data[insideIdx + 2]) / 3;
      const outsideGray = (data[outsideIdx] + data[outsideIdx + 1] + data[outsideIdx + 2]) / 3;
      edgeContrast += Math.abs(insideGray - outsideGray);
      edgeSamples++;
    }
  }

  // Right edge
  for (let y = areaY + margin; y < areaY + areaH - margin; y += 4) {
    const insideIdx = (y * width + areaX + areaW - margin) * 4;
    const outsideIdx = (y * width + areaX + areaW + margin) * 4;
    if (outsideIdx < data.length) {
      const insideGray = (data[insideIdx] + data[insideIdx + 1] + data[insideIdx + 2]) / 3;
      const outsideGray = (data[outsideIdx] + data[outsideIdx + 1] + data[outsideIdx + 2]) / 3;
      edgeContrast += Math.abs(insideGray - outsideGray);
      edgeSamples++;
    }
  }

  const avgEdgeContrast = edgeSamples > 0 ? edgeContrast / edgeSamples : 0;

  // Check interior uniformity vs edges
  let interiorVariance = 0;
  let interiorSamples = 0;
  const interiorValues = [];

  for (let y = areaY + margin * 2; y < areaY + areaH - margin * 2; y += 8) {
    for (let x = areaX + margin * 2; x < areaX + areaW - margin * 2; x += 8) {
      const idx = (y * width + x) * 4;
      const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      interiorValues.push(gray);
      interiorSamples++;
    }
  }

  if (interiorSamples > 0) {
    const mean = interiorValues.reduce((a, b) => a + b, 0) / interiorValues.length;
    interiorVariance =
      interiorValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / interiorValues.length;
  }

  const hasStrongEdges = avgEdgeContrast > 20;
  const hasReasonableInterior = interiorVariance < 3000 && interiorVariance > 100;
  const edgeScore = Math.min(avgEdgeContrast / 50, 1);

  return {
    detected: hasStrongEdges && hasReasonableInterior,
    edgeContrast: avgEdgeContrast,
    interiorVariance,
    confidence: edgeScore,
  };
}

export function analyzeFrame(imageData, scanArea) {
  const focusScore = calculateBlurScore(imageData);
  const brightness = calculateBrightness(imageData);
  const glarePercent = calculateGlare(imageData);
  const { alignmentScore } = calculateAlignment(imageData);
  const documentAnalysis = detectDocumentInScanArea(imageData, scanArea);

  let brightnessScore;
  if (brightness < 80) {
    brightnessScore = brightness / 80;
  } else if (brightness > 200) {
    brightnessScore = Math.max(0, 1 - (brightness - 200) / 55);
  } else {
    brightnessScore = 1;
  }

  const glareScore = 1 - Math.min(glarePercent * 15, 1);

  const focusOk = focusScore > 0.3;
  const brightnessOk = brightnessScore > 0.7;
  const glareOk = glarePercent < 0.03;
  const alignmentOk = alignmentScore > 0.6;
  const documentOk = documentAnalysis.detected && documentAnalysis.confidence > 0.4;

  const overallOk = focusOk && brightnessOk && glareOk && alignmentOk && documentOk;
  const overallScore =
    focusScore * 0.25 +
    brightnessScore * 0.2 +
    glareScore * 0.2 +
    alignmentScore * 0.15 +
    documentAnalysis.confidence * 0.2;

  return {
    focus: {
      score: focusScore,
      ok: focusOk,
      label: focusOk ? "En foco" : "Desenfocado",
    },
    brightness: {
      score: brightnessScore,
      raw: brightness,
      ok: brightnessOk,
      label: brightness < 80 ? "Poca luz" : brightness > 200 ? "Mucha luz" : "Buena luz",
    },
    glare: {
      score: glareScore,
      percent: glarePercent,
      ok: glareOk,
      label: glareOk ? "Sin reflejo" : "Hay reflejo",
    },
    alignment: {
      score: alignmentScore,
      ok: alignmentOk,
      label: alignmentOk ? "Alineado" : "Alinea mejor",
    },
    documentDetected: documentOk,
    documentConfidence: documentAnalysis.confidence,
    overallOk,
    overallScore,
  };
}

// Module-level reusable canvas to avoid GC pressure (one alloc, reused every frame)
let _scaledCanvas = null;
let _scaledCtx = null;

export function getScaledImageData(source, maxSize = 400) {
  if (!_scaledCanvas) {
    _scaledCanvas = document.createElement("canvas");
    _scaledCtx = _scaledCanvas.getContext("2d");
  }
  const sourceWidth = source.videoWidth || source.width;
  const sourceHeight = source.videoHeight || source.height;
  const scale = Math.min(maxSize / sourceWidth, maxSize / sourceHeight, 1);
  const w = Math.round(sourceWidth * scale);
  const h = Math.round(sourceHeight * scale);
  // Only resize when dimensions change (avoids implicit clear + realloc)
  if (_scaledCanvas.width !== w) _scaledCanvas.width = w;
  if (_scaledCanvas.height !== h) _scaledCanvas.height = h;
  _scaledCtx.drawImage(source, 0, 0, w, h);
  return _scaledCtx.getImageData(0, 0, w, h);
}
