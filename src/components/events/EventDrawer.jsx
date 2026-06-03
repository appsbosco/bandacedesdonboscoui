import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { formatDateEs, normalizeTimeTo12h } from "utils/dateHelpers";
import { getEventImage } from "utils/eventHelpers";
import { getRoseParadeEventMeta } from "utils/roseParade";
import RoseParadeEventBadge from "./RoseParadeEventBadge";
import RoseParadeEventCountdown from "./RoseParadeEventCountdown";

const CATEGORY_META = {
  presentation: { label: "Presentación", icon: "🎵", accent: "#3b82f6" },
  rehearsal: { label: "Ensayo", icon: "🎼", accent: "#8b5cf6" },
  meeting: { label: "Reunión", icon: "📋", accent: "#f59e0b" },
  activity: { label: "Actividad", icon: "🎉", accent: "#10b981" },
  logistics: { label: "Logística", icon: "🚌", accent: "#f97316" },
  other: { label: "Otro", icon: "📌", accent: "#94a3b8" },
};

const NOTIF_META = {
  NONE: { label: "Sin notificación" },
  DRY_RUN: { label: "Modo prueba" },
  LIVE: { label: "Envío real" },
};

const PRIORITY_META = {
  low: { label: "Baja", tone: "text-slate-500 bg-slate-100 ring-slate-200" },
  normal: { label: "Normal", tone: "text-blue-700 bg-blue-50 ring-blue-100" },
  high: { label: "Alta", tone: "text-rose-700 bg-rose-50 ring-rose-100" },
};

