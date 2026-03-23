/* eslint-disable react/prop-types */

import React, { useCallback, useState } from "react";
import { useMutation } from "@apollo/client";
import PropTypes from "prop-types";
import { DocumentCard } from "./DocumentCard";
import { DocumentListSkeleton } from "../ui/Skeleton";
import { Modal } from "../ui/Modal";
import { useToast } from "../ui/Toast";
import {
  ALL_DOCUMENTS,
  MY_DOCUMENTS,
  SET_DOCUMENT_STATUS,
} from "../../graphql/documents/documents.gql.js";

function isPdfMimeType(type) {
  return type === "application/pdf" || type === "image/pdf";
}

function getApiBaseUrl() {
  const graphqlUrl = process.env.REACT_APP_GRAPHQL_URL;
  if (!graphqlUrl) return "";

  try {
    return new URL(graphqlUrl).origin;
  } catch {
    return "";
  }
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

function DocumentQuickPreview({ image, alt }) {
  if (!image?.url) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-400">
        Sin archivo para previsualizar
      </div>
    );
  }

  if (isPdfMimeType(image.mimeType)) {
    return (
      <iframe
        src={buildPdfPreviewUrl(getCloudinaryPdfUrl(image), image.publicId)}
        title={`Vista previa PDF${alt ? ` - ${alt}` : ""}`}
        className="h-full w-full border-0"
      />
    );
  }

  return (
    <div className="flex min-h-full min-w-full items-center justify-center p-4">
      <img
        src={image.url}
        alt={alt}
        className="block max-h-full max-w-full rounded-xl object-contain"
      />
    </div>
  );
}

/**
 * DocumentList - Light UI
 */
export function DocumentList({
  documents,
  loading,
  error,
  hasMore,
  onLoadMore,
  loadingMore,
  emptyMessage = "No hay documentos",
  showOwner = false,
}) {
  const { addToast } = useToast();
  const [previewState, setPreviewState] = useState({
    isOpen: false,
    document: null,
    imageIndex: 0,
  });

  const [setDocumentStatus, { loading: updatingStatus }] = useMutation(SET_DOCUMENT_STATUS, {
    refetchQueries: [{ query: ALL_DOCUMENTS }, { query: MY_DOCUMENTS }],
    awaitRefetchQueries: true,
    onCompleted: () => addToast("Documento marcado como completado", "success"),
    onError: (err) => addToast(`Error al actualizar estado: ${err.message}`, "error"),
  });

  const closePreview = useCallback(() => {
    setPreviewState({ isOpen: false, document: null, imageIndex: 0 });
  }, []);

  const openPreview = useCallback((document, imageIndex = 0) => {
    setPreviewState({ isOpen: true, document, imageIndex });
  }, []);

  const previewImages = previewState.document?.images || [];
  const currentPreviewImage = previewImages[previewState.imageIndex] || null;

  const handleMarkCompleted = useCallback(
    async (event, documentId) => {
      event.stopPropagation();
      if (!documentId) return;
      await setDocumentStatus({ variables: { documentId, status: "VERIFIED" } });
    },
    [setDocumentStatus]
  );

  // Carga inicial
  if (loading && (!documents || documents.length === 0)) {
    return <DocumentListSkeleton count={5} />;
  }

  // Error
  if (error) {
    return (
      <div className="text-center py-10">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-rose-50 ring-1 ring-rose-200 flex items-center justify-center shadow-sm">
          <svg
            className="w-7 h-7 text-rose-700"
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

        <h3 className="text-lg font-semibold text-slate-900 mb-1">No se pudo cargar</h3>
        <p className="text-slate-600 text-sm">
          {error.message || "Ocurrió un error. Intenta de nuevo."}
        </p>
      </div>
    );
  }

  // Vacío
  if (!documents || documents.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-50 ring-1 ring-slate-200 flex items-center justify-center shadow-sm">
          <svg
            className="w-7 h-7 text-slate-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>

        <h3 className="text-lg font-semibold text-slate-900 mb-1">{emptyMessage}</h3>
        <p className="text-slate-600 text-sm">Escanea tu primer documento para comenzar.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {/* Lista */}
        {documents.map((doc) => (
          <DocumentCard
            key={doc.id}
            document={doc}
            showOwner={showOwner}
            actions={
              showOwner ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      openPreview(doc, 0);
                    }}
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Ver
                  </button>
                  {doc.status !== "VERIFIED" && (
                    <button
                      type="button"
                      onClick={(event) => handleMarkCompleted(event, doc.id)}
                      disabled={updatingStatus}
                      className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition disabled:opacity-50"
                    >
                      Completar
                    </button>
                  )}
                </div>
              ) : null
            }
          />
        ))}

        {/* Load more */}
        {hasMore && (
          <div className="pt-4">
            <button
              onClick={onLoadMore}
              disabled={loadingMore}
              className="
              w-full py-3.5 rounded-2xl font-semibold
              bg-white text-slate-900
              ring-1 ring-slate-200
              hover:bg-slate-50 hover:ring-slate-300
              transition-colors
              shadow-sm
              disabled:opacity-60 disabled:cursor-not-allowed
              focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2
            "
            >
              {loadingMore ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5 text-slate-700"
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
                  Cargando...
                </span>
              ) : (
                "Cargar más"
              )}
            </button>
          </div>
        )}
      </div>

      <Modal isOpen={previewState.isOpen} onClose={closePreview} size="full">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">Vista rápida del documento</p>
              <p className="text-xs text-slate-400">
                Revisá el archivo y marcá el documento como completado sin salir de la lista
              </p>
            </div>
            {previewState.document?.status !== "VERIFIED" && (
              <button
                type="button"
                onClick={async (event) => {
                  await handleMarkCompleted(event, previewState.document?.id);
                  closePreview();
                }}
                disabled={updatingStatus}
                className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition disabled:opacity-50"
              >
                Marcar como completado
              </button>
            )}
          </div>

          <div className="h-[75vh] overflow-auto rounded-2xl border border-slate-700 bg-slate-950">
            <DocumentQuickPreview
              image={currentPreviewImage}
              alt={previewState.document?.extracted?.fullName || "Documento"}
            />
          </div>

          {previewImages.length > 1 && (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {previewImages.map((image, index) => (
                <button
                  key={image.publicId || image.url || `${image.kind || "documento"}-${index + 1}`}
                  type="button"
                  onClick={() => setPreviewState((current) => ({ ...current, imageIndex: index }))}
                  className={`overflow-hidden rounded-xl border ${
                    previewState.imageIndex === index
                      ? "border-sky-400 ring-2 ring-sky-400/30"
                      : "border-slate-700"
                  }`}
                >
                  {isPdfMimeType(image.mimeType) ? (
                    <div className="flex h-16 items-center justify-center bg-slate-900 text-xs font-semibold text-slate-200">
                      PDF
                    </div>
                  ) : (
                    <img
                      src={image.url}
                      alt={`Documento ${index + 1}`}
                      className="h-16 w-full object-cover"
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}

export default DocumentList;

DocumentList.propTypes = {
  documents: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
    })
  ),
  loading: PropTypes.bool,
  error: PropTypes.shape({
    message: PropTypes.string,
  }),
  hasMore: PropTypes.bool,
  onLoadMore: PropTypes.func,
  loadingMore: PropTypes.bool,
  emptyMessage: PropTypes.string,
  showOwner: PropTypes.bool,
};

DocumentList.defaultProps = {
  documents: [],
  loading: false,
  error: null,
  hasMore: false,
  onLoadMore: undefined,
  loadingMore: false,
  emptyMessage: "No hay documentos",
  showOwner: false,
};
