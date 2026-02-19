import React from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";

export const BackChip = ({ to = "/finance", label = "Caja" }) => {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(to)}
      className="shrink-0 inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-2
                 text-xs font-extrabold text-white hover:bg-black
                 active:scale-95 transition-all shadow-sm"
      aria-label={`Volver a ${label}`}
    >
      <span className="text-sm leading-none">←</span>
      <span>{label}</span>
    </button>
  );
};

BackChip.propTypes = {
  to: PropTypes.string,
  label: PropTypes.string,
};

export const FinancePageHeader = ({
  title,
  description,
  backTo,
  backLabel = "Volver a la caja",
  right,
}) => {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      {/* Left */}
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
        {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
      </div>

      {/* Right */}
      {(right || backTo) && (
        <div className="flex items-center gap-2 sm:pt-0.5 self-start sm:self-auto">
          {/* right slot (badges, buttons, etc.) */}
          {right}

          {/* Back chip */}
          {backTo && <BackChip to={backTo} label={backLabel} />}
        </div>
      )}
    </div>
  );
};

FinancePageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  backTo: PropTypes.string,
  backLabel: PropTypes.string,
  right: PropTypes.node,
};
