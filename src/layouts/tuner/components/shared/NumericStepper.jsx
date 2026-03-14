/* eslint-disable react/prop-types */

/**
 * NumericStepper
 * ─────────────────────────────────────────────────────────
 * Mejoras UX/UI:
 * - `displaySize` controla el tamaño del número (default "xl" para uso compacto,
 *    puede recibir "hero" para el BPM principal)
 * - Botones con tamaño mínimo táctil garantizado (44×44px)
 * - Input sin spinners nativos (más limpio)
 * - Soporte long-press: mantener pulsado incrementa continuamente
 * - Unit label opcional debajo del número
 * ─────────────────────────────────────────────────────────
 */
import { useState, useEffect, useRef, useCallback } from "react";
 
export function NumericStepper({
  valor,
  onChange,
  min     = 20,
  max     = 300,
  paso    = 1,
  unit,
  displaySize = "hero", // "hero" | "xl" | "lg"
  className   = "",
}) {
  const [inputVal, setInputVal] = useState(String(valor));
  const longPressRef = useRef(null);
 
  useEffect(() => { setInputVal(String(valor)); }, [valor]);
 
  const confirmar = useCallback(() => {
    const v = Math.max(min, Math.min(max, Number(inputVal) || min));
    onChange(v);
    setInputVal(String(v));
  }, [inputVal, min, max, onChange]);
 
  // Long-press para incremento/decremento continuo
  const startLongPress = useCallback((direction) => {
    onChange(v => {
      const next = Math.max(min, Math.min(max, v + direction * paso));
      return next;
    });
    let speed = 350;
    const tick = () => {
      onChange(v => Math.max(min, Math.min(max, v + direction * paso)));
      speed = Math.max(60, speed * 0.85);
      longPressRef.current = setTimeout(tick, speed);
    };
    longPressRef.current = setTimeout(tick, speed);
  }, [min, max, paso, onChange]);
 
  const stopLongPress = useCallback(() => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  }, []);
 
  const sizeMap = {
    hero: "text-[72px] sm:text-[88px]",
    xl:   "text-5xl",
    lg:   "text-3xl",
  };
 
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        onMouseDown={() => startLongPress(-1)}
        onMouseUp={stopLongPress}
        onMouseLeave={stopLongPress}
        onTouchStart={() => startLongPress(-1)}
        onTouchEnd={stopLongPress}
        onClick={() => onChange(Math.max(min, valor - paso))}
        className="w-11 h-11 rounded-xl border border-gray-200 bg-white text-gray-600
          text-xl hover:bg-gray-50 hover:border-gray-300 active:scale-95
          transition-all duration-100 flex items-center justify-center
          select-none font-light flex-shrink-0"
        aria-label="Disminuir"
      >
        −
      </button>
 
      <div className="flex-1 flex flex-col items-center">
        <input
          type="number"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onBlur={confirmar}
          onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
          className={`
            w-full text-center font-black bg-transparent text-gray-900
            outline-none leading-none tabular-nums
            [appearance:textfield]
            [&::-webkit-outer-spin-button]:appearance-none
            [&::-webkit-inner-spin-button]:appearance-none
            ${sizeMap[displaySize] || sizeMap.hero}
          `}
          style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
          aria-label="Valor"
        />
        {unit && (
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 leading-none">
            {unit}
          </span>
        )}
      </div>
 
      <button
        onMouseDown={() => startLongPress(1)}
        onMouseUp={stopLongPress}
        onMouseLeave={stopLongPress}
        onTouchStart={() => startLongPress(1)}
        onTouchEnd={stopLongPress}
        onClick={() => onChange(Math.min(max, valor + paso))}
        className="w-11 h-11 rounded-xl border border-gray-200 bg-white text-gray-600
          text-xl hover:bg-gray-50 hover:border-gray-300 active:scale-95
          transition-all duration-100 flex items-center justify-center
          select-none font-light flex-shrink-0"
        aria-label="Aumentar"
      >
        +
      </button>
    </div>
  );
}