/* eslint-disable react/prop-types */
/**
 * FormationBuilderPage.jsx — 4-step wizard
 *
 * Paso 1 — Configurar
 *   nombre · fecha · tipo (SINGLE/DOUBLE) · columnas globales · plantilla opcional
 *
 * Paso 2 — Orden por zona
 *   Configura el orden de secciones en cada zona/bloque.
 *   Muestra conteos de músicos en tiempo real.
 *   Secciones reordenables con drag & drop dentro y entre zonas.
 *
 * Paso 3 — Excluir
 *   Checkbox por músico para quitarlo de esta formación concreta.
 *
 * Paso 4 — Formación
 *   Grid visual por zonas · drag & drop · lock · recalcular · guardar.
 *
 * Layout model:
 *   - Vertical por profundidad: Frente → Percusión → Atrás
 *   - Una columna global para toda la formación
 *   - Secciones configurables por zona (no hardcodeadas)
 *   - DOUBLE: miembros de BLOQUE_FRENTE/ATRAS se dividen por sección
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
} from "./formationEngine.js";
import { openFormationPrint } from "./formationPrint.js";
import { GET_USERS_BY_ID } from "graphql/queries";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

const FORMATION_ADMIN_ROLES = new Set(["Admin", "Director", "Subdirector", "Dirección Logística"]);

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

// ── Paso 2 helpers ────────────────────────────────────────────────────────────

/**
 * Sections that belong only in the PERCUSION zone.
 * Keys must match exactly what formationEngine.js uses in ZONE_POOL_SECTIONS.
 */
