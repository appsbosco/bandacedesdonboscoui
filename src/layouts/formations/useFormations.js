import { useState, useCallback } from "react";
import { useQuery, useMutation, useLazyQuery } from "@apollo/client";
import {
  FORMATIONS_LIST,
  FORMATION_DETAIL,
  FORMATION_TEMPLATES,
  FORMATION_USERS_BY_SECTION,
  CREATE_FORMATION,
  UPDATE_FORMATION,
  DELETE_FORMATION,
  CREATE_FORMATION_TEMPLATE,
  UPDATE_FORMATION_TEMPLATE,
  DELETE_FORMATION_TEMPLATE,
} from "./formations.gql.js";

// ── Formation list ────────────────────────────────────────────────────────────

export function useFormationsList(filter = {}) {
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => setToast({ message, type });

  const { data, loading, error, refetch } = useQuery(FORMATIONS_LIST, {
    variables: { filter },
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: false,
  });

  const [deleteFormation, { loading: deleting }] = useMutation(DELETE_FORMATION, {
    onCompleted: () => { showToast("Formación eliminada"); refetch(); },
    onError: (e) => showToast(e.message, "error"),
  });

  const handleDelete = useCallback(
    async (id) => { await deleteFormation({ variables: { id } }); },
    [deleteFormation]
  );

  return {
    formations: data?.formations || [],
    loading,
    error,
    deleting,
    handleDelete,
    refetch,
    toast,
    setToast,
    showToast,
  };
}

// ── Formation detail ──────────────────────────────────────────────────────────

export function useFormationDetail(id) {
  const { data, loading } = useQuery(FORMATION_DETAIL, {
    variables: { id },
    skip: !id,
    fetchPolicy: "network-only",
  });
  return {
    formation: data?.formation || null,
    loading,
  };
}

// ── Templates ─────────────────────────────────────────────────────────────────

export function useFormationTemplates() {
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => setToast({ message, type });

  const { data, loading, refetch } = useQuery(FORMATION_TEMPLATES, {
    fetchPolicy: "cache-and-network",
  });

  const [createTemplate, { loading: creating }] = useMutation(CREATE_FORMATION_TEMPLATE, {
    onCompleted: () => { showToast("Plantilla creada"); refetch(); },
    onError: (e) => showToast(e.message, "error"),
  });

  const [updateTemplate] = useMutation(UPDATE_FORMATION_TEMPLATE, {
    onCompleted: () => { showToast("Plantilla actualizada"); refetch(); },
    onError: (e) => showToast(e.message, "error"),
  });

  const [deleteTemplate, { loading: deleting }] = useMutation(DELETE_FORMATION_TEMPLATE, {
    onCompleted: () => { showToast("Plantilla eliminada"); refetch(); },
    onError: (e) => showToast(e.message, "error"),
  });

  const handleCreate = useCallback(
    async (input) => {
      const { data: d } = await createTemplate({ variables: { input } });
      return d?.createFormationTemplate;
    },
    [createTemplate]
  );

  const handleUpdate = useCallback(
    async (id, input) => {
      await updateTemplate({ variables: { id, input } });
    },
    [updateTemplate]
  );

  const handleDelete = useCallback(
    async (id) => { await deleteTemplate({ variables: { id } }); },
    [deleteTemplate]
  );

  return {
    templates: data?.formationTemplates || [],
    loading,
    creating,
    deleting,
    handleCreate,
    handleUpdate,
    handleDelete,
    toast,
    setToast,
  };
}

// ── Users by section (lazy — triggered when user clicks "Cargar músicos") ─────

export function useFormationUsers() {
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => setToast({ message, type });

  const [fetchUsers, { data, loading }] = useLazyQuery(FORMATION_USERS_BY_SECTION, {
    fetchPolicy: "network-only",
    onError: (e) => showToast(e.message, "error"),
  });

  const loadUsers = useCallback(
    ({ excludedIds = [], instrumentMappings = [] } = {}) =>
      fetchUsers({ variables: { excludedIds, instrumentMappings } }),
    [fetchUsers]
  );

  return {
    sections: data?.formationUsersBySection?.sections || [],
    unmapped: data?.formationUsersBySection?.unmapped || [],
    loading,
    loadUsers,
    toast,
    setToast,
  };
}

// ── Builder (create / update) ─────────────────────────────────────────────────

export function useFormationBuilder() {
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => setToast({ message, type });
  const isConflictError = (error) =>
    error?.graphQLErrors?.some((graphQLError) => graphQLError?.extensions?.code === "CONFLICT") ||
    error?.networkError?.result?.errors?.some(
      (graphQLError) => graphQLError?.extensions?.code === "CONFLICT"
    );

  const [createFormation, { loading: creating }] = useMutation(CREATE_FORMATION, {
    onError: (e) => showToast(e.message, "error"),
  });

  const [updateFormation, { loading: updating }] = useMutation(UPDATE_FORMATION);

  const handleCreate = useCallback(
    async (input) => {
      const { data } = await createFormation({ variables: { input } });
      return data?.createFormation;
    },
    [createFormation]
  );

  const handleUpdate = useCallback(
    async (id, input) => {
      try {
        const { data } = await updateFormation({ variables: { id, input } });
        return data?.updateFormation;
      } catch (e) {
        if (isConflictError(e)) throw e;
        showToast(e.message || "No se pudo actualizar la formación", "error");
        return null;
      }
    },
    [updateFormation, showToast]
  );

  return {
    handleCreate,
    handleUpdate,
    saving: creating || updating,
    toast,
    setToast,
    showToast,
  };
}
