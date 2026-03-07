import { useState, useCallback, useRef } from "react";
import { useQuery } from "@apollo/client";
import { PARENTS_PAGINATED_FOR_MEMBERS } from "../graphql/queries/members";

const DEFAULT_PAGINATION = { page: 1, limit: 25, sortBy: "firstSurName", sortDir: "asc" };

/**
 * Server-side paginated parents hook with child-aware search.
 *
 * Searching by a child's name/carnet/email returns the parent(s) of that child.
 * Each item has: id, name, firstSurName, secondSurName, email, phone, avatar,
 *                children[{ id, name, firstSurName, secondSurName, carnet, email }],
 *                matchedBy: "PARENT" | "CHILD" | null,
 *                matchedChildIds: [ID]
 */
export function useParentsPaginated() {
  const [filter, setFilter]         = useState({});
  const [paginationState, setPaginationState] = useState(DEFAULT_PAGINATION);

  const { data, loading, error, refetch } = useQuery(PARENTS_PAGINATED_FOR_MEMBERS, {
    variables: { filter, pagination: paginationState },
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: false,
  });

  const items = data?.parentsPaginated?.items || [];
  const total = data?.parentsPaginated?.total || 0;

  // ── Debounced search (300 ms) ──────────────────────────────────────────────
  const searchTimer = useRef(null);
  const setSearchText = useCallback((text) => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setFilter((prev) => ({ ...prev, searchText: text || undefined }));
      setPaginationState((prev) => ({ ...prev, page: 1 }));
    }, 300);
  }, []);

  const clearFilters = useCallback(() => {
    setFilter({});
    setPaginationState(DEFAULT_PAGINATION);
  }, []);

  // Accepts both function updater and plain object — same contract as useUsersPaginated
  const setPagination = useCallback((updater) => {
    setPaginationState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      return { ...prev, ...next };
    });
  }, []);

  return {
    items,
    total,
    loading,
    error,
    filter,
    pagination: paginationState,
    setPagination,
    setSearchText,
    clearFilters,
    refetch,
  };
}
