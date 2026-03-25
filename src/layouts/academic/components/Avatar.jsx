/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";

const SIZE_CLASSES = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-xl",
  "2xl": "w-20 h-20 text-2xl",
};

const BG_COLORS = [
  "bg-blue-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-cyan-600",
  "bg-indigo-500",
  "bg-teal-500",
];

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function getColor(name) {
  if (!name) return BG_COLORS[0];
  const n = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  return BG_COLORS[n % BG_COLORS.length];
}

// ── Full-screen photo overlay (same pattern as UserDetailsModal) ──────────────
function ZoomOverlay({ src, name, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[1310] flex items-center justify-center p-6"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <img
        src={src}
        alt={name || "Foto"}
        className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white text-lg flex items-center justify-center transition-all"
        title="Cerrar"
      >
        ✕
      </button>
    </div>
  );
}

// ── Avatar ─────────────────────────────────────────────────────────────────────
export function Avatar({ src, name, size = "md", className = "", zoomable = false }) {
  const [imgError, setImgError] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const sz = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const hasPhoto = src && !imgError;
  const canZoom = zoomable && hasPhoto;

  return (
    <>
      {hasPhoto ? (
        <img
          src={src}
          alt={name || "Avatar"}
          className={`${sz} rounded-full object-cover ring-2 ring-white shrink-0 ${canZoom ? "cursor-zoom-in hover:opacity-90 transition-opacity" : ""} ${className}`}
          onError={() => setImgError(true)}
          onClick={canZoom ? () => setZoomed(true) : undefined}
        />
      ) : (
        <div
          className={`${sz} ${getColor(name)} rounded-full flex items-center justify-center text-white font-bold ring-2 ring-white shrink-0 select-none ${className}`}
        >
          {getInitials(name)}
        </div>
      )}

      {zoomed && <ZoomOverlay src={src} name={name} onClose={() => setZoomed(false)} />}
    </>
  );
}

export default Avatar;
