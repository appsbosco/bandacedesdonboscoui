/* eslint-disable react/prop-types */
export function ToggleSwitch({ activo, onChange, label }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <div
        onClick={() => onChange(!activo)}
        role="switch"
        aria-checked={activo}
        className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer focus-within:ring-2 ring-gray-300 ${
          activo ? "bg-gray-900" : "bg-gray-200"
        }`}
      >
        <div
          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-150 ${
            activo ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </div>
      {label && <span className="text-xs font-semibold text-gray-700">{label}</span>}
    </label>
  );
}