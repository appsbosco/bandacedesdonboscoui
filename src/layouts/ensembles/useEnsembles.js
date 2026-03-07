import { useState, useCallback, useMemo, useRef } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_ENSEMBLES,
  USERS_PAGINATED,
  ENSEMBLE_MEMBERS,
  ENSEMBLE_AVAILABLE,
  ENSEMBLE_COUNTS,
  ENSEMBLE_INSTRUMENT_STATS,
  ADD_USER_TO_ENSEMBLES,
  REMOVE_USER_FROM_ENSEMBLES,
} from "./ensembles.gql.js";

const DEFAULT_PAGINATION = { page: 1, limit: 25, sortBy: "firstSurName", sortDir: "asc" };

// ── Dashboard hook ─────────────────────────────────────────────────────────────

export function useEnsemblesDashboard() {
  const { data, loading, error, refetch } = useQuery(GET_ENSEMBLES, {
    fetchPolicy: "cache-and-network",
  });

  const ensembles = data?.ensembles || [];

  return { ensembles, loading, error, refetch };
}

// ── Members paginated hook (used by both dashboard and ensemble members page) ──

export function useMembersPaginated({ initialFilter = {}, queryType = "paginated", ensembleKey } = {}) {
  const [filter, setFilter] = useState(initialFilter);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkModal, setBulkModal] = useState({ open: false, mode: "add" });
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => setToast({ message, type });

  // Debounce search
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

  // Query
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
  const pageData = queryType === "ensemble"
    ? activeResult.data?.ensembleMembers
    : activeResult.data?.usersPaginated;

  const items  = pageData?.items  || [];
  const total  = pageData?.total  || 0;
  const facets = pageData?.facets || { byState: [], byRole: [], byInstrument: [], byEnsemble: [] };

  // Selection
  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(items.map((u) => u.id)));
  }, [items]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  // Bulk mutations
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

  const handleBulkApply = useCallback(async (ensembleKeys, mode) => {
    const userIds = Array.from(selectedIds);
    if (!userIds.length || !ensembleKeys.length) return;
    if (mode === "add") {
      await addMutation({ variables: { userIds, ensembleKeys } });
    } else {
      await removeMutation({ variables: { userIds, ensembleKeys } });
    }
  }, [selectedIds, addMutation, removeMutation]);

  const totalPages = Math.ceil(total / pagination.limit);

  return {
    // Data
    items, total, facets, totalPages,
    loading: activeResult.loading,
    error: activeResult.error,
    // Filter
    filter, pagination, setPagination,
    setSearchText, setFilterField, clearFilters,
    // Selection
    selectedIds, toggleSelect, selectAll, clearSelection,
    // Bulk
    bulkModal, setBulkModal,
    handleBulkApply,
    adding, removing,
    // Toast
    toast, setToast,
  };
}

export function useEnsemblesRef() {
  const { data } = useQuery(GET_ENSEMBLES, { fetchPolicy: "cache-first" });
  return useMemo(() => data?.ensembles || [], [data]);
}

// ── Counts hook: member + available totals for header badges ──────────────────
// Runs always (no skip) so badges are correct on page load without visiting each tab.

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
    loading,
    refetch,
  };
}

// ── Instrument stats hook ─────────────────────────────────────────────────────

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

// ── Focused single-tab hook for EnsembleControlPage ──────────────────────────
//
// queryType: "members" → ensembleMembers query (users IN ensemble)
//            "available" → ensembleAvailable query (users NOT in ensemble)
// skip: when false this tab's query is suspended (other tab is active)
//
export function useEnsemblePaginated(ensembleKey, queryType, skip = false) {
  const [filter, setFilterState]     = useState({});
  const [pagination, setPaginationState] = useState(DEFAULT_PAGINATION);
  const [selectedIds, setSelectedIds]    = useState(new Set());

  const searchTimer = useRef(null);
  const setSearchText = useCallback((text) => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setFilterState((prev) => ({ ...prev, searchText: text || undefined }));
      setPaginationState((prev) => ({ ...prev, page: 1 }));
      setSelectedIds(new Set()); // clear selection on search
    }, 300);
  }, []);

  const setFilterField = useCallback((field, value) => {
    setFilterState((prev) => ({ ...prev, [field]: value || undefined }));
    setPaginationState((prev) => ({ ...prev, page: 1 }));
    setSelectedIds(new Set()); // clear selection on filter
  }, []);

  const clearFilters = useCallback(() => {
    setFilterState({});
    setPaginationState(DEFAULT_PAGINATION);
    setSelectedIds(new Set()); // clear selection on reset
  }, []);

  const query   = queryType === "members" ? ENSEMBLE_MEMBERS : ENSEMBLE_AVAILABLE;
  const dataKey = queryType === "members" ? "ensembleMembers" : "ensembleAvailable";

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

  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll     = useCallback(() => setSelectedIds(new Set(items.map((u) => u.id))), [items]);
  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const setPagination = useCallback((updater) => {
    setPaginationState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      return { ...prev, ...next };
    });
    setSelectedIds(new Set()); // clear selection on page/limit change
  }, []);

  return {
    items, total, facets, loading,
    filter, pagination, setPagination,
    setSearchText, setFilterField, clearFilters,
    selectedIds, toggleSelect, selectAll, clearSelection,
    refetch,
  };
}
