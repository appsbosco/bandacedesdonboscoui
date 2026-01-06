import React, { useState } from "react";
import { useMutation } from "@apollo/client";
import {
  ADD_DOCUMENT_IMAGE,
  UPSERT_DOCUMENT_EXTRACTED_DATA,
  SET_DOCUMENT_STATUS,
} from "../../graphql/documents.gql";
import { uploadToCloudinary } from "../../services/cloudinaryUpload";
import { extractMRZFromImage } from "../../utils/extractMRZFromImage";
import DocumentConfirmForm from "./DocumentConfirmForm";

import PropTypes from "prop-types";

export default function DocumentPreview({ image, documentId, documentType, onRetake, onComplete }) {
  const [addDocumentImage] = useMutation(ADD_DOCUMENT_IMAGE);
  const [upsertExtractedData] = useMutation(UPSERT_DOCUMENT_EXTRACTED_DATA);
  const [setDocumentStatus] = useMutation(SET_DOCUMENT_STATUS);

  const [status, setStatus] = useState("PREVIEW"); // PREVIEW, UPLOADING, EXTRACTING, CONFIRM
  const [uploadProgress, setUploadProgress] = useState(0);
  const [extractedData, setExtractedData] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);

  const previewUrl = URL.createObjectURL(image);

  const handleUsePhoto = async () => {
    try {
      // 1. Upload to Cloudinary
      setStatus("UPLOADING");
      const cloudinaryResult = await uploadToCloudinary(image, (progress) => {
        setUploadProgress(progress);
      });

      setImageUrl(cloudinaryResult.secure_url);

      // 2. Add image to document
      await addDocumentImage({
        variables: {
          input: {
            documentId,
            url: cloudinaryResult.secure_url,
            provider: "CLOUDINARY",
            publicId: cloudinaryResult.public_id,
          },
        },
      });

      // 3. Extract data
      setStatus("EXTRACTING");

      if (documentType === "PASSPORT") {
        // Extract MRZ
        const mrzData = await extractMRZFromImage(image);
        setExtractedData(mrzData);
      } else {
        // VISA - basic OCR or manual
        setExtractedData({
          needsManualReview: true,
        });
      }

      setStatus("CONFIRM");
    } catch (error) {
      console.error("Error processing image:", error);
      alert("Error procesando imagen: " + error.message);
      onRetake();
    }
  };

  const handleConfirmData = async (formData) => {
    try {
      // Save extracted data
      await upsertExtractedData({
        variables: {
          input: {
            documentId,
            ...formData,
          },
        },
      });

      // Set final status
      const finalStatus =
        documentType === "PASSPORT" && formData.mrzValid
          ? "DATA_CAPTURED"
          : formData.ocrConfidence && formData.ocrConfidence > 0.8
          ? "OCR_SUCCESS"
          : "DATA_CAPTURED";

      await setDocumentStatus({
        variables: {
          documentId,
          status: finalStatus,
        },
      });

      onComplete(documentId);
    } catch (error) {
      console.error("Error saving data:", error);
      alert("Error guardando datos: " + error.message);
    }
  };

  if (status === "CONFIRM") {
    return (
      <DocumentConfirmForm
        documentId={documentId}
        documentType={documentType}
        initialData={extractedData}
        imageUrl={imageUrl}
        onConfirm={handleConfirmData}
        onCancel={onRetake}
      />
    );
  }

  return (
    <div className="h-full bg-black flex flex-col">
      {/* Preview Image */}
      <div className="flex-1 relative">
        <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />

        {/* Loading Overlay */}
        {(status === "UPLOADING" || status === "EXTRACTING") && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
            <div className="text-center text-white p-8">
              <div className="mb-4">
                <svg
                  className="animate-spin h-12 w-12 mx-auto text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
              <p className="text-lg font-semibold mb-2">
                {status === "UPLOADING" ? "Subiendo imagen..." : "Extrayendo información..."}
              </p>
              {status === "UPLOADING" && (
                <div className="w-64 bg-white/20 rounded-full h-2 overflow-hidden mx-auto">
                  <div
                    className="bg-white h-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {status === "PREVIEW" && (
        <div className="bg-gradient-to-t from-black to-transparent p-6 pb-8">
          <div className="max-w-md mx-auto space-y-3">
            <button
              onClick={handleUsePhoto}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors shadow-lg"
            >
              Usar esta foto
            </button>
            <button
              onClick={onRetake}
              className="w-full bg-white/20 hover:bg-white/30 text-white font-semibold py-4 px-6 rounded-xl transition-colors"
            >
              Repetir captura
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
DocumentPreview.propTypes = {
  image: PropTypes.oneOfType([PropTypes.instanceOf(File), PropTypes.instanceOf(Blob)]).isRequired,
  documentId: PropTypes.string.isRequired,
  documentType: PropTypes.oneOf(["PASSPORT", "VISA"]).isRequired,
  onRetake: PropTypes.func.isRequired,
  onComplete: PropTypes.func.isRequired,
};
