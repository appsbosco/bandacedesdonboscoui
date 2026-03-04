/**
 * PresentationHero.jsx
 * Card hero para la próxima presentación.
 * Layout: imagen izquierda (fija) | contenido derecha
 * Altura: controlada por el contenido, nunca ocupa pantalla completa
 */

import PropTypes from "prop-types";
import { formatDateEs, normalizeTimeTo12h } from "utils/dateHelpers";
import { getEventImage } from "utils/eventHelpers";

export default function PresentationHero({
  event,
  isAdmin,
  bandColors,
  getDaysUntil,
  getUrgencyLabel,
  onViewDetails,
  onEdit,
  onDelete,
}) {
  if (!event) return null;

  const days = getDaysUntil(event.date);
  const urgency = getUrgencyLabel(days);
  const colors = bandColors[event.type] ?? { text: "text-slate-600", light: "bg-slate-100" };
  const imgSrc = getEventImage(event.type);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-shadow duration-200">
      <div className="flex flex-col sm:flex-row">
        {/* ── Imagen fija ─────────────────────────────────────────────────
            Mobile:  altura 160px, ancho completo
            Desktop: ancho 220px, altura se adapta al contenido del lado derecho
        ──────────────────────────────────────────────────────────────── */}
        <div className="relative h-40 sm:h-auto sm:w-52 md:w-60 flex-shrink-0 overflow-hidden">
          <img
            src={imgSrc}
            alt={event.type ?? "Presentación"}
            className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent sm:bg-gradient-to-r sm:from-transparent sm:to-white/5" />

          {/* Badge */}
          <div className="absolute top-2.5 left-2.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Próxima
            </span>
          </div>
        </div>

        {/* ── Contenido ───────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col justify-between gap-3 p-4 sm:p-5">
          {/* Fila 1: badges + acciones admin */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              {event.type && (
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${colors.light} ${colors.text}`}
                >
                  {event.type}
                </span>
              )}
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${urgency.color}`}>
                {urgency.label}
              </span>
            </div>

            {isAdmin && (
              <div className="flex gap-1.5 flex-shrink-0">
                <AdminBtn onClick={() => onEdit(event)} title="Editar">
                  <EditIcon />
                </AdminBtn>
                <AdminBtn onClick={() => onDelete(event)} title="Eliminar" danger>
                  <TrashIcon />
                </AdminBtn>
              </div>
            )}
          </div>

          {/* Título */}
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight line-clamp-2">
              {event.title}
            </h3>
            {event.description && (
              <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {event.description}
              </p>
            )}
          </div>

          {/* Meta pills */}
          <div className="flex flex-wrap gap-1.5">
            <Pill icon={<CalIcon />} text={formatDateEs(event.date)} />
            {event.time && <Pill icon={<ClockIcon />} text={normalizeTimeTo12h(event.time)} />}
            {event.place && <Pill icon={<PinIcon />} text={event.place} />}
            {event.departure && (
              <Pill
                icon={<BusIcon />}
                text={`Salida ${normalizeTimeTo12h(event.departure)}`}
                muted
              />
            )}
            {event.arrival && (
              <Pill
                icon={<BusIcon />}
                text={`Llegada ~${normalizeTimeTo12h(event.arrival)}`}
                muted
              />
            )}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-2 pt-0.5">
            <button
              onClick={() => onViewDetails(event)}
              className="inline-flex items-center gap-1.5 bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-slate-800 active:scale-95 transition-all"
            >
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
            </button>
            {isAdmin && (
              <button
                onClick={() => onEdit(event)}
                className="text-xs font-semibold text-slate-600 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all"
              >
                Editar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Pill({ icon, text, muted = false }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border ${
        muted
          ? "bg-slate-50 text-slate-400 border-slate-100"
          : "bg-white text-slate-600 border-slate-200"
      }`}
    >
      <span className="flex-shrink-0 text-slate-400">{icon}</span>
      <span className="truncate max-w-[150px]">{text}</span>
    </span>
  );
}

function AdminBtn({ onClick, title, danger = false, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-colors active:scale-95 ${
        danger
          ? "bg-red-50 border-red-100 text-red-500 hover:bg-red-100"
          : "bg-white border-slate-200 text-slate-500 hover:bg-slate-100"
      }`}
    >
      {children}
    </button>
  );
}

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
const EditIcon = () => (
  <svg
    className="w-3.5 h-3.5"
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
);
const TrashIcon = () => (
  <svg
    className="w-3.5 h-3.5"
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
);

PresentationHero.propTypes = {
  event: PropTypes.object.isRequired,
  isAdmin: PropTypes.bool,
  bandColors: PropTypes.object.isRequired,
  getDaysUntil: PropTypes.func.isRequired,
  getUrgencyLabel: PropTypes.func.isRequired,
  onViewDetails: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

Pill.propTypes = {
  icon: PropTypes.node,
  text: PropTypes.string.isRequired,
  muted: PropTypes.bool,
};

AdminBtn.propTypes = {
  onClick: PropTypes.func.isRequired,
  title: PropTypes.string,
  danger: PropTypes.bool,
  children: PropTypes.node.isRequired,
};
