/* eslint-disable react/prop-types */
/**
 * TourSelfServiceDocuments
 * Vista de solo lectura para que el usuario vea sus propios documentos de viaje.
 */
import { getExpiryStatus } from "../utils/tourAgeRules";

const STATUS_COLORS = {
  ok: "text-emerald-700 bg-emerald-50 border-emerald-200",
  warning: "text-amber-700 bg-amber-50 border-amber-200",
  expired: "text-red-700 bg-red-50 border-red-200",
  missing: "text-gray-500 bg-gray-50 border-gray-200",
};

const STATUS_LABELS = {
  ok: "Vigente",
  warning: "Por vencer",
  expired: "Vencido",
  missing: "Sin fecha",
};

function DocField({ label, value, status }) {
  const colorClass = STATUS_COLORS[status] || STATUS_COLORS.missing;
  const statusLabel = STATUS_LABELS[status] || "";
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-semibold text-gray-900">{value || "—"}</span>
        {status && value && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${colorClass}`}>
            {statusLabel}
          </span>
        )}
      </div>
    </div>
  );
}

function BooleanField({ label, value, trueLabel = "Sí", falseLabel = "No" }) {
  const isTrue = value === true;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
      <span
        className={`inline-flex self-start text-xs font-bold px-2 py-0.5 rounded-full border ${
          isTrue
            ? "text-emerald-700 bg-emerald-50 border-emerald-200"
            : "text-red-700 bg-red-50 border-red-200"
        }`}
      >
        {isTrue ? trueLabel : falseLabel}
      </span>
    </div>
  );
}

export default function TourSelfServiceDocuments({ participant }) {
  if (!participant) return null;

  const passportStatus = getExpiryStatus(participant.passportExpiry);
  const visaStatus = participant.hasVisa ? getExpiryStatus(participant.visaExpiry) : "missing";

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-sm font-bold text-gray-700 mb-4">Pasaporte</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DocField label="Número de pasaporte" value={participant.passportNumber} />
          <DocField
            label="Vencimiento"
            value={participant.passportExpiry ? new Date(participant.passportExpiry).toLocaleDateString("es-CR") : null}
            status={participant.passportNumber ? passportStatus : null}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-sm font-bold text-gray-700 mb-4">Visa</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <BooleanField
            label="¿Tiene visa?"
            value={participant.hasVisa}
            trueLabel="Sí"
            falseLabel="No — pendiente"
          />
          {participant.hasVisa && (
            <DocField
              label="Vencimiento de visa"
              value={participant.visaExpiry ? new Date(participant.visaExpiry).toLocaleDateString("es-CR") : null}
              status={visaStatus}
            />
          )}
        </div>
        {!participant.hasVisa && (
          <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            La visa está pendiente. Tu documentación no está completa hasta que se registre una visa vigente.
          </p>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-sm font-bold text-gray-700 mb-4">Permiso de salida</h3>
        <BooleanField
          label="¿Tiene permiso de salida?"
          value={participant.hasExitPermit}
          trueLabel="Sí"
          falseLabel="No"
        />
      </div>
    </div>
  );
}
