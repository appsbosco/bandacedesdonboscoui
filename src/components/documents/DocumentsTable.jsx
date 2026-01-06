import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import {
  getStatusColor,
  getStatusLabel,
  getDocumentTypeLabel,
  getDocumentTypeIcon,
  maskDocumentNumber,
} from "../../utils/documentHelpers";
import { formatDate, getExpirationColor, getExpirationText } from "../../utils/dateHelpers";
import { useMutation } from "@apollo/client";
import { DELETE_DOCUMENT, MY_DOCUMENTS } from "../../graphql/documents.gql";
import { useToast } from "../ui/Toast";
import PropTypes from "prop-types";

export function DocumentsTable({ documents, loading }) {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, document: null });

  const [deleteDocument] = useMutation(DELETE_DOCUMENT, {
    refetchQueries: [{ query: MY_DOCUMENTS }],
    onCompleted: () => {
      addToast("Documento eliminado exitosamente", "success");
      setDeleteModal({ isOpen: false, document: null });
    },
    onError: (error) => {
      addToast(`Error al eliminar: ${error.message}`, "error");
    },
  });

  const handleDelete = async () => {
    if (!deleteModal.document) return;

    await deleteDocument({
      variables: { documentId: deleteModal.document._id },
    });
  };

  if (documents.length === 0) {
    return null;
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Número
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiración
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {documents.map((doc) => (
                <tr
                  key={doc._id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/documents/${doc._id}`)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getDocumentTypeIcon(doc.type)}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {getDocumentTypeLabel(doc.type)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {doc.extracted?.fullName || "Sin nombre"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {doc.extracted?.nationality || "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-mono">
                      {maskDocumentNumber(
                        doc.extracted?.passportNumber || doc.extracted?.documentNumber
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(doc.extracted?.expirationDate)}
                    </div>
                    {doc.daysUntilExpiration !== null && (
                      <Badge color={getExpirationColor(doc.daysUntilExpiration, doc.isExpired)}>
                        {getExpirationText(doc.daysUntilExpiration, doc.isExpired)}
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge color={getStatusColor(doc.status)}>{getStatusLabel(doc.status)}</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div
                      className="flex items-center justify-end gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/documents/${doc._id}`);
                        }}
                      >
                        Ver
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteModal({ isOpen: true, document: doc });
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {documents.map((doc) => (
          <DocumentCard
            key={doc._id}
            document={doc}
            onDelete={() => setDeleteModal({ isOpen: true, document: doc })}
          />
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, document: null })}
        title="Confirmar Eliminación"
        footer={
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => setDeleteModal({ isOpen: false, document: null })}
            >
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Eliminar
            </Button>
          </div>
        }
      >
        <p className="text-gray-600">
          ¿Estás seguro que deseas eliminar este documento? Esta acción no se puede deshacer.
        </p>
        {deleteModal.document && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-900">
              {getDocumentTypeLabel(deleteModal.document.type)}
            </p>
            <p className="text-sm text-gray-600">
              {deleteModal.document.extracted?.fullName || "Sin nombre"}
            </p>
          </div>
        )}
      </Modal>
    </>
  );
}

// Mobile Card Component
function DocumentCard({ document, onDelete }) {
  const navigate = useNavigate();

  return (
    <div
      className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/documents/${document._id}`)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getDocumentTypeIcon(document.type)}</span>
          <div>
            <p className="font-medium text-gray-900">{getDocumentTypeLabel(document.type)}</p>
            <p className="text-sm text-gray-500">{document.extracted?.fullName || "Sin nombre"}</p>
          </div>
        </div>
        <Badge color={getStatusColor(document.status)}>{getStatusLabel(document.status)}</Badge>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Número:</span>
          <span className="font-mono text-gray-900">
            {maskDocumentNumber(
              document.extracted?.passportNumber || document.extracted?.documentNumber
            )}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Expiración:</span>
          <span className="text-gray-900">{formatDate(document.extracted?.expirationDate)}</span>
        </div>
        {document.daysUntilExpiration !== null && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Estado:</span>
            <Badge color={getExpirationColor(document.daysUntilExpiration, document.isExpired)}>
              {getExpirationText(document.daysUntilExpiration, document.isExpired)}
            </Badge>
          </div>
        )}
      </div>

      <div
        className="flex gap-2 mt-4 pt-4 border-t border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          size="sm"
          variant="secondary"
          className="flex-1"
          onClick={() => navigate(`/documents/${document._id}`)}
        >
          Ver Detalles
        </Button>
        <Button size="sm" variant="danger" onClick={onDelete}>
          Eliminar
        </Button>
      </div>
    </div>
  );
}

const documentShape = PropTypes.shape({
  _id: PropTypes.string.isRequired,
  type: PropTypes.oneOf(["PASSPORT", "VISA"]).isRequired,
  status: PropTypes.string.isRequired,
  isExpired: PropTypes.bool,
  daysUntilExpiration: PropTypes.oneOfType([PropTypes.number, PropTypes.oneOf([null])]),
  extracted: PropTypes.shape({
    fullName: PropTypes.string,
    nationality: PropTypes.string,
    passportNumber: PropTypes.string,
    documentNumber: PropTypes.string,
    expirationDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  }),
});

DocumentsTable.propTypes = {
  documents: PropTypes.arrayOf(documentShape).isRequired,
  loading: PropTypes.bool,
};

DocumentCard.propTypes = {
  document: documentShape.isRequired,
  onDelete: PropTypes.func.isRequired,
};
