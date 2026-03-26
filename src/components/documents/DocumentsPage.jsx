import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { MY_DOCUMENTS, ALL_DOCUMENTS } from "../../graphql/documents/documents.gql.js";
import { DocumentList } from "../../components/documents/DocumentList";
import { DocumentFilters } from "../../components/documents/DocumentsFilters.jsx";
import { GET_USERS_BY_ID } from "graphql/queries";
import { isDocumentAdmin, SENSITIVE_DOCUMENT_TYPES } from "./documentAccess";
import { getStatusLabel, maskDocumentNumber } from "../../utils/documentHelpers";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Card from "@mui/material/Card";
import SoftBox from "components/SoftBox";
import PropTypes from "prop-types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mergeDocumentsResult(previousResult, fetchMoreResult, resultKey) {
  if (!fetchMoreResult?.[resultKey]) return previousResult;

  const previousDocuments = previousResult?.[resultKey]?.documents || [];
  const nextDocuments = fetchMoreResult[resultKey].documents || [];
  const seen = new Set(previousDocuments.map((doc) => doc.id || doc._id));
  const mergedDocuments = [...previousDocuments];

  nextDocuments.forEach((doc) => {
    const docId = doc.id || doc._id;
    if (seen.has(docId)) return;
    seen.add(docId);
    mergedDocuments.push(doc);
  });

  return {
    ...fetchMoreResult,
    [resultKey]: {
      ...fetchMoreResult[resultKey],
      documents: mergedDocuments,
    },
  };
}

