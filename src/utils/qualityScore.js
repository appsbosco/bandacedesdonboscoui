/**
 * Calcula scores de calidad de la imagen
 */
export function calculateQualityScore(mat, quadPoints, width, height) {
  const cv = window.cv;

  // 1. Sharpness (Laplacian variance)
  const gray = new cv.Mat();
  cv.cvtColor(mat, gray, cv.COLOR_RGBA2GRAY);
  const laplacian = new cv.Mat();
  cv.Laplacian(gray, laplacian, cv.CV_64F);
  const mean = new cv.Mat();
  const stddev = new cv.Mat();
  cv.meanStdDev(laplacian, mean, stddev);
  const variance = Math.pow(stddev.data64F[0], 2);
  const sharpness = Math.min(variance / 500, 1.0); // Normalize

  laplacian.delete();
  mean.delete();
  stddev.delete();

  // 2. Brightness (mean intensity)
  const avgBrightness = cv.mean(gray);
  const brightness = avgBrightness[0] / 255;

  gray.delete();

  // 3. Perspective (how rectangular is the quad)
  const perspective = calculatePerspectiveScore(quadPoints);

  // 4. Motion (compare with previous frame - simplified to 0 for now)
  const motion = 0;

  return {
    sharpness,
    brightness,
    perspective,
    motion,
  };
}

function calculatePerspectiveScore(points) {
  if (points.length !== 4) return 0;

  // Calculate angles
  const [tl, tr, br, bl] = points;

  const angle1 = calculateAngle(bl, tl, tr);
  const angle2 = calculateAngle(tl, tr, br);
  const angle3 = calculateAngle(tr, br, bl);
  const angle4 = calculateAngle(br, bl, tl);

  // Ideal is 90° for all corners
  const avgDeviation =
    (Math.abs(angle1 - 90) +
      Math.abs(angle2 - 90) +
      Math.abs(angle3 - 90) +
      Math.abs(angle4 - 90)) /
    4;

  // Score: 1.0 if perfect, 0 if 45° deviation
  return Math.max(0, 1 - avgDeviation / 45);
}

function calculateAngle(p1, p2, p3) {
  const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
  const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };

  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

  const cosAngle = dot / (mag1 * mag2);
  return Math.acos(Math.max(-1, Math.min(1, cosAngle))) * (180 / Math.PI);
}
