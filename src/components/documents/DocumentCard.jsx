// DocumentCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import { getDocumentTypeInfo, getStatusInfo, getExpirationStatus } from "../../utils/constants";
import PropTypes from "prop-types";

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

  const isUrgent = !!extracted?.expirationDate && !isExpired && !!expirationStatus?.urgent;
  const isVigente =
    !!extracted?.expirationDate &&
    !isExpired &&
    !expirationStatus?.urgent &&
    expirationStatus?.label === "Vigente";

  return (
    <Link
      to={`/documents/${id}`}
      className="
        block
        rounded-2xl
        bg-white
        border border-slate-200
        hover:border-slate-300
        transition-all duration-200
        p-3 sm:p-4
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        group
      "
    >
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Thumbnail */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-xl overflow-hidden bg-slate-50 border border-slate-200">
          {thumbnailUrl ? (
            <img src={thumbnailUrl} alt={typeInfo.label} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl text-slate-400">
              {typeInfo.icon}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1 flex flex-col pt-0.5">
          {/* Top row: type + badge | chevron */}
          <div className="flex items-start justify-between gap-3 min-w-0">
            <div className="min-w-0 flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500 shrink-0">{typeInfo.label}</span>

              <span
                className="
                  min-w-0
                  max-w-[11.5rem]
                  text-xs font-medium
                  px-2.5 py-1
                  rounded-md
                  bg-amber-50 text-amber-700
                  border border-amber-200
                  whitespace-nowrap
                  overflow-hidden text-ellipsis
                "
                title="Datos Capturados"
              >
                Datos Capturados
              </span>
            </div>

            <div className="flex-shrink-0 pt-0.5">
              <svg
                className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>

          {/* ID (document number) */}
          <h3
            className="
              mt-2
              text-base sm:text-lg
              font-semibold
              text-slate-900
              group-hover:text-blue-600
              transition-colors
              min-w-0
              truncate
            "
            title={documentNumber || "Documento sin datos"}
          >
            {documentNumber || "Documento sin datos"}
          </h3>

          {/* Name (max 2 lines) */}
          {displayName && (
            <p
              className="mt-1.5 text-sm text-slate-600 min-w-0 break-words"
              title={displayName}
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {displayName}
            </p>
          )}

          {/* Status row */}
          <div className="mt-3 flex items-center gap-1.5 min-w-0">
            {extracted?.expirationDate ? (
              <>
                <svg
                  className={`w-4 h-4 flex-shrink-0 ${
                    isExpired
                      ? "text-red-500"
                      : isUrgent
                      ? "text-amber-500"
                      : isVigente
                      ? "text-emerald-500"
                      : "text-slate-400"
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>

                <span
                  className={`text-sm font-medium min-w-0 truncate ${
                    isExpired
                      ? "text-red-600"
                      : isUrgent
                      ? "text-amber-600"
                      : isVigente
                      ? "text-emerald-600"
                      : "text-slate-600"
                  }`}
                  title={isExpired ? "Expirado" : `Expira en ${expirationStatus.label}`}
                >
                  {isExpired ? "Expirado" : `Expira en ${expirationStatus.label}`}
                </span>
              </>
            ) : (
              <span
                className="text-sm text-slate-500 min-w-0 truncate"
                title="Sin fecha de expiración"
              >
                Sin fecha de expiración
              </span>
            )}
          </div>
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
  expirationDate: PropTypes.string,
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
