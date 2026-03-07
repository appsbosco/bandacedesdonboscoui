import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_TOUR_FLIGHTS,
  CREATE_TOUR_FLIGHT,
  UPDATE_TOUR_FLIGHT,
  DELETE_TOUR_FLIGHT,
  ASSIGN_PASSENGER,
  ASSIGN_PASSENGERS,
  REMOVE_PASSENGER,
} from "./tourFlights.gql";

export function useTourFlights(tourId) {
  const [formModal, setFormModal] = useState({ open: false, mode: "create", flight: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, flight: null });
  const [passengersModal, setPassengersModal] = useState({ open: false, flight: null });
  const [toast, setToast] = useState(null);

  // ── Query ───────────────────────────────────────────────────────────────────
  const { data, loading, error, refetch } = useQuery(GET_TOUR_FLIGHTS, {
    variables: { tourId },
    skip: !tourId,
    fetchPolicy: "cache-and-network",
  });

  // ── Mutations ───────────────────────────────────────────────────────────────
  const [createFlight, { loading: creating }] = useMutation(CREATE_TOUR_FLIGHT, {
    onCompleted: () => {
      showToast("Vuelo creado correctamente", "success");
      closeFormModal();
      refetch();
    },
    onError: (e) => showToast(e.message, "error"),
  });

  const [updateFlight, { loading: updating }] = useMutation(UPDATE_TOUR_FLIGHT, {
    onCompleted: () => {
      showToast("Vuelo actualizado correctamente", "success");
      closeFormModal();
      refetch();
    },
    onError: (e) => showToast(e.message, "error"),
  });

  const [deleteFlight, { loading: deleting }] = useMutation(DELETE_TOUR_FLIGHT, {
    onCompleted: () => {
      showToast("Vuelo eliminado", "success");
      setDeleteModal({ open: false, flight: null });
      refetch();
    },
    onError: (e) => showToast(e.message, "error"),
  });

  const [assignPassenger, { loading: assigning }] = useMutation(ASSIGN_PASSENGER, {
    onCompleted: () => {
      showToast("Pasajero asignado", "success");
      refetch();
    },
    onError: (e) => showToast(e.message, "error"),
  });

  const [assignPassengersBulk, { loading: assigningBulk }] = useMutation(ASSIGN_PASSENGERS, {
    onCompleted: (data) => {
      const { assigned, conflicts } = data.assignPassengers;
      if (conflicts.length > 0) {
        showToast(
          `${assigned} asignado${assigned !== 1 ? "s" : ""}. ${
            conflicts.length
          } con conflicto de ruta.`,
          assigned > 0 ? "success" : "error"
        );
      } else {
        showToast(
          `${assigned} pasajero${assigned !== 1 ? "s" : ""} asignado${assigned !== 1 ? "s" : ""}`,
          "success"
        );
      }
      refetch();
    },
    onError: (e) => showToast(e.message, "error"),
  });

  const [removePassenger, { loading: removing }] = useMutation(REMOVE_PASSENGER, {
    onCompleted: () => {
      showToast("Pasajero removido", "success");
      refetch();
    },
    onError: (e) => showToast(e.message, "error"),
  });

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const showToast = (message, type = "success") => setToast({ message, type });

  const openCreateModal = useCallback(
    () => setFormModal({ open: true, mode: "create", flight: null }),
    []
  );
  const openEditModal = useCallback(
    (flight) => setFormModal({ open: true, mode: "edit", flight }),
    []
  );
  const closeFormModal = useCallback(
    () => setFormModal({ open: false, mode: "create", flight: null }),
    []
  );
  const openDeleteModal = useCallback((flight) => setDeleteModal({ open: true, flight }), []);
  const closeDeleteModal = useCallback(() => setDeleteModal({ open: false, flight: null }), []);
  const openPassengersModal = useCallback(
    (flight) => setPassengersModal({ open: true, flight }),
    []
  );
  const closePassengersModal = useCallback(
    () => setPassengersModal({ open: false, flight: null }),
    []
  );

  // ── Actions ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (input) => {
    if (formModal.mode === "create") {
      await createFlight({ variables: { input: { ...input, tourId } } });
    } else {
      await updateFlight({ variables: { id: formModal.flight.id, input } });
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.flight) return;
    await deleteFlight({ variables: { id: deleteModal.flight.id } });
  };

  const handleAssignPassenger = async (flightId, participantId) => {
    await assignPassenger({ variables: { flightId, participantId } });
  };

  // Retorna el resultado con conflictos para que el modal lo muestre
  const handleAssignPassengers = async (flightId, participantIds) => {
    const result = await assignPassengersBulk({ variables: { flightId, participantIds } });
    return result?.data?.assignPassengers || null;
  };

  const handleRemovePassenger = async (flightId, participantId) => {
    await removePassenger({ variables: { flightId, participantId } });
  };

  // ── Derived data ─────────────────────────────────────────────────────────────
  const flights = data?.getTourFlights || [];

  const outbound = useMemo(() => flights.filter((f) => f.direction === "OUTBOUND"), [flights]);
  const inbound = useMemo(() => flights.filter((f) => f.direction === "INBOUND"), [flights]);
  const connecting = useMemo(() => flights.filter((f) => f.direction === "CONNECTING"), [flights]);
  const totalPassengers = useMemo(
    () => flights.reduce((acc, f) => acc + (f.passengerCount || 0), 0),
    [flights]
  );

  // Rutas únicas definidas en los vuelos de esta gira (para el selector del form)
  const routeGroups = useMemo(() => {
    const groups = new Set(flights.map((f) => f.routeGroup).filter(Boolean));
    return Array.from(groups).sort();
  }, [flights]);

  // Mapa: participantId → { flightLabel, routeGroup } para saber dónde está asignado
  const participantAssignments = useMemo(() => {
    const map = new Map();
    for (const f of flights) {
      for (const p of f.passengers || []) {
        const pid = p.participant?.id;
        if (!pid) continue;
        if (!map.has(pid)) {
          map.set(pid, {
            flightLabel: `${f.airline} ${f.flightNumber}`,
            routeGroup: f.routeGroup || null,
            flightId: f.id,
          });
        }
      }
    }
    return map;
  }, [flights]);

  return {
    flights,
    outbound,
    inbound,
    connecting,
    totalPassengers,
    routeGroups,
    participantAssignments,
    loading,
    error,
    // Modals
    formModal,
    deleteModal,
    passengersModal,
    openCreateModal,
    openEditModal,
    closeFormModal,
    openDeleteModal,
    closeDeleteModal,
    openPassengersModal,
    closePassengersModal,
    // Actions
    handleSubmit,
    handleDelete,
    handleAssignPassenger,
    handleAssignPassengers,
    handleRemovePassenger,
    // Loading states
    creating,
    updating,
    deleting,
    assigning,
    assigningBulk,
    removing,
    // Toast
    toast,
    setToast,
  };
}
