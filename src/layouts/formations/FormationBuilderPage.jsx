/* eslint-disable react/prop-types */
/**
 * FormationBuilderPage.jsx — 4-step wizard
 */

import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client";
import FormationGrid from "./FormationGrid.jsx";
import { useFormationUsers, useFormationBuilder, useFormationTemplates } from "./useFormations.js";
import {
  DEFAULT_ZONE_ORDERS,
  DEFAULT_ZONE_COLUMNS,
  DEFAULT_ZONE_ROWS,
  INDEPENDENT_COLUMN_ZONES,
  getSectionLabel,
  buildDynamicZonePools,
  mergeZoneOrdersWithPools,
  buildZones,
  computeFormation,
  slotKey,
} from "./formationEngine.js";
import { openFormationPrint } from "./formationPrint.js";
import { GET_USERS_BY_ID } from "graphql/queries";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

const FORMATION_ADMIN_ROLES = new Set(["Admin", "Director", "Subdirector", "Dirección Logística"]);

// ── Smart exclude-and-compact ──────────────────────────────────────────────────
/**
 * Remove excluded users from the current slot grid and compact each zone
 * upward — filling vacated positions with the next person in the same zone,
 * leaving empty slots at the bottom. Locks are fully respected:
 *   - A locked slot is never moved.
 *   - If a locked musician is now excluded, that slot is simply cleared.
 *
 * This avoids a full recompute and preserves every other position.
 */
/**
 * Remove excluded musicians with COLUMN CASCADE within each zone.
 *
 * When a musician is removed from position (row, col):
 *   - Everyone below them in the SAME COLUMN shifts up one row.
 *   - The last slot in that column becomes empty.
 *   - Other columns are untouched.
 *   - Locked slots are never moved (locked slot in the cascade path = cascade stops there).
 *
 * Example (6 cols, remove C at row=0 col=2):
 *   Before:          After:
 *   a b [C] d e f    a b  i  d e f
 *   g h  i  j k l   g h  n  j k l
 *   m n  o  p q r   m n  o  p q r  ← wait, o stays, only i and n cascade
 *
 * Corrected example — only the column cascades upward:
 *   col2 before: C, i, o  →  after: i, o, _
 *   result row0col2=i, row1col2=o, row2col2=empty
 */
function removeAndCompact(slots, newExcluded) {
  const excluded = new Set([...newExcluded].map(String));

  // Group by zone
  const byZone = {};
  for (const s of slots) {
    if (!byZone[s.zone]) byZone[s.zone] = [];
    byZone[s.zone].push(s);
  }

  const result = [];

  for (const [, zoneSlots] of Object.entries(byZone)) {
    // Build a mutable map: key -> slot data (so we can update in place)
    const slotMap = {};
    for (const s of zoneSlots) slotMap[`${s.row}|${s.col}`] = { ...s };

    // Find all rows and cols present
    const rows = [...new Set(zoneSlots.map((s) => s.row))].sort((a, b) => a - b);
    const cols = [...new Set(zoneSlots.map((s) => s.col))].sort((a, b) => a - b);

    // For each excluded musician, cascade their column upward
    for (const s of zoneSlots) {
      if (!s.userId || !excluded.has(String(s.userId))) continue;

      const col = s.col;
      // Collect all slots in this column sorted by row
      const colSlots = rows
        .map((r) => slotMap[`${r}|${col}`])
        .filter(Boolean)
        .sort((a, b) => a.row - b.row);

      // Find the index of the excluded slot in this column
      const excludedIdx = colSlots.findIndex(
        (slot) =>
          slot.userId && excluded.has(String(slot.userId)) && slot.col === col && slot.row === s.row
      );
      if (excludedIdx === -1) continue;

      // Cascade: shift unlocked slots from excludedIdx+1 onward up by one
      // Locked slots act as a wall — cascade stops there
      let writeIdx = excludedIdx;
      for (let readIdx = excludedIdx + 1; readIdx < colSlots.length; readIdx++) {
        const readSlot = colSlots[readIdx];
        const writeSlot = colSlots[writeIdx];
        if (readSlot.locked) break; // locked slot = wall, stop cascade
        if (writeSlot.locked) {
          writeIdx++;
          continue;
        } // skip locked write target

        // Move readSlot's content into writeSlot's position
        slotMap[`${writeSlot.row}|${writeSlot.col}`] = {
          ...writeSlot,
          userId: readSlot.userId,
          displayName: readSlot.displayName,
          avatar: readSlot.avatar || null,
          section: readSlot.section,
          locked: false,
        };
        writeIdx++;
      }

      // Clear the last slot that was shifted from (the tail becomes empty)
      if (writeIdx < colSlots.length) {
        const tailSlot = colSlots[writeIdx];
        if (!tailSlot.locked) {
          slotMap[`${tailSlot.row}|${tailSlot.col}`] = {
            ...tailSlot,
            userId: null,
            displayName: null,
            avatar: null,
            section: null,
            locked: false,
          };
        }
      }

      // Handle locked excluded slot: just clear in place, no cascade
      if (s.locked) {
        slotMap[`${s.row}|${s.col}`] = {
          ...s,
          userId: null,
          displayName: null,
          avatar: null,
          section: null,
          locked: false,
        };
      }
    }

    result.push(...Object.values(slotMap));
  }

  return result;
}

/**
 * Re-insert a musician with COLUMN CASCADE (upward) within their zone.
 *
 * Strategy: find the first empty slot in the zone (reading order).
 * That empty slot was created by removeAndCompact. Insert the musician
 * by cascading UPWARD in that column: the musician goes into the top
 * of the column's "gap stack" — specifically, the empty slot gets filled
 * with the musician, and everyone above who was shifted down gets restored.
 *
 * Simpler mental model: we just INSERT at the position right before the
 * first empty slot in reading order, then shift that column DOWN so the
 * musician ends up at the right spot.
 *
 * Actually the cleanest approach: treat the column containing the empty slot
 * as a list. Find the empty position. Shift everyone FROM the insert position
 * DOWN by one, filling the empty at the bottom. Place musician at insert pos.
 *
 * The insert position = right after the last musician of the same section
 * in that column. If no section peers in that column, use the empty slot itself.
 *
 * Example: col2 = [i, o, _]. We want to insert C before i → [C, i, o].
 * Steps:
 *   1. Find empty slot: row2,col2
 *   2. In col2, find insert position: right after last member of same section
 *      (or at the empty if unknown) = row0 (because C belonged at row0)
 *   3. Shift col2 DOWN from row0: row2←o, row1←i, row0←C
 *
 * Since we don't know the original row, we use the first empty slot's column
 * and insert at the TOP of the contiguous occupied block in that column,
 * or right after the section peers.
 */
