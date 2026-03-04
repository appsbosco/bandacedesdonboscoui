/**
 * PresentationCard.jsx
 * Card compacta para el grid de presentaciones secundarias.
 *
 * Problemas del original:
 * - Imagen h-36 sin restricción → se expandía sola
 * - Faltaba información clave (hora, salida/llegada, urgencia visible)
 * - Acciones admin solo en hover (mal en mobile)
 * - Sin separación visual clara entre imagen y contenido
 *
 * Rediseño:
 * - Imagen fija h-32, nunca más
 * - Toda la info relevante visible: fecha, hora, lugar
 * - Urgency badge integrado sobre la imagen
 * - Acciones admin siempre visibles (no solo hover)
 * - Contenido denso pero bien jerarquizado
 */

import PropTypes from "prop-types";
import { formatDateEs, normalizeTimeTo12h } from "utils/dateHelpers";
import { getEventImage } from "utils/eventHelpers";

export default function PresentationCard({
  event,
  isAdmin,
  bandColors,
  getDaysUntil,
  getUrgencyLabel,
  onViewDetails,
  onEdit,
  onDelete,
}) {
  const days = getDaysUntil(event.date);
  const urgency = getUrgencyLabel(days);
  const colors = bandColors[event.type] ?? {
    text: "text-slate-600",
    light: "bg-slate-100",
  };
  const imgSrc = getEventImage(event.type);

  return (
    <div
      className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden flex flex-col"
      onClick={() => onViewDetails(event)}
    >
      {/* ── Imagen fija h-32, nunca más ──────────────────────────────────── */}
      <div className="relative h-32 flex-shrink-0 overflow-hidden">
        <img
          src={imgSrc}
          alt={event.type ?? "Presentación"}
          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />
        {/* Overlay sutil */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

        {/* Urgency badge — esquina superior derecha */}
        <div className="absolute top-2.5 right-2.5">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${urgency.color}`}>
            {urgency.label}
          </span>
        </div>

        {/* Admin buttons — esquina superior izquierda, siempre visibles en mobile, hover en desktop */}
        {isAdmin && (
          <div
            className="absolute top-2.5 left-2.5 flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => onEdit(event)}
              title="Editar"
              className="w-6 h-6 bg-white/90 backdrop-blur rounded-md flex items-center justify-center text-slate-700 hover:bg-white shadow-sm transition-colors"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"
                />
              </svg>
            </button>
            <button
              onClick={() => onDelete(event)}
              title="Eliminar"
              className="w-6 h-6 bg-white/90 backdrop-blur rounded-md flex items-center justify-center text-red-600 hover:bg-white shadow-sm transition-colors"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Band name sobre la imagen — parte inferior */}
        {event.type && (
          <div className="absolute bottom-2.5 left-3 right-3">
            <span
              className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${colors.light} ${colors.text} max-w-full truncate`}
            >
              {event.type}
            </span>
          </div>
        )}
      </div>

      {/* ── Contenido ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col gap-2.5 p-3.5">
        {/* Título */}
        <h4 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
          {event.title}
        </h4>

        {/* Meta rows */}
        <div className="flex flex-col gap-1.5">
          <MetaRow icon={<CalIcon />} value={formatDateEs(event.date)} />
          {event.time && <MetaRow icon={<ClockIcon />} value={normalizeTimeTo12h(event.time)} />}
          {event.place && <MetaRow icon={<PinIcon />} value={event.place} />}
          {event.departure && (
            <MetaRow
              icon={<BusIcon />}
              value={`Salida: ${normalizeTimeTo12h(event.departure)}`}
              muted
            />
          )}
        </div>

        {/* Ver detalles link */}
        <div className="mt-auto pt-2 border-t border-slate-50 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 group-hover:text-slate-600 transition-colors flex items-center gap-1">
            Ver detalles
            <svg
              className="w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── MetaRow ──────────────────────────────────────────────────────────────────
function MetaRow({ icon, value, muted = false }) {
  return (
    <div
      className={`flex items-center gap-1.5 text-xs ${muted ? "text-slate-400" : "text-slate-500"}`}
    >
      <span className="text-slate-300 flex-shrink-0">{icon}</span>
      <span className="truncate leading-tight">{value}</span>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const CalIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25"
    />
  </svg>
);
const ClockIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
    />
  </svg>
);
const PinIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
    />
  </svg>
);
const BusIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
    />
  </svg>
);

// ─── PropTypes ────────────────────────────────────────────────────────────────
PresentationCard.propTypes = {
  event: PropTypes.shape({
    date: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    type: PropTypes.string,
    title: PropTypes.string.isRequired,
    time: PropTypes.string,
    place: PropTypes.string,
    departure: PropTypes.string,
  }).isRequired,
  isAdmin: PropTypes.bool,
  bandColors: PropTypes.object.isRequired,
  getDaysUntil: PropTypes.func.isRequired,
  getUrgencyLabel: PropTypes.func.isRequired,
  onViewDetails: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

MetaRow.propTypes = {
  icon: PropTypes.node.isRequired,
  value: PropTypes.string.isRequired,
  muted: PropTypes.bool,
};
