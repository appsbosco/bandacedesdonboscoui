/* eslint-disable react/prop-types */
import { useMemo, useRef, useState } from "react";

// ── Constants ───────────────────────────────────────────────────────────────

const STATE_PILL = {
  Activo:   "bg-emerald-50 text-emerald-700 border-emerald-100",
  Inactivo: "bg-gray-100 text-gray-500 border-gray-200",
  Exalumno: "bg-blue-50 text-blue-600 border-blue-100",
};

// ── Sub-components ──────────────────────────────────────────────────────────

function Avatar({ user }) {
  const initials = [user.name, user.firstSurName]
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  if (user.avatar) {
    return (
      <img
        src={user.avatar}
        alt={initials}
        loading="lazy"
        className="w-9 h-9 rounded-full object-cover flex-shrink-0 ring-2 ring-white"
      />
    );
  }
  return (
    <div className="w-9 h-9 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
      {initials}
    </div>
  );
}

function StatePill({ state }) {
  const cls = STATE_PILL[state] || "bg-gray-100 text-gray-500 border-gray-200";
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cls}`}>
      {state || "—"}
    </span>
  );
}

function BandChips({ bands }) {
  if (!bands || bands.length === 0) return <span className="text-xs text-gray-400">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {bands.slice(0, 2).map((b) => (
        <span
          key={b}
          className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-semibold bg-gray-100 text-gray-600 border border-gray-200"
        >
          {b}
        </span>
      ))}
      {bands.length > 2 && (
        <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-semibold bg-gray-100 text-gray-500">
          +{bands.length - 2}
        </span>
      )}
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-50">
      {[1, 2, 3, 4, 5].map((i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-100 rounded-full animate-pulse" style={{ width: `${50 + i * 10}%` }} />
        </td>
      ))}
    </tr>
  );
}

// ── Filter Bar ──────────────────────────────────────────────────────────────

function FilterBar({ filter, facets, onSearch, onFilter, onClear, showInstrument = true }) {
  const [inputVal, setInputVal] = useState(filter.searchText || "");
  const timer = useRef(null);

  const handleInput = (e) => {
    const v = e.target.value;
    setInputVal(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onSearch(v), 300);
  };

  const activeFilters = [
    filter.state && { key: "state", label: `Estado: ${filter.state}` },
    filter.instrument && { key: "instrument", label: `Instrumento: ${filter.instrument}` },
  ].filter(Boolean);

  const hasActive = inputVal || activeFilters.length > 0;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-52">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">⌕</span>
          <input
            type="text"
            value={inputVal}
            onChange={handleInput}
            placeholder="Buscar nombre, carnet, correo…"
            className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all"
          />
        </div>

        {/* State */}
        <select
          value={filter.state || ""}
          onChange={(e) => onFilter("state", e.target.value)}
          className="py-2 px-3 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-gray-300"
        >
          <option value="">Estado</option>
          {(facets.byState || []).map((f) => (
            <option key={f.value} value={f.value}>{f.value} ({f.count})</option>
          ))}
        </select>

        {/* Instrument */}
        {showInstrument && (
          <select
            value={filter.instrument || ""}
            onChange={(e) => onFilter("instrument", e.target.value)}
            className="py-2 px-3 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            <option value="">Instrumento</option>
            {(facets.byInstrument || [])
              .filter((f) => f.value && f.value !== "Sin instrumento")
              .map((f) => (
                <option key={f.value} value={f.value}>{f.value} ({f.count})</option>
              ))}
          </select>
        )}

        {/* Clear */}
        {hasActive && (
          <button
            onClick={() => {
              setInputVal("");
              onClear();
            }}
            className="py-2 px-3 rounded-xl border border-red-100 bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-all"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {activeFilters.map((f) => (
            <span
              key={f.key}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-900 text-white text-[10px] font-semibold"
            >
              {f.label}
              <button
                onClick={() => onFilter(f.key, "")}
                className="opacity-70 hover:opacity-100 leading-none"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Pagination ──────────────────────────────────────────────────────────────

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

// ── Main Component ──────────────────────────────────────────────────────────

/**
 * PremiumUsersTable — server-side paginated premium table for the Members module.
 *
 * Props:
 *   title           — section label (string)
 *   items           — User[] current page
 *   total           — total count
 *   loading         — boolean
 *   filter          — current filter state object
 *   facets          — { byState, byInstrument, ... }
 *   pagination      — { page, limit, ... }
 *   setPagination   — state setter
 *   setSearchText   — debounced search setter
 *   setFilterField  — (field, value) => void
 *   clearFilters    — () => void
 *   onRowClick      — (user) => void
 *   showInstrument  — boolean (default true)
 *   showBands       — boolean (default true)
 *   extraColumns    — optional render function for extra cells per row
 */
export default function PremiumUsersTable({
  title = "Miembros",
  items = [],
  total = 0,
  loading = false,
  filter = {},
  facets = {},
  pagination = { page: 1, limit: 25 },
  setPagination,
  setSearchText,
  setFilterField,
  clearFilters,
  onRowClick,
  showInstrument = true,
  showBands = true,
}) {
  const handlePageChange = (p) => setPagination((prev) => ({ ...prev, page: p }));
  const handleLimitChange = (lim) => setPagination({ page: 1, limit: lim, sortBy: "firstSurName", sortDir: "asc" });

  const fullName = (u) =>
    [u.firstSurName, u.secondSurName, u.name].filter(Boolean).join(" ");

  return (
    <div className="space-y-4">
      {/* Filters */}
      <FilterBar
        filter={filter}
        facets={facets}
        onSearch={setSearchText}
        onFilter={setFilterField}
        onClear={clearFilters}
        showInstrument={showInstrument}
      />

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Card header */}
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-gray-900">{title}</p>
            {!loading && (
              <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-semibold">
                {total}
              </span>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                  Miembro
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap hidden sm:table-cell">
                  Estado
                </th>
                {showInstrument && (
                  <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap hidden md:table-cell">
                    Instrumento
                  </th>
                )}
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap hidden md:table-cell">
                  Rol
                </th>
                {showBands && (
                  <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap hidden lg:table-cell">
                    Agrupaciones
                  </th>
                )}
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap hidden lg:table-cell">
                  Teléfono
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && items.length === 0
                ? Array.from({ length: 8 }, (_, i) => <SkeletonRow key={i} />)
                : items.length === 0
                ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <p className="text-2xl mb-2">👥</p>
                      <p className="text-sm font-bold text-gray-900">Sin resultados</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Ajusta los filtros o la búsqueda.
                      </p>
                    </td>
                  </tr>
                )
                : items.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => onRowClick?.(user)}
                    className={`hover:bg-gray-50 transition-colors ${onRowClick ? "cursor-pointer" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar user={user} />
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{fullName(user)}</p>
                          <p className="text-gray-400 truncate text-[11px]">{user.email}</p>
                          {user.carnet && (
                            <p className="text-gray-300 text-[10px]">Carnet: {user.carnet}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <StatePill state={user.state} />
                    </td>
                    {showInstrument && (
                      <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                        {user.instrument || "—"}
                      </td>
                    )}
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell whitespace-nowrap">
                      {user.role || "—"}
                    </td>
                    {showBands && (
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <BandChips bands={user.bands} />
                      </td>
                    )}
                    <td className="px-4 py-3 text-gray-600 hidden lg:table-cell whitespace-nowrap">
                      {user.phone ? (
                        <a
                          href={`tel:${user.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-blue-600 hover:underline"
                        >
                          {user.phone}
                        </a>
                      ) : (
                        "—"
                      )}
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
