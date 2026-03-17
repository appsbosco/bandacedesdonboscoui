import React, { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@apollo/client";
import PropTypes from "prop-types";
import {
  CREATE_DOCUMENT,
  ADD_DOCUMENT_IMAGE,
  GET_SIGNED_UPLOAD,
  UPSERT_DOCUMENT_EXTRACTED_DATA,
  ENQUEUE_DOCUMENT_OCR,
  MY_DOCUMENTS,
} from "../../graphql/documents/index.js";
import { WizardStep1 } from "./WizardStep1.jsx";
import { WizardStep2 } from "./WizardStep2";
import { WizardStep3 } from "./WizardStep3";
import { canvasToBlob } from "../../utils/uploadToCloudinary.js";
import { uploadSignedToCloudinary } from "../../services/cloudinarySignedUpload.js";
import { generateAllImageVariants } from "../../utils/imageProcessing.js";
import { DOCUMENT_TYPES, SCANNER_CONFIG } from "../../utils/constants";

// Document types that use the OCR/MRZ extraction step
const OCR_TYPES = new Set(["PASSPORT", "VISA"]);
const ALLOWED_OTHER_FILE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function getApiBaseUrl() {
  const graphqlUrl = process.env.REACT_APP_GRAPHQL_URL;
  if (!graphqlUrl) return "";

  try {
    const parsed = new URL(graphqlUrl);
    return parsed.origin;
  } catch (error) {
    return "";
  }
}

function normalizeMimeType(type) {
  if (!type) return type;
  if (type === "image/pdf") return "application/pdf";
  return type;
}

function isPdfMimeType(type) {
  return normalizeMimeType(type) === "application/pdf";
}

function buildPdfPreviewUrl(url) {
  if (!url) return url;
  if (!url.startsWith("https://res.cloudinary.com/")) return url;
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) return url;
  return `${apiBaseUrl}/api/pdf-preview?url=${encodeURIComponent(url)}`;
}