const PERCUSSION_SECTIONS = new Set([
  "MALLETS",
  "PERCUSION", // engine key (sin H)
  "PERCUSSION", // alias por si el backend manda con H
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

/**
 * For each zone, compute how many active members each section contributes.
 * If a section appears N times across all zones, its members are split equally.
 */
function buildMemberCounts(zoneOrders, sections, excluded) {
  const safeZoneOrders = zoneOrders ?? {};
  const safeSections = sections ?? [];
  const safeExcluded = excluded ?? new Set();

  // Count total appearances of each section across ALL zones
  const globalAppearances = {};
  for (const order of Object.values(safeZoneOrders)) {
    for (const sec of order) {
      globalAppearances[sec] = (globalAppearances[sec] || 0) + 1;
    }
  }

  // Active member count per section
  const activeCounts = {};
  for (const grp of safeSections) {
    activeCounts[grp.section] = grp.members.filter((m) => !safeExcluded.has(m.userId)).length;
  }

  // Per-zone, per-section counts
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

/**
 * Renders a drag-and-drop sortable list of sections for one zone.
 * - Drag handle to reorder within zone
 * - ✕ to remove from this zone's order
 * - "+ Section" chips to add (from compatible pool)
 * - Accepts cross-zone drops if section is compatible
 * - Pool semi-flexible: percussion only in PERCUSION zone, winds/guards elsewhere
 */
function SectionOrderEditor({
  zone,
  label,
  order,
  onChangeOrder,
  sections,
  excluded,
  poolSections,
  fixed = false,
  // Drag & drop cross-zone
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

  // Build occurrence maps for distributed count display
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

  // Per-chip occurrence index (for "(1/2)" labels when section appears multiple times)
  const totalOccurrencesMap = {};
  for (const sec of order) {
    totalOccurrencesMap[sec] = (totalOccurrencesMap[sec] || 0) + 1;
  }
  const seenCount = {};
  const chipOccurrences = order.map((sec) => {
    seenCount[sec] = (seenCount[sec] || 0) + 1;
    return { occurrenceIdx: seenCount[sec], totalOccurrences: totalOccurrencesMap[sec] };
  });

  // ── Reorder within zone ───────────────────────────────────────────────────

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

  // ── Drag handlers ─────────────────────────────────────────────────────────

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
      // Reorder within zone
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
      // Reorder within zone
      if (fromIndex === overIndex || fromIndex === overIndex - 1) return;
      const arr = [...order];
      const [item] = arr.splice(fromIndex, 1);
      const insertAt =
        overIndex != null ? (overIndex > fromIndex ? overIndex - 1 : overIndex) : arr.length;
      arr.splice(insertAt, 0, item);
      onChangeOrder(zone, arr);
    } else {
      // Cross-zone drop
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

      {/* Cross-zone drop hint */}
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
                    {/* Drag handle */}
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

            {/* Insert line at end */}
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

// ── Paso 1 — Configurar ───────────────────────────────────────────────────────

// ── ZoneColumnsRow — inline component for per-zone column picker ──────────────

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
      {/* Name */}
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

      {/* Type + wind columns */}
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

      {/* Independent zone layout (columns + rows) */}
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

      {/* Template loader */}
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

  // Shared dragging state — lifted here so all editors can see it
  const [draggingInfo, setDraggingInfo] = useState(null);

  const handleDragStart = useCallback((info) => setDraggingInfo(info), []);
  const handleDragEnd = useCallback(() => setDraggingInfo(null), []);

  // Cross-zone drop: COPY to target (keep in source) so a section can appear in multiple zones.
  // If user wants to truly move it, they can ✕ it from the source zone manually.
  const handleCrossZoneDrop = useCallback(
    ({ section, fromZone, fromIndex, toZone }) => {
      // Only append to target — do NOT remove from source
      const newTo = [...(zoneOrders[toZone] || []), section];
      onChangeOrder(toZone, newTo);
      setDraggingInfo(null);
    },
    [zoneOrders, onChangeOrder]
  );

  // All section keys that exist in the data
  const allSections = useMemo(() => sections.map((g) => g.section), [sections]);

  // Sections not placed in any zone (warning)
  const unplacedSections = useMemo(() => {
    const placed = new Set(Object.values(zoneOrders).flat());
    return allSections.filter((s) => !placed.has(s));
  }, [allSections, zoneOrders]);

  // Build live member counts per zone
  const memberCountsByZone = useMemo(
    () => buildMemberCounts(zoneOrders, sections, excluded),
    [zoneOrders, sections, excluded]
  );

  // Total active musicians
  const totalActive = useMemo(() => {
    const unique = new Set();
    for (const grp of sections) {
      for (const m of grp.members) {
        if (!excluded.has(m.userId)) unique.add(m.userId);
      }
    }
    return unique.size;
  }, [sections, excluded]);

  // Pool for each zone: all compatible sections from data
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
        dividen automáticamente. Usá <strong>↑↓</strong> para reordenar dentro de la zona, o{" "}
        <strong>✕</strong> para quitarla. También podés agregar desde los chips de abajo.
      </p>

      {loading && <div className="text-slate-400 text-sm text-center py-4">Cargando músicos…</div>}

      {!loading && sections.length === 0 && (
        <div className="text-slate-400 text-sm text-center py-4">
          No se encontraron músicos. Verificá la configuración de secciones.
        </div>
      )}

      {!loading && sections.length > 0 && (
        <>
          {/* Summary bar */}
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

          {/* Unplaced sections warning */}
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
        Desmarcá los músicos que <strong>no participarán</strong> en este desfile. El conteo de cada
        sección se actualiza en tiempo real.
      </p>
      {sections.map((grp) => {
        const included = grp.members.filter((m) => !excluded.has(m.userId));
        const excludedN = grp.members.length - included.length;
        return (
          <div key={grp.section} className="overflow-hidden">
            <div className=" px-4 py-2 flex items-center justify-between border-b">
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

// ── Main page ─────────────────────────────────────────────────────────────────

export default function FormationBuilderPage({ formation: existingFormation }) {
  const navigate = useNavigate();
  const isEdit = !!existingFormation;

  // Role-based access: only admins can navigate between steps
  const { data: userData } = useQuery(GET_USERS_BY_ID);
  const userRole = userData?.getUser?.role;
  const isAdmin = FORMATION_ADMIN_ROLES.has(userRole);

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

  // Once role resolves, restrict non-admins to step 4 only
  useEffect(() => {
    if (userRole && !isAdmin) setStep(4);
  }, [userRole, isAdmin]);

  const [formName, setFormName] = useState(existingFormation?.name || "");
  const [formType, setFormType] = useState(existingFormation?.type || "SINGLE");
  const [columns, setColumns] = useState(existingFormation?.columns ?? 8);
  const [formNotes, setFormNotes] = useState(existingFormation?.notes || "");

  // Section order per zone — fully configurable
  const [zoneOrders, setZoneOrders] = useState(() => {
    const base = { ...DEFAULT_ZONE_ORDERS };
    if (isEdit && existingFormation.zoneOrders?.length) {
      for (const zo of existingFormation.zoneOrders) {
        base[zo.zone] = zo.sectionOrder;
      }
    }
    return base;
  });

  // Per-zone column overrides for Danza, Percusión, Color Guard
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

  // Per-zone row overrides for Danza, Percusión, Color Guard (null = auto)
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

  // Excluded user IDs for this formation
  const [excluded, setExcluded] = useState(() => new Set(existingFormation?.excludedUserIds || []));

  // Computed slots
  const [slots, setSlots] = useState(existingFormation?.slots || []);

  // ── Load users ────────────────────────────────────────────────────────────

  // For edit mode: load users on mount so Recalcular works
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
    // Only auto-populate zones that are completely empty.
    // Once a user has configured a zone (even with 1 section), don't touch it.
    setZoneOrders((prev) => {
      const next = mergeZoneOrdersWithPools(prev, zonePools);
      // Only apply changes where the previous order was empty
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

  const handleToggleExclude = (userId) => {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  // ── Compute grid ──────────────────────────────────────────────────────────

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
      existingSlots: slots, // always preserve locks regardless of isEdit
    });
    setSlots(computed);
    setStep(4);
  }, [zoneOrders, sections, excluded, formType, columns, zoneColumns, zoneRows, slots]);

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!formName.trim()) {
      setSaveToast({ message: "Ingresá un nombre", type: "error" });
      return;
    }

    // Zone member counts snapshot (real members only, no empty fillers)
    const countMap = {};
    for (const s of slots) {
      if (s.userId) countMap[s.zone] = (countMap[s.zone] || 0) + 1;
    }
    const zoneMemberCounts = Object.entries(countMap).map(([zone, count]) => ({ zone, count }));

    const zoneOrdersInput = Object.entries(zoneOrders).map(([zone, sectionOrder]) => ({
      zone,
      sectionOrder,
    }));

    const zoneColumnsInput = Object.entries(zoneColumns).map(([zone, cols]) => ({
      zone,
      columns: cols,
      ...(zoneRows[zone] != null ? { rows: zoneRows[zone] } : {}),
    }));

    const slotInput = slots.map((s) => ({
      zone: s.zone,
      row: s.row,
      col: s.col,
      section: s.section || null,
      userId: s.userId || null,
      displayName: s.displayName || null,
      avatar: s.avatar || null,
      locked: s.locked ?? false,
    }));

    try {
      if (isEdit) {
        const updated = await handleUpdate(existingFormation.id, {
          name: formName.trim(),
          notes: formNotes.trim() || null,
          columns,
          excludedUserIds: [...excluded],
          zoneOrders: zoneOrdersInput,
          zoneColumns: zoneColumnsInput,
          slots: slotInput,
          zoneMemberCounts,
        });
        if (updated) setSaveToast({ message: "Formación actualizada", type: "success" });
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
    } catch {
      /* errors shown via toast from hook */
    }
  };

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
              <button
                onClick={() =>
                  openFormationPrint({ slots, columns, zoneColumns, formName, formType })
                }
                className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl text-sm hover:bg-slate-100"
              >
                ↗ Exportar
              </button>
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

        {/* Step progress — only admins see the full wizard stepper */}
        {isAdmin && (
          <div className="max-w-6xl mx-auto mb-8 px-1">
            <div className="flex items-center gap-0">
              {STEPS.map(({ n, label }, idx) => (
                <React.Fragment key={n}>
                  <div className="flex items-center gap-2.5 group">
                    {/* Dot / number */}
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

                    {/* Label */}
                    <span
                      className={`text-[11px] font-medium tracking-wide uppercase transition-colors duration-200 whitespace-nowrap
              ${step === n ? "text-black" : step > n ? "text-slate-400" : "text-slate-300"}
            `}
                    >
                      {label}
                    </span>
                  </div>

                  {/* Separator */}
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
              <div className="flex items-center gap-3 mb-4">
                <StepBadge n={4} active done={false} />
                <h2 className="font-semibold text-slate-700">Formación</h2>
                <span className="ml-auto text-xs text-slate-400">
                  {columns} cols
                  {formType === "DOUBLE" ? " · Doble hacia atrás" : " · Bloque único"}
                  {" · Arrastrá para mover · 🔓 para bloquear"}
                </span>
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

              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <FormationGrid
                  slots={slots}
                  columns={columns}
                  zoneColumns={zoneColumns}
                  onChange={setSlots}
                  zoneOrders={zoneOrders}
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
