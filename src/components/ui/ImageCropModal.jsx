/* eslint-disable react/prop-types */
/**
 * ImageCropModal
 *
 * Modal fullscreen para reencuadrar una imagen:
 * - Drag con mouse o dedo
 * - Pinch zoom con dos dedos
 * - Zoom con scroll
 * - Exporta JPEG recortado
 *
 * Props:
 *   src        — blob URL de la imagen
 *   aspect     — relación width/height del recorte (default 1)
 *   outputSize — { w, h } tamaño final exportado (default 800x800)
 *   onConfirm  — callback(File)
 *   onCancel   — callback()
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
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const rafRef = useRef(null);

  const transformRef = useRef({ x: 0, y: 0, scale: 1 });
  const activePointersRef = useRef(new Map());
  const gestureRef = useRef(null);

  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [ready, setReady] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);

  const clamp = useCallback(
    (x, y, scale) => {
      const container = containerRef.current;
      const img = imgRef.current;

      if (!container || !img || !img.naturalWidth || !img.naturalHeight) {
        return { x, y, scale };
      }

      const frameW = container.clientWidth;
      if (!frameW) return { x, y, scale };

      const frameH = frameW / aspect;

      const minScale = Math.max(
        frameW / img.naturalWidth,
        frameH / img.naturalHeight
      );
      const maxScale = minScale * 6;
      const clampedScale = Math.max(minScale, Math.min(scale, maxScale));

      const drawW = img.naturalWidth * clampedScale;
      const drawH = img.naturalHeight * clampedScale;

      const maxX = Math.max(0, (drawW - frameW) / 2);
      const maxY = Math.max(0, (drawH - frameH) / 2);

      const clampedX = Math.max(-maxX, Math.min(maxX, x));
      const clampedY = Math.max(-maxY, Math.min(maxY, y));

      return {
        x: clampedX,
        y: clampedY,
        scale: clampedScale,
      };
    },
    [aspect]
  );

  useEffect(() => {
    let resizeObserver = null;
    let cancelled = false;

    setReady(false);

    const img = new Image();

    const initScale = () => {
      const container = containerRef.current;
      if (!container || !img.naturalWidth || cancelled) return false;

      const frameW = container.clientWidth;
      if (!frameW) return false;

      const frameH = frameW / aspect;
      const scaleX = frameW / img.naturalWidth;
      const scaleY = frameH / img.naturalHeight;
      const scale = Math.max(scaleX, scaleY);

      const next = { x: 0, y: 0, scale };
      transformRef.current = next;
      setTransform(next);
      setReady(true);
      return true;
    };

    img.onload = () => {
      if (cancelled) return;

      imgRef.current = img;

      if (!initScale()) {
        resizeObserver = new ResizeObserver(() => {
          if (initScale() && resizeObserver) {
            resizeObserver.disconnect();
            resizeObserver = null;
          }
        });

        if (containerRef.current) {
          resizeObserver.observe(containerRef.current);
        }
      }
    };

    img.onerror = () => {
      if (cancelled) return;
      setReady(false);
    };

    img.src = src;

    return () => {
      cancelled = true;
      if (resizeObserver) resizeObserver.disconnect();
      imgRef.current = null;
    };
  }, [src, aspect]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    const container = containerRef.current;

    if (!canvas || !img || !container || !img.naturalWidth) return;

    const frameW = container.clientWidth;
    if (!frameW) return;

    const frameH = frameW / aspect;

    canvas.width = frameW;
    canvas.height = frameH;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, frameW, frameH);

    const { x, y, scale } = transformRef.current;

    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;

    const left = frameW / 2 + x - drawW / 2;
    const top = frameH / 2 + y - drawH / 2;

    ctx.drawImage(img, left, top, drawW, drawH);
  }, [aspect]);

  useEffect(() => {
    if (!ready) return;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [ready, transform, draw]);

  const getDistance = (p1, p2) => Math.hypot(p2.x - p1.x, p2.y - p1.y);

  const getCenter = (p1, p2) => ({
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  });

  const onPointerDown = useCallback((e) => {
    const el = e.currentTarget;
    el.setPointerCapture?.(e.pointerId);

    activePointersRef.current.set(e.pointerId, {
      x: e.clientX,
      y: e.clientY,
    });

    const pointers = [...activePointersRef.current.values()];

    if (pointers.length === 1) {
      gestureRef.current = {
        mode: "drag",
        startPointer: { x: e.clientX, y: e.clientY },
        startTransform: { ...transformRef.current },
      };
    } else if (pointers.length === 2) {
      gestureRef.current = {
        mode: "pinch",
        startDistance: getDistance(pointers[0], pointers[1]),
        startCenter: getCenter(pointers[0], pointers[1]),
        startTransform: { ...transformRef.current },
      };
    }
  }, []);

  const onPointerMove = useCallback(
    (e) => {
      if (!activePointersRef.current.has(e.pointerId)) return;

      activePointersRef.current.set(e.pointerId, {
        x: e.clientX,
        y: e.clientY,
      });

      const gesture = gestureRef.current;
      const pointers = [...activePointersRef.current.values()];

      if (!gesture) return;

      if (gesture.mode === "drag" && pointers.length === 1) {
        const dx = e.clientX - gesture.startPointer.x;
        const dy = e.clientY - gesture.startPointer.y;

        setTransform(
          clamp(
            gesture.startTransform.x + dx,
            gesture.startTransform.y + dy,
            gesture.startTransform.scale
          )
        );
      }

      if (gesture.mode === "pinch" && pointers.length === 2) {
        const dist = getDistance(pointers[0], pointers[1]);
        const center = getCenter(pointers[0], pointers[1]);
        const scaleFactor = dist / Math.max(gesture.startDistance, 1);
        const newScale = gesture.startTransform.scale * scaleFactor;

        const dx = center.x - gesture.startCenter.x;
        const dy = center.y - gesture.startCenter.y;

        setTransform(
          clamp(
            gesture.startTransform.x + dx,
            gesture.startTransform.y + dy,
            newScale
          )
        );
      }
    },
    [clamp]
  );

  const resetGestureFromRemainingPointer = useCallback(() => {
    const entries = [...activePointersRef.current.entries()];

    if (entries.length === 1) {
      const [, point] = entries[0];

      gestureRef.current = {
        mode: "drag",
        startPointer: { x: point.x, y: point.y },
        startTransform: { ...transformRef.current },
      };
    } else {
      gestureRef.current = null;
    }
  }, []);

  const onPointerUp = useCallback(
    (e) => {
      activePointersRef.current.delete(e.pointerId);

      try {
        e.currentTarget.releasePointerCapture?.(e.pointerId);
      } catch {
        // ignore
      }

      resetGestureFromRemainingPointer();
    },
    [resetGestureFromRemainingPointer]
  );

  const onPointerCancel = useCallback(
    (e) => {
      activePointersRef.current.delete(e.pointerId);

      try {
        e.currentTarget.releasePointerCapture?.(e.pointerId);
      } catch {
        // ignore
      }

      resetGestureFromRemainingPointer();
    },
    [resetGestureFromRemainingPointer]
  );

  const onWheel = useCallback(
    (e) => {
      e.preventDefault();

      const delta = -e.deltaY * 0.0015;
      const nextScale = transformRef.current.scale * (1 + delta);

      setTransform((t) => clamp(t.x, t.y, nextScale));
    },
    [clamp]
  );

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    el.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      el.removeEventListener("wheel", onWheel);
    };
  }, [onWheel]);

  const handleConfirm = useCallback(async () => {
    const img = imgRef.current;
    const container = containerRef.current;

    if (!img || !container) return;

    setExporting(true);

    try {
      const frameW = container.clientWidth;
      const frameH = frameW / aspect;
      const { x, y, scale } = transformRef.current;

      const ratioW = outputSize.w / frameW;
      const ratioH = outputSize.h / frameH;

      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = outputSize.w;
      exportCanvas.height = outputSize.h;

      const ctx = exportCanvas.getContext("2d");
      if (!ctx) {
        setExporting(false);
        return;
      }

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
    } catch {
      setExporting(false);
    }
  }, [aspect, onConfirm, outputSize]);

  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, []);

  const sliderValue = (() => {
    const container = containerRef.current;
    const img = imgRef.current;

    if (!container || !img || !img.naturalWidth) return 0;

    const frameW = container.clientWidth;
    const frameH = frameW / aspect;

    const minScale = Math.max(
      frameW / img.naturalWidth,
      frameH / img.naturalHeight
    );
    const maxScale = minScale * 6;

    if (maxScale === minScale) return 0;

    return Math.round(
      ((transform.scale - minScale) / (maxScale - minScale)) * 100
    );
  })();

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{
        background: "rgba(0,0,0,0.92)",
        zIndex: 99999,
        overscrollBehavior: "none",
      }}
    >
      <div className="flex items-center gap-3 mb-4 px-4 w-full max-w-sm">
        <button
          onClick={onCancel}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
        >
          ✕
        </button>

        <div>
          <p className="text-white text-sm font-semibold leading-tight">
            Ajustar encuadre
          </p>
          <p className="text-white/50 text-[10px]">
            Arrastrá para reencuadrar · Scroll o pellizco para zoom
          </p>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative w-full max-w-sm overflow-hidden select-none"
        style={{
          borderRadius: "50%",
          aspectRatio: `${aspect}`,
          boxShadow: "0 0 0 9999px rgba(0,0,0,0.75)",
        }}
      >
        <div
          className="absolute inset-0 z-10 pointer-events-none rounded-full"
          style={{ boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.55)" }}
        />

        <canvas
          ref={canvasRef}
          className="block w-full h-full select-none"
          style={{
            cursor: "grab",
            aspectRatio: `${aspect}`,
            touchAction: "none",
            WebkitUserSelect: "none",
            userSelect: "none",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
        />

        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
      </div>

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
            value={sliderValue}
            onChange={(e) => {
              const container = containerRef.current;
              const img = imgRef.current;
              if (!container || !img || !img.naturalWidth) return;

              const frameW = container.clientWidth;
              const frameH = frameW / aspect;

              const minScale = Math.max(
                frameW / img.naturalWidth,
                frameH / img.naturalHeight
              );
              const maxScale = minScale * 6;

              const percent = Number(e.target.value) / 100;
              const newScale = minScale + percent * (maxScale - minScale);

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
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
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