// FILE: src/utils/documentDetection.js
// Detección de documento y scoring

/**
 * Detecta el contorno del documento en el frame usando análisis de bordes
 * Retorna las 4 esquinas del documento si se detecta
 */
export function detectDocumentContour(imageData) {
  const { data, width, height } = imageData;

  // Convertir a escala de grises y detectar bordes con Canny simplificado
  const gray = new Uint8Array(width * height);
  for (let i = 0; i < data.length; i += 4) {
    gray[i / 4] = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
  }

  // Aplicar Sobel para detección de bordes
  const edges = applySobel(gray, width, height);

  // Umbralizar bordes
  const threshold = 50;
  const binary = edges.map((v) => (v > threshold ? 255 : 0));

  // Encontrar contornos usando seguimiento de bordes
  const contours = findContours(binary, width, height);

  // Filtrar y encontrar el contorno más grande que sea cuadrilátero
  const documentContour = findLargestQuadrilateral(contours, width, height);

  return documentContour;
}

function applySobel(gray, width, height) {
  const result = new Float32Array(width * height);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;

      // Sobel X
      const gx =
        -gray[(y - 1) * width + (x - 1)] +
        gray[(y - 1) * width + (x + 1)] +
        -2 * gray[y * width + (x - 1)] +
        2 * gray[y * width + (x + 1)] +
        -gray[(y + 1) * width + (x - 1)] +
        gray[(y + 1) * width + (x + 1)];

      // Sobel Y
      const gy =
        -gray[(y - 1) * width + (x - 1)] -
        2 * gray[(y - 1) * width + x] -
        gray[(y - 1) * width + (x + 1)] +
        gray[(y + 1) * width + (x - 1)] +
        2 * gray[(y + 1) * width + x] +
        gray[(y + 1) * width + (x + 1)];

      result[idx] = Math.sqrt(gx * gx + gy * gy);
    }
  }

  return result;
}

function findContours(binary, width, height) {
  const visited = new Uint8Array(width * height);
  const contours = [];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      if (binary[idx] === 255 && !visited[idx]) {
        const contour = traceContour(binary, visited, x, y, width, height);
        if (contour.length > 50) {
          contours.push(contour);
        }
      }
    }
  }

  return contours;
}

function traceContour(binary, visited, startX, startY, width, height) {
  const contour = [];
  const stack = [[startX, startY]];
  const dx = [1, 1, 0, -1, -1, -1, 0, 1];
  const dy = [0, 1, 1, 1, 0, -1, -1, -1];

  while (stack.length > 0 && contour.length < 5000) {
    const [x, y] = stack.pop();
    const idx = y * width + x;

    if (visited[idx]) continue;
    visited[idx] = 1;
    contour.push({ x, y });

    for (let i = 0; i < 8; i++) {
      const nx = x + dx[i];
      const ny = y + dy[i];
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nidx = ny * width + nx;
        if (binary[nidx] === 255 && !visited[nidx]) {
          stack.push([nx, ny]);
        }
      }
    }
  }

  return contour;
}

function findLargestQuadrilateral(contours, width, height) {
  let bestQuad = null;
  let bestArea = 0;

  for (const contour of contours) {
    const hull = convexHull(contour);
    const simplified = simplifyPolygon(hull, 4);

    if (simplified.length === 4) {
      const area = polygonArea(simplified);
      const minArea = width * height * 0.1;
      const maxArea = width * height * 0.95;

      if (area > bestArea && area > minArea && area < maxArea) {
        bestArea = area;
        bestQuad = orderCorners(simplified);
      }
    }
  }

  return bestQuad;
}

