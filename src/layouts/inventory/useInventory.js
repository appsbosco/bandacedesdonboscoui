import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  INVENTORIES_PAGINATED,
  INVENTORY_STATS,
  INVENTORY_MAINTENANCE_HISTORY,
  ADD_MAINTENANCE_RECORD,
  DELETE_MAINTENANCE_RECORD,
  ADMIN_CLEANUP_INVENTORIES,
} from "./inventory.gql.js";

const DEFAULT_PAGINATION = { page: 1, limit: 25, sortBy: "createdAt", sortDir: "desc" };

// ── Paginated list ────────────────────────────────────────────────────────────

export function useInventoriesPaginated() {
  const [filter, setFilterState]         = useState({});
  const [pagination, setPaginationState] = useState(DEFAULT_PAGINATION);
  const [toast, setToast]                = useState(null);

  const showToast = (message, type = "success") => setToast({ message, type });

  // No debounce here — FilterBar owns the debounce; this just commits to state
  const setSearchText = useCallback((text) => {
    setFilterState((prev) => ({ ...prev, searchText: text || undefined }));
    setPaginationState((prev) => ({ ...prev, page: 1 }));
  }, []);

  // condition = tenencia
  const setFilterField = useCallback((field, value) => {
    setFilterState((prev) => ({ ...prev, [field]: value || undefined }));
    setPaginationState((prev) => ({ ...prev, page: 1 }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilterState({});
    setPaginationState(DEFAULT_PAGINATION);
  }, []);

  const setPagination = useCallback((updater) => {
    setPaginationState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      return { ...prev, ...next };
    });
  }, []);

  const { data, loading, error, refetch } = useQuery(INVENTORIES_PAGINATED, {
    variables: { filter, pagination },
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: false,
  });

  const pageData   = data?.inventoriesPaginated;
  const items      = pageData?.items  || [];
  const total      = pageData?.total  || 0;
  const facets     = pageData?.facets || { byStatus: [], byCondition: [], byInstrument: [] };
  const totalPages = Math.ceil(total / pagination.limit);

  return {
    items, total, facets, totalPages,
    loading, error,
    filter, pagination, setPagination,
    setSearchText, setFilterField, clearFilters,
    toast, setToast, showToast,
    refetch,
  };
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export function useInventoryStats() {
  const { data, loading, refetch } = useQuery(INVENTORY_STATS, {
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: false,
  });
  return {
    stats: data?.inventoryStats || { total: 0, onTime: 0, dueSoon: 0, overdue: 0, notApplicable: 0 },
    loading,
    refetch,
  };
}

// ── Maintenance ───────────────────────────────────────────────────────────────

export function useInventoryMaintenance(inventoryId) {
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => setToast({ message, type });

  const { data, loading, refetch } = useQuery(INVENTORY_MAINTENANCE_HISTORY, {
    variables: { inventoryId },
    skip: !inventoryId,
    fetchPolicy: "cache-and-network",
  });

  const records = data?.inventoryMaintenanceHistory || [];

  const [addRecord, { loading: adding }] = useMutation(ADD_MAINTENANCE_RECORD, {
    onCompleted: () => { showToast("Mantenimiento registrado"); refetch(); },
    onError: (e) => showToast(e.message, "error"),
  });

  const [deleteRecord, { loading: deleting }] = useMutation(DELETE_MAINTENANCE_RECORD, {
    onCompleted: () => { showToast("Registro eliminado"); refetch(); },
    onError: (e) => showToast(e.message, "error"),
  });

  const handleAdd = useCallback(async (input) => {
    if (!inventoryId) return;
    await addRecord({ variables: { inventoryId, input } });
  }, [inventoryId, addRecord]);

  const handleDelete = useCallback(async (id) => {
    await deleteRecord({ variables: { id } });
  }, [deleteRecord]);

  return { records, loading, adding, deleting, handleAdd, handleDelete, toast, setToast, refetch };
}

// ── Admin cleanup ─────────────────────────────────────────────────────────────

export function useAdminCleanup() {
  const [cleanup, { loading }] = useMutation(ADMIN_CLEANUP_INVENTORIES);

  const dryRun = useCallback(async () => {
    const { data } = await cleanup({ variables: { dryRun: true } });
    return data?.adminCleanupInventories;
  }, [cleanup]);

  const execute = useCallback(async () => {
    const { data } = await cleanup({ variables: { dryRun: false } });
    return data?.adminCleanupInventories;
  }, [cleanup]);

  return { dryRun, execute, loading };
}
