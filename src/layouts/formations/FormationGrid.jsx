/* eslint-disable react/prop-types */
/**
 * FormationGrid.jsx — v3
 *
 * Mejoras sobre v2:
 *   ─ Card levantada al arrastrar: se clona el nodo real, se escala 1.08×
 *     + rotate(2deg) + sombra profunda como drag image. La fuente queda
 *     "hundida" (opacity 0.25 + scale 0.95).
 *   ─ Drop target expresivo: scale(1.07) + ring indigo + sombra fuerte.
 *   ─ Hover micro-lift: -translateY(2px) + shadow en hover normal.
 *   ─ Invalid drop: shake keyframe + ring rojo.
 *   ─ Separación de bloques: cada zona tiene su propia ZoneTray con fondo
 *     tintado por zona + border + shadow. Los dividers son más amplios.
 *   ─ Performance: todo memo / useCallback / useMemo.
 */

import React, { useState, useCallback, useMemo, useRef, useEffect, memo } from "react";
import {
  ZONES,
  ZONE_LABEL,
  getSectionLabel,
  SECTION_COLORS,
  DEFAULT_ZONE_ORDERS,
  slotKey,
  swapSlots,
  toggleLock,
  canSwapSlotContents,
} from "./formationEngine.js";

import { SlotCollaboratorOverlay } from "./SlotCollaboratorOverlay.jsx";

// ─── Keyframes (inyectados una sola vez) ──────────────────────────────────────

const STYLE_ID = "__fg_styles__";
function ensureStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = `
@keyframes fg-shake {
  0%,100% { transform: translateX(0) rotate(0); }
  20%      { transform: translateX(-5px) rotate(-1.5deg); }
  40%      { transform: translateX(5px) rotate(1.5deg); }
  60%      { transform: translateX(-3px) rotate(-0.5deg); }
  80%      { transform: translateX(3px) rotate(0.5deg); }
}
.fg-shake { animation: fg-shake 0.42s ease !important; }
@keyframes fg-menu-in {
  from { opacity: 0; transform: scale(0.92) translateY(-4px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
`;
  document.head.appendChild(el);
}

// ─── Ghost drag image ─────────────────────────────────────────────────────────

function buildDragGhost(sourceEl) {
  const clone = sourceEl.cloneNode(true);
  const { width, height } = sourceEl.getBoundingClientRect();
  Object.assign(clone.style, {
    position: "fixed",
    top: "-9999px",
    left: "-9999px",
    width: `${width}px`,
    height: `${height}px`,
    transform: "scale(1.1) rotate(2.5deg)",
    boxShadow: "0 20px 48px rgba(0,0,0,0.22), 0 6px 16px rgba(0,0,0,0.14)",
    borderRadius: "12px",
    opacity: "1",
    pointerEvents: "none",
    zIndex: "9999",
  });
  document.body.appendChild(clone);
  setTimeout(() => clone.remove(), 0);
  return clone;
}

// ─── Touch pointer ────────────────────────────────────────────────────────────

function detectTouchPointer() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches;
}

// ─── Name helpers ─────────────────────────────────────────────────────────────

function splitName(fullName) {
  if (!fullName) return { first: null, last: null };
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: null };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

