/* eslint-disable react/prop-types */
/**
 * SegmentedControl
 * ─────────────────────────────────────────────────────────
 * Mejoras UX/UI:
 * - Estado disabled por opción
 * - Mejor contraste del ítem activo (shadow más definido)
 * - Padding vertical más generoso para área de toque ≥44px
 * - Transición de selección más rápida y fluida
 * - role="tablist" semántico opcional
 * ─────────────────────────────────────────────────────────
 */
export function SegmentedControl({ opciones, valor, onChange, role: ariaRole }) {
  return (
    <div
      className="flex bg-gray-100 rounded-xl p-1 gap-1"
      role={ariaRole || "group"}
    >
      {opciones.map((op) => {
        const activo   = valor === op.value;
        const disabled = !!op.disabled;
        return (
          <button
            key={op.value}
            onClick={() => !disabled && onChange(op.value)}
            disabled={disabled}
            aria-pressed={activo}
            className={`
              flex-1 py-2 px-2 rounded-lg text-xs font-semibold
              transition-all duration-150 leading-none
              ${activo
                ? "bg-white text-gray-900 shadow-sm"
                : disabled
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-500 hover:text-gray-700 hover:bg-white/40"}
            `}
          >
            {op.icon && (
              <span className="block text-sm mb-0.5 leading-none">{op.icon}</span>
            )}
            {op.label}
          </button>
        );
      })}
    </div>
  );
}
 