function includeAndExpand(slots, musician, zoneOrders, zoneColumns, defaultCols) {
  const userId = String(musician.userId);
  const section = musician.section;

  // Find target zone
  let targetZone = null;
  for (const [zone, order] of Object.entries(zoneOrders || {})) {
    if ((order || []).includes(section)) {
      targetZone = zone;
      break;
    }
  }
  if (!targetZone) {
    const found = slots.find((s) => s.section === section);
    targetZone = found?.zone || null;
  }
  if (!targetZone) {
    targetZone = [...new Set(slots.map((s) => s.zone))][0] || null;
  }
  if (!targetZone) return slots;

  const zoneSlots = slots.filter((s) => s.zone === targetZone);
  const slotMap = {};
  for (const s of zoneSlots) slotMap[`${s.row}|${s.col}`] = { ...s };

  const rows = [...new Set(zoneSlots.map((s) => s.row))].sort((a, b) => a - b);
  const sorted = [...zoneSlots].sort((a, b) => (a.row !== b.row ? a.row - b.row : a.col - b.col));

  // Find the first empty, unlocked slot in reading order
  const emptySlot = sorted.find((s) => !s.userId && !s.locked);

  if (!emptySlot) {
    // No empty slot — append a new slot at end of section's column
    const lastMember =
      sorted.filter((s) => s.section === section && s.userId).pop() || sorted[sorted.length - 1];
    const newRow = (rows[rows.length - 1] ?? 0) + 1;
    slotMap[`${newRow}|${lastMember.col}`] = {
      zone: targetZone,
      row: newRow,
      col: lastMember.col,
      userId,
      displayName: musician.displayName || musician.name || null,
      avatar: musician.avatar || null,
      section,
      locked: false,
    };
    return [...slots.filter((s) => s.zone !== targetZone), ...Object.values(slotMap)];
  }

  // The column containing the empty slot is where we cascade
  const targetCol = emptySlot.col;

  // Get all slots in this column sorted top→bottom
  const colSlots = rows
    .map((r) => slotMap[`${r}|${targetCol}`])
    .filter(Boolean)
    .sort((a, b) => a.row - b.row);

  // Find where to insert in this column:
  // = right after the last existing musician of the same section in this column,
  //   OR at the very top of the column if no section peers exist here.
  // Find the empty slot index in this column
  const emptyColIdx = colSlots.findIndex((s) => s.row === emptySlot.row && !s.userId);

  // Insert at top of column (idx 0) and cascade DOWN to the empty slot.
  // This is the exact inverse of removeAndCompact's upward cascade.
  // Skip locked slots from the top.
  let insertColIdx = 0;
  while (insertColIdx < emptyColIdx && colSlots[insertColIdx]?.locked) insertColIdx++;

  // Cascade: shift everything DOWN from emptyColIdx-1 to insertColIdx,
  // freeing up insertColIdx for the new musician.
  // Example: col=[i,o,_], insert at 0, empty at 2
  //   i=2: row2 ← o (from row1)
  //   i=1: row1 ← i (from row0)
  //   place C at row0
  for (let i = emptyColIdx; i > insertColIdx; i--) {
    const from = colSlots[i - 1];
    const to = colSlots[i];
    if (from.locked || to.locked) break;
    slotMap[`${to.row}|${to.col}`] = {
      ...to,
      userId: from.userId,
      displayName: from.displayName,
      avatar: from.avatar || null,
      section: from.section,
      locked: false,
    };
  }

  // Place the new musician at insertColIdx
  const targetSlot = colSlots[insertColIdx];
  if (targetSlot && !targetSlot.locked) {
    slotMap[`${targetSlot.row}|${targetSlot.col}`] = {
      ...targetSlot,
      userId,
      displayName: musician.displayName || musician.name || null,
      avatar: musician.avatar || null,
      section,
      locked: false,
    };
  }

  return [...slots.filter((s) => s.zone !== targetZone), ...Object.values(slotMap)];
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [message, onClose]);
  return (
    <div
      className={[
        "fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-white text-sm flex items-center gap-2",
        type === "error" ? "bg-red-600" : "bg-slate-900",
      ].join(" ")}
    >
      {type === "error" ? "⚠" : "✓"} {message}
    </div>
  );
}

function StepBadge({ n, active, done }) {
  const base =
    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors";
  return (
    <div
      className={`${base} ${
        done
          ? "bg-black text-white"
          : active
          ? "bg-indigo-100 text-indigo-700 ring-2 ring-indigo-400"
          : "bg-slate-100 text-slate-400"
      }`}
    >
      {done ? "✓" : n}
    </div>
  );
}

function ConflictModal({ open, onReload }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Conflicto de edición</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Otro usuario guardó cambios mientras usted estaba editando. Debe recargar la formación
              para continuar y evitar sobrescribir trabajo ajeno.
            </p>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onReload}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Recargar formación
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Paso 2 helpers ────────────────────────────────────────────────────────────

const PERCUSSION_SECTIONS = new Set([
  "MALLETS",
  "PERCUSION",
  "PERCUSSION",
  "DRUMLINE",
  "BATTERY",
  "TENORS",
  "BASSES",
  "SNARES",
  "CYMBALS",
  "PIT",
  "FRONT_ENSEMBLE",
]);

function isPercussion(sec) {
  return PERCUSSION_SECTIONS.has(sec);
}

function buildMemberCounts(zoneOrders, sections, excluded) {
  const safeZoneOrders = zoneOrders ?? {};
  const safeSections = sections ?? [];
  const safeExcluded = excluded ?? new Set();

  const globalAppearances = {};
  for (const order of Object.values(safeZoneOrders)) {
    for (const sec of order) {
      globalAppearances[sec] = (globalAppearances[sec] || 0) + 1;
    }
  }

  const activeCounts = {};
  for (const grp of safeSections) {
    activeCounts[grp.section] = grp.members.filter((m) => !safeExcluded.has(m.userId)).length;
  }

  const result = {};
  for (const [zone, order] of Object.entries(safeZoneOrders)) {
    const zoneAppearances = {};
    for (const sec of order) {
      zoneAppearances[sec] = (zoneAppearances[sec] || 0) + 1;
    }
    result[zone] = {};
    for (const [sec, localCount] of Object.entries(zoneAppearances)) {
      const total = activeCounts[sec] || 0;
      const global = globalAppearances[sec] || 1;
      result[zone][sec] = Math.round((total * localCount) / global);
    }
  }
  return result;
}

// ── SectionOrderEditor ────────────────────────────────────────────────────────