function getInitials(fullName) {
  return String(fullName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

// ─── Zone config ──────────────────────────────────────────────────────────────

const ZONE_ACCENT = {
  FRENTE_ESPECIAL: {
    chip: "bg-rose-50 border-rose-200 text-rose-600",
    tray: "bg-rose-50/50 border-rose-100/80",
  },
  BLOQUE_FRENTE: {
    chip: "bg-indigo-50 border-indigo-200 text-indigo-600",
    tray: "bg-indigo-50/50 border-indigo-100/80",
  },
  PERCUSION: {
    chip: "bg-stone-50 border-stone-200 text-stone-600",
    tray: "bg-stone-50/60 border-stone-100/80",
  },
  BLOQUE_ATRAS: {
    chip: "bg-indigo-50 border-indigo-100 text-indigo-500",
    tray: "bg-indigo-50/30 border-indigo-100/60",
  },
  FINAL: {
    chip: "bg-rose-50 border-rose-100 text-rose-500",
    tray: "bg-rose-50/30 border-rose-100/60",
  },
};

// ─── ContextMenu ──────────────────────────────────────────────────────────────

const ContextMenu = memo(function ContextMenu({
  x,
  y,
  slot,
  onClose,
  onToggleLock,
  onExclude,
  canExclude,
}) {
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  const [pos, setPos] = useState({ top: y, left: x });
  useEffect(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPos({
      top: Math.min(y, window.innerHeight - rect.height - 8),
      left: Math.min(x, window.innerWidth - rect.width - 8),
    });
  }, [x, y]);

  const { first, last } = splitName(slot.displayName);

  return (
    <div
      ref={ref}
      className="fixed z-[9999] min-w-[180px] rounded-xl bg-white border border-slate-200 shadow-2xl overflow-hidden"
      style={{ top: pos.top, left: pos.left, animation: "fg-menu-in 0.14s ease-out forwards" }}
    >
      <div className="px-3 py-2.5 border-b border-slate-100 bg-slate-50">
        <div className="text-xs font-bold text-slate-800 truncate">{first}</div>
        {last && <div className="text-[10px] text-slate-400 truncate">{last}</div>}
      </div>
      <div className="py-1">
        <button
          type="button"
          onClick={() => {
            onToggleLock(slotKey(slot));
            onClose();
          }}
          className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
        >
          <span className="text-base leading-none">{slot.locked ? "🔓" : "🔒"}</span>
          {slot.locked ? "Desbloquear posición" : "Bloquear posición"}
        </button>
        {canExclude && (
          <>
            <div className="mx-3 my-1 h-px bg-slate-100" />
            <button
              type="button"
              onClick={() => {
                onExclude(slot.userId);
                onClose();
              }}
              className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2.5"
            >
              <span className="text-base leading-none">✕</span>
              Excluir de la formación
            </button>
          </>
        )}
      </div>
    </div>
  );
});

function showInvalidDropFeedback(setInvalidDrop, targetKey) {
  setInvalidDrop(targetKey);
  setTimeout(() => setInvalidDrop(null), 600);
}

// ─── SlotCell ─────────────────────────────────────────────────────────────────

const SlotCell = memo(function SlotCell({
  slot,
  isDragging,
  isDropTarget,
  isInvalidDrop,
  onDragStart,
  onDragEnter,
  onDragLeave,
  onDrop,
  isTouch,
  isSelected,
  onTap,
  onToggleLock,
  registerSlotNode,
  onContextMenu,
  onKeyboardMove,
}) {
  const key = slotKey(slot);

  const isEmpty = !slot.userId;
  const colors = SECTION_COLORS[slot.section];
  const { first, last } = splitName(slot.displayName);

  // Base look
  let cellBase, nameText;
  if (slot.locked) {
    cellBase = "bg-amber-50 border-amber-300";
    nameText = "text-amber-800";
  } else if (isEmpty) {
    cellBase = "bg-white/60 border-dashed border-slate-200";
    nameText = "";
  } else {
    cellBase = colors ? colors.cell : "bg-slate-100 border-slate-300";
    nameText = colors ? colors.text : "text-slate-700";
  }

  // State-driven inline style for transforms (más preciso que clases Tailwind)
  let stateStyle = {};
  let stateRing = "";

  if (isDragging) {
    stateStyle = { opacity: 0.25, transform: "scale(0.94)", boxShadow: "none" };
    stateRing = "ring-2 ring-indigo-200 ring-offset-1";
  } else if (isDropTarget && !slot.locked) {
    stateStyle = {
      transform: "scale(1.07) translateY(-3px)",
      boxShadow: "0 14px 32px rgba(99,102,241,0.25), 0 4px 10px rgba(99,102,241,0.15)",
    };
    stateRing = "ring-2 ring-indigo-500 ring-offset-2";
  } else if (isInvalidDrop) {
    stateStyle = { filter: "brightness(0.95)" };
    stateRing = "ring-2 ring-red-400 ring-offset-1 fg-shake";
  } else if (isSelected) {
    stateStyle = {
      transform: "scale(1.05) translateY(-2px)",
      boxShadow: "0 8px 20px rgba(99,102,241,0.2)",
    };
    stateRing = "ring-2 ring-indigo-500 ring-offset-2";
  }

  // Hover lift only when idle
  const isIdle = !isDragging && !isDropTarget && !isInvalidDrop && !isSelected;
  const hoverLift =
    isIdle && !isEmpty && !slot.locked
      ? "hover:[transform:translateY(-2px)] hover:[box-shadow:0_6px_16px_rgba(0,0,0,0.10)]"
      : "";

  const cursor = isTouch
    ? !isEmpty && !slot.locked
      ? "cursor-pointer"
      : "cursor-default"
    : !isEmpty && !slot.locked
    ? "cursor-grab active:cursor-grabbing"
    : "cursor-default";

  const interactionProps = isTouch
    ? {
        role: "gridcell",
        "aria-label": slot.displayName || "Celda vacía",
        onClick: () => {
          if (!isEmpty && !slot.locked) onTap?.(key, slot);
        },
        onContextMenu: (e) => {
          if (!isEmpty) {
            e.preventDefault();
            onContextMenu?.(e, slot);
          }
        },
      }
    : {
        role: "gridcell",
        "aria-label": slot.displayName || "Celda vacía",
        tabIndex: 0,
        draggable: !slot.locked && !isEmpty,
        onDragStart: (e) => {
          if (slot.locked || isEmpty) return;
          const ghost = buildDragGhost(e.currentTarget);
          e.dataTransfer.setDragImage(ghost, 60, 34);
          e.dataTransfer.effectAllowed = "move";
          onDragStart(key);
        },
        onDragEnd: () => onDragStart(null),
        onDragOver: (e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
        },
        onDragEnter: (e) => {
          e.preventDefault();
          onDragEnter(key);
        },
        onDragLeave: (e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) onDragLeave(key);
        },
        onDrop: (e) => {
          e.preventDefault();
          onDrop(key);
        },
        onClick: () => {
          if (!isEmpty && !slot.locked) onTap?.(key, slot);
        },
        onKeyDown: (e) => {
          if (e.key !== "Enter" && e.key !== " ") return;
          e.preventDefault();
          if (!isEmpty && !slot.locked) onKeyboardMove?.(key, slot);
        },
        onContextMenu: (e) => {
          if (!isEmpty) {
            e.preventDefault();
            onContextMenu?.(e, slot);
          }
        },
      };

  return (
    <div
      {...interactionProps}
      ref={(node) => registerSlotNode?.(key, node)}
      title={slot.displayName || ""}
      style={stateStyle}
      className={[
        "group relative flex flex-col items-center justify-center text-center",
        "rounded-xl border select-none",
        "transition-[transform,box-shadow,opacity,filter] duration-200 ease-out",
        "px-1 py-2",
        "overflow-visible",
        cellBase,
        cursor,
        hoverLift,
        stateRing,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Glow interior en drop-target */}
      {isDropTarget && !slot.locked && (
        <div className="absolute inset-0 rounded-xl bg-indigo-400/10 pointer-events-none" />
      )}

      {/* Lock button */}
      {!isEmpty && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleLock(key);
          }}
          className={[
            "absolute top-0.5 right-0.5 flex items-center justify-center",
            "w-6 h-6 rounded-lg transition-all duration-150",
            slot.locked
              ? "text-amber-500 bg-amber-100/80"
              : "text-transparent group-hover:text-slate-300 hover:!text-amber-400 hover:bg-amber-50/80",
          ].join(" ")}
          title={slot.locked ? "Desbloquear posición" : "Bloquear posición"}
          aria-label={slot.locked ? "Desbloquear" : "Bloquear"}
        >
          {slot.locked ? (
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
              <path
                fillRule="evenodd"
                d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7A1.5 1.5 0 0 0 3 8.5v5A1.5 1.5 0 0 0 4.5 15h7a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 11 7V4.5A3.5 3.5 0 0 0 8 1Zm2 6V4.5a2 2 0 1 0-4 0V7h4Z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
              <path d="M11.5 1A3.5 3.5 0 0 0 8 4.5V7H2.5A1.5 1.5 0 0 0 1 8.5v5A1.5 1.5 0 0 0 2.5 15h7a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 9.5 7H9V4.5a2 2 0 1 1 4 0v1a.75.75 0 0 0 1.5 0v-1A3.5 3.5 0 0 0 11.5 1Z" />
            </svg>
          )}
        </button>
      )}

      {/* Touch selection dot */}
      {isTouch && isSelected && (
        <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-indigo-500 shadow-sm" />
      )}

      {isEmpty ? (
        <span className="text-slate-200 text-sm select-none">·</span>
      ) : (
        <div className="w-full px-0.5 leading-snug flex flex-col items-center gap-1">
          {slot.avatar ? (
            <img
              src={slot.avatar}
              alt={slot.displayName || "Miembro"}
              loading="lazy"
              className={[
                "w-8 h-8 rounded-full object-cover shadow-sm border-2",
                slot.locked ? "border-amber-300" : "border-white/80",
              ].join(" ")}
            />
          ) : (
            <div
              className={[
                "w-8 h-8 rounded-full flex items-center justify-center",
                "text-[9px] font-extrabold shadow-sm border-2",
                slot.locked
                  ? "bg-amber-100 border-amber-300 text-amber-800"
                  : colors?.dark
                  ? "bg-white/20 border-white/30 text-white"
                  : "bg-white/80 border-white/90 text-slate-700",
              ].join(" ")}
            >
              {getInitials(slot.displayName) || "?"}
            </div>
          )}
          <div className="w-full">
            <div className={`text-[10px] font-bold truncate leading-tight ${nameText}`}>
              {first || "—"}
            </div>
            {last && (
              <div
                className={`text-[9px] font-medium truncate leading-tight opacity-75 ${nameText}`}
              >
                {last}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

// ─── ZoneTray ─────────────────────────────────────────────────────────────────

const ZoneTray = memo(function ZoneTray({ zone, children }) {
  const accent = ZONE_ACCENT[zone] || ZONE_ACCENT.BLOQUE_FRENTE;
  return <div className={[" pt-3 pb-4", "shadow-sm", accent.tray].join(" ")}>{children}</div>;
});

// ─── ZoneHeader ───────────────────────────────────────────────────────────────

const ZoneHeader = memo(function ZoneHeader({ zone, inline }) {
  const accent = ZONE_ACCENT[zone] || ZONE_ACCENT.BLOQUE_FRENTE;
  const chip = (
    <span
      className={`inline-flex items-center px-3.5 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-[0.14em] shadow-sm ${accent.chip}`}
    >
      {ZONE_LABEL[zone]}
    </span>
  );

  if (inline) {
    // Etiqueta dentro del tray (primera zona o dentro del bloque)
    return <div className="flex justify-center mb-3">{chip}</div>;
  }

  // Divider entre zonas
  return (
    <div className="flex items-center gap-3 my-2">
      <div className="flex-1 h-px bg-slate-200/60" />
      {chip}
      <div className="flex-1 h-px bg-slate-200/60" />
    </div>
  );
});

// ─── Section legend ───────────────────────────────────────────────────────────

const SectionLegend = memo(function SectionLegend({ slots }) {
  const presentSections = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const s of slots) {
      if (s.section && !seen.has(s.section)) {
        seen.add(s.section);
        out.push(s.section);
      }
    }
    return out;
  }, [slots]);

  const filledCount = useMemo(() => slots.filter((s) => s.userId).length, [slots]);

  if (!presentSections.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5 px-1 pb-4 border-b border-slate-100 mb-5">
      {presentSections.map((sec) => {
        const c = SECTION_COLORS[sec];
        return (
          <span
            key={sec}
            className={`text-[9px] font-bold px-2.5 py-1 rounded-full border tracking-wide ${
              c ? c.badge : "bg-slate-100 border-slate-200 text-slate-600"
            }`}
          >
            {getSectionLabel(sec)}
          </span>
        );
      })}
      <span className="ml-auto text-[9px] text-slate-400 self-center font-medium">
        {filledCount} músicos
      </span>
    </div>
  );
});

// ─── ZoneGrid ─────────────────────────────────────────────────────────────────

const ZoneGrid = memo(function ZoneGrid({
  zone,
  slots,
  columns,
  isTouch,
  dragging,
  dropTarget,
  invalidDrop,
  selected,
  onDragStart,
  onDragEnter,
  onDragLeave,
  onDrop,
  onToggleLock,
  onTap,
  registerSlotNode,
  onContextMenu,
  onKeyboardMove,
}) {
  const zoneSlots = useMemo(
    () =>
      slots
        .filter((s) => s.zone === zone)
        .sort((a, b) => (a.row !== b.row ? a.row - b.row : a.col - b.col)),
    [slots, zone]
  );
  if (!zoneSlots.length) return null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, minmax(64px, 1fr))`,
        gap: "6px",
      }}
    >
      {zoneSlots.map((slot) => {
        const key = slotKey(slot);
        return (
          <SlotCell
            key={key}
            slot={slot}
            isTouch={isTouch}
            isDragging={!isTouch && dragging === key}
            isDropTarget={!isTouch && dropTarget === key}
            isInvalidDrop={!isTouch && invalidDrop === key}
            isSelected={selected === key}
            onDragStart={onDragStart}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onToggleLock={onToggleLock}
            onTap={onTap}
            registerSlotNode={registerSlotNode}
            onContextMenu={onContextMenu}
            onKeyboardMove={onKeyboardMove}
          />
        );
      })}
    </div>
  );
});

// ─── PercussionZoneGrid ───────────────────────────────────────────────────────

const PercussionZoneGrid = memo(function PercussionZoneGrid({
  slots,
  columns,
  sectionOrder,
  isTouch,
  dragging,
  dropTarget,
  invalidDrop,
  selected,
  onDragStart,
  onDragEnter,
  onDragLeave,
  onDrop,
  onToggleLock,
  onTap,
  registerSlotNode,
  onContextMenu,
  onKeyboardMove,
}) {
  const { grouped, presentSections } = useMemo(() => {
    const zoneSlots = slots
      .filter((s) => s.zone === "PERCUSION")
      .sort((a, b) => (a.row !== b.row ? a.row - b.row : a.col - b.col));
    const present = sectionOrder.filter((sec) => zoneSlots.some((s) => s.section === sec));
    const grp = {};
    for (const sec of present) grp[sec] = [];
    const fillers = [];
    for (const slot of zoneSlots) {
      if (slot.section && grp[slot.section] !== undefined) grp[slot.section].push(slot);
      else if (!slot.section) fillers.push(slot);
    }
    if (present.length > 0 && fillers.length > 0) {
      const last = present[present.length - 1];
      grp[last].push(...fillers);
      grp[last].sort((a, b) => (a.row !== b.row ? a.row - b.row : a.col - b.col));
    }
    return { grouped: grp, presentSections: present };
  }, [slots, sectionOrder]);

  if (!presentSections.length) return null;

  return (
    <div className="space-y-4">
      {presentSections.map((sec, idx) => {
        const secSlots = grouped[sec];
        if (!secSlots?.length) return null;
        const c = SECTION_COLORS[sec];
        return (
          <div key={sec}>
            <div className="flex items-center gap-2 mb-2">
              {idx > 0 && <div className="flex-1 h-px bg-slate-100" />}
              <span
                className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border whitespace-nowrap ${
                  c ? c.badge : "bg-slate-50 border-slate-200 text-slate-500"
                }`}
              >
                {getSectionLabel(sec)}
              </span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${columns}, minmax(64px, 1fr))`,
                gap: "6px",
              }}
            >
              {secSlots.map((slot) => {
                const key = slotKey(slot);
                return (
                  <SlotCell
                    key={key}
                    slot={slot}
                    isTouch={isTouch}
                    isDragging={!isTouch && dragging === key}
                    isDropTarget={!isTouch && dropTarget === key}
                    isInvalidDrop={!isTouch && invalidDrop === key}
                    isSelected={selected === key}
                    onDragStart={onDragStart}
                    onDragEnter={onDragEnter}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    onToggleLock={onToggleLock}
                    onTap={onTap}
                    registerSlotNode={registerSlotNode}
                    onContextMenu={onContextMenu}
                    onKeyboardMove={onKeyboardMove}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
});

// ─── TouchSelectionBanner ────────────────────────────────────────────────────

const SelectionBanner = memo(function SelectionBanner({
  selectedKey,
  slots,
  onCancel,
  isTouch,
}) {
  if (!selectedKey) return null;
  const slot = slots.find((s) => slotKey(s) === selectedKey);
  if (!slot) return null;
  return (
    <div className="flex items-center gap-3 px-3 py-2 mb-4 rounded-xl bg-indigo-50 border border-indigo-200 shadow-sm">
      <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shrink-0" />
      <span className="text-xs text-indigo-700 font-medium flex-1 truncate">
        <strong>{slot.displayName}</strong>
        {isTouch
          ? " — tocá otra celda para mover"
          : " — hacé click o presioná Enter/Espacio en otra celda para mover"}
      </span>
      <button
        type="button"
        onClick={onCancel}
        className="text-xs text-indigo-400 hover:text-indigo-700 font-bold px-2 py-0.5 rounded-lg hover:bg-indigo-100 transition-colors"
      >
        ✕
      </button>
    </div>
  );
});

// ─── FormationGrid ────────────────────────────────────────────────────────────

export default function FormationGrid({
  slots = [],
  columns,
  zoneColumns = null,
  onChange,
  readOnly = false,
  zoneOrders = null,
  formType = "DOUBLE",
  collaboratorsBySlot = {},
  onDragBegin,
  onDragComplete,
  canExclude = false,
  onExclude = null,
  onDragOver,
}) {
  useMemo(ensureStyles, []);

  const [isTouch] = useState(detectTouchPointer);
  const [ctxMenu, setCtxMenu] = useState(null); // { x, y, slot }

  const [dragging, setDragging] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [invalidDrop, setInvalidDrop] = useState(null);
  const [selected, setSelected] = useState(null);
  const [overlayVersion, setOverlayVersion] = useState(0);
  const contentRef = useRef(null);
  const slotNodeMapRef = useRef(new Map());

  const handleContextMenu = useCallback(
    (e, slot) => {
      if (readOnly) return;
      setCtxMenu({ x: e.clientX + 4, y: e.clientY + 4, slot });
    },
    [readOnly]
  );

  const closeCtxMenu = useCallback(() => setCtxMenu(null), []);

  const registerSlotNode = useCallback((key, node) => {
    if (node) {
      slotNodeMapRef.current.set(key, node);
      return;
    }
    slotNodeMapRef.current.delete(key);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const handleResize = () => setOverlayVersion((v) => v + 1);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setOverlayVersion((v) => v + 1);
  }, [slots, collaboratorsBySlot, dragging, dropTarget, invalidDrop, selected]);

  const handleDragStart = useCallback((key) => {
    setDragging(key);
    setDropTarget(null);
  }, []);

  const handleDragEnter = useCallback(
    (key) => {
      if (key !== dragging) {
        setDropTarget(key);
        onDragOver?.(key);
      }
    },
    [dragging, onDragOver]
  );

  const handleDragLeave = useCallback((key) => {
    setDropTarget((prev) => (prev === key ? null : prev));
  }, []);

  const handleDrop = useCallback(
    (targetKey) => {
      if (!dragging || readOnly) {
        setDragging(null);
        setDropTarget(null);
        return;
      }
      if (dragging === targetKey) {
        setDragging(null);
        setDropTarget(null);
        return;
      }
      const targetSlot = slots.find((s) => slotKey(s) === targetKey);
      if (targetSlot?.locked) {
        showInvalidDropFeedback(setInvalidDrop, targetKey);
        setDragging(null);
        setDropTarget(null);
        return;
      }
      const sourceSlot = slots.find((s) => slotKey(s) === dragging);
      if (!canSwapSlotContents(sourceSlot, targetSlot, formType)) {
        showInvalidDropFeedback(setInvalidDrop, targetKey);
        setDragging(null);
        setDropTarget(null);
        return;
      }
      onChange?.(swapSlots(slots, dragging, targetKey));
      setDragging(null);
      setDropTarget(null);
    },
    [dragging, slots, onChange, readOnly, formType]
  );

  const handleTap = useCallback(
    (key, slot) => {
      if (readOnly || slot.locked || !slot.userId) return;
      if (!selected) {
        setSelected(key);
      } else if (selected === key) {
        setSelected(null);
      } else {
        const targetSlot = slots.find((s) => slotKey(s) === key);
        if (targetSlot?.locked) {
          showInvalidDropFeedback(setInvalidDrop, key);
          setSelected(null);
          return;
        }
        const sourceSlot = slots.find((s) => slotKey(s) === selected);
        if (!canSwapSlotContents(sourceSlot, targetSlot, formType)) {
          showInvalidDropFeedback(setInvalidDrop, key);
          setSelected(null);
          return;
        }
        onChange?.(swapSlots(slots, selected, key));
        setSelected(null);
      }
    },
    [readOnly, selected, slots, onChange, formType]
  );

  const handleKeyboardMove = useCallback(
    (key, slot) => {
      handleTap(key, slot);
    },
    [handleTap]
  );

  const handleToggleLock = useCallback(
    (key) => {
      if (!readOnly) onChange?.(toggleLock(slots, key));
    },
    [readOnly, slots, onChange]
  );

  const presentZones = useMemo(() => ZONES.filter((z) => slots.some((s) => s.zone === z)), [slots]);

  const percussionOrder = useMemo(
    () => zoneOrders?.["PERCUSION"] || DEFAULT_ZONE_ORDERS.PERCUSION,
    [zoneOrders]
  );

  const getZoneCols = useCallback(
    (zone) => (zoneColumns && zoneColumns[zone] != null ? zoneColumns[zone] : columns),
    [zoneColumns, columns]
  );

  const handlers = useMemo(
    () => ({
      slots,
      isTouch,
      dragging,
      dropTarget,
      invalidDrop,
      selected,
      onDragStart: handleDragStart,
      onContextMenu: handleContextMenu,
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
      onToggleLock: handleToggleLock,
      onTap: handleTap,
      onKeyboardMove: handleKeyboardMove,
      registerSlotNode,
    }),
    [
      slots,
      isTouch,
      dragging,
      dropTarget,
      invalidDrop,
      selected,
      collaboratorsBySlot,
      handleContextMenu,
      handleDragStart,
      handleDragEnter,
      handleDragLeave,
      handleDrop,
      handleToggleLock,
      handleTap,
      handleKeyboardMove,
      registerSlotNode,
    ]
  );

  const overlayItems = useMemo(() => {
    const contentNode = contentRef.current;
    if (!contentNode) return [];

    const contentRect = contentNode.getBoundingClientRect();
    const items = [];

    Object.entries(collaboratorsBySlot || {}).forEach(([key, collaborators]) => {
      const slotNode = slotNodeMapRef.current.get(key);
      if (!slotNode || !collaborators?.length) return;

      const slotRect = slotNode.getBoundingClientRect();
      const rect = {
        key,
        top: slotRect.top - contentRect.top,
        left: slotRect.left - contentRect.left,
        width: slotRect.width,
        height: slotRect.height,
      };

      collaborators.forEach((collaborator, idx) => {
        items.push({
          collaborator,
          rect,
          pillTop: rect.top - 28 - idx * 26,
          pillLeft: rect.left - 4,
        });
      });
    });

    return items;
  }, [collaboratorsBySlot, overlayVersion, slots, dragging, dropTarget, invalidDrop, selected]);

  if (!presentZones.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="text-4xl">🥁</div>
        <p className="text-sm text-slate-400 font-medium">
          Sin datos de formación. Calculá la grilla primero.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div ref={contentRef} className="relative min-w-fit">
        <SlotCollaboratorOverlay items={overlayItems} />
        <SectionLegend slots={slots} />

        {selected && !readOnly && (
          <SelectionBanner
            selectedKey={selected}
            slots={slots}
            onCancel={() => setSelected(null)}
            isTouch={isTouch}
          />
        )}

        {/* Zonas: cada una en su propia bandeja */}
        <div className="flex flex-col gap-3">
          {presentZones.map((zone, idx) => (
            <div key={zone}>
              {/* Divider entre bloques */}
              {/* {idx > 0 && <ZoneHeader zone={zone} inline={false} />} */}

              <ZoneTray zone={zone}>
                {/* Label dentro del tray */}
                <ZoneHeader zone={zone} inline={true} />

                {zone === "PERCUSION" ? (
                  <PercussionZoneGrid
                    columns={getZoneCols("PERCUSION")}
                    sectionOrder={percussionOrder}
                    {...handlers}
                  />
                ) : (
                  <ZoneGrid zone={zone} columns={getZoneCols(zone)} {...handlers} />
                )}
              </ZoneTray>
            </div>
          ))}
        </div>

        {!readOnly && (
          <p className="text-center text-[9px] text-slate-400 pt-5 tracking-wide">
            {isTouch
              ? "Tocá una celda para seleccionarla · Tocá otra para mover · 🔒 para bloquear"
              : "Arrastrá para mover · O hacé click para seleccionar y luego click/Enter/Espacio en otra celda · 🔒 para bloquear"}
          </p>
        )}
      </div>

      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          slot={ctxMenu.slot}
          onClose={closeCtxMenu}
          onToggleLock={handleToggleLock}
          onExclude={onExclude}
          canExclude={canExclude}
        />
      )}
    </div>
  );
}
