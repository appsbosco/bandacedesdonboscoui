/**
 * Document Detection with OpenCV.js
 *
 * Robust document detection using OpenCV's computer vision algorithms.
 *
 * WHY THE PURE JS DETECTOR FAILS:
 * ================================
 * 1. EDGE DETECTION GAPS: Simple Sobel produces broken edges. Documents have
 *    subtle boundaries that need morphological closing to connect.
 *
 * 2. CONTOUR FINDING: Pure JS border-following algorithm is naive. It fails on:
 *    - Complex backgrounds (wood grain, patterns)
 *    - Low contrast edges
 *    - Partial occlusions
 *    OpenCV's findContours uses proper chain approximation and hierarchy.
 *
 * 3. POLYGON APPROXIMATION: JS Douglas-Peucker lacks proper epsilon tuning.
 *    OpenCV's approxPolyDP with 2-4% of perimeter works reliably.
 *
 * 4. NO MORPHOLOGY: JS detector has no dilate/erode/close operations to:
 *    - Fill gaps in edges
 *    - Remove noise
 *    - Connect broken contours
 *
 * 5. AREA FILTERING: JS filters are too strict/loose. OpenCV allows proper
 *    min/max area ratio filtering with contour hierarchy.
 *
 * OPENCV.JS SOLUTION:
 * ===================
 * 1. cvtColor → grayscale
 * 2. GaussianBlur → reduce noise
 * 3. Canny → detect edges with proper thresholds
 * 4. morphologyEx CLOSE → connect broken edges
 * 5. findContours → extract all contours
 * 6. For each contour: approxPolyDP → find quadrilaterals
 * 7. Filter by area, convexity, aspect ratio
 * 8. Order corners: TL, TR, BR, BL
 */

import { isOpenCVReady, getCV } from "./opencvLoader";

// Detection configuration
const DETECTION_CONFIG = {
  // Canny thresholds
  cannyLow: 30,
  cannyHigh: 100,

  // Morphology kernel size
  morphKernelSize: 5,

  // Contour filtering
  minAreaRatio: 0.1, // Min 10% of frame
  maxAreaRatio: 0.95, // Max 95% of frame

  // Polygon approximation epsilon (% of perimeter)
  approxEpsilonPercent: 0.02,

  // Aspect ratio bounds for documents
  minAspectRatio: 0.5,
  maxAspectRatio: 2.5,

  // Corner margin for inside check
  cornerMargin: 0.03,
};

// Debug logging state
let lastDebugLog = 0;
const DEBUG_LOG_INTERVAL = 1000; // 1 second

/**
 * Log debug info (throttled to 1/sec)
 */
function logDebug(category, data) {
  if (typeof localStorage === "undefined" || localStorage.getItem("scannerDebug") !== "1") {
    return;
  }

  const now = Date.now();
  if (now - lastDebugLog < DEBUG_LOG_INTERVAL) {
    return;
  }
  lastDebugLog = now;

  console.log(`[scanner] ${category}`, data);
}

/**
 * Main document detection using OpenCV.js
 *
 * @param {ImageData} imageData - Image data from canvas
 * @param {Object} scanArea - Scan area bounds {x, y, width, height} normalized 0-1
 * @returns {Object} Detection result
 */
