/**
 * CRÍTICO: Mapea coordenadas del canvas (video real) a coordenadas de display
 * cuando el video usa object-cover
 */
export function mapCanvasToVideo(point, videoElement, canvas) {
  const videoRect = videoElement.getBoundingClientRect();
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;

  if (!canvasWidth || !canvasHeight) {
    return point;
  }

  // NO usar videoWidth/videoHeight del elemento, usar canvas dimensions
  const videoAspect = canvasWidth / canvasHeight;
  const displayAspect = videoRect.width / videoRect.height;

  let scale, offsetX, offsetY;

  if (displayAspect > videoAspect) {
    // Display es más ancho -> video ocupa full height, crop width
    scale = videoRect.height / canvasHeight;
    const scaledWidth = canvasWidth * scale;
    offsetX = (videoRect.width - scaledWidth) / 2;
    offsetY = 0;
  } else {
    // Display es más alto -> video ocupa full width, crop height
    scale = videoRect.width / canvasWidth;
    const scaledHeight = canvasHeight * scale;
    offsetX = 0;
    offsetY = (videoRect.height - scaledHeight) / 2;
  }

  return {
    x: point.x * scale + offsetX,
    y: point.y * scale + offsetY,
  };
}
