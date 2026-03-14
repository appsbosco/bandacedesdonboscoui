/* eslint-disable react/prop-types */
/**
 * RoomingListExportModal
 *
 * Printable / exportable rooming list for hotels.
 *
 * Displays every room with its occupants (name, age, sex), grouped by hotel.
 * Compliance warnings are shown per room:
 *   - mixed_sex:  men and women in the same room (staff rooms exempt if all isStaff)
 *   - mixed_age:  adult (18+) with minor without soft border
 *   - unknown_sex: participant with unknown sex
 *
 * Business rules enforced visually:
 *   ✓ Men with men, women with women (staff: mixed allowed)
 *   ✓ 18-year-olds can share with 17-year-olds (soft border = 1 year)
 *   ✗ 18-year-old cannot share with 16-year-old or younger
 */
import { useMemo, useRef } from "react";
import { generateRoomingListData, SEX_CONFIG, TOUR_REFERENCE_DATE } from "./roomGrouping";

const ROOM_TYPE_LABELS = {
  SINGLE: "Individual",
  DOUBLE: "Doble",
  TRIPLE: "Triple",
  QUAD: "Cuádruple",
  SUITE: "Suite",
};

const WARNING_STYLES = {
  mixed_sex:      { bg: "bg-orange-50 border-orange-200", text: "text-orange-700", icon: "⚠️", label: "Sexo mixto" },
  mixed_age:      { bg: "bg-red-50 border-red-200",       text: "text-red-700",    icon: "🚫", label: "Adultos con menores (conflicto)" },
  mixed_age_soft: { bg: "bg-yellow-50 border-yellow-200", text: "text-yellow-700", icon: "⚡", label: "Frontera de edad suave (17/18)" },
  unknown_sex:    { bg: "bg-gray-50 border-gray-200",     text: "text-gray-600",   icon: "❓", label: "Sexo desconocido" },
};

const SEX_LABELS = { M: "Masculino", F: "Femenino", UNKNOWN: "No indicado" };

// ── CSV builder ─────────────────────────────────────────────────────────────────
function buildCSV(data, tourName) {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const refYear = TOUR_REFERENCE_DATE.getFullYear();

  const rows = [
    [`Rooming List — ${tourName} (edades al ${refYear})`],
    [],
    ["Hotel", "Habitación", "Tipo", "Piso", "Cap.", "Nombre completo", "Edad", "Sexo", "Instrumento/Rol", "Advertencias"],
  ];

  for (const room of data) {
    const warningText = room.warnings.map((w) => w.label).join("; ");
    if (room.occupants.length === 0) {
      rows.push([
        esc(room.hotelName),
        esc(room.roomNumber),
        esc(ROOM_TYPE_LABELS[room.roomType] || room.roomType || ""),
        esc(room.floor || ""),
        esc(room.capacity),
        esc("(vacía)"),
        "",
        "",
        "",
        esc(warningText),
      ]);
    } else {
      room.occupants.forEach((occ, idx) => {
        rows.push([
          esc(idx === 0 ? room.hotelName : ""),
          esc(idx === 0 ? room.roomNumber : ""),
          esc(idx === 0 ? (ROOM_TYPE_LABELS[room.roomType] || room.roomType || "") : ""),
          esc(idx === 0 ? (room.floor || "") : ""),
          esc(idx === 0 ? room.capacity : ""),
          esc(occ.name),
          esc(occ.age !== null ? occ.age : ""),
          esc(SEX_LABELS[occ.sex] || occ.sex),
          esc([occ.instrument, occ.role].filter(Boolean).join(" / ")),
          esc(idx === 0 ? warningText : ""),
        ]);
      });
    }
    rows.push([]); // blank row between rooms
  }

  return rows.map((r) => r.join(",")).join("\n");
}

function downloadCSV(csv, filename) {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }); // BOM for Excel
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Sub-components ──────────────────────────────────────────────────────────────

