/* eslint-disable react/prop-types */
/**
 * TourDocumentsPage — estado documental completo con edición.
 *
 * SCHEMA NOTE: No existe getTourDocumentStatus/getTourDocumentAlerts en el backend.
 * Este módulo usa getTourParticipants con campos de documento + updateTourParticipant.
 * El estado se computa en cliente a partir de passportExpiry, visaExpiry, hasExitPermit.
 * La regla adulto/menor se aplica con la fecha de inicio de la gira (tour.startDate).
 */
import { useState, useMemo } from "react";
import { useTourDocuments } from "./useTourDocuments";
import DocumentEditModal from "./DocumentEditModal";
import DocumentDetailDrawer from "./DocumentDetailDrawer";
import { Toast } from "../TourHelpers";
import {
  getExpiryStatus,
  getDaysUntilExpiry,
  EXPIRY_WARNING_DAYS,
} from "../utils/tourAgeRules";

// ── Constants ─────────────────────────────────────────────────────────────────

const OVERALL_STATUS_CONFIG = {
  COMPLETE: {
    label: "Completo",
    className: "bg-emerald-50 text-emerald-700 border-emerald-100",
    dot: "bg-emerald-500",
  },
  INCOMPLETE: {
    label: "Incompleto",
    className: "bg-amber-50 text-amber-700 border-amber-100",
    dot: "bg-amber-400",
  },
  EXPIRED: {
    label: "Vencido",
    className: "bg-red-50 text-red-700 border-red-100",
    dot: "bg-red-500",
  },
  EXPIRING: {
    label: "Por vencer",
    className: "bg-orange-50 text-orange-700 border-orange-100",
    dot: "bg-orange-400",
  },
};

const EXPIRY_STATUS_STYLES = {
  ok: "text-emerald-600",
  warning: "text-amber-600",
  expired: "text-red-600 font-bold",
  missing: "text-gray-400",
};

