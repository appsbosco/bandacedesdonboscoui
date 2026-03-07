import { useState, useCallback, useMemo, useRef } from "react";
import { useQuery } from "@apollo/client";
import { USERS_PAGINATED_FOR_MEMBERS } from "../graphql/queries/members";

const EMPTY_FACETS = { byState: [], byRole: [], byInstrument: [], byEnsemble: [] };
const DEFAULT_PAGINATION = { page: 1, limit: 25, sortBy: "firstSurName", sortDir: "asc" };

/**
 * Server-side paginated users hook.
 *
 * @param {string[]} roles    - Pre-applied role filter (cannot be overridden by user)
 * @param {object}  initialFilter - Extra filter fields applied on mount
 */
export function useUsersPaginated({ roles = [], initialFilter = {} } = {}) {
  const [filter, setFilter] = useState(initialFilter);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);

  // Merge the fixed role filter with the user-controlled filter
  const queryFilter = useMemo(
    () => ({
      ...filter,
      roles: roles.length > 0 ? roles : undefined,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filter, JSON.stringify(roles)]
  );

  const { data, loading, error, refetch } = useQuery(USERS_PAGINATED_FOR_MEMBERS, {
    variables: { filter: queryFilter, pagination },
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: false,
  });

  const items = data?.usersPaginated?.items || [];
  const total = data?.usersPaginated?.total || 0;
  const facets = data?.usersPaginated?.facets || EMPTY_FACETS;

  // ── Debounced search ───────────────────────────────────────────────────────
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    items, total, facets, loading, error,
    filter, pagination, setPagination,
    setSearchText, setFilterField, clearFilters,
    refetch,
  };
}
