/**
 * budgets/InitializeBudgetModal.jsx
 * Modal de inicialización única del presupuesto STAFF.
 * Solo Tailwind — sin CSS inline.
 */
import React, { useState, useMemo } from "react";
import PropTypes from "prop-types";
import { useMutation, useQuery } from "@apollo/client";
import { INITIALIZE_COMMITTEE_BUDGETS } from "graphql/mutations/finance";
import {
  GET_COMMITTEE_DISTRIBUTION_CONFIG,
  GET_ALL_COMMITTEE_BUDGETS,
} from "graphql/queries/finance";
import { formatCRC, todayStr } from "utils/finance";
import { Notice } from "../FinanceAtoms";
import { useNotice } from "hooks/useFinance";

const parseAmount = (str) => Number(String(str).replace(/[^\d]/g, "")) || 0;

const InitializeBudgetModal = ({ onClose, onSuccess }) => {
  const [rawAmount, setRawAmount] = useState("");
  const [description, setDescription] = useState("Presupuesto STAFF inicial");
  const [notes, setNotes] = useState("");
  const [businessDate, setBusinessDate] = useState(todayStr());
  const [notice, showNotice] = useNotice();

  const { data: configData } = useQuery(GET_COMMITTEE_DISTRIBUTION_CONFIG, {
    fetchPolicy: "cache-first",
  });
  const committees = configData?.committeeDistributionConfig?.committees || [];
  const isValidConfig = configData?.committeeDistributionConfig?.isValid;

  const [initialize, { loading }] = useMutation(INITIALIZE_COMMITTEE_BUDGETS, {
    refetchQueries: [{ query: GET_ALL_COMMITTEE_BUDGETS }],
    awaitRefetchQueries: true,
    onCompleted: (d) => onSuccess?.(d.initializeCommitteeBudgets),
    onError: (e) => showNotice("error", e.message),
  });

  const totalAmount = parseAmount(rawAmount);

  const preview = useMemo(() => {
    if (!committees.length || totalAmount <= 0) return [];
    return committees.map((c, i) => {
      let amt;
      if (i === committees.length - 1) {
        const prev = committees
          .slice(0, i)
          .reduce((s, x) => s + Math.round((totalAmount * x.distributionPercentage) / 100), 0);
        amt = totalAmount - prev;
      } else {
        amt = Math.round((totalAmount * c.distributionPercentage) / 100);
      }
      return { ...c, amount: amt };
    });
  }, [committees, totalAmount]);

  const handleConfirm = () => {
    if (totalAmount <= 0) return showNotice("error", "El monto debe ser mayor a ₡0.");
    if (!businessDate) return showNotice("error", "Seleccioná una fecha.");
    if (!isValidConfig)
      return showNotice(
        "error",
        "Los porcentajes no suman 100%. Ajustalos primero en Configuración."
      );
    initialize({
      variables: {
        input: {
          totalAmount,
          businessDate,
          description: description.trim() || undefined,
          notes: notes.trim() || undefined,
        },
      },
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-start justify-between shrink-0">
          <div>
            <p className="text-xs font-extrabold text-emerald-600 uppercase tracking-widest mb-1">
              Inicialización única
            </p>
            <h2 className="text-base font-bold text-slate-900">Asignar presupuesto STAFF</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl leading-none p-1"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200">
            <span className="text-sm shrink-0">⚠️</span>
            <p className="text-xs font-semibold text-amber-800 leading-relaxed">
              Esta acción solo puede realizarse <strong>una vez</strong>. El presupuesto inicial es
              permanente.
            </p>
          </div>

          <Notice notice={notice} />

          {/* Monto */}
          <div>
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest block mb-1.5">
              Monto total
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={rawAmount ? Number(rawAmount).toLocaleString("es-CR") : ""}
              onChange={(e) => setRawAmount(e.target.value.replace(/[^\d]/g, ""))}
              placeholder="0"
              autoFocus
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-2xl font-extrabold text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>

          {/* Fecha */}
          <div>
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest block mb-1.5">
              Fecha
            </label>
            <input
              type="date"
              value={businessDate}
              onChange={(e) => setBusinessDate(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest block mb-1.5">
              Descripción
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          {/* Preview distribución */}
          {committees.length > 0 && (
            <div>
              <p className="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-2">
                Distribución
              </p>
              <div className="space-y-1.5">
                {preview.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded">
                        {c.distributionPercentage}%
                      </span>
                      <span className="text-sm font-semibold text-slate-800">{c.name}</span>
                    </div>
                    <span className="text-sm font-extrabold text-emerald-700 tabular-nums">
                      {totalAmount > 0 ? formatCRC(c.amount) : "—"}
                    </span>
                  </div>
                ))}
                {totalAmount > 0 && (
                  <div className="flex justify-between px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200">
                    <span className="text-xs font-bold text-emerald-700">Total</span>
                    <span className="text-sm font-extrabold text-emerald-800 tabular-nums">
                      {formatCRC(preview.reduce((s, c) => s + c.amount, 0))}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notas */}
          <div>
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest block mb-1.5">
              Notas (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-3 border-t border-slate-100 space-y-2 shrink-0">
          <button
            onClick={handleConfirm}
            disabled={loading || totalAmount <= 0}
            className="w-full py-3.5 rounded-2xl bg-black hover:bg-gray-700 text-white font-extrabold text-sm disabled:opacity-40 active:scale-[0.98] transition-all"
          >
            {loading
              ? "Inicializando…"
              : totalAmount > 0
              ? `Confirmar · ${formatCRC(totalAmount)}`
              : "Ingresá un monto"}
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

InitializeBudgetModal.propTypes = { onClose: PropTypes.func, onSuccess: PropTypes.func };

export default InitializeBudgetModal;