export default function EventDrawer({ open, event, isAdmin, onClose, onEdit, onDelete }) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, mounted]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 240);
  };

  if (!mounted || !open || !event) return null;

  const catKey = (event.category ?? "other").toLowerCase();
  const cat = CATEGORY_META[catKey] ?? CATEGORY_META.other;
  const notif = NOTIF_META[event.notificationMode] ?? NOTIF_META.NONE;
  const imgSrc = getEventImage(event.type);
  const roseParadeMeta = getRoseParadeEventMeta(event);
  const formattedDate = formatDateEs(event.date);
  const shortDate = formatDateEs(event.date, "short");
  const formattedTime = event.time ? normalizeTimeTo12h(event.time) : "";
  const busCapacities = Array.isArray(event.busCapacities) ? event.busCapacities : [];
  const totalBusCapacity = busCapacities.reduce(
    (sum, bus) => sum + (Number(bus?.capacity) || 0),
    0
  );
  const priority = PRIORITY_META[event.priority] ?? PRIORITY_META.normal;
  const transportFee = Number(event.transportFeeAmount) || 0;
  const hasTransportPayment = Boolean(event.transportPaymentEnabled);
  const scheduleItems = [
    event.departure && {
      label: "Salida CEDES",
      value: normalizeTimeTo12h(event.departure),
      icon: <BusIcon />,
    },
    event.arrival && {
      label: "Regreso aprox.",
      value: normalizeTimeTo12h(event.arrival),
      icon: <HomeIcon />,
    },
  ].filter(Boolean);
  const paymentSummary = hasTransportPayment
    ? transportFee > 0
      ? `Pago habilitado · ₡${transportFee.toLocaleString("es-CR")}`
      : "Pago habilitado"
    : "";
  const roseParadeContext = roseParadeMeta ? getRoseParadeContext(event, cat.label) : null;

  const panelClasses = isMobile
    ? `fixed inset-x-0 bottom-0 z-[1300] flex max-h-[94dvh] flex-col overflow-hidden rounded-t-[32px] bg-[#FAFAFB] shadow-[0_-24px_72px_rgba(15,23,42,0.2)] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        visible ? "translate-y-0" : "translate-y-full"
      }`
    : `fixed inset-y-0 right-0 z-[1300] flex w-full max-w-[560px] flex-col overflow-hidden bg-[#FAFAFB] shadow-[-24px_0_80px_rgba(15,23,42,0.18)] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        visible ? "translate-x-0" : "translate-x-full"
      }`;

  return createPortal(
    <>
      <div
        onClick={handleClose}
        aria-hidden="true"
        className={`fixed inset-0 z-[1290] bg-slate-950/50 backdrop-blur-sm transition-opacity duration-200 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      />

      <div role="dialog" aria-modal="true" aria-label={event.title} className={panelClasses}>
        {isMobile && (
          <div className="flex shrink-0 justify-center bg-[#FAFAFB] pb-1 pt-3">
            <div className="h-1 w-10 rounded-full bg-slate-200" />
          </div>
        )}

        <header className="relative flex h-16 shrink-0 items-center justify-between bg-[#FAFAFB] px-5">
          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar detalle del evento"
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-900 transition-colors duration-200 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 active:scale-95"
          >
            <BackIcon />
          </button>
          <p className="absolute left-1/2 max-w-[56%] -translate-x-1/2 truncate text-sm font-bold text-slate-900">
            {roseParadeMeta ? "Desfile de las Rosas" : "Evento"}
          </p>
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-base shadow-sm ring-1 ring-slate-200/70"
            aria-hidden="true"
          >
            {roseParadeMeta ? "🌹" : cat.icon}
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8 sm:px-6">
          <div className="relative h-56 overflow-hidden rounded-[28px] bg-slate-100 shadow-sm sm:h-64">
            <img
              src={imgSrc}
              alt={event.type ?? event.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-slate-950/15 to-transparent" />
            <div className="absolute left-4 top-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1.5 text-xs font-bold text-slate-800 shadow-sm backdrop-blur-md">
                <span>{cat.icon}</span>
                {cat.label}
              </span>
            </div>
          </div>

          <section className="px-1 pb-7 pt-6 text-center">
            {roseParadeMeta && (
              <div className="mb-3 flex justify-center">
                <RoseParadeEventBadge event={event} />
              </div>
            )}
            <h2 className="mx-auto max-w-md text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">
              {event.title}
            </h2>
            <p className="mt-3 text-sm font-medium text-slate-500 sm:text-base">
              {formattedDate}
              {formattedTime ? ` · ${formattedTime}` : ""}
            </p>
          </section>

          {roseParadeMeta?.isParadeDay && (
            <div className="mb-6">
              <RoseParadeEventCountdown event={event} />
            </div>
          )}

          <EventAvatarStack roseParadeMeta={roseParadeMeta} />

          <SummaryStrip
            category={cat.label}
            date={shortDate}
            place={event.place}
            roseParadeMeta={roseParadeMeta}
            type={event.type}
          />

          {roseParadeContext && !roseParadeMeta.isParadeDay && (
            <RoseParadeContextPanel context={roseParadeContext} />
          )}

          <div className="mt-6 grid grid-cols-2 gap-3">
            {event.place && (
              <InfoCard
                icon={<PinIcon />}
                label="Punto clave"
                value={event.place}
                accent={cat.accent}
                wide
              />
            )}
            {scheduleItems.length > 0 && (
              <InfoCard
                icon={<ClockIcon />}
                label="Traslado"
                value={scheduleItems.map((item) => `${item.label}: ${item.value}`).join(" · ")}
                accent={cat.accent}
                wide
              />
            )}
            {busCapacities.length > 0 && (
              <InfoCard
                icon={<BusIcon />}
                label="Transporte"
                value={`${busCapacities.length} bus${
                  busCapacities.length === 1 ? "" : "es"
                } · ${totalBusCapacity} cupos`}
                accent={cat.accent}
              />
            )}
            {hasTransportPayment && (
              <InfoCard
                icon={<PaymentIcon />}
                label="Pago de transporte"
                value={paymentSummary}
                accent={cat.accent}
              />
            )}
            {event.notificationMode === "LIVE" && (
              <InfoCard
                icon={<BellIcon />}
                label="Aviso enviado"
                value={notif.label}
                accent={cat.accent}
              />
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {event.priority === "high" && (
              <StatusPill label={`Prioridad ${priority.label}`} tone={priority.tone} />
            )}
            {event.type && <StatusPill label={event.type} />}
            {roseParadeMeta && <StatusPill label={roseParadeMeta.label} />}
          </div>

          {busCapacities.length > 0 && (
            <section className="pt-7">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Cupos por bus
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {busCapacities.map((bus) => (
                  <div
                    key={bus.busNumber}
                    className="rounded-2xl bg-white px-3 py-3 ring-1 ring-slate-200/70"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      Bus {bus.busNumber}
                    </p>
                    <p className="mt-1 text-lg font-black text-slate-950">
                      {bus.capacity} cupos
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {event.description && (
            <section className="pb-2 pt-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                {roseParadeMeta ? "Pasadena 2027" : cat.label}
              </p>
              <h3 className="mt-2 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
                {roseParadeMeta ? "Costa Rica marcha hacia Pasadena" : "Detalles del evento"}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                {event.description}
              </p>
            </section>
          )}

          {roseParadeContext && !event.description && (
            <section className="pb-2 pt-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-rose-500">
                Pasadena 2027
              </p>
              <h3 className="mt-2 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
                {roseParadeContext.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                {roseParadeContext.description}
              </p>
            </section>
          )}

          {event.createdAt && (
            <p className="pt-5 text-xs text-slate-400">
              Creado el{" "}
              {new Date(Number(event.createdAt) || event.createdAt).toLocaleDateString("es-CR")}
            </p>
          )}
        </div>

        {isAdmin ? (
          <AdminFooter
            event={event}
            isMobile={isMobile}
            onClose={handleClose}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ) : (
          isMobile && (
            <div className="sticky bottom-0 shrink-0 border-t border-slate-200/70 bg-white/90 px-5 py-3 backdrop-blur-xl">
              <button
                type="button"
                onClick={handleClose}
                className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition-all duration-200 hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 active:scale-[0.98]"
              >
                Cerrar
              </button>
            </div>
          )
        )}
      </div>
    </>,
    document.body
  );
}

function getRoseParadeContext(event, categoryLabel) {
  const timestamp = Number(event.date);
  const dateKey = Number.isFinite(timestamp) ? new Date(timestamp).toISOString().slice(0, 10) : "";
  const isBeforeParade = dateKey && dateKey < "2027-01-01";
  const isAfterParade = dateKey && dateKey > "2027-01-01";

  if (isBeforeParade) {
    return {
      title: "Preparación para Pasadena",
      description:
        "Este evento forma parte de la etapa final de preparación de la Banda CEDES Don Bosco rumbo al Rose Parade 2027.",
      highlights: [
        { label: "Propósito", value: "Preparar la presentación internacional" },
        { label: "Representación", value: "Costa Rica en Pasadena" },
        { label: "Enfoque", value: event.type || categoryLabel },
      ],
    };
  }

  if (isAfterParade) {
    return {
      title: "Cierre de la gira Rose Parade",
      description:
        "Este evento acompaña el cierre de la experiencia en Pasadena después de la participación de la banda en el Rose Parade 2027.",
      highlights: [
        { label: "Etapa", value: "Cierre de gira" },
        { label: "Experiencia", value: "Pasadena 2027" },
        { label: "Enfoque", value: event.type || categoryLabel },
      ],
    };
  }

  return {
    title: "Agenda Rose Parade 2027",
    description:
      "Este evento es parte de la agenda especial de la Banda CEDES Don Bosco en su camino al Rose Parade 2027.",
    highlights: [
      { label: "Agenda", value: "Rose Parade 2027" },
      { label: "Delegación", value: "Banda CEDES Don Bosco" },
      { label: "Enfoque", value: event.type || categoryLabel },
    ],
  };
}

function EventAvatarStack({ roseParadeMeta }) {
  if (!roseParadeMeta) return null;

  return (
    <div className="flex justify-center pb-5" aria-label="Banda CEDES Don Bosco rumbo a Pasadena">
      {["🌹", "🎺", "🇨🇷", "BCDB", "2027"].map((item, index) => (
        <span
          key={item}
          className={`flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#FAFAFB] bg-white text-sm font-black text-slate-700 shadow-sm ${
            index ? "-ml-2" : ""
          }`}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function SummaryStrip({ category, date, place, roseParadeMeta, type }) {
  const mainLabel = roseParadeMeta ? "Rumbo a Pasadena" : type || category;
  const details = [date, place].filter(Boolean).join(" · ");

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-y border-slate-200/70 py-4 text-sm font-bold text-slate-900">
      <span>{mainLabel}</span>
      {details && <span className="text-right text-slate-500">{details}</span>}
    </div>
  );
}

function InfoCard({ icon, label, value, accent, wide = false }) {
  return (
    <div
      className={`min-w-0 rounded-2xl bg-white px-3.5 py-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/70 ${
        wide ? "col-span-2" : "col-span-1"
      }`}
    >
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className="flex opacity-80" style={{ color: accent }}>
          {icon}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
          {label}
        </span>
      </div>
      <p className="break-words text-sm font-bold leading-5 text-slate-950">{value}</p>
    </div>
  );
}

function RoseParadeContextPanel({ context }) {
  return (
    <section className="mt-6 rounded-[24px] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] ring-1 ring-rose-100">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-rose-500">
        Agenda Rose Parade
      </p>
      <h3 className="mt-2 text-lg font-black tracking-tight text-slate-950">{context.title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{context.description}</p>
      <div className="mt-4 grid gap-2">
        {context.highlights.map((item) => (
          <div
            key={item.label}
            className="flex items-start justify-between gap-3 rounded-2xl bg-rose-50/70 px-3 py-2.5"
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-rose-500">
              {item.label}
            </span>
            <span className="text-right text-sm font-bold leading-5 text-slate-900">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function StatusPill({ label, tone = "bg-white text-slate-600 ring-slate-200/70" }) {
  return (
    <span className={`rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${tone}`}>
      {label}
    </span>
  );
}

function AdminFooter({ event, isMobile, onClose, onDelete, onEdit }) {
  return (
    <div className="sticky bottom-0 flex shrink-0 items-center gap-2.5 border-t border-slate-200/70 bg-white/90 px-5 py-3 shadow-[0_-8px_28px_rgba(15,23,42,0.04)] backdrop-blur-xl sm:px-6">
      {isMobile && (
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-2xl bg-slate-100 p-3 text-sm font-bold text-slate-600 transition-all duration-200 hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 active:scale-[0.98]"
        >
          Cerrar
        </button>
      )}
      <button
        type="button"
        onClick={() => {
          onDelete(event);
          onClose();
        }}
        className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-rose-50 px-3.5 py-3 text-xs font-bold text-rose-600 ring-1 ring-inset ring-rose-200 transition-all duration-200 hover:bg-rose-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 active:scale-[0.98]"
      >
        <TrashIcon /> Eliminar
      </button>
      <button
        type="button"
        onClick={() => {
          onEdit(event);
          onClose();
        }}
        className={`inline-flex items-center justify-center gap-1.5 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-sm shadow-slate-900/15 transition-all duration-200 hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 active:scale-[0.98] ${
          isMobile ? "flex-1" : ""
        }`}
      >
        <EditIcon /> Editar
      </button>
    </div>
  );
}

EventAvatarStack.propTypes = {
  roseParadeMeta: PropTypes.object,
};

SummaryStrip.propTypes = {
  category: PropTypes.string.isRequired,
  date: PropTypes.string,
  place: PropTypes.string,
  roseParadeMeta: PropTypes.object,
  type: PropTypes.string,
};

InfoCard.propTypes = {
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  accent: PropTypes.string,
  wide: PropTypes.bool,
};

RoseParadeContextPanel.propTypes = {
  context: PropTypes.shape({
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    highlights: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        value: PropTypes.string.isRequired,
      })
    ).isRequired,
  }).isRequired,
};

StatusPill.propTypes = {
  label: PropTypes.string.isRequired,
  tone: PropTypes.string,
};

AdminFooter.propTypes = {
  event: PropTypes.object.isRequired,
  isMobile: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
};

const BackIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
  </svg>
);

const ClockIcon = () => (
  <svg
    className="h-3.5 w-3.5"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="2.2"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
    />
  </svg>
);

const PinIcon = () => (
  <svg
    className="h-3.5 w-3.5"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="2.2"
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
    />
  </svg>
);

const BusIcon = () => (
  <svg
    className="h-3.5 w-3.5"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="2.2"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
    />
  </svg>
);

const HomeIcon = () => (
  <svg
    className="h-3.5 w-3.5"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="2.2"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75"
    />
  </svg>
);

const BellIcon = () => (
  <svg
    className="h-3.5 w-3.5"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="2.2"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14.25 18.75a2.25 2.25 0 0 1-4.5 0m8.25-3V11.25a6 6 0 1 0-12 0v4.5l-1.5 1.5h15l-1.5-1.5Z"
    />
  </svg>
);

const PaymentIcon = () => (
  <svg
    className="h-3.5 w-3.5"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="2.2"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 8.25h19.5M3.75 6h16.5A1.5 1.5 0 0 1 21.75 7.5v9A1.5 1.5 0 0 1 20.25 18h-16.5A1.5 1.5 0 0 1 2.25 16.5v-9A1.5 1.5 0 0 1 3.75 6Zm3 10.5h3.75"
    />
  </svg>
);

const EditIcon = () => (
  <svg
    className="h-3.5 w-3.5"
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
    className="h-3.5 w-3.5"
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

EventDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  event: PropTypes.object,
  isAdmin: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
