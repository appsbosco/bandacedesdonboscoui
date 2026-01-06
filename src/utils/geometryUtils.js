/**
 * Utilidades de geometría para mapear coordenadas
 * video space → display space
 */

/**
 * Ordena 4 puntos de un cuadrilátero en orden: TL, TR, BR, BL
 * Usa método estándar de suma/diferencia
 * @param {Array} points - Array de 4 puntos {x, y}
 * @returns {Array} - Puntos ordenados [TL, TR, BR, BL]
 */
export function orderQuadPoints(points) {
  if (!points || points.length !== 4) {
    throw new Error("orderQuadPoints requires exactly 4 points");
  }

  // Ordenar por suma (x+y) para TL y BR
  const sorted = [...points].sort((a, b) => a.x + a.y - (b.x + b.y));

  const tl = sorted[0]; // Menor suma
  const br = sorted[3]; // Mayor suma

  // De los 2 del medio, ordenar por diferencia (x-y) para TR y BL
  const middle = [sorted[1], sorted[2]];
  middle.sort((a, b) => b.x - b.y - (a.x - a.y));

  const tr = middle[0]; // Mayor diferencia
  const bl = middle[1]; // Menor diferencia

  return [tl, tr, br, bl];
}

/**
 * Calcula la transformación para object-fit: cover
 * @param {number} videoW - Ancho del video original
 * @param {number} videoH - Alto del video original
 * @param {number} displayW - Ancho del contenedor
 * @param {number} displayH - Alto del contenedor
 * @returns {Object} - { scale, offsetX, offsetY, croppedW, croppedH }
 */
export function getCoverTransform(videoW, videoH, displayW, displayH) {
  const videoRatio = videoW / videoH;
  const displayRatio = displayW / displayH;

  let scale,
    offsetX = 0,
    offsetY = 0;
  let croppedW = videoW;
  let croppedH = videoH;

  if (videoRatio > displayRatio) {
    // Video es más ancho: crop horizontal
    scale = displayH / videoH;
    croppedW = displayW / scale;
    offsetX = (videoW - croppedW) / 2;
  } else {
    // Video es más alto: crop vertical
    scale = displayW / videoW;
    croppedH = displayH / scale;
    offsetY = (videoH - croppedH) / 2;
  }

  return {
    scale,
    offsetX,
    offsetY,
    croppedW,
    croppedH,
  };
}

/**
 * Mapea un punto desde video space a overlay/display space
 * @param {Object} point - {x, y} en coordenadas del video
 * @param {number} videoW - Ancho del video
 * @param {number} videoH - Alto del video
 * @param {number} overlayW - Ancho del overlay
 * @param {number} overlayH - Alto del overlay
 * @param {Object} transform - Objeto de getCoverTransform (opcional, se calcula si no se pasa)
 * @returns {Object} - {x, y} en coordenadas del overlay
 */
export function mapVideoPointToOverlay(
  point,
  videoW,
  videoH,
  overlayW,
  overlayH,
  transform = null
) {
  if (!transform) {
    transform = getCoverTransform(videoW, videoH, overlayW, overlayH);
  }

  const { scale, offsetX, offsetY } = transform;

  // Convertir de video space a display space
  const x = (point.x - offsetX) * scale;
  const y = (point.y - offsetY) * scale;

  return { x, y };
}

/**
 * Calcula área de un polígono usando Shoelace formula
 * @param {Array} points - Array de puntos {x, y}
 * @returns {number} - Área
 */
export function calculatePolygonArea(points) {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area / 2);
}

/**
 * Calcula centro de un polígono
 * @param {Array} points - Array de puntos {x, y}
 * @returns {Object} - {x, y}
 */
export function getPolygonCenter(points) {
  const sum = points.reduce(
    (acc, p) => ({
      x: acc.x + p.x,
      y: acc.y + p.y,
    }),
    { x: 0, y: 0 }
  );

  return {
    x: sum.x / points.length,
    y: sum.y / points.length,
  };
}
