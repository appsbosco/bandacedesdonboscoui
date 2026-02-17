import PropTypes from "prop-types";
import React, { useEffect, useMemo, useCallback, useState } from "react";

// ---------------------------
// Helpers (CR timezone ISO)
// ---------------------------
function isoToDatetimeLocal(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function datetimeLocalToIsoCR(datetimeLocal) {
  if (!datetimeLocal) return "";
  const d = new Date(`${datetimeLocal}:00-06:00`);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}

function isValidUrl(url) {
  if (!url) return true;
  try {
    // eslint-disable-next-line no-new
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

const CATEGORIES = [
  { value: "Almuerzo", label: "Almuerzo" },
  { value: "Bebidas", label: "Bebidas" },
  { value: "Postres", label: "Postres" },
];

const DAYS_OPTIONS = [
  { value: "Sábado", label: "Sábado" },
  { value: "Domingo", label: "Domingo" },
];

// ---------------------------
// Preview card (reusable)
// ---------------------------
const PreviewCard = ({ photo, productName, description, category, parsedPrice }) => {
  const hasPhoto = photo && isValidUrl(photo);

  return (
    <div className="border border-default-200 rounded-2xl overflow-hidden bg-white">
      <div className="px-4 py-3 border-b border-default-200">
        <p className="text-sm font-extrabold text-default-900">Vista previa</p>
        <p className="text-xs text-default-500">Cómo se verá en el catálogo.</p>
      </div>

      <div className="p-4">
        <div className="rounded-xl bg-default-100 overflow-hidden h-32 flex items-center justify-center">
          {hasPhoto ? (
            <img
              src={photo}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="text-center text-default-500">
              <div className="text-2xl">🖼️</div>
              <p className="text-xs mt-1">Sin imagen</p>
            </div>
          )}
        </div>

        <div className="mt-4">
          <p className="text-sm font-extrabold text-default-950 truncate">
            {productName.trim() || "Nombre del producto"}
          </p>
          <p className="text-xs text-default-600 mt-1 line-clamp-2 min-h-[32px]">
            {description.trim() || "Descripción corta del producto…"}
          </p>

          <div className="flex items-center justify-between mt-4">
            <span className="text-xs font-semibold text-default-500">
              {category || "Categoría"}
            </span>
            <span className="text-sm font-extrabold text-default-950">
              ₡
              {Number.isFinite(parsedPrice)
                ? new Intl.NumberFormat("es-CR").format(parsedPrice)
                : "0"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

PreviewCard.propTypes = {
  photo: PropTypes.string,
  productName: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  category: PropTypes.string.isRequired,
  parsedPrice: PropTypes.number,
};

PreviewCard.defaultProps = {
  photo: "",
  parsedPrice: NaN,
};

const AddLunchModal = ({ open, onClose, title, name: legacyTitle, initialValues, onSubmit }) => {
  const modalTitle = title || legacyTitle || "Agregar producto";

  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [closingDate, setClosingDate] = useState("");
  const [photo, setPhoto] = useState("");
  const [availableForDays, setAvailableForDays] = useState("");

  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  // Hydrate + reset al abrir
  useEffect(() => {
    if (!open) return;

    const iv = initialValues || {};
    setProductName(iv.name || "");
    setDescription(iv.description || "");
    setCategory(iv.category || "");
    setPrice(iv.price !== undefined && iv.price !== null ? String(iv.price) : "");
    setClosingDate(isoToDatetimeLocal(iv.closingDate || ""));
    setPhoto(iv.photo || "");
    setAvailableForDays(iv.availableForDays || "");
    setTouched(false);
    setSaving(false);
  }, [open, initialValues]);

  // Lock body scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ESC close
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, saving]);

  const parsedPrice = useMemo(() => {
    const n = Number(price);
    return Number.isFinite(n) ? n : NaN;
  }, [price]);

  const errors = useMemo(() => {
    const e = {};
    if (!productName.trim()) e.productName = "El nombre es requerido.";
    if (!category) e.category = "Seleccioná una categoría.";
    if (!closingDate) e.closingDate = "La fecha de cierre es requerida.";
    if (price === "") e.price = "El precio es requerido.";
    else if (!Number.isFinite(parsedPrice) || parsedPrice < 0)
      e.price = "Ingresá un precio válido.";
    if (!isValidUrl(photo)) e.photo = "Pegá un link válido (https://...) o dejalo vacío.";
    return e;
  }, [productName, category, closingDate, price, parsedPrice, photo]);

  const canSave = Object.keys(errors).length === 0 && !saving;

  const handleSubmit = useCallback(async () => {
    setTouched(true);
    if (!canSave) return;

    const closingDateIso = datetimeLocalToIsoCR(closingDate);

    try {
      setSaving(true);
      await onSubmit({
        name: productName.trim(),
        description: description.trim(),
        category,
        price,
        availableForDays,
        photo: photo.trim(),
        closingDate: closingDateIso,
      });
    } finally {
      setSaving(false);
    }
  }, [
    canSave,
    closingDate,
    onSubmit,
    productName,
    description,
    category,
    price,
    availableForDays,
    photo,
  ]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Overlay */}
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={() => (!saving ? onClose() : null)}
        aria-label="Cerrar modal"
      />

      {/* Panel wrapper */}
      <div className="absolute inset-0 flex items-end sm:items-center justify-center p-3 sm:p-6">
        <div
          className="
            w-full max-w-4xl
            bg-white rounded-2xl shadow-2xl
            border border-default-200
            overflow-hidden
            flex flex-col
            max-h-[92dvh] sm:max-h-[88dvh]
          "
          role="dialog"
          aria-modal="true"
          aria-label={modalTitle}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header (no scrollea) */}
          <div className="shrink-0 px-5 sm:px-6 py-4 border-b border-default-200 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-extrabold text-default-950 truncate">
                {modalTitle}
              </h2>
              <p className="text-sm text-default-600 mt-1">
                Completá los datos. Lo requerido está marcado con{" "}
                <span className="text-red-600">*</span>.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="
                shrink-0 rounded-full p-2
                hover:bg-default-100
                text-default-700
                disabled:opacity-50 disabled:cursor-not-allowed
              "
              aria-label="Cerrar"
              title="Cerrar"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-h-0">
              {/* FORM */}
              <div className="md:col-span-2 space-y-4 min-h-0">
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-default-900 mb-1">
                    Nombre del producto <span className="text-red-600">*</span>
                  </label>
                  <input
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    onBlur={() => setTouched(true)}
                    placeholder="Ej: Casado con pollo"
                    className={`
                      w-full rounded-xl border px-4 py-3 text-sm outline-none
                      ${
                        touched && errors.productName
                          ? "border-red-300 focus:ring-2 focus:ring-red-200"
                          : "border-default-200 focus:ring-2 focus:ring-primary/20"
                      }
                    `}
                    autoFocus
                  />
                  {touched && errors.productName ? (
                    <p className="text-xs text-red-600 mt-1">{errors.productName}</p>
                  ) : (
                    <p className="text-xs text-default-500 mt-1">Corto y claro.</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-default-900 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descripción corta…"
                    className="
                      w-full rounded-xl border border-default-200 px-4 py-3 text-sm outline-none
                      focus:ring-2 focus:ring-primary/20
                      min-h-[110px] resize-none
                    "
                    maxLength={180}
                  />
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-default-500">Opcional (máx. 180 caracteres).</p>
                    <p className="text-xs text-default-400">{description.length}/180</p>
                  </div>
                </div>

                {/* Category + Price */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-default-900 mb-1">
                      Categoría <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      onBlur={() => setTouched(true)}
                      className={`
                        w-full rounded-xl border px-4 py-3 text-sm outline-none bg-white
                        ${
                          touched && errors.category
                            ? "border-red-300 focus:ring-2 focus:ring-red-200"
                            : "border-default-200 focus:ring-2 focus:ring-primary/20"
                        }
                      `}
                    >
                      <option value="">Seleccionar…</option>
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    {touched && errors.category ? (
                      <p className="text-xs text-red-600 mt-1">{errors.category}</p>
                    ) : (
                      <p className="text-xs text-default-500 mt-1">Se usa para filtrar.</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-default-900 mb-1">
                      Precio <span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <input
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        onBlur={() => setTouched(true)}
                        type="number"
                        min="0"
                        step="1"
                        placeholder="Ej: 1500"
                        className={`
                          w-full rounded-xl border pl-9 pr-4 py-3 text-sm outline-none
                          ${
                            touched && errors.price
                              ? "border-red-300 focus:ring-2 focus:ring-red-200"
                              : "border-default-200 focus:ring-2 focus:ring-primary/20"
                          }
                        `}
                      />
                    </div>
                    {touched && errors.price ? (
                      <p className="text-xs text-red-600 mt-1">{errors.price}</p>
                    ) : (
                      <p className="text-xs text-default-500 mt-1">
                        {Number.isFinite(parsedPrice)
                          ? `Se mostrará: ₡${new Intl.NumberFormat("es-CR").format(parsedPrice)}`
                          : "Ingresá el monto en colones."}
                      </p>
                    )}
                  </div>
                </div>

                {/* ClosingDate + AvailableDays */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-default-900 mb-1">
                      Fecha de cierre <span className="text-red-600">*</span>
                    </label>
                    <input
                      value={closingDate}
                      onChange={(e) => setClosingDate(e.target.value)}
                      onBlur={() => setTouched(true)}
                      type="datetime-local"
                      className={`
                        w-full rounded-xl border px-4 py-3 text-sm outline-none
                        ${
                          touched && errors.closingDate
                            ? "border-red-300 focus:ring-2 focus:ring-red-200"
                            : "border-default-200 focus:ring-2 focus:ring-primary/20"
                        }
                      `}
                      required
                    />
                    {touched && errors.closingDate ? (
                      <p className="text-xs text-red-600 mt-1">{errors.closingDate}</p>
                    ) : (
                      <p className="text-xs text-default-500 mt-1">Hora de Costa Rica (UTC-6).</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-default-900 mb-1">
                      Días disponibles
                    </label>
                    <select
                      value={availableForDays}
                      onChange={(e) => setAvailableForDays(e.target.value)}
                      className="
                        w-full rounded-xl border border-default-200 px-4 py-3 text-sm outline-none bg-white
                        focus:ring-2 focus:ring-primary/20
                      "
                    >
                      <option value="">—</option>
                      {DAYS_OPTIONS.map((d) => (
                        <option key={d.value} value={d.value}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-default-500 mt-1">Opcional.</p>
                  </div>
                </div>

                {/* Photo */}
                <div>
                  <label className="block text-sm font-semibold text-default-900 mb-1">
                    Link foto del producto
                  </label>
                  <input
                    value={photo}
                    onChange={(e) => setPhoto(e.target.value)}
                    onBlur={() => setTouched(true)}
                    placeholder="https://..."
                    className={`
                      w-full rounded-xl border px-4 py-3 text-sm outline-none
                      ${
                        touched && errors.photo
                          ? "border-red-300 focus:ring-2 focus:ring-red-200"
                          : "border-default-200 focus:ring-2 focus:ring-primary/20"
                      }
                    `}
                  />
                  {touched && errors.photo ? (
                    <p className="text-xs text-red-600 mt-1">{errors.photo}</p>
                  ) : (
                    <p className="text-xs text-default-500 mt-1">
                      Opcional. Si pegás un link, se previsualiza.
                    </p>
                  )}
                </div>

                {/*  MOBILE: preview compacto dentro del form */}
                <div className="md:hidden">
                  <PreviewCard
                    photo={photo}
                    productName={productName}
                    description={description}
                    category={category}
                    parsedPrice={parsedPrice}
                  />
                </div>
              </div>

              {/* DESKTOP: preview a la derecha (solo md+) */}
              <div className="hidden md:block md:col-span-1">
                <PreviewCard
                  photo={photo}
                  productName={productName}
                  description={description}
                  category={category}
                  parsedPrice={parsedPrice}
                />

                <div className="mt-4 border border-default-200 bg-default-50 rounded-2xl p-4">
                  <p className="text-xs text-default-600">
                    Tip: Usá nombres cortos y una descripción breve. Esto hace el catálogo más
                    rápido de escanear.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div
            className="
              shrink-0 px-5 sm:px-6 py-4 border-t border-default-200 bg-white
              flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-end
            "
            style={{
              paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="
                w-full sm:w-auto
                px-5 py-2.5 rounded-full font-bold text-sm
                border border-default-200
                text-default-800
                hover:bg-default-100
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSave}
              className={`
                w-full sm:w-auto
                px-6 py-2.5 rounded-full font-extrabold text-sm
                transition active:scale-[0.99]
                ${
                  canSave
                    ? "bg-black text-white hover:bg-gray-900"
                    : "bg-default-200 text-default-500 cursor-not-allowed"
                }
              `}
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

AddLunchModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  name: PropTypes.string,
  initialValues: PropTypes.shape({
    name: PropTypes.string,
    closingDate: PropTypes.string,
    category: PropTypes.string,
    price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    description: PropTypes.string,
    photo: PropTypes.string,
    availableForDays: PropTypes.string,
  }),
  onSubmit: PropTypes.func.isRequired,
};

AddLunchModal.defaultProps = {
  title: "",
  name: "",
  initialValues: {
    name: "",
    closingDate: "",
    category: "",
    price: "",
    description: "",
    photo: "",
    availableForDays: "",
  },
};

export default AddLunchModal;