function formatDate(dateValue) {
  if (!dateValue) return "—";
  try {
    return new Date(dateValue).toLocaleDateString("es-CR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return "—";
  }
}

function getDateValue(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getDaysUntilExpiration(value) {
  const date = getDateValue(value);
  if (!date) return null;

  const now = new Date();
  const startOfToday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const startOfTarget = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );

  return Math.floor((startOfTarget - startOfToday) / (1000 * 60 * 60 * 24));
}

function getExpiryState(value) {
  const days = getDaysUntilExpiration(value);
  if (days == null) return { kind: "missing", label: "Sin fecha", color: "#9CA3AF" };
  if (days < 0) return { kind: "expired", label: `Vencido hace ${Math.abs(days)}d`, color: "#DC2626" };
  if (days <= 30) return { kind: "critical", label: `${days}d restantes`, color: "#EA580C" };
  if (days <= 90) return { kind: "warning", label: `${days}d restantes`, color: "#D97706" };
  return { kind: "ok", label: `${days}d restantes`, color: "#059669" };
}

function sortDocumentsByFreshness(documents) {
  return [...documents].sort((a, b) => {
    const aDate = getDateValue(a.updatedAt || a.createdAt)?.getTime() || 0;
    const bDate = getDateValue(b.updatedAt || b.createdAt)?.getTime() || 0;
    return bDate - aDate;
  });
}

function getOwnerLabel(owner) {
  if (!owner) return "Sin propietario";
  const fullName = [owner.name, owner.firstSurName, owner.secondSurName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return fullName || owner.email || "Sin nombre";
}

function getDocumentTypeLabel(type) {
  switch (type) {
    case "PASSPORT":
      return "Pasaporte";
    case "VISA":
      return "Visa";
    case "PERMISO_SALIDA":
      return "Permiso de salida";
    case "OTHER":
      return "Documento adjunto";
    default:
      return type || "Documento";
  }
}

function getPreviewImage(document) {
  if (!document?.images?.length) return null;
  return document.images.find((image) => image.kind === "NORMALIZED") || document.images[0];
}

function buildExtractedFields(document) {
  const extracted = document?.extracted || {};
  return [
    { label: "Nombre completo", value: extracted.fullName },
    { label: "Nombres", value: extracted.givenNames },
    { label: "Apellidos", value: extracted.surname },
    { label: "Nacionalidad", value: extracted.nationality },
    { label: "País emisor", value: extracted.issuingCountry },
    { label: "Número documento", value: extracted.documentNumber, sensitive: true },
    { label: "Número pasaporte", value: extracted.passportNumber, sensitive: true },
    { label: "Tipo de visa", value: extracted.visaType },
    { label: "Control visa", value: extracted.visaControlNumber },
    {
      label: "Nacimiento",
      value:
        formatDate(extracted.dateOfBirth) !== "—" ? formatDate(extracted.dateOfBirth) : null,
    },
    { label: "Sexo", value: extracted.sex },
    {
      label: "Expiración",
      value:
        formatDate(extracted.expirationDate) !== "—"
          ? formatDate(extracted.expirationDate)
          : null,
    },
    {
      label: "Emisión",
      value:
        formatDate(extracted.issueDate) !== "—" ? formatDate(extracted.issueDate) : null,
    },
    { label: "Destino", value: extracted.destination },
    { label: "Autorizante", value: extracted.authorizerName },
    {
      label: "MRZ válido",
      value:
        typeof extracted.mrzValid === "boolean" ? (extracted.mrzValid ? "Sí" : "No") : null,
    },
    { label: "Formato MRZ", value: extracted.mrzFormat },
    {
      label: "Confianza OCR",
      value: extracted.ocrConfidence != null ? `${Math.round(extracted.ocrConfidence)}%` : null,
    },
    { label: "Texto OCR", value: extracted.ocrText },
  ].filter((field) => field.value);
}

function computeRowStatus(row) {
  const docs = [row.passport, row.visa, row.exitPermit].filter(Boolean);
  const statuses = docs.map((doc) => doc.status);
  const expiryStates = [row.passport, row.visa]
    .filter(Boolean)
    .map((doc) => getExpiryState(doc.extracted?.expirationDate).kind);

  if (statuses.includes("REJECTED")) return "REJECTED";
  if (expiryStates.includes("expired")) return "EXPIRED";
  if (expiryStates.includes("critical")) return "EXPIRING";

  const hasPendingState = statuses.some((status) =>
    [
      "UPLOADED",
      "DATA_CAPTURED",
      "CAPTURE_ACCEPTED",
      "OCR_PENDING",
      "OCR_PROCESSING",
      "OCR_FAILED",
    ].includes(status)
  );

  if (hasPendingState) return "INCOMPLETE";
  return "COMPLETE";
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TABLE_STATUS_FILTERS = [
  { value: "ALL", label: "Todos" },
  { value: "COMPLETE", label: "Completos" },
  { value: "INCOMPLETE", label: "Pendientes" },
  { value: "EXPIRED", label: "Vencidos" },
  { value: "EXPIRING", label: "Por vencer" },
  { value: "REJECTED", label: "Rechazados" },
];

const TYPE_OPTIONS = [
  { value: "", label: "Todos los tipos" },
  { value: "PASSPORT", label: "Pasaporte" },
  { value: "VISA", label: "Visa" },
  { value: "PERMISO_SALIDA", label: "Permiso de salida" },
  { value: "OTHER", label: "Otro" },
];

const ROW_STATUS_CONFIG = {
  COMPLETE: { label: "Completo", bg: "#ECFDF5", color: "#065F46", border: "#A7F3D0" },
  INCOMPLETE: { label: "Pendiente", bg: "#FFFBEB", color: "#92400E", border: "#FDE68A" },
  EXPIRED: { label: "Vencido", bg: "#FEF2F2", color: "#991B1B", border: "#FECACA" },
  EXPIRING: { label: "Por vencer", bg: "#FFF7ED", color: "#9A3412", border: "#FED7AA" },
  REJECTED: { label: "Rechazado", bg: "#FEF2F2", color: "#991B1B", border: "#FCA5A5" },
};

const DOCUMENT_BADGE_STYLES = {
  VERIFIED: { bg: "#ECFDF5", color: "#065F46", border: "#A7F3D0" },
  OCR_SUCCESS: { bg: "#ECFDF5", color: "#065F46", border: "#A7F3D0" },
  OCR_FAILED: { bg: "#FEF2F2", color: "#991B1B", border: "#FECACA" },
  REJECTED: { bg: "#FEF2F2", color: "#991B1B", border: "#FCA5A5" },
  OCR_PENDING: { bg: "#FEF3C7", color: "#92400E", border: "#FDE68A" },
  OCR_PROCESSING: { bg: "#FEF3C7", color: "#92400E", border: "#FDE68A" },
  CAPTURE_ACCEPTED: { bg: "#E0F2FE", color: "#075985", border: "#BAE6FD" },
  DATA_CAPTURED: { bg: "#DBEAFE", color: "#1D4ED8", border: "#BFDBFE" },
  UPLOADED: { bg: "#F1F5F9", color: "#475569", border: "#CBD5E1" },
};

// Left-border color class per aggregate status (Tailwind arbitrary values via style)
const ROW_STATUS_BORDER_COLOR = {
  COMPLETE: "#10B981",
  INCOMPLETE: "#38BDF8",
  EXPIRED: "#EF4444",
  EXPIRING: "#F59E0B",
  REJECTED: "#DC2626",
};

// ─── Small UI components ───────────────────────────────────────────────────────

function TabButton({ active, onClick, children, count }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all
        ${
          active
            ? "bg-slate-900 text-white shadow-sm"
            : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
        }
      `}
    >
      {children}
      {count != null && (
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-bold ${
            active ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

TabButton.propTypes = {
  active: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  count: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

function AggregateStatusBadge({ status }) {
  const config = ROW_STATUS_CONFIG[status] || ROW_STATUS_CONFIG.INCOMPLETE;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "4px 10px",
        borderRadius: "9999px",
        fontSize: "11px",
        fontWeight: 700,
        background: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {config.label}
    </span>
  );
}

AggregateStatusBadge.propTypes = {
  status: PropTypes.string,
};

function DocumentStateBadge({ status }) {
  if (!status) return null;
  const style = DOCUMENT_BADGE_STYLES[status] || DOCUMENT_BADGE_STYLES.UPLOADED;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2px 8px",
        borderRadius: "9999px",
        fontSize: "10px",
        fontWeight: 700,
        background: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {getStatusLabel(status)}
    </span>
  );
}

DocumentStateBadge.propTypes = {
  status: PropTypes.string,
};

function ExpiryInfo({ date }) {
  const state = getExpiryState(date);
  if (state.kind === "missing") {
    return <span style={{ fontSize: "11px", color: state.color }}>{state.label}</span>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
      <span style={{ fontSize: "11px", color: "#475569" }}>{formatDate(date)}</span>
      <span style={{ fontSize: "10px", fontWeight: 700, color: state.color }}>{state.label}</span>
    </div>
  );
}

ExpiryInfo.propTypes = {
  date: PropTypes.string,
};

// ─── DocumentSlot: lean table cell for desktop (status + expiry only) ─────────

function DocumentSlot({ doc, extraCount, showExpiry }) {
  if (!doc) {
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs text-slate-300 border border-dashed border-slate-200 rounded-lg px-2 py-0.5 whitespace-nowrap">
          Sin archivo
        </span>
      </div>
    );
  }

  const expiry = showExpiry ? getExpiryState(doc.extracted?.expirationDate) : null;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <DocumentStateBadge status={doc.status} />
      {showExpiry && doc.extracted?.expirationDate && (
        <>
          <span style={{ fontSize: "11px", color: "#64748B" }}>
            {formatDate(doc.extracted.expirationDate)}
          </span>
          <span style={{ fontSize: "10px", fontWeight: 700, color: expiry?.color }}>
            {expiry?.label}
          </span>
        </>
      )}
      {showExpiry && !doc.extracted?.expirationDate && (
        <span style={{ fontSize: "10px", color: "#9CA3AF" }}>Sin fecha de vencimiento</span>
      )}
      <Link
        to={`/documents/${doc.id}`}
        onClick={(e) => e.stopPropagation()}
        className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 mt-0.5 transition-colors"
      >
        Ver
      </Link>
      {extraCount > 0 && (
        <span className="text-[10px] text-slate-400">+{extraCount} adicional(es)</span>
      )}
    </div>
  );
}

DocumentSlot.propTypes = {
  doc: PropTypes.shape({
    id: PropTypes.string,
    status: PropTypes.string,
    extracted: PropTypes.shape({
      expirationDate: PropTypes.string,
    }),
  }),
  extraCount: PropTypes.number,
  showExpiry: PropTypes.bool,
};

DocumentSlot.defaultProps = {
  doc: null,
  extraCount: 0,
  showExpiry: false,
};

// ─── OtherDocsBadge: neutral chip — never competes with identity docs ─────────

function OtherDocsBadge({ count }) {
  if (!count) {
    return <span className="text-xs text-slate-300">—</span>;
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
        />
      </svg>
      {count}
    </span>
  );
}

OtherDocsBadge.propTypes = {
  count: PropTypes.number,
};

OtherDocsBadge.defaultProps = {
  count: 0,
};

// ─── DocumentCell: used in mobile expanded view ───────────────────────────────

function DocumentCell({ document, extraCount }) {
  if (!document) {
    return <span style={{ fontSize: "11px", color: "#9CA3AF" }}>Sin archivo</span>;
  }

  const docNumber = document.extracted?.passportNumber || document.extracted?.documentNumber;
  const expiry = document.extracted?.expirationDate
    ? getExpiryState(document.extracted.expirationDate)
    : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
      <DocumentStateBadge status={document.status} />
      {docNumber && (
        <span style={{ fontSize: "11px", color: "#475569", fontFamily: "monospace" }}>
          {maskDocumentNumber(docNumber)}
        </span>
      )}
      {document.extracted?.fullName && (
        <span
          style={{
            maxWidth: "120px",
            fontSize: "10px",
            color: "#64748B",
            textAlign: "center",
            lineHeight: 1.25,
          }}
        >
          {document.extracted.fullName}
        </span>
      )}
      {expiry && (
        <span style={{ fontSize: "10px", fontWeight: 700, color: expiry.color }}>
          {expiry.label}
        </span>
      )}
      <Link
        to={`/documents/${document.id}`}
        onClick={(event) => event.stopPropagation()}
        style={{
          fontSize: "11px",
          fontWeight: 700,
          color: "#1D4ED8",
          textDecoration: "none",
        }}
      >
        Ver documento
      </Link>
      {extraCount > 0 && (
        <span style={{ fontSize: "10px", color: "#64748B" }}>+{extraCount} adicional(es)</span>
      )}
    </div>
  );
}

DocumentCell.propTypes = {
  document: PropTypes.shape({
    id: PropTypes.string,
    status: PropTypes.string,
    extracted: PropTypes.shape({
      fullName: PropTypes.string,
      passportNumber: PropTypes.string,
      documentNumber: PropTypes.string,
      expirationDate: PropTypes.string,
    }),
  }),
  extraCount: PropTypes.number,
};

DocumentCell.defaultProps = {
  document: null,
  extraCount: 0,
};

// ─── FullDocumentCard: expanded card used in detail views ─────────────────────

function FullDocumentCard({ document }) {
  const previewImage = getPreviewImage(document);
  const extractedFields = buildExtractedFields(document);
  const expiry = getExpiryState(document.extracted?.expirationDate);
  const docNumber = document.extracted?.passportNumber || document.extracted?.documentNumber;
  const primaryFields = extractedFields.slice(0, 8);
  const secondaryFields = extractedFields.slice(8);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-slate-900">
                {getDocumentTypeLabel(document.type)}
              </h3>
              <DocumentStateBadge status={document.status} />
              {document.extracted?.expirationDate && (
                <span
                  className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold"
                  style={{ background: "#F8FAFC", color: expiry.color, border: "1px solid #E2E8F0" }}
                >
                  {expiry.label}
                </span>
              )}
            </div>

            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              <span>ID: {document.id}</span>
              <span>Creado: {formatDate(document.createdAt)}</span>
              <span>Actualizado: {formatDate(document.updatedAt)}</span>
              <span>Imágenes: {document.images?.length || 0}</span>
              <span>Intentos OCR: {document.ocrAttempts ?? 0}</span>
            </div>

            {(document.extracted?.fullName || docNumber || document.notes) && (
              <div className="mt-3 space-y-1 text-sm text-slate-700">
                {document.extracted?.fullName && (
                  <p>
                    <span className="font-semibold text-slate-900">Titular:</span>{" "}
                    {document.extracted.fullName}
                  </p>
                )}
                {docNumber && (
                  <p>
                    <span className="font-semibold text-slate-900">Número:</span>{" "}
                    {maskDocumentNumber(docNumber)}
                  </p>
                )}
                {document.notes && (
                  <p>
                    <span className="font-semibold text-slate-900">Notas:</span> {document.notes}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {previewImage?.url && (
              <img
                src={previewImage.url}
                alt={getDocumentTypeLabel(document.type)}
                className="h-16 w-16 rounded-xl border border-slate-200 bg-slate-50 object-cover"
              />
            )}
            <Link
              to={`/documents/${document.id}`}
              className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Abrir detalle
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
              Datos principales
            </p>
            {primaryFields.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">
                No hay datos estructurados en este documento.
              </p>
            ) : (
              <div className="mt-2 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                {primaryFields.map((field) => (
                  <p key={field.label} className="break-words text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">{field.label}:</span>{" "}
                    {field.sensitive ? maskDocumentNumber(field.value) : field.value}
                  </p>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
              Datos adicionales
            </p>
            {secondaryFields.length === 0 && !document.ocrLastError ? (
              <p className="mt-2 text-sm text-slate-500">Sin datos adicionales.</p>
            ) : (
              <div className="mt-2 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                {secondaryFields.map((field) => (
                  <p key={field.label} className="break-words text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">{field.label}:</span>{" "}
                    {field.sensitive ? maskDocumentNumber(field.value) : field.value}
                  </p>
                ))}
                {document.ocrLastError && (
                  <p className="break-words text-sm text-slate-700 sm:col-span-2">
                    <span className="font-semibold text-slate-900">Error OCR:</span>{" "}
                    {document.ocrLastError}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

FullDocumentCard.propTypes = {
  document: PropTypes.shape({
    id: PropTypes.string,
    type: PropTypes.string,
    status: PropTypes.string,
    notes: PropTypes.string,
    createdAt: PropTypes.string,
    updatedAt: PropTypes.string,
    ocrAttempts: PropTypes.number,
    ocrLastError: PropTypes.string,
    images: PropTypes.arrayOf(
      PropTypes.shape({
        url: PropTypes.string,
        kind: PropTypes.string,
      })
    ),
    extracted: PropTypes.object,
  }).isRequired,
};

// ─── CriticalDocBlock: one row inside UserDetailPanel ─────────────────────────

function CriticalDocBlock({ typeLabel, icon, doc, extraDocs }) {
  if (!doc) {
    return (
      <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <span className="text-sm font-medium text-slate-700">{typeLabel}</span>
        </div>
        <span className="text-xs text-slate-400 border border-dashed border-slate-200 rounded-full px-2.5 py-0.5">
          Sin archivo
        </span>
      </div>
    );
  }

  const expiry = getExpiryState(doc.extracted?.expirationDate);
  const docNumber = doc.extracted?.passportNumber || doc.extracted?.documentNumber;

  return (
    <div className="py-3 border-b border-slate-100 last:border-0">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-slate-900">{typeLabel}</span>
              <DocumentStateBadge status={doc.status} />
            </div>
            {docNumber && (
              <span className="text-xs text-slate-500 font-mono mt-1 block">
                {maskDocumentNumber(docNumber)}
              </span>
            )}
            {doc.extracted?.expirationDate && (
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span className="text-xs text-slate-500">
                  Vence: {formatDate(doc.extracted.expirationDate)}
                </span>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: expiry.color,
                    background:
                      expiry.kind === "expired"
                        ? "#FEF2F2"
                        : expiry.kind === "critical"
                        ? "#FFF7ED"
                        : expiry.kind === "warning"
                        ? "#FFFBEB"
                        : "#ECFDF5",
                    padding: "1px 6px",
                    borderRadius: "9999px",
                  }}
                >
                  {expiry.label}
                </span>
              </div>
            )}
            {!doc.extracted?.expirationDate && (
              <span className="text-xs text-slate-400 mt-1 block">Sin fecha de vencimiento</span>
            )}
          </div>
        </div>
        <Link
          to={`/documents/${doc.id}`}
          className="flex-shrink-0 text-xs font-semibold text-blue-600 hover:text-blue-800 px-2.5 py-1 rounded-lg hover:bg-blue-50 transition-colors whitespace-nowrap"
        >
          Abrir
        </Link>
      </div>

      {extraDocs?.length > 0 && (
        <div className="mt-2 ml-7 space-y-1.5">
          {extraDocs.map((extra) => (
            <div
              key={extra.id}
              className="flex items-center justify-between gap-2 pl-2 border-l-2 border-slate-200"
            >
              <div className="flex items-center gap-1.5 flex-wrap">
                <DocumentStateBadge status={extra.status} />
                <span className="text-[10px] text-slate-400">{formatDate(extra.createdAt)}</span>
              </div>
              <Link
                to={`/documents/${extra.id}`}
                className="text-[10px] font-semibold text-blue-500 hover:text-blue-700 whitespace-nowrap"
              >
                Ver
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

CriticalDocBlock.propTypes = {
  typeLabel: PropTypes.string.isRequired,
  icon: PropTypes.string.isRequired,
  doc: PropTypes.shape({
    id: PropTypes.string,
    status: PropTypes.string,
    createdAt: PropTypes.string,
    extracted: PropTypes.shape({
      passportNumber: PropTypes.string,
      documentNumber: PropTypes.string,
      expirationDate: PropTypes.string,
    }),
  }),
  extraDocs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      status: PropTypes.string,
      createdAt: PropTypes.string,
    })
  ),
};

CriticalDocBlock.defaultProps = {
  doc: null,
  extraDocs: [],
};

// ─── UserDetailPanel: slide-in panel with full user document detail ───────────

function UserDetailPanel({ row, onClose }) {
  const criticalDocs = row.documents.filter((d) => SENSITIVE_DOCUMENT_TYPES.includes(d.type));
  const otherDocs = row.documents.filter((d) => d.type === "OTHER");

  const passportDocs = sortDocumentsByFreshness(criticalDocs.filter((d) => d.type === "PASSPORT"));
  const visaDocs = sortDocumentsByFreshness(criticalDocs.filter((d) => d.type === "VISA"));
  const permitDocs = sortDocumentsByFreshness(
    criticalDocs.filter((d) => d.type === "PERMISO_SALIDA")
  );

  return (
    <div className="flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden h-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-200 flex-shrink-0">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-900 truncate leading-snug">
            {row.ownerLabel}
          </h3>
          <p className="text-xs text-slate-500 truncate mt-0.5">{row.owner?.email || "Sin correo"}</p>
          <div className="mt-2">
            <AggregateStatusBadge status={row.aggregateStatus} />
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Cerrar panel"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        {/* Identity documents section */}
        <div className="px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 mb-1">
            Documentos de identidad
          </p>
          <CriticalDocBlock
            typeLabel="Pasaporte"
            icon="🛂"
            doc={passportDocs[0] || null}
            extraDocs={passportDocs.slice(1)}
          />
          <CriticalDocBlock
            typeLabel="Visa"
            icon="🌍"
            doc={visaDocs[0] || null}
            extraDocs={visaDocs.slice(1)}
          />
          <CriticalDocBlock
            typeLabel="Permiso de salida"
            icon="📋"
            doc={permitDocs[0] || null}
            extraDocs={permitDocs.slice(1)}
          />
        </div>

        {/* Complementary documents section — visually distinct */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 mb-3">
            Documentos complementarios
            {otherDocs.length > 0 && (
              <span className="ml-1.5 normal-case font-medium text-slate-400">
                ({otherDocs.length})
              </span>
            )}
          </p>
          {otherDocs.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Sin documentos adjuntos</p>
          ) : (
            <div className="space-y-2">
              {otherDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between gap-2 bg-white rounded-xl px-3 py-2.5 ring-1 ring-slate-200"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <svg
                      className="w-3.5 h-3.5 text-slate-400 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                      />
                    </svg>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <DocumentStateBadge status={doc.status} />
                        <span className="text-[10px] text-slate-400">
                          {formatDate(doc.createdAt)}
                        </span>
                      </div>
                      {doc.notes && (
                        <p className="text-xs text-slate-600 truncate mt-0.5">{doc.notes}</p>
                      )}
                    </div>
                  </div>
                  <Link
                    to={`/documents/${doc.id}`}
                    className="flex-shrink-0 text-xs font-semibold text-blue-600 hover:text-blue-800 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors whitespace-nowrap"
                  >
                    Ver
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

UserDetailPanel.propTypes = {
  row: PropTypes.shape({
    ownerLabel: PropTypes.string,
    aggregateStatus: PropTypes.string,
    owner: PropTypes.shape({ email: PropTypes.string }),
    documents: PropTypes.array,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
};

// ─── MobileSummaryItem ────────────────────────────────────────────────────────

function MobileSummaryItem({ label, children }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">{label}</p>
      <div className="mt-2 min-h-[28px]">{children}</div>
    </div>
  );
}

MobileSummaryItem.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node,
};

// ─── MobileRowCard: card for mobile list with status left-border ───────────────

function MobileRowCard({ row, expanded, onToggle }) {
  const borderColor = ROW_STATUS_BORDER_COLOR[row.aggregateStatus] || "#CBD5E1";

  return (
    <div
      className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200"
      style={{ borderLeft: `4px solid ${borderColor}` }}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-slate-900">{row.ownerLabel}</h3>
            <p className="mt-1 break-all text-xs text-slate-500">
              {row.owner?.email || "Sin correo"}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {row.counts.total} documento(s) cargado(s)
            </p>
          </div>
          <AggregateStatusBadge status={row.aggregateStatus} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <MobileSummaryItem label="Pasaporte">
            <DocumentCell
              document={row.passport}
              extraCount={Math.max(0, row.counts.passport - 1)}
            />
          </MobileSummaryItem>
          <MobileSummaryItem label="Vence pasaporte">
            {row.passport ? (
              <ExpiryInfo date={row.passport.extracted?.expirationDate} />
            ) : (
              <span className="text-xs text-slate-300">—</span>
            )}
          </MobileSummaryItem>
          <MobileSummaryItem label="Visa">
            <DocumentCell document={row.visa} extraCount={Math.max(0, row.counts.visa - 1)} />
          </MobileSummaryItem>
          <MobileSummaryItem label="Vence visa">
            {row.visa ? (
              <ExpiryInfo date={row.visa.extracted?.expirationDate} />
            ) : (
              <span className="text-xs text-slate-300">—</span>
            )}
          </MobileSummaryItem>
          <MobileSummaryItem label="Permiso salida">
            <DocumentCell
              document={row.exitPermit}
              extraCount={Math.max(0, row.counts.exitPermit - 1)}
            />
          </MobileSummaryItem>
          <MobileSummaryItem label="Adjuntos">
            <div className="flex items-center h-full">
              <OtherDocsBadge count={row.counts.other} />
            </div>
          </MobileSummaryItem>
        </div>

        <button
          type="button"
          onClick={onToggle}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          {expanded ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              Ocultar
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              Ver todo
            </>
          )}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-slate-200 bg-slate-50 p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold text-slate-900">
                Todos los documentos de {row.ownerLabel}
              </h4>
              <p className="mt-1 text-xs text-slate-500">
                Pasaportes, visas, permisos y documentos adjuntos.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-white px-3 py-1 font-semibold text-slate-700 ring-1 ring-slate-200">
                Total: {row.counts.total}
              </span>
              {row.counts.other > 0 && (
                <span className="rounded-full bg-white px-3 py-1 font-semibold text-slate-700 ring-1 ring-slate-200">
                  Adjuntos: {row.counts.other}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {row.documents.map((document) => (
              <FullDocumentCard key={document.id} document={document} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

MobileRowCard.propTypes = {
  row: PropTypes.object.isRequired,
  expanded: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
};

// ─── FinancieroView: specialized view for CEDES Financiero role ───────────────
// Only shows OTHER documents grouped by user — no identity data visible.

function FinancieroView() {
  const [pagination] = useState({ limit: 200, skip: 0 });
  const [ownerSearch, setOwnerSearch] = useState("");

  const { data, loading, error } = useQuery(ALL_DOCUMENTS, {
    variables: { pagination },
    fetchPolicy: "cache-and-network",
  });

  const documents = data?.allDocuments?.documents || [];

  const groupedRows = useMemo(() => {
    const ownersMap = new Map();
    const otherDocs = documents.filter((d) => d.type === "OTHER");

    otherDocs.forEach((doc) => {
      const owner = doc.owner || {};
      const ownerId = owner.id || owner.email || doc.id;
      const current = ownersMap.get(ownerId) || { id: ownerId, owner, documents: [] };
      current.documents.push(doc);
      ownersMap.set(ownerId, current);
    });

    return Array.from(ownersMap.values())
      .map((entry) => ({
        ...entry,
        ownerLabel: getOwnerLabel(entry.owner),
        documents: sortDocumentsByFreshness(entry.documents),
      }))
      .sort((a, b) => a.ownerLabel.localeCompare(b.ownerLabel, "es"));
  }, [documents]);

  const filteredRows = useMemo(() => {
    const search = ownerSearch.trim().toLowerCase();
    if (!search) return groupedRows;
    return groupedRows.filter((row) => {
      const haystack = [row.ownerLabel, row.owner?.email].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(search);
    });
  }, [groupedRows, ownerSearch]);

  if (loading && documents.length === 0) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-slate-100 animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-slate-600 text-sm">
          Error al cargar los documentos. Intenta de nuevo.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl ring-1 ring-slate-200 shadow-sm p-4">
        <label
          htmlFor="financiero-search"
          className="block text-xs text-slate-500 mb-1 font-medium"
        >
          Buscar integrante
        </label>
        <input
          id="financiero-search"
          type="text"
          value={ownerSearch}
          onChange={(e) => setOwnerSearch(e.target.value)}
          placeholder="Nombre, apellido o correo"
          className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400 text-slate-700"
        />
      </div>

      {filteredRows.length === 0 ? (
        <div className="bg-white rounded-2xl ring-1 ring-slate-200 shadow-sm p-10 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-slate-50 ring-1 ring-slate-200 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              />
            </svg>
          </div>
          <p className="text-base font-semibold text-slate-900">
            {ownerSearch ? "Sin resultados" : "Sin documentos complementarios"}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {ownerSearch
              ? "No se encontraron integrantes para la búsqueda."
              : "Aún no hay documentos adjuntos cargados."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRows.map((row) => (
            <div
              key={row.id}
              className="bg-white rounded-2xl ring-1 ring-slate-200 shadow-sm overflow-hidden"
            >
              {/* User header */}
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-sm font-semibold text-slate-900">{row.ownerLabel}</span>
                  {row.owner?.email && (
                    <span className="ml-2 text-xs text-slate-500">{row.owner.email}</span>
                  )}
                </div>
                <OtherDocsBadge count={row.documents.length} />
              </div>

              {/* Document list */}
              <div className="divide-y divide-slate-100">
                {row.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between px-4 py-3 gap-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <svg
                        className="w-4 h-4 text-slate-400 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                        />
                      </svg>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <DocumentStateBadge status={doc.status} />
                          <span className="text-xs text-slate-400">{formatDate(doc.createdAt)}</span>
                        </div>
                        {doc.notes && (
                          <p className="text-xs text-slate-600 truncate mt-0.5">{doc.notes}</p>
                        )}
                      </div>
                    </div>
                    <Link
                      to={`/documents/${doc.id}`}
                      className="flex-shrink-0 inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap"
                    >
                      Ver documento
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MyDocumentsView ──────────────────────────────────────────────────────────

function MyDocumentsView() {
  const [filters, setFilters] = useState({});
  const [pagination, setPagination] = useState({ limit: 20, skip: 0 });

  const { data, loading, error, fetchMore } = useQuery(MY_DOCUMENTS, {
    variables: {
      filters: Object.keys(filters).length > 0 ? filters : undefined,
      pagination,
    },
    fetchPolicy: "cache-and-network",
  });

  const documents = data?.myDocuments?.documents || [];
  const paginationInfo = data?.myDocuments?.pagination;
  const hasMore = paginationInfo?.hasMore || false;

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
    setPagination({ limit: 20, skip: 0 });
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!hasMore) return;
    fetchMore({
      variables: {
        filters: Object.keys(filters).length > 0 ? filters : undefined,
        pagination: { limit: 20, skip: documents.length },
      },
      updateQuery: (previousResult, { fetchMoreResult }) =>
        mergeDocumentsResult(previousResult, fetchMoreResult, "myDocuments"),
    });
  }, [hasMore, documents.length, fetchMore, filters]);

  return (
    <div className="space-y-4">
      <DocumentFilters filters={filters} onFilterChange={handleFilterChange} />
      <DocumentList
        documents={documents}
        loading={loading}
        error={error}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        loadingMore={loading && documents.length > 0}
        emptyMessage="Aún no tienes documentos"
      />
    </div>
  );
}

// ─── AdminDocumentsView: master-detail layout for admins ──────────────────────

function AdminDocumentsView() {
  const [pagination] = useState({ limit: 100, skip: 0 });
  const [rowStatusFilter, setRowStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("");
  const [ownerSearch, setOwnerSearch] = useState("");
  const [expandedRowId, setExpandedRowId] = useState(null); // mobile expand
  const [selectedRow, setSelectedRow] = useState(null); // desktop panel
  const [sortBy, setSortBy] = useState("name"); // "name" | "recent"

  const tableTopRef = useRef(null);

  // Scroll to the table top whenever a new row is selected so the panel is always visible
  useEffect(() => {
    if (!selectedRow || !tableTopRef.current) return;
    const rect = tableTopRef.current.getBoundingClientRect();
    if (rect.top < 20) {
      tableTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedRow?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data, loading, error, fetchMore } = useQuery(ALL_DOCUMENTS, {
    variables: { pagination },
    fetchPolicy: "cache-and-network",
  });

  const documents = data?.allDocuments?.documents || [];
  const paginationInfo = data?.allDocuments?.pagination;
  const hasMore = paginationInfo?.hasMore || false;
  const total = paginationInfo?.total ?? documents.length;

  const groupedRows = useMemo(() => {
    const ownersMap = new Map();

    documents.forEach((document) => {
      const owner = document.owner || {};
      const ownerId = owner.id || owner.email || document.id;
      const current = ownersMap.get(ownerId) || {
        id: ownerId,
        owner,
        documents: [],
      };

      current.documents.push(document);
      ownersMap.set(ownerId, current);
    });

    return Array.from(ownersMap.values())
      .map((entry) => {
        const passportDocs = sortDocumentsByFreshness(
          entry.documents.filter((document) => document.type === "PASSPORT")
        );
        const visaDocs = sortDocumentsByFreshness(
          entry.documents.filter((document) => document.type === "VISA")
        );
        const permitDocs = sortDocumentsByFreshness(
          entry.documents.filter((document) => document.type === "PERMISO_SALIDA")
        );
        const otherDocs = sortDocumentsByFreshness(
          entry.documents.filter((document) => document.type === "OTHER")
        );

        const row = {
          id: entry.id,
          owner: entry.owner,
          ownerLabel: getOwnerLabel(entry.owner),
          documents: sortDocumentsByFreshness(entry.documents),
          passport: passportDocs[0] || null,
          visa: visaDocs[0] || null,
          exitPermit: permitDocs[0] || null,
          otherDocument: otherDocs[0] || null,
          counts: {
            total: entry.documents.length,
            passport: passportDocs.length,
            visa: visaDocs.length,
            exitPermit: permitDocs.length,
            other: otherDocs.length,
          },
        };

        const lastUploadDate = Math.max(
          ...entry.documents.map(
            (d) => getDateValue(d.updatedAt || d.createdAt)?.getTime() || 0
          )
        );

        return { ...row, aggregateStatus: computeRowStatus(row), lastUploadDate };
      })
      .sort((a, b) => {
        if (sortBy === "recent") return b.lastUploadDate - a.lastUploadDate;
        return a.ownerLabel.localeCompare(b.ownerLabel, "es");
      });
  }, [documents, sortBy]);

  const filteredRows = useMemo(() => {
    return groupedRows.filter((row) => {
      const search = ownerSearch.trim().toLowerCase();

      if (search) {
        const haystack = [row.ownerLabel, row.owner?.email]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(search)) return false;
      }

      if (rowStatusFilter !== "ALL" && row.aggregateStatus !== rowStatusFilter) return false;

      if (typeFilter === "PASSPORT" && !row.passport) return false;
      if (typeFilter === "VISA" && !row.visa) return false;
      if (typeFilter === "PERMISO_SALIDA" && !row.exitPermit) return false;
      if (typeFilter === "OTHER") {
        const hasOtherDocs = row.documents.some((document) => document.type === "OTHER");
        if (!hasOtherDocs) return false;
      }

      return true;
    });
  }, [groupedRows, ownerSearch, rowStatusFilter, typeFilter]);

  const tableStats = useMemo(
    () =>
      filteredRows.reduce(
        (acc, row) => {
          if (row.passport) acc.passport += 1;
          if (row.visa) acc.visa += 1;
          if (row.exitPermit) acc.exitPermit += 1;
          if (row.otherDocument) acc.other += 1;
          acc[row.aggregateStatus] = (acc[row.aggregateStatus] || 0) + 1;
          return acc;
        },
        {
          passport: 0,
          visa: 0,
          exitPermit: 0,
          other: 0,
          COMPLETE: 0,
          INCOMPLETE: 0,
          EXPIRED: 0,
          EXPIRING: 0,
          REJECTED: 0,
        }
      ),
    [filteredRows]
  );

  const handleLoadMore = useCallback(() => {
    if (!hasMore) return;
    fetchMore({
      variables: {
        pagination: { ...pagination, skip: documents.length },
      },
      updateQuery: (previousResult, { fetchMoreResult }) =>
        mergeDocumentsResult(previousResult, fetchMoreResult, "allDocuments"),
    });
  }, [documents.length, fetchMore, hasMore, pagination]);

  const clearFilters = () => {
    setRowStatusFilter("ALL");
    setTypeFilter("");
    setOwnerSearch("");
    setSortBy("name");
    setSelectedRow(null);
    setExpandedRowId(null);
  };

  const hasActiveFilters = rowStatusFilter !== "ALL" || typeFilter || ownerSearch || sortBy !== "name";

  const handleSelectRow = (row) => {
    setSelectedRow((current) => (current?.id === row.id ? null : row));
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-2xl ring-1 ring-slate-200 shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">Vista por integrante</span>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          <div>
            <label
              htmlFor="documents-admin-status-filter"
              className="block text-xs text-slate-500 mb-1 font-medium"
            >
              Estado general
            </label>
            <select
              id="documents-admin-status-filter"
              value={rowStatusFilter}
              onChange={(e) => setRowStatusFilter(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400 text-slate-700"
            >
              {TABLE_STATUS_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                  {option.value !== "ALL" && tableStats[option.value] != null
                    ? ` (${tableStats[option.value]})`
                    : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="documents-admin-type-filter"
              className="block text-xs text-slate-500 mb-1 font-medium"
            >
              Tipo de documento
            </label>
            <select
              id="documents-admin-type-filter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400 text-slate-700"
            >
              {TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="documents-admin-owner-filter"
              className="block text-xs text-slate-500 mb-1 font-medium"
            >
              Buscar integrante
            </label>
            <input
              id="documents-admin-owner-filter"
              type="text"
              value={ownerSearch}
              onChange={(e) => setOwnerSearch(e.target.value)}
              placeholder="Nombre, apellido o correo"
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400 text-slate-700"
            />
          </div>

          <div>
            <label
              htmlFor="documents-admin-sort"
              className="block text-xs text-slate-500 mb-1 font-medium"
            >
              Ordenar por
            </label>
            <select
              id="documents-admin-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400 text-slate-700"
            >
              <option value="name">Nombre (A–Z)</option>
              <option value="recent">Más reciente primero</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      {!loading && !error && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-white rounded-2xl ring-1 ring-slate-200 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
                Integrantes
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{filteredRows.length}</p>
              <p className="text-xs text-slate-500">con documentos</p>
            </div>
            <div className="bg-white rounded-2xl ring-1 ring-slate-200 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
                Pasaportes
              </p>
              <p className="mt-1 text-2xl font-bold text-emerald-700">{tableStats.passport}</p>
              <p className="text-xs text-slate-500">cargados</p>
            </div>
            <div className="bg-white rounded-2xl ring-1 ring-slate-200 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Visas</p>
              <p className="mt-1 text-2xl font-bold text-sky-700">{tableStats.visa}</p>
              <p className="text-xs text-slate-500">cargadas</p>
            </div>
            <div className="bg-white rounded-2xl ring-1 ring-slate-200 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
                Permisos
              </p>
              <p className="mt-1 text-2xl font-bold text-violet-700">{tableStats.exitPermit}</p>
              <p className="text-xs text-slate-500">cargados</p>
            </div>
            <div className="bg-white rounded-2xl ring-1 ring-slate-200 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
                Vencidos / Urgentes
              </p>
              <p className="mt-1 text-2xl font-bold text-red-600">
                {(tableStats.EXPIRED || 0) + (tableStats.EXPIRING || 0)}
              </p>
              <p className="text-xs text-slate-500">requieren atención</p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-1">
            <span className="text-sm text-slate-500">
              {documents.length} de {total} documento{total !== 1 ? "s" : ""} en memoria
            </span>
            {hasActiveFilters && (
              <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full ring-1 ring-amber-200 font-medium">
                Filtros activos
              </span>
            )}
          </div>
        </>
      )}

      {/* Content */}
      {loading && documents.length === 0 ? (
        <DocumentList
          documents={[]}
          loading
          error={null}
          hasMore={false}
          onLoadMore={() => {}}
          loadingMore={false}
          emptyMessage="Cargando documentos"
        />
      ) : error ? (
        <DocumentList
          documents={[]}
          loading={false}
          error={error}
          hasMore={false}
          onLoadMore={() => {}}
          loadingMore={false}
          emptyMessage="No se encontraron documentos"
        />
      ) : filteredRows.length === 0 ? (
        <div className="bg-white rounded-2xl ring-1 ring-slate-200 shadow-sm p-10 text-center">
          <h3 className="text-lg font-semibold text-slate-900">No se encontraron integrantes</h3>
          <p className="mt-2 text-sm text-slate-500">
            Ajusta los filtros o carga más documentos para ampliar la tabla.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Mobile: stack cards */}
          <div className="space-y-4 lg:hidden">
            {filteredRows.map((row) => (
              <MobileRowCard
                key={row.id}
                row={row}
                expanded={expandedRowId === row.id}
                onToggle={() =>
                  setExpandedRowId((current) => (current === row.id ? null : row.id))
                }
              />
            ))}
          </div>

          {/* Desktop: master-detail layout */}
          <div ref={tableTopRef} className="hidden lg:flex gap-4 items-start scroll-mt-4">
            {/* Table */}
            <div className="flex-1 min-w-0 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      {[
                        { label: "Integrante", align: "left" },
                        { label: "Estado", align: "center" },
                        { label: "Pasaporte", align: "center" },
                        { label: "Visa", align: "center" },
                        { label: "Permiso de salida", align: "center" },
                        { label: "Adjuntos", align: "center" },
                        { label: "", align: "right" },
                      ].map((col) => (
                        <th
                          key={col.label}
                          className={`px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400 text-${col.align}`}
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row, index) => {
                      const isSelected = selectedRow?.id === row.id;
                      const borderColor =
                        ROW_STATUS_BORDER_COLOR[row.aggregateStatus] || "#CBD5E1";

                      return (
                        <tr
                          key={row.id}
                          style={{ borderLeft: `4px solid ${borderColor}` }}
                          className={`
                            ${index < filteredRows.length - 1 ? "border-b border-slate-100" : ""}
                            ${isSelected ? "bg-blue-50/50" : "hover:bg-slate-50"}
                            cursor-pointer transition-colors
                          `}
                          onClick={() => handleSelectRow(row)}
                        >
                          {/* Integrante */}
                          <td className="px-4 py-4 align-middle">
                            <p className="text-sm font-semibold text-slate-900 leading-tight">
                              {row.ownerLabel}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {row.owner?.email || "Sin correo"}
                            </p>
                            {sortBy === "recent" && row.lastUploadDate > 0 && (
                              <p className="mt-0.5 text-[10px] text-slate-400">
                                Último: {formatDate(new Date(row.lastUploadDate).toISOString())}
                              </p>
                            )}
                          </td>

                          {/* Estado */}
                          <td className="px-4 py-4 text-center align-middle">
                            <AggregateStatusBadge status={row.aggregateStatus} />
                          </td>

                          {/* Pasaporte */}
                          <td className="px-4 py-4 text-center align-middle">
                            <DocumentSlot
                              doc={row.passport}
                              extraCount={Math.max(0, row.counts.passport - 1)}
                              showExpiry
                            />
                          </td>

                          {/* Visa */}
                          <td className="px-4 py-4 text-center align-middle">
                            <DocumentSlot
                              doc={row.visa}
                              extraCount={Math.max(0, row.counts.visa - 1)}
                              showExpiry
                            />
                          </td>

                          {/* Permiso de salida */}
                          <td className="px-4 py-4 text-center align-middle">
                            <DocumentSlot
                              doc={row.exitPermit}
                              extraCount={Math.max(0, row.counts.exitPermit - 1)}
                              showExpiry={false}
                            />
                          </td>

                          {/* Adjuntos (Other) — neutral badge, never competes */}
                          <td className="px-4 py-4 text-center align-middle">
                            <OtherDocsBadge count={row.counts.other} />
                          </td>

                          {/* Chevron / select indicator */}
                          <td className="px-4 py-4 text-right align-middle">
                            <div
                              className={`inline-flex items-center justify-center w-7 h-7 rounded-full transition-all ${
                                isSelected
                                  ? "bg-blue-600 text-white"
                                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                              }`}
                            >
                              <svg
                                className={`w-4 h-4 transition-transform ${
                                  isSelected ? "rotate-90" : ""
                                }`}
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
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between gap-4 px-4 py-3 bg-slate-50 border-t border-slate-200">
                <span className="text-xs text-slate-500">
                  {filteredRows.length} integrante{filteredRows.length !== 1 ? "s" : ""}
                  {selectedRow ? " · Haz clic en otra fila para cambiar el detalle" : " · Haz clic en una fila para ver el detalle"}
                </span>
                {hasMore && (
                  <button
                    onClick={handleLoadMore}
                    className="px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition-colors"
                  >
                    Cargar más
                  </button>
                )}
              </div>
            </div>

            {/* Detail panel */}
            {selectedRow && (
              <div
                className="w-96 flex-shrink-0 sticky top-4"
                style={{ maxHeight: "calc(100vh - 140px)" }}
              >
                <UserDetailPanel
                  key={selectedRow.id}
                  row={selectedRow}
                  onClose={() => setSelectedRow(null)}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── DocumentsPage: root component ───────────────────────────────────────────

function DocumentsPage() {
  const { data: userData } = useQuery(GET_USERS_BY_ID);

  const currentUser = userData?.getUser;
  const userRole = currentUser?.role;

  const userIsAdmin = isDocumentAdmin(currentUser);
  const isFinanciero = userRole === "CEDES Financiero";
  const canUploadDocuments = !isFinanciero;
  const [activeTab, setActiveTab] = useState("mine");

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <Card>
        <SoftBox p={2}>
          <div className="min-h-screen bg-slate-50">
            <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-slate-200">
              <div className="max-w-[1400px] mx-auto px-4 py-4">
                <div className="flex items-center justify-between mb-1">
                  <h1 className="text-xl font-semibold text-slate-900">
                    {isFinanciero ? "Documentos complementarios" : "Documentos"}
                  </h1>
                  <div className="flex items-center gap-2">
                    {isFinanciero && (
                      <span className="text-xs px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full ring-1 ring-amber-200 font-semibold">
                        CEDES Financiero
                      </span>
                    )}
                    {userIsAdmin && !isFinanciero && (
                      <span className="text-xs px-2.5 py-1 bg-violet-100 text-violet-700 rounded-full ring-1 ring-violet-200 font-semibold">
                        Admin
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-sm text-slate-500 mb-4">
                  {isFinanciero
                    ? "Documentos adjuntos y comprobantes cargados por los integrantes"
                    : "Filtra, revisa y escanea documentos de los integrantes"}
                </p>

                {userIsAdmin && !isFinanciero && (
                  <div className="flex gap-2 p-1 bg-slate-100 rounded-full w-fit">
                    <TabButton
                      active={activeTab === "mine"}
                      onClick={() => setActiveTab("mine")}
                    >
                      Mis documentos
                    </TabButton>
                    <TabButton
                      active={activeTab === "all"}
                      onClick={() => setActiveTab("all")}
                    >
                      Vista admin
                    </TabButton>
                  </div>
                )}
              </div>
            </header>

            <main className="mx-auto max-w-[1400px] px-4 py-6">
              {isFinanciero && <FinancieroView />}
              {!isFinanciero && (!userIsAdmin || activeTab === "mine") && <MyDocumentsView />}
              {!isFinanciero && userIsAdmin && activeTab === "all" && <AdminDocumentsView />}
            </main>

            {canUploadDocuments && (
              <Link
                to="/new-document"
                className="
                  fixed bottom-6 right-6 z-[1200]
                  w-14 h-14 rounded-full
                  bg-primary-600 hover:bg-primary-500
                  text-white
                  shadow-xl shadow-primary-200/60
                  flex items-center justify-center
                  transition-all duration-200 hover:scale-105
                  focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-2
                "
                aria-label="Escanear documento"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </Link>
            )}
          </div>
        </SoftBox>
      </Card>
    </DashboardLayout>
  );
}

export default DocumentsPage;
