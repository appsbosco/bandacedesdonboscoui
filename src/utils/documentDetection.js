// FILE: src/utils/documentDetection.js
// REEMPLAZA TODO EL ARCHIVO

/**
 * Document Detection Utilities (Pure JS)
 * - Works inside scanArea crop (huge robustness win)
 * - Adaptive thresholds (per frame)
 * - Dilation (connect broken edges)
 * - Fallback bbox when quad not found (so overlay at least reacts)
 */

const DETECTION_CONFIG = {
  minAreaRatio: 0.12, // relative to cropped area
  maxAreaRatio: 0.98,
  approxEpsilon: 0.03,
  cornerMargin: 0.02,
  dilationIterations: 1,
  bboxMinEdgePixels: 120, // fallback needs at least this many strong edge pixels
};

function isDebugEnabled() {
  try {
    return typeof window !== "undefined" && localStorage.getItem("scannerDebug") === "1";
  } catch {
    return false;
  }
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function toGrayscaleRegion(imageData, sx, sy, sw, sh) {
  const { data, width } = imageData;
  const gray = new Uint8Array(sw * sh);
  let k = 0;
  for (let y = 0; y < sh; y++) {
    const yy = sy + y;
    for (let x = 0; x < sw; x++) {
      const xx = sx + x;
      const i = (yy * width + xx) * 4;
      gray[k++] = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    }
  }
  return gray;
}

function gaussianBlur(gray, width, height) {
  const kernel = [
    1, 4, 6, 4, 1, 4, 16, 24, 16, 4, 6, 24, 36, 24, 6, 4, 16, 24, 16, 4, 1, 4, 6, 4, 1,
  ];
  const kernelSum = 256;
  const out = new Uint8Array(width * height);

  for (let y = 2; y < height - 2; y++) {
    for (let x = 2; x < width - 2; x++) {
      let sum = 0;
      let ki = 0;
      for (let ky = -2; ky <= 2; ky++) {
        for (let kx = -2; kx <= 2; kx++) {
          sum += gray[(y + ky) * width + (x + kx)] * kernel[ki++];
        }
      }
      out[y * width + x] = Math.round(sum / kernelSum);
    }
  }

  // borders copy
  for (let x = 0; x < width; x++) {
    out[x] = gray[x];
    out[(height - 1) * width + x] = gray[(height - 1) * width + x];
  }
  for (let y = 0; y < height; y++) {
    out[y * width] = gray[y * width];
    out[y * width + (width - 1)] = gray[y * width + (width - 1)];
  }

  return out;
}

function sobelEdges(gray, width, height) {
  const mag = new Uint8Array(width * height);
  const dir = new Float32Array(width * height);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;

      const gx =
        -gray[(y - 1) * width + (x - 1)] +
        gray[(y - 1) * width + (x + 1)] -
        2 * gray[y * width + (x - 1)] +
        2 * gray[y * width + (x + 1)] -
        gray[(y + 1) * width + (x - 1)] +
        gray[(y + 1) * width + (x + 1)];

      const gy =
        -gray[(y - 1) * width + (x - 1)] -
        2 * gray[(y - 1) * width + x] -
        gray[(y - 1) * width + (x + 1)] +
        gray[(y + 1) * width + (x - 1)] +
        2 * gray[(y + 1) * width + x] +
        gray[(y + 1) * width + (x + 1)];

      mag[idx] = Math.min(255, Math.sqrt(gx * gx + gy * gy));
      dir[idx] = Math.atan2(gy, gx);
    }
  }

  return { magnitude: mag, direction: dir };
}

function nonMaxSuppression(magnitude, direction, width, height) {
  const out = new Uint8Array(width * height);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const angle = ((direction[idx] * 180) / Math.PI + 180) % 180;
      const m = magnitude[idx];

      let n1, n2;
      if (angle < 22.5 || angle >= 157.5) {
        n1 = magnitude[y * width + (x - 1)];
        n2 = magnitude[y * width + (x + 1)];
      } else if (angle < 67.5) {
        n1 = magnitude[(y - 1) * width + (x + 1)];
        n2 = magnitude[(y + 1) * width + (x - 1)];
      } else if (angle < 112.5) {
        n1 = magnitude[(y - 1) * width + x];
        n2 = magnitude[(y + 1) * width + x];
      } else {
        n1 = magnitude[(y - 1) * width + (x - 1)];
        n2 = magnitude[(y + 1) * width + (x + 1)];
      }

      out[idx] = m >= n1 && m >= n2 ? m : 0;
    }
  }

  return out;
}

function adaptiveCannyThresholds(magnitude) {
  // histogram 0..255
  const hist = new Uint32Array(256);
  for (let i = 0; i < magnitude.length; i += 2) hist[magnitude[i]]++;

  const total = magnitude.length / 2;
  const target = Math.floor(total * 0.9); // 90th percentile
  let c = 0;
  let high = 60;

  for (let v = 0; v < 256; v++) {
    c += hist[v];
    if (c >= target) {
      high = v;
      break;
    }
  }

  high = Math.max(25, Math.min(140, high));
  const low = Math.max(8, Math.round(high * 0.45));
  return { low, high };
}

function hysteresisThreshold(edges, width, height, low, high) {
  const out = new Uint8Array(width * height);
  const strong = 255;
  const weak = 75;

  for (let i = 0; i < edges.length; i++) {
    if (edges[i] >= high) out[i] = strong;
    else if (edges[i] >= low) out[i] = weak;
  }

  // 2 passes
  for (let pass = 0; pass < 2; pass++) {
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        if (out[idx] !== weak) continue;

        const s =
          out[(y - 1) * width + (x - 1)] === strong ||
          out[(y - 1) * width + x] === strong ||
          out[(y - 1) * width + (x + 1)] === strong ||
          out[y * width + (x - 1)] === strong ||
          out[y * width + (x + 1)] === strong ||
          out[(y + 1) * width + (x - 1)] === strong ||
          out[(y + 1) * width + x] === strong ||
          out[(y + 1) * width + (x + 1)] === strong;

        if (s) out[idx] = strong;
      }
    }
  }

  for (let i = 0; i < out.length; i++) if (out[i] !== strong) out[i] = 0;
  return out;
}

function dilate(edges, width, height, iterations = 1) {
  let cur = edges;
  for (let it = 0; it < iterations; it++) {
    const out = new Uint8Array(width * height);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        if (cur[idx] === 255) {
          out[idx] = 255;
          continue;
        }
        const v =
          cur[idx] === 255 ||
          cur[(y - 1) * width + x] === 255 ||
          cur[(y + 1) * width + x] === 255 ||
          cur[y * width + (x - 1)] === 255 ||
          cur[y * width + (x + 1)] === 255 ||
          cur[(y - 1) * width + (x - 1)] === 255 ||
          cur[(y - 1) * width + (x + 1)] === 255 ||
          cur[(y + 1) * width + (x - 1)] === 255 ||
          cur[(y + 1) * width + (x + 1)] === 255;
        if (v) out[idx] = 255;
      }
    }
    cur = out;
  }
  return cur;
}

function findContours(edges, width, height) {
  const visited = new Uint8Array(width * height);
  const contours = [];

  // (dx, dy)
  const dirs = [
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 1],
    [-1, 0],
    [-1, -1],
    [0, -1],
    [1, -1],
  ];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      if (edges[idx] !== 255 || visited[idx]) continue;

      const contour = [];
      let cx = x;
      let cy = y;
      const startX = x;
      const startY = y;
      let dir = 0;

      let steps = 0;
      const maxSteps = width * height;

      while (steps < maxSteps) {
        contour.push({ x: cx, y: cy });
        visited[cy * width + cx] = 1;

        let found = false;
        for (let i = 0; i < 8; i++) {
          const nd = (dir + i) % 8;
          const [dx, dy] = dirs[nd];
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

          if (edges[ny * width + nx] === 255) {
            cx = nx;
            cy = ny;
            dir = (nd + 5) % 8;
            found = true;
            break;
          }
        }

        if (!found) break;
        steps++;
        if (cx === startX && cy === startY) break;
      }

      if (contour.length > 25) contours.push(contour);
    }
  }

  return contours;
}

function contourPerimeter(contour) {
  let p = 0;
  for (let i = 0; i < contour.length; i++) {
    const j = (i + 1) % contour.length;
    p += Math.hypot(contour[j].x - contour[i].x, contour[j].y - contour[i].y);
  }
  return p;
}

function pointToLineDistance(point, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) return Math.hypot(point.x - a.x, point.y - a.y);
  const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / (len * len)));
  const px = a.x + t * dx;
  const py = a.y + t * dy;
  return Math.hypot(point.x - px, point.y - py);
}

