import React from "react";
import { Link } from "react-router-dom";
import { getDocumentTypeInfo, getStatusInfo, getExpirationStatus } from "../../utils/constants";
import PropTypes from "prop-types";

/**
 * DocumentCard - Tarjeta de documento para la lista
 */
export function DocumentCard({ document }) {
  const { id, type, status, images, extracted, isExpired, daysUntilExpiration, createdAt } =
    document;

  const typeInfo = getDocumentTypeInfo(type);
  const statusInfo = getStatusInfo(status);
  const expirationStatus = getExpirationStatus(daysUntilExpiration);

  const thumbnailUrl = images?.[0]?.url;
  const displayName =
    extracted?.fullName ||
    (extracted?.givenNames && extracted?.surname
      ? `${extracted.givenNames} ${extracted.surname}`
      : null);
  const documentNumber = extracted?.passportNumber || extracted?.documentNumber;

  return (
    <Link
      to={`/documents/${id}`}
      className="
        block
        rounded-3xl
        bg-white
        ring-1 ring-slate-200
        shadow-sm hover:shadow-md
        transition-all duration-200
        p-4
        focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-2
        group
      "
    >
      <div className="flex gap-4">
        {/* Thumbnail */}
        <div className="w-20 h-20 flex-shrink-0 rounded-2xl overflow-hidden bg-slate-50 ring-1 ring-slate-200 relative">
          {thumbnailUrl ? (
            <img src={thumbnailUrl} alt={typeInfo.label} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl">
              {typeInfo.icon}
            </div>
          )}

          {/* Badge de expirado */}
          {isExpired && (
            <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
              <span className="text-xs font-bold text-red-400 bg-red-500/30 px-2 py-1 rounded">
                EXPIRADO
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {/* Tipo y estado */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-slate-400">{typeInfo.label}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>

          {/* Nombre o número */}
          <h3 className="text-slate-900 font-semibold truncate mb-1 group-hover:text-primary-700 transition-colors">
            {displayName || documentNumber || "Documento sin datos"}
          </h3>

          {/* Número de documento si hay nombre */}
          {displayName && documentNumber && (
            <p className="text-sm text-slate-500 truncate mb-2">{documentNumber}</p>
          )}

          {/* Expiración */}
          <div className="flex items-center gap-2">
            {extracted?.expirationDate ? (
              <span className={`text-xs ${expirationStatus.color} flex items-center gap-1`}>
                {expirationStatus.urgent && (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
                {isExpired ? "Expirado" : `Expira: ${expirationStatus.label}`}
              </span>
            ) : (
              <span className="text-xs text-slate-600">Sin fecha de expiración</span>
            )}
          </div>
        </div>

        {/* Flecha */}
        <div className="flex items-center">
          <svg
            className="w-5 h-5 text-slate-600 group-hover:text-slate-400 transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}

export default DocumentCard;

const ExtractedShape = PropTypes.shape({
  fullName: PropTypes.string,
  givenNames: PropTypes.string,
  surname: PropTypes.string,
  passportNumber: PropTypes.string,
  documentNumber: PropTypes.string,
  expirationDate: PropTypes.string, // o Date si lo manejás así, pero en GraphQL casi siempre viene string ISO
});

const ImageShape = PropTypes.shape({
  url: PropTypes.string,
});

DocumentCard.propTypes = {
  document: PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    images: PropTypes.arrayOf(ImageShape),
    extracted: ExtractedShape,
    isExpired: PropTypes.bool,
    daysUntilExpiration: PropTypes.number,
    createdAt: PropTypes.string,
  }).isRequired,
};
