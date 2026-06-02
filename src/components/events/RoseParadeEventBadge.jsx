import PropTypes from "prop-types";
import { getRoseParadeEventMeta } from "utils/roseParade";

export default function RoseParadeEventBadge({ event, compact = false }) {
  const milestone = getRoseParadeEventMeta(event);
  if (!milestone) return null;

  return (
    <span
      className={`inline-flex max-w-full items-center gap-1 rounded-full bg-rose-50 font-bold uppercase tracking-wide text-rose-600 ring-1 ring-inset ring-rose-200/80 ${
        compact ? "px-1.5 py-0.5 text-[9px]" : "px-2.5 py-1 text-xs"
      }`}
    >
      <RoseIcon compact={compact} />
      <span className="truncate">
        {milestone.isParadeDay ? "Desfile de las Rosas" : "Gira Rose Parade"}
      </span>
    </span>
  );
}

function RoseIcon({ compact }) {
  return (
    <svg
      className={compact ? "h-2.5 w-2.5 shrink-0" : "h-3.5 w-3.5 shrink-0"}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.8"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21v-6m0 0c-3.4 0-6-2.4-6-5.5C6 6.7 8.3 4.7 12 3c3.7 1.7 6 3.7 6 6.5 0 3.1-2.6 5.5-6 5.5Zm0 0c-1.8-2.4-1.8-5.1 0-8.2m0 8.2c1.8-2.4 1.8-5.1 0-8.2"
      />
    </svg>
  );
}

RoseParadeEventBadge.propTypes = {
  event: PropTypes.object.isRequired,
  compact: PropTypes.bool,
};

RoseIcon.propTypes = {
  compact: PropTypes.bool,
};
