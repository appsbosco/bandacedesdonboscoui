/* eslint-disable react/prop-types */
/**
 * MembersTable — premium server-side paginated user table.
 * Consistent with Tours module premium styling.
 *
 * Props:
 *   items               — User[] current page
 *   total               — total count
 *   page, limit         — current pagination state
 *   loading             — boolean
 *   selectedIds         — Set<string>
 *   onToggleSelect      — (id) => void
 *   onSelectAll         — () => void
 *   onClearSelection    — () => void
 *   onPageChange        — (newPage) => void
 *   onRowClick          — (user) => void (optional)
 *   bulkActions         — React node (optional slot for bulk action buttons)
 */
import { useMemo } from "react";

const STATE_PILL = {
  Activo:    "bg-emerald-50 text-emerald-700 border-emerald-100",
  Inactivo:  "bg-gray-100 text-gray-500 border-gray-200",
  Exalumno:  "bg-blue-50 text-blue-600 border-blue-100",
};

function userInitials(u) {
  return [u.name, u.firstSurName].filter(Boolean).map((n) => n[0]).join("").toUpperCase();
}

function userFullName(u) {
  return [u.name, u.firstSurName, u.secondSurName].filter(Boolean).join(" ");
}

function Avatar({ user }) {
  if (user.avatar) {
    return (
      <img
        src={user.avatar}
        alt={userFullName(user)}
        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
      />
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
      {userInitials(user)}
    </div>
  );
}

function StatePill({ state }) {
  const cls = STATE_PILL[state] || "bg-gray-100 text-gray-500 border-gray-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cls}`}>
      {state || "—"}
    </span>
  );
}

function EnsembleTags({ bands }) {
  if (!bands || bands.length === 0) return <span className="text-xs text-gray-400">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {bands.slice(0, 3).map((b) => (
        <span key={b} className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
          {b}
        </span>
      ))}
      {bands.length > 3 && (
        <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-semibold bg-gray-100 text-gray-500">
          +{bands.length - 3}
        </span>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-2 p-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-14 bg-gray-100 rounded-xl" />
      ))}
    </div>
  );
}

export default function MembersTable({
  items = [],
  total = 0,
  page = 1,
  limit = 25,
  loading = false,
  selectedIds = new Set(),
  onToggleSelect,
  onSelectAll,
  onClearSelection,
  onPageChange,
  onRowClick,
  bulkActions,
}) {
  const totalPages = Math.ceil(total / limit);
  const allSelected = items.length > 0 && items.every((u) => selectedIds.has(u.id));

  const pages = useMemo(() => {
    const arr = [];
    for (let p = Math.max(1, page - 2); p <= Math.min(totalPages, page + 2); p++) arr.push(p);
    return arr;
  }, [page, totalPages]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="px-4 py-3 bg-blue-50 border-b border-blue-100 flex items-center gap-3 flex-wrap">
          <span className="text-xs font-semibold text-blue-700">
            {selectedIds.size} seleccionado{selectedIds.size !== 1 ? "s" : ""}
          </span>
          <button
            onClick={onClearSelection}
            className="text-xs text-blue-500 hover:text-blue-700 underline"
          >
            Limpiar
          </button>
          {bulkActions}
        </div>
      )}

      {/* Loading */}
      {loading && items.length === 0 ? (
        <Skeleton />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-3xl mb-2">👥</p>
          <p className="text-sm font-bold text-gray-900">Sin usuarios</p>
          <p className="text-xs text-gray-500 mt-1">No hay resultados para los filtros aplicados.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={allSelected ? onClearSelection : onSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Usuario</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap hidden sm:table-cell">Rol</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap hidden md:table-cell">Estado</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap hidden lg:table-cell">Instrumento</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap hidden lg:table-cell">Agrupaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((user) => {
                const isSelected = selectedIds.has(user.id);
                return (
                  <tr
                    key={user.id}
                    className={`transition-colors ${isSelected ? "bg-blue-50" : "hover:bg-gray-50"} ${onRowClick ? "cursor-pointer" : ""}`}
                    onClick={onRowClick ? () => onRowClick(user) : undefined}
                  >
                    <td className="px-4 py-3" onClick={(e) => { e.stopPropagation(); onToggleSelect?.(user.id); }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect?.(user.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar user={user} />
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{userFullName(user)}</p>
                          <p className="text-gray-400 truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden sm:table-cell whitespace-nowrap">{user.role || "—"}</td>
                    <td className="px-4 py-3 hidden md:table-cell"><StatePill state={user.state} /></td>
                    <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{user.instrument || "—"}</td>
                    <td className="px-4 py-3 hidden lg:table-cell"><EnsembleTags bands={user.bands} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {total > limit && (
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between gap-3 text-xs">
          <span className="text-gray-500">
            {(page - 1) * limit + 1}–{Math.min(page * limit, total)} de {total}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-all"
            >
              ‹
            </button>
            {pages.map((p) => (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${
                  p === page
                    ? "bg-gray-900 text-white"
                    : "border border-gray-200 hover:bg-gray-50 text-gray-700"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-all"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
