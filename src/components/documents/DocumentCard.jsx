import React from "react";
import { useNavigate } from "react-router-dom";
import { getDocumentTypeInfo, getStatusInfo, getExpirationStatus } from "../../utils/constants";
import PropTypes from "prop-types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return null;
  try {
    return new Intl.DateTimeFormat("es-CR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(dateStr));
  } catch {
    return null;
  }
}

function getOwnerFullName(owner) {
  if (!owner) return null;
  if (typeof owner === "string") return null; // no populado
  return (
    [owner.name, owner.firstSurName, owner.secondSurName].filter(Boolean).join(" ").trim() ||
    owner.email ||
    null
  );
}

function isPdfMimeType(type) {
  return type === "application/pdf" || type === "image/pdf";
}

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_STYLES = {
  UPLOADED: {
    bg: "bg-slate-100",
    text: "text-slate-600",
    border: "border-slate-200",
    label: "Subido",
  },
  DATA_CAPTURED: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    label: "Datos capturados",
  },
  CAPTURE_ACCEPTED: {
    bg: "bg-sky-50",
    text: "text-sky-700",
    border: "border-sky-200",
    label: "Captura aceptada",
  },
  OCR_PENDING: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    label: "OCR pendiente",
  },
  OCR_PROCESSING: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    label: "OCR procesando",
  },
  OCR_SUCCESS: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    label: "OCR exitoso",
  },
  OCR_FAILED: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    label: "OCR fallido",
  },
  VERIFIED: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    label: "Verificado",
  },
  REJECTED: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", label: "Rechazado" },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || {
    bg: "bg-slate-100",
    text: "text-slate-600",
    border: "border-slate-200",
    label: status,
  };
  return (
    <span
      className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-md border ${s.bg} ${s.text} ${s.border} whitespace-nowrap`}
    >
      {s.label}
    </span>
  );
}

// ── Main card ─────────────────────────────────────────────────────────────────

export function DocumentCard({ document, showOwner, actions }) {
  const navigate = useNavigate();

  const {
    _id,
    id,
    type,
    status,
    images,
    extracted,
    isExpired,
    daysUntilExpiration,
    createdAt,
    owner,
  } = document;

  // _id preferred (Mongoose), fallback to id (Apollo cache alias)
  const docId = _id || id;

  const typeInfo = getDocumentTypeInfo(type);
  const expirationStatus = getExpirationStatus(daysUntilExpiration);

  const thumbnail = images?.[0] || null;
  const thumbnailUrl = thumbnail?.url;
  const isPdfThumbnail = isPdfMimeType(thumbnail?.mimeType);

  const displayName =
    extracted?.fullName ||
    (extracted?.givenNames && extracted?.surname
      ? `${extracted.givenNames} ${extracted.surname}`
      : null);

  const documentNumber = extracted?.passportNumber || extracted?.documentNumber;

  const ownerName = showOwner ? getOwnerFullName(owner) : null;
  const ownerEmail = showOwner && owner && typeof owner === "object" ? owner.email : null;

  const isUrgent = !!extracted?.expirationDate && !isExpired && !!expirationStatus?.urgent;
  const isVigente =
    !!extracted?.expirationDate &&
    !isExpired &&
    !expirationStatus?.urgent &&
    expirationStatus?.label === "Vigente";

  const expirationColor = isExpired
    ? "text-red-600"
    : isUrgent
    ? "text-amber-600"
    : isVigente
    ? "text-emerald-600"
    : "text-slate-600";
  const expirationIconColor = isExpired
    ? "text-red-500"
    : isUrgent
    ? "text-amber-500"
    : isVigente
    ? "text-emerald-500"
    : "text-slate-400";

  const handleClick = () => {
    if (docId) navigate(`/documents/${docId}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="
        block w-full text-left cursor-pointer
        rounded-2xl bg-white
        border border-slate-200
        hover:border-slate-300 hover:shadow-sm
        active:scale-[0.99]
        transition-all duration-200
        p-3 sm:p-4
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        group
      "
    >
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Thumbnail */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-xl overflow-hidden bg-slate-50 border border-slate-200">
          {thumbnailUrl && !isPdfThumbnail ? (
            <img
              src={thumbnailUrl}
              alt={typeInfo?.label ?? type}
              className="w-full h-full object-cover"
            />
          ) : isPdfThumbnail ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-red-50 text-red-600">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M7 21h10a2 2 0 002-2V8.414a2 2 0 00-.586-1.414l-3.414-3.414A2 2 0 0013.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M13 3v5h5M9 13h6M9 17h4"
                />
              </svg>
              <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold tracking-wide">
                PDF
              </span>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl text-slate-300">
              {typeInfo?.icon ?? "📄"}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1 flex flex-col pt-0.5">
          {/* Top row: type label + status badge + chevron */}
          <div className="flex items-start justify-between gap-2 min-w-0">
            <div className="min-w-0 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-500 shrink-0">
                {typeInfo?.label ?? type}
              </span>
              <StatusBadge status={status} />
            </div>
            <div className="flex items-start gap-2 flex-shrink-0">
              {actions}
              <svg
                className="w-5 h-5 flex-shrink-0 text-slate-400 group-hover:text-slate-600 transition-colors mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {/* Document number */}
          {showOwner && (ownerName || ownerEmail) && (
            <h3 className="mt-2 text-base sm:text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
              {ownerName}
            </h3>
          )}

          {/* Holder name (from extracted data) */}
          {displayName && (
            <p className="mt-0.5 text-sm text-slate-600 truncate" title={displayName}>
              {displayName}
            </p>
          )}

          {/* Owner (admin view) */}
          {/* {showOwner && (ownerName || ownerEmail) && (
            <div className="mt-1.5 flex items-center gap-1.5 min-w-0">
              <div className="w-4 h-4 flex-shrink-0 rounded-full bg-violet-100 flex items-center justify-center">
                <svg
                  className="w-2.5 h-2.5 text-violet-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <span
                className="text-xs text-violet-700 font-medium truncate"
                title={ownerName ?? ownerEmail}
              >
                {ownerName ?? ownerEmail}
              </span>
            </div>
          )} */}

          {/* Bottom row: expiration + created date */}
          <div className="mt-2.5 flex items-center justify-between gap-2 min-w-0">
            {/* Expiration */}
            {extracted?.expirationDate ? (
              <div className="flex items-center gap-1 min-w-0">
                <svg
                  className={`w-3.5 h-3.5 flex-shrink-0 ${expirationIconColor}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className={`text-xs font-medium truncate ${expirationColor}`}>
                  {isExpired
                    ? `Expirado · ${formatDate(extracted.expirationDate)}`
                    : `Vence ${formatDate(extracted.expirationDate)}`}
                </span>
              </div>
            ) : (
              <span className="text-xs text-slate-400">Sin fecha de vencimiento</span>
            )}

            {/* Created at */}
            {createdAt && (
              <span className="text-xs text-slate-400 flex-shrink-0">{formatDate(createdAt)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DocumentCard;

// ── PropTypes ─────────────────────────────────────────────────────────────────

const OwnerShape = PropTypes.oneOfType([
  PropTypes.string,
  PropTypes.shape({
    _id: PropTypes.string,
    name: PropTypes.string,
    firstSurName: PropTypes.string,
    secondSurName: PropTypes.string,
    email: PropTypes.string,
  }),
]);

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
  mimeType: PropTypes.string,
  publicId: PropTypes.string,
});

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
};

DocumentCard.propTypes = {
  document: PropTypes.shape({
    _id: PropTypes.string,
    id: PropTypes.string,
    type: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    images: PropTypes.arrayOf(ImageShape),
    extracted: ExtractedShape,
    isExpired: PropTypes.bool,
    daysUntilExpiration: PropTypes.number,
    createdAt: PropTypes.string,
    owner: OwnerShape,
  }).isRequired,
  showOwner: PropTypes.bool,
  actions: PropTypes.node,
};

DocumentCard.defaultProps = {
  showOwner: false,
  actions: null,
};