function approxPolyDP(contour, epsilon) {
  if (!contour || contour.length < 3) return contour || [];

  let maxDist = 0;
  let maxIdx = 0;
  const start = contour[0];
  const end = contour[contour.length - 1];

  for (let i = 1; i < contour.length - 1; i++) {
    const dist = pointToLineDistance(contour[i], start, end);
    if (dist > maxDist) {
      maxDist = dist;
      maxIdx = i;
    }
  }

  if (maxDist > epsilon) {
    const left = approxPolyDP(contour.slice(0, maxIdx + 1), epsilon);
    const right = approxPolyDP(contour.slice(maxIdx), epsilon);
    return left.slice(0, -1).concat(right);
  }

  return [start, end];
}

function uniq4(points) {
  const out = [];
  const seen = new Set();
  for (const p of points) {
    const k = `${p.x}|${p.y}`;
    if (!seen.has(k)) {
      seen.add(k);
      out.push(p);
    }
  }
  return out;
}

function isConvex(poly) {
  if (!poly || poly.length < 4) return true;
  let sign = 0;
  for (let i = 0; i < poly.length; i++) {
    const p0 = poly[i];
    const p1 = poly[(i + 1) % poly.length];
    const p2 = poly[(i + 2) % poly.length];
    const cross = (p1.x - p0.x) * (p2.y - p1.y) - (p1.y - p0.y) * (p2.x - p1.x);
    if (cross !== 0) {
      const s = cross > 0 ? 1 : -1;
      if (sign === 0) sign = s;
      else if (s !== sign) return false;
    }
  }
  return true;
}

function quadFromExtremes(points) {
  if (!points || points.length < 4) return null;
  const tl = points.reduce((a, p) => (p.x + p.y < a.x + a.y ? p : a), points[0]);
  const br = points.reduce((a, p) => (p.x + p.y > a.x + a.y ? p : a), points[0]);
  const tr = points.reduce((a, p) => (p.x - p.y > a.x - a.y ? p : a), points[0]);
  const bl = points.reduce((a, p) => (p.x - p.y < a.x - a.y ? p : a), points[0]);
  const quad = uniq4([tl, tr, br, bl]);
  if (quad.length !== 4) return null;
  return quad;
}

function orderCorners(pts) {
  const p = pts.slice(0, 4);
  const tl = p.reduce((a, q) => (q.x + q.y < a.x + a.y ? q : a), p[0]);
  const br = p.reduce((a, q) => (q.x + q.y > a.x + a.y ? q : a), p[0]);
  const tr = p.reduce((a, q) => (q.x - q.y > a.x - a.y ? q : a), p[0]);
  const bl = p.reduce((a, q) => (q.x - q.y < a.x - a.y ? q : a), p[0]);
  return [tl, tr, br, bl];
}

function polygonArea4(quad) {
  const n = quad.length;
  let area = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += quad[i].x * quad[j].y - quad[j].x * quad[i].y;
  }
  return Math.abs(area) / 2;
}

function edgeDensity(edges) {
  let s = 0;
  let t = 0;
  for (let i = 0; i < edges.length; i += 4) {
    t++;
    if (edges[i] === 255) s++;
  }
  return t ? s / t : 0;
}

