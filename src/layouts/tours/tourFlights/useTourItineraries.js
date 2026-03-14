import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_TOUR_ITINERARIES,
  GET_UNASSIGNED_TOUR_FLIGHTS,
  CREATE_TOUR_ITINERARY,
  UPDATE_TOUR_ITINERARY,
  DELETE_TOUR_ITINERARY,
  ASSIGN_FLIGHTS_TO_ITINERARY,
  UNASSIGN_FLIGHTS_FROM_ITINERARY,
  ASSIGN_PASSENGERS_TO_ITINERARY,
  REMOVE_PASSENGERS_FROM_ITINERARY,
  SET_ITINERARY_LEADERS,
} from "./tourItineraries.gql.js";

export function useTourItineraries(tourId) {
  const [formModal, setFormModal] = useState({ open: false, mode: "create", itinerary: null });
  const [assignFlightsModal, setAssignFlightsModal] = useState({ open: false, itinerary: null });
const [assignPassengersModal, setAssignPassengersModal] = useState({ open: false, itineraryId: null });
  const [leadersModal, setLeadersModal] = useState({ open: false, itinerary: null });
  const [assignResult, setAssignResult] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => setToast({ message, type });

  // ── Queries ─────────────────────────────────────────────────────────────────
  const {
    data: itinerariesData,
    loading: itinerariesLoading,
    error: itinerariesError,
    refetch: refetchItineraries,
  } = useQuery(GET_TOUR_ITINERARIES, {
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
    await Promise.all([refetchItineraries(), refetchUnassigned()]);
  }, [refetchItineraries, refetchUnassigned]);

  // ── Mutations ────────────────────────────────────────────────────────────────
  const [createItinerary, { loading: creating }] = useMutation(CREATE_TOUR_ITINERARY, {
    onCompleted: () => {
      showToast("Itinerario creado", "success");
      setFormModal({ open: false, mode: "create", itinerary: null });
      refetchAll();
    },
    onError: (e) => showToast(e.message, "error"),
  });

  const [updateItinerary, { loading: updating }] = useMutation(UPDATE_TOUR_ITINERARY, {
    onCompleted: () => {
      showToast("Itinerario actualizado", "success");
      setFormModal({ open: false, mode: "create", itinerary: null });
      refetchAll();
    },
    onError: (e) => showToast(e.message, "error"),
  });

  const [deleteItinerary, { loading: deleting }] = useMutation(DELETE_TOUR_ITINERARY, {
    onCompleted: () => { showToast("Itinerario eliminado", "success"); refetchAll(); },
    onError: (e) => showToast(e.message, "error"),
  });

  const [assignFlightsMutation, { loading: assigningFlights }] = useMutation(
    ASSIGN_FLIGHTS_TO_ITINERARY,
    {
      onCompleted: () => {
        showToast("Vuelos asignados al itinerario", "success");
        setAssignFlightsModal({ open: false, itinerary: null });
        refetchAll();
      },
      onError: (e) => showToast(e.message, "error"),
    }
  );

  const [unassignFlightsMutation] = useMutation(UNASSIGN_FLIGHTS_FROM_ITINERARY, {
    onCompleted: () => { showToast("Vuelo removido del itinerario", "success"); refetchAll(); },
    onError: (e) => showToast(e.message, "error"),
  });

  const [assignPassengersMutation, { loading: assigningPassengers }] = useMutation(
    ASSIGN_PASSENGERS_TO_ITINERARY,
    {
      onCompleted: (data) => {
        const r = data?.assignPassengersToItinerary;
        const capacityConflicts = (r.conflicts || []).filter((c) => c.reason === "CAPACITY_EXCEEDED");
        const assignConflicts   = (r.conflicts || []).filter((c) => c.reason === "ALREADY_ASSIGNED");
        const parts = [];
        if (r.assigned > 0) parts.push(`${r.assigned} asignado${r.assigned !== 1 ? "s" : ""}`);
        if (capacityConflicts.length > 0) parts.push(`${capacityConflicts.length} sin cupo`);
        if (assignConflicts.length > 0) parts.push(`${assignConflicts.length} en otro itinerario`);
        showToast(parts.join(" · ") || "Sin cambios", r.assigned > 0 ? "success" : "error");
        setAssignResult(r);
        refetchAll();
      },
      onError: (e) => showToast(e.message, "error"),
    }
  );

  const [removePassengersMutation, { loading: removingPassengers }] = useMutation(
    REMOVE_PASSENGERS_FROM_ITINERARY,
    {
      onCompleted: (data) => {
        const r = data?.removePassengersFromItinerary;
        showToast(`${r.removed} pasajero${r.removed !== 1 ? "s" : ""} removido${r.removed !== 1 ? "s" : ""}`, "success");
        refetchAll();
      },
      onError: (e) => showToast(e.message, "error"),
    }
  );

  const [setLeadersMutation, { loading: settingLeaders }] = useMutation(SET_ITINERARY_LEADERS, {
    onCompleted: () => {
      showToast("Líderes actualizados", "success");
      setLeadersModal({ open: false, itinerary: null });
      refetchAll();
    },
    onError: (e) => showToast(e.message, "error"),
  });

  // ── Modal helpers ────────────────────────────────────────────────────────────
  const openCreateModal = useCallback(() =>
    setFormModal({ open: true, mode: "create", itinerary: null }), []);
  const openEditModal = useCallback((itinerary) =>
    setFormModal({ open: true, mode: "edit", itinerary }), []);
  const closeFormModal = useCallback(() =>
    setFormModal({ open: false, mode: "create", itinerary: null }), []);

  const openAssignFlightsModal = useCallback((itinerary) =>
    setAssignFlightsModal({ open: true, itinerary }), []);
  const closeAssignFlightsModal = useCallback(() =>
    setAssignFlightsModal({ open: false, itinerary: null }), []);

const openAssignPassengersModal = useCallback((itinerary) => {
  setAssignResult(null);
  setAssignPassengersModal({ open: true, itineraryId: itinerary.id });
}, []);

const closeAssignPassengersModal = useCallback(() =>
  setAssignPassengersModal({ open: false, itineraryId: null }), []);

  const openLeadersModal = useCallback((itinerary) =>
    setLeadersModal({ open: true, itinerary }), []);
  const closeLeadersModal = useCallback(() =>
    setLeadersModal({ open: false, itinerary: null }), []);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (input) => {
    if (formModal.mode === "create") {
      await createItinerary({ variables: { tourId, input } });
    } else {
      await updateItinerary({ variables: { id: formModal.itinerary.id, input } });
    }
  };

  const handleDelete = async (itinerary) => {
    await deleteItinerary({ variables: { id: itinerary.id } });
  };

  const handleAssignFlights = async (flightIds) => {
    await assignFlightsMutation({
      variables: { itineraryId: assignFlightsModal.itinerary.id, flightIds },
    });
  };

  const handleUnassignFlight = async (itineraryId, flightId) => {
    await unassignFlightsMutation({ variables: { itineraryId, flightIds: [flightId] } });
  };

  const handleAssignPassengers = async (participantIds) => {
    const result = await assignPassengersMutation({
      variables: { itineraryId: assignPassengersModal.itinerary.id, participantIds },
    });
    return result?.data?.assignPassengersToItinerary || null;
  };

  const handleRemovePassengers = async (itineraryId, participantIds) => {
    await removePassengersMutation({ variables: { itineraryId, participantIds } });
  };

  const handleSetLeaders = async (itineraryId, leaderIds) => {
    await setLeadersMutation({ variables: { itineraryId, leaderIds } });
  };

  // ── Derived data ─────────────────────────────────────────────────────────────
  const itineraries = itinerariesData?.getTourItineraries || [];
  const unassignedFlights = unassignedData?.getUnassignedTourFlights || [];



  const activePassengersItinerary = assignPassengersModal.itineraryId
  ? itineraries.find((it) => it.id === assignPassengersModal.itineraryId) ?? null
  : null;


  return {
    itineraries,
    assignPassengersModal: {
    open: assignPassengersModal.open,
    itinerary: activePassengersItinerary, 
  },
    unassignedFlights,
    itinerariesLoading,
    itinerariesError,
    unassignedLoading,
    formModal,
    assignFlightsModal,
    assignPassengersModal,
    leadersModal,
    assignResult,
    openCreateModal,
    openEditModal,
    closeFormModal,
    openAssignFlightsModal,
    closeAssignFlightsModal,
    openAssignPassengersModal,
    closeAssignPassengersModal,
    openLeadersModal,
    closeLeadersModal,
    handleSubmit,
    handleDelete,
    handleAssignFlights,
    handleUnassignFlight,
    handleAssignPassengers,
    handleRemovePassengers,
    handleSetLeaders,
    creating,
    updating,
    deleting,
    assigningFlights,
    assigningPassengers,
    removingPassengers,
    settingLeaders,
    toast,
    setToast,
    setAssignResult,
    refetchAll,
  };
}
