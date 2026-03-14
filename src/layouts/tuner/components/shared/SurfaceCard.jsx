/* eslint-disable react/prop-types */
/**
 * SurfaceCard
 * ─────────────────────────────────────────────────────────
 * Mejoras UX/UI:
 * - Borde más visible (border-gray-200 en lugar de border-gray-100)
 * - Variante `elevated` para cards con mayor jerarquía (shadow-sm)
 * - Padding configurable por tamaño (sm / md / lg)
 * - Soporte para estado `interactive` (hover/cursor)
 * ─────────────────────────────────────────────────────────
 */
export function SurfaceCard({
  children,
  className = "",
  padding = "md",
  elevated = false,
  interactive = false,
}) {
  const paddingMap = {
    none: "",
    sm:   "p-3",
    md:   "p-4",
    lg:   "p-5 sm:p-6",
  };
 
  return (
    <div
      className={`
        bg-white rounded-2xl border border-gray-200
        ${elevated   ? "shadow-sm"                           : ""}
        ${interactive ? "cursor-pointer hover:border-gray-300 transition-colors duration-150" : ""}
        ${typeof padding === "string" && padding in paddingMap ? paddingMap[padding] : paddingMap.md}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
 
 