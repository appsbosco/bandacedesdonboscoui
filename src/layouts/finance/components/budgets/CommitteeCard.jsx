/**
 * budgets/CommitteeCard.jsx
 * Tarjeta de comité — muestra todos los campos del schema CommitteeBudgetSummary.
 *
 * Mejoras v2:
 * - Muestra manualCredits, manualDebits, entryCount
 * - Tooltip en nombre largo
 * - Saldo negativo más visible
 * - Mini progreso más preciso
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
    manualCredits = 0,
    expenseDebits = 0,
    manualDebits = 0,
    totalCredits = 0,
    totalDebits = 0,
    entryCount = 0,
  } = budget;

  const spentPct = totalCredits > 0 ? Math.min(100, (totalDebits / totalCredits) * 100) : 0;
  const isHighSpend = spentPct > 80;
  const isNegative = currentBalance < 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md rounded-2xl overflow-hidden transition-all active:scale-[0.99] group"
    >
      {/* Franja de color superior */}
      <div className={`h-1.5 w-full ${colorClass}`} />

      <div className="p-4 space-y-3">
        {/* Nombre + badges */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-900 truncate" title={committee.name}>
              {committee.name}
            </p>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className="inline-flex px-1.5 py-0.5 rounded text-xs font-extrabold bg-slate-100 text-slate-600">
                {committee.distributionPercentage}%
              </span>
              {isHighSpend && !isNegative && (
                <span className="inline-flex px-1.5 py-0.5 rounded text-xs font-extrabold bg-amber-100 text-amber-700">
                  ⚠ Alto gasto
                </span>
              )}
              {isNegative && (
                <span className="inline-flex px-1.5 py-0.5 rounded text-xs font-extrabold bg-red-100 text-red-700">
                  ⚠ Negativo
                </span>
              )}
              {entryCount > 0 && (
                <span className="inline-flex px-1.5 py-0.5 rounded text-xs font-semibold bg-slate-50 text-slate-400">
                  {entryCount} mov.
                </span>
              )}
            </div>
          </div>
          {/* Saldo actual */}
          <div className="text-right shrink-0">
            <p
              className={`text-xl font-extrabold tabular-nums leading-none ${
                isNegative ? "text-red-600" : "text-slate-900"
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
              className={`h-full rounded-full transition-all duration-500 ${
                isNegative ? "bg-red-500" : isHighSpend ? "bg-amber-400" : colorClass
              }`}
              style={{ width: `${Math.min(100, Math.max(0, spentPct))}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1 tabular-nums">
            {spentPct.toFixed(0)}% utilizado · total recibido {formatCRC(totalCredits)}
          </p>
        </div>

        {/* Mini stats — todos los campos del schema */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold">Inicial</p>
            <p className="text-xs font-bold text-slate-700 tabular-nums">
              {formatCRC(initialAllocation)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold">Utilidades</p>
            <p className="text-xs font-bold text-emerald-700 tabular-nums">
              +{formatCRC(utilityDistributions)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold">Gastos</p>
            <p className="text-xs font-bold text-red-600 tabular-nums">
              −{formatCRC(expenseDebits)}
            </p>
          </div>
          {manualCredits > 0 && (
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Créditos</p>
              <p className="text-xs font-bold text-blue-600 tabular-nums">
                +{formatCRC(manualCredits)}
              </p>
            </div>
          )}
          {manualDebits > 0 && (
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Débitos</p>
              <p className="text-xs font-bold text-orange-600 tabular-nums">
                −{formatCRC(manualDebits)}
              </p>
            </div>
          )}
        </div>

        <p className="text-xs font-semibold text-slate-400 text-right group-hover:text-slate-600 transition-colors">
          Ver historial →
        </p>
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
