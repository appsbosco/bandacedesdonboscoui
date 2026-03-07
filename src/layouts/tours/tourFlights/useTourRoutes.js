import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_TOUR_ROUTES,
  GET_UNASSIGNED_TOUR_FLIGHTS,
  CREATE_TOUR_ROUTE,
  UPDATE_TOUR_ROUTE,
  DELETE_TOUR_ROUTE,
  ASSIGN_FLIGHTS_TO_ROUTE,
  UNASSIGN_FLIGHTS_FROM_ROUTE,
  ASSIGN_PASSENGERS_TO_ROUTE,
  REMOVE_PASSENGERS_FROM_ROUTE,
} from "./tourRoutes.gql";

export function useTourRoutes(tourId) {
  const [formModal, setFormModal] = useState({ open: false, mode: "create", route: null });
  const [assignFlightsModal, setAssignFlightsModal] = useState({ open: false, route: null });
  const [assignPassengersModal, setAssignPassengersModal] = useState({ open: false, route: null });
  const [assignResult, setAssignResult] = useState(null);
  const [toast, setToast] = useState(null);

  // ── Queries ─────────────────────────────────────────────────────────────────
  const {
    data: routesData,
    loading: routesLoading,
    error: routesError,
    refetch: refetchRoutes,
  } = useQuery(GET_TOUR_ROUTES, {
    variables: { tourId },
    skip: !tourId,
    fetchPolicy: "cache-and-network",
  });

  const {
    data: unassignedData,
    loading: unassignedLoading,
    refetch: refetchUnassigned,
  } = useQuery(GET_UNASSIGNED_TOUR_FLIGHTS, {
    variables: { tourId },
    skip: !tourId,
    fetchPolicy: "cache-and-network",
  });

  const refetchAll = useCallback(async () => {
    await Promise.all([refetchRoutes(), refetchUnassigned()]);
  }, [refetchRoutes, refetchUnassigned]);

  // ── Mutations ────────────────────────────────────────────────────────────────
  const showToast = (message, type = "success") => setToast({ message, type });

  const [createRoute, { loading: creating }] = useMutation(CREATE_TOUR_ROUTE, {
    onCompleted: () => {
      showToast("Ruta creada correctamente", "success");
      setFormModal({ open: false, mode: "create", route: null });
      refetchAll();
    },
    onError: (e) => showToast(e.message, "error"),
  });

  const [updateRoute, { loading: updating }] = useMutation(UPDATE_TOUR_ROUTE, {
    onCompleted: () => {
      showToast("Ruta actualizada", "success");
      setFormModal({ open: false, mode: "create", route: null });
      refetchAll();
    },
    onError: (e) => showToast(e.message, "error"),
  });

  const [deleteRoute, { loading: deleting }] = useMutation(DELETE_TOUR_ROUTE, {
    onCompleted: () => {
      showToast("Ruta eliminada", "success");
      refetchAll();
    },
    onError: (e) => showToast(e.message, "error"),
  });

  const [assignFlightsMutation, { loading: assigningFlights }] = useMutation(ASSIGN_FLIGHTS_TO_ROUTE, {
    onCompleted: () => {
      showToast("Vuelos asignados a la ruta", "success");
      setAssignFlightsModal({ open: false, route: null });
      refetchAll();
    },
    onError: (e) => showToast(e.message, "error"),
  });

  const [unassignFlightsMutation] = useMutation(UNASSIGN_FLIGHTS_FROM_ROUTE, {
    onCompleted: () => {
      showToast("Vuelo removido de la ruta", "success");
      refetchAll();
    },
    onError: (e) => showToast(e.message, "error"),
  });

  const [assignPassengersMutation, { loading: assigningPassengers }] = useMutation(
    ASSIGN_PASSENGERS_TO_ROUTE,
    {
      onCompleted: (data) => {
        const r = data?.assignPassengersToRoute;
        const conflicts = r?.conflicts || [];
        if (conflicts.length > 0) {
          showToast(
            `${r.assigned} asignado${r.assigned !== 1 ? "s" : ""}. ${conflicts.length} conflicto${conflicts.length !== 1 ? "s" : ""}.`,
            r.assigned > 0 ? "success" : "error"
          );
        } else {
          showToast(`${r.assigned} pasajero${r.assigned !== 1 ? "s" : ""} asignado${r.assigned !== 1 ? "s" : ""}`, "success");
        }
        setAssignResult(r);
        refetchAll();
      },
      onError: (e) => showToast(e.message, "error"),
    }
  );

  const [removePassengersMutation, { loading: removingPassengers }] = useMutation(
    REMOVE_PASSENGERS_FROM_ROUTE,
    {
      onCompleted: (data) => {
        const r = data?.removePassengersFromRoute;
        showToast(`${r.removed} pasajero${r.removed !== 1 ? "s" : ""} removido${r.removed !== 1 ? "s" : ""}`, "success");
        refetchAll();
      },
      onError: (e) => showToast(e.message, "error"),
    }
  );

  // ── Modal helpers ────────────────────────────────────────────────────────────
  const openCreateModal = useCallback(() =>
    setFormModal({ open: true, mode: "create", route: null }), []);
  const openEditModal = useCallback((route) =>
    setFormModal({ open: true, mode: "edit", route }), []);
  const closeFormModal = useCallback(() =>
    setFormModal({ open: false, mode: "create", route: null }), []);

  const openAssignFlightsModal = useCallback((route) =>
    setAssignFlightsModal({ open: true, route }), []);
  const closeAssignFlightsModal = useCallback(() =>
    setAssignFlightsModal({ open: false, route: null }), []);

  const openAssignPassengersModal = useCallback((route) => {
    setAssignResult(null);
    setAssignPassengersModal({ open: true, route });
  }, []);
  const closeAssignPassengersModal = useCallback(() =>
    setAssignPassengersModal({ open: false, route: null }), []);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (input) => {
    if (formModal.mode === "create") {
      await createRoute({ variables: { tourId, input } });
    } else {
      await updateRoute({ variables: { id: formModal.route.id, input } });
    }
  };

  const handleDelete = async (route) => {
    await deleteRoute({ variables: { id: route.id } });
  };

  const handleAssignFlights = async (flightIds) => {
    await assignFlightsMutation({
      variables: { routeId: assignFlightsModal.route.id, flightIds },
    });
  };

  const handleUnassignFlight = async (routeId, flightId) => {
    await unassignFlightsMutation({ variables: { routeId, flightIds: [flightId] } });
  };

  const handleAssignPassengers = async (participantIds) => {
    const result = await assignPassengersMutation({
      variables: { routeId: assignPassengersModal.route.id, participantIds },
    });
    return result?.data?.assignPassengersToRoute || null;
  };

  const handleRemovePassengers = async (routeId, participantIds) => {
    await removePassengersMutation({ variables: { routeId, participantIds } });
  };

  // ── Derived data ─────────────────────────────────────────────────────────────
  const routes = routesData?.getTourRoutes || [];
  const unassignedFlights = unassignedData?.getUnassignedTourFlights || [];

  return {
    routes,
    unassignedFlights,
    routesLoading,
    routesError,
    unassignedLoading,
    // Modals
    formModal,
    assignFlightsModal,
    assignPassengersModal,
    assignResult,
    openCreateModal,
    openEditModal,
    closeFormModal,
    openAssignFlightsModal,
    closeAssignFlightsModal,
    openAssignPassengersModal,
    closeAssignPassengersModal,
    // Actions
    handleSubmit,
    handleDelete,
    handleAssignFlights,
    handleUnassignFlight,
    handleAssignPassengers,
    handleRemovePassengers,
    // Loading
    creating,
    updating,
    deleting,
    assigningFlights,
    assigningPassengers,
    removingPassengers,
    // Toast
    toast,
    setToast,
    setAssignResult,
    refetchAll,
  };
}