export function detectDocumentOpenCV(imageData, scanArea = null) {
  if (!isOpenCVReady()) {
    return createEmptyResult("OpenCV not ready");
  }

  const cv = getCV();
  const { width, height, data } = imageData;

  // Debug info
  const debug = {
    engine: "opencv",
    videoDims: { width, height },
    contoursFound: 0,
    quadsFound: 0,
    bestAreaRatio: 0,
    processingMs: 0,
  };

  const startTime = performance.now();

  let src = null;
  let gray = null;
  let blurred = null;
  let edges = null;
  let closed = null;
  let contours = null;
  let hierarchy = null;
  let kernel = null;

  try {
    // Create Mat from ImageData
    src = cv.matFromImageData(imageData);

    // Convert to grayscale
    gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    // Apply Gaussian blur to reduce noise
    blurred = new cv.Mat();
    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);

    // Canny edge detection
    edges = new cv.Mat();
    cv.Canny(blurred, edges, DETECTION_CONFIG.cannyLow, DETECTION_CONFIG.cannyHigh);

    // Morphological close to connect broken edges
    // This is KEY - pure JS detector doesn't have this!
    kernel = cv.getStructuringElement(
      cv.MORPH_RECT,
      new cv.Size(DETECTION_CONFIG.morphKernelSize, DETECTION_CONFIG.morphKernelSize)
    );
    closed = new cv.Mat();
    cv.morphologyEx(edges, closed, cv.MORPH_CLOSE, kernel);

    // Find contours
    contours = new cv.MatVector();
    hierarchy = new cv.Mat();
    cv.findContours(closed, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    debug.contoursFound = contours.size();

    const imageArea = width * height;
    let bestQuad = null;
    let bestScore = 0;
    let bestAreaRatio = 0;

    // Process each contour
    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const area = cv.contourArea(contour);
      const areaRatio = area / imageArea;

      // Filter by area
      if (areaRatio < DETECTION_CONFIG.minAreaRatio || areaRatio > DETECTION_CONFIG.maxAreaRatio) {
        contour.delete();
        continue;
      }

      // Approximate polygon
      const perimeter = cv.arcLength(contour, true);
      const epsilon = DETECTION_CONFIG.approxEpsilonPercent * perimeter;
      const approx = new cv.Mat();
      cv.approxPolyDP(contour, approx, epsilon, true);

      // Check if quadrilateral (4 vertices)
      if (approx.rows === 4) {
        debug.quadsFound++;

        // Check convexity
        if (cv.isContourConvex(approx)) {
          // Extract corners
          const corners = [];
          for (let j = 0; j < 4; j++) {
            corners.push({
              x: approx.data32S[j * 2],
              y: approx.data32S[j * 2 + 1],
            });
          }

          // Check aspect ratio
          const orderedCorners = orderCorners(corners);
          const aspectRatio = calculateAspectRatio(orderedCorners);

          if (
            aspectRatio >= DETECTION_CONFIG.minAspectRatio &&
            aspectRatio <= DETECTION_CONFIG.maxAspectRatio
          ) {
            // Score based on area and rectangularity
            const rectScore = calculateRectangularityScore(orderedCorners);
            const score = areaRatio * 0.5 + rectScore * 0.5;

            if (score > bestScore) {
              bestScore = score;
              bestQuad = orderedCorners;
              bestAreaRatio = areaRatio;
            }
          }
        }
      }

      approx.delete();
      contour.delete();
    }

    debug.bestAreaRatio = bestAreaRatio;
    debug.processingMs = Math.round(performance.now() - startTime);

    if (!bestQuad) {
      logDebug("detect", { detected: false, confidence: 0, corners: null, debug });
      return createEmptyResult("No quadrilateral found", debug);
    }

    // Normalize corners to 0-1 range
    const normalized = bestQuad.map((c) => ({
      x: c.x / width,
      y: c.y / height,
    }));

    // Check if inside scan area
    let insideScanArea = true;
    if (scanArea) {
      const margin = DETECTION_CONFIG.cornerMargin;
      for (const corner of normalized) {
        if (
          corner.x < scanArea.x - margin ||
          corner.x > scanArea.x + scanArea.width + margin ||
          corner.y < scanArea.y - margin ||
          corner.y > scanArea.y + scanArea.height + margin
        ) {
          insideScanArea = false;
          break;
        }
      }
    }

    const result = {
      detected: true,
      corners: bestQuad,
      normalized,
      confidence: bestScore,
      insideScanArea,
      areaRatio: bestAreaRatio,
      debug,
    };

    logDebug("detect", {
      detected: true,
      confidence: bestScore.toFixed(2),
      corners: normalized.map((c) => `(${c.x.toFixed(2)},${c.y.toFixed(2)})`),
      debug,
    });

    return result;
  } catch (error) {
    console.error("[opencv] Detection error:", error);
    debug.error = error.message;
    return createEmptyResult(error.message, debug);
  } finally {
    // Clean up OpenCV Mats
    if (src) src.delete();
    if (gray) gray.delete();
    if (blurred) blurred.delete();
    if (edges) edges.delete();
    if (closed) closed.delete();
    if (kernel) kernel.delete();
    if (contours) contours.delete();
    if (hierarchy) hierarchy.delete();
  }
}

/**
 * Order corners as: Top-Left, Top-Right, Bottom-Right, Bottom-Left
 */
