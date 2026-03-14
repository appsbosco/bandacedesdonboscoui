import { useState, useCallback, useMemo, useRef } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_ENSEMBLES,
  USERS_PAGINATED,
  ENSEMBLE_MEMBERS,
  ENSEMBLE_AVAILABLE,
  ENSEMBLE_IN_OTHER,   // ← NUEVA query: usuarios que están en al menos otro ensamble
  ENSEMBLE_COUNTS,
  ENSEMBLE_INSTRUMENT_STATS,
  ADD_USER_TO_ENSEMBLES,
  REMOVE_USER_FROM_ENSEMBLES,
} from "./ensembles.gql.js";



const DEFAULT_PAGINATION = { page: 1, limit: 100, sortBy: "firstSurName", sortDir: "asc" };

// ── Dashboard hook ──────────────────────────────────────────────────────────

export function useEnsemblesDashboard() {
  const { data, loading, error, refetch } = useQuery(GET_ENSEMBLES, {
    fetchPolicy: "cache-and-network",
  });
  return { ensembles: data?.ensembles || [], loading, error, refetch };
}

// ── Members paginated hook (dashboard / ensemble members page) ──────────────

export function useMembersPaginated({ initialFilter = {}, queryType = "paginated", ensembleKey } = {}) {
  const [filter, setFilter] = useState(initialFilter);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkModal, setBulkModal] = useState({ open: false, mode: "add" });
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => setToast({ message, type });

  const searchTimer = useRef(null);
  const setSearchText = useCallback((text) => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setFilter((prev) => ({ ...prev, searchText: text || undefined }));
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 300);
  }, []);

  const setFilterField = useCallback((field, value) => {
    setFilter((prev) => ({ ...prev, [field]: value || undefined }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilter(initialFilter);
    setPagination(DEFAULT_PAGINATION);
  }, [initialFilter]);

  const paginatedVars = { filter, pagination };
  const memberVars = { ensembleKey, filter, pagination };

  const paginatedResult = useQuery(USERS_PAGINATED, {
    variables: paginatedVars,
    skip: queryType !== "paginated",
    fetchPolicy: "cache-and-network",
  });

  const membersResult = useQuery(ENSEMBLE_MEMBERS, {
    variables: memberVars,
    skip: queryType !== "ensemble" || !ensembleKey,
    fetchPolicy: "cache-and-network",
  });

  const activeResult = queryType === "ensemble" ? membersResult : paginatedResult;
  const pageData =
    queryType === "ensemble"
      ? activeResult.data?.ensembleMembers
      : activeResult.data?.usersPaginated;

  const items  = pageData?.items  || [];
  const total  = pageData?.total  || 0;
  const facets = pageData?.facets || { byState: [], byRole: [], byInstrument: [], byEnsemble: [] };

  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(items.map((u) => u.id)));
  }, [items]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const [addMutation, { loading: adding }] = useMutation(ADD_USER_TO_ENSEMBLES, {
    onCompleted: (data) => {
      const r = data?.addUserToEnsembles;
      showToast(`${r.updatedCount} usuario${r.updatedCount !== 1 ? "s" : ""} actualizado${r.updatedCount !== 1 ? "s" : ""}`, "success");
      setBulkModal({ open: false, mode: "add" });
      clearSelection();
      activeResult.refetch();
    },
    onError: (e) => showToast(e.message, "error"),
  });

  const [removeMutation, { loading: removing }] = useMutation(REMOVE_USER_FROM_ENSEMBLES, {
    onCompleted: (data) => {
      const r = data?.removeUserFromEnsembles;
      showToast(`${r.updatedCount} usuario${r.updatedCount !== 1 ? "s" : ""} actualizado${r.updatedCount !== 1 ? "s" : ""}`, "success");
      setBulkModal({ open: false, mode: "add" });
      clearSelection();
      activeResult.refetch();
    },
    onError: (e) => showToast(e.message, "error"),
  });

  const handleBulkApply = useCallback(
    async (ensembleKeys, mode) => {
      const userIds = Array.from(selectedIds);
      if (!userIds.length || !ensembleKeys.length) return;
      if (mode === "add") await addMutation({ variables: { userIds, ensembleKeys } });
      else await removeMutation({ variables: { userIds, ensembleKeys } });
    },
    [selectedIds, addMutation, removeMutation]
  );

  return {
    items, total, facets, totalPages: Math.ceil(total / pagination.limit),
    loading: activeResult.loading,
    error: activeResult.error,
    filter, pagination, setPagination,
    setSearchText, setFilterField, clearFilters,
    selectedIds, toggleSelect, selectAll, clearSelection,
    bulkModal, setBulkModal, handleBulkApply,
    adding, removing,
    toast, setToast,
  };
}

