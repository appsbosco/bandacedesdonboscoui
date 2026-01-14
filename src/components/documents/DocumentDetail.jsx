import React, { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useParams, useNavigate } from "react-router-dom";
import {
  DOCUMENT_BY_ID,
  DELETE_DOCUMENT,
  UPSERT_DOCUMENT_EXTRACTED_DATA,
  SET_DOCUMENT_STATUS,
  MY_DOCUMENTS,
} from "../../graphql/documents/documents.gql";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Modal } from "../ui/Modal";
import { Skeleton } from "../ui/Skeleton";
import { DocumentForm } from "./DocumentForm";
import { useToast } from "../ui/Toast";
import {
  getStatusColor,
  getStatusLabel,
  getDocumentTypeLabel,
  getDocumentTypeIcon,
  maskDocumentNumber,
} from "../../utils/documentHelpers";
import {
  formatDate,
  formatDateTime,
  getExpirationColor,
  getExpirationText,
} from "../../utils/dateHelpers";
import PropTypes from "prop-types";

export function DocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [editMode, setEditMode] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [imageModal, setImageModal] = useState({ isOpen: false, imageUrl: null, index: 0 });

  const { data, loading, error } = useQuery(DOCUMENT_BY_ID, {
    variables: { documentId: id },
    fetchPolicy: "cache-and-network",
  });

  const [updateData, { loading: updating }] = useMutation(UPSERT_DOCUMENT_EXTRACTED_DATA, {
    onCompleted: () => {
      addToast("Documento actualizado exitosamente", "success");
      setEditMode(false);
    },
    onError: (error) => {
      addToast(`Error: ${error.message}`, "error");
    },
  });

  const [deleteDocument] = useMutation(DELETE_DOCUMENT, {
    refetchQueries: [{ query: MY_DOCUMENTS }],
    onCompleted: () => {
      addToast("Documento eliminado exitosamente", "success");
      navigate("/documents");
    },
    onError: (error) => {
      addToast(`Error: ${error.message}`, "error");
    },
  });

  const [changeStatus] = useMutation(SET_DOCUMENT_STATUS, {
    onCompleted: () => {
      addToast("Estado actualizado", "success");
    },
  });

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton variant="card" className="mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </div>
      </div>
    );
  }

  if (error || !data?.documentById) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800">
            {error ? `Error: ${error.message}` : "Documento no encontrado"}
          </p>
          <Button variant="secondary" className="mt-4" onClick={() => navigate("/documents")}>
            Volver a Documentos
          </Button>
        </div>
      </div>
    );
  }

  const document = data.documentById;

  const handleUpdate = async (formData) => {
    await updateData({
      variables: {
        input: {
          documentId: id,
          ...formData,
        },
      },
    });
  };

  const handleDelete = async () => {
    await deleteDocument({
      variables: { documentId: id },
    });
  };

  const openImageModal = (url, index) => {
    setImageModal({ isOpen: true, imageUrl: url, index });
  };

  const closeImageModal = () => {
    setImageModal({ isOpen: false, imageUrl: null, index: 0 });
  };

  const nextImage = () => {
    const nextIndex = (imageModal.index + 1) % document.images.length;
    setImageModal({
      isOpen: true,
      imageUrl: document.images[nextIndex].url,
      index: nextIndex,
    });
  };

  const prevImage = () => {
    const prevIndex = imageModal.index === 0 ? document.images.length - 1 : imageModal.index - 1;
    setImageModal({
      isOpen: true,
      imageUrl: document.images[prevIndex].url,
      index: prevIndex,
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate("/documents")} className="mb-4">
          ← Volver a Documentos
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <span className="text-5xl">{getDocumentTypeIcon(document.type)}</span>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {getDocumentTypeLabel(document.type)}
              </h1>
              <p className="text-gray-600 mt-1">{document.extracted?.fullName || "Sin nombre"}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Badge color={getStatusColor(document.status)}>{getStatusLabel(document.status)}</Badge>
            {document.daysUntilExpiration !== null && (
              <Badge color={getExpirationColor(document.daysUntilExpiration, document.isExpired)}>
                {getExpirationText(document.daysUntilExpiration, document.isExpired)}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Expiration Warning */}
      {document.isExpired && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800 font-medium">
            ⚠️ Este documento está expirado desde el{" "}
            {formatDate(document.extracted?.expirationDate)}
          </p>
        </div>
      )}

      {document.daysUntilExpiration <= 90 && !document.isExpired && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800 font-medium">
            ⚠️ Este documento expira en {document.daysUntilExpiration} días
          </p>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Images Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Imágenes ({document.images.length})
            </h2>

            {document.images.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No hay imágenes</p>
              </div>
            ) : (
              <div className="space-y-3">
                {document.images.map((image, index) => (
                  <div
                    key={image._id}
                    className="relative group cursor-pointer"
                    onClick={() => openImageModal(image.url, index)}
                  >
                    <img
                      src={image.url}
                      alt={`Documento ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg border border-gray-200 hover:shadow-lg transition-shadow"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-lg flex items-center justify-center">
                      <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        🔍 Ver
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones</h3>
            <div className="space-y-2">
              <Button variant="secondary" className="w-full" onClick={() => setEditMode(!editMode)}>
                {editMode ? "Cancelar Edición" : "Editar Datos"}
              </Button>
              <Button variant="danger" className="w-full" onClick={() => setDeleteModal(true)}>
                Eliminar Documento
              </Button>
            </div>
          </div>
        </div>

        {/* Data Section */}
        <div className="lg:col-span-2">
          {editMode ? (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Editar Datos</h2>
              <DocumentForm
                documentType={document.type}
                initialData={document.extracted}
                onSubmit={handleUpdate}
                submitLabel={updating ? "Guardando..." : "Guardar Cambios"}
              />
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Información del Documento
              </h2>

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
                    label="Número de Pasaporte"
                    value={document.extracted.passportNumber}
                    sensitive
                  />
                )}
                {document.extracted?.documentNumber && (
                  <DataField
                    label="Número de Documento"
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
                {document.extracted?.mrzRaw && (
                  <div className="md:col-span-2">
                    <DataField
                      label="MRZ"
                      value={
                        <pre className="text-xs font-mono bg-gray-50 p-2 rounded">
                          {document.extracted.mrzRaw}
                        </pre>
                      }
                    />
                    {document.extracted?.mrzValid !== null && (
                      <p
                        className={`text-sm mt-1 ${
                          document.extracted.mrzValid ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {document.extracted.mrzValid ? "✓ MRZ válido" : "✗ MRZ inválido"}
                      </p>
                    )}
                  </div>
                )}
              </dl>

              {/* Metadata */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Metadatos</h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <DataField label="Fuente" value={document.source} />
                  <DataField label="Creado" value={formatDateTime(document.createdAt)} />
                  <DataField label="Actualizado" value={formatDateTime(document.updatedAt)} />
                  {document.lastAccessedAt && (
                    <DataField
                      label="Último Acceso"
                      value={formatDateTime(document.lastAccessedAt)}
                    />
                  )}
                </dl>
              </div>

              {document.notes && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Notas</h3>
                  <p className="text-gray-600 text-sm">{document.notes}</p>
                </div>
              )}
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

          {document.images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-75 transition-all"
                aria-label="Imagen anterior"
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
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-75 transition-all"
                aria-label="Imagen siguiente"
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

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full">
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
            <Button variant="secondary" onClick={() => setDeleteModal(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Eliminar Permanentemente
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            ¿Estás seguro que deseas eliminar este documento? Esta acción no se puede deshacer.
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm font-medium text-red-900">Se eliminará permanentemente:</p>
            <ul className="text-sm text-red-800 mt-2 list-disc list-inside">
              <li>{getDocumentTypeLabel(document.type)}</li>
              <li>{document.extracted?.fullName || "Sin nombre"}</li>
              <li>{document.images.length} imagen(es)</li>
            </ul>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Helper component for data fields
function DataField({ label, value, sensitive = false }) {
  const [showSensitive, setShowSensitive] = useState(false);

  const displayValue = sensitive && !showSensitive ? maskDocumentNumber(value) : value;

  return (
    <div>
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900 flex items-center gap-2">
        {typeof displayValue === "string" ? displayValue : value}
        {sensitive && (
          <button
            onClick={() => setShowSensitive(!showSensitive)}
            className="text-indigo-600 hover:text-indigo-700 text-xs"
          >
            {showSensitive ? "🙈 Ocultar" : "👁️ Mostrar"}
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
