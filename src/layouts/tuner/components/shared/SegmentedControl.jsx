/* eslint-disable react/prop-types */
export function SegmentedControl({ opciones, valor, onChange }) {
  return (
    <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
      {opciones.map((op) => (
        <button
          key={op.value}
          onClick={() => onChange(op.value)}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            valor === op.value
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {op.label}
        </button>
      ))}
    </div>
  );
}