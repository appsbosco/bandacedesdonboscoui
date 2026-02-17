// src/components/documents/NewDocumentPage.jsx
import React, { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@apollo/client";
import {
  CREATE_DOCUMENT,
  ADD_DOCUMENT_IMAGE,
  GET_SIGNED_UPLOAD,
  ENQUEUE_DOCUMENT_OCR,
  MY_DOCUMENTS,
} from "../../graphql/documents/index.js";
import { WizardStep1 } from "../../components/documents/WizardStep1.jsx";
import { WizardStep2 } from "../../components/documents/WizardStep2";
import { canvasToBlob } from "../../utils/uploadToCloudinary.js";
import { uploadSignedToCloudinary } from "../../services/cloudinarySignedUpload.js";
import { DOCUMENT_TYPES } from "../../utils/constants";

function NewDocumentPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [documentType, setDocumentType] = useState(null);

  // Step 3 inline states
  const [uploadState, setUploadState] = useState("idle"); // idle | uploading | success | error
  const [uploadError, setUploadError] = useState(null);
  const [createdDocId, setCreatedDocId] = useState(null);
  const previewUrlRef = useRef(null);
  const canvasRef = useRef(null);

  const [createDocument] = useMutation(CREATE_DOCUMENT, {
    refetchQueries: [{ query: MY_DOCUMENTS }],
  });
  const [addDocumentImage] = useMutation(ADD_DOCUMENT_IMAGE);
  const [getSignedUpload] = useMutation(GET_SIGNED_UPLOAD);
  const [enqueueDocumentOcr] = useMutation(ENQUEUE_DOCUMENT_OCR);

  const handleStep1Next = useCallback(() => {
    if (!documentType) return;
    setStep(2);
  }, [documentType]);

  const handleStep2Capture = useCallback(
    async (canvas, metadata) => {
      // Store canvas for retry
      canvasRef.current = canvas;
      setStep(3);
      setUploadState("uploading");
      setUploadError(null);

      // Create a blob preview URL for display
      try {
        const previewBlob = await canvasToBlob(canvas, "image/jpeg", 0.6);
        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = URL.createObjectURL(previewBlob);
      } catch {
        // Preview is non-critical
      }

      try {
        // 1. Convert canvas -> blob
        const blob = await canvasToBlob(canvas, "image/jpeg", 0.85);

        // 2. Create document
        const { data: docData } = await createDocument({
          variables: { input: { type: documentType } },
        });
        const documentId = docData?.createDocument?.id;
        if (!documentId) throw new Error("No se pudo crear el documento");

        // 3. Get signed upload params
        const { data: signData } = await getSignedUpload({
          variables: { input: { documentId, kind: "RAW" } },
        });
        const signed = signData?.getSignedUpload;
        if (!signed) throw new Error("No se pudo obtener firma de subida");

        // 4. Upload to Cloudinary
        const result = await uploadSignedToCloudinary({
          cloudName: signed.cloudName,
          apiKey: signed.apiKey,
          timestamp: signed.timestamp,
          signature: signed.signature,
          folder: signed.folder,
          publicId: signed.publicId,
          fileBlob: blob,
        });

        // 5. Register RAW image
        await addDocumentImage({
          variables: {
            input: {
              documentId,
              kind: "RAW",
              url: result.secure_url,
              publicId: result.public_id,
              width: result.width,
              height: result.height,
              bytes: result.bytes,
              mimeType: `image/${result.format}`,
              captureMeta: {
                device: navigator.userAgent,
                browser: navigator.userAgent,
                w: metadata?.captureMeta?.w ?? null,
                h: metadata?.captureMeta?.h ?? null,
                blurVar: metadata?.captureMeta?.blurVar ?? null,
                glarePct: metadata?.captureMeta?.glarePct ?? null,
                ts: metadata?.captureMeta?.capturedAt || new Date().toISOString(),
              },
            },
          },
        });

        // 6. Enqueue OCR (fire-and-forget, non-blocking)
        try {
          await enqueueDocumentOcr({ variables: { input: { documentId } } });
        } catch {
          // OCR enqueue failure is non-fatal — document is already saved
        }

        setCreatedDocId(documentId);
        setUploadState("success");
      } catch (err) {
        console.error("[NewDocumentPage] upload pipeline error:", err);
        setUploadError(err.message || "Error al subir el documento");
        setUploadState("error");
      }
    },
    [documentType, createDocument, getSignedUpload, addDocumentImage, enqueueDocumentOcr]
  );

  const handleRetryUpload = useCallback(() => {
    if (canvasRef.current) {
      handleStep2Capture(canvasRef.current, {});
    }
  }, [handleStep2Capture]);

  const handleResetWizard = useCallback(() => {
    setStep(1);
    setDocumentType(null);
    setUploadState("idle");
    setUploadError(null);
    setCreatedDocId(null);
    canvasRef.current = null;
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }, []);

  const handleRetryCapture = useCallback(() => {
    setStep(2);
    setUploadState("idle");
    setUploadError(null);
    canvasRef.current = null;
  }, []);

  const handleCancel = useCallback(() => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    navigate("/documents");
  }, [navigate]);

  const docConfig = DOCUMENT_TYPES[documentType?.toUpperCase()] || DOCUMENT_TYPES.OTHER;

  return (
    <div className="min-h-screen bg-slate-50">
      {step === 1 && (
        <>
          <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-slate-200">
            <div className="max-w-lg mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={handleCancel}
                  className="p-2 -ml-2 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <svg
                    className="w-6 h-6 text-slate-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <h1 className="text-lg font-semibold text-slate-900">Nuevo Documento</h1>
                <span className="text-sm text-slate-500">Paso {step}/3</span>
              </div>
              <div className="mt-4 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-500 rounded-full transition-all duration-500"
                  style={{ width: `${(step / 3) * 100}%` }}
                />
              </div>
            </div>
          </header>
          <main className="max-w-lg mx-auto">
            <WizardStep1
              selectedType={documentType}
              onSelectType={setDocumentType}
              onNext={handleStep1Next}
              isCreating={false}
            />
          </main>
        </>
      )}

      {step === 2 && (
        <WizardStep2
          documentType={documentType}
          onCapture={handleStep2Capture}
          onCancel={handleCancel}
        />
      )}

      {step === 3 && (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            {/* Uploading */}
            {uploadState === "uploading" && (
              <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-slate-200 text-center">
                <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-sky-50 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-sky-500 animate-spin"
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
                <h2 className="text-lg font-semibold text-slate-900 mb-1">Subiendo documento...</h2>
                <p className="text-sm text-slate-500">Creando registro y subiendo imagen</p>

                {previewUrlRef.current && (
                  <div className="mt-5 rounded-2xl overflow-hidden ring-1 ring-slate-200 opacity-60">
                    <img src={previewUrlRef.current} alt="Preview" className="w-full block" />
                  </div>
                )}
              </div>
            )}

            {/* Success */}
            {uploadState === "success" && (
              <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-slate-200">
                <div className="text-center mb-5">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-50 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-emerald-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900 mb-1">Documento guardado</h2>
                  <p className="text-sm text-slate-500">La imagen fue subida exitosamente</p>
                </div>

                {/* Status badge */}
                <div className="flex justify-center mb-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold ring-1 ring-emerald-200">
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    CAPTURE_ACCEPTED
                  </span>
                </div>

                {/* Preview image */}
                {previewUrlRef.current && (
                  <div className="rounded-2xl overflow-hidden ring-1 ring-slate-200 mb-4">
                    <img
                      src={previewUrlRef.current}
                      alt="Documento capturado"
                      className="w-full block"
                    />
                  </div>
                )}

                {/* Document type label */}
                <div className="text-center mb-5">
                  <span className="text-xs text-slate-400">Tipo: {docConfig.label}</span>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <button
                    onClick={() => navigate(`/documents/${createdDocId}`)}
                    className="w-full bg-black text-white rounded-full px-5 py-3 font-semibold hover:bg-slate-800 active:scale-[0.98] transition-all"
                  >
                    Ver documento
                  </button>
                  <button
                    onClick={handleResetWizard}
                    className="w-full border border-slate-200 rounded-full px-5 py-3 font-semibold hover:bg-slate-50 transition-colors"
                  >
                    Capturar otro
                  </button>
                </div>
              </div>
            )}

            {/* Error */}
            {uploadState === "error" && (
              <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-slate-200">
                <div className="text-center mb-5">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-red-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900 mb-1">Error al subir</h2>
                </div>

                {/* Error message */}
                <div
                  role="alert"
                  aria-live="assertive"
                  className="mb-5 p-4 rounded-xl bg-red-50 ring-1 ring-red-200 text-sm text-red-700"
                >
                  {uploadError}
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <button
                    onClick={handleRetryUpload}
                    className="w-full bg-black text-white rounded-full px-5 py-3 font-semibold hover:bg-slate-800 active:scale-[0.98] transition-all"
                  >
                    Reintentar
                  </button>
                  <button
                    onClick={handleRetryCapture}
                    className="w-full border border-slate-200 rounded-full px-5 py-3 font-semibold hover:bg-slate-50 transition-colors"
                  >
                    Escanear de nuevo
                  </button>
                  <button
                    onClick={handleCancel}
                    className="w-full text-sm text-slate-500 hover:text-slate-700 py-2 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NewDocumentPage;
