import React, { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useParams, useNavigate } from "react-router-dom";
import {
  DOCUMENT_BY_ID,
  DELETE_DOCUMENT,
  ENQUEUE_DOCUMENT_OCR,
  MY_DOCUMENTS,
  ALL_DOCUMENTS,
  SET_DOCUMENT_STATUS,
} from "../../graphql/documents/documents.gql";
import { GET_USERS_BY_ID } from "graphql/queries";
import { Badge } from "../ui/Badge";
import { Modal } from "../ui/Modal";
import { Skeleton } from "../ui/Skeleton";
import { useToast } from "../ui/Toast";
import {
  getStatusColor,
  getStatusLabel,
  getDocumentTypeLabel,
  getDocumentTypeIcon,
  maskDocumentNumber,
  OCR_POLLING_STATUSES,
  OCR_TERMINAL_STATUSES,
} from "../../utils/documentHelpers";
import {
  formatDate,
  formatDateTime,
  getExpirationColor,
  getExpirationText,
} from "../../utils/dateHelpers";
import PropTypes from "prop-types";

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 180000;

// Tipos que no usan OCR
const NON_OCR_TYPES = new Set(["OTHER", "PERMISO_SALIDA"]);

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

function isPdfMimeType(type) {
  return type === "application/pdf" || type === "image/pdf";
}

function buildPdfPreviewUrl(url, publicId) {
  if (!url && !publicId) return url;
  if (url && !url.startsWith("https://res.cloudinary.com/")) return url;
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) return url;
  const params = new URLSearchParams();
  if (url) params.set("url", url);
  if (publicId) params.set("publicId", publicId);
  return `${apiBaseUrl}/api/pdf-preview?${params.toString()}`;
}

function getCloudinaryPdfUrl(image) {
  if (!image) return null;

  const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
  if (image.publicId && cloudName) {
    const publicId = image.publicId.endsWith(".pdf") ? image.publicId : `${image.publicId}.pdf`;
    return `https://res.cloudinary.com/${cloudName}/raw/upload/${publicId}`;
  }

  if (!image.url) return image.url;
  return image.url.endsWith(".pdf") ? image.url : `${image.url}.pdf`;
}

function isAdminUser(user) {
  if (!user) return false;
  return user.role === "Admin" || user?.roles?.includes("Admin");
}

function getOwnerFullName(owner) {
  if (!owner || typeof owner === "string") return null;
  return (
    [owner.name, owner.firstSurName, owner.secondSurName].filter(Boolean).join(" ").trim() ||
    owner.email ||
    null
  );
}

// ── Owner info card (admin only) ──────────────────────────────────────────────
function OwnerCard({ owner }) {
  const name = getOwnerFullName(owner);
  if (!name && !owner?.email) return null;

  return (
    <div className="bg-violet-50 rounded-2xl border border-violet-200 p-5">
      <h3 className="text-xs font-semibold text-violet-500 uppercase tracking-wide mb-3">
        Propietario del documento
      </h3>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
          <svg
            className="w-5 h-5 text-violet-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
        <div className="min-w-0">
          {name && <p className="text-sm font-semibold text-slate-900 truncate">{name}</p>}
          {owner?.email && <p className="text-xs text-slate-500 truncate">{owner.email}</p>}
        </div>
      </div>
    </div>
  );
}

OwnerCard.propTypes = {
  owner: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({
      name: PropTypes.string,
      firstSurName: PropTypes.string,
      secondSurName: PropTypes.string,
      email: PropTypes.string,
    }),
  ]),
};

// ── DataField ─────────────────────────────────────────────────────────────────
function DataField({ label, value, sensitive }) {
  const [showSensitive, setShowSensitive] = useState(false);
  const displayValue = sensitive && !showSensitive ? maskDocumentNumber(value) : value;

  return (
    <div>
      <dt className="text-xs font-medium text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-900 flex items-center gap-2">
        {typeof displayValue === "string" ? displayValue : value}
        {sensitive && (
          <button
            onClick={() => setShowSensitive(!showSensitive)}
            className="text-sky-600 hover:text-sky-700 text-xs font-medium"
          >
            {showSensitive ? "Ocultar" : "Mostrar"}
          </button>
        )}
      </dd>
    </div>
  );
}

DataField.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  sensitive: PropTypes.bool,
};

DataField.defaultProps = { sensitive: false };

