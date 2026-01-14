/**
 * Cloudinary Upload Utility
 * Maneja la subida de imágenes escaneadas a Cloudinary
 */

const CLOUDINARY_CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

/**
 * Convierte un canvas a Blob
 * @param {HTMLCanvasElement} canvas
 * @param {string} type - MIME type (image/jpeg, image/png)
 * @param {number} quality - Calidad (0-1)
 * @returns {Promise<Blob>}
 */
export function canvasToBlob(canvas, type = "image/jpeg", quality = 0.92) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to convert canvas to blob"));
        }
      },
      type,
      quality
    );
  });
}

/**
 * Sube una imagen (Blob o File) a Cloudinary
 * @param {Blob|File} imageData - Imagen a subir
 * @param {Object} options - Opciones de configuración
 * @param {Function} onProgress - Callback para progreso (0-100)
 * @returns {Promise<{url: string, publicId: string}>}
 */
export async function uploadToCloudinary(imageData, options = {}, onProgress) {
  const cloudName = options.cloudName || CLOUDINARY_CLOUD_NAME;
  const uploadPreset = options.uploadPreset || CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error(
      "Cloudinary configuration missing. Set REACT_APP_CLOUDINARY_CLOUD_NAME and REACT_APP_CLOUDINARY_UPLOAD_PRESET"
    );
  }

  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  const formData = new FormData();

  // Si es un Blob sin nombre, crear un File
  if (imageData instanceof Blob && !(imageData instanceof File)) {
    imageData = new File([imageData], `scan_${Date.now()}.jpg`, { type: "image/jpeg" });
  }

  formData.append("file", imageData);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", options.folder || "documents");

  // Tags opcionales para organización
  if (options.tags) {
    formData.append("tags", options.tags.join(","));
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Tracking de progreso
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve({
            url: response.secure_url,
            publicId: response.public_id,
            width: response.width,
            height: response.height,
            format: response.format,
            bytes: response.bytes,
          });
        } catch (err) {
          reject(new Error("Invalid response from Cloudinary"));
        }
      } else {
        let errorMessage = "Upload failed";
        try {
          const errorResponse = JSON.parse(xhr.responseText);
          errorMessage = errorResponse.error?.message || errorMessage;
        } catch (e) {
          // Ignorar error de parsing
        }
        reject(new Error(errorMessage));
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Network error during upload"));
    });

    xhr.addEventListener("abort", () => {
      reject(new Error("Upload cancelled"));
    });

    xhr.open("POST", uploadUrl);
    xhr.send(formData);
  });
}

/**
 * Optimiza una imagen antes de subirla
 * @param {HTMLCanvasElement} canvas - Canvas con la imagen
 * @param {Object} options - Opciones de optimización
 * @returns {Promise<Blob>}
 */
export async function optimizeForUpload(canvas, options = {}) {
  const { maxWidth = 2048, maxHeight = 2048, quality = 0.92, format = "image/jpeg" } = options;

  // Si el canvas es más grande que el máximo, redimensionar
  let targetCanvas = canvas;

  if (canvas.width > maxWidth || canvas.height > maxHeight) {
    const scale = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);

    targetCanvas = document.createElement("canvas");
    targetCanvas.width = Math.round(canvas.width * scale);
    targetCanvas.height = Math.round(canvas.height * scale);

    const ctx = targetCanvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(canvas, 0, 0, targetCanvas.width, targetCanvas.height);
  }

  return canvasToBlob(targetCanvas, format, quality);
}

export default uploadToCloudinary;