function fallbackBBoxFromEdges(edges, w, h) {
  let minX = w,
    minY = h,
    maxX = -1,
    maxY = -1,
    count = 0;

  for (let y = 1; y < h - 1; y += 2) {
    for (let x = 1; x < w - 1; x += 2) {
      if (edges[y * w + x] !== 255) continue;
      count++;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  if (count < DETECTION_CONFIG.bboxMinEdgePixels || maxX <= minX || maxY <= minY) return null;

  const quad = [
    { x: minX, y: minY },
    { x: maxX, y: minY },
    { x: maxX, y: maxY },
    { x: minX, y: maxY },
  ];

  return { quad, count, fill: (count * 4) / (w * h) };
}

export function detectDocument(imageData, scanArea = null) {
  const dbg = isDebugEnabled();
  const fullW = imageData.width;
  const fullH = imageData.height;

  // Crop to scanArea (IMPORTANT)
  let sx = 0,
    sy = 0,
    sw = fullW,
    sh = fullH;

  if (scanArea) {
    sx = Math.max(0, Math.floor(scanArea.x * fullW));
    sy = Math.max(0, Math.floor(scanArea.y * fullH));
    sw = Math.min(fullW - sx, Math.floor(scanArea.width * fullW));
    sh = Math.min(fullH - sy, Math.floor(scanArea.height * fullH));
    if (sw < 30 || sh < 30) {
      return {
        detected: false,
        corners: null,
        confidence: 0,
        normalized: null,
        ...(dbg ? { debug: { reason: "crop_too_small", sx, sy, sw, sh } } : {}),
      };
    }
  }

  const gray = toGrayscaleRegion(imageData, sx, sy, sw, sh);
  const blurred = gaussianBlur(gray, sw, sh);
  const { magnitude, direction } = sobelEdges(blurred, sw, sh);
  const suppressed = nonMaxSuppression(magnitude, direction, sw, sh);

  const thr = adaptiveCannyThresholds(suppressed);
  let edges = hysteresisThreshold(suppressed, sw, sh, thr.low, thr.high);
  edges = dilate(edges, sw, sh, DETECTION_CONFIG.dilationIterations);

  const contours = findContours(edges, sw, sh);
  const cropArea = sw * sh;

  let bestQuad = null;
  let bestScore = 0;
  let bestAreaRatio = 0;
  let candidateCount = 0;

  for (const contour of contours) {
    const per = contourPerimeter(contour);
    const eps = DETECTION_CONFIG.approxEpsilon * per;

    const approx = approxPolyDP(contour, eps);
    if (!approx || approx.length < 4) continue;

    const quad0 = quadFromExtremes(approx);
    if (!quad0 || quad0.length !== 4) continue;
    if (!isConvex(quad0)) continue;

    const quad = orderCorners(quad0);
    const area = polygonArea4(quad);
    const areaRatio = area / cropArea;

    if (areaRatio < DETECTION_CONFIG.minAreaRatio || areaRatio > DETECTION_CONFIG.maxAreaRatio)
      continue;

    candidateCount++;

    const score = areaRatio * 0.85 + 0.15;
    if (score > bestScore) {
      bestScore = score;
      bestQuad = quad;
      bestAreaRatio = areaRatio;
    }
  }

  // Fallback bbox when quad not found
  if (!bestQuad) {
    const fb = fallbackBBoxFromEdges(edges, sw, sh);
    if (!fb) {
      return {
        detected: false,
        corners: null,
        confidence: 0,
        normalized: null,
        ...(dbg
          ? {
              debug: {
                sx,
                sy,
                sw,
                sh,
                thresholds: thr,
                contoursCount: contours.length,
                candidateCount,
                edgeDensity: edgeDensity(edges),
                bestAreaRatio: 0,
                reason: "no_quad_no_bbox",
              },
            }
          : {}),
      };
    }

    bestQuad = fb.quad;
    bestScore = 0.18 + clamp01(fb.fill) * 0.3;
    bestAreaRatio = polygonArea4(bestQuad) / cropArea;
  }

  // Convert from crop coords -> full coords
  const fullCorners = bestQuad.map((p) => ({ x: p.x + sx, y: p.y + sy }));
  const normalized = fullCorners.map((p) => ({ x: p.x / fullW, y: p.y / fullH }));

  return {
    detected: true,
    corners: fullCorners,
    normalized,
    confidence: bestScore,
    insideScanArea: true,
    ...(dbg
      ? {
          debug: {
            sx,
            sy,
            sw,
            sh,
            thresholds: thr,
            contoursCount: contours.length,
            candidateCount,
            edgeDensity: edgeDensity(edges),
            bestAreaRatio,
          },
        }
      : {}),
  };
}

export function calculateScores(detection, scanArea, prevCorners = null) {
  if (!detection.detected || !detection.normalized) {
    return {
      insideScore: 0,
      rotationScore: 0,
      perspectiveScore: 0,
      stabilityScore: 0,
      totalScore: 0,
      captureEnabled: false,
      autoCaptureReady: false,
      hint: "Coloca el documento dentro del recuadro",
      sizeRatio: 0,
    };
  }

  const c = detection.normalized;

  // inside + size
  let insideScore = 1;
  const margin = 0.02;
  for (const p of c) {
    if (
      p.x < scanArea.x - margin ||
      p.x > scanArea.x + scanArea.width + margin ||
      p.y < scanArea.y - margin ||
      p.y > scanArea.y + scanArea.height + margin
    ) {
      insideScore *= 0.5;
    }
  }

  const docW = (Math.abs(c[1].x - c[0].x) + Math.abs(c[2].x - c[3].x)) / 2;
  const docH = (Math.abs(c[3].y - c[0].y) + Math.abs(c[2].y - c[1].y)) / 2;
  const sizeRatio = (docW * docH) / (scanArea.width * scanArea.height);

  if (sizeRatio < 0.5) insideScore *= 0.5 + sizeRatio;
  else if (sizeRatio > 1.2) insideScore *= Math.max(0.3, 2 - sizeRatio);

  // rotation
  const topA = Math.atan2(c[1].y - c[0].y, c[1].x - c[0].x);
  const botA = Math.atan2(c[2].y - c[3].y, c[2].x - c[3].x);
  const leftA = Math.atan2(c[3].y - c[0].y, c[3].x - c[0].x);
  const rightA = Math.atan2(c[2].y - c[1].y, c[2].x - c[1].x);

  const horizDev = (Math.abs(topA) + Math.abs(botA)) / 2;
  const vertDev = (Math.abs(leftA - Math.PI / 2) + Math.abs(rightA - Math.PI / 2)) / 2;

  const maxRot = Math.PI / 12;
  const rotationScore = Math.max(0, 1 - (horizDev + vertDev) / (2 * maxRot));

  // perspective
  const topW = Math.hypot(c[1].x - c[0].x, c[1].y - c[0].y);
  const botW = Math.hypot(c[2].x - c[3].x, c[2].y - c[3].y);
  const leftH = Math.hypot(c[3].x - c[0].x, c[3].y - c[0].y);
  const rightH = Math.hypot(c[2].x - c[1].x, c[2].y - c[1].y);

  const wRatio = topW && botW ? Math.min(topW, botW) / Math.max(topW, botW) : 0;
  const hRatio = leftH && rightH ? Math.min(leftH, rightH) / Math.max(leftH, rightH) : 0;
  const perspectiveScore = wRatio * hRatio;

  // stability
  let stabilityScore = 1;
  if (prevCorners && prevCorners.length === 4) {
    let mv = 0;
    for (let i = 0; i < 4; i++)
      mv += Math.hypot(c[i].x - prevCorners[i].x, c[i].y - prevCorners[i].y);
    const avg = mv / 4;
    const maxMv = 0.03;
    stabilityScore = Math.max(0, 1 - avg / maxMv);
  }

  const totalScore =
    0.4 * insideScore + 0.25 * rotationScore + 0.25 * perspectiveScore + 0.1 * stabilityScore;

  const captureEnabled = totalScore >= 0.85;
  const autoCaptureReady = totalScore >= 0.9;

  const worst = [
    {
      score: insideScore,
      hint:
        sizeRatio < 0.5
          ? "Acércate al documento"
          : sizeRatio > 1.2
          ? "Aléjate del documento"
          : "Coloca el documento dentro del recuadro",
    },
    { score: rotationScore, hint: "Endereza el documento" },
    { score: perspectiveScore, hint: "Alinea de frente el documento" },
    { score: stabilityScore, hint: "Mantén la cámara quieta" },
  ].reduce((a, b) => (b.score < a.score ? b : a));

  const hint = worst.score < 0.7 ? worst.hint : "";

  return {
    insideScore,
    rotationScore,
    perspectiveScore,
    stabilityScore,
    totalScore,
    captureEnabled,
    autoCaptureReady,
    hint,
    sizeRatio,
  };
}

export function getEdgeAlignments(detection, scanArea) {
  if (!detection.detected || !detection.normalized) return { top: 0, right: 0, bottom: 0, left: 0 };

  const c = detection.normalized;
  const maxRot = Math.PI / 12;

  const topA = Math.atan2(c[1].y - c[0].y, c[1].x - c[0].x);
  const botA = Math.atan2(c[2].y - c[3].y, c[2].x - c[3].x);
  const leftA = Math.atan2(c[3].y - c[0].y, c[3].x - c[0].x);
  const rightA = Math.atan2(c[2].y - c[1].y, c[2].x - c[1].x);

  const horiz = (a) => clamp01(1 - Math.min(Math.abs(a), Math.abs(Math.PI - Math.abs(a))) / maxRot);
  const vert = (a) => clamp01(1 - Math.abs(a - Math.PI / 2) / maxRot);

  const inside = (p) =>
    p.x >= scanArea.x &&
    p.x <= scanArea.x + scanArea.width &&
    p.y >= scanArea.y &&
    p.y <= scanArea.y + scanArea.height;

  const topInside = inside(c[0]) && inside(c[1]) ? 1 : 0.35;
  const rightInside = inside(c[1]) && inside(c[2]) ? 1 : 0.35;
  const bottomInside = inside(c[2]) && inside(c[3]) ? 1 : 0.35;
  const leftInside = inside(c[3]) && inside(c[0]) ? 1 : 0.35;

  const topW = Math.hypot(c[1].x - c[0].x, c[1].y - c[0].y);
  const botW = Math.hypot(c[2].x - c[3].x, c[2].y - c[3].y);
  const leftH = Math.hypot(c[3].x - c[0].x, c[3].y - c[0].y);
  const rightH = Math.hypot(c[2].x - c[1].x, c[2].y - c[1].y);

  const wRatio = topW && botW ? Math.min(topW, botW) / Math.max(topW, botW) : 0;
  const hRatio = leftH && rightH ? Math.min(leftH, rightH) / Math.max(leftH, rightH) : 0;

  const perspW = clamp01(wRatio);
  const perspH = clamp01(hRatio);

  return {
    top: clamp01(horiz(topA) * topInside * perspW),
    right: clamp01(vert(rightA) * rightInside * perspH),
    bottom: clamp01(horiz(botA) * bottomInside * perspW),
    left: clamp01(vert(leftA) * leftInside * perspH),
  };
}

export default detectDocument;

// // FILE: src/utils/documentDetection.js

// /**
//  * Document Detection Utilities (Pure JS)
//  * - Edge pipeline (blur + sobel + NMS + hysteresis)
//  * - Contour tracing (fixed dx/dy)
//  * - Quad extraction (extremes)
//  * - Scoring + edge alignments
//  */

// const DETECTION_CONFIG = {
//   cannyLow: 20,
//   cannyHigh: 60,
//   minAreaRatio: 0.08,
//   maxAreaRatio: 0.95,
//   approxEpsilon: 0.03,
//   cornerMargin: 0.02,
// };

// function isDebugEnabled() {
//   try {
//     return typeof window !== "undefined" && localStorage.getItem("scannerDebug") === "1";
//   } catch {
//     return false;
//   }
// }

// function clamp01(v) {
//   return Math.max(0, Math.min(1, v));
// }

// function toGrayscale(imageData) {
//   const { data, width, height } = imageData;
//   const gray = new Uint8Array(width * height);
//   for (let i = 0; i < data.length; i += 4) {
//     gray[i / 4] = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
//   }
//   return gray;
// }

// function gaussianBlur(gray, width, height) {
//   const kernel = [
//     1, 4, 6, 4, 1, 4, 16, 24, 16, 4, 6, 24, 36, 24, 6, 4, 16, 24, 16, 4, 1, 4, 6, 4, 1,
//   ];
//   const kernelSum = 256;
//   const result = new Uint8Array(width * height);

//   for (let y = 2; y < height - 2; y++) {
//     for (let x = 2; x < width - 2; x++) {
//       let sum = 0;
//       let ki = 0;
//       for (let ky = -2; ky <= 2; ky++) {
//         for (let kx = -2; kx <= 2; kx++) {
//           sum += gray[(y + ky) * width + (x + kx)] * kernel[ki++];
//         }
//       }
//       result[y * width + x] = Math.round(sum / kernelSum);
//     }
//   }

//   // simple border copy
//   for (let x = 0; x < width; x++) {
//     result[x] = gray[x];
//     result[(height - 1) * width + x] = gray[(height - 1) * width + x];
//   }
//   for (let y = 0; y < height; y++) {
//     result[y * width] = gray[y * width];
//     result[y * width + (width - 1)] = gray[y * width + (width - 1)];
//   }

//   return result;
// }

// function sobelEdges(gray, width, height) {
//   const magnitude = new Uint8Array(width * height);
//   const direction = new Float32Array(width * height);

//   for (let y = 1; y < height - 1; y++) {
//     for (let x = 1; x < width - 1; x++) {
//       const idx = y * width + x;

//       const gx =
//         -gray[(y - 1) * width + (x - 1)] +
//         gray[(y - 1) * width + (x + 1)] -
//         2 * gray[y * width + (x - 1)] +
//         2 * gray[y * width + (x + 1)] -
//         gray[(y + 1) * width + (x - 1)] +
//         gray[(y + 1) * width + (x + 1)];

//       const gy =
//         -gray[(y - 1) * width + (x - 1)] -
//         2 * gray[(y - 1) * width + x] -
//         gray[(y - 1) * width + (x + 1)] +
//         gray[(y + 1) * width + (x - 1)] +
//         2 * gray[(y + 1) * width + x] +
//         gray[(y + 1) * width + (x + 1)];

//       magnitude[idx] = Math.min(255, Math.sqrt(gx * gx + gy * gy));
//       direction[idx] = Math.atan2(gy, gx);
//     }
//   }

//   return { magnitude, direction };
// }

// function nonMaxSuppression(magnitude, direction, width, height) {
//   const result = new Uint8Array(width * height);

//   for (let y = 1; y < height - 1; y++) {
//     for (let x = 1; x < width - 1; x++) {
//       const idx = y * width + x;
//       const angle = ((direction[idx] * 180) / Math.PI + 180) % 180;
//       const mag = magnitude[idx];

//       let neighbor1, neighbor2;

//       if (angle < 22.5 || angle >= 157.5) {
//         neighbor1 = magnitude[y * width + (x - 1)];
//         neighbor2 = magnitude[y * width + (x + 1)];
//       } else if (angle < 67.5) {
//         neighbor1 = magnitude[(y - 1) * width + (x + 1)];
//         neighbor2 = magnitude[(y + 1) * width + (x - 1)];
//       } else if (angle < 112.5) {
//         neighbor1 = magnitude[(y - 1) * width + x];
//         neighbor2 = magnitude[(y + 1) * width + x];
//       } else {
//         neighbor1 = magnitude[(y - 1) * width + (x - 1)];
//         neighbor2 = magnitude[(y + 1) * width + (x + 1)];
//       }

//       result[idx] = mag >= neighbor1 && mag >= neighbor2 ? mag : 0;
//     }
//   }

//   return result;
// }

// function hysteresisThreshold(edges, width, height, low, high) {
//   const result = new Uint8Array(width * height);
//   const strong = 255;
//   const weak = 75;

//   for (let i = 0; i < edges.length; i++) {
//     if (edges[i] >= high) result[i] = strong;
//     else if (edges[i] >= low) result[i] = weak;
//   }

//   // 2 passes only
//   for (let pass = 0; pass < 2; pass++) {
//     for (let y = 1; y < height - 1; y++) {
//       for (let x = 1; x < width - 1; x++) {
//         const idx = y * width + x;
//         if (result[idx] !== weak) continue;

//         const hasStrongNeighbor =
//           result[(y - 1) * width + (x - 1)] === strong ||
//           result[(y - 1) * width + x] === strong ||
//           result[(y - 1) * width + (x + 1)] === strong ||
//           result[y * width + (x - 1)] === strong ||
//           result[y * width + (x + 1)] === strong ||
//           result[(y + 1) * width + (x - 1)] === strong ||
//           result[(y + 1) * width + x] === strong ||
//           result[(y + 1) * width + (x + 1)] === strong;

//         if (hasStrongNeighbor) result[idx] = strong;
//       }
//     }
//   }

//   for (let i = 0; i < result.length; i++) {
//     if (result[i] !== strong) result[i] = 0;
//   }

//   return result;
// }

// function findContours(edges, width, height) {
//   const visited = new Uint8Array(width * height);
//   const contours = [];

//   // (dx, dy)  IMPORTANT (fix): nx=cx+dx, ny=cy+dy
//   const directions = [
//     [1, 0],
//     [1, 1],
//     [0, 1],
//     [-1, 1],
//     [-1, 0],
//     [-1, -1],
//     [0, -1],
//     [1, -1],
//   ];

//   for (let y = 1; y < height - 1; y++) {
//     for (let x = 1; x < width - 1; x++) {
//       const idx = y * width + x;
//       if (edges[idx] !== 255 || visited[idx]) continue;

//       const contour = [];
//       let cx = x;
//       let cy = y;
//       const startX = x;
//       const startY = y;
//       let dir = 0;

//       let steps = 0;
//       const maxSteps = width * height;

//       while (steps < maxSteps) {
//         contour.push({ x: cx, y: cy });
//         visited[cy * width + cx] = 1;

//         let found = false;
//         for (let i = 0; i < 8; i++) {
//           const newDir = (dir + i) % 8;
//           const [dx, dy] = directions[newDir];
//           const nx = cx + dx;
//           const ny = cy + dy;
//           if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

//           if (edges[ny * width + nx] === 255) {
//             cx = nx;
//             cy = ny;
//             dir = (newDir + 5) % 8;
//             found = true;
//             break;
//           }
//         }

//         if (!found) break;
//         steps++;
//         if (cx === startX && cy === startY) break;
//       }

//       if (contour.length > 25) contours.push(contour);
//     }
//   }

//   return contours;
// }

// function contourArea(contour) {
//   let area = 0;
//   const n = contour.length;
//   for (let i = 0; i < n; i++) {
//     const j = (i + 1) % n;
//     area += contour[i].x * contour[j].y;
//     area -= contour[j].x * contour[i].y;
//   }
//   return Math.abs(area) / 2;
// }

// function contourPerimeter(contour) {
//   let perimeter = 0;
//   for (let i = 0; i < contour.length; i++) {
//     const j = (i + 1) % contour.length;
//     const dx = contour[j].x - contour[i].x;
//     const dy = contour[j].y - contour[i].y;
//     perimeter += Math.sqrt(dx * dx + dy * dy);
//   }
//   return perimeter;
// }

// function pointToLineDistance(point, lineStart, lineEnd) {
//   const dx = lineEnd.x - lineStart.x;
//   const dy = lineEnd.y - lineStart.y;
//   const len = Math.sqrt(dx * dx + dy * dy);
//   if (len === 0) return Math.hypot(point.x - lineStart.x, point.y - lineStart.y);

//   const t = Math.max(
//     0,
//     Math.min(1, ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (len * len))
//   );
//   const projX = lineStart.x + t * dx;
//   const projY = lineStart.y + t * dy;
//   return Math.hypot(point.x - projX, point.y - projY);
// }

// function approxPolyDP(contour, epsilon) {
//   if (!contour || contour.length < 3) return contour || [];

//   let maxDist = 0;
//   let maxIdx = 0;
//   const start = contour[0];
//   const end = contour[contour.length - 1];

//   for (let i = 1; i < contour.length - 1; i++) {
//     const dist = pointToLineDistance(contour[i], start, end);
//     if (dist > maxDist) {
//       maxDist = dist;
//       maxIdx = i;
//     }
//   }

//   if (maxDist > epsilon) {
//     const left = approxPolyDP(contour.slice(0, maxIdx + 1), epsilon);
//     const right = approxPolyDP(contour.slice(maxIdx), epsilon);
//     return left.slice(0, -1).concat(right);
//   }

//   return [start, end];
// }

// function isConvex(polygon) {
//   if (!polygon || polygon.length < 4) return true;
//   let sign = 0;
//   for (let i = 0; i < polygon.length; i++) {
//     const p0 = polygon[i];
//     const p1 = polygon[(i + 1) % polygon.length];
//     const p2 = polygon[(i + 2) % polygon.length];
//     const cross = (p1.x - p0.x) * (p2.y - p1.y) - (p1.y - p0.y) * (p2.x - p1.x);
//     if (cross !== 0) {
//       const s = cross > 0 ? 1 : -1;
//       if (sign === 0) sign = s;
//       else if (s !== sign) return false;
//     }
//   }
//   return true;
// }

// function uniq4(points) {
//   const out = [];
//   const seen = new Set();
//   for (const p of points) {
//     const k = `${p.x}|${p.y}`;
//     if (!seen.has(k)) {
//       seen.add(k);
//       out.push(p);
//     }
//   }
//   return out;
// }

// function quadFromExtremes(points) {
//   if (!points || points.length < 4) return null;
//   const tl = points.reduce((a, p) => (p.x + p.y < a.x + a.y ? p : a), points[0]);
//   const br = points.reduce((a, p) => (p.x + p.y > a.x + a.y ? p : a), points[0]);
//   const tr = points.reduce((a, p) => (p.x - p.y > a.x - a.y ? p : a), points[0]);
//   const bl = points.reduce((a, p) => (p.x - p.y < a.x - a.y ? p : a), points[0]);
//   const quad = uniq4([tl, tr, br, bl]);
//   if (quad.length !== 4) return null;
//   return quad;
// }

// function orderCorners(corners) {
//   const pts = corners.slice(0, 4);
//   const tl = pts.reduce((a, p) => (p.x + p.y < a.x + a.y ? p : a), pts[0]);
//   const br = pts.reduce((a, p) => (p.x + p.y > a.x + a.y ? p : a), pts[0]);
//   const tr = pts.reduce((a, p) => (p.x - p.y > a.x - a.y ? p : a), pts[0]);
//   const bl = pts.reduce((a, p) => (p.x - p.y < a.x - a.y ? p : a), pts[0]);
//   return [tl, tr, br, bl];
// }

// function edgeDensityDebug(edges) {
//   // sample to keep CPU low
//   let strong = 0;
//   let total = 0;
//   for (let i = 0; i < edges.length; i += 4) {
//     total++;
//     if (edges[i] === 255) strong++;
//   }
//   return total ? strong / total : 0;
// }

// /**
//  * detectDocument(imageData, scanArea)
//  * returns { detected, normalized, corners, confidence, debug? }
//  */
// export function detectDocument(imageData, scanArea = null) {
//   const dbg = isDebugEnabled();
//   const { width, height } = imageData;

//   const gray = toGrayscale(imageData);
//   const blurred = gaussianBlur(gray, width, height);
//   const { magnitude, direction } = sobelEdges(blurred, width, height);
//   const suppressed = nonMaxSuppression(magnitude, direction, width, height);
//   const edges = hysteresisThreshold(
//     suppressed,
//     width,
//     height,
//     DETECTION_CONFIG.cannyLow,
//     DETECTION_CONFIG.cannyHigh
//   );

//   const contours = findContours(edges, width, height);
//   const imageArea = width * height;

//   let bestQuad = null;
//   let bestScore = 0;
//   let bestAreaRatio = 0;

//   for (const contour of contours) {
//     const area = contourArea(contour);
//     const areaRatio = area / imageArea;
//     if (areaRatio < DETECTION_CONFIG.minAreaRatio || areaRatio > DETECTION_CONFIG.maxAreaRatio)
//       continue;

//     const perimeter = contourPerimeter(contour);
//     const epsilon = DETECTION_CONFIG.approxEpsilon * perimeter;

//     let quad = null;

//     const approx = approxPolyDP(contour, epsilon);
//     if (approx && approx.length >= 4) {
//       const ext = quadFromExtremes(approx);
//       if (ext && ext.length === 4 && isConvex(ext)) quad = ext;
//     }
//     if (!quad) {
//       const ext = quadFromExtremes(contour);
//       if (ext && ext.length === 4 && isConvex(ext)) quad = ext;
//     }
//     if (!quad) continue;

//     const score = areaRatio * 0.8 + 0.2;
//     if (score > bestScore) {
//       bestScore = score;
//       bestQuad = quad;
//       bestAreaRatio = areaRatio;
//     }
//   }

//   if (!bestQuad) {
//     return {
//       detected: false,
//       corners: null,
//       confidence: 0,
//       normalized: null,
//       ...(dbg
//         ? {
//             debug: {
//               w: width,
//               h: height,
//               contoursCount: contours.length,
//               edgeDensity: edgeDensityDebug(edges),
//               bestAreaRatio: 0,
//             },
//           }
//         : {}),
//     };
//   }

//   const ordered = orderCorners(bestQuad);
//   const normalized = ordered.map((p) => ({ x: p.x / width, y: p.y / height }));

//   let insideScanArea = true;
//   if (scanArea) {
//     const margin = DETECTION_CONFIG.cornerMargin;
//     for (const c of normalized) {
//       if (
//         c.x < scanArea.x - margin ||
//         c.x > scanArea.x + scanArea.width + margin ||
//         c.y < scanArea.y - margin ||
//         c.y > scanArea.y + scanArea.height + margin
//       ) {
//         insideScanArea = false;
//         break;
//       }
//     }
//   }

//   return {
//     detected: true,
//     corners: ordered,
//     normalized,
//     confidence: bestScore,
//     insideScanArea,
//     ...(dbg
//       ? {
//           debug: {
//             w: width,
//             h: height,
//             contoursCount: contours.length,
//             edgeDensity: edgeDensityDebug(edges),
//             bestAreaRatio,
//           },
//         }
//       : {}),
//   };
// }

// export function calculateScores(detection, scanArea, prevCorners = null) {
//   if (!detection.detected || !detection.normalized) {
//     return {
//       insideScore: 0,
//       rotationScore: 0,
//       perspectiveScore: 0,
//       stabilityScore: 0,
//       totalScore: 0,
//       captureEnabled: false,
//       autoCaptureReady: false,
//       hint: "Coloca el documento dentro del recuadro",
//       sizeRatio: 0,
//     };
//   }

//   const corners = detection.normalized;

//   // 1) Inside + size
//   let insideScore = 1;
//   const margin = 0.02;

//   for (const corner of corners) {
//     if (
//       corner.x < scanArea.x - margin ||
//       corner.x > scanArea.x + scanArea.width + margin ||
//       corner.y < scanArea.y - margin ||
//       corner.y > scanArea.y + scanArea.height + margin
//     ) {
//       insideScore *= 0.5;
//     }
//   }

//   const docWidth =
//     (Math.abs(corners[1].x - corners[0].x) + Math.abs(corners[2].x - corners[3].x)) / 2;
//   const docHeight =
//     (Math.abs(corners[3].y - corners[0].y) + Math.abs(corners[2].y - corners[1].y)) / 2;

//   const sizeRatio = (docWidth * docHeight) / (scanArea.width * scanArea.height);
//   if (sizeRatio < 0.5) insideScore *= 0.5 + sizeRatio;
//   else if (sizeRatio > 1.2) insideScore *= Math.max(0.3, 2 - sizeRatio);

//   // 2) Rotation
//   const topAngle = Math.atan2(corners[1].y - corners[0].y, corners[1].x - corners[0].x);
//   const bottomAngle = Math.atan2(corners[2].y - corners[3].y, corners[2].x - corners[3].x);
//   const leftAngle = Math.atan2(corners[3].y - corners[0].y, corners[3].x - corners[0].x);
//   const rightAngle = Math.atan2(corners[2].y - corners[1].y, corners[2].x - corners[1].x);

//   const horizontalDeviation = (Math.abs(topAngle) + Math.abs(bottomAngle)) / 2;
//   const verticalDeviation =
//     (Math.abs(leftAngle - Math.PI / 2) + Math.abs(rightAngle - Math.PI / 2)) / 2;

//   const maxRotation = Math.PI / 12; // 15°
//   const rotationScore = Math.max(
//     0,
//     1 - (horizontalDeviation + verticalDeviation) / (2 * maxRotation)
//   );

//   // 3) Perspective
//   const topWidth = Math.hypot(corners[1].x - corners[0].x, corners[1].y - corners[0].y);
//   const bottomWidth = Math.hypot(corners[2].x - corners[3].x, corners[2].y - corners[3].y);
//   const leftHeight = Math.hypot(corners[3].x - corners[0].x, corners[3].y - corners[0].y);
//   const rightHeight = Math.hypot(corners[2].x - corners[1].x, corners[2].y - corners[1].y);

//   const widthRatio = Math.min(topWidth, bottomWidth) / Math.max(topWidth, bottomWidth);
//   const heightRatio = Math.min(leftHeight, rightHeight) / Math.max(leftHeight, rightHeight);
//   const perspectiveScore = widthRatio * heightRatio;

//   // 4) Stability
//   let stabilityScore = 1;
//   if (prevCorners && prevCorners.length === 4) {
//     let totalMovement = 0;
//     for (let i = 0; i < 4; i++) {
//       totalMovement += Math.hypot(corners[i].x - prevCorners[i].x, corners[i].y - prevCorners[i].y);
//     }
//     const avgMovement = totalMovement / 4;
//     const maxMovement = 0.03;
//     stabilityScore = Math.max(0, 1 - avgMovement / maxMovement);
//   }

//   const totalScore =
//     0.4 * insideScore + 0.25 * rotationScore + 0.25 * perspectiveScore + 0.1 * stabilityScore;

//   const captureEnabled = totalScore >= 0.85;
//   const autoCaptureReady = totalScore >= 0.9;

//   const worst = [
//     {
//       score: insideScore,
//       hint:
//         sizeRatio < 0.5
//           ? "Acércate al documento"
//           : sizeRatio > 1.2
//           ? "Aléjate del documento"
//           : "Coloca el documento dentro del recuadro",
//     },
//     { score: rotationScore, hint: "Endereza el documento" },
//     { score: perspectiveScore, hint: "Alinea de frente el documento" },
//     { score: stabilityScore, hint: "Mantén la cámara quieta" },
//   ].reduce((a, b) => (b.score < a.score ? b : a));

//   const hint = worst.score < 0.7 ? worst.hint : "";

//   return {
//     insideScore,
//     rotationScore,
//     perspectiveScore,
//     stabilityScore,
//     totalScore,
//     captureEnabled,
//     autoCaptureReady,
//     hint,
//     sizeRatio,
//   };
// }

// /**
//  * Edge alignments for UI
//  * IMPORTANT: This now reflects angle/rectangularity instead of "touching guide border"
//  */
// export function getEdgeAlignments(detection, scanArea) {
//   if (!detection.detected || !detection.normalized) {
//     return { top: 0, right: 0, bottom: 0, left: 0 };
//   }

//   const c = detection.normalized;

//   // angles
//   const topA = Math.atan2(c[1].y - c[0].y, c[1].x - c[0].x);
//   const bottomA = Math.atan2(c[2].y - c[3].y, c[2].x - c[3].x);
//   const leftA = Math.atan2(c[3].y - c[0].y, c[3].x - c[0].x);
//   const rightA = Math.atan2(c[2].y - c[1].y, c[2].x - c[1].x);

//   const maxRot = Math.PI / 12; // 15°

//   const horizScore = (a) =>
//     clamp01(1 - Math.min(Math.abs(a), Math.abs(Math.PI - Math.abs(a))) / maxRot);
//   const vertScore = (a) => clamp01(1 - Math.abs(a - Math.PI / 2) / maxRot);

//   // inside endpoints
//   const insidePt = (p) =>
//     p.x >= scanArea.x &&
//     p.x <= scanArea.x + scanArea.width &&
//     p.y >= scanArea.y &&
//     p.y <= scanArea.y + scanArea.height;

//   const topInside = insidePt(c[0]) && insidePt(c[1]) ? 1 : 0.35;
//   const rightInside = insidePt(c[1]) && insidePt(c[2]) ? 1 : 0.35;
//   const bottomInside = insidePt(c[2]) && insidePt(c[3]) ? 1 : 0.35;
//   const leftInside = insidePt(c[3]) && insidePt(c[0]) ? 1 : 0.35;

//   // perspective symmetry (length ratios)
//   const topW = Math.hypot(c[1].x - c[0].x, c[1].y - c[0].y);
//   const bottomW = Math.hypot(c[2].x - c[3].x, c[2].y - c[3].y);
//   const leftH = Math.hypot(c[3].x - c[0].x, c[3].y - c[0].y);
//   const rightH = Math.hypot(c[2].x - c[1].x, c[2].y - c[1].y);

//   const wRatio = topW && bottomW ? Math.min(topW, bottomW) / Math.max(topW, bottomW) : 0;
//   const hRatio = leftH && rightH ? Math.min(leftH, rightH) / Math.max(leftH, rightH) : 0;

//   const perspW = clamp01(wRatio);
//   const perspH = clamp01(hRatio);

//   const top = clamp01(horizScore(topA) * topInside * perspW);
//   const bottom = clamp01(horizScore(bottomA) * bottomInside * perspW);
//   const left = clamp01(vertScore(leftA) * leftInside * perspH);
//   const right = clamp01(vertScore(rightA) * rightInside * perspH);

//   return { top, right, bottom, left };
// }

// export default detectDocument;

// // /**
// //  * Document Detection Utilities
// //  * Real-time document detection with corner extraction using edge detection
// //  * No external dependencies - pure JS implementation
// //  */

// // // Detection configuration
// // const DETECTION_CONFIG = {
// //   cannyLow: 20,
// //   cannyHigh: 60,
// //   minAreaRatio: 0.08,
// //   maxAreaRatio: 0.95,
// //   approxEpsilon: 0.03,
// //   cornerMargin: 0.02,
// // };

// // /**
// //  * Converts image data to grayscale
// //  */
// // function toGrayscale(imageData) {
// //   const { data, width, height } = imageData;
// //   const gray = new Uint8Array(width * height);
// //   for (let i = 0; i < data.length; i += 4) {
// //     gray[i / 4] = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
// //   }
// //   return gray;
// // }

// // /**
// //  * Apply Gaussian blur for noise reduction
// //  */
// // function gaussianBlur(gray, width, height) {
// //   const kernel = [
// //     1, 4, 6, 4, 1, 4, 16, 24, 16, 4, 6, 24, 36, 24, 6, 4, 16, 24, 16, 4, 1, 4, 6, 4, 1,
// //   ];
// //   const kernelSum = 256;
// //   const result = new Uint8Array(width * height);

// //   for (let y = 2; y < height - 2; y++) {
// //     for (let x = 2; x < width - 2; x++) {
// //       let sum = 0;
// //       let ki = 0;
// //       for (let ky = -2; ky <= 2; ky++) {
// //         for (let kx = -2; kx <= 2; kx++) {
// //           sum += gray[(y + ky) * width + (x + kx)] * kernel[ki++];
// //         }
// //       }
// //       result[y * width + x] = Math.round(sum / kernelSum);
// //     }
// //   }
// //   for (let x = 0; x < width; x++) {
// //     result[x] = gray[x];
// //     result[(height - 1) * width + x] = gray[(height - 1) * width + x];
// //   }
// //   for (let y = 0; y < height; y++) {
// //     result[y * width] = gray[y * width];
// //     result[y * width + (width - 1)] = gray[y * width + (width - 1)];
// //   }

// //   return result;
// // }

// // /**
// //  * Sobel edge detection
// //  */
// // function sobelEdges(gray, width, height) {
// //   const magnitude = new Uint8Array(width * height);
// //   const direction = new Float32Array(width * height);

// //   for (let y = 1; y < height - 1; y++) {
// //     for (let x = 1; x < width - 1; x++) {
// //       const idx = y * width + x;

// //       const gx =
// //         -gray[(y - 1) * width + (x - 1)] +
// //         gray[(y - 1) * width + (x + 1)] -
// //         2 * gray[y * width + (x - 1)] +
// //         2 * gray[y * width + (x + 1)] -
// //         gray[(y + 1) * width + (x - 1)] +
// //         gray[(y + 1) * width + (x + 1)];

// //       const gy =
// //         -gray[(y - 1) * width + (x - 1)] -
// //         2 * gray[(y - 1) * width + x] -
// //         gray[(y - 1) * width + (x + 1)] +
// //         gray[(y + 1) * width + (x - 1)] +
// //         2 * gray[(y + 1) * width + x] +
// //         gray[(y + 1) * width + (x + 1)];

// //       magnitude[idx] = Math.min(255, Math.sqrt(gx * gx + gy * gy));
// //       direction[idx] = Math.atan2(gy, gx);
// //     }
// //   }

// //   return { magnitude, direction };
// // }

// // /**
// //  * Non-maximum suppression for edge thinning
// //  */
// // function nonMaxSuppression(magnitude, direction, width, height) {
// //   const result = new Uint8Array(width * height);

// //   for (let y = 1; y < height - 1; y++) {
// //     for (let x = 1; x < width - 1; x++) {
// //       const idx = y * width + x;
// //       const angle = ((direction[idx] * 180) / Math.PI + 180) % 180;
// //       const mag = magnitude[idx];

// //       let neighbor1, neighbor2;

// //       if (angle < 22.5 || angle >= 157.5) {
// //         neighbor1 = magnitude[y * width + (x - 1)];
// //         neighbor2 = magnitude[y * width + (x + 1)];
// //       } else if (angle < 67.5) {
// //         neighbor1 = magnitude[(y - 1) * width + (x + 1)];
// //         neighbor2 = magnitude[(y + 1) * width + (x - 1)];
// //       } else if (angle < 112.5) {
// //         neighbor1 = magnitude[(y - 1) * width + x];
// //         neighbor2 = magnitude[(y + 1) * width + x];
// //       } else {
// //         neighbor1 = magnitude[(y - 1) * width + (x - 1)];
// //         neighbor2 = magnitude[(y + 1) * width + (x + 1)];
// //       }

// //       result[idx] = mag >= neighbor1 && mag >= neighbor2 ? mag : 0;
// //     }
// //   }
// //   return result;
// // }

// // /**
// //  * Double threshold and edge tracking by hysteresis
// //  */
// // function hysteresisThreshold(edges, width, height, low, high) {
// //   const result = new Uint8Array(width * height);
// //   const strong = 255;
// //   const weak = 75;

// //   for (let i = 0; i < edges.length; i++) {
// //     if (edges[i] >= high) result[i] = strong;
// //     else if (edges[i] >= low) result[i] = weak;
// //   }

// //   // 2 passes only (keeps CPU sane and prevents stalls)
// //   for (let pass = 0; pass < 2; pass++) {
// //     for (let y = 1; y < height - 1; y++) {
// //       for (let x = 1; x < width - 1; x++) {
// //         const idx = y * width + x;
// //         if (result[idx] !== weak) continue;

// //         const hasStrongNeighbor =
// //           result[(y - 1) * width + (x - 1)] === strong ||
// //           result[(y - 1) * width + x] === strong ||
// //           result[(y - 1) * width + (x + 1)] === strong ||
// //           result[y * width + (x - 1)] === strong ||
// //           result[y * width + (x + 1)] === strong ||
// //           result[(y + 1) * width + (x - 1)] === strong ||
// //           result[(y + 1) * width + x] === strong ||
// //           result[(y + 1) * width + (x + 1)] === strong;

// //         if (hasStrongNeighbor) result[idx] = strong;
// //       }
// //     }
// //   }

// //   for (let i = 0; i < result.length; i++) {
// //     if (result[i] !== strong) result[i] = 0;
// //   }

// //   return result;
// // }

// // /**
// //  * Find contours in edge image using border following
// //  */
// // function findContours(edges, width, height) {
// //   const visited = new Uint8Array(width * height);
// //   const contours = [];

// //   // (dx, dy)
// //   const directions = [
// //     [1, 0],
// //     [1, 1],
// //     [0, 1],
// //     [-1, 1],
// //     [-1, 0],
// //     [-1, -1],
// //     [0, -1],
// //     [1, -1],
// //   ];

// //   for (let y = 1; y < height - 1; y++) {
// //     for (let x = 1; x < width - 1; x++) {
// //       const idx = y * width + x;
// //       if (edges[idx] !== 255 || visited[idx]) continue;

// //       const contour = [];
// //       let cx = x;
// //       let cy = y;
// //       const startX = x;
// //       const startY = y;
// //       let dir = 0;

// //       let steps = 0;
// //       const maxSteps = width * height;

// //       while (steps < maxSteps) {
// //         contour.push({ x: cx, y: cy });
// //         visited[cy * width + cx] = 1;

// //         let found = false;
// //         for (let i = 0; i < 8; i++) {
// //           const newDir = (dir + i) % 8;
// //           const [dx, dy] = directions[newDir];
// //           const nx = cx + dx;
// //           const ny = cy + dy;
// //           if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
// //           if (edges[ny * width + nx] === 255) {
// //             cx = nx;
// //             cy = ny;
// //             dir = (newDir + 5) % 8;
// //             found = true;
// //             break;
// //           }
// //         }

// //         if (!found) break;
// //         steps++;
// //         if (cx === startX && cy === startY) break;
// //       }

// //       if (contour.length > 25) contours.push(contour);
// //     }
// //   }

// //   return contours;
// // }

// // /**
// //  * Calculate contour area using shoelace formula
// //  */
// // function contourArea(contour) {
// //   let area = 0;
// //   const n = contour.length;
// //   for (let i = 0; i < n; i++) {
// //     const j = (i + 1) % n;
// //     area += contour[i].x * contour[j].y;
// //     area -= contour[j].x * contour[i].y;
// //   }
// //   return Math.abs(area) / 2;
// // }

// // /**
// //  * Calculate contour perimeter
// //  */
// // function contourPerimeter(contour) {
// //   let perimeter = 0;
// //   for (let i = 0; i < contour.length; i++) {
// //     const j = (i + 1) % contour.length;
// //     const dx = contour[j].x - contour[i].x;
// //     const dy = contour[j].y - contour[i].y;
// //     perimeter += Math.sqrt(dx * dx + dy * dy);
// //   }
// //   return perimeter;
// // }

// // /**
// //  * Douglas-Peucker algorithm for polygon approximation
// //  */
// // function approxPolyDP(contour, epsilon) {
// //   if (!contour || contour.length < 3) return contour || [];

// //   let maxDist = 0;
// //   let maxIdx = 0;
// //   const start = contour[0];
// //   const end = contour[contour.length - 1];

// //   for (let i = 1; i < contour.length - 1; i++) {
// //     const dist = pointToLineDistance(contour[i], start, end);
// //     if (dist > maxDist) {
// //       maxDist = dist;
// //       maxIdx = i;
// //     }
// //   }

// //   if (maxDist > epsilon) {
// //     const left = approxPolyDP(contour.slice(0, maxIdx + 1), epsilon);
// //     const right = approxPolyDP(contour.slice(maxIdx), epsilon);
// //     return left.slice(0, -1).concat(right);
// //   }

// //   return [start, end];
// // }

// // function pointToLineDistance(point, lineStart, lineEnd) {
// //   const dx = lineEnd.x - lineStart.x;
// //   const dy = lineEnd.y - lineStart.y;
// //   const len = Math.sqrt(dx * dx + dy * dy);
// //   if (len === 0) return Math.hypot(point.x - lineStart.x, point.y - lineStart.y);

// //   const t = Math.max(
// //     0,
// //     Math.min(1, ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (len * len))
// //   );
// //   const projX = lineStart.x + t * dx;
// //   const projY = lineStart.y + t * dy;
// //   return Math.hypot(point.x - projX, point.y - projY);
// // }

// // /**
// //  * Check if polygon is convex
// //  */
// // function isConvex(polygon) {
// //   if (!polygon || polygon.length < 4) return true;
// //   let sign = 0;
// //   for (let i = 0; i < polygon.length; i++) {
// //     const p0 = polygon[i];
// //     const p1 = polygon[(i + 1) % polygon.length];
// //     const p2 = polygon[(i + 2) % polygon.length];
// //     const cross = (p1.x - p0.x) * (p2.y - p1.y) - (p1.y - p0.y) * (p2.x - p1.x);
// //     if (cross !== 0) {
// //       const s = cross > 0 ? 1 : -1;
// //       if (sign === 0) sign = s;
// //       else if (s !== sign) return false;
// //     }
// //   }
// //   return true;
// // }

// // function uniq4(points) {
// //   const out = [];
// //   const seen = new Set();
// //   for (const p of points) {
// //     const k = `${p.x}|${p.y}`;
// //     if (!seen.has(k)) {
// //       seen.add(k);
// //       out.push(p);
// //     }
// //   }
// //   return out;
// // }

// // /**
// //  * Order corners: top-left, top-right, bottom-right, bottom-left
// //  */
// // function orderCorners(corners) {
// //   const pts = corners.slice(0, 4);

// //   const tl = pts.reduce((a, p) => (p.x + p.y < a.x + a.y ? p : a), pts[0]);
// //   const br = pts.reduce((a, p) => (p.x + p.y > a.x + a.y ? p : a), pts[0]);
// //   const tr = pts.reduce((a, p) => (p.x - p.y > a.x - a.y ? p : a), pts[0]);
// //   const bl = pts.reduce((a, p) => (p.x - p.y < a.x - a.y ? p : a), pts[0]);

// //   return [tl, tr, br, bl];
// // }

// // function quadFromExtremes(points) {
// //   if (!points || points.length < 4) return null;
// //   const tl = points.reduce((a, p) => (p.x + p.y < a.x + a.y ? p : a), points[0]);
// //   const br = points.reduce((a, p) => (p.x + p.y > a.x + a.y ? p : a), points[0]);
// //   const tr = points.reduce((a, p) => (p.x - p.y > a.x - a.y ? p : a), points[0]);
// //   const bl = points.reduce((a, p) => (p.x - p.y < a.x - a.y ? p : a), points[0]);
// //   const quad = uniq4([tl, tr, br, bl]);
// //   if (quad.length !== 4) return null;
// //   return quad;
// // }

// // /**
// //  * Main document detection function
// //  * @param {ImageData} imageData - Image data from canvas
// //  * @param {Object} scanArea - Scan area bounds {x, y, width, height} in normalized coords
// //  * @returns {Object} Detection result with corners and confidence
// //  */
// // export function detectDocument(imageData, scanArea = null) {
// //   const { width, height } = imageData;

// //   const gray = toGrayscale(imageData);
// //   const blurred = gaussianBlur(gray, width, height);
// //   const { magnitude, direction } = sobelEdges(blurred, width, height);
// //   const suppressed = nonMaxSuppression(magnitude, direction, width, height);
// //   const edges = hysteresisThreshold(
// //     suppressed,
// //     width,
// //     height,
// //     DETECTION_CONFIG.cannyLow,
// //     DETECTION_CONFIG.cannyHigh
// //   );

// //   const contours = findContours(edges, width, height);
// //   const imageArea = width * height;

// //   let bestQuad = null;
// //   let bestScore = 0;

// //   for (const contour of contours) {
// //     const area = contourArea(contour);
// //     const areaRatio = area / imageArea;
// //     if (areaRatio < DETECTION_CONFIG.minAreaRatio || areaRatio > DETECTION_CONFIG.maxAreaRatio) {
// //       continue;
// //     }

// //     const perimeter = contourPerimeter(contour);
// //     const epsilon = DETECTION_CONFIG.approxEpsilon * perimeter;

// //     let quad = null;

// //     const approx = approxPolyDP(contour, epsilon);
// //     if (approx && approx.length >= 4) {
// //       const ext = quadFromExtremes(approx);
// //       if (ext && ext.length === 4 && isConvex(ext)) quad = ext;
// //     }

// //     if (!quad) {
// //       const ext = quadFromExtremes(contour);
// //       if (ext && ext.length === 4 && isConvex(ext)) quad = ext;
// //     }

// //     if (!quad) continue;

// //     const score = areaRatio * 0.8 + 0.2;
// //     if (score > bestScore) {
// //       bestScore = score;
// //       bestQuad = quad;
// //     }
// //   }

// //   if (!bestQuad) {
// //     return { detected: false, corners: null, confidence: 0, normalized: null };
// //   }

// //   const ordered = orderCorners(bestQuad);
// //   const normalized = ordered.map((p) => ({ x: p.x / width, y: p.y / height }));

// //   let insideScanArea = true;
// //   if (scanArea) {
// //     const margin = DETECTION_CONFIG.cornerMargin;
// //     for (const c of normalized) {
// //       if (
// //         c.x < scanArea.x - margin ||
// //         c.x > scanArea.x + scanArea.width + margin ||
// //         c.y < scanArea.y - margin ||
// //         c.y > scanArea.y + scanArea.height + margin
// //       ) {
// //         insideScanArea = false;
// //         break;
// //       }
// //     }
// //   }

// //   return {
// //     detected: true,
// //     corners: ordered,
// //     normalized,
// //     confidence: bestScore,
// //     insideScanArea,
// //     area: contourArea(ordered),
// //     imageArea,
// //   };
// // }

// // /**
// //  * Calculate scoring metrics from detected corners
// //  * @param {Object} detection - Detection result from detectDocument
// //  * @param {Object} scanArea - Guide rectangle bounds
// //  * @param {Array} prevCorners - Previous frame corners for stability
// //  * @returns {Object} Scoring metrics
// //  */
// // export function calculateScores(detection, scanArea, prevCorners = null) {
// //   if (!detection.detected || !detection.normalized) {
// //     return {
// //       insideScore: 0,
// //       rotationScore: 0,
// //       perspectiveScore: 0,
// //       stabilityScore: 0,
// //       totalScore: 0,
// //       captureEnabled: false,
// //       autoCaptureReady: false,
// //       hint: "Coloca el documento dentro del recuadro",
// //       sizeRatio: 0,
// //     };
// //   }

// //   const corners = detection.normalized;

// //   // 1) Inside score (corners inside + size)
// //   let insideScore = 1;
// //   const margin = 0.02;

// //   for (const corner of corners) {
// //     if (
// //       corner.x < scanArea.x - margin ||
// //       corner.x > scanArea.x + scanArea.width + margin ||
// //       corner.y < scanArea.y - margin ||
// //       corner.y > scanArea.y + scanArea.height + margin
// //     ) {
// //       insideScore *= 0.5;
// //     }
// //   }

// //   const docWidth =
// //     (Math.abs(corners[1].x - corners[0].x) + Math.abs(corners[2].x - corners[3].x)) / 2;
// //   const docHeight =
// //     (Math.abs(corners[3].y - corners[0].y) + Math.abs(corners[2].y - corners[1].y)) / 2;

// //   const sizeRatio = (docWidth * docHeight) / (scanArea.width * scanArea.height);

// //   if (sizeRatio < 0.5) insideScore *= 0.5 + sizeRatio;
// //   else if (sizeRatio > 1.2) insideScore *= Math.max(0.3, 2 - sizeRatio);

// //   // 2) Rotation score
// //   const topAngle = Math.atan2(corners[1].y - corners[0].y, corners[1].x - corners[0].x);
// //   const bottomAngle = Math.atan2(corners[2].y - corners[3].y, corners[2].x - corners[3].x);
// //   const leftAngle = Math.atan2(corners[3].y - corners[0].y, corners[3].x - corners[0].x);
// //   const rightAngle = Math.atan2(corners[2].y - corners[1].y, corners[2].x - corners[1].x);

// //   const horizontalDeviation = (Math.abs(topAngle) + Math.abs(bottomAngle)) / 2;
// //   const verticalDeviation =
// //     (Math.abs(leftAngle - Math.PI / 2) + Math.abs(rightAngle - Math.PI / 2)) / 2;

// //   const maxRotation = Math.PI / 12; // 15°
// //   const rotationScore = Math.max(
// //     0,
// //     1 - (horizontalDeviation + verticalDeviation) / (2 * maxRotation)
// //   );

// //   // 3) Perspective score
// //   const topWidth = Math.hypot(corners[1].x - corners[0].x, corners[1].y - corners[0].y);
// //   const bottomWidth = Math.hypot(corners[2].x - corners[3].x, corners[2].y - corners[3].y);
// //   const leftHeight = Math.hypot(corners[3].x - corners[0].x, corners[3].y - corners[0].y);
// //   const rightHeight = Math.hypot(corners[2].x - corners[1].x, corners[2].y - corners[1].y);

// //   const widthRatio = Math.min(topWidth, bottomWidth) / Math.max(topWidth, bottomWidth);
// //   const heightRatio = Math.min(leftHeight, rightHeight) / Math.max(leftHeight, rightHeight);
// //   const perspectiveScore = widthRatio * heightRatio;

// //   // 4) Stability score
// //   let stabilityScore = 1;
// //   if (prevCorners && prevCorners.length === 4) {
// //     let totalMovement = 0;
// //     for (let i = 0; i < 4; i++) {
// //       const dx = corners[i].x - prevCorners[i].x;
// //       const dy = corners[i].y - prevCorners[i].y;
// //       totalMovement += Math.hypot(dx, dy);
// //     }
// //     const avgMovement = totalMovement / 4;
// //     const maxMovement = 0.03;
// //     stabilityScore = Math.max(0, 1 - avgMovement / maxMovement);
// //   }

// //   const totalScore =
// //     0.4 * insideScore + 0.25 * rotationScore + 0.25 * perspectiveScore + 0.1 * stabilityScore;

// //   const captureEnabled = totalScore >= 0.85;
// //   const autoCaptureReady = totalScore >= 0.9;

// //   const worst = [
// //     {
// //       score: insideScore,
// //       hint:
// //         sizeRatio < 0.5
// //           ? "Acércate al documento"
// //           : sizeRatio > 1.2
// //           ? "Aléjate del documento"
// //           : "Coloca el documento dentro del recuadro",
// //     },
// //     { score: rotationScore, hint: "Endereza el documento" },
// //     { score: perspectiveScore, hint: "Alinea de frente el documento" },
// //     { score: stabilityScore, hint: "Mantén la cámara quieta" },
// //   ].reduce((a, b) => (b.score < a.score ? b : a));

// //   const hint = worst.score < 0.7 ? worst.hint : "";

// //   return {
// //     insideScore,
// //     rotationScore,
// //     perspectiveScore,
// //     stabilityScore,
// //     totalScore,
// //     captureEnabled,
// //     autoCaptureReady,
// //     hint,
// //     sizeRatio,
// //   };
// // }

// // /**
// //  * Get edge alignment status for UI rendering
// //  * @param {Object} detection - Detection result
// //  * @param {Object} scanArea - Guide rectangle
// //  * @returns {Object} Edge alignment status for each side
// //  */
// // export function getEdgeAlignments(detection, scanArea) {
// //   if (!detection.detected || !detection.normalized) {
// //     return { top: 0, right: 0, bottom: 0, left: 0 };
// //   }

// //   const c = detection.normalized;
// //   const margin = 0.03;

// //   const topAligned =
// //     Math.abs(c[0].y - scanArea.y) < margin && Math.abs(c[1].y - scanArea.y) < margin;
// //   const rightAligned =
// //     Math.abs(c[1].x - (scanArea.x + scanArea.width)) < margin &&
// //     Math.abs(c[2].x - (scanArea.x + scanArea.width)) < margin;
// //   const bottomAligned =
// //     Math.abs(c[2].y - (scanArea.y + scanArea.height)) < margin &&
// //     Math.abs(c[3].y - (scanArea.y + scanArea.height)) < margin;
// //   const leftAligned =
// //     Math.abs(c[0].x - scanArea.x) < margin && Math.abs(c[3].x - scanArea.x) < margin;

// //   return {
// //     top: topAligned ? 1 : 0.3,
// //     right: rightAligned ? 1 : 0.3,
// //     bottom: bottomAligned ? 1 : 0.3,
// //     left: leftAligned ? 1 : 0.3,
// //   };
// // }

// // export default detectDocument;