function orderCorners(corners) {
  // Find center
  const cx = corners.reduce((sum, c) => sum + c.x, 0) / 4;
  const cy = corners.reduce((sum, c) => sum + c.y, 0) / 4;

  // Classify corners by quadrant relative to center
  const topLeft = corners.filter((c) => c.x < cx && c.y < cy)[0];
  const topRight = corners.filter((c) => c.x >= cx && c.y < cy)[0];
  const bottomRight = corners.filter((c) => c.x >= cx && c.y >= cy)[0];
  const bottomLeft = corners.filter((c) => c.x < cx && c.y >= cy)[0];

  // Fallback: sort by angle from center
  if (!topLeft || !topRight || !bottomRight || !bottomLeft) {
    const sorted = [...corners].sort((a, b) => {
      const angleA = Math.atan2(a.y - cy, a.x - cx);
      const angleB = Math.atan2(b.y - cy, b.x - cx);
      return angleA - angleB;
    });

    // Rotate so top-left is first (smallest x+y sum)
    let minIdx = 0;
    let minSum = Infinity;
    sorted.forEach((c, i) => {
      const sum = c.x + c.y;
      if (sum < minSum) {
        minSum = sum;
        minIdx = i;
      }
    });

    return [
      sorted[minIdx],
      sorted[(minIdx + 1) % 4],
      sorted[(minIdx + 2) % 4],
      sorted[(minIdx + 3) % 4],
    ];
  }

  return [topLeft, topRight, bottomRight, bottomLeft];
}

/**
 * Calculate aspect ratio of quadrilateral
 */
function calculateAspectRatio(corners) {
  const topWidth = Math.hypot(corners[1].x - corners[0].x, corners[1].y - corners[0].y);
  const bottomWidth = Math.hypot(corners[2].x - corners[3].x, corners[2].y - corners[3].y);
  const leftHeight = Math.hypot(corners[3].x - corners[0].x, corners[3].y - corners[0].y);
  const rightHeight = Math.hypot(corners[2].x - corners[1].x, corners[2].y - corners[1].y);

  const avgWidth = (topWidth + bottomWidth) / 2;
  const avgHeight = (leftHeight + rightHeight) / 2;

  return avgWidth / avgHeight;
}

/**
 * Calculate how rectangular the quadrilateral is (1.0 = perfect rectangle)
 */
function calculateRectangularityScore(corners) {
  const topWidth = Math.hypot(corners[1].x - corners[0].x, corners[1].y - corners[0].y);
  const bottomWidth = Math.hypot(corners[2].x - corners[3].x, corners[2].y - corners[3].y);
  const leftHeight = Math.hypot(corners[3].x - corners[0].x, corners[3].y - corners[0].y);
  const rightHeight = Math.hypot(corners[2].x - corners[1].x, corners[2].y - corners[1].y);

  const widthRatio = Math.min(topWidth, bottomWidth) / Math.max(topWidth, bottomWidth);
  const heightRatio = Math.min(leftHeight, rightHeight) / Math.max(leftHeight, rightHeight);

  return widthRatio * heightRatio;
}

/**
 * Create empty detection result
 */
function createEmptyResult(reason = "", debug = {}) {
  return {
    detected: false,
    corners: null,
    normalized: null,
    confidence: 0,
    insideScanArea: false,
    areaRatio: 0,
    reason,
    debug: { ...debug, engine: debug.engine || "opencv" },
  };
}

/**
 * Calculate scoring metrics from detected corners
 *
 * @param {Object} detection - Detection result from detectDocumentOpenCV
 * @param {Object} scanArea - Guide rectangle bounds
 * @param {Array} prevCorners - Previous frame corners for stability
 * @returns {Object} Scoring metrics
 */