function SectionOrderEditor({
  zone,
  label,
  order,
  onChangeOrder,
  sections,
  excluded,
  poolSections,
  fixed = false,
  draggingInfo,
  onDragStart,
  onDragEnd,
  onCrossZoneDrop,
}) {
  const safeExcluded = excluded ?? new Set();
  const listRef = useRef(null);
  const [isOver, setIsOver] = useState(false);
  const [overIndex, setOverIndex] = useState(null);

  const isPercZone = zone === "PERCUSION";

  const canAccept = useCallback(
    (sec) => (isPercZone ? isPercussion(sec) : !isPercussion(sec)),
    [isPercZone]
  );

  const isDraggingCompatible = draggingInfo
    ? canAccept(draggingInfo.section) && draggingInfo.fromZone !== zone
    : false;

  const getCount = (sec) => {
    const grp = (sections ?? []).find((g) => g.section === sec);
    if (!grp) return 0;
    return grp.members.filter((m) => !safeExcluded.has(m.userId)).length;
  };

  const occurrenceMap = order.reduce((acc, sec) => {
    acc[sec] = (acc[sec] || 0) + 1;
    return acc;
  }, {});

  const getDistributedCount = (sec) => {
    const totalMembers = getCount(sec);
    const occurrences = occurrenceMap[sec] || 1;
    return Math.ceil(totalMembers / occurrences);
  };

  const total = Object.keys(occurrenceMap).reduce((sum, sec) => sum + getCount(sec), 0);

  const totalOccurrencesMap = {};
  for (const sec of order) {
    totalOccurrencesMap[sec] = (totalOccurrencesMap[sec] || 0) + 1;
  }
  const seenCount = {};
  const chipOccurrences = order.map((sec) => {
    seenCount[sec] = (seenCount[sec] || 0) + 1;
    return { occurrenceIdx: seenCount[sec], totalOccurrences: totalOccurrencesMap[sec] };
  });

  const moveUp = (idx) => {
    if (idx <= 0) return;
    const next = [...order];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    onChangeOrder(zone, next);
  };

  const moveDown = (idx) => {
    if (idx >= order.length - 1) return;
    const next = [...order];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    onChangeOrder(zone, next);
  };

  const remove = (idx) =>
    onChangeOrder(
      zone,
      order.filter((_, index) => index !== idx)
    );
  const add = (sec) => onChangeOrder(zone, [...order, sec]);

  const handleRowDragStart = (e, idx) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData(
      "application/x-section",
      JSON.stringify({ section: order[idx], fromZone: zone, fromIndex: idx })
    );
    onDragStart?.({ section: order[idx], fromZone: zone, fromIndex: idx });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!draggingInfo) return;

    if (draggingInfo.fromZone === zone) {
      e.dataTransfer.dropEffect = "move";
      setIsOver(true);
      const items = listRef.current?.querySelectorAll("[data-chip-index]");
      if (items) {
        let nearest = order.length;
        for (const item of items) {
          const rect = item.getBoundingClientRect();
          if (e.clientY < rect.top + rect.height / 2) {
            nearest = parseInt(item.dataset.chipIndex, 10);
            break;
          }
        }
        setOverIndex(nearest);
      }
    } else if (canAccept(draggingInfo.section)) {
      e.dataTransfer.dropEffect = "move";
      setIsOver(true);
    } else {
      e.dataTransfer.dropEffect = "none";
    }
  };

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsOver(false);
      setOverIndex(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsOver(false);
    setOverIndex(null);
    const raw = e.dataTransfer.getData("application/x-section");
    if (!raw) return;
    const { section, fromZone, fromIndex } = JSON.parse(raw);

    if (fromZone === zone) {
      if (fromIndex === overIndex || fromIndex === overIndex - 1) return;
      const arr = [...order];
      const [item] = arr.splice(fromIndex, 1);
      const insertAt =
        overIndex != null ? (overIndex > fromIndex ? overIndex - 1 : overIndex) : arr.length;
      arr.splice(insertAt, 0, item);
      onChangeOrder(zone, arr);
    } else {
      if (!canAccept(section)) return;
      onCrossZoneDrop?.({ section, fromZone, fromIndex, toZone: zone });
    }
  };

  const availableSections = [...new Set(poolSections ?? [])].filter((s) =>
    isPercZone ? isPercussion(s) : !isPercussion(s)
  );

  return (
    <div
      className={[
        "border rounded-xl overflow-hidden transition-all duration-150",
        isOver ? "border-indigo-400 shadow-md" : "border-slate-200",
      ].join(" ")}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
        <span className="font-semibold text-sm text-slate-700">{label}</span>
        <span className="text-xs font-bold text-indigo-600">
          {total > 0 ? `${total} músicos` : "sin músicos"}
        </span>
      </div>

      {isDraggingCompatible && (
        <div className="mx-3 mt-2 px-3 py-1.5 rounded-lg text-xs text-center font-medium border border-dashed border-indigo-300 text-indigo-500 bg-indigo-50">
          ↓ Soltar para <strong>copiar</strong> {getSectionLabel(draggingInfo.section)} a {label}{" "}
          (queda también en la zona de origen)
        </div>
      )}

      {fixed ? (
        <div className="px-4 py-3 flex flex-wrap gap-3">
          {order.map((sec, idx) => (
            <span key={`${sec}-${idx}`} className="text-sm text-slate-600">
              {getSectionLabel(sec)}:
              <strong className="ml-1 text-slate-800">{getDistributedCount(sec)}</strong>
            </span>
          ))}
          {order.length === 0 && (
            <span className="text-sm text-slate-400 italic">Sin secciones configuradas.</span>
          )}
        </div>
      ) : (
        <>
          {order.length === 0 && !isDraggingCompatible && (
            <div className="px-4 py-3 text-sm text-slate-400 italic">
              Sin secciones seleccionadas.
            </div>
          )}

          <div ref={listRef}>
            {order.map((sec, idx) => {
              const showInsertLine = isOver && draggingInfo?.fromZone === zone && overIndex === idx;
              const isDraggingThis =
                draggingInfo?.fromZone === zone && draggingInfo?.fromIndex === idx;

              return (
                <React.Fragment key={`${sec}-${idx}`}>
                  {showInsertLine && <div className="h-0.5 bg-indigo-400 rounded-full mx-4" />}
                  <div
                    data-chip-index={idx}
                    draggable
                    onDragStart={(e) => handleRowDragStart(e, idx)}
                    onDragEnd={onDragEnd}
                    className={[
                      "flex items-center gap-2 px-4 py-2 border-b border-slate-50 last:border-b-0 hover:bg-slate-50 transition-colors cursor-grab active:cursor-grabbing select-none",
                      isDraggingThis ? "opacity-30" : "",
                    ].join(" ")}
                  >
                    <span className="text-slate-300 text-xs shrink-0">⠿</span>
                    <span className="text-xs text-slate-300 w-5 text-center font-mono shrink-0">
                      {idx + 1}
                    </span>
                    <span className="flex-1 text-sm text-slate-700">
                      {getSectionLabel(sec)}
                      {chipOccurrences[idx].totalOccurrences > 1 && (
                        <span className="ml-1 text-xs text-slate-400">
                          ({chipOccurrences[idx].occurrenceIdx}/
                          {chipOccurrences[idx].totalOccurrences})
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-slate-400 w-16 text-right tabular-nums shrink-0">
                      ~{getDistributedCount(sec)} mús.
                    </span>
                    <div className="flex gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => moveUp(idx)}
                        disabled={idx === 0}
                        className="w-6 h-6 text-xs flex items-center justify-center border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-25 transition-colors"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveDown(idx)}
                        disabled={idx === order.length - 1}
                        className="w-6 h-6 text-xs flex items-center justify-center border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-25 transition-colors"
                      >
                        ↓
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(idx)}
                      className="text-xs text-slate-300 hover:text-red-400 transition-colors px-1 shrink-0"
                      title="Quitar del bloque"
                    >
                      ✕
                    </button>
                  </div>
                </React.Fragment>
              );
            })}

            {isOver && draggingInfo?.fromZone === zone && overIndex === order.length && (
              <div className="h-0.5 bg-indigo-400 rounded-full mx-4" />
            )}
          </div>

          {availableSections.length > 0 && (
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-1.5">
              <span className="text-xs text-slate-400 self-center mr-1">Agregar:</span>
              {availableSections.map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => add(sec)}
                  className="text-xs px-2 py-0.5 border border-slate-300 rounded-full hover:bg-indigo-50 hover:border-indigo-300 transition-colors text-slate-600"
                >
                  + {getSectionLabel(sec)}
                  {getCount(sec) > 0 && (
                    <span className="ml-1 text-slate-400">
                      ({getCount(sec)} total · {occurrenceMap[sec] || 0}x)
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Zone column presets ───────────────────────────────────────────────────────

const ZONE_COLUMN_PRESETS = {
  FRENTE_ESPECIAL: [2, 3, 4, 5, 6],
  PERCUSION: [4, 5, 6, 7, 8],
  FINAL: [2, 3, 4, 5, 6],
};
const ZONE_ROW_PRESETS = {
  FRENTE_ESPECIAL: [1, 2, 3, 4],
  PERCUSION: [2, 3, 4, 5, 6],
  FINAL: [1, 2, 3, 4],
};
const ZONE_COLUMNS_LABEL = {
  FRENTE_ESPECIAL: "Danza",
  PERCUSION: "Percusión",
  FINAL: "Color Guard",
};

function ZoneLayoutRow({ zone, cols, rows, onChangeCols, onChangeRows }) {
  const colPresets = ZONE_COLUMN_PRESETS[zone] || [2, 3, 4, 5, 6];
  const rowPresets = ZONE_ROW_PRESETS[zone] || [1, 2, 3, 4];
  const label = ZONE_COLUMNS_LABEL[zone] || zone;
  return (
    <div className="py-3 border-b border-slate-50 last:border-b-0 space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-400 w-14 shrink-0">Columnas</span>
          {colPresets.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChangeCols(zone, n)}
              className={[
                "w-8 h-8 rounded-lg border text-xs font-semibold transition-colors",
                cols === n
                  ? "bg-black border-indigo-600 text-white"
                  : "border-slate-300 text-slate-600 hover:border-indigo-400",
              ].join(" ")}
            >
              {n}
            </button>
          ))}
          <input
            type="number"
            min={1}
            max={20}
            value={cols}
            onChange={(e) => onChangeCols(zone, Math.max(1, Number(e.target.value)))}
            className="w-14 border border-slate-300 rounded-lg px-2 py-1 text-xs text-center focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-400 w-14 shrink-0">Filas</span>
          <button
            type="button"
            onClick={() => onChangeRows(zone, null)}
            className={[
              "px-2 h-8 rounded-lg border text-xs font-semibold transition-colors",
              rows == null
                ? "bg-black border-indigo-600 text-white"
                : "border-slate-300 text-slate-600 hover:border-indigo-400",
            ].join(" ")}
          >
            Auto
          </button>
          {rowPresets.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChangeRows(zone, n)}
              className={[
                "w-8 h-8 rounded-lg border text-xs font-semibold transition-colors",
                rows === n
                  ? "bg-black border-indigo-600 text-white"
                  : "border-slate-300 text-slate-600 hover:border-indigo-400",
              ].join(" ")}
            >
              {n}
            </button>
          ))}
          <input
            type="number"
            min={1}
            max={20}
            value={rows ?? ""}
            placeholder="Auto"
            onChange={(e) => {
              const v = e.target.value;
              onChangeRows(zone, v === "" ? null : Math.max(1, Number(v)));
            }}
            className="w-14 border border-slate-300 rounded-lg px-2 py-1 text-xs text-center focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      </div>
    </div>
  );
}

// ── Paso 1 — Configurar ───────────────────────────────────────────────────────

function StepConfig({
  formName,
  setFormName,
  formType,
  setFormType,
  columns,
  setColumns,
  zoneColumns,
  onChangeZoneColumns,
  zoneRows,
  onChangeZoneRows,
  templates,
  onLoadTemplate,
  onNext,
}) {
  const canNext = formName.trim() && columns >= 1;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <label htmlFor="formation-name" className="block text-xs font-medium text-slate-500 mb-1">
            Nombre *
          </label>
          <input
            id="formation-name"
            type="text"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="Ej: Formación filas de 8"
            className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div className="block text-xs font-medium text-slate-500 mb-2">Tipo de desfile</div>
          <div className="flex gap-3">
            {[
              { v: "SINGLE", label: "Bloque único" },
              { v: "DOUBLE", label: "Doble hacia atrás" },
            ].map(({ v, label }) => (
              <label
                key={v}
                className={[
                  "flex-1 border-2 rounded-xl p-3 cursor-pointer transition-colors text-sm",
                  formType === v
                    ? "border-gray-500 bg-indigo-50 font-semibold text-black"
                    : "border-slate-200 text-slate-600 hover:border-slate-300",
                ].join(" ")}
              >
                <input
                  type="radio"
                  value={v}
                  checked={formType === v}
                  onChange={() => setFormType(v)}
                  className="sr-only"
                />
                {label}
              </label>
            ))}
          </div>
          {formType === "DOUBLE" && (
            <p className="mt-2 text-xs text-slate-400">
              Frente → Bloque Frente → Percusión → Bloque Atrás → Final
            </p>
          )}
        </div>

        <div>
          <div className="block text-xs font-medium text-slate-500 mb-2">
            Columnas de vientos *
            <span className="ml-1 font-normal text-slate-400">(Bloque Frente y Atrás)</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {[5, 6, 7, 8, 9, 10].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setColumns(n)}
                className={[
                  "w-9 h-9 rounded-lg border text-sm font-semibold transition-colors",
                  columns === n
                    ? "bg-black border-indigo-600 text-white"
                    : "border-slate-300 text-slate-600 hover:border-indigo-400",
                ].join(" ")}
              >
                {n}
              </button>
            ))}
            <input
              type="number"
              min={1}
              max={20}
              value={columns}
              onChange={(e) => setColumns(Math.max(1, Number(e.target.value)))}
              className="w-16 border border-slate-300 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </div>
      </div>

      <div>
        <div className="block text-xs font-medium text-slate-500 mb-2">
          Grilla independiente
          <span className="ml-1 font-normal text-slate-400">
            — Danza, Percusión y Color Guard tienen columnas y filas propias
          </span>
        </div>
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
            <span className="text-xs text-slate-400 uppercase tracking-wide font-semibold">
              Zona · Columnas · Filas
            </span>
          </div>
          <div className="px-4">
            {INDEPENDENT_COLUMN_ZONES.map((zone) => (
              <ZoneLayoutRow
                key={zone}
                zone={zone}
                cols={zoneColumns[zone] ?? DEFAULT_ZONE_COLUMNS[zone]}
                rows={zoneRows[zone] ?? DEFAULT_ZONE_ROWS[zone]}
                onChangeCols={onChangeZoneColumns}
                onChangeRows={onChangeZoneRows}
              />
            ))}
          </div>
        </div>
      </div>

      {templates.length > 0 && (
        <div>
          <label
            htmlFor="formation-template"
            className="block text-xs font-medium text-slate-500 mb-1"
          >
            Cargar desde plantilla (opcional)
          </label>
          <select
            id="formation-template"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) onLoadTemplate(e.target.value);
            }}
            className="border border-slate-300 rounded-xl px-3 py-2 text-sm w-full sm:w-80 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">— Seleccioná una plantilla —</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <button
        onClick={onNext}
        disabled={!canNext}
        className="px-5 py-2 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors"
      >
        Configurar orden de secciones →
      </button>
    </div>
  );
}

