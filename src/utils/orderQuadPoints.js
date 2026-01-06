/**
 * Ordena 4 puntos en el orden: TL, TR, BR, BL
 */
export function orderQuadPoints(points) {
  if (points.length !== 4) return points;

  // Ordenar por Y (arriba a abajo)
  const sorted = [...points].sort((a, b) => a.y - b.y);

  // Top 2
  const top = sorted.slice(0, 2).sort((a, b) => a.x - b.x);
  const tl = top[0];
  const tr = top[1];

  // Bottom 2
  const bottom = sorted.slice(2, 4).sort((a, b) => a.x - b.x);
  const bl = bottom[0];
  const br = bottom[1];

  return [tl, tr, br, bl];
}
