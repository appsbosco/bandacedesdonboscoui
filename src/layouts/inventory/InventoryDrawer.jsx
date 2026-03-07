/* eslint-disable react/prop-types */

import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useInventoryMaintenance } from "./useInventory";

function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);
  if (!toast) return null;
  return (
    <div
      className={[
        "fixed bottom-5 right-5 z-[1350] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium",
        toast.type === "error" ? "bg-red-600" : "bg-slate-900",
      ].join(" ")}
    >
      <span>{toast.message}</span>
      <button onClick={onDismiss} className="opacity-70 hover:opacity-100 text-lg leading-none">
        &times;
      </button>
    </div>
  );
}

// ── Labels ────────────────────────────────────────────────────────────────────

const STATUS_LABEL = {
  ON_TIME: "Al día",
  DUE_SOON: "Por vencer",
  OVERDUE: "Vencido",
  NOT_APPLICABLE: "N/A",
};
const STATUS_STYLES = {
  ON_TIME: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  DUE_SOON: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  OVERDUE: "bg-red-50 text-red-700 ring-1 ring-red-200",
  NOT_APPLICABLE: "bg-slate-100 text-slate-500 ring-1 ring-slate-200",
};
const MAINTENANCE_LABEL = {
  PREVENTIVE: "Preventivo",
  CORRECTIVE: "Correctivo",
  TUNING: "Afinación",
  CLEANING: "Limpieza",
  OTHER: "Otro",
};

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ── Add maintenance modal ─────────────────────────────────────────────────────