// ── Paso 2 — Orden por zona ───────────────────────────────────────────────────

function StepZoneOrder({
  formType,
  zoneOrders: zoneOrdersProp,
  zonePools,
  onChangeOrder,
  sections: sectionsProp,
  loading,
  excluded: excludedProp,
  onNext,
}) {
  const sections = sectionsProp ?? [];
  const zoneOrders = zoneOrdersProp ?? {};
  const excluded = excludedProp ?? new Set();

  const [draggingInfo, setDraggingInfo] = useState(null);

  const handleDragStart = useCallback((info) => setDraggingInfo(info), []);
  const handleDragEnd = useCallback(() => setDraggingInfo(null), []);

  const handleCrossZoneDrop = useCallback(
    ({ section, fromZone, fromIndex, toZone }) => {
      const newTo = [...(zoneOrders[toZone] || []), section];
      onChangeOrder(toZone, newTo);
      setDraggingInfo(null);
    },
    [zoneOrders, onChangeOrder]
  );

  const allSections = useMemo(() => sections.map((g) => g.section), [sections]);

  const unplacedSections = useMemo(() => {
    const placed = new Set(Object.values(zoneOrders).flat());
    return allSections.filter((s) => !placed.has(s));
  }, [allSections, zoneOrders]);

  const memberCountsByZone = useMemo(
    () => buildMemberCounts(zoneOrders, sections, excluded),
    [zoneOrders, sections, excluded]
  );

  const totalActive = useMemo(() => {
    const unique = new Set();
    for (const grp of sections) {
      for (const m of grp.members) {
        if (!excluded.has(m.userId)) unique.add(m.userId);
      }
    }
    return unique.size;
  }, [sections, excluded]);

  const getPoolForZone = (zoneKey) => {
    const isPercZone = zoneKey === "PERCUSION";
    return allSections.filter((s) => (isPercZone ? isPercussion(s) : !isPercussion(s)));
  };

  const sharedEditorProps = {
    sections,
    excluded,
    draggingInfo,
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
    onCrossZoneDrop: handleCrossZoneDrop,
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Configurá el orden de las secciones en cada zona o bloque. <strong>Arrastrá</strong> una
        sección a otra zona para <strong>copiarla</strong> — quedará en ambas y los músicos se
        dividen automáticamente.
      </p>

      {loading && <div className="text-slate-400 text-sm text-center py-4">Cargando músicos…</div>}

      {!loading && sections.length === 0 && (
        <div className="text-slate-400 text-sm text-center py-4">
          No se encontraron músicos. Verificá la configuración de secciones.
        </div>
      )}

      {!loading && sections.length > 0 && (
        <>
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-mono flex-wrap">
            <span className="text-slate-400 uppercase tracking-wider text-[10px]">
              Total activos
            </span>
            <span className="font-bold">{totalActive}</span>
            {[
              "FRENTE_ESPECIAL",
              "BLOQUE_FRENTE",
              "PERCUSION",
              ...(formType === "DOUBLE" ? ["BLOQUE_ATRAS"] : []),
              "FINAL",
            ].map((zk) => {
              const count = Object.values(memberCountsByZone[zk] || {}).reduce((a, b) => a + b, 0);
              if (!count) return null;
              return (
                <span key={zk} className="text-slate-300">
                  {zk.replace("_", " ")}: <strong className="text-white">{count}</strong>
                </span>
              );
            })}
          </div>

          <SectionOrderEditor
            zone="FRENTE_ESPECIAL"
            label="Frente"
            order={zoneOrders.FRENTE_ESPECIAL || []}
            onChangeOrder={onChangeOrder}
            poolSections={getPoolForZone("FRENTE_ESPECIAL")}
            {...sharedEditorProps}
          />
          <SectionOrderEditor
            zone="BLOQUE_FRENTE"
            label={formType === "DOUBLE" ? "Bloque del Frente" : "Bloque Principal"}
            order={zoneOrders.BLOQUE_FRENTE || []}
            onChangeOrder={onChangeOrder}
            poolSections={getPoolForZone("BLOQUE_FRENTE")}
            {...sharedEditorProps}
          />
          <SectionOrderEditor
            zone="PERCUSION"
            label="Percusión (Centro)"
            order={zoneOrders.PERCUSION || []}
            onChangeOrder={onChangeOrder}
            poolSections={getPoolForZone("PERCUSION")}
            {...sharedEditorProps}
          />
          {formType === "DOUBLE" && (
            <SectionOrderEditor
              zone="BLOQUE_ATRAS"
              label="Bloque de Atrás"
              order={zoneOrders.BLOQUE_ATRAS || []}
              onChangeOrder={onChangeOrder}
              poolSections={getPoolForZone("BLOQUE_ATRAS")}
              {...sharedEditorProps}
            />
          )}
          <SectionOrderEditor
            zone="FINAL"
            label="Final"
            order={zoneOrders.FINAL || []}
            onChangeOrder={onChangeOrder}
            poolSections={getPoolForZone("FINAL")}
            {...sharedEditorProps}
          />

          {unplacedSections.length > 0 && (
            <div className="border border-amber-200 bg-amber-50 rounded-xl px-4 py-3">
              <div className="text-xs font-semibold text-amber-700 mb-1.5">
                ⚠ {unplacedSections.length} sección(es) sin zona — no aparecerán en la formación
              </div>
              <div className="flex flex-wrap gap-1.5">
                {unplacedSections.map((sec) => (
                  <span
                    key={sec}
                    className="text-xs bg-white border border-amber-200 rounded-full px-2.5 py-0.5 text-amber-700 font-medium"
                  >
                    {getSectionLabel(sec)}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={onNext}
            className="px-5 py-2 bg-black text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            Excluir músicos →
          </button>
        </>
      )}
    </div>
  );
}

// ── Paso 3 — Excluir ──────────────────────────────────────────────────────────

function StepExclude({ sections, excluded, onToggle, onNext }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Desmarcá los músicos que <strong>no participarán</strong> en este desfile.
      </p>
      {sections.map((grp) => {
        const included = grp.members.filter((m) => !excluded.has(m.userId));
        const excludedN = grp.members.length - included.length;
        return (
          <div key={grp.section} className="overflow-hidden">
            <div className="px-4 py-2 flex items-center justify-between border-b">
              <span className="text-sm font-semibold text-slate-700">
                {getSectionLabel(grp.section)}
              </span>
              <span className="text-xs text-slate-400">
                {included.length}/{grp.members.length}
                {excludedN > 0 && (
                  <span className="ml-1 text-amber-500 font-medium">
                    ({excludedN} excluido{excludedN !== 1 ? "s" : ""})
                  </span>
                )}
              </span>
            </div>
            <div className="divide-y divide-slate-50 max-h-48 overflow-y-auto">
              {grp.members.map((m) => {
                const isExcluded = excluded.has(m.userId);
                return (
                  <label
                    key={m.userId}
                    className={[
                      "flex items-center gap-3 px-4 py-1.5 cursor-pointer hover:bg-slate-50 transition-colors",
                      isExcluded ? "opacity-40" : "",
                    ].join(" ")}
                  >
                    <input
                      type="checkbox"
                      checked={!isExcluded}
                      onChange={() => onToggle(m.userId)}
                      className="accent-black w-4 h-4 shrink-0"
                    />
                    {m.avatar ? (
                      <img
                        src={m.avatar}
                        alt={m.name}
                        loading="lazy"
                        className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 border border-slate-200 shrink-0 flex items-center justify-center text-[10px] font-bold">
                        {m.name
                          ?.split(/\s+/)
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((part) => part[0])
                          .join("")
                          .toUpperCase() || "?"}
                      </div>
                    )}
                    <span className="text-sm text-slate-700 flex-1">{m.name}</span>
                    {m.instrument && <span className="text-xs text-slate-400">{m.instrument}</span>}
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
      {sections.length === 0 && (
        <div className="text-slate-400 text-sm text-center py-8">
          No hay músicos cargados. Volvé al paso anterior.
        </div>
      )}
      <button
        onClick={onNext}
        className="px-5 py-2 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors"
      >
        Calcular formación →
      </button>
    </div>
  );
}

// ── ExcludedModal ─────────────────────────────────────────────────────────────

function initials(name) {
  return String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

/**
 * Modal listing all excluded musicians. Each row has an "+ Incluir" button
 * that cascades the musician back into the grid right after their section peers.
 */
function ExcludedModal({ open, onClose, excluded, sections, existingFormationSlots, onInclude }) {
  const excludedMusicians = useMemo(() => {
    const result = [];
    const seen = new Set();
    for (const userId of excluded) {
      if (seen.has(userId)) continue;
      seen.add(userId);
      let found = null;
      for (const grp of sections || []) {
        const m = grp.members.find((mb) => String(mb.userId) === String(userId));
        if (m) {
          found = { userId, name: m.name, avatar: m.avatar || null, section: grp.section };
          break;
        }
      }
      if (!found && existingFormationSlots) {
        const s = existingFormationSlots.find((sl) => String(sl.userId) === String(userId));
        if (s)
          found = { userId, name: s.displayName, avatar: s.avatar || null, section: s.section };
      }
      result.push(found || { userId, name: `ID ${userId}`, avatar: null, section: null });
    }
    result.sort((a, b) => {
      const sa = a.section || "ZZZ",
        sb = b.section || "ZZZ";
      return sa.localeCompare(sb) || (a.name || "").localeCompare(b.name || "");
    });
    return result;
  }, [excluded, sections, existingFormationSlots]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  // Group by section
  const bySec = {};
  for (const m of excludedMusicians) {
    const key = m.section || "__none__";
    if (!bySec[key]) bySec[key] = [];
    bySec[key].push(m);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Músicos excluidos</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {excludedMusicians.length} excluido{excludedMusicians.length !== 1 ? "s" : ""} ·
              Presioná + Incluir para reincorporar
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 px-2 py-2">
          {Object.entries(bySec).map(([sec, members]) => (
            <div key={sec} className="mb-1">
              {/* Section label */}
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {sec === "__none__" ? "Sin sección" : getSectionLabel(sec)}
              </div>
              {/* Musician rows */}
              {members.map((m) => (
                <div
                  key={m.userId}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  {m.avatar ? (
                    <img
                      src={m.avatar}
                      alt={m.name}
                      loading="lazy"
                      className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-600 shrink-0 flex items-center justify-center text-[10px] font-bold">
                      {initials(m.name)}
                    </div>
                  )}
                  <span className="flex-1 text-sm text-slate-800 font-medium">{m.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      onInclude(m.userId);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors shrink-0"
                  >
                    + Incluir
                  </button>
                </div>
              ))}
            </div>
          ))}
          {excludedMusicians.length === 0 && (
            <div className="py-10 text-center text-sm text-slate-400">
              No hay músicos excluidos.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 shrink-0 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function FormationBuilderPage({ formation: existingFormation }) {
  const navigate = useNavigate();
  const isEdit = !!existingFormation;
  const isConflictError = (error) =>
    error?.graphQLErrors?.some((graphQLError) => graphQLError?.extensions?.code === "CONFLICT") ||
    error?.networkError?.result?.errors?.some(
      (graphQLError) => graphQLError?.extensions?.code === "CONFLICT"
    );

  const { data: userData } = useQuery(GET_USERS_BY_ID);
  const userRole = userData?.getUser?.role;
  const isAdmin = FORMATION_ADMIN_ROLES.has(userRole);
  const canExport = userRole === "Admin";

  const { sections, unmapped, loading: loadingUsers, loadUsers } = useFormationUsers();
  const {
    handleCreate,
    handleUpdate,
    saving,
    toast: saveToast,
    setToast: setSaveToast,
  } = useFormationBuilder();
  const { templates } = useFormationTemplates();

  // ── Global state ──────────────────────────────────────────────────────────

  const [step, setStep] = useState(isEdit ? 4 : 1);

  useEffect(() => {
    if (userRole && !isAdmin) setStep(4);
  }, [userRole, isAdmin]);

  const [formName, setFormName] = useState(existingFormation?.name || "");
  const [formType, setFormType] = useState(existingFormation?.type || "SINGLE");
  const [columns, setColumns] = useState(existingFormation?.columns ?? 8);
  const [formNotes, setFormNotes] = useState(existingFormation?.notes || "");
  const [latestUpdatedAt, setLatestUpdatedAt] = useState(existingFormation?.updatedAt ?? null);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [showExcludedModal, setShowExcludedModal] = useState(false);

  const [zoneOrders, setZoneOrders] = useState(() => {
    const base = { ...DEFAULT_ZONE_ORDERS };
    if (isEdit && existingFormation.zoneOrders?.length) {
      for (const zo of existingFormation.zoneOrders) {
        base[zo.zone] = zo.sectionOrder;
      }
    }
    return base;
  });

  const [zoneColumns, setZoneColumns] = useState(() => {
    const base = { ...DEFAULT_ZONE_COLUMNS };
    if (isEdit && existingFormation?.zoneColumns?.length) {
      for (const zc of existingFormation.zoneColumns) {
        base[zc.zone] = zc.columns;
      }
    }
    return base;
  });

  const handleZoneColumnsChange = useCallback((zone, value) => {
    setZoneColumns((prev) => ({ ...prev, [zone]: value }));
  }, []);

  const [zoneRows, setZoneRows] = useState(() => {
    const base = { ...DEFAULT_ZONE_ROWS };
    if (isEdit && existingFormation?.zoneColumns?.length) {
      for (const zc of existingFormation.zoneColumns) {
        if (zc.rows != null) base[zc.zone] = zc.rows;
      }
    }
    return base;
  });

  const handleZoneRowsChange = useCallback((zone, value) => {
    setZoneRows((prev) => ({ ...prev, [zone]: value }));
  }, []);

  const [excluded, setExcluded] = useState(
    () => new Set((existingFormation?.excludedUserIds || []).map(String))
  );
  const [slots, setSlots] = useState(existingFormation?.slots || []);

  // ── Load users ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isEdit) loadUsers({ excludedIds: [], instrumentMappings: [] });
  }, []); // eslint-disable-line

  const handleGoToStep2 = useCallback(() => {
    loadUsers({ excludedIds: [], instrumentMappings: [] });
    setStep(2);
  }, [loadUsers]);

  // ── Zone order management ─────────────────────────────────────────────────

  const handleZoneOrderChange = useCallback((zone, newOrder) => {
    setZoneOrders((prev) => ({ ...prev, [zone]: newOrder }));
  }, []);

  const zonePools = useMemo(
    () =>
      buildDynamicZonePools({
        sections,
        zoneOrders,
        type: formType,
      }),
    [sections, zoneOrders, formType]
  );

  useEffect(() => {
    setZoneOrders((prev) => {
      const next = mergeZoneOrdersWithPools(prev, zonePools);
      const merged = { ...prev };
      for (const zone of Object.keys(next)) {
        if (!prev[zone] || prev[zone].length === 0) {
          merged[zone] = next[zone];
        }
      }
      const changed = Object.keys(merged).some((zone) => {
        const prevOrder = prev[zone] || [];
        const nextOrder = merged[zone] || [];
        return (
          prevOrder.length !== nextOrder.length ||
          prevOrder.some((section, index) => section !== nextOrder[index])
        );
      });
      return changed ? merged : prev;
    });
  }, [zonePools]);

  const handleLoadTemplate = useCallback(
    (tplId) => {
      const tpl = templates.find((t) => t.id === tplId);
      if (!tpl) return;
      if (tpl.defaultColumns) setColumns(tpl.defaultColumns);
      if (tpl.zoneOrders?.length) {
        setZoneOrders((prev) => {
          const next = { ...prev };
          for (const zo of tpl.zoneOrders) next[zo.zone] = zo.sectionOrder;
          return next;
        });
      }
      if (tpl.zoneColumns?.length) {
        setZoneColumns((prev) => {
          const next = { ...prev };
          for (const zc of tpl.zoneColumns) next[zc.zone] = zc.columns;
          return next;
        });
        setZoneRows((prev) => {
          const next = { ...prev };
          for (const zc of tpl.zoneColumns) {
            if (zc.rows != null) next[zc.zone] = zc.rows;
          }
          return next;
        });
      }
    },
    [templates]
  );

  // ── Exclusions ────────────────────────────────────────────────────────────

  const handleToggleExclude = useCallback((userId) => {
    const id = String(userId);
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  /**
   * Called from the grid (step 4): exclude a musician directly and compact
   * the grid in-place — no full recompute, all positions preserved.
   */
  /**
   * Called from the grid (step 4): exclude a musician directly and compact
   * the grid in-place — no full recompute, all positions preserved.
   */
  const handleExcludeFromGrid = useCallback((userId) => {
    const id = String(userId);
    setExcluded((prev) => {
      const next = new Set(prev);
      next.add(id);
      setSlots((currentSlots) => removeAndCompact(currentSlots, next));
      return next;
    });
  }, []);

  /**
   * Called from the excluded-musicians panel (step 4): re-insert a musician
   * into the grid, pushing everyone after them one position back.
   */
  const handleIncludeToGrid = useCallback(
    (userId) => {
      const id = String(userId);

      // Find musician info from sections (loaded users)
      let musicianInfo = null;
      for (const grp of sections) {
        const m = grp.members.find((mb) => String(mb.userId) === id);
        if (m) {
          musicianInfo = {
            userId: id,
            displayName: m.name,
            avatar: m.avatar || null,
            section: grp.section,
          };
          break;
        }
      }

      // Fallback: scan existing excluded slot data stored on the formation
      if (!musicianInfo) {
        // sections may not be loaded yet in pure edit mode — try from existingFormation slots
        if (existingFormation?.slots) {
          const s = existingFormation.slots.find((sl) => String(sl.userId) === id);
          if (s)
            musicianInfo = {
              userId: id,
              displayName: s.displayName,
              avatar: s.avatar || null,
              section: s.section,
            };
        }
      }

      if (!musicianInfo) return;

      setExcluded((prev) => {
        const next = new Set(prev);
        next.delete(id);
        setSlots((currentSlots) =>
          includeAndExpand(currentSlots, musicianInfo, zoneOrders, zoneColumns, columns)
        );
        return next;
      });
    },
    [sections, existingFormation, zoneOrders, zoneColumns, columns]
  );

  // ── Compute grid (full recompute — used in step 3 → 4) ───────────────────

  const handleComputeGrid = useCallback(() => {
    const zoneData = buildZones({
      zoneOrders,
      sectionGroups: sections,
      excludedIds: excluded,
      type: formType,
    });
    const computed = computeFormation({
      zoneData,
      columns,
      zoneColumns,
      zoneRows,
      existingSlots: slots,
    });
    setSlots(computed);
    setStep(4);
  }, [zoneOrders, sections, excluded, formType, columns, zoneColumns, zoneRows, slots]);

  // ── Build inputs ──────────────────────────────────────────────────────────

  const buildZoneMemberCounts = useCallback(() => {
    const countMap = {};
    for (const s of slots) {
      if (s.userId) countMap[s.zone] = (countMap[s.zone] || 0) + 1;
    }
    return Object.entries(countMap).map(([zone, count]) => ({ zone, count }));
  }, [slots]);

  const buildZoneOrdersInput = useCallback(
    () =>
      Object.entries(zoneOrders).map(([zone, sectionOrder]) => ({
        zone,
        sectionOrder,
      })),
    [zoneOrders]
  );

  const buildZoneColumnsInput = useCallback(
    () =>
      Object.entries(zoneColumns).map(([zone, cols]) => ({
        zone,
        columns: cols,
        ...(zoneRows[zone] != null ? { rows: zoneRows[zone] } : {}),
      })),
    [zoneColumns, zoneRows]
  );

  const buildSlotInput = useCallback(
    () =>
      slots.map((s) => ({
        zone: s.zone,
        row: s.row,
        col: s.col,
        section: s.section || null,
        userId: s.userId || null,
        displayName: s.displayName || null,
        avatar: s.avatar || null,
        locked: s.locked ?? false,
      })),
    [slots]
  );

  const saveExistingFormation = useCallback(
    async (input) => {
      const updated = await handleUpdate(existingFormation.id, input);
      if (updated) {
        setLatestUpdatedAt(updated.updatedAt ?? null);
        setShowConflictModal(false);
        setSaveToast({ message: "Formación actualizada", type: "success" });
      }
      return updated;
    },
    [existingFormation?.id, handleUpdate, setSaveToast]
  );

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!formName.trim()) {
      setSaveToast({ message: "Ingresá un nombre", type: "error" });
      return;
    }
    const zoneMemberCounts = buildZoneMemberCounts();
    const zoneOrdersInput = buildZoneOrdersInput();
    const zoneColumnsInput = buildZoneColumnsInput();
    const slotInput = buildSlotInput();

    try {
      if (isEdit) {
        const updateInput = {
          name: formName.trim(),
          notes: formNotes.trim() || null,
          columns,
          expectedUpdatedAt: latestUpdatedAt ?? null,
          excludedUserIds: [...excluded],
          zoneOrders: zoneOrdersInput,
          zoneColumns: zoneColumnsInput,
          slots: slotInput,
          zoneMemberCounts,
        };
        await saveExistingFormation(updateInput);
      } else {
        const created = await handleCreate({
          name: formName.trim(),
          date: new Date(),
          type: formType,
          columns,
          zoneOrders: zoneOrdersInput,
          zoneColumns: zoneColumnsInput,
          instrumentMappings: [],
          excludedUserIds: [...excluded],
          slots: slotInput,
          zoneMemberCounts,
          notes: formNotes.trim() || null,
        });
        if (created?.id) navigate("/formations");
      }
    } catch (e) {
      if (isConflictError(e) && isEdit) {
        setShowConflictModal(true);
      }
    }
  };

  const handleExport = useCallback(() => {
    if (!canExport) return;
    openFormationPrint({ slots, columns, zoneColumns, formName, formType });
  }, [canExport, slots, columns, zoneColumns, formName, formType]);

  // ── Render ────────────────────────────────────────────────────────────────

  const STEPS = [
    { n: 1, label: "Configurar" },
    { n: 2, label: "Orden" },
    { n: 3, label: "Excluir" },
    { n: 4, label: "Formación" },
  ];

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <div className="space-y-5 pb-16">
        <ConflictModal open={showConflictModal} onReload={() => window.location.reload()} />
        {saveToast && (
          <Toast
            message={saveToast.message}
            type={saveToast.type}
            onClose={() => setSaveToast(null)}
          />
        )}

        {/* Header */}
        <div className="max-w-6xl mx-auto mb-5 flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate("/formations")}
              className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mb-1"
            >
              ← Formaciones
            </button>
            <h1 className="text-2xl font-bold text-slate-800">
              {isEdit ? `Editar: ${existingFormation.name}` : "Nueva formación de desfile"}
            </h1>
          </div>
          {step === 4 && (
            <div className="flex gap-2">
              {canExport && (
                <button
                  onClick={handleExport}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl text-sm hover:bg-slate-100"
                >
                  ↗ Exportar
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 bg-black text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </div>
          )}
        </div>

        {/* Step progress */}
        {isAdmin && (
          <div className="max-w-6xl mx-auto mb-8 px-1">
            <div className="flex items-center gap-0">
              {STEPS.map(({ n, label }, idx) => (
                <React.Fragment key={n}>
                  <div className="flex items-center gap-2.5 group">
                    <div
                      className={`
                        w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold tracking-tight transition-all duration-300
                        ${
                          step > n
                            ? "bg-black text-white"
                            : step === n
                            ? "bg-black text-white ring-4 ring-black/10"
                            : "bg-transparent border border-slate-300 text-slate-400"
                        }
                      `}
                    >
                      {step > n ? (
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                          <path
                            d="M1.5 4L3.2 5.7L6.5 2.3"
                            stroke="white"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : (
                        n
                      )}
                    </div>
                    <span
                      className={`text-[11px] font-medium tracking-wide uppercase transition-colors duration-200 whitespace-nowrap
                        ${
                          step === n ? "text-black" : step > n ? "text-slate-400" : "text-slate-300"
                        }
                      `}
                    >
                      {label}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-px mx-3 min-w-6 transition-colors duration-300 ${
                        step > n ? "bg-black" : "bg-slate-200"
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Step content */}
        <div className="max-w-6xl mx-auto bg-white rounded-2xl border border-slate-200 p-6">
          {step === 1 && isAdmin && (
            <StepConfig
              formName={formName}
              setFormName={setFormName}
              formType={formType}
              setFormType={setFormType}
              columns={columns}
              setColumns={setColumns}
              zoneColumns={zoneColumns}
              onChangeZoneColumns={handleZoneColumnsChange}
              zoneRows={zoneRows}
              onChangeZoneRows={handleZoneRowsChange}
              templates={templates}
              onLoadTemplate={handleLoadTemplate}
              onNext={handleGoToStep2}
            />
          )}

          {step === 2 && isAdmin && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <StepBadge n={2} active done={false} />
                <h2 className="font-semibold text-slate-700">Orden de secciones por zona</h2>
              </div>
              <StepZoneOrder
                formType={formType}
                zoneOrders={zoneOrders}
                zonePools={zonePools}
                onChangeOrder={handleZoneOrderChange}
                sections={sections}
                loading={loadingUsers}
                excluded={excluded}
                onNext={() => setStep(3)}
              />
            </>
          )}

          {step === 3 && isAdmin && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <StepBadge n={3} active done={false} />
                <h2 className="font-semibold text-slate-700">Excluir músicos</h2>
              </div>
              <StepExclude
                sections={sections}
                excluded={excluded}
                onToggle={handleToggleExclude}
                onNext={handleComputeGrid}
              />
            </>
          )}

          {step === 4 && (
            <>
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <StepBadge n={4} active done={false} />
                <h2 className="font-semibold text-slate-700">Formación</h2>
                <span className="text-xs text-slate-400 hidden sm:inline">
                  {columns} cols
                  {formType === "DOUBLE" ? " · Doble hacia atrás" : " · Bloque único"}
                  {" · Arrastrá para mover · 🔒 para bloquear · Clic derecho para opciones"}
                </span>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setShowExcludedModal(true)}
                    className={[
                      "ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors",
                      excluded.size > 0
                        ? "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                        : "border-slate-200 text-slate-400 cursor-default",
                    ].join(" ")}
                    disabled={excluded.size === 0}
                    title={
                      excluded.size === 0 ? "No hay músicos excluidos" : "Ver músicos excluidos"
                    }
                  >
                    <span>{excluded.size > 0 ? "⚠" : "✓"}</span>
                    {excluded.size > 0
                      ? `${excluded.size} excluido${excluded.size !== 1 ? "s" : ""}`
                      : "Todos incluidos"}
                  </button>
                )}
              </div>

              {/* Notes */}
              <div className="mb-4 max-w-sm">
                <label
                  htmlFor="formation-notes"
                  className="block text-xs font-medium text-slate-500 mb-1"
                >
                  Notas (opcional)
                </label>
                <input
                  id="formation-notes"
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Observaciones adicionales"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <ExcludedModal
                open={showExcludedModal}
                onClose={() => setShowExcludedModal(false)}
                excluded={excluded}
                sections={sections}
                existingFormationSlots={existingFormation?.slots}
                onInclude={handleIncludeToGrid}
              />

              <div className="overflow-hidden">
                <FormationGrid
                  slots={slots}
                  columns={columns}
                  zoneColumns={zoneColumns}
                  onChange={setSlots}
                  zoneOrders={zoneOrders}
                  canExclude={isAdmin}
                  onExclude={handleExcludeFromGrid}
                />
              </div>

              <div className="mt-4 flex items-center gap-2 flex-wrap">
                {isAdmin && !isEdit && (
                  <button
                    onClick={() => setStep(3)}
                    className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl text-sm hover:bg-slate-50"
                  >
                    ← Exclusiones
                  </button>
                )}
                {isAdmin && (
                  <button
                    onClick={() => setStep(2)}
                    className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl text-sm hover:bg-slate-50"
                  >
                    ← Orden de zonas
                  </button>
                )}
                {isAdmin && sections.length > 0 && (
                  <button
                    onClick={handleComputeGrid}
                    className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl text-sm hover:bg-slate-50"
                  >
                    ↺ Recalcular (respeta bloqueos)
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-5 py-2 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-700 disabled:opacity-50"
                >
                  {saving ? "Guardando…" : "Guardar formación"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

FormationBuilderPage.defaultProps = { formation: null };
