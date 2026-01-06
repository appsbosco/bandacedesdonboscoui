import React, { useState, useRef } from "react";
import { uploadToCloudinary, validateImageQuality } from "../../services/cloudinaryUpload";
import { Button } from "../ui/Button";
import { useToast } from "../ui/Toast";
import PropTypes from "prop-types";

export function DocumentImageUploader({ documentId, onImageUploaded, existingImages = [] }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previews, setPreviews] = useState(existingImages);
  const fileInputRef = useRef(null);
  const { addToast } = useToast();

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);

    if (files.length === 0) return;

    for (const file of files) {
      await uploadFile(file);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadFile = async (file) => {
    try {
      setUploading(true);
      setProgress(0);

      // Validar calidad de imagen
      const isGoodQuality = await validateImageQuality(file);
      if (!isGoodQuality) {
        addToast(
          "La imagen tiene baja resolución. Recomendamos una resolución mínima de 800x600px.",
          "warning"
        );
      }

      // Subir a Cloudinary
      const result = await uploadToCloudinary(file, (percent) => {
        setProgress(percent);
      });

      // Agregar preview local
      const newPreview = {
        url: result.secure_url,
        publicId: result.public_id,
        provider: "CLOUDINARY",
        uploadedAt: new Date().toISOString(),
      };

      setPreviews((prev) => [...prev, newPreview]);

      // Notificar al padre
      if (onImageUploaded) {
        await onImageUploaded({
          url: result.secure_url,
          publicId: result.public_id,
          provider: "CLOUDINARY",
        });
      }

      addToast("Imagen subida exitosamente", "success");
    } catch (error) {
      console.error("Upload error:", error);
      addToast(error.message || "Error subiendo imagen", "error");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      if (file.type.startsWith("image/") || file.type === "application/pdf") {
        await uploadFile(file);
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const removePreview = (index) => {
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-500 transition-colors"
      >
        <div className="space-y-4">
          <div className="text-6xl">📷</div>
          <div>
            <p className="text-lg font-medium text-gray-900">Arrastra tus imágenes aquí</p>
            <p className="text-sm text-gray-500 mt-1">o haz clic para seleccionar archivos</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />

          <div className="flex gap-3 justify-center">
            <Button
              variant="primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              Seleccionar Archivos
            </Button>

            {/* Camera button (only on mobile) */}
            <label className="md:hidden">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button as="span" variant="secondary" disabled={uploading}>
                📸 Tomar Foto
              </Button>
            </label>
          </div>

          <p className="text-xs text-gray-500">Formatos: JPG, PNG, WEBP, PDF • Máx 10MB</p>
        </div>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">Subiendo imagen...</span>
            <span className="text-sm text-blue-700">{progress}%</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Image Previews */}
      {previews.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Imágenes ({previews.length})</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {previews.map((preview, index) => (
              <div key={index} className="relative group">
                <img
                  src={preview.url}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border border-gray-200"
                />
                <button
                  onClick={() => removePreview(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Eliminar imagen"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Requirements */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-yellow-900 mb-2">📋 Requisitos de la imagen:</h4>
        <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
          <li>Imagen nítida y bien iluminada</li>
          <li>Sin reflejos o sombras</li>
          <li>Documento completo visible</li>
          <li>Texto legible</li>
        </ul>
      </div>
    </div>
  );
}

DocumentImageUploader.propTypes = {
  documentId: PropTypes.string.isRequired,
  onImageUploaded: PropTypes.func,
  existingImages: PropTypes.arrayOf(
    PropTypes.shape({
      url: PropTypes.string.isRequired,
      publicId: PropTypes.string,
      provider: PropTypes.string,
      uploadedAt: PropTypes.string,
    })
  ),
};
