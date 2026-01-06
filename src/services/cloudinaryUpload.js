/**
 * Cloudinary Upload Service
 * Maneja la subida de imágenes directamente a Cloudinary desde el frontend
 */

const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/image/upload`;
const CLOUDINARY_UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

/**
 * Sube una imagen a Cloudinary
 * @param {File} file - Archivo de imagen
 * @param {Function} onProgress - Callback para progreso (0-100)
 * @returns {Promise<{secure_url: string, public_id: string}>}
 */
export async function uploadToCloudinary(file, onProgress) {
  if (!file) {
    throw new Error("No file provided");
  }

  // Validar tipo de archivo
  const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
  if (!validTypes.includes(file.type)) {
    throw new Error("Tipo de archivo no válido. Solo se permiten imágenes (JPG, PNG, WEBP) o PDF.");
  }

  // Validar tamaño (máx 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error("El archivo es demasiado grande. Máximo 10MB.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", "documents"); // Carpeta específica para documentos

  // TODO: Cuando esté disponible signed upload, usar esto:
  // const signature = await getUploadSignature();
  // formData.append('signature', signature.signature);
  // formData.append('timestamp', signature.timestamp);
  // formData.append('api_key', signature.apiKey);

  try {
    const xhr = new XMLHttpRequest();

    return new Promise((resolve, reject) => {
      // Progress tracking
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable && onProgress) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          onProgress(percentComplete);
        }
      });

      // Load
      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve({
            secure_url: response.secure_url,
            public_id: response.public_id,
          });
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      // Error
      xhr.addEventListener("error", () => {
        reject(new Error("Upload failed. Please check your connection."));
      });

      // Abort
      xhr.addEventListener("abort", () => {
        reject(new Error("Upload cancelled"));
      });

      xhr.open("POST", CLOUDINARY_UPLOAD_URL);
      xhr.send(formData);
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
}

/**
 * TODO: Implementar cuando exista mutation requestDocumentUploadSignature
 * Solicita signature para upload seguro
 */
async function getUploadSignature() {
  // const { data } = await apolloClient.mutate({
  //   mutation: REQUEST_DOCUMENT_UPLOAD_SIGNATURE,
  //   variables: { documentType: 'PASSPORT' }
  // });
  // return data.requestDocumentUploadSignature;

  throw new Error("Signed upload not implemented yet");
}

/**
 * Valida que la imagen sea legible para OCR
 * @param {File} file
 * @returns {Promise<boolean>}
 */
export async function validateImageQuality(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      // Validar resolución mínima (ej: 800x600)
      const isGoodResolution = img.width >= 800 && img.height >= 600;
      URL.revokeObjectURL(url);
      resolve(isGoodResolution);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(false);
    };

    img.src = url;
  });
}