export function calculateScoresOpenCV(detection, scanArea, prevCorners = null) {
  if (!detection.detected || !detection.normalized) {
    const scores = {
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

    logDebug("scores", scores);
    return scores;
  }

  const corners = detection.normalized;
  const margin = 0.03;

  // 1. INSIDE SCORE: Are all corners within scan area + proper size?
  let insideScore = 1.0;

  for (const corner of corners) {
    if (
      corner.x < scanArea.x - margin ||
      corner.x > scanArea.x + scanArea.width + margin ||
      corner.y < scanArea.y - margin ||
      corner.y > scanArea.y + scanArea.height + margin
    ) {
      insideScore *= 0.5;
    }
  }

  // Check size ratio
  const docWidth = Math.abs(corners[1].x - corners[0].x + corners[2].x - corners[3].x) / 2;
  const docHeight = Math.abs(corners[3].y - corners[0].y + corners[2].y - corners[1].y) / 2;
  const sizeRatio = (docWidth * docHeight) / (scanArea.width * scanArea.height);

  if (sizeRatio < 0.4) {
    insideScore *= 0.3 + sizeRatio; // Too far
  } else if (sizeRatio > 1.3) {
    insideScore *= Math.max(0.2, 2.3 - sizeRatio); // Too close
  }

  // 2. ROTATION SCORE: How horizontal/vertical are the edges?
  const topAngle = Math.atan2(corners[1].y - corners[0].y, corners[1].x - corners[0].x);
  const bottomAngle = Math.atan2(corners[2].y - corners[3].y, corners[2].x - corners[3].x);
  const leftAngle = Math.atan2(corners[3].y - corners[0].y, corners[3].x - corners[0].x);
  const rightAngle = Math.atan2(corners[2].y - corners[1].y, corners[2].x - corners[1].x);

  const horizontalDeviation = (Math.abs(topAngle) + Math.abs(bottomAngle)) / 2;
  const verticalDeviation =
    (Math.abs(Math.abs(leftAngle) - Math.PI / 2) + Math.abs(Math.abs(rightAngle) - Math.PI / 2)) /
    2;

  const maxRotation = Math.PI / 12; // 15 degrees
  const rotationScore = Math.max(
    0,
    1 - (horizontalDeviation + verticalDeviation) / (2 * maxRotation)
  );

  // 3. PERSPECTIVE SCORE: How rectangular is the shape?
  const topWidth = Math.hypot(corners[1].x - corners[0].x, corners[1].y - corners[0].y);
  const bottomWidth = Math.hypot(corners[2].x - corners[3].x, corners[2].y - corners[3].y);
  const leftHeight = Math.hypot(corners[3].x - corners[0].x, corners[3].y - corners[0].y);
  const rightHeight = Math.hypot(corners[2].x - corners[1].x, corners[2].y - corners[1].y);

  const widthRatio = Math.min(topWidth, bottomWidth) / Math.max(topWidth, bottomWidth);
  const heightRatio = Math.min(leftHeight, rightHeight) / Math.max(leftHeight, rightHeight);
  const perspectiveScore = widthRatio * heightRatio;

  // 4. STABILITY SCORE: Corner movement between frames
  let stabilityScore = 1.0;
  if (prevCorners && prevCorners.length === 4) {
    let totalMovement = 0;
    for (let i = 0; i < 4; i++) {
      const dx = corners[i].x - prevCorners[i].x;
      const dy = corners[i].y - prevCorners[i].y;
      totalMovement += Math.hypot(dx, dy);
    }
    const avgMovement = totalMovement / 4;
    const maxMovement = 0.04; // 4% of frame
    stabilityScore = Math.max(0, 1 - avgMovement / maxMovement);
  }

  // Calculate total score
  const totalScore =
    0.4 * insideScore + 0.25 * rotationScore + 0.25 * perspectiveScore + 0.1 * stabilityScore;

  // Determine hint based on worst score
  let hint = "";
  const scores = [
    {
      name: "inside",
      score: insideScore,
      hint:
        sizeRatio < 0.4
          ? "Acércate al documento"
          : sizeRatio > 1.3
          ? "Aléjate del documento"
          : "Coloca el documento dentro del recuadro",
    },
    { name: "rotation", score: rotationScore, hint: "Endereza el documento" },
    { name: "perspective", score: perspectiveScore, hint: "Alinea de frente el documento" },
    { name: "stability", score: stabilityScore, hint: "Mantén la cámara quieta" },
  ];

  const worstScore = scores.reduce((min, s) => (s.score < min.score ? s : min), scores[0]);

  if (worstScore.score < 0.7) {
    hint = worstScore.hint;
  }

  // Special hint for passport detection
  if (detection.detected && sizeRatio > 0.8 && sizeRatio < 1.5 && rotationScore < 0.5) {
    // Could be open passport - guide user
    hint = "Escanea solo la página de datos (con tu foto)";
  }

  const captureEnabled = totalScore >= 0.85;
  const autoCaptureReady = totalScore >= 0.9;

  const result = {
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

  logDebug("scores", {
    inside: insideScore.toFixed(2),
    rotation: rotationScore.toFixed(2),
    perspective: perspectiveScore.toFixed(2),
    stability: stabilityScore.toFixed(2),
    total: totalScore.toFixed(2),
    captureEnabled,
    autoCaptureReady,
    hint: hint || "(none)",
  });

  return result;
}

/**
 * Get edge alignment status for UI rendering
 * Returns values 0-1 for each edge indicating alignment quality
 */
export function getEdgeAlignmentsOpenCV(detection, scanArea) {
  if (!detection.detected || !detection.normalized) {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  const corners = detection.normalized;
  const margin = 0.05;

  // Check each edge alignment to guide rect
  const topAligned = Math.max(
    0,
    1 - Math.abs((corners[0].y + corners[1].y) / 2 - scanArea.y) / margin
  );

  const rightAligned = Math.max(
    0,
    1 - Math.abs((corners[1].x + corners[2].x) / 2 - (scanArea.x + scanArea.width)) / margin
  );

  const bottomAligned = Math.max(
    0,
    1 - Math.abs((corners[2].y + corners[3].y) / 2 - (scanArea.y + scanArea.height)) / margin
  );

  const leftAligned = Math.max(
    0,
    1 - Math.abs((corners[0].x + corners[3].x) / 2 - scanArea.x) / margin
  );

  return {
    top: Math.min(1, topAligned),
    right: Math.min(1, rightAligned),
    bottom: Math.min(1, bottomAligned),
    left: Math.min(1, leftAligned),
  };
}

/**
 * Apply perspective warp using OpenCV.js
 *
 * @param {HTMLCanvasElement|HTMLVideoElement} source - Source image/video
 * @param {Array} corners - Four corners in pixel coords [TL, TR, BR, BL]
 * @param {Object} options - Output options
 * @returns {HTMLCanvasElement} Rectified document
 */
export function warpPerspectiveOpenCV(source, corners, options = {}) {
  if (!isOpenCVReady()) {
    console.error("[opencv] Cannot warp - OpenCV not ready");
    return null;
  }

  const cv = getCV();
  const { outputWidth = null, outputHeight = null, aspectRatio = 1.5, padding = 5 } = options;

  // Get source dimensions
  const srcWidth = source.videoWidth || source.width;
  const srcHeight = source.videoHeight || source.height;

  // Calculate output dimensions
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

  // Add padding
  outW += padding * 2;
  outH += padding * 2;

  // Cap size
  const maxSize = 2000;
  if (outW > maxSize || outH > maxSize) {
    const scale = maxSize / Math.max(outW, outH);
    outW = Math.round(outW * scale);
    outH = Math.round(outH * scale);
  }

  let src = null;
  let dst = null;
  let srcTri = null;
  let dstTri = null;
  let M = null;

  try {
    // Create source Mat from canvas/video
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = srcWidth;
    tempCanvas.height = srcHeight;
    const ctx = tempCanvas.getContext("2d");
    ctx.drawImage(source, 0, 0);

    src = cv.imread(tempCanvas);
    dst = new cv.Mat();

    // Define source and destination points
    srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
      corners[0].x,
      corners[0].y, // TL
      corners[1].x,
      corners[1].y, // TR
      corners[2].x,
      corners[2].y, // BR
      corners[3].x,
      corners[3].y, // BL
    ]);

    dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
      padding,
      padding, // TL
      outW - padding,
      padding, // TR
      outW - padding,
      outH - padding, // BR
      padding,
      outH - padding, // BL
    ]);

    // Get perspective transform matrix
    M = cv.getPerspectiveTransform(srcTri, dstTri);

    // Apply warp
    cv.warpPerspective(
      src,
      dst,
      M,
      new cv.Size(outW, outH),
      cv.INTER_LINEAR,
      cv.BORDER_CONSTANT,
      new cv.Scalar(255, 255, 255, 255)
    );

    // Convert to canvas
    const outputCanvas = document.createElement("canvas");
    outputCanvas.width = outW;
    outputCanvas.height = outH;
    cv.imshow(outputCanvas, dst);

    logDebug("warp", {
      inputSize: `${srcWidth}x${srcHeight}`,
      outputSize: `${outW}x${outH}`,
    });

    return outputCanvas;
  } catch (error) {
    console.error("[opencv] Warp error:", error);
    return null;
  } finally {
    if (src) src.delete();
    if (dst) dst.delete();
    if (srcTri) srcTri.delete();
    if (dstTri) dstTri.delete();
    if (M) M.delete();
  }
}

/**
 * Convenience function to rectify document from normalized corners
 */
export function rectifyDocumentOpenCV(source, normalizedCorners, options = {}) {
  const srcWidth = source.videoWidth || source.width;
  const srcHeight = source.videoHeight || source.height;

  // Convert normalized to pixel coords
  const pixelCorners = normalizedCorners.map((c) => ({
    x: c.x * srcWidth,
    y: c.y * srcHeight,
  }));

  return warpPerspectiveOpenCV(source, pixelCorners, options);
}

export default detectDocumentOpenCV;
