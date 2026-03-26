/* eslint-disable react/prop-types */

import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@apollo/client";
import {
  CREATE_DOCUMENT,
  GET_SIGNED_UPLOAD,
  ADD_DOCUMENT_IMAGE,
  UPSERT_DOCUMENT_EXTRACTED_DATA,
  ENQUEUE_DOCUMENT_OCR,
  PROCESS_DOCUMENT_OCR,
  DOCUMENT_VISIBILITY_SETTINGS,
} from "../../graphql/documents/documents.gql";
import { OCR_TYPES, DOCUMENT_TYPES } from "../../utils/constants";
import { GET_USERS_BY_ID } from "../../graphql/queries";
import WizardStep1 from "./WizardStep1";
import WizardStep2 from "./WizardStep2";
import WizardStep3 from "./WizardStep3";
import { isDocumentAdmin, SENSITIVE_DOCUMENT_TYPES } from "./documentAccess";

const STEPS = ["Tipo", "Captura", "Revisión"];
const DIRECT_UPLOAD_COMPLETE_TYPES = new Set(["OTHER"]);
const SUCCESS_REDIRECT_MS = 1800;

async function uploadToCloudinary(blob, signedData) {
  const formData = new FormData();
  formData.append("file", blob);
  formData.append("api_key", signedData.apiKey);
  formData.append("timestamp", String(signedData.timestamp));
  formData.append("signature", signedData.signature);
  // public_id must match exactly what was signed on the backend
  if (signedData.publicId) formData.append("public_id", signedData.publicId);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${signedData.cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText);
    throw new Error(`Cloudinary: ${body || res.statusText}`);
  }
  return res.json();
}

