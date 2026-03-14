/* eslint-disable react/prop-types */

/**
 * MedidorAfinacion
 * ─────────────────────────────────────────────────────────
 * Mejoras UX/UI:
 * - viewBox ajustado para que las etiquetas laterales no se corten
 * - Zona "afinado" central más clara con relleno sutil
 * - Transición de aguja más suave (0.06s)
 * - Línea central más prominente para referencia inmediata
 * - Hub central con sombra sutil que da profundidad
 * - Arcos con opacidad diferenciada (más intensa en extremos)
 * - Etiqueta de cents integrada dentro del SVG para cohesión visual
 * ─────────────────────────────────────────────────────────
 */
export function MedidorAfinacion({ cents, activo }) {
  const limitado = Math.max(-50, Math.min(50, cents));
  const angulo   = (limitado / 50) * 65;
  const rad      = (angulo * Math.PI) / 180;

  const cx = 150, cy = 135, r = 105;
  const nx = cx + r * Math.sin(rad);
  const ny = cy - r * Math.cos(rad);

  const abs        = Math.abs(cents);
  const afinado    = activo && abs < 7;
  const ligeramente = activo && abs < 20;

  const colorAguja = !activo    ? "#d1d5db"
    : afinado                   ? "#16a34a"
    : ligeramente               ? "#d97706"
    :                             "#dc2626";

  // Arcos del semicírculo — del extremo al centro
  const arcos = [
    { d: "M 34 135 A 116 116 0 0 1 75 44",   color: "#fca5a5", opacity: 0.9 }, // rojo externo
    { d: "M 75 44 A 116 116 0 0 1 113 23",   color: "#fde68a", opacity: 0.85 }, // ámbar
    { d: "M 113 23 A 116 116 0 0 1 187 23",  color: "#bbf7d0", opacity: 0.9 }, // verde
    { d: "M 187 23 A 116 116 0 0 1 225 44",  color: "#fde68a", opacity: 0.85 }, // ámbar
    { d: "M 225 44 A 116 116 0 0 1 266 135", color: "#fca5a5", opacity: 0.9 }, // rojo externo
  ];

  const marcas = [-50, -25, 0, 25, 50];

  // Punto de inicio del arco de zona afinada (±7 cents ≈ ±9.1° desde centro)
  const zonaRad1 = ((-7 / 50) * 65 * Math.PI) / 180;
  const zonaRad2 = ((7  / 50) * 65 * Math.PI) / 180;
  const zx1 = cx + (r + 8) * Math.sin(zonaRad1);
  const zy1 = cy - (r + 8) * Math.cos(zonaRad1);
  const zx2 = cx + (r + 8) * Math.sin(zonaRad2);
  const zy2 = cy - (r + 8) * Math.cos(zonaRad2);

  return (
    <div className="flex flex-col items-center select-none w-full" aria-hidden="true">
      <svg viewBox="0 0 300 158" className="w-full max-w-xs" style={{ height: "auto", maxHeight: 148 }}>
        {/* Arcos de color */}
        {arcos.map(({ d, color, opacity }, i) => (
          <path
            key={i} d={d} fill="none"
            stroke={color} strokeWidth="13"
            strokeLinecap="round"
            opacity={opacity}
          />
        ))}

        {/* Indicador zona afinada — arco verde sutil */}
        <path
          d={`M ${zx1} ${zy1} A ${r + 8} ${r + 8} 0 0 1 ${zx2} ${zy2}`}
          fill="none"
          stroke="#16a34a"
          strokeWidth="3"
          strokeLinecap="round"
          opacity={activo && afinado ? 0.6 : 0.15}
          style={{ transition: "opacity 0.3s" }}
        />

        {/* Marcas de tick */}
        {marcas.map((v) => {
          const a   = ((v / 50) * 65 * Math.PI) / 180;
          const len = v === 0 ? 16 : 10;
          const x1  = cx + (r - len) * Math.sin(a);
          const y1  = cy - (r - len) * Math.cos(a);
          const x2  = cx + (r + 3) * Math.sin(a);
          const y2  = cy - (r + 3) * Math.cos(a);
          return (
            <line
              key={v}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={v === 0 ? "#15803d" : "#9ca3af"}
              strokeWidth={v === 0 ? 2.5 : 1.5}
              strokeLinecap="round"
            />
          );
        })}

        {/* Etiquetas −50 / 0 / +50 */}
        <text x="24"  y="148" fill="#9ca3af" fontSize="9" textAnchor="middle" fontFamily="'SF Mono', 'Fira Code', monospace">−50</text>
        <text x="276" y="148" fill="#9ca3af" fontSize="9" textAnchor="middle" fontFamily="'SF Mono', 'Fira Code', monospace">+50</text>
        <text x="150" y="14"  fill="#15803d" fontSize="9" textAnchor="middle" fontFamily="'SF Mono', 'Fira Code', monospace" fontWeight="700">0</text>

        {/* Aguja */}
        <line
          x1={cx} y1={cy}
          x2={nx} y2={ny}
          stroke={colorAguja}
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{ transition: "all 0.06s ease-out, stroke 0.15s ease" }}
        />

        {/* Hub — círculo exterior */}
        <circle cx={cx} cy={cy} r="8"
          fill="white"
          stroke={activo ? "#e5e7eb" : "#f3f4f6"}
          strokeWidth="1.5"
        />
        {/* Hub — punto interior */}
        <circle cx={cx} cy={cy} r="3.5"
          fill={activo ? "#1f2937" : "#d1d5db"}
          style={{ transition: "fill 0.2s" }}
        />
      </svg>
    </div>
  );
}