function FilePreview({ url, mimeType, alt }) {
  if (!url) return null;

  if (isPdfMimeType(mimeType)) {
    return (
      <div className="rounded-2xl overflow-hidden ring-1 ring-slate-200 bg-slate-50">
        <iframe
          src={buildPdfPreviewUrl(url)}
          title={alt || "Vista previa PDF"}
          className="w-full h-72 block"
        />
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden ring-1 ring-slate-200">
      <img src={url} alt={alt} className="w-full block" />
    </div>
  );
}

function NewDocumentPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [documentType, setDocumentType] = useState(null);

  // Step 3 (OCR extraction) state
  const [capturedCanvas, setCapturedCanvas] = useState(null);
  const [captureMetadata, setCaptureMetadata] = useState(null);

  // Step 4 (upload/result) state
  const [uploadState, setUploadState] = useState("idle");
  const [uploadError, setUploadError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState("");
  const [createdDocId, setCreatedDocId] = useState(null);
  const previewUrlRef = useRef(null);
  const previewMimeTypeRef = useRef(null);
  const canvasRef = useRef(null);

  const [createDocument] = useMutation(CREATE_DOCUMENT, {
    refetchQueries: [{ query: MY_DOCUMENTS }],
  });
  const [addDocumentImage] = useMutation(ADD_DOCUMENT_IMAGE);
  const [getSignedUpload] = useMutation(GET_SIGNED_UPLOAD);
  const [upsertExtractedData] = useMutation(UPSERT_DOCUMENT_EXTRACTED_DATA);
  const [enqueueDocumentOcr] = useMutation(ENQUEUE_DOCUMENT_OCR);

  const needsOCR = OCR_TYPES.has(documentType?.toUpperCase());
  const totalSteps = needsOCR ? 4 : 3;

  const handleStep1Next = useCallback(() => {
    if (!documentType) return;
    setStep(2);
  }, [documentType]);

  // Called when CameraAutoScanner captures an image
  const handleStep2Capture = useCallback(
    (canvas, metadata) => {
      canvasRef.current = canvas;
      setCapturedCanvas(canvas);
      setCaptureMetadata(metadata);

      if (needsOCR) {
        setStep(3);
      } else {
        doUpload(canvas, metadata, null);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [needsOCR, documentType]
  );

  // Called when WizardStep3 confirms extracted data
  const handleOCRConfirm = useCallback(
    (extractedData) => {
      doUpload(canvasRef.current, captureMetadata, extractedData);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [captureMetadata, documentType]
  );

  /**
   * Core upload pipeline:
   * 1. Create document record
   * 2. Generate image variants (RAW, NORMALIZED, MRZ_ROI)
   * 3. Upload each variant via signed upload
   * 4. Register each image with backend
   * 5. Save extracted data
   * 6. Enqueue server-side OCR
   */
  const doUpload = useCallback(
    async (canvas, metadata, extractedData) => {
      setStep(needsOCR ? 4 : 3);
      setUploadState("uploading");
      setUploadError(null);
      setUploadProgress("Preparando...");

      // Create preview
      try {
        const previewBlob = await canvasToBlob(canvas, "image/jpeg", 0.6);
        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = URL.createObjectURL(previewBlob);
        previewMimeTypeRef.current = previewBlob.type;
      } catch {
        // Preview is non-critical
      }

      try {
        // 1. Create document
        setUploadProgress("Creando registro...");
        const { data: docData } = await createDocument({
          variables: { input: { type: documentType } },
        });
        const documentId = docData?.createDocument?.id || docData?.createDocument?._id;
        if (!documentId) throw new Error("No se pudo crear el documento");

        // 2. Generate image variants
        setUploadProgress("Procesando imagenes...");
        const aspectRatio = SCANNER_CONFIG.aspectRatios?.[documentType?.toUpperCase()] || 1.42;
        const variants = generateAllImageVariants(canvas, documentType, aspectRatio);

        // 3. Upload RAW
        setUploadProgress("Subiendo imagen original...");
        await uploadImageVariant(documentId, "RAW", variants.raw, metadata);

        // 4. Upload NORMALIZED
        if (variants.normalized) {
          setUploadProgress("Subiendo imagen normalizada...");
          await uploadImageVariant(documentId, "NORMALIZED", variants.normalized, null);
        }

        // 5. Upload MRZ_ROI
        if (variants.mrzRoi) {
          setUploadProgress("Subiendo region MRZ...");
          await uploadImageVariant(documentId, "MRZ_ROI", variants.mrzRoi, null);
        }

        // 6. Save extracted data if we have it (from OCR step)
        if (extractedData) {
          setUploadProgress("Guardando datos extraidos...");
          await upsertExtractedData({
            variables: {
              input: {
                documentId,
                ...extractedData,
              },
            },
          });
        }

        // 7. Enqueue server-side OCR (fire-and-forget for PASSPORT/VISA)
        if (needsOCR) {
          try {
            await enqueueDocumentOcr({ variables: { input: { documentId } } });
          } catch {
            // Non-fatal — server OCR is supplementary
          }
        }

        setCreatedDocId(documentId);
        setUploadState("success");
      } catch (err) {
        console.error("[NewDocumentPage] upload pipeline error:", err);
        setUploadError(err.message || "Error al subir el documento");
        setUploadState("error");
      }
    },
    [documentType, needsOCR, createDocument, getSignedUpload, addDocumentImage, upsertExtractedData, enqueueDocumentOcr]
  );

  /**
   * Upload a single image variant: get signed URL, upload to Cloudinary, register with backend.
   */
  const uploadImageVariant = useCallback(
    async (documentId, kind, canvas, metadata) => {
      const blob = await canvasToBlob(canvas, "image/jpeg", kind === "RAW" ? 0.92 : 0.85);

      const { data: signData } = await getSignedUpload({
        variables: { input: { documentId, kind, mimeType: blob.type } },
      });
      const signed = signData?.getSignedUpload;
      if (!signed) throw new Error(`No se pudo obtener firma para ${kind}`);

      const result = await uploadSignedToCloudinary({
        cloudName: signed.cloudName,
        apiKey: signed.apiKey,
        timestamp: signed.timestamp,
        signature: signed.signature,
        publicId: signed.publicId,
        fileBlob: blob,
        resourceType: signed.resourceType,
      });

      const imageInput = {
        documentId,
        kind,
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        mimeType: `image/${result.format}`,
      };

      // Only attach captureMeta to RAW image
      if (kind === "RAW" && metadata) {
        imageInput.captureMeta = {
          device: navigator.userAgent,
          browser: navigator.userAgent,
          w: metadata?.captureMeta?.w ?? canvas.width,
          h: metadata?.captureMeta?.h ?? canvas.height,
          blurVar: metadata?.captureMeta?.blurVar ?? null,
          glarePct: metadata?.captureMeta?.glarePct ?? null,
          ts: metadata?.captureMeta?.capturedAt || new Date().toISOString(),
        };
      }

      await addDocumentImage({ variables: { input: imageInput } });
    },
    [getSignedUpload, addDocumentImage]
  );

  // File upload handler (for OTHER type)
  const handleStep2File = useCallback(
    async (file) => {
      if (!ALLOWED_OTHER_FILE_TYPES.has(normalizeMimeType(file?.type))) {
        setStep(2);
        setUploadState("error");
        setUploadError("Solo se permiten imagenes JPG, PNG o WEBP.");
        return;
      }

      setStep(needsOCR ? 4 : 3);
      setUploadState("uploading");
      setUploadError(null);
      setUploadProgress("Subiendo archivo...");

      try {
        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = URL.createObjectURL(file);
        previewMimeTypeRef.current = normalizeMimeType(file.type);
      } catch {
        // non-critical
      }

      try {
        const { data: docData } = await createDocument({
          variables: { input: { type: documentType } },
        });
        const documentId = docData?.createDocument?._id || docData?.createDocument?.id;
        if (!documentId) throw new Error("No se pudo crear el documento");

        const { data: signData } = await getSignedUpload({
          variables: {
            input: {
              documentId,
              kind: "RAW",
              mimeType: normalizeMimeType(file.type),
            },
          },
        });
        const signed = signData?.getSignedUpload;
        if (!signed) throw new Error("No se pudo obtener firma de subida");

        const result = await uploadSignedToCloudinary({
          cloudName: signed.cloudName,
          apiKey: signed.apiKey,
          timestamp: signed.timestamp,
          signature: signed.signature,
          publicId: signed.publicId,
          fileBlob: file,
          resourceType: signed.resourceType,
        });

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
              mimeType: normalizeMimeType(file.type),
            },
          },
        });

        setCreatedDocId(documentId);
        setUploadState("success");
      } catch (err) {
        console.error("[NewDocumentPage] file upload error:", err);
        setUploadError(err.message || "Error al subir el documento");
        setUploadState("error");
      }
    },
    [documentType, needsOCR, createDocument, getSignedUpload, addDocumentImage]
  );

  const handleRetryUpload = useCallback(() => {
    if (canvasRef.current) {
      doUpload(canvasRef.current, captureMetadata, null);
    }
  }, [doUpload, captureMetadata]);

  const handleResetWizard = useCallback(() => {
    setStep(1);
    setDocumentType(null);
    setUploadState("idle");
    setUploadError(null);
    setUploadProgress("");
    setCreatedDocId(null);
    setCapturedCanvas(null);
    setCaptureMetadata(null);
    canvasRef.current = null;
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    previewMimeTypeRef.current = null;
  }, []);

  const handleRetryCapture = useCallback(() => {
    setStep(2);
    setUploadState("idle");
    setUploadError(null);
    setUploadProgress("");
    setCapturedCanvas(null);
    setCaptureMetadata(null);
    canvasRef.current = null;
  }, []);

  const handleCancel = useCallback(() => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewMimeTypeRef.current = null;
    navigate("/documents");
  }, [navigate]);

  const docConfig = DOCUMENT_TYPES[documentType?.toUpperCase()] || DOCUMENT_TYPES.OTHER;
  const currentStep = step;
  const isUploadStep = needsOCR ? step === 4 : step === 3;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Step 1: Type selection */}
      {currentStep === 1 && (
        <>
          <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-slate-200">
            <div className="max-w-lg mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <button onClick={handleCancel} className="p-2 -ml-2 rounded-xl hover:bg-slate-100 transition-colors">
                  <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h1 className="text-lg font-semibold text-slate-900">Nuevo Documento</h1>
                <span className="text-sm text-slate-500">Paso 1/{totalSteps}</span>
              </div>
              <div className="mt-4 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-sky-500 rounded-full transition-all duration-500" style={{ width: `${(1 / totalSteps) * 100}%` }} />
              </div>
            </div>
          </header>
          <main className="max-w-lg mx-auto">
            <WizardStep1 selectedType={documentType} onSelectType={setDocumentType} onNext={handleStep1Next} isCreating={false} />
          </main>
        </>
      )}

      {/* Step 2: Camera capture */}
      {currentStep === 2 && (
        <WizardStep2 documentType={documentType} onCapture={handleStep2Capture} onFileUpload={handleStep2File} onCancel={handleCancel} />
      )}

      {/* Step 3: OCR extraction (only for PASSPORT/VISA) */}
      {currentStep === 3 && needsOCR && (
        <WizardStep3
          documentType={documentType}
          capturedCanvas={capturedCanvas}
          onConfirm={handleOCRConfirm}
          onRetry={handleRetryCapture}
          onCancel={handleCancel}
          isSaving={uploadState === "uploading"}
        />
      )}

      {/* Upload/Result step */}
      {isUploadStep && (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            {/* Uploading */}
            {uploadState === "uploading" && (
              <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-slate-200 text-center">
                <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-sky-50 flex items-center justify-center">
                  <svg className="w-8 h-8 text-sky-500 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-slate-900 mb-1">Subiendo documento...</h2>
                <p className="text-sm text-slate-500">{uploadProgress || "Procesando"}</p>

                {previewUrlRef.current && (
                  <div className="mt-5 opacity-60">
                    <FilePreview
                      url={previewUrlRef.current}
                      mimeType={previewMimeTypeRef.current}
                      alt="Preview"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Success */}
            {uploadState === "success" && (
              <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-slate-200">
                <div className="text-center mb-5">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-50 flex items-center justify-center">
                    <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900 mb-1">Documento guardado</h2>
                  <p className="text-sm text-slate-500">
                    {needsOCR
                      ? "Imagenes y datos guardados exitosamente"
                      : "La imagen fue subida exitosamente"}
                  </p>
                </div>

                <div className="flex justify-center mb-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold ring-1 ring-emerald-200">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {needsOCR ? "RAW + NORMALIZED + MRZ" : "CAPTURE_ACCEPTED"}
                  </span>
                </div>

                {previewUrlRef.current && (
                  <div className="mb-4">
                    <FilePreview
                      url={previewUrlRef.current}
                      mimeType={previewMimeTypeRef.current}
                      alt="Documento capturado"
                    />
                  </div>
                )}

                <div className="text-center mb-5">
                  <span className="text-xs text-slate-400">Tipo: {docConfig.label}</span>
                </div>

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
                    <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900 mb-1">Error al subir</h2>
                </div>

                <div role="alert" aria-live="assertive" className="mb-5 p-4 rounded-xl bg-red-50 ring-1 ring-red-200 text-sm text-red-700">
                  {uploadError}
                </div>

                <div className="space-y-3">
                  <button onClick={handleRetryUpload} className="w-full bg-black text-white rounded-full px-5 py-3 font-semibold hover:bg-slate-800 active:scale-[0.98] transition-all">
                    Reintentar
                  </button>
                  <button onClick={handleRetryCapture} className="w-full border border-slate-200 rounded-full px-5 py-3 font-semibold hover:bg-slate-50 transition-colors">
                    Escanear de nuevo
                  </button>
                  <button onClick={handleCancel} className="w-full text-sm text-slate-500 hover:text-slate-700 py-2 transition-colors">
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

FilePreview.propTypes = {
  url: PropTypes.string,
  mimeType: PropTypes.string,
  alt: PropTypes.string,
};

export default NewDocumentPage;
