/* eslint-disable react/prop-types */
/**
 * FormationGrid.jsx — Premium parade formation renderer.
 *
 * Interaction model (adaptive by pointer type):
 *   - Desktop (pointer: fine)  → drag & drop between cells
 *   - Mobile/tablet (pointer: coarse) → tap-to-select + tap-to-swap
 *     First tap highlights a cell; second tap on another cell swaps them.
 *     Tapping the same cell again cancels the selection.
 *
 * Visual design:
 *   - Two-line name display (firstName / surname) with tooltip for full name.
 *   - Corner pip lock indicator — amber dot when locked, subtle on hover.
 *   - Full-spectrum section color palette, clearly distinguishable.
 *   - Zone dividers with colored accent chip and horizontal rules.
 *   - Fluid CSS grid: minmax(64px, 1fr) adapts from tablet to desktop.
 */

import React, { useState } from "react";
import {
  ZONES,
  ZONE_LABEL,
  SECTION_LABEL,
  SECTION_COLORS,
  DEFAULT_ZONE_ORDERS,
  slotKey,
  swapSlots,
  toggleLock,
} from "./formationEngine.js";

// ── Touch detection ───────────────────────────────────────────────────────────

/**
 * Detects whether the primary pointer is coarse (touch/stylus).
 * Uses matchMedia('pointer: coarse') — device-capability based, not width-based.
 * Falls back to false (desktop behaviour) when window is not available.
 */
function detectTouchPointer() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches;
}

// ── Name formatter ─────────────────────────────────────────────────────────────

function splitName(fullName) {
  if (!fullName) return { first: null, last: null };
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: null };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

// ── Zone accent config ─────────────────────────────────────────────────────────

const ZONE_ACCENT = {
  FRENTE_ESPECIAL: { dot: "bg-rose-400", chip: "bg-rose-50   border-rose-200   text-rose-600" },
  BLOQUE_FRENTE: { dot: "bg-indigo-400", chip: "bg-indigo-50 border-indigo-200 text-indigo-600" },
  PERCUSION: { dot: "bg-stone-400", chip: "bg-stone-50  border-stone-200  text-stone-600" },
  BLOQUE_ATRAS: { dot: "bg-indigo-300", chip: "bg-indigo-50 border-indigo-100 text-indigo-500" },
  FINAL: { dot: "bg-rose-300", chip: "bg-rose-50   border-rose-100   text-rose-500" },
};

// ── Slot cell ─────────────────────────────────────────────────────────────────