function ProgressBar({ step, total }) {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {Array.from({ length: total }, (_, i) => (
        <React.Fragment key={STEPS[i] || `step-${i + 1}`}>
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
            ${
              i < step
                ? "bg-black text-white"
                : i === step
                ? "border-2 border-indigo-500 text-indigo-500"
                : "border-2 border-gray-200 text-gray-400"
            }`}
          >
            {i < step ? "✓" : i + 1}
          </div>
          {i < total - 1 && (
            <div className={`flex-1 h-0.5 ${i < step ? "bg-black" : "bg-gray-200"}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function SuccessState({ title, message }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-emerald-200 bg-white shadow-[0_24px_80px_-32px_rgba(16,185,129,0.45)]">
        <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_58%),linear-gradient(135deg,#ecfdf5,#f8fafc)] px-6 py-10 text-center">
          <div className="absolute inset-0 opacity-70">
            <div className="absolute left-8 top-8 h-20 w-20 animate-pulse rounded-full bg-emerald-200/60 blur-2xl" />
            <div
              className="absolute bottom-6 right-10 h-24 w-24 rounded-full bg-lime-200/60 blur-2xl"
              style={{ animation: "pulse 1.9s ease-in-out infinite" }}
            />
          </div>

          <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-emerald-200/70 animate-ping" />
            <div className="absolute inset-2 rounded-full bg-emerald-300/60" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          <h2 className="relative text-2xl font-semibold text-slate-900">{title}</h2>
          <p className="relative mt-2 text-sm text-slate-600">{message}</p>
        </div>

        <div className="px-6 pb-6 pt-4">
          <div className="h-2 overflow-hidden rounded-full bg-emerald-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-lime-400"
              style={{
                animation: `document-success-progress ${SUCCESS_REDIRECT_MS}ms linear forwards`,
              }}
            />
          </div>
          <p className="mt-3 text-center text-xs font-medium uppercase tracking-[0.18em] text-emerald-700">
            Redirigiendo…
          </p>
        </div>
      </div>
    </div>
  );
}

export default function NewDocumentPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [docType, setDocType] = useState(null);
  const [documentId, setDocumentId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [successState, setSuccessState] = useState(null);

  const [ocrExtracted, setOcrExtracted] = useState(null);
  const [processingPhase, setProcessingPhase] = useState(null); // null | 'uploading' | 'processing'

  const [createDocument] = useMutation(CREATE_DOCUMENT);
  const [getSignedUpload] = useMutation(GET_SIGNED_UPLOAD);
  const [addDocumentImage] = useMutation(ADD_DOCUMENT_IMAGE);
  const [upsertExtractedData] = useMutation(UPSERT_DOCUMENT_EXTRACTED_DATA);
  const [enqueueDocumentOcr] = useMutation(ENQUEUE_DOCUMENT_OCR);
  const [processDocumentOcr] = useMutation(PROCESS_DOCUMENT_OCR);
  const { data: userData } = useQuery(GET_USERS_BY_ID);
  const { data: settingsData, loading: settingsLoading } = useQuery(DOCUMENT_VISIBILITY_SETTINGS, {
    fetchPolicy: "cache-and-network",
  });

  const currentUser = userData?.getUser;
  const userIsAdmin = isDocumentAdmin(currentUser);
  const restrictSensitiveUploadsToAdmins =
    settingsData?.documentVisibilitySettings?.restrictSensitiveUploadsToAdmins ?? true;

  const filteredDocumentTypes = Object.values(DOCUMENT_TYPES).filter((type) => {
    if (!restrictSensitiveUploadsToAdmins) return true;
    if (userIsAdmin) return true;
    return !SENSITIVE_DOCUMENT_TYPES.includes(type.id);
  });

  useEffect(() => {
    if (!successState?.redirectTo) return undefined;

    const timeoutId = window.setTimeout(() => {
      navigate(successState.redirectTo);
    }, SUCCESS_REDIRECT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [navigate, successState]);

  const showSuccessAndRedirect = useCallback((title, message, redirectTo = "/documents") => {
    setSuccessState({ title, message, redirectTo });
  }, []);

  // Step 2 → file/blob captured
  const handleCaptured = useCallback(
    async (blob, captureMeta) => {
      setUploadError(null);
      setUploading(true);
      setProcessingPhase("uploading");
      setOcrExtracted(null);
      try {
        // 1. Create document
        const { data: createData } = await createDocument({ variables: { type: docType } });
        const docId = createData.createDocument.id;
        setDocumentId(docId);

        // 2. Get signed upload URL
        const { data: signData } = await getSignedUpload({
          variables: { documentId: docId, kind: "RAW" },
        });
        const signed = signData.getSignedUpload;

        // 3. Upload to Cloudinary
        const uploadResult = await uploadToCloudinary(blob, signed);

        // 4. Register image on document
        const imageInput = {
          kind: "RAW",
          url: uploadResult.secure_url,
          provider: "CLOUDINARY",
          publicId: uploadResult.public_id,
          width: uploadResult.width,
          height: uploadResult.height,
          bytes: uploadResult.bytes,
          mimeType:
            uploadResult.resource_type === "image" ? "image/jpeg" : "application/octet-stream",
        };
        if (captureMeta) imageInput.captureMeta = captureMeta;
        await addDocumentImage({ variables: { documentId: docId, image: imageInput } });

        if (DIRECT_UPLOAD_COMPLETE_TYPES.has(docType)) {
          showSuccessAndRedirect(
            "Documento subido correctamente",
            "La imagen quedó guardada y ya aparece en tu lista de documentos."
          );
          return;
        }

        // 5. Process OCR synchronously (no polling needed)
        if (OCR_TYPES.includes(docType)) {
          setProcessingPhase("processing");
          try {
            const { data: ocrData } = await processDocumentOcr({
              variables: { documentId: docId },
            });
            // Pass extracted data directly to Step 3 — no polling needed
            setOcrExtracted(ocrData?.processDocumentOcr || null);
          } catch (ocrErr) {
            console.warn("[NewDocumentPage] sync OCR failed, falling back to polling:", ocrErr.message);
            // Fallback: enqueue for the worker to process and let Step 3 poll
            try {
              await enqueueDocumentOcr({ variables: { documentId: docId } });
            } catch (_) {
              // Already enqueued or max attempts — Step 3 will handle it
            }
          }
        }

        setStep(2);
      } catch (err) {
        console.error("[NewDocumentPage] upload error:", err);
        setUploadError(err.message || "Error al subir el documento. Intente nuevamente.");
      } finally {
        setUploading(false);
        setProcessingPhase(null);
      }
    },
    [
      docType,
      createDocument,
      getSignedUpload,
      addDocumentImage,
      processDocumentOcr,
      enqueueDocumentOcr,
      showSuccessAndRedirect,
    ]
  );

  // Step 3 → OCR data confirmed
  const handleConfirm = useCallback(
    async (formData) => {
      try {
        if (documentId) {
          const clean = Object.fromEntries(
            Object.entries(formData).filter(([, v]) => v !== "" && v !== null && v !== undefined)
          );
          if (Object.keys(clean).length > 0) {
            await upsertExtractedData({ variables: { documentId, data: clean } });
          }
        }
        showSuccessAndRedirect(
          "Documento guardado",
          "Los datos y la imagen se guardaron correctamente."
        );
      } catch (err) {
        console.error("[NewDocumentPage] save error:", err);
      }
    },
    [documentId, upsertExtractedData, showSuccessAndRedirect]
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-lg mx-auto">
          <ProgressBar step={step} total={STEPS.length} />
          <p className="text-center text-xs text-gray-400 pb-3">{STEPS[step]}</p>
        </div>
      </div>

      <style>{`
        @keyframes document-success-progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>

      {/* Content */}
      <div className="flex-1 max-w-lg mx-auto w-full">
        {successState && !uploading && !uploadError && (
          <SuccessState title={successState.title} message={successState.message} />
        )}

        {settingsLoading && (
          <div className="flex flex-col items-center justify-center p-12 gap-3">
            <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
            <p className="text-sm text-gray-500">Cargando configuración…</p>
          </div>
        )}

        {!successState && !settingsLoading && uploading && (
          <div className="flex flex-col items-center justify-center p-12 gap-3">
            <div className="animate-spin w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full" />
            <p className="text-base font-semibold text-gray-800">
              {processingPhase === "processing"
                ? "Analizando documento…"
                : "Subiendo documento…"}
            </p>
            <p className="text-sm text-gray-400">
              {processingPhase === "processing"
                ? "Extrayendo información automáticamente"
                : "Preparando imagen para análisis"}
            </p>
          </div>
        )}

        {!successState && !settingsLoading && uploadError && !uploading && (
          <div className="m-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-600">{uploadError}</p>
            <button
              onClick={() => {
                setUploadError(null);
                setStep(1);
              }}
              className="mt-2 text-xs text-red-500 underline"
            >
              Intentar de nuevo
            </button>
          </div>
        )}

        {!successState && !settingsLoading && !uploading && !uploadError && (
          <>
            {step === 0 && (
              <WizardStep1
                selectedType={docType}
                onSelectType={(type) => {
                  setDocType(type);
                }}
                onNext={() => setStep(1)}
                isCreating={false}
                documentTypes={filteredDocumentTypes}
                helperMessage={
                  restrictSensitiveUploadsToAdmins && !userIsAdmin
                    ? "Pasaporte, visa y permiso de salida no se deben de subir de momento"
                    : ""
                }
              />
            )}
            {step === 1 && docType && (
              <WizardStep2
                documentType={docType}
                onCaptured={handleCaptured}
                onBack={() => setStep(0)}
              />
            )}
            {step === 2 && (
              <WizardStep3
                documentId={documentId}
                documentType={docType}
                preloadedDocument={ocrExtracted}
                onConfirm={handleConfirm}
                onBack={() => setStep(1)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
