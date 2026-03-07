/* eslint-disable react/prop-types */
/**
 * RoomFormModal — crear / editar una habitación de gira.
 */
import { useState, useEffect } from "react";

const ROOM_TYPES = [
  { value: "SINGLE", label: "Individual", emoji: "🛏️" },
  { value: "DOUBLE", label: "Doble", emoji: "🛏️🛏️" },
  { value: "TRIPLE", label: "Triple", emoji: "🛏️🛏️🛏️" },
  { value: "QUAD", label: "Cuádruple", emoji: "🏨" },
  { value: "SUITE", label: "Suite", emoji: "⭐" },
];

const EMPTY = {
  hotelName: "",
  roomNumber: "",
  roomType: "DOUBLE",
  capacity: 2,
  floor: "",
  notes: "",
};

export default function RoomFormModal({ isOpen, mode, room, onClose, onSubmit, loading }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    if (mode === "edit" && room) {
      setForm({
        hotelName: room.hotelName || "",
        roomNumber: room.roomNumber || "",
        roomType: room.roomType || "DOUBLE",
        capacity: room.capacity || 2,
        floor: room.floor || "",
        notes: room.notes || "",
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
  }, [isOpen, mode, room]);

  if (!isOpen) return null;

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.hotelName.trim()) e.hotelName = "Requerido";
    if (!form.roomNumber.trim()) e.roomNumber = "Requerido";
    if (!form.capacity || form.capacity < 1) e.capacity = "Debe ser al menos 1";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length > 0) return setErrors(e);
    onSubmit({
      hotelName: form.hotelName.trim(),
      roomNumber: form.roomNumber.trim(),
      roomType: form.roomType,
      capacity: Number(form.capacity),
      floor: form.floor.trim() || null,
      notes: form.notes.trim() || null,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {mode === "create" ? "Nueva habitación" : "Editar habitación"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {mode === "create"
                ? "Registrá los datos de la habitación"
                : "Modificá los datos de la habitación"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Room type */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
              Tipo de habitación
            </label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {ROOM_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => set("roomType", t.value)}
                  className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-xs font-semibold border transition-all ${
                    form.roomType === t.value
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <span>{t.emoji}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Hotel + Room Number */}
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Hotel"
              placeholder="Ej: Hotel Marriott"
              value={form.hotelName}
              error={errors.hotelName}
              onChange={(v) => set("hotelName", v)}
            />
            <Field
              label="N° de habitación"
              placeholder="Ej: 201"
              value={form.roomNumber}
              error={errors.roomNumber}
              onChange={(v) => set("roomNumber", v)}
            />
          </div>

          {/* Capacity + Floor */}
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Capacidad"
              type="number"
              placeholder="2"
              value={form.capacity}
              error={errors.capacity}
              onChange={(v) => set("capacity", v)}
            />
            <Field
              label="Piso"
              placeholder="Ej: 2"
              value={form.floor}
              error={errors.floor}
              onChange={(v) => set("floor", v)}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              Notas <span className="normal-case font-normal">(opcional)</span>
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
              placeholder="Información adicional de la habitación..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-2xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 rounded-2xl bg-gray-900 hover:bg-gray-700 text-white font-bold text-sm disabled:opacity-50 transition-all"
          >
            {loading
              ? "Guardando…"
              : mode === "create"
              ? "Crear habitación"
              : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, placeholder, value, error, onChange, type = "text" }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
        {label}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        min={type === "number" ? 1 : undefined}
        className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all ${
          error ? "border-red-400 bg-red-50" : "border-gray-200"
        }`}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