const STATUS_FILTERS = [
  { value: "ALL", label: "Todos" },
  { value: "COMPLETE", label: "Completos" },
  { value: "INCOMPLETE", label: "Incompletos" },
  { value: "EXPIRED", label: "Vencidos" },
  { value: "EXPIRING", label: "Por vencer" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function participantName(p) {
  return [p.firstName, p.firstSurname, p.secondSurname].filter(Boolean).join(" ");
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatRefDate(date) {
  if (!date) return null;
  return new Date(date).toLocaleDateString("es-CR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ExpiryCell({ date }) {
  const status = getExpiryStatus(date);
  const days = getDaysUntilExpiry(date);
  const styleClass = EXPIRY_STATUS_STYLES[status];

  if (status === "missing") {
    return <span className="text-[10px] text-gray-400">Sin fecha</span>;
  }

  return (
    <div className="flex flex-col items-center">
      <span className="text-[10px] text-gray-600">{formatDate(date)}</span>
      <span className={`text-[10px] ${styleClass}`}>
        {days >= 0 ? `${days}d` : `Vencido ${Math.abs(days)}d`}
      </span>
    </div>
  );
}

function PermitCell({ participant, refDate }) {
  const { _exitRequired, hasExitPermit } = participant;

  // isAdult determined from _exitRequired: if not required but birthDate exists → adult
  const isAdult = participant.birthDate && refDate && !_exitRequired;

  if (isAdult) {
    return (
      <div className="flex flex-col items-center">
        <span className="text-gray-400 text-xs">N/A</span>
        <span className="text-[10px] text-emerald-600">Adulto</span>
      </div>
    );
  }

  if (!_exitRequired) {
    return <span className="text-xs text-gray-400">N/A</span>;
  }

  return (
    <div className="flex flex-col items-center">
      {hasExitPermit ? (
        <>
          <span className="text-emerald-500 font-bold text-sm">✓</span>
          <span className="text-[10px] text-emerald-600">Tiene</span>
        </>
      ) : (
        <>
          <span className="text-red-400 font-bold text-sm">✗</span>
          <span className="text-[10px] text-red-500">Falta</span>
        </>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = OVERALL_STATUS_CONFIG[status] || OVERALL_STATUS_CONFIG.INCOMPLETE;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap ${cfg.className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TourDocumentsPage({ tourId, tourName, tour }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showExpiringSoon, setShowExpiringSoon] = useState(false);
  const [showRequiredOnly, setShowRequiredOnly] = useState(false);

  const {
    participants,
    loading,
    error,
    refDate,
    hasRefDate,
    docCounts,
    detailParticipant,
    openDetail,
    closeDetail,
    editParticipant,
    openEdit,
    closeEdit,
    handleSave,
    saving,
    toast,
    setToast,
  } = useTourDocuments(tourId, tour);

  const filtered = useMemo(() => {
    return participants.filter((p) => {
      if (statusFilter !== "ALL" && p._docStatus !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const name = participantName(p).toLowerCase();
        if (!name.includes(q) && !p.identification.toLowerCase().includes(q)) return false;
      }
      if (showExpiringSoon) {
        const pStatus = p._passportExpiry;
        const vStatus = p._visaExpiry;
        const hasWarning = pStatus === "warning" || pStatus === "expired" || vStatus === "warning" || vStatus === "expired";
        if (!hasWarning) return false;
      }
      if (showRequiredOnly) {
        if (!p._exitRequired && p.passportNumber && !p._passportExpiry === "expired") {
          // Only keep those who have at least one required missing item
        }
      }
      return true;
    });
  }, [participants, statusFilter, search, showExpiringSoon, showRequiredOnly]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-base font-bold text-gray-900">Documentos de la gira</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Pasaportes, visas y permisos de salida de{" "}
            <span className="font-semibold">{tourName}</span>
          </p>
          {hasRefDate ? (
            <p className="text-xs text-emerald-600 mt-0.5">
              ✓ Fecha referencia (inicio de gira): {formatRefDate(refDate)} — regla adulto/menor aplicada
            </p>
          ) : (
            <p className="text-xs text-orange-500 mt-0.5">
              ⚠️ Sin fecha de inicio de gira — no se puede determinar mayoría de edad. Se asume que todos requieren permiso de salida.
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard value={docCounts.COMPLETE} label="Completos" color="text-emerald-600" />
        <StatCard value={docCounts.INCOMPLETE} label="Incompletos" color="text-amber-600" />
        <StatCard value={docCounts.EXPIRED} label="Vencidos" color="text-red-600" />
        <StatCard value={docCounts.EXPIRING} label={`Por vencer (≤${EXPIRY_WARNING_DAYS}d)`} color="text-orange-600" />
      </div>

      {/* Filters */}
      {participants.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o cédula…"
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl overflow-x-auto flex-shrink-0">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    statusFilter === f.value
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          {/* Quick filter chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <QuickFilter
              label={`⚠️ Expiran pronto (≤${EXPIRY_WARNING_DAYS}d)`}
              active={showExpiringSoon}
              onClick={() => setShowExpiringSoon((v) => !v)}
            />
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState message={error.message} />
      ) : participants.length === 0 ? (
        <EmptyState />
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-sm text-gray-400">
          Sin participantes que coincidan con los filtros.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">
                    Participante
                  </th>
                  <th className="text-center px-3 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">
                    Pasaporte
                  </th>
                  <th className="text-center px-3 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">
                    Vence pasaporte
                  </th>
                  <th className="text-center px-3 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">
                    Visa
                  </th>
                  <th className="text-center px-3 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">
                    Vence visa
                  </th>
                  <th className="text-center px-3 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">
                    Permiso salida
                  </th>
                  <th className="text-center px-3 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">
                    Estado
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    {/* Participant */}
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900 text-sm">{participantName(p)}</p>
                      <p className="text-xs text-gray-400">{p.identification}</p>
                      {p.instrument && <p className="text-xs text-gray-400">{p.instrument}</p>}
                    </td>

                    {/* Passport number */}
                    <td className="px-3 py-3 text-center">
                      {p.passportNumber ? (
                        <div>
                          <span className="text-emerald-500 font-bold text-sm">✓</span>
                          <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                            {p.passportNumber}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <span className="text-red-400 font-bold text-sm">✗</span>
                          <p className="text-[10px] text-red-400">Falta</p>
                        </div>
                      )}
                    </td>

                    {/* Passport expiry */}
                    <td className="px-3 py-3 text-center">
                      {p.passportNumber ? <ExpiryCell date={p.passportExpiry} /> : <span className="text-gray-300 text-xs">—</span>}
                    </td>

                    {/* Visa */}
                    <td className="px-3 py-3 text-center">
                      {p.hasVisa ? (
                        <span className="text-emerald-500 font-bold text-sm">✓</span>
                      ) : (
                        <span className="text-gray-300 text-sm">—</span>
                      )}
                    </td>

                    {/* Visa expiry */}
                    <td className="px-3 py-3 text-center">
                      {p.hasVisa ? <ExpiryCell date={p.visaExpiry} /> : <span className="text-gray-300 text-xs">—</span>}
                    </td>

                    {/* Exit permit */}
                    <td className="px-3 py-3 text-center">
                      <PermitCell participant={p} refDate={refDate} />
                    </td>

                    {/* Overall status */}
                    <td className="px-3 py-3 text-center">
                      <StatusBadge status={p._docStatus} />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openDetail(p)}
                          className="px-2.5 py-1 text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
                          title="Ver detalle completo"
                        >
                          Ver
                        </button>
                        <button
                          onClick={() => openEdit(p)}
                          className="px-2.5 py-1 text-xs font-bold text-white bg-gray-900 hover:bg-gray-700 rounded-lg transition-all"
                          title="Editar documentos"
                        >
                          Editar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {filtered.length} de {participants.length} participante{participants.length !== 1 ? "s" : ""}
            </span>
            <span className="text-xs text-gray-400">
              Vencimiento: alerta si ≤{EXPIRY_WARNING_DAYS} días
            </span>
          </div>
        </div>
      )}

      {/* Modals */}
      {detailParticipant && (
        <DocumentDetailDrawer
          participant={detailParticipant}
          refDate={refDate}
          onClose={closeDetail}
          onEdit={openEdit}
        />
      )}

      {editParticipant && (
        <DocumentEditModal
          participant={editParticipant}
          refDate={refDate}
          onSave={handleSave}
          onClose={closeEdit}
          saving={saving}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// ── Shared sub-components ──────────────────────────────────────────────────────

function StatCard({ value, label, color = "text-gray-900" }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function QuickFilter({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
        active
          ? "bg-amber-50 text-amber-700 border-amber-200"
          : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
      }`}
    >
      {label}
    </button>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      <div className="h-10 bg-gray-100 rounded-xl" />
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-14 bg-gray-100 rounded-xl" />
      ))}
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
      <p className="text-2xl mb-2">⚠️</p>
      <p className="text-sm font-bold text-red-700">Error al cargar documentos</p>
      <p className="text-xs text-red-500 mt-1">{message}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-gray-50 border border-gray-200 border-dashed rounded-2xl p-12 text-center">
      <p className="text-4xl mb-3">📄</p>
      <h3 className="text-sm font-bold text-gray-900 mb-1">Sin participantes</h3>
      <p className="text-xs text-gray-500">
        Importá participantes desde la pestaña Importación para ver su estado documental.
      </p>
    </div>
  );
}
