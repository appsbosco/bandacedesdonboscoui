import React, { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useParams, useNavigate } from "react-router-dom";
import {
  DOCUMENT_BY_ID,
  DELETE_DOCUMENT,
  ENQUEUE_DOCUMENT_OCR,
  MY_DOCUMENTS,
} from "../../graphql/documents/documents.gql";
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
const POLL_TIMEOUT_MS = 180000; // 3 minutes

export function DocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [deleteModal, setDeleteModal] = useState(false);
  const [imageModal, setImageModal] = useState({ isOpen: false, imageUrl: null, index: 0 });
  const [pollTimedOut, setPollTimedOut] = useState(false);
  const pollStartRef = useRef(null);

  // Guard: if no id, redirect immediately
  useEffect(() => {
    if (!id) navigate("/documents", { replace: true });
  }, [id, navigate]);

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
    onError: (err) => {
      addToast(`Error: ${err.message}`, "error");
    },
  });

  const [enqueueOcr, { loading: enqueuingOcr }] = useMutation(ENQUEUE_DOCUMENT_OCR, {
    onCompleted: () => {
      addToast("OCR encolado correctamente", "success");
      setPollTimedOut(false);
      pollStartRef.current = Date.now();
      startPolling(POLL_INTERVAL_MS);
    },
    onError: (err) => {
      addToast(`Error al encolar OCR: ${err.message}`, "error");
    },
  });

  const document = data?.documentById;
  const status = document?.status;

  // Polling logic: start when status is in-progress, stop on terminal or timeout
  useEffect(() => {
    if (!status) return;

    if (OCR_POLLING_STATUSES.has(status)) {
      if (!pollStartRef.current) pollStartRef.current = Date.now();
      startPolling(POLL_INTERVAL_MS);
    }

    if (OCR_TERMINAL_STATUSES.has(status)) {
      stopPolling();
      pollStartRef.current = null;
    }
  }, [status, startPolling, stopPolling]);

  // Timeout check
  useEffect(() => {
    if (!status || !OCR_POLLING_STATUSES.has(status) || !pollStartRef.current) return;

    const elapsed = Date.now() - pollStartRef.current;
    if (elapsed >= POLL_TIMEOUT_MS) {
      stopPolling();
      setPollTimedOut(true);
      pollStartRef.current = null;
    }
  }, [status, stopPolling, data]); // data changes on each poll

  // Cleanup polling on unmount
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  const handleDelete = useCallback(async () => {
    await deleteDocument({ variables: { documentId: id } });
  }, [deleteDocument, id]);

  const handleRetryOcr = useCallback(() => {
    if (!id) return;
    enqueueOcr({ variables: { input: { documentId: id } } });
  }, [enqueueOcr, id]);

  const openImageModal = (url, index) => {
    setImageModal({ isOpen: true, imageUrl: url, index });
  };

  const closeImageModal = () => {
    setImageModal({ isOpen: false, imageUrl: null, index: 0 });
  };

  // No id guard
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
            <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
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

  const isProcessing = OCR_POLLING_STATUSES.has(status);
  const rawImage = document.images?.find((img) => img.kind === "RAW");
  const normalizedImage = document.images?.find((img) => img.kind === "NORMALIZED");
  const mainImage = normalizedImage || rawImage;
  const hasExtracted = document.extracted && (
    document.extracted.fullName || document.extracted.passportNumber || document.extracted.documentNumber
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back button */}
      <button
        onClick={() => navigate("/documents")}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Documentos
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{getDocumentTypeIcon(document.type)}</span>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {getDocumentTypeLabel(document.type)}
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {document.extracted?.fullName || "Sin datos extraídos"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge color={getStatusColor(status)}>
              {getStatusLabel(status)}
            </Badge>
            {document.daysUntilExpiration != null && (
              <Badge color={getExpirationColor(document.daysUntilExpiration, document.isExpired)}>
                {getExpirationText(document.daysUntilExpiration, document.isExpired)}
              </Badge>
            )}
          </div>
        </div>

        {/* Expiration warnings */}
        {document.isExpired && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 ring-1 ring-red-200 text-sm text-red-700">
            Este documento está expirado desde el {formatDate(document.extracted?.expirationDate)}
          </div>
        )}
        {document.daysUntilExpiration != null && document.daysUntilExpiration <= 90 && !document.isExpired && (
          <div className="mt-4 p-3 rounded-xl bg-amber-50 ring-1 ring-amber-200 text-sm text-amber-700">
            Este documento expira en {document.daysUntilExpiration} días
          </div>
        )}
      </div>

      {/* OCR Processing Banner */}
      {isProcessing && !pollTimedOut && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-sky-500 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Procesando documento...</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {status === "OCR_PROCESSING"
                  ? "El OCR está analizando la imagen. Esto puede tomar unos segundos."
                  : "Esperando en la cola de procesamiento..."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Poll Timeout Banner */}
      {pollTimedOut && isProcessing && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-slate-900">Aún procesando</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                El procesamiento está tomando más de lo esperado. Puedes volver más tarde.
              </p>
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

      {/* OCR Failed Banner */}
      {status === "OCR_FAILED" && (
        <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
                    <span key={code} className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-red-200">
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
                className="inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold bg-black text-white hover:opacity-90 transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {enqueuingOcr ? "Encolando..." : "Reintentar OCR"}
              </button>
              <button
                onClick={() => navigate("/new-document")}
                className="inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 transition active:scale-[0.98]"
              >
                Re-escanear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Images */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">
              Imágenes ({document.images?.length || 0})
            </h2>

            {!document.images?.length ? (
              <div className="text-center py-8 text-slate-400 text-sm">Sin imágenes</div>
            ) : (
              <div className="space-y-3">
                {document.images.map((image, index) => (
                  <div
                    key={image.url}
                    className="relative group cursor-pointer rounded-xl overflow-hidden ring-1 ring-slate-200"
                    onClick={() => openImageModal(image.url, index)}
                  >
                    <img
                      src={image.url}
                      alt={`${image.kind} - ${index + 1}`}
                      className="w-full h-44 object-cover"
                    />
                    <div className="absolute top-2 left-2">
                      <span className="inline-flex items-center rounded-full bg-black/50 backdrop-blur-sm px-2 py-0.5 text-[10px] font-semibold text-white">
                        {image.kind}
                      </span>
                    </div>
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
              {status === "OCR_SUCCESS" && !document.extracted?.mrzValid && (
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

        {/* Data */}
        <div className="lg:col-span-2">
          {/* OCR Success: show extracted data */}
          {hasExtracted ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-semibold text-slate-900">Datos Extraídos</h2>
                {document.extracted?.mrzValid != null && (
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold ${document.extracted.mrzValid ? "text-emerald-600" : "text-red-500"}`}>
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
                  <DataField label="Número de Pasaporte" value={document.extracted.passportNumber} sensitive />
                )}
                {document.extracted?.documentNumber && (
                  <DataField label="Número de Documento" value={document.extracted.documentNumber} sensitive />
                )}
                {document.extracted?.visaType && (
                  <DataField label="Tipo de Visa" value={document.extracted.visaType} />
                )}
                {document.extracted?.dateOfBirth && (
                  <DataField label="Fecha de Nacimiento" value={formatDate(document.extracted.dateOfBirth)} />
                )}
                {document.extracted?.sex && (
                  <DataField label="Sexo" value={document.extracted.sex} />
                )}
                {document.extracted?.issueDate && (
                  <DataField label="Fecha de Emisión" value={formatDate(document.extracted.issueDate)} />
                )}
                {document.extracted?.expirationDate && (
                  <DataField label="Fecha de Expiración" value={formatDate(document.extracted.expirationDate)} />
                )}
              </dl>

              {/* MRZ raw */}
              {document.extracted?.mrzRaw && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">MRZ</h3>
                  <pre className="text-xs font-mono bg-slate-50 rounded-xl p-3 overflow-x-auto ring-1 ring-slate-200">
                    {document.extracted.mrzRaw}
                  </pre>
                  {document.extracted?.mrzFormat && (
                    <p className="text-xs text-slate-400 mt-1">Formato: {document.extracted.mrzFormat}</p>
                  )}
                  {document.extracted?.ocrConfidence != null && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      Confianza OCR: {Math.round(document.extracted.ocrConfidence * 100)}%
                    </p>
                  )}
                </div>
              )}

              {/* Metadata */}
              <div className="mt-6 pt-6 border-t border-slate-100">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Metadatos</h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <DataField label="Fuente" value={document.source} />
                  <DataField label="Creado" value={formatDateTime(document.createdAt)} />
                  <DataField label="Actualizado" value={formatDateTime(document.updatedAt)} />
                </dl>
              </div>

              {document.notes && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Notas</h3>
                  <p className="text-sm text-slate-600">{document.notes}</p>
                </div>
              )}
            </div>
          ) : (
            /* No extracted data yet */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
              <div className="text-center">
                {mainImage && (
                  <div className="rounded-2xl overflow-hidden ring-1 ring-slate-200 mb-6 max-w-sm mx-auto">
                    <img src={mainImage.url} alt="Documento" className="w-full block" />
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

                {/* Metadata */}
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
        <div className="relative">
          <img
            src={imageModal.imageUrl}
            alt="Vista ampliada"
            className="w-full h-auto max-h-[80vh] object-contain"
          />

          {document.images?.length > 1 && (
            <>
              <button
                onClick={() => {
                  const prevIndex = imageModal.index === 0 ? document.images.length - 1 : imageModal.index - 1;
                  setImageModal({ isOpen: true, imageUrl: document.images[prevIndex].url, index: prevIndex });
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/75 transition-all"
                aria-label="Imagen anterior"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => {
                  const nextIndex = (imageModal.index + 1) % document.images.length;
                  setImageModal({ isOpen: true, imageUrl: document.images[nextIndex].url, index: nextIndex });
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/75 transition-all"
                aria-label="Imagen siguiente"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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
        footer={
          <div className="flex gap-3 justify-end">
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
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Esta acción eliminará el documento y todas sus imágenes asociadas.
          </p>
          <div className="bg-red-50 ring-1 ring-red-200 rounded-xl p-4">
            <p className="text-sm font-medium text-red-900">Se eliminará:</p>
            <ul className="text-sm text-red-700 mt-2 list-disc list-inside">
              <li>{getDocumentTypeLabel(document.type)}</li>
              <li>{document.extracted?.fullName || "Sin nombre"}</li>
              <li>{document.images?.length || 0} imagen(es)</li>
            </ul>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function DataField({ label, value, sensitive = false }) {
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
