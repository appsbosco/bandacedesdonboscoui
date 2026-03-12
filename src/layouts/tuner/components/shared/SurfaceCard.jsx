/* eslint-disable react/prop-types */
export function SurfaceCard({ children, className = "", padding = true }) {
  return (
    <div
      className={`bg-white rounded-2xl border border-gray-100 ${
        padding ? "p-4" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}