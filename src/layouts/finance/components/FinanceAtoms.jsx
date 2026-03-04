/**
 * FinanceAtoms.jsx
 * Átomos reutilizables del módulo finance.
 *
 * Correcciones v2:
 * - Skeleton: reemplaza clases dinámicas (h-${n}) por clases explícitas
 * - CategoryPicker: colores corregidos para estado no-seleccionado
 * - SaleStatusPill → StatusPill (genérico para ventas y gastos)
 * - VoidReasonModal: texto "Motivo de anulación" corregido
 * - MoneyInput: forwardRef correcto
 */
import React from "react";
import PropTypes from "prop-types";
import { PAYMENT_LABELS } from "utils/finance";

// ─── Notice ───────────────────────────────────────────────────────────────────

export const Notice = ({ notice }) => {
  if (!notice) return null;
  const isSuccess = notice.type === "success";
  return (
    <div
      className={`rounded-xl px-4 py-3 text-sm font-semibold border ${
        isSuccess
          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
          : "bg-red-50 border-red-200 text-red-700"
      }`}
    >
      {notice.message}
    </div>
  );
};

Notice.propTypes = {
  notice: PropTypes.shape({ type: PropTypes.string, message: PropTypes.string }),
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
// Evita h-${n} dinámico (Tailwind purge no detecta clases interpoladas).

export const Skeleton = ({ lines = 3, className = "" }) => (
  <div className={`border border-slate-200 rounded-2xl p-5 animate-pulse space-y-3 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className="rounded bg-slate-200"
        style={{ height: i === 0 ? 16 : 12, width: `${75 - i * 15}%` }}
      />
    ))}
  </div>
);

Skeleton.propTypes = { lines: PropTypes.number, className: PropTypes.string };

// ─── FilterPill ───────────────────────────────────────────────────────────────

export const FilterPill = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border whitespace-nowrap ${
      active
        ? "bg-rose-700 border-rose-700 text-white shadow-sm"
        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
    }`}
  >
    {children}
  </button>
);

FilterPill.propTypes = {
  active: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};

// ─── StatusPill ───────────────────────────────────────────────────────────────
// Genérico para ventas y gastos (antes SaleStatusPill).
// SaleStatusPill se exporta como alias para no romper imports existentes.

const STATUS_CFG = {
  ACTIVE: { label: "Activo", bg: "bg-emerald-100", text: "text-emerald-700" },
  VOIDED: { label: "Anulado", bg: "bg-red-100", text: "text-red-700" },
  REFUNDED: { label: "Reembolsado", bg: "bg-amber-100", text: "text-amber-700" },
};

export const StatusPill = ({ status }) => {
  const cfg = STATUS_CFG[status] || { label: status, bg: "bg-slate-100", text: "text-slate-600" };
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}
    >
      {cfg.label}
    </span>
  );
};

StatusPill.propTypes = { status: PropTypes.string };

// Alias backward-compat
export const SaleStatusPill = StatusPill;

// ─── VoidReasonModal ──────────────────────────────────────────────────────────

export const VoidReasonModal = ({ title = "Anular", onConfirm, onCancel, loading }) => {
  const [reason, setReason] = React.useState("");
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onCancel?.()}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500 mt-1">Ingresá el motivo de anulación.</p>
        </div>
        <div className="p-6 space-y-4">
          <textarea
            autoFocus
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motivo de anulación…"
            rows={3}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 resize-none"
          />
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              onClick={() => onConfirm?.(reason)}
              disabled={loading || !reason.trim()}
              className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold disabled:opacity-50 transition-all"
            >
              {loading ? "…" : "Anular"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

VoidReasonModal.propTypes = {
  title: PropTypes.string,
  onConfirm: PropTypes.func,
  onCancel: PropTypes.func,
  loading: PropTypes.bool,
};

// ─── ConfirmModal ─────────────────────────────────────────────────────────────

export const ConfirmModal = ({
  title,
  message,
  onConfirm,
  onCancel,
  loading,
  confirmLabel = "Confirmar",
  dangerous = true,
}) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
    onClick={(e) => e.target === e.currentTarget && onCancel?.()}
  >
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
      <div className="px-6 pt-6 pb-4 border-b border-slate-100">
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        {message && <p className="text-sm text-slate-500 mt-1">{message}</p>}
      </div>
      <div className="p-6 flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 ${
            dangerous
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-rose-700 hover:bg-rose-800 text-white"
          }`}
        >
          {loading ? "…" : confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

ConfirmModal.propTypes = {
  title: PropTypes.string,
  message: PropTypes.string,
  onConfirm: PropTypes.func,
  onCancel: PropTypes.func,
  loading: PropTypes.bool,
  confirmLabel: PropTypes.string,
  dangerous: PropTypes.bool,
};

// ─── PaymentMethodPills ───────────────────────────────────────────────────────

export const PaymentMethodPills = ({ value, onChange }) => (
  <div className="grid grid-cols-2 gap-2">
    {Object.entries(PAYMENT_LABELS).map(([k, v]) => (
      <button
        key={k}
        type="button"
        onClick={() => onChange(k)}
        className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl border text-sm font-bold transition-all active:scale-[0.97] ${
          value === k
            ? "bg-rose-700 border-rose-700 text-white shadow-md"
            : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
        }`}
      >
        <span className="text-lg">{v.emoji}</span>
        {v.label}
      </button>
    ))}
  </div>
);