export function useEnsemblesRef() {
  const { data } = useQuery(GET_ENSEMBLES, { fetchPolicy: "cache-first" });
  return useMemo(() => data?.ensembles || [], [data]);
}

// ── Counts hook — ahora incluye inOtherTotal ─────────────────────────────────

export function useEnsembleCounts(ensembleKey) {
  const { data, loading, refetch } = useQuery(ENSEMBLE_COUNTS, {
    variables: { ensembleKey },
    skip: !ensembleKey,
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: false,
  });
  return {
    membersTotal:   data?.ensembleCounts?.membersTotal   ?? null,
    availableTotal: data?.ensembleCounts?.availableTotal ?? null,
    inOtherTotal:   data?.ensembleCounts?.inOtherTotal   ?? null,  // ← nuevo
    loading,
    refetch,
  };
}

// ── Instrument stats hook ────────────────────────────────────────────────────

export function useEnsembleInstrumentStats(ensembleKey) {
  const { data, loading, refetch } = useQuery(ENSEMBLE_INSTRUMENT_STATS, {
    variables: { ensembleKey },
    skip: !ensembleKey,
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: false,
  });
  return {
    stats: data?.ensembleInstrumentStats || [],
    loading,
    refetch,
  };
}

// ── useEnsemblePaginated ─────────────────────────────────────────────────────
//
// queryType:
//   "members"   → ENSEMBLE_MEMBERS   (miembros del ensamble actual)
//   "available" → ENSEMBLE_AVAILABLE (sin ningún ensamble asignado)
//   "in_other"  → ENSEMBLE_IN_OTHER  (en al menos otro ensamble, no en este)
//
// Selección removida — vive en EnsembleControlPage (lifted up).
//
export function useEnsemblePaginated(ensembleKey, queryType, skip = false) {
  const [filter, setFilterState]         = useState({});
  const [pagination, setPaginationState] = useState(DEFAULT_PAGINATION);

  const searchTimer = useRef(null);

  const setSearchText = useCallback((text) => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setFilterState((prev) => ({ ...prev, searchText: text || undefined }));
      setPaginationState((prev) => ({ ...prev, page: 1 }));
    }, 300);
  }, []);

  const setFilterField = useCallback((field, value) => {
    setFilterState((prev) => ({ ...prev, [field]: value || undefined }));
    setPaginationState((prev) => ({ ...prev, page: 1 }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilterState({});
    setPaginationState(DEFAULT_PAGINATION);
  }, []);

  // Mapeo queryType → GQL query + data key
  const queryMap = {
    members:   { query: ENSEMBLE_MEMBERS,   dataKey: "ensembleMembers"  },
    available: { query: ENSEMBLE_AVAILABLE, dataKey: "ensembleAvailable" },
    in_other:  { query: ENSEMBLE_IN_OTHER,  dataKey: "ensembleInOther"  },
  };
  const { query, dataKey } = queryMap[queryType] ?? queryMap.available;

  const { data, loading, refetch } = useQuery(query, {
    variables: { ensembleKey, filter, pagination },
    skip: skip || !ensembleKey,
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: false,
  });

  const pageData = data?.[dataKey];
  const items  = pageData?.items  || [];
  const total  = pageData?.total  || 0;
  const facets = pageData?.facets || { byState: [], byRole: [], byInstrument: [], byEnsemble: [] };

  const setPagination = useCallback((updater) => {
    setPaginationState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      return { ...prev, ...next };
    });
  }, []);

  return {
    items, total, facets, loading,
    filter, pagination, setPagination,
    setSearchText, setFilterField, clearFilters,
    refetch,
  };
}