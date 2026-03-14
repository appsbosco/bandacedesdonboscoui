/* eslint-disable react/prop-types */
 
/**
 * ToggleSwitch
 * ─────────────────────────────────────────────────────────
 * Mejoras UX/UI:
 * - El label es el elemento clicable completo (mejor área táctil)
 * - role="switch" + aria-checked en el input hidden para A11y real
 * - Tamaño ligeramente mayor (w-11 h-6) → más fácil de pulsar en móvil
 * - Transición de thumb más suave con easing
 * - Estado hover con outline sutil en focus
 * ─────────────────────────────────────────────────────────
 */
export function ToggleSwitch({ activo, onChange, label }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none group">
      {/* Input oculto para accesibilidad real */}
      <input
        type="checkbox"
        role="switch"
        checked={activo}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
        aria-checked={activo}
      />
      {/* Track */}
      <div
        aria-hidden="true"
        className={`relative w-11 h-6 rounded-full transition-colors duration-200
          group-focus-within:ring-2 group-focus-within:ring-offset-1 group-focus-within:ring-gray-400
          ${activo ? "bg-gray-900" : "bg-gray-200"}`}
      >
        {/* Thumb */}
        <div
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm
            transition-transform duration-200 ease-in-out
            ${activo ? "translate-x-5" : "translate-x-0"}`}
        />
      </div>
      {label && (
        <span className="text-xs font-semibold text-gray-700 leading-none">{label}</span>
      )}
    </label>
  );
}
 