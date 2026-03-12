/* eslint-disable react/prop-types */

export function MedidorAfinacion({ cents, activo }) {
  const limitado = Math.max(-50, Math.min(50, cents));
  const angulo = (limitado / 50) * 65;
  const rad = (angulo * Math.PI) / 180;
  const cx = 150, cy = 130, r = 100;
  const nx = cx + r * Math.sin(rad);
  const ny = cy - r * Math.cos(rad);
  const abs = Math.abs(cents);
  const afinado = activo && abs < 7;
  const ligeramente = activo && abs < 20;
  const colorAguja = !activo ? "#d1d5db"
    : afinado ? "#16a34a"
    : ligeramente ? "#d97706"
    : "#dc2626";

  const arcos = [
    { d: "M 38 130 A 112 112 0 0 1 78 42",  color: "#fecaca" },
    { d: "M 78 42 A 112 112 0 0 1 116 22",  color: "#fde68a" },
    { d: "M 116 22 A 112 112 0 0 1 184 22", color: "#bbf7d0" },
    { d: "M 184 22 A 112 112 0 0 1 222 42", color: "#fde68a" },
    { d: "M 222 42 A 112 112 0 0 1 262 130", color: "#fecaca" },
  ];

  const marcas = [-50, -25, 0, 25, 50];

  return (
    <div className="flex flex-col items-center select-none w-full">
      <svg viewBox="0 0 300 145" className="w-full max-w-xs h-36" aria-hidden="true">
        {arcos.map(({ d, color }, i) => (
          <path key={i} d={d} fill="none" stroke={color} strokeWidth="12"
            strokeLinecap="round" opacity="0.75" />
        ))}
        {marcas.map((v) => {
          const a = ((v / 50) * 65 * Math.PI) / 180;
          const x1 = cx + (r - 14) * Math.sin(a), y1 = cy - (r - 14) * Math.cos(a);
          const x2 = cx + (r + 2) * Math.sin(a),  y2 = cy - (r + 2) * Math.cos(a);
          return (
            <line key={v} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={v === 0 ? "#16a34a" : "#9ca3af"}
              strokeWidth={v === 0 ? 2.5 : 1.5} strokeLinecap="round" />
          );
        })}
        <text x="28"  y="142" fill="#9ca3af" fontSize="10" textAnchor="middle" fontFamily="system-ui">−50</text>
        <text x="272" y="142" fill="#9ca3af" fontSize="10" textAnchor="middle" fontFamily="system-ui">+50</text>
        <text x="150" y="14"  fill="#16a34a" fontSize="10" textAnchor="middle" fontFamily="system-ui" fontWeight="600">0</text>

        <line x1={cx} y1={cy} x2={nx} y2={ny}
          stroke={colorAguja} strokeWidth="2.5" strokeLinecap="round"
          style={{ transition: "all 0.08s ease-out" }} />
        <circle cx={cx} cy={cy} r="6" fill={activo ? "#1f2937" : "#e5e7eb"} style={{ transition: "fill 0.2s" }} />
        <circle cx={cx} cy={cy} r="2.5" fill="white" />
      </svg>
    </div>
  );
}