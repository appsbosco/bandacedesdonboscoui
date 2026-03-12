/* eslint-disable react/prop-types */
/**
 * ImageCropModal
 *
 * Shows a full-screen crop overlay. The user drags the image and scrolls / pinches
 * to zoom until the framing looks right, then confirms.
 *
 * Props
 *   src        — blob URL of the image to crop
 *   aspect     — width/height ratio of the output (default 1 → square)
 *   outputSize — { w, h } pixel dimensions of the exported canvas (default 800×800)
 *   onConfirm  — called with a File (JPEG) when the user saves
 *   onCancel   — called when the user dismisses
 */

import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_OUTPUT = { w: 800, h: 800 };

export default function ImageCropModal({
  src,
  aspect = 1,
  outputSize = DEFAULT_OUTPUT,
  onConfirm,
  onCancel,
}) {
  // ── Refs ──────────────────────────────────────────────────────────────────
  const containerRef = useRef(null);
  const canvasRef = useRef(null); // live preview canvas
  const imgRef = useRef(null); // loaded HTMLImageElement
  const rafRef = useRef(null);

  // ── State ─────────────────────────────────────────────────────────────────
  // transform = { x, y, scale }
  //   x, y  : offset of the image top-left corner relative to the viewport centre
  //   scale : display zoom (1 = image fills the crop frame on its shorter axis)
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [ready, setReady] = useState(false);
  const [exporting, setExporting] = useState(false);

  // ── Load image ────────────────────────────────────────────────────────────
  useEffect(() => {
    const img = new Image();

    const initScale = () => {
      const container = containerRef.current;
      if (!container || !img.naturalWidth) return false;
      const frameW = container.clientWidth;
      if (frameW === 0) return false;
      const frameH = frameW / aspect;
      const scaleX = frameW / img.naturalWidth;
      const scaleY = frameH / img.naturalHeight;
      const scale = Math.max(scaleX, scaleY);
      setTransform({ x: 0, y: 0, scale });
      setReady(true);
      return true;
    };

    img.onload = () => {
      imgRef.current = img;
      // Try immediately; if container has no width yet, wait for ResizeObserver
      if (!initScale()) {
        const ro = new ResizeObserver(() => {
          if (initScale()) ro.disconnect();
        });
        if (containerRef.current) ro.observe(containerRef.current);
      }
    };

    img.src = src;
  }, [src, aspect]);

  // ── Draw preview ──────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    const container = containerRef.current;
    if (!canvas || !img || !container) return;

    const frameW = container.clientWidth;
    const frameH = frameW / aspect;
    canvas.width = frameW;
    canvas.height = frameH;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, frameW, frameH);

    const { x, y, scale } = transform;
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    // x,y are offsets from the frame centre
    const left = frameW / 2 + x - drawW / 2;
    const top = frameH / 2 + y - drawH / 2;

    ctx.drawImage(img, left, top, drawW, drawH);
  }, [transform, aspect]);

  useEffect(() => {
    if (!ready) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [ready, draw]);

  // ── Clamp helper ──────────────────────────────────────────────────────────
  const clamp = useCallback(
    (x, y, scale) => {
      const container = containerRef.current;
      const img = imgRef.current;
      if (!container || !img) return { x, y, scale };

      const frameW = container.clientWidth;
      const frameH = frameW / aspect;
      const drawW = img.naturalWidth * scale;
      const drawH = img.naturalHeight * scale;

      // The image must cover the frame entirely (no black bars)
      const minScale = Math.max(frameW / img.naturalWidth, frameH / img.naturalHeight);
      const clampedScale = Math.max(minScale, Math.min(scale, minScale * 6));

      const cDrawW = img.naturalWidth * clampedScale;
      const cDrawH = img.naturalHeight * clampedScale;

      // left = frameW/2 + x - cDrawW/2  must be ≤ 0
      // left + cDrawW ≥ frameW  →  frameW/2 + x + cDrawW/2 ≥ frameW
      const maxX = (cDrawW - frameW) / 2;
      const maxY = (cDrawH - frameH) / 2;
      const clampedX = Math.max(-maxX, Math.min(maxX, x));
      const clampedY = Math.max(-maxY, Math.min(maxY, y));

      return { x: clampedX, y: clampedY, scale: clampedScale };
    },
    [aspect]
  );

  // ── Pointer drag ──────────────────────────────────────────────────────────
  const dragState = useRef(null);

  const onPointerDown = (e) => {
    if (e.pointerType === "touch") return; // handled by touch events
    e.currentTarget.setPointerCapture(e.pointerId);
    dragState.current = { startX: e.clientX, startY: e.clientY, ...transform };
  };

  const onPointerMove = (e) => {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    setTransform((t) => clamp(dragState.current.x + dx, dragState.current.y + dy, t.scale));
  };

  const onPointerUp = () => {
    dragState.current = null;
  };

  // ── Scroll to zoom ────────────────────────────────────────────────────────
  const onWheel = (e) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    setTransform((t) => clamp(t.x, t.y, t.scale * (1 + delta)));
  };

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  });

  // ── Touch pinch-zoom ──────────────────────────────────────────────────────
  const touchState = useRef(null);

  const onTouchStart = (e) => {
    if (e.touches.length === 1) {
      touchState.current = {
        mode: "drag",
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        ...transform,
      };
    } else if (e.touches.length === 2) {
      const dx = e.touches[1].clientX - e.touches[0].clientX;
      const dy = e.touches[1].clientY - e.touches[0].clientY;
      touchState.current = {
        mode: "pinch",
        startDist: Math.hypot(dx, dy),
        startScale: transform.scale,
        startX: transform.x,
        startY: transform.y,
      };
    }
  };

  const onTouchMove = (e) => {
    e.preventDefault();
    if (!touchState.current) return;
    if (touchState.current.mode === "drag" && e.touches.length === 1) {
      const dx = e.touches[0].clientX - touchState.current.startX;
      const dy = e.touches[0].clientY - touchState.current.startY;
      setTransform((t) => clamp(touchState.current.x + dx, touchState.current.y + dy, t.scale));
    } else if (touchState.current.mode === "pinch" && e.touches.length === 2) {
      const dx = e.touches[1].clientX - e.touches[0].clientX;
      const dy = e.touches[1].clientY - e.touches[0].clientY;
      const dist = Math.hypot(dx, dy);
      const newScale = touchState.current.startScale * (dist / touchState.current.startDist);
      setTransform((t) => clamp(touchState.current.startX, touchState.current.startY, newScale));
    }
  };

  const onTouchEnd = () => {
    touchState.current = null;
  };

  // ── Export ────────────────────────────────────────────────────────────────
  const handleConfirm = useCallback(async () => {
    const img = imgRef.current;
    const container = containerRef.current;
    if (!img || !container) return;
    setExporting(true);

    const frameW = container.clientWidth;
    const frameH = frameW / aspect;
    const { x, y, scale } = transform;

    // Ratio from display canvas to output canvas
    const ratioW = outputSize.w / frameW;
    const ratioH = outputSize.h / frameH;

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = outputSize.w;
    exportCanvas.height = outputSize.h;
    const ctx = exportCanvas.getContext("2d");

    const drawW = img.naturalWidth * scale * ratioW;
    const drawH = img.naturalHeight * scale * ratioH;
    const left = outputSize.w / 2 + x * ratioW - drawW / 2;
    const top = outputSize.h / 2 + y * ratioH - drawH / 2;

    ctx.drawImage(img, left, top, drawW, drawH);

    exportCanvas.toBlob(
      (blob) => {
        setExporting(false);
        if (!blob) return;
        const file = new File([blob], "profile.jpg", {
          type: "image/jpeg",
          lastModified: Date.now(),
        });
        onConfirm(file);
      },
      "image/jpeg",
      0.92
    );
  }, [transform, aspect, outputSize, onConfirm]);

  // ── Lock body scroll while modal is open ─────────────────────────────────
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // ── UI ────────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(6px)", zIndex: 99999 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 px-4 w-full max-w-sm">
        <button
          onClick={onCancel}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
        >
          ✕
        </button>
        <div>
          <p className="text-white text-sm font-semibold leading-tight">Ajustar encuadre</p>
          <p className="text-white/50 text-[10px]">
            Arrastrá para reencuadrar · Scroll/pellizco para zoom
          </p>
        </div>
      </div>

      {/* Crop frame */}
      <div
        ref={containerRef}
        className="relative w-full max-w-sm overflow-hidden select-none"
        style={{
          borderRadius: "50%",
          aspectRatio: `${aspect}`,
          boxShadow: "0 0 0 9999px rgba(0,0,0,0.75)",
        }}
      >
        {/* Guide ring */}
        <div
          className="absolute inset-0 z-10 pointer-events-none rounded-full"
          style={{ boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.55)" }}
        />

        <canvas
          ref={canvasRef}
          className="block w-full h-full touch-none"
          style={{ cursor: "grab", aspectRatio: `${aspect}` }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        />

        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Zoom slider */}
      {ready && (
        <div className="mt-5 flex items-center gap-3 w-full max-w-sm px-4">
          <svg
            className="w-4 h-4 text-white/50 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
            />
          </svg>
          <input
            type="range"
            min={0}
            max={100}
            value={(() => {
              const container = containerRef.current;
              const img = imgRef.current;
              if (!container || !img) return 0;
              const frameW = container.clientWidth;
              const frameH = frameW / aspect;
              const minScale = Math.max(frameW / img.naturalWidth, frameH / img.naturalHeight);
              const maxScale = minScale * 6;
              return Math.round(((transform.scale - minScale) / (maxScale - minScale)) * 100);
            })()}
            onChange={(e) => {
              const container = containerRef.current;
              const img = imgRef.current;
              if (!container || !img) return;
              const frameW = container.clientWidth;
              const frameH = frameW / aspect;
              const minScale = Math.max(frameW / img.naturalWidth, frameH / img.naturalHeight);
              const maxScale = minScale * 6;
              const newScale = minScale + (e.target.value / 100) * (maxScale - minScale);
              setTransform((t) => clamp(t.x, t.y, newScale));
            }}
            className="flex-1 accent-white h-1 cursor-pointer"
          />
          <svg
            className="w-5 h-5 text-white/50 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      )}

      {/* Actions */}
      <div className="mt-5 flex gap-3 w-full max-w-sm px-4">
        <button
          onClick={onCancel}
          className="flex-1 py-3 rounded-2xl border border-white/20 text-white text-sm font-medium hover:bg-white/10 transition-all active:scale-95"
        >
          Cancelar
        </button>
        <button
          onClick={handleConfirm}
          disabled={!ready || exporting}
          className="flex-1 py-3 rounded-2xl bg-white text-slate-900 text-sm font-bold hover:bg-slate-100 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {exporting ? (
            <span className="w-4 h-4 border-2 border-slate-400 border-t-slate-900 rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Usar foto
            </>
          )}
        </button>
      </div>
    </div>
  );
}
