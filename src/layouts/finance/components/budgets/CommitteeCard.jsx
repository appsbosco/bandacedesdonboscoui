/**
 * budgets/CommitteeCard.jsx
 * Tarjeta de comité con Tailwind. colorClass = "bg-emerald-500" etc.
 */
import React from "react";
import PropTypes from "prop-types";
import { formatCRC } from "utils/finance";

const CommitteeCard = ({ budget, colorClass = "bg-emerald-500", onClick }) => {
  const {
    committee,
    currentBalance = 0,
    initialAllocation = 0,
    utilityDistributions = 0,
    expenseDebits = 0,
  } = budget;
  const totalIn = initialAllocation + utilityDistributions;
  const spentPct = totalIn > 0 ? Math.min(100, (expenseDebits / totalIn) * 100) : 0;
  const isHighSpend = spentPct > 80;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm rounded-2xl overflow-hidden transition-all active:scale-[0.99]"
    >
      {/* Franja de color superior */}
      <div className={`h-1 w-full ${colorClass}`} />

      <div className="p-4 space-y-3">
        {/* Nombre + badges + saldo */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-900 truncate">{committee.name}</p>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className="inline-flex px-1.5 py-0.5 rounded text-xs font-extrabold bg-slate-100 text-slate-600">
                {committee.distributionPercentage}%
              </span>
              {isHighSpend && (
                <span className="inline-flex px-1.5 py-0.5 rounded text-xs font-extrabold bg-amber-100 text-amber-700">
                  ⚠ Alto gasto
                </span>
              )}
              {currentBalance < 0 && (
                <span className="inline-flex px-1.5 py-0.5 rounded text-xs font-extrabold bg-red-100 text-red-700">
                  Negativo
                </span>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p
              className={`text-lg font-extrabold tabular-nums leading-none ${
                currentBalance < 0 ? "text-red-600" : "text-slate-900"
              }`}
            >
              {formatCRC(currentBalance)}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">saldo</p>
          </div>
        </div>

        {/* Barra de gasto */}
        <div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isHighSpend ? "bg-amber-400" : colorClass
              }`}
              style={{ width: `${spentPct}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1 tabular-nums">
            {spentPct.toFixed(0)}% gastado de {formatCRC(totalIn)}
          </p>
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
          <div>
            <p className="text-xs text-slate-400">Inicial</p>
            <p className="text-xs font-bold text-slate-700 tabular-nums">
              {formatCRC(initialAllocation)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Utilidades</p>
            <p className="text-xs font-bold text-emerald-700 tabular-nums">
              +{formatCRC(utilityDistributions)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Gastos</p>
            <p className="text-xs font-bold text-red-600 tabular-nums">
              −{formatCRC(expenseDebits)}
            </p>
          </div>
        </div>

        <p className="text-xs font-semibold text-slate-400 text-right">Ver detalle →</p>
      </div>
    </button>
  );
};

CommitteeCard.propTypes = {
  budget: PropTypes.object.isRequired,
  colorClass: PropTypes.string,
  onClick: PropTypes.func.isRequired,
};

export default CommitteeCard;