PaymentMethodPills.propTypes = { value: PropTypes.string, onChange: PropTypes.func };

// ─── MoneyInput ───────────────────────────────────────────────────────────────

export const MoneyInput = React.forwardRef(
  ({ value, onChange, placeholder = "0", className = "" }, ref) => (
    <div className={`relative ${className}`}>
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400 pointer-events-none select-none">
        ₡
      </span>
      <input
        ref={ref}
        type="tel"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))}
        placeholder={placeholder}
        className="w-full text-right text-3xl font-extrabold text-slate-900 border-0 border-b-2 border-slate-200 focus:border-rose-500 focus:outline-none py-3 pr-4 pl-10 bg-transparent tracking-tight"
      />
    </div>
  )
);

MoneyInput.displayName = "MoneyInput";
MoneyInput.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  className: PropTypes.string,
};

// ─── AmountPresets ────────────────────────────────────────────────────────────

export const AmountPresets = ({ onSelect, presets = [] }) => (
  <div className="flex flex-wrap gap-2">
    {presets.map((v) => (
      <button
        key={v}
        type="button"
        onClick={() => onSelect(String(v))}
        className="px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 hover:bg-rose-50 hover:text-rose-700 border border-slate-200 hover:border-rose-200 transition-all active:scale-95"
      >
        ₡{new Intl.NumberFormat("es-CR").format(v)}
      </button>
    ))}
  </div>
);

AmountPresets.propTypes = {
  onSelect: PropTypes.func,
  presets: PropTypes.arrayOf(PropTypes.number),
};

// ─── CategoryPicker ───────────────────────────────────────────────────────────
// Corregido: estado no-seleccionado legible y consistente.

export const CategoryPicker = ({ categories, selected, onSelect, loading }) => {
  if (loading)
    return (
      <div className="flex gap-2 flex-wrap">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-9 w-24 bg-slate-200 rounded-full animate-pulse" />
        ))}
      </div>
    );

  if (!categories?.length)
    return <p className="text-sm text-slate-500 italic">Sin categorías. Creá una en Catálogos.</p>;

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => onSelect(cat.id === selected ? null : cat.id)}
          className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all active:scale-95 ${
            selected === cat.id
              ? "bg-rose-700 border-rose-700 text-white shadow-sm"
              : "bg-white border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50"
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
};

CategoryPicker.propTypes = {
  categories: PropTypes.array,
  selected: PropTypes.string,
  onSelect: PropTypes.func,
  loading: PropTypes.bool,
};

// ─── ActivityPills ────────────────────────────────────────────────────────────

