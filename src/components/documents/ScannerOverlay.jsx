/* eslint-disable react/prop-types */

import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";

const CORNER_SIZE = 24; // px

function Corner({ position }) {
  const base = "absolute w-6 h-6 border-white";
  const styles = {
    "top-left": `${base} border-t-2 border-l-2 top-0 left-0 rounded-tl-md`,
    "top-right": `${base} border-t-2 border-r-2 top-0 right-0 rounded-tr-md`,
    "bottom-left": `${base} border-b-2 border-l-2 bottom-0 left-0 rounded-bl-md`,
    "bottom-right": `${base} border-b-2 border-r-2 bottom-0 right-0 rounded-br-md`,
  };
  return <div className={styles[position]} />;
}

function ScannerOverlay({ scanArea, quality, documentType }) {
  const overlayRef = useRef(null);

  // Update CSS variables for clip-path cutout
  useEffect(() => {
    const el = overlayRef.current;
    if (!el || !scanArea) return;
    el.style.setProperty("--scan-x", `${scanArea.x}px`);
    el.style.setProperty("--scan-y", `${scanArea.y}px`);
    el.style.setProperty("--scan-w", `${scanArea.width}px`);
    el.style.setProperty("--scan-h", `${scanArea.height}px`);
  }, [scanArea]);

  if (!scanArea) return null;

  const { x, y, width, height } = scanArea;
  const borderColor = quality.captureReady
    ? "#22c55e"
    : quality.allGood
    ? "#facc15"
    : "rgba(255,255,255,0.8)";

  return (
    <>
      {/* Dark mask around scan area using 4 divs */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top */}
        <div className="absolute top-0 left-0 right-0 bg-black/55" style={{ height: y }} />
        {/* Bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/55" style={{ top: y + height }} />
        {/* Left */}
        <div className="absolute bg-black/55" style={{ top: y, left: 0, width: x, height }} />
        {/* Right */}
        <div
          className="absolute bg-black/55"
          style={{ top: y, left: x + width, right: 0, height }}
        />
      </div>

      {/* Document frame */}
      <div
        className="absolute pointer-events-none transition-all duration-300"
        style={{
          left: x,
          top: y,
          width,
          height,
          border: `2px solid ${borderColor}`,
          borderRadius: 8,
          boxShadow: quality.captureReady ? `0 0 0 2px ${borderColor}40` : "none",
        }}
      >
        <Corner position="top-left" />
        <Corner position="top-right" />
        <Corner position="bottom-left" />
        <Corner position="bottom-right" />

        {/* Scan animation line when ready */}
        {quality.captureReady && (
          <div className="absolute left-0 right-0 h-0.5 bg-green-400/70 animate-scan" />
        )}
      </div>

      {/* Instruction text */}
      <div
        className="absolute left-0 right-0 flex justify-center pointer-events-none"
        style={{ top: y + height + 16 }}
      >
        <p className="text-white text-sm text-center px-4 drop-shadow">{quality.hint}</p>
      </div>

      <style>{`
        @keyframes scan {
          0%   { top: 0; }
          50%  { top: calc(100% - 2px); }
          100% { top: 0; }
        }
        .animate-scan { animation: scan 2s linear infinite; }
      `}</style>
    </>
  );
}

ScannerOverlay.propTypes = {
  scanArea: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number,
    width: PropTypes.number,
    height: PropTypes.number,
  }).isRequired,
  quality: PropTypes.object.isRequired,
  documentType: PropTypes.string,
};

export default ScannerOverlay;
