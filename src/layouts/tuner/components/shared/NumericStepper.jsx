/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";

export function NumericStepper({ valor, onChange, min = 20, max = 300, paso = 1, className = "" }) {
  const [inputVal, setInputVal] = useState(String(valor));

  useEffect(() => { setInputVal(String(valor)); }, [valor]);

  const confirmar = () => {
    const v = Math.max(min, Math.min(max, Number(inputVal) || min));
    onChange(v);
    setInputVal(String(v));
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={() => onChange(Math.max(min, valor - paso))}
        className="w-10 h-10 rounded-xl border border-gray-200 text-gray-700 text-lg hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center select-none font-light"
        aria-label="Disminuir"
      >
        −
      </button>
      <input
        type="number"
        value={inputVal}
        onChange={(e) => setInputVal(e.target.value)}
        onBlur={confirmar}
        onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
        className="w-full text-center text-5xl font-black bg-transparent text-gray-900 outline-none leading-none tabular-nums"
        style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
        aria-label="Valor"
      />
      <button
        onClick={() => onChange(Math.min(max, valor + paso))}
        className="w-10 h-10 rounded-xl border border-gray-200 text-gray-700 text-lg hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center select-none font-light"
        aria-label="Aumentar"
      >
        +
      </button>
    </div>
  );
}