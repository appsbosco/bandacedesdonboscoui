/**
 * uploadEvidenceToCloudinary
 * Sube imágenes o PDFs a Cloudinary usando el preset no firmado.
 * Usa resourceType "auto" para que Cloudinary detecte el tipo automáticamente.
 */

const CLOUDINARY_CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

/**
 * Sube un File/Blob a Cloudinary con tipo automático (imagen o PDF).
 *
 * @param {File|Blob} file
 * @param {{ cloudName?: string, uploadPreset?: string, tags?: string[], folder?: string }} options
 * @param {(percent: number) => void} onProgress
 * @returns {Promise<{ url: string, publicId: string, resourceType: string, originalName: string, format: string, bytes: number }>}
 */
export async function uploadEvidenceToCloudinary(file, options = {}, onProgress) {
  const cloudName = options.cloudName || CLOUDINARY_CLOUD_NAME;
  const uploadPreset = options.uploadPreset || CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error(
      "Cloudinary no configurado. Verifica REACT_APP_CLOUDINARY_CLOUD_NAME y REACT_APP_CLOUDINARY_UPLOAD_PRESET"
    );
  }

  // Detectar tipo de recurso
  const isPdf = file.type === "application/pdf";
  const resourceType = isPdf ? "raw" : "image";
  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  if (options.folder) {
    formData.append("folder", options.folder);
  }
  if (options.tags && options.tags.length > 0) {
    formData.append("tags", options.tags.join(","));
  }

  const originalName = file instanceof File ? file.name : "evidence";

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          resolve({
            url: res.secure_url,
            publicId: res.public_id,
            resourceType: res.resource_type || resourceType,
            originalName,
            format: res.format || "",
            bytes: res.bytes || 0,
          });
        } catch {
          reject(new Error("Respuesta inválida de Cloudinary"));
        }
      } else {
        let msg = "Error al subir archivo";
        try {
          const err = JSON.parse(xhr.responseText);
          msg = err.error?.message || msg;
        } catch { /* ignore */ }
        reject(new Error(msg));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Error de red al subir archivo")));
    xhr.addEventListener("abort", () => reject(new Error("Subida cancelada")));

    xhr.open("POST", uploadUrl);
    xhr.send(formData);
  });
}

/** Valida que el archivo sea una imagen o PDF y no supere el tamaño máximo */
export function validateEvidenceFile(file, maxMb = 10) {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
  if (!allowed.includes(file.type)) {
    throw new Error("Solo se permiten imágenes (JPG, PNG, WebP) o PDF");
  }
  const maxBytes = maxMb * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(`El archivo no puede superar ${maxMb} MB`);
  }
}