export const ActivityPills = ({ activities, selected, onSelect, loading }) => {
  if (loading || !activities?.length) return null;
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap transition-all ${
          !selected
            ? "bg-slate-800 border-slate-800 text-white"
            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
        }`}
      >
        Sin actividad
      </button>
      {activities.map((a) => (
        <button
          key={a.id}
          type="button"
          onClick={() => onSelect(a.id === selected ? null : a.id)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap transition-all ${
            selected === a.id
              ? "bg-slate-800 border-slate-800 text-white"
              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          {a.name}
        </button>
      ))}
    </div>
  );
};

ActivityPills.propTypes = {
  activities: PropTypes.array,
  selected: PropTypes.string,
  onSelect: PropTypes.func,
  loading: PropTypes.bool,
};

// ─── StatCard ─────────────────────────────────────────────────────────────────

export const StatCard = ({ label, value, sub, valueClass = "text-slate-900" }) => {
  const str = String(value ?? "");
  const len = str.length;
  const sizeClass = len > 18 ? "text-lg" : len > 14 ? "text-xl" : "text-2xl";

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 overflow-hidden">
      <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest mb-2">
        {label}
      </p>
      <div className="min-w-0">
        <p
          className={`leading-none tracking-tight font-extrabold tabular-nums ${sizeClass} ${valueClass} truncate`}
          title={str}
        >
          {str}
        </p>
      </div>
      {sub && <p className="text-xs text-slate-500 mt-2 truncate">{sub}</p>}
    </div>
  );
};

StatCard.propTypes = {
  label: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  sub: PropTypes.string,
  valueClass: PropTypes.string,
};

// ─── ScopeBadge ───────────────────────────────────────────────────────────────
// Badge reutilizable para mostrar scope EXTERNAL en listas.

export const ScopeBadge = ({ scope }) => {
  if (scope !== "EXTERNAL") return null;
  return (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
      Externo
    </span>
  );
};

ScopeBadge.propTypes = { scope: PropTypes.string };

// ─── ExternalToggle ───────────────────────────────────────────────────────────
// Toggle reutilizable SESSION/EXTERNAL para ventas y gastos.

export const ExternalToggle = ({ isExternal, onChange, canUseSession }) => (
  <div className="border border-slate-200 rounded-2xl p-4">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">
          Externo
        </p>
        <p className="text-sm font-semibold text-slate-800">
          No afecta la caja aunque esté abierta
        </p>
        <p className="text-xs text-slate-400 mt-1">
          {isExternal
            ? "Se registrará como EXTERNO (sin cashSessionId)."
            : "Se registrará como de CAJA y entra en el arqueo."}
        </p>
      </div>
      <button
        type="button"
        onClick={() => {
          // Si no hay caja abierta no puede activar SESSION
          if (!isExternal && !canUseSession) return;
          onChange(!isExternal);
        }}
        disabled={isExternal && !canUseSession}
        className={`shrink-0 px-4 py-2 rounded-xl border text-sm font-bold transition-all ${
          isExternal
            ? "bg-indigo-600 border-indigo-600 text-white"
            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
        } ${isExternal && !canUseSession ? "opacity-50 cursor-not-allowed" : ""}`}
        title={
          isExternal && !canUseSession
            ? "No hay caja abierta. Solo se permiten movimientos externos."
            : ""
        }
      >
        {isExternal ? "ON" : "OFF"}
      </button>
    </div>
    {!canUseSession && (
      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mt-3">
        ⚠️ No hay caja abierta: los movimientos se registran como <b>EXTERNOS</b>.
      </p>
    )}
  </div>
);

ExternalToggle.propTypes = {
  isExternal: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  canUseSession: PropTypes.bool.isRequired,
};

export const CommitteePicker = ({ committees, selected, onSelect, loading, budgets = [] }) => {
  // Mapa rápido committeeId → saldo
  const balanceMap = {};
  budgets.forEach((b) => {
    balanceMap[b.committee.id] = b.currentBalance;
  });

  if (loading) {
    return (
      <div className="flex gap-2 flex-wrap">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-9 w-28 bg-slate-200 rounded-full animate-pulse" />
        ))}
      </div>
    );
  }

  if (!committees?.length) {
    return <p className="text-sm text-slate-500 italic">Sin comités. Contactá al administrador.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {committees.map((c) => {
        const balance = balanceMap[c.id];
        const isSelected = selected === c.id;
        const isLow = balance != null && balance < 10000;

        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c.id === selected ? null : c.id)}
            className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-all active:scale-95 flex flex-col items-start ${
              isSelected
                ? "bg-black border-black text-white shadow-sm"
                : "bg-white border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50"
            }`}
          >
            <span>{c.name}</span>
            {balance != null && (
              <span
                className={`text-xs font-bold mt-0.5 ${
                  isSelected ? "text-violet-200" : isLow ? "text-amber-600" : "text-slate-500"
                }`}
              >
                {isLow ? "⚠️ " : ""}
                {new Intl.NumberFormat("es-CR", {
                  style: "currency",
                  currency: "CRC",
                  minimumFractionDigits: 0,
                }).format(balance)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

CommitteePicker.propTypes = {
  committees: PropTypes.array,
  selected: PropTypes.string,
  onSelect: PropTypes.func,
  loading: PropTypes.bool,
  budgets: PropTypes.array,
};