function DocumentFilePreview({
  image,
  alt,
  className = "",
  frameClassName = "",
  compact = false,
}) {
  if (!image?.url) return null;

  if (isPdfMimeType(image.mimeType)) {
    const pdfUrl = getCloudinaryPdfUrl(image);
    return (
      <div
        className={`bg-slate-50 ${className}`.trim()}
      >
        <iframe
          src={buildPdfPreviewUrl(pdfUrl, image.publicId)}
          title={alt || "Vista previa PDF"}
          className={`w-full border-0 ${compact ? "h-44" : "h-72"} ${frameClassName}`.trim()}
        />
      </div>
    );
  }

  return (
    <img
      src={image.url}
      alt={alt}
      className={className || "w-full block"}
    />
  );
}

DocumentFilePreview.propTypes = {
  image: PropTypes.shape({
    url: PropTypes.string,
    mimeType: PropTypes.string,
    publicId: PropTypes.string,
  }),
  alt: PropTypes.string,
  className: PropTypes.string,
  frameClassName: PropTypes.string,
  compact: PropTypes.bool,
};

// ── Main component ────────────────────────────────────────────────────────────
export function DocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [deleteModal, setDeleteModal] = useState(false);
  const [imageModal, setImageModal] = useState({ isOpen: false, image: null, index: 0 });
  const [imageZoom, setImageZoom] = useState(1);
  const [pollTimedOut, setPollTimedOut] = useState(false);
  const pollStartRef = useRef(null);

  useEffect(() => {
    if (!id) navigate("/documents", { replace: true });
  }, [id, navigate]);

  // Current user (for admin check)
  const { data: userData } = useQuery(GET_USERS_BY_ID);
  const currentUser = userData?.getUser;
  const userIsAdmin = isAdminUser(currentUser);

  const { data, loading, error, startPolling, stopPolling } = useQuery(DOCUMENT_BY_ID, {
    variables: { id },
    skip: !id,
    fetchPolicy: "cache-and-network",
  });

  const [deleteDocument] = useMutation(DELETE_DOCUMENT, {
    refetchQueries: [{ query: MY_DOCUMENTS }],
    onCompleted: () => {
      addToast("Documento eliminado exitosamente", "success");
      navigate("/documents");
    },
    onError: (err) => addToast(`Error: ${err.message}`, "error"),
  });

  const [enqueueOcr, { loading: enqueuingOcr }] = useMutation(ENQUEUE_DOCUMENT_OCR, {
    onCompleted: () => {
      addToast("OCR encolado correctamente", "success");
      setPollTimedOut(false);
      pollStartRef.current = Date.now();
      startPolling(POLL_INTERVAL_MS);
    },
    onError: (err) => addToast(`Error al encolar OCR: ${err.message}`, "error"),
  });

  const [setDocumentStatus, { loading: updatingStatus }] = useMutation(SET_DOCUMENT_STATUS, {
    refetchQueries: [
      { query: DOCUMENT_BY_ID, variables: { id } },
      { query: MY_DOCUMENTS },
      { query: ALL_DOCUMENTS },
    ],
    awaitRefetchQueries: true,
    onCompleted: () => addToast("Documento marcado como revisado", "success"),
    onError: (err) => addToast(`Error al actualizar estado: ${err.message}`, "error"),
  });

  const document = data?.documentById;
  const status = document?.status;
  const isOtherType = document?.type ? NON_OCR_TYPES.has(document.type) : false;
  const canMarkAsReviewed = userIsAdmin && isOtherType && status !== "VERIFIED";

  // Polling — skip entirely for non-OCR types
  useEffect(() => {
    if (!status || isOtherType) return;
    if (OCR_POLLING_STATUSES.has(status)) {
      if (!pollStartRef.current) pollStartRef.current = Date.now();
      startPolling(POLL_INTERVAL_MS);
    }
    if (OCR_TERMINAL_STATUSES.has(status)) {
      stopPolling();
      pollStartRef.current = null;
    }
  }, [status, isOtherType, startPolling, stopPolling]);

  useEffect(() => {
    if (!status || isOtherType || !OCR_POLLING_STATUSES.has(status) || !pollStartRef.current)
      return;
    if (Date.now() - pollStartRef.current >= POLL_TIMEOUT_MS) {
      stopPolling();
      setPollTimedOut(true);
      pollStartRef.current = null;
    }
  }, [status, isOtherType, stopPolling, data]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const handleDelete = useCallback(async () => {
    await deleteDocument({ variables: { documentId: id } });
  }, [deleteDocument, id]);

  const handleRetryOcr = useCallback(() => {
    if (!id) return;
    enqueueOcr({ variables: { input: { documentId: id } } });
  }, [enqueueOcr, id]);

  const handleMarkReviewed = useCallback(() => {
    if (!id) return;
    setDocumentStatus({ variables: { documentId: id, status: "VERIFIED" } });
  }, [id, setDocumentStatus]);

  const openImageModal = (image, index) => {
    setImageZoom(1);
    setImageModal({ isOpen: true, image, index });
  };

  const closeImageModal = () => {
    setImageZoom(1);
    setImageModal({ isOpen: false, image: null, index: 0 });
  };

  const handleZoomOut = useCallback(() => {
    setImageZoom((current) => Math.max(1, Number((current - 0.25).toFixed(2))));
  }, []);

  const handleZoomIn = useCallback(() => {
    setImageZoom((current) => Math.min(3, Number((current + 0.25).toFixed(2))));
  }, []);

  const handleZoomReset = useCallback(() => {
    setImageZoom(1);
  }, []);

  if (!id) return null;

  if (loading && !data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Skeleton variant="card" className="mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
            <svg
              className="w-7 h-7 text-red-500"
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
          <h2 className="text-lg font-semibold text-slate-900 mb-1">
            {error ? "Error al cargar" : "Documento no encontrado"}
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            {error?.message || "El documento no existe o fue eliminado."}
          </p>
          <button
            onClick={() => navigate("/documents")}
            className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold bg-black text-white hover:opacity-90 transition active:scale-[0.98]"
          >
            Volver a Documentos
          </button>
        </div>
      </div>
    );
  }

  const isProcessing = !isOtherType && OCR_POLLING_STATUSES.has(status);
  const rawImage = document.images?.find((img) => img.kind === "RAW");
  const normalizedImage = document.images?.find((img) => img.kind === "NORMALIZED");
  const mainImage = normalizedImage || rawImage;

  const hasExtracted =
    !isOtherType &&
    document.extracted &&
    (document.extracted.fullName ||
      document.extracted.passportNumber ||
      document.extracted.documentNumber);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back */}
      <button
        onClick={() => navigate("/documents")}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Documentos
      </button>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{getDocumentTypeIcon(document.type)}</span>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {getDocumentTypeLabel(document.type)}
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {isOtherType
                  ? document.notes || "Documento adjunto"
                  : document.extracted?.fullName || "Sin datos extraídos"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge color={getStatusColor(status)}>{getStatusLabel(status)}</Badge>
            {!isOtherType && document.daysUntilExpiration != null && (
              <Badge color={getExpirationColor(document.daysUntilExpiration, document.isExpired)}>
                {getExpirationText(document.daysUntilExpiration, document.isExpired)}
              </Badge>
            )}
          </div>
        </div>

        {/* Expiration warnings — solo para docs con fecha */}
        {!isOtherType && document.isExpired && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 ring-1 ring-red-200 text-sm text-red-700">
            Este documento está expirado desde el {formatDate(document.extracted?.expirationDate)}
          </div>
        )}
        {!isOtherType &&
          document.daysUntilExpiration != null &&
          document.daysUntilExpiration <= 90 &&
          !document.isExpired && (
            <div className="mt-4 p-3 rounded-xl bg-amber-50 ring-1 ring-amber-200 text-sm text-amber-700">
              Este documento expira en {document.daysUntilExpiration} días
            </div>
          )}
      </div>

      {/* OCR banners — solo para tipos con OCR */}
      {!isOtherType && isProcessing && !pollTimedOut && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-sky-500 animate-spin" fill="none" viewBox="0 0 24 24">
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
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Procesando documento...</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {status === "OCR_PROCESSING"
                  ? "El OCR está analizando la imagen."
                  : "Esperando en la cola de procesamiento..."}
              </p>
            </div>
          </div>
        </div>
      )}

      {!isOtherType && pollTimedOut && isProcessing && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-amber-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-slate-900">Aún procesando</h3>
              <p className="text-xs text-slate-500 mt-0.5">Podés volver más tarde.</p>
            </div>
            <button
              onClick={() => {
                setPollTimedOut(false);
                pollStartRef.current = Date.now();
                startPolling(POLL_INTERVAL_MS);
              }}
              className="inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 transition active:scale-[0.98]"
            >
              Reintentar polling
            </button>
          </div>
        </div>
      )}

      {!isOtherType && status === "OCR_FAILED" && (
        <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-900">OCR fallido</h3>
              {document.ocrLastError && (
                <p className="text-xs text-red-700 mt-1">{document.ocrLastError}</p>
              )}
              {document.extracted?.reasonCodes?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {document.extracted.reasonCodes.map((code) => (
                    <span
                      key={code}
                      className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-red-200"
                    >
                      {code}
                    </span>
                  ))}
                </div>
              )}
              {document.ocrAttempts > 0 && (
                <p className="text-xs text-slate-500 mt-2">Intentos: {document.ocrAttempts}</p>
              )}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={handleRetryOcr}
                disabled={enqueuingOcr}
                className="inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold bg-black text-white hover:opacity-90 transition active:scale-[0.98] disabled:opacity-50"
              >
                {enqueuingOcr ? "Encolando..." : "Reintentar OCR"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: images + owner (admin) + actions */}
        <div className="lg:col-span-1 space-y-4">
          {/* Owner card — solo admin */}
          {userIsAdmin && document.owner && <OwnerCard owner={document.owner} />}

          {/* Images */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">
              {isOtherType ? "Archivo adjunto" : `Imágenes (${document.images?.length || 0})`}
            </h2>

            {!document.images?.length ? (
              <div className="text-center py-8 text-slate-400 text-sm">Sin imágenes</div>
            ) : (
              <div className="space-y-3">
                {document.images.map((image, index) => (
                  <div
                    key={image.url}
                    className="relative group cursor-pointer rounded-xl overflow-hidden ring-1 ring-slate-200"
                    onClick={() => openImageModal(image, index)}
                  >
                    <DocumentFilePreview
                      image={image}
                      alt={`${image.kind ?? "archivo"} - ${index + 1}`}
                      compact
                      className="w-full h-44 object-cover"
                      frameClassName="h-44"
                    />
                    {!isOtherType && (
                      <div className="absolute top-2 left-2">
                        <span className="inline-flex items-center rounded-full bg-black/50 backdrop-blur-sm px-2 py-0.5 text-[10px] font-semibold text-white">
                          {image.kind}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Acciones</h3>
            <div className="space-y-2">
              {canMarkAsReviewed && (
                <button
                  onClick={handleMarkReviewed}
                  disabled={updatingStatus}
                  className="w-full inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold bg-emerald-600 text-white hover:opacity-90 transition active:scale-[0.98] disabled:opacity-50"
                >
                  {updatingStatus ? "Marcando..." : "Marcar como revisado"}
                </button>
              )}
              {!isOtherType && status === "OCR_SUCCESS" && !document.extracted?.mrzValid && (
                <button
                  onClick={handleRetryOcr}
                  disabled={enqueuingOcr}
                  className="w-full inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 transition active:scale-[0.98] disabled:opacity-50"
                >
                  {enqueuingOcr ? "Encolando..." : "Reintentar OCR"}
                </button>
              )}
              <button
                onClick={() => setDeleteModal(true)}
                className="w-full inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold bg-red-600 text-white hover:opacity-90 transition active:scale-[0.98]"
              >
                Eliminar Documento
              </button>
            </div>
          </div>
        </div>

        {/* Right column: data */}
        <div className="lg:col-span-2">
          {/* ── Tipo OTHER: solo metadatos ── */}
          {isOtherType && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-slate-900 mb-6">
                Información del documento
              </h2>

              {/* Preview del archivo si es imagen */}
              {mainImage && (
                <div
                  className="rounded-2xl overflow-hidden ring-1 ring-slate-200 mb-6 cursor-pointer"
                  onClick={() => openImageModal(mainImage, 0)}
                >
                  <DocumentFilePreview
                    image={mainImage}
                    alt="Documento"
                    className="w-full block max-h-72 object-contain bg-slate-50"
                    frameClassName="max-h-72"
                  />
                </div>
              )}

              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <DataField label="Tipo" value={getDocumentTypeLabel(document.type)} />
                <DataField label="Estado" value={getStatusLabel(status)} />
                <DataField label="Fuente" value={document.source} />
                <DataField label="Creado" value={formatDateTime(document.createdAt)} />
                <DataField label="Actualizado" value={formatDateTime(document.updatedAt)} />
                {document.notes && (
                  <div className="md:col-span-2">
                    <dt className="text-xs font-medium text-slate-400">Notas</dt>
                    <dd className="mt-0.5 text-sm text-slate-900">{document.notes}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* ── Tipos con OCR: datos extraídos ── */}
          {!isOtherType && hasExtracted && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-semibold text-slate-900">Datos Extraídos</h2>
                {document.extracted?.mrzValid != null && (
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold ${
                      document.extracted.mrzValid ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    {document.extracted.mrzValid ? "MRZ Válido" : "MRZ Inválido"}
                  </span>
                )}
              </div>

              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {document.extracted?.fullName && (
                  <DataField label="Nombre Completo" value={document.extracted.fullName} />
                )}
                {document.extracted?.givenNames && (
                  <DataField label="Nombre(s)" value={document.extracted.givenNames} />
                )}
                {document.extracted?.surname && (
                  <DataField label="Apellido(s)" value={document.extracted.surname} />
                )}
                {document.extracted?.nationality && (
                  <DataField label="Nacionalidad" value={document.extracted.nationality} />
                )}
                {document.extracted?.issuingCountry && (
                  <DataField label="País Emisor" value={document.extracted.issuingCountry} />
                )}
                {document.extracted?.passportNumber && (
                  <DataField
                    label="N° Pasaporte"
                    value={document.extracted.passportNumber}
                    sensitive
                  />
                )}
                {document.extracted?.documentNumber && (
                  <DataField
                    label="N° Documento"
                    value={document.extracted.documentNumber}
                    sensitive
                  />
                )}
                {document.extracted?.visaType && (
                  <DataField label="Tipo de Visa" value={document.extracted.visaType} />
                )}
                {document.extracted?.dateOfBirth && (
                  <DataField
                    label="Fecha de Nacimiento"
                    value={formatDate(document.extracted.dateOfBirth)}
                  />
                )}
                {document.extracted?.sex && (
                  <DataField label="Sexo" value={document.extracted.sex} />
                )}
                {document.extracted?.issueDate && (
                  <DataField
                    label="Fecha de Emisión"
                    value={formatDate(document.extracted.issueDate)}
                  />
                )}
                {document.extracted?.expirationDate && (
                  <DataField
                    label="Fecha de Expiración"
                    value={formatDate(document.extracted.expirationDate)}
                  />
                )}
              </dl>

              {document.extracted?.mrzRaw && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    MRZ
                  </h3>
                  <pre className="text-xs font-mono bg-slate-50 rounded-xl p-3 overflow-x-auto ring-1 ring-slate-200">
                    {document.extracted.mrzRaw}
                  </pre>
                  {document.extracted?.mrzFormat && (
                    <p className="text-xs text-slate-400 mt-1">
                      Formato: {document.extracted.mrzFormat}
                    </p>
                  )}
                  {document.extracted?.ocrConfidence != null && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      Confianza OCR: {Math.round(document.extracted.ocrConfidence * 100)}%
                    </p>
                  )}
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-slate-100">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Metadatos
                </h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <DataField label="Fuente" value={document.source} />
                  <DataField label="Creado" value={formatDateTime(document.createdAt)} />
                  <DataField label="Actualizado" value={formatDateTime(document.updatedAt)} />
                </dl>
              </div>

              {document.notes && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Notas
                  </h3>
                  <p className="text-sm text-slate-600">{document.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Sin datos extraídos aún */}
          {!isOtherType && !hasExtracted && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
              <div className="text-center">
                {mainImage && (
                  <div className="rounded-2xl overflow-hidden ring-1 ring-slate-200 mb-6 max-w-sm mx-auto">
                    <DocumentFilePreview image={mainImage} alt="Documento" className="w-full block" />
                  </div>
                )}
                <h2 className="text-lg font-semibold text-slate-900 mb-1">
                  {isProcessing ? "Esperando resultados..." : "Sin datos extraídos"}
                </h2>
                <p className="text-sm text-slate-500 mb-4">
                  {isProcessing
                    ? "El documento está siendo procesado por el sistema OCR."
                    : "Este documento aún no ha sido procesado por OCR."}
                </p>
                {!isProcessing && status !== "OCR_FAILED" && (
                  <button
                    onClick={handleRetryOcr}
                    disabled={enqueuingOcr}
                    className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold bg-black text-white hover:opacity-90 transition active:scale-[0.98] disabled:opacity-50"
                  >
                    {enqueuingOcr ? "Encolando..." : "Iniciar OCR"}
                  </button>
                )}
                <div className="mt-8 pt-6 border-t border-slate-100 text-left">
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <DataField label="Tipo" value={getDocumentTypeLabel(document.type)} />
                    <DataField label="Fuente" value={document.source} />
                    <DataField label="Creado" value={formatDateTime(document.createdAt)} />
                    <DataField label="Actualizado" value={formatDateTime(document.updatedAt)} />
                  </dl>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      <Modal isOpen={imageModal.isOpen} onClose={closeImageModal} size="full">
        <div className="relative space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">
                Vista del documento
              </p>
              <p className="text-xs text-slate-400">
                {imageModal.image?.mimeType && !isPdfMimeType(imageModal.image.mimeType)
                  ? "Usá zoom y scroll para revisar el archivo"
                  : "Vista ajustada al contenedor"}
              </p>
            </div>

            {imageModal.image && !isPdfMimeType(imageModal.image.mimeType) && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleZoomOut}
                  disabled={imageZoom <= 1}
                  className="inline-flex items-center justify-center rounded-full px-3 py-2 text-sm font-semibold border border-slate-600 bg-slate-800 text-white hover:bg-slate-700 transition disabled:opacity-50"
                >
                  -
                </button>
                <button
                  onClick={handleZoomReset}
                  className="inline-flex items-center justify-center rounded-full px-3 py-2 text-sm font-semibold border border-slate-600 bg-slate-800 text-white hover:bg-slate-700 transition"
                >
                  {Math.round(imageZoom * 100)}%
                </button>
                <button
                  onClick={handleZoomIn}
                  disabled={imageZoom >= 3}
                  className="inline-flex items-center justify-center rounded-full px-3 py-2 text-sm font-semibold border border-slate-600 bg-slate-800 text-white hover:bg-slate-700 transition disabled:opacity-50"
                >
                  +
                </button>
              </div>
            )}
          </div>

          <div className="relative h-[75vh] overflow-auto rounded-2xl border border-slate-700 bg-slate-950">
            {imageModal.image && isPdfMimeType(imageModal.image.mimeType) && (
              <DocumentFilePreview
                image={imageModal.image}
                alt="Vista ampliada"
                className="w-full h-full"
                frameClassName="h-[75vh]"
              />
            )}

            {imageModal.image && !isPdfMimeType(imageModal.image.mimeType) && (
              <div className="flex min-h-full min-w-full items-start justify-center p-4">
                <img
                  src={imageModal.image.url}
                  alt="Vista ampliada"
                  className="block h-auto max-w-none rounded-xl"
                  style={{ width: `${imageZoom * 100}%` }}
                />
              </div>
            )}
          </div>

          {imageModal.image?.url && (
            <div className="mt-4 flex justify-center">
              <a
                href={
                  isPdfMimeType(imageModal.image.mimeType)
                    ? buildPdfPreviewUrl(
                        getCloudinaryPdfUrl(imageModal.image),
                        imageModal.image.publicId,
                      )
                    : imageModal.image.url
                }
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold border border-slate-700 bg-slate-800 text-white hover:bg-slate-700 transition"
              >
                Abrir en una pestaña nueva
              </a>
            </div>
          )}
          {document.images?.length > 1 && (
            <>
              <button
                onClick={() => {
                  const prev =
                    imageModal.index === 0 ? document.images.length - 1 : imageModal.index - 1;
                  setImageModal({ isOpen: true, image: document.images[prev], index: prev });
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/75 transition-all"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                onClick={() => {
                  const next = (imageModal.index + 1) % document.images.length;
                  setImageModal({ isOpen: true, image: document.images[next], index: next });
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/75 transition-all"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
                {imageModal.index + 1} / {document.images.length}
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Delete Modal */}
    <Modal
  isOpen={deleteModal}
  onClose={() => setDeleteModal(false)}
  title="Confirmar Eliminación"
>
  <div className="space-y-4">
    <p className="text-sm text-slate-600">
      Esta acción eliminará el documento y todas sus imágenes asociadas.
    </p>
    <div className="bg-red-50 ring-1 ring-red-200 rounded-xl p-4">
      <p className="text-sm font-medium text-red-900">Se eliminará:</p>
      <ul className="text-sm text-red-700 mt-2 list-disc list-inside">
        <li>{getDocumentTypeLabel(document.type)}</li>
        <li>{document.extracted?.fullName || document.notes || "Sin nombre"}</li>
        <li>{document.images?.length || 0} imagen(es)</li>
      </ul>
    </div>

    {/* Botones aquí dentro, no como footer prop */}
    <div className="flex gap-3 justify-end pt-2">
      <button
        onClick={() => setDeleteModal(false)}
        className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 transition"
      >
        Cancelar
      </button>
      <button
        onClick={handleDelete}
        className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold bg-red-600 text-white hover:opacity-90 transition"
      >
        Eliminar
      </button>
    </div>
  </div>
</Modal>
    </div>
  );
}