function OccupantRow({ occ, isStaffRoom }) {
  const sexCfg = SEX_CONFIG[occ.sex] || SEX_CONFIG.UNKNOWN;
  return (
    <tr className="border-t border-gray-100 print:border-gray-300">
      <td className="py-1.5 pr-3 text-xs text-gray-800 font-medium">{occ.name}</td>
      <td className="py-1.5 pr-3 text-xs text-gray-500 text-center tabular-nums">
        {occ.age !== null ? occ.age : "—"}
      </td>
      <td className="py-1.5 pr-3 text-center">
        <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full border text-[10px] font-bold ${sexCfg.color}`}>
          {sexCfg.short}
        </span>
      </td>
      <td className="py-1.5 text-[11px] text-gray-400">
        {[occ.instrument, occ.role].filter(Boolean).join(" · ")}
        {isStaffRoom && (
          <span className="ml-1 text-[10px] text-violet-500 font-semibold">[staff]</span>
        )}
      </td>
    </tr>
  );
}

function RoomBlock({ room }) {
  const isStaffRoom = room.occupants.every((o) => o.isStaff);
  // For staff rooms, suppress mixed_sex warning
  const visibleWarnings = isStaffRoom
    ? room.warnings.filter((w) => w.type !== "mixed_sex")
    : room.warnings;

  const hasCritical = visibleWarnings.some((w) => w.type === "mixed_age");
  const typeLabel = ROOM_TYPE_LABELS[room.roomType] || room.roomType || "";

  return (
    <div
      className={`mb-4 rounded-2xl border overflow-hidden print:rounded-none print:border-gray-300 print:mb-3 ${
        hasCritical ? "border-red-300" : visibleWarnings.length > 0 ? "border-amber-200" : "border-gray-200"
      }`}
    >
      {/* Room header */}
      <div
        className={`px-4 py-2.5 flex items-center justify-between gap-3 ${
          hasCritical ? "bg-red-50" : visibleWarnings.length > 0 ? "bg-amber-50" : "bg-gray-50"
        } print:bg-white`}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-gray-900">{room.roomNumber}</span>
          {typeLabel && (
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide border border-gray-200 px-1.5 py-0.5 rounded">
              {typeLabel}
            </span>
          )}
          {room.floor && (
            <span className="text-[10px] text-gray-400">Piso {room.floor}</span>
          )}
          {isStaffRoom && (
            <span className="text-[10px] font-bold text-violet-600 bg-violet-50 border border-violet-200 px-1.5 py-0.5 rounded">
              STAFF
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-bold text-gray-500">
            {room.occupants.length}/{room.capacity}
          </span>
          {visibleWarnings.map((w) => {
            const style = WARNING_STYLES[w.type] || WARNING_STYLES.unknown_sex;
            return (
              <span
                key={w.type}
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${style.bg} ${style.text}`}
              >
                {style.icon} {style.label}
              </span>
            );
          })}
        </div>
      </div>

      {/* Occupants table */}
      <div className="px-4 pb-3">
        {room.occupants.length === 0 ? (
          <p className="text-xs text-gray-400 italic py-3">Habitación vacía</p>
        ) : (
          <table className="w-full mt-2">
            <thead>
              <tr>
                <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wide pb-1 pr-3">Nombre</th>
                <th className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-wide pb-1 pr-3 w-10">Edad</th>
                <th className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-wide pb-1 pr-3 w-10">Sexo</th>
                <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wide pb-1">Instrumento / Rol</th>
              </tr>
            </thead>
            <tbody>
              {room.occupants.map((occ) => (
                <OccupantRow key={occ.id} occ={occ} isStaffRoom={isStaffRoom} />
              ))}
            </tbody>
          </table>
        )}
        {room.notes && (
          <p className="mt-2 text-[11px] text-gray-500 italic border-t border-gray-100 pt-2">
            Nota: {room.notes}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Main modal ──────────────────────────────────────────────────────────────────

export default function RoomingListExportModal({
  isOpen,
  onClose,
  rooms,
  allParticipants,
  sexOverrides,
  tourName,
}) {
  const printRef = useRef(null);

  const data = useMemo(
    () => generateRoomingListData(rooms, allParticipants, sexOverrides),
    [rooms, allParticipants, sexOverrides]
  );

  // Group by hotel
  const byHotel = useMemo(() => {
    const map = new Map();
    for (const room of data) {
      if (!map.has(room.hotelName)) map.set(room.hotelName, []);
      map.get(room.hotelName).push(room);
    }
    return map;
  }, [data]);

  const totalWarnings = data.reduce((s, r) => s + r.warnings.length, 0);
  const criticalWarnings = data.reduce(
    (s, r) => s + r.warnings.filter((w) => w.type === "mixed_age").length,
    0
  );
  const totalOccupants = data.reduce((s, r) => s + r.occupants.length, 0);
  const refYear = TOUR_REFERENCE_DATE.getFullYear();

  const handlePrint = () => window.print();
  const handleCSV = () => {
    const csv = buildCSV(data, tourName || "gira");
    const safeDate = new Date().toISOString().slice(0, 10);
    downloadCSV(csv, `rooming-list-${tourName || "gira"}-${safeDate}.csv`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto print:bg-transparent print:relative print:inset-auto print:p-0">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden my-4 print:shadow-none print:rounded-none print:my-0">

        {/* Modal header — hidden on print */}
        <div className="print:hidden flex items-start justify-between gap-4 px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Rooming List</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {tourName} · {data.length} habitaciones · {totalOccupants} asignados · edades al {refYear}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {criticalWarnings > 0 && (
              <span className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1.5 rounded-xl">
                🚫 {criticalWarnings} conflicto{criticalWarnings !== 1 ? "s" : ""} crítico{criticalWarnings !== 1 ? "s" : ""}
              </span>
            )}
            {totalWarnings > 0 && criticalWarnings === 0 && (
              <span className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-xl">
                ⚠️ {totalWarnings} aviso{totalWarnings !== 1 ? "s" : ""}
              </span>
            )}
            <button
              onClick={handleCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-xl transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              CSV
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-gray-700 text-white text-xs font-semibold rounded-xl transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimir
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Print-only header */}
        <div className="hidden print:block px-6 py-4 border-b border-gray-300">
          <h1 className="text-xl font-bold text-gray-900">Rooming List — {tourName}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {data.length} habitaciones · {totalOccupants} asignados · edades calculadas al {refYear}
          </p>
        </div>

        {/* Rules legend — print-only */}
        <div className="hidden print:block px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs text-gray-500 space-y-0.5">
          <p>Reglas: Hombres con hombres · Mujeres con mujeres · Staff puede ser mixto</p>
          <p>Edad: 18+ no puede compartir con menores de 17 o menos (excepción: 17 con 18 permitido)</p>
        </div>

        {/* Compliance legend — screen only */}
        <div className="print:hidden px-6 py-3 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-3">
          {Object.entries(WARNING_STYLES).map(([type, style]) => (
            <span key={type} className={`text-[10px] font-semibold px-2 py-1 rounded border ${style.bg} ${style.text}`}>
              {style.icon} {style.label}
            </span>
          ))}
          <span className="text-[10px] text-gray-400 self-center ml-auto">
            Staff (DIRECTOR/CONDUCTOR) puede ser mixto
          </span>
        </div>

        {/* Content */}
        <div ref={printRef} className="px-6 py-5 overflow-y-auto max-h-[70vh] print:max-h-none print:overflow-visible">
          {data.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-3xl mb-2">🏨</p>
              <p className="text-sm text-gray-400">Sin habitaciones para exportar.</p>
            </div>
          ) : (
            Array.from(byHotel.entries()).map(([hotelName, hotelRooms]) => (
              <section key={hotelName} className="mb-8 print:mb-6">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 print:text-gray-700 print:text-sm">
                  <span>🏨</span>
                  <span>{hotelName}</span>
                  <span className="text-gray-300 font-normal print:hidden">({hotelRooms.length} hab.)</span>
                </h3>
                {hotelRooms.map((room) => (
                  <RoomBlock key={room.id} room={room} />
                ))}
              </section>
            ))
          )}
        </div>

        {/* Footer — screen only */}
        <div className="print:hidden px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-4">
          <div className="text-xs text-gray-400">
            {totalWarnings === 0 ? (
              <span className="text-emerald-600 font-semibold">✓ Sin advertencias de composición</span>
            ) : (
              <span>{totalWarnings} advertencia{totalWarnings !== 1 ? "s" : ""} total</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-sm font-semibold text-gray-700 rounded-2xl transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
