/* eslint-disable react/prop-types */
/**
 * DocumentDetailDrawer — vista completa de documentos de un participante.
 * Muestra todos los campos de documento + estado de vencimiento + raw JSON.
 */
import { useState } from "react";
import { getAgeAtDate, getDaysUntilExpiry, getExpiryStatus, isExitPermitRequired } from "../utils/tourAgeRules";

function participantFullName(p) {
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

function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-CR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const EXPIRY_STATUS_CONFIG = {
  ok: { label: "Vigente", className: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  warning: { label: "Por vencer", className: "bg-amber-50 text-amber-700 border-amber-100" },
  expired: { label: "Vencido", className: "bg-red-50 text-red-700 border-red-100" },
  missing: { label: "Sin fecha", className: "bg-gray-100 text-gray-500 border-gray-200" },
};

function ExpiryBadge({ date }) {
  const status = getExpiryStatus(date);
  const cfg = EXPIRY_STATUS_CONFIG[status];
  const days = getDaysUntilExpiry(date);
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.className}`}>
      {cfg.label}
      {days !== null && status !== "missing" && (
        <span className="opacity-70">
          ({days >= 0 ? `${days}d` : `hace ${Math.abs(days)}d`})
        </span>
      )}
    </span>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 font-medium flex-shrink-0 w-36">{label}</span>
      <span className="text-xs text-gray-800 font-medium text-right">{value ?? "—"}</span>
    </div>
  );
}

export default function DocumentDetailDrawer({ participant, refDate, onClose, onEdit }) {
  const [showJson, setShowJson] = useState(false);

  if (!participant) return null;

  const ageAtTour = refDate && participant.birthDate
    ? getAgeAtDate(participant.birthDate, refDate)
    : null;
  const isAdult = ageAtTour !== null ? ageAtTour >= 18 : null;
  const exitRequired = isExitPermitRequired(participant.birthDate, refDate);

  const passportExpiry = getExpiryStatus(participant.passportExpiry);
  const visaExpiry = participant.hasVisa ? getExpiryStatus(participant.visaExpiry) : null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                {participantFullName(participant)}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">{participant.identification}</p>
              {ageAtTour !== null && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">{ageAtTour} años al inicio de la gira</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                      isAdult
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                        : "bg-amber-50 text-amber-700 border-amber-100"
                    }`}
                  >
                    {isAdult ? "Adulto" : "Menor"}
                  </span>
                </div>
              )}
              {!refDate && (
                <p className="text-xs text-orange-500 mt-1">
                  ⚠️ Sin fecha de inicio de gira — no se puede determinar mayoría de edad.
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all flex-shrink-0"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Passport */}
            <section>
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                Pasaporte
              </h4>
              <div className="bg-gray-50 rounded-2xl px-4 py-1">
                <DetailRow label="Número" value={participant.passportNumber || <span className="text-red-400">Sin registrar</span>} />
                <DetailRow
                  label="Vencimiento"
                  value={
                    <div className="flex items-center gap-2 justify-end">
                      <span>{formatDate(participant.passportExpiry)}</span>
                      <ExpiryBadge date={participant.passportExpiry} />
                    </div>
                  }
                />
              </div>
            </section>

            {/* Visa */}
            <section>
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                Visa
              </h4>
              <div className="bg-gray-50 rounded-2xl px-4 py-1">
                <DetailRow
                  label="Tiene visa"
                  value={
                    participant.hasVisa
                      ? <span className="text-emerald-600 font-bold">Sí</span>
                      : <span className="text-gray-400">No</span>
                  }
                />
                {participant.hasVisa && (
                  <DetailRow
                    label="Vencimiento"
                    value={
                      <div className="flex items-center gap-2 justify-end">
                        <span>{formatDate(participant.visaExpiry)}</span>
                        <ExpiryBadge date={participant.visaExpiry} />
                      </div>
                    }
                  />
                )}
              </div>
            </section>

            {/* Permiso de salida */}
            <section>
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                Permiso de salida de menores
              </h4>
              <div className="bg-gray-50 rounded-2xl px-4 py-1">
                {isAdult === true ? (
                  <div className="py-2.5">
                    <span className="text-xs text-emerald-600 font-semibold">
                      ✓ No requerido — participante es adulto al inicio de la gira
                    </span>
                  </div>
                ) : (
                  <>
                    <DetailRow label="Requerido" value={exitRequired ? "Sí" : "No"} />
                    <DetailRow
                      label="Tiene permiso"
                      value={
                        participant.hasExitPermit
                          ? <span className="text-emerald-600 font-bold">Sí</span>
                          : exitRequired
                          ? <span className="text-red-500 font-bold">No — Faltante</span>
                          : <span className="text-gray-400">No</span>
                      }
                    />
                    {isAdult === null && (
                      <div className="py-2">
                        <p className="text-xs text-orange-500">
                          Sin fecha de nacimiento — verifique si aplica permiso.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>

            {/* Datos del participante */}
            <section>
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                Datos del participante
              </h4>
              <div className="bg-gray-50 rounded-2xl px-4 py-1">
                <DetailRow label="Nombre" value={participantFullName(participant)} />
                <DetailRow label="Cédula/Pasaporte" value={participant.identification} />
                <DetailRow label="Fecha de nacimiento" value={formatDate(participant.birthDate)} />
                <DetailRow label="Instrumento" value={participant.instrument} />
                <DetailRow label="Grado" value={participant.grade} />
                <DetailRow label="Rol" value={participant.role} />
                <DetailRow label="Estado" value={participant.status} />
                <DetailRow label="Notas" value={participant.notes || <span className="text-gray-300">Sin notas</span>} />
              </div>
            </section>

            {/* Auditoría */}
            <section>
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                Auditoría
              </h4>
              <div className="bg-gray-50 rounded-2xl px-4 py-1">
                <DetailRow label="ID" value={<span className="font-mono text-[10px]">{participant.id}</span>} />
                <DetailRow label="Creado" value={formatDateTime(participant.createdAt)} />
                <DetailRow label="Actualizado" value={formatDateTime(participant.updatedAt)} />
                {participant.addedBy && (
                  <DetailRow label="Agregado por" value={`${participant.addedBy.name || ""} ${participant.addedBy.firstSurName || ""}`.trim()} />
                )}
              </div>
            </section>

            {/* Raw JSON */}
            <section>
              <button
                onClick={() => setShowJson((v) => !v)}
                className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 font-semibold transition-colors"
              >
                <span>{showJson ? "▼" : "▶"}</span>
                <span>JSON completo (debug)</span>
              </button>
              {showJson && (
                <pre className="mt-2 p-3 bg-gray-900 text-green-400 text-[10px] rounded-xl overflow-auto max-h-60 leading-relaxed">
                  {JSON.stringify(participant, null, 2)}
                </pre>
              )}
            </section>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 pt-3 border-t border-gray-100 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-2xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-all"
            >
              Cerrar
            </button>
            <button
              onClick={() => { onClose(); onEdit(participant); }}
              className="flex-1 py-2.5 rounded-2xl bg-gray-900 hover:bg-gray-700 text-white font-bold text-sm transition-all"
            >
              Editar documentos
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