function convexHull(points) {
  if (points.length < 3) return points;

  points = [...points].sort((a, b) => a.x - b.x || a.y - b.y);

  const lower = [];
  for (const p of points) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper = [];
  for (let i = points.length - 1; i >= 0; i--) {
    const p = points[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

function cross(o, a, b) {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

function simplifyPolygon(points, targetCount) {
  if (points.length <= targetCount) return points;

  let result = [...points];

  while (result.length > targetCount) {
    let minDist = Infinity;
    let minIdx = 0;

    for (let i = 0; i < result.length; i++) {
      const prev = result[(i - 1 + result.length) % result.length];
      const curr = result[i];
      const next = result[(i + 1) % result.length];

      const dist = pointToLineDistance(curr, prev, next);
      if (dist < minDist) {
        minDist = dist;
        minIdx = i;
      }
    }

    result.splice(minIdx, 1);
  }

  return result;
}

function pointToLineDistance(point, lineStart, lineEnd) {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return Math.sqrt((point.x - lineStart.x) ** 2 + (point.y - lineStart.y) ** 2);

  const t = Math.max(
    0,
    Math.min(1, ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (len * len))
  );
  const projX = lineStart.x + t * dx;
  const projY = lineStart.y + t * dy;

  return Math.sqrt((point.x - projX) ** 2 + (point.y - projY) ** 2);
}

function polygonArea(points) {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area / 2);
}

function orderCorners(corners) {
  const center = {
    x: corners.reduce((s, p) => s + p.x, 0) / 4,
    y: corners.reduce((s, p) => s + p.y, 0) / 4,
  };

  const sorted = [...corners].sort((a, b) => {
    const angleA = Math.atan2(a.y - center.y, a.x - center.x);
    const angleB = Math.atan2(b.y - center.y, b.x - center.x);
    return angleA - angleB;
  });

  // Reordenar: TL, TR, BR, BL
  const topTwo = sorted.filter((p) => p.y < center.y).sort((a, b) => a.x - b.x);
  const bottomTwo = sorted.filter((p) => p.y >= center.y).sort((a, b) => a.x - b.x);

  if (topTwo.length >= 2 && bottomTwo.length >= 2) {
    return [topTwo[0], topTwo[1], bottomTwo[1], bottomTwo[0]];
  }

  return sorted;
}

/**
 * Calcula scores de alineación del documento
 */
export function calculateAlignmentScores(corners, guideRect, frameWidth, frameHeight) {
  if (!corners || corners.length !== 4) {
    return {
      insideScore: 0,
      rotationScore: 0,
      perspectiveScore: 0,
      sideScores: { top: 0, right: 0, bottom: 0, left: 0 },
      totalScore: 0,
      hint: "Coloca el documento dentro del marco",
    };
  }

  const [tl, tr, br, bl] = corners;

  // Guide rect en píxeles
  const guide = {
    left: guideRect.x * frameWidth,
    top: guideRect.y * frameHeight,
    right: (guideRect.x + guideRect.width) * frameWidth,
    bottom: (guideRect.y + guideRect.height) * frameHeight,
  };

  // 1. Inside Score - todas las esquinas dentro del guideRect
  const margin = 20;
  const insideScores = corners.map((c) => {
    const inX = c.x >= guide.left - margin && c.x <= guide.right + margin;
    const inY = c.y >= guide.top - margin && c.y <= guide.bottom + margin;
    return inX && inY ? 1 : 0;
  });
  const insideScore = insideScores.reduce((a, b) => a + b, 0) / 4;

  // 2. Rotation Score - bordes horizontales/verticales
  const topEdgeAngle = Math.abs(Math.atan2(tr.y - tl.y, tr.x - tl.x));
  const bottomEdgeAngle = Math.abs(Math.atan2(br.y - bl.y, br.x - bl.x));
  const leftEdgeAngle = Math.abs(Math.atan2(bl.y - tl.y, bl.x - tl.x) - Math.PI / 2);
  const rightEdgeAngle = Math.abs(Math.atan2(br.y - tr.y, br.x - tr.x) - Math.PI / 2);

  const maxRotation = 0.15; // ~8.5 grados
  const rotationScore = Math.max(
    0,
    1 -
      (Math.min(topEdgeAngle, maxRotation) +
        Math.min(bottomEdgeAngle, maxRotation) +
        Math.min(leftEdgeAngle, maxRotation) +
        Math.min(rightEdgeAngle, maxRotation)) /
        (4 * maxRotation)
  );

  // 3. Perspective Score - lados opuestos similares
  const topWidth = Math.sqrt((tr.x - tl.x) ** 2 + (tr.y - tl.y) ** 2);
  const bottomWidth = Math.sqrt((br.x - bl.x) ** 2 + (br.y - bl.y) ** 2);
  const leftHeight = Math.sqrt((bl.x - tl.x) ** 2 + (bl.y - tl.y) ** 2);
  const rightHeight = Math.sqrt((br.x - tr.x) ** 2 + (br.y - tr.y) ** 2);

  const widthRatio = Math.min(topWidth, bottomWidth) / Math.max(topWidth, bottomWidth);
  const heightRatio = Math.min(leftHeight, rightHeight) / Math.max(leftHeight, rightHeight);
  const perspectiveScore = (widthRatio + heightRatio) / 2;

  // 4. Side Scores para UI
  const sideScores = {
    top: calculateSideScore(tl, tr, guide.left, guide.top, guide.right, guide.top, margin),
    right: calculateSideScore(tr, br, guide.right, guide.top, guide.right, guide.bottom, margin),
    bottom: calculateSideScore(bl, br, guide.left, guide.bottom, guide.right, guide.bottom, margin),
    left: calculateSideScore(tl, bl, guide.left, guide.top, guide.left, guide.bottom, margin),
  };

  // Total Score
  const totalScore = 0.4 * insideScore + 0.3 * rotationScore + 0.3 * perspectiveScore;

  // Hint
  let hint = "Mantén la posición";
  if (insideScore < 0.5) {
    hint = "Coloca el documento dentro del marco";
  } else if (rotationScore < 0.7) {
    hint = "Endereza el documento";
  } else if (perspectiveScore < 0.7) {
    hint = "Coloca la cámara de frente al documento";
  } else if (totalScore >= 0.85) {
    hint = "¡Perfecto! Mantén la posición";
  }

  return {
    insideScore,
    rotationScore,
    perspectiveScore,
    sideScores,
    totalScore,
    hint,
  };
}

function calculateSideScore(p1, p2, gx1, gy1, gx2, gy2, margin) {
  const dist1 = Math.sqrt((p1.x - gx1) ** 2 + (p1.y - gy1) ** 2);
  const dist2 = Math.sqrt((p2.x - gx2) ** 2 + (p2.y - gy2) ** 2);
  const avgDist = (dist1 + dist2) / 2;
  return Math.max(0, 1 - avgDist / (margin * 3));
}

/**
 * Aplica transformación de perspectiva para rectificar el documento
 */
export function perspectiveTransform(sourceCanvas, corners, outputWidth = 800, outputHeight = 560) {
  if (!corners || corners.length !== 4) return sourceCanvas;

  const [tl, tr, br, bl] = corners;

  const output = document.createElement("canvas");
  output.width = outputWidth;
  output.height = outputHeight;
  const outCtx = output.getContext("2d");

  const srcCtx = sourceCanvas.getContext("2d");
  const srcData = srcCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
  const outData = outCtx.createImageData(outputWidth, outputHeight);

  // Transformación de perspectiva inversa
  for (let y = 0; y < outputHeight; y++) {
    for (let x = 0; x < outputWidth; x++) {
      const u = x / outputWidth;
      const v = y / outputHeight;

      // Interpolación bilinear de las esquinas
      const topX = tl.x + u * (tr.x - tl.x);
      const topY = tl.y + u * (tr.y - tl.y);
      const bottomX = bl.x + u * (br.x - bl.x);
      const bottomY = bl.y + u * (br.y - bl.y);

      const srcX = Math.round(topX + v * (bottomX - topX));
      const srcY = Math.round(topY + v * (bottomY - topY));

      if (srcX >= 0 && srcX < sourceCanvas.width && srcY >= 0 && srcY < sourceCanvas.height) {
        const srcIdx = (srcY * sourceCanvas.width + srcX) * 4;
        const dstIdx = (y * outputWidth + x) * 4;

        outData.data[dstIdx] = srcData.data[srcIdx];
        outData.data[dstIdx + 1] = srcData.data[srcIdx + 1];
        outData.data[dstIdx + 2] = srcData.data[srcIdx + 2];
        outData.data[dstIdx + 3] = 255;
      }
    }
  }

  outCtx.putImageData(outData, 0, 0);
  return output;
}
