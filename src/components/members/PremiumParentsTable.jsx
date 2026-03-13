/* eslint-disable react/prop-types */
/**
 * PremiumParentsTable — premium paginated table for the Parents tab.
 *
 * Key differences from PremiumUsersTable:
 *  - Search placeholder: "Buscar por padre o hijo…"
 *  - Extra "Hijos" column showing child name chips
 *  - "Coincide por hijo/a" badge when matchedBy === "CHILD"
 *  - No instrument / bands / state columns (not relevant for parents)
 */
import { useMemo, useRef, useState } from "react";

// ── Helpers ──────────────────────────────────────────────────────────────────

function initials(user) {
  return [user.name, user.firstSurName]
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function fullName(u) {
  return [u.name, u.firstSurName, u.secondSurName].filter(Boolean).join(" ");
}

function childFullName(c) {
  return [c.firstSurName, c.secondSurName, c.name].filter(Boolean).join(" ");
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Avatar({ user }) {
  if (user.avatar) {
    return (
      <img
        src={user.avatar}
        alt={initials(user)}
        loading="lazy"
        className="w-9 h-9 rounded-full object-cover flex-shrink-0 ring-2 ring-white"
      />
    );
  }
  return (
    <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
      {initials(user)}
    </div>
  );
}

function ChildrenChips({ childList, matchedChildIds = [] }) {
  if (!childList || childList.length === 0) {
    return <span className="text-xs text-gray-400">—</span>;
  }
  const matchedSet = new Set(matchedChildIds.map(String));
  const visible = childList.slice(0, 2);
  const rest    = childList.length - visible.length;
  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((c) => {
        const isMatch = matchedSet.has(String(c.id));
        return (
          <span
            key={c.id}
            title={c.carnet ? `Carnet: ${c.carnet}` : undefined}
            className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-semibold border ${
              isMatch
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-gray-100 text-gray-600 border-gray-200"
            }`}
          >
            {childFullName(c)}
            {isMatch && " ✓"}
          </span>
        );
      })}
      {rest > 0 && (
        <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-semibold bg-gray-100 text-gray-500">
          +{rest}
        </span>
      )}
    </div>
  );
}

function MatchBadge({ matchedBy }) {
  if (matchedBy !== "CHILD") return null;
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
      👧 por hijo/a
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-50">
      {[1, 2, 3, 4].map((i) => (
        <td key={i} className="px-4 py-3">
          <div
            className="h-4 bg-gray-100 rounded-full animate-pulse"
            style={{ width: `${40 + i * 12}%` }}
          />
        </td>
      ))}
    </tr>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────

function Pagination({ page, limit, total, onPageChange, onLimitChange }) {
  const totalPages = Math.ceil(total / limit);
  const pages = useMemo(() => {
    const arr = [];
    for (let p = Math.max(1, page - 2); p <= Math.min(totalPages, page + 2); p++) arr.push(p);
    return arr;
  }, [page, totalPages]);

  if (total === 0) return null;

  return (
    <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between gap-3 text-xs flex-wrap">
      <div className="flex items-center gap-2 text-gray-500">
        <span>
          {(page - 1) * limit + 1}–{Math.min(page * limit, total)} de {total}
        </span>
        <select
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          className="ml-2 py-1 px-2 rounded-lg border border-gray-200 bg-white text-xs focus:outline-none"
        >
          {[10, 25, 50].map((v) => (
            <option key={v} value={v}>{v} por página</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-all text-sm"
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
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-all text-sm"
        >
          ›
        </button>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function PremiumParentsTable({
  items = [],
  total = 0,
  loading = false,
  filter = {},
  pagination = { page: 1, limit: 25 },
  setPagination,
  setSearchText,
  clearFilters,
  onRowClick,
}) {
  const [inputVal, setInputVal] = useState(filter.searchText || "");
  const timer = useRef(null);

  const handleInput = (e) => {
    const v = e.target.value;
    setInputVal(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setSearchText(v), 300);
  };

  const hasSearch = Boolean(inputVal);

  const handlePageChange  = (p)   => setPagination((prev) => ({ ...prev, page: p }));
  const handleLimitChange = (lim) => setPagination({ page: 1, limit: lim, sortBy: "firstSurName", sortDir: "asc" });

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-52">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">⌕</span>
          <input
            type="text"
            value={inputVal}
            onChange={handleInput}
            placeholder="Buscar por padre o hijo…"
            className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all"
          />
        </div>
        {hasSearch && (
          <button
            onClick={() => {
              setInputVal("");
              clearFilters();
            }}
            className="py-2 px-3 rounded-xl border border-red-100 bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-all"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <p className="text-sm font-bold text-gray-900">Padres / Madres de familia</p>
          {!loading && (
            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-semibold">
              {total}
            </span>
          )}
          {hasSearch && (
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-semibold border border-amber-100">
              Búsqueda activa — incluye hijos
            </span>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                  Padre / Madre
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap hidden sm:table-cell">
                  Teléfono
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                  Hijos
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && items.length === 0
                ? Array.from({ length: 6 }, (_, i) => <SkeletonRow key={i} />)
                : items.length === 0
                ? (
                  <tr>
                    <td colSpan={3} className="py-16 text-center">
                      <p className="text-2xl mb-2">👨‍👩‍👧</p>
                      <p className="text-sm font-bold text-gray-900">Sin resultados</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Intenta buscar por nombre del padre, madre o por el nombre del hijo/a.
                      </p>
                    </td>
                  </tr>
                )
                : items.map((parent) => (
                  <tr
                    key={parent.id}
                    onClick={() => onRowClick?.(parent)}
                    className={`hover:bg-gray-50 transition-colors ${onRowClick ? "cursor-pointer" : ""}`}
                  >
                    {/* Name + email + match badge */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar user={parent} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-semibold text-gray-900 truncate">{fullName(parent)}</p>
                            <MatchBadge matchedBy={parent.matchedBy} />
                          </div>
                          <p className="text-gray-400 truncate text-[11px]">{parent.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="px-4 py-3 text-gray-600 hidden sm:table-cell whitespace-nowrap">
                      {parent.phone ? (
                        <a
                          href={`tel:${parent.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-blue-600 hover:underline"
                        >
                          {parent.phone}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>

                    {/* Children chips */}
                    <td className="px-4 py-3">
                      <ChildrenChips
                        childList={parent.children}
                        matchedChildIds={parent.matchedChildIds || []}
                      />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          page={pagination.page}
          limit={pagination.limit}
          total={total}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
        />
      </div>
    </div>
  );
}
