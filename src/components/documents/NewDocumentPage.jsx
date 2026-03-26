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
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
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

// ─── Premium step progress ────────────────────────────────────────────────────
function ProgressBar({ step, total }) {
  return (
    <div className="px-6 pt-5 pb-4">
      <div className="flex items-start">
        {Array.from({ length: total }, (_, i) => (
          <React.Fragment key={STEPS[i] || `step-${i + 1}`}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300
                  ${
                    i < step
                      ? "bg-emerald-500 text-white"
                      : i === step
                      ? "bg-slate-900 text-white ring-4 ring-slate-900/10"
                      : "bg-slate-100 text-slate-400"
                  }`}
              >
                {i < step ? (
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider transition-colors duration-200
                  ${
                    i === step ? "text-slate-900" : i < step ? "text-emerald-600" : "text-slate-400"
                  }`}
              >
                {STEPS[i]}
              </span>
            </div>
            {i < total - 1 && (
              <div className="flex-1 mx-2 mt-4">
                <div className="h-0.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: i < step ? "100%" : "0%",
                      backgroundColor: i < step ? "#34d399" : "transparent",
                    }}
                  />
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ─── Success state ────────────────────────────────────────────────────────────
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

// ─── Shared loading state ─────────────────────────────────────────────────────
function ProcessingState({ phase }) {
  const isProcessing = phase === "processing";
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-8 gap-6">
      <div className="relative flex items-center justify-center w-20 h-20 mt-10">
        <div className="absolute inset-0 rounded-full border-2 border-slate-200 border-t-slate-900 animate-spin" />
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
          {isProcessing ? (
            <svg
              className="w-7 h-7 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
          ) : (
            <svg
              className="w-7 h-7 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
          )}
        </div>
      </div>

      <div className="text-center space-y-1.5 mt-10">
        <p className="text-base font-semibold text-slate-900">
          {isProcessing ? "Analizando documento…" : "Subiendo documento…"}
        </p>
        <p className="text-sm text-slate-500">
          {isProcessing
            ? "Extrayendo información automáticamente"
            : "Preparando imagen para análisis"}
        </p>
      </div>

      <div className="w-full max-w-[180px]">
        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-slate-900 rounded-full"
            style={{ width: "60%", animation: "indeterminate-bar 1.4s ease-in-out infinite" }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Upload error state ───────────────────────────────────────────────────────
function UploadErrorState({ error, onRetry }) {
  return (
    <div className="p-5">
      <div className="rounded-3xl bg-white ring-1 ring-red-100 shadow-sm overflow-hidden">
        <div className="p-6 flex flex-col items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-red-500"
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
          <div>
            <h3 className="font-semibold text-slate-900 mb-0.5">Error al subir</h3>
            <p className="text-sm text-slate-500">{error}</p>
          </div>
          <button
            onClick={onRetry}
            className="w-full py-4 rounded-2xl bg-slate-900 text-white text-sm font-semibold transition-all active:scale-[0.99] shadow-sm"
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
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

  const handleCaptured = useCallback(
    async (blob, captureMeta) => {
      setUploadError(null);
      setUploading(true);
      setProcessingPhase("uploading");
      setOcrExtracted(null);
      try {
        const { data: createData } = await createDocument({ variables: { type: docType } });
        const docId = createData.createDocument.id;
        setDocumentId(docId);

        const { data: signData } = await getSignedUpload({
          variables: { documentId: docId, kind: "RAW" },
        });
        const signed = signData.getSignedUpload;

        const uploadResult = await uploadToCloudinary(blob, signed);

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

        if (OCR_TYPES.includes(docType)) {
          setProcessingPhase("processing");
          try {
            const { data: ocrData } = await processDocumentOcr({
              variables: { documentId: docId },
            });
            setOcrExtracted(ocrData?.processDocumentOcr || null);
          } catch (ocrErr) {
            console.warn(
              "[NewDocumentPage] sync OCR failed, falling back to polling:",
              ocrErr.message
            );
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
    <DashboardLayout>
      <DashboardNavbar />
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Header with progress */}
        <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
          <div className="max-w-lg mx-auto">
            <ProgressBar step={step} total={STEPS.length} />
          </div>
        </div>

        <style>{`
        @keyframes document-success-progress {
          from { width: 0%; }
          to { width: 100%; }
        }
        @keyframes indeterminate-bar {
          0%   { transform: translateX(-100%); width: 60%; }
          50%  { transform: translateX(83%);   width: 60%; }
          100% { transform: translateX(283%);  width: 60%; }
        }
      `}</style>

        {/* Content */}
        <div className="flex-1 max-w-lg mx-auto w-full flex flex-col">
          {/* Success */}
          {successState && !uploading && !uploadError && (
            <SuccessState title={successState.title} message={successState.message} />
          )}

          {/* Settings loading */}
          {settingsLoading && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
              <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-slate-700 animate-spin" />
              <p className="text-sm text-slate-500">Cargando configuración…</p>
            </div>
          )}

          {/* Uploading / Processing */}
          {!successState && !settingsLoading && uploading && (
            <ProcessingState phase={processingPhase} />
          )}

          {/* Upload error */}
          {!successState && !settingsLoading && uploadError && !uploading && (
            <UploadErrorState
              error={uploadError}
              onRetry={() => {
                setUploadError(null);
                setStep(1);
              }}
            />
          )}

          {/* Wizard steps */}
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
    </DashboardLayout>
  );
}