function SlotCell({
  slot,
  // desktop
  isDragging,
  onDragStart,
  onDrop,
  // touch
  isTouch,
  isSelected,
  onTap,
  // shared
  onToggleLock,
}) {
  const key = slotKey(slot);
  const isEmpty = !slot.userId;
  const colors = SECTION_COLORS[slot.section];

  // Cell background & border
  let cellBg, nameTextClass;
  if (slot.locked) {
    cellBg = "bg-amber-50 border-amber-300";
    nameTextClass = "text-amber-800";
  } else if (isEmpty) {
    cellBg = "bg-slate-50 border-dashed border-slate-200";
    nameTextClass = "";
  } else {
    cellBg = colors ? colors.cell : "bg-slate-100 border-slate-300";
    nameTextClass = colors ? colors.text : "text-slate-700";
  }

  const { first, last } = splitName(slot.displayName);

  // ── Interaction props (desktop vs touch) ──────────────────────────────────
  const interactionProps = isTouch
    ? {
        // Touch: tap to select / swap
        onClick: () => {
          if (!isEmpty && !slot.locked) onTap?.(key, slot);
        },
      }
    : {
        // Desktop: drag & drop
        draggable: !slot.locked && !isEmpty,
        onDragStart: () => !slot.locked && !isEmpty && onDragStart(key),
        onDragOver: (e) => e.preventDefault(),
        onDrop: () => onDrop(key),
      };

  // ── Cursor class ─────────────────────────────────────────────────────────
  const cursorClass = isTouch
    ? !isEmpty && !slot.locked
      ? "cursor-pointer active:brightness-90"
      : "cursor-default"
    : !isEmpty && !slot.locked
    ? "cursor-grab active:cursor-grabbing hover:shadow-md hover:brightness-[0.96]"
    : "cursor-default";

  // ── Selection ring (touch mode) ──────────────────────────────────────────
  const selectionRing = isSelected
    ? "ring-2 ring-indigo-500 ring-offset-1 brightness-95"
    : "";

  return (
    <div
      {...interactionProps}
      title={slot.displayName || ""}
      className={[
        "group relative flex flex-col items-center justify-center text-center",
        "rounded-lg border select-none transition-all duration-150",
        cellBg,
        cursorClass,
        isDragging ? "opacity-25 scale-95 ring-2 ring-indigo-300 ring-offset-1" : "",
        selectionRing,
        "px-1 py-1.5",
      ].join(" ")}
      style={{ minHeight: 58 }}
    >
      {/* Lock button — always visible, accessible hit target */}
      {!isEmpty && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleLock(key);
          }}
          className={[
            "absolute top-0 right-0 flex items-center justify-center",
            "w-7 h-7 rounded transition-colors duration-150",
            slot.locked
              ? "text-amber-500"
              : "text-slate-300 group-hover:text-slate-400 hover:text-amber-400",
          ].join(" ")}
          title={slot.locked ? "Desbloquear posición" : "Bloquear posición"}
        >
          {slot.locked ? (
            /* Closed lock */
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="w-3 h-3"
            >
              <path
                fillRule="evenodd"
                d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7A1.5 1.5 0 0 0 3 8.5v5A1.5 1.5 0 0 0 4.5 15h7a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 11 7V4.5A3.5 3.5 0 0 0 8 1Zm2 6V4.5a2 2 0 1 0-4 0V7h4Z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            /* Open lock */
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="w-3 h-3"
            >
              <path d="M11.5 1A3.5 3.5 0 0 0 8 4.5V7H2.5A1.5 1.5 0 0 0 1 8.5v5A1.5 1.5 0 0 0 2.5 15h7a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 9.5 7H9V4.5a2 2 0 1 1 4 0v1a.75.75 0 0 0 1.5 0v-1A3.5 3.5 0 0 0 11.5 1Z" />
            </svg>
          )}
        </button>
      )}

      {/* Touch: selection indicator badge */}
      {isTouch && isSelected && (
        <div className="absolute top-0 left-0 w-2.5 h-2.5 rounded-full bg-indigo-500 m-1" />
      )}

      {isEmpty ? (
        <span className="text-slate-300 text-[11px] leading-none select-none">·</span>
      ) : (
        <div className="w-full px-0.5 leading-snug">
          <div className={`text-[10px] font-semibold truncate ${nameTextClass}`}>
            {first || "—"}
          </div>
          {last && (
            <div className={`text-[9px] font-medium truncate opacity-80 ${nameTextClass}`}>
              {last}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Zone grid ─────────────────────────────────────────────────────────────────

function ZoneGrid({
  zone, slots, columns,
  isTouch, dragging, selected,
  onDragStart, onDrop, onToggleLock, onTap,
}) {
  const zoneSlots = slots
    .filter((s) => s.zone === zone)
    .sort((a, b) => (a.row !== b.row ? a.row - b.row : a.col - b.col));

  if (!zoneSlots.length) return null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, minmax(64px, 1fr))`,
        gap: "4px",
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
            isSelected={isTouch && selected === key}
            onDragStart={onDragStart}
            onDrop={onDrop}
            onToggleLock={onToggleLock}
            onTap={onTap}
          />
        );
      })}
    </div>
  );
}

// ── Zone label (first zone — no separator above) ──────────────────────────────

function ZoneFirstHeader({ zone }) {
  const accent = ZONE_ACCENT[zone] || ZONE_ACCENT.BLOQUE_FRENTE;
  return (
    <div className="flex items-center justify-center mb-3 pt-1">
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-[0.12em] ${accent.chip}`}
      >
        {ZONE_LABEL[zone]}
      </span>
    </div>
  );
}

// ── Zone divider (between zones) ──────────────────────────────────────────────

function ZoneDivider({ zone }) {
  const accent = ZONE_ACCENT[zone] || ZONE_ACCENT.BLOQUE_FRENTE;
  return (
    <div className="my-6 flex items-center gap-3">
      <div className="flex-1 h-px bg-slate-200" />
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-[0.12em] whitespace-nowrap ${accent.chip}`}
      >
        {ZONE_LABEL[zone]}
      </span>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  );
}

// ── Section legend ────────────────────────────────────────────────────────────

function SectionLegend({ slots }) {
  const seen = new Set();
  const presentSections = [];
  for (const s of slots) {
    if (s.section && !seen.has(s.section)) {
      seen.add(s.section);
      presentSections.push(s.section);
    }
  }
  if (!presentSections.length) return null;

  return (
    <div className="flex flex-wrap gap-1.5 px-1 pb-4 border-b border-slate-100 mb-1">
      {presentSections.map((sec) => {
        const c = SECTION_COLORS[sec];
        return (
          <span
            key={sec}
            className={`text-[9px] font-semibold px-2.5 py-0.5 rounded-full border ${
              c ? c.badge : "bg-slate-100 border-slate-200 text-slate-600"
            }`}
          >
            {SECTION_LABEL[sec] || sec}
          </span>
        );
      })}
      <span className="ml-auto text-[9px] text-slate-300 self-center">
        {slots.filter((s) => s.userId).length} músicos
      </span>
    </div>
  );
}

// ── Percussion zone grid (sub-grouped by section) ─────────────────────────────

function PercussionZoneGrid({
  slots, columns, sectionOrder,
  isTouch, dragging, selected,
  onDragStart, onDrop, onToggleLock, onTap,
}) {
  const zoneSlots = slots
    .filter((s) => s.zone === "PERCUSION")
    .sort((a, b) => (a.row !== b.row ? a.row - b.row : a.col - b.col));

  if (!zoneSlots.length) return null;

  const presentSections = sectionOrder.filter((sec) =>
    zoneSlots.some((s) => s.section === sec)
  );

  const grouped = {};
  for (const sec of presentSections) grouped[sec] = [];
  const fillers = [];
  for (const slot of zoneSlots) {
    if (slot.section && grouped[slot.section] !== undefined) {
      grouped[slot.section].push(slot);
    } else if (!slot.section) {
      fillers.push(slot);
    }
  }
  if (presentSections.length > 0 && fillers.length > 0) {
    const last = presentSections[presentSections.length - 1];
    grouped[last].push(...fillers);
    grouped[last].sort((a, b) => (a.row !== b.row ? a.row - b.row : a.col - b.col));
  }

  return (
    <div className="space-y-3">
      {presentSections.map((sec, idx) => {
        const secSlots = grouped[sec];
        if (!secSlots.length) return null;
        const c = SECTION_COLORS[sec];

        return (
          <div key={sec}>
            <div className="flex items-center gap-2 mb-1.5">
              {idx > 0 && <div className="flex-1 h-px bg-slate-100" />}
              <span
                className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border whitespace-nowrap ${
                  c ? c.badge : "bg-slate-50 border-slate-200 text-slate-500"
                }`}
              >
                {SECTION_LABEL[sec] || sec}
              </span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${columns}, minmax(64px, 1fr))`,
                gap: "4px",
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
                    isSelected={isTouch && selected === key}
                    onDragStart={onDragStart}
                    onDrop={onDrop}
                    onToggleLock={onToggleLock}
                    onTap={onTap}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Touch selection banner ────────────────────────────────────────────────────

function TouchSelectionBanner({ selectedKey, slots, onCancel }) {
  if (!selectedKey) return null;
  const slot = slots.find((s) => slotKey(s) === selectedKey);
  if (!slot) return null;

  return (
    <div className="flex items-center gap-3 px-3 py-2 mb-3 rounded-xl bg-indigo-50 border border-indigo-200">
      <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
      <span className="text-xs text-indigo-700 font-medium flex-1 truncate">
        Seleccionado: <strong>{slot.displayName}</strong> — tocá otra celda para mover
      </span>
      <button
        type="button"
        onClick={onCancel}
        className="text-xs text-indigo-400 hover:text-indigo-700 font-semibold px-2 py-0.5 rounded-lg hover:bg-indigo-100 transition-colors"
      >
        Cancelar
      </button>
    </div>
  );
}

// ── Main grid ─────────────────────────────────────────────────────────────────

export default function FormationGrid({ slots, columns, zoneColumns, onChange, readOnly, zoneOrders }) {
  // Detect touch pointer once on mount (stable across renders)
  const [isTouch] = useState(detectTouchPointer);

  // Desktop: track dragging key
  const [dragging, setDragging] = useState(null);

  // Touch: track selected key
  const [selected, setSelected] = useState(null);

  // ── Desktop handlers ────────────────────────────────────────────────────
  const handleDragStart = (key) => {
    if (!readOnly) setDragging(key);
  };
  const handleDrop = (key) => {
    if (!dragging || dragging === key || readOnly) {
      setDragging(null);
      return;
    }
    onChange?.(swapSlots(slots, dragging, key));
    setDragging(null);
  };

  // ── Touch handlers ──────────────────────────────────────────────────────
  const handleTap = (key, slot) => {
    if (readOnly || slot.locked || !slot.userId) return;
    if (!selected) {
      setSelected(key);
    } else if (selected === key) {
      setSelected(null);
    } else {
      onChange?.(swapSlots(slots, selected, key));
      setSelected(null);
    }
  };

  // ── Shared ──────────────────────────────────────────────────────────────
  const handleToggleLock = (key) => {
    if (!readOnly) onChange?.(toggleLock(slots, key));
  };

  const presentZones = ZONES.filter((z) => slots.some((s) => s.zone === z));

  if (!presentZones.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2">
        <div className="text-3xl">🥁</div>
        <p className="text-sm text-slate-400">Sin datos de formación. Calculá la grilla primero.</p>
      </div>
    );
  }

  const percussionOrder =
    (zoneOrders && zoneOrders["PERCUSION"]) || DEFAULT_ZONE_ORDERS.PERCUSION;

  const getZoneCols = (zone) =>
    zoneColumns && zoneColumns[zone] != null ? zoneColumns[zone] : columns;

  const sharedHandlers = {
    slots,
    isTouch,
    dragging,
    selected,
    onDragStart: handleDragStart,
    onDrop: handleDrop,
    onToggleLock: handleToggleLock,
    onTap: handleTap,
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-fit p-5 space-y-0.5">
        <SectionLegend slots={slots} />

        {/* Touch: selection status banner */}
        {isTouch && !readOnly && (
          <TouchSelectionBanner
            selectedKey={selected}
            slots={slots}
            onCancel={() => setSelected(null)}
          />
        )}

        {presentZones.map((zone, idx) => (
          <div key={zone}>
            {idx === 0 ? <ZoneFirstHeader zone={zone} /> : <ZoneDivider zone={zone} />}
            {zone === "PERCUSION" ? (
              <PercussionZoneGrid
                columns={getZoneCols("PERCUSION")}
                sectionOrder={percussionOrder}
                {...sharedHandlers}
              />
            ) : (
              <ZoneGrid zone={zone} columns={getZoneCols(zone)} {...sharedHandlers} />
            )}
          </div>
        ))}

        {/* Hint */}
        {!readOnly && (
          <p className="text-center text-[9px] text-black pt-4 tracking-wide">
            {isTouch
              ? "Tocá una celda para seleccionarla · Tocá otra para mover · 🔓 para bloquear"
              : "Arrastrá celdas para mover · 🔓 para bloquear"}
          </p>
        )}
      </div>
    </div>
  );
}

FormationGrid.defaultProps = { slots: [], readOnly: false, zoneOrders: null, zoneColumns: null };