function AddMaintenanceModal({ onClose, onSave, saving }) {
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
    performedAt: today,
    type: "PREVENTIVE",
    notes: "",
    performedBy: "",
    cost: "",
  });

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.performedAt) return;
    onSave({
      performedAt: form.performedAt,
      type: form.type,
      notes: form.notes || undefined,
      performedBy: form.performedBy || undefined,
      cost: form.cost ? parseFloat(form.cost) : undefined,
    });
  }

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-900">Registrar mantenimiento</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Fecha</label>
              <input
                type="date"
                required
                value={form.performedAt}
                onChange={(e) => set("performedAt", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Tipo</label>
              <select
                value={form.type}
                onChange={(e) => set("type", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20 transition appearance-none cursor-pointer"
              >
                <option value="PREVENTIVE">Preventivo</option>
                <option value="CORRECTIVE">Correctivo</option>
                <option value="TUNING">Afinación</option>
                <option value="CLEANING">Limpieza</option>
                <option value="OTHER">Otro</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Técnico / Taller
            </label>
            <input
              type="text"
              value={form.performedBy}
              onChange={(e) => set("performedBy", e.target.value)}
              placeholder="Nombre del técnico o taller"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Costo (opcional)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.cost}
              onChange={(e) => set("cost", e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notas</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Descripción del trabajo realizado…"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 transition resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !form.performedAt}
              className="px-5 py-2 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition"
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

AddMaintenanceModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};

// ── Maintenance timeline ──────────────────────────────────────────────────────

function MaintenanceTimeline({ records, loading, onDelete }) {
  if (loading) {
    return (
      <div className="space-y-3 mt-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="mt-4 flex flex-col items-center justify-center py-8 text-center">
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-2">
          <svg
            className="w-5 h-5 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M11 4a7 7 0 100 14A7 7 0 0011 4zm0 0V2m0 18v-2M4 11H2m18 0h-2"
            />
          </svg>
        </div>
        <p className="text-sm text-slate-400">Sin registros de mantenimiento</p>
      </div>
    );
  }

  return (
    <div className="mt-4 relative">
      <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-100" />
      <div className="space-y-4">
        {records.map((r) => (
          <div key={r.id} className="relative flex gap-4 pl-10">
            <div className="absolute left-[13px] top-2 w-2.5 h-2.5 rounded-full bg-slate-300 ring-2 ring-white" />
            <div className="flex-1 bg-slate-50 rounded-xl border border-slate-100 px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-slate-800">
                      {MAINTENANCE_LABEL[r.type] || r.type}
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-500">{formatDate(r.performedAt)}</span>
                  </div>
                  {r.performedBy && (
                    <div className="text-xs text-slate-500 mt-0.5">{r.performedBy}</div>
                  )}
                  {r.notes && <div className="text-xs text-slate-600 mt-1.5">{r.notes}</div>}
                  {r.cost != null && (
                    <div className="text-xs text-slate-500 mt-1">
                      Costo: ₡{r.cost.toLocaleString("es-CR")}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => onDelete(r.id)}
                  className="text-slate-300 hover:text-red-500 transition flex-shrink-0 mt-0.5"
                  title="Eliminar registro"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

MaintenanceTimeline.propTypes = {
  records: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  onDelete: PropTypes.func.isRequired,
};

// ── Detail row ────────────────────────────────────────────────────────────────

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between gap-3 py-2 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-xs font-medium text-slate-800 text-right">{value || "—"}</span>
    </div>
  );
}

// ── Main drawer ───────────────────────────────────────────────────────────────

const InventoryDrawer = ({ item, onClose, onMutationDone }) => {
  const [showModal, setShowModal] = useState(false);
  const maintHook = useInventoryMaintenance(item?.id);

  const {
    records,
    loading: loadingRecords,
    adding,
    handleAdd,
    handleDelete,
    toast,
    setToast,
  } = maintHook;

  const user = item.user || {};
  const fullName = [user.name, user.firstSurName, user.secondSurName].filter(Boolean).join(" ");
  const status = item.status || "NOT_APPLICABLE";

  async function handleSaveMaintenance(input) {
    await handleAdd(input);
    setShowModal(false);
    onMutationDone();
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[1290] bg-black/20 backdrop-blur-[1px]" onClick={onClose} />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-[1295] w-full max-w-md bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <div className="text-base font-semibold text-slate-900">
              {item.brand || "Registro de inventario"}
              {item.model ? ` ${item.model}` : ""}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">{fullName}</div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {/* Status banner */}
          <div
            className={`mx-5 mt-4 px-4 py-2.5 rounded-xl flex items-center justify-between ${
              status === "OVERDUE"
                ? "bg-red-50 border border-red-200"
                : status === "DUE_SOON"
                ? "bg-amber-50 border border-amber-200"
                : status === "ON_TIME"
                ? "bg-emerald-50 border border-emerald-200"
                : "bg-slate-100 border border-slate-200"
            }`}
          >
            <div>
              <div
                className={`text-xs font-semibold ${
                  status === "OVERDUE"
                    ? "text-red-700"
                    : status === "DUE_SOON"
                    ? "text-amber-700"
                    : status === "ON_TIME"
                    ? "text-emerald-700"
                    : "text-slate-500"
                }`}
              >
                {STATUS_LABEL[status]}
              </div>
              {item.nextMaintenanceDueAt && (
                <div className="text-xs text-slate-500 mt-0.5">
                  Próximo: {formatDate(item.nextMaintenanceDueAt)}
                </div>
              )}
            </div>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                {
                  ON_TIME: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
                  DUE_SOON: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
                  OVERDUE: "bg-red-50 text-red-700 ring-1 ring-red-200",
                  NOT_APPLICABLE: "bg-slate-100 text-slate-500 ring-1 ring-slate-200",
                }[status]
              }`}
            >
              {STATUS_LABEL[status]}
            </span>
          </div>

          {/* Instrument details */}
          <div className="mx-5 mt-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Detalles del instrumento
            </div>
            <div className="bg-slate-50 rounded-xl border border-slate-100 px-4 py-2">
              <DetailRow label="Instrumento" value={item.instrumentType || user.instrument} />
              <DetailRow label="Marca" value={item.brand} />
              <DetailRow label="Modelo" value={item.model} />
              <DetailRow label="N.º de placa" value={item.numberId} />
              <DetailRow label="Serie" value={item.serie} />
              <DetailRow label="Condición" value={item.condition} />
              <DetailRow
                label="Tenencia"
                value={
                  { PERSONAL: "Personal", INSTITUTIONAL: "Institucional", BORROWED: "Préstamo" }[
                    item.ownership
                  ] || item.ownership
                }
              />
              <DetailRow
                label="Intervalo mant."
                value={item.maintenanceIntervalDays ? `${item.maintenanceIntervalDays} días` : null}
              />
              <DetailRow label="Último mant." value={formatDate(item.lastMaintenanceAt)} />
              {item.details && <DetailRow label="Notas" value={item.details} />}
            </div>
          </div>

          {/* Member info */}
          {user.id && (
            <div className="mx-5 mt-4">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Integrante
              </div>
              <div className="bg-slate-50 rounded-xl border border-slate-100 px-4 py-2">
                <DetailRow label="Nombre" value={fullName} />
                <DetailRow label="Carnet" value={user.carnet} />
                <DetailRow label="Rol" value={user.role} />
                <DetailRow label="Instrumento (perfil)" value={user.instrument} />
              </div>
            </div>
          )}

          {/* Maintenance timeline */}
          <div className="mx-5 mt-4 mb-6">
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Historial de mantenimiento
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Registrar
              </button>
            </div>
            <MaintenanceTimeline
              records={records}
              loading={loadingRecords}
              onDelete={handleDelete}
            />
          </div>
        </div>
      </div>

      {/* Add maintenance modal */}
      {showModal && (
        <AddMaintenanceModal
          onClose={() => setShowModal(false)}
          onSave={handleSaveMaintenance}
          saving={adding}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
};

InventoryDrawer.propTypes = {
  item: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onMutationDone: PropTypes.func.isRequired,
};

export default InventoryDrawer;
