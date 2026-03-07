import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_TOUR_ROOMS,
  GET_TOUR_PARTICIPANTS_PLANNER,
  CREATE_TOUR_ROOM,
  UPDATE_TOUR_ROOM,
  DELETE_TOUR_ROOM,
  ASSIGN_OCCUPANT,
  REMOVE_OCCUPANT,
  UPDATE_TOUR_PARTICIPANT_SEX,
} from "./tourRooms.gql";
import {
  suggestRoomsFromGroup,
  groupRoomPrefix,
  capacityToRoomType,
} from "./roomGrouping";

export function useTourRooms(tourId) {
  const [formModal, setFormModal] = useState({ open: false, mode: "create", room: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, room: null });
  const [occupantsModal, setOccupantsModal] = useState({ open: false, room: null });
  const [toast, setToast] = useState(null);

  // ── Planner state ────────────────────────────────────────────────────────────
  const [plannerCapacity, setPlannerCapacity] = useState(4);
  const [plannerHotel, setPlannerHotel] = useState("");
  const [bulkCreating, setBulkCreating] = useState(false);
  const [movingId, setMovingId] = useState(null); // participantId being moved

  // ── Queries ───────────────────────────────────────────────────────────────────
  const { data, loading, error, refetch } = useQuery(GET_TOUR_ROOMS, {
    variables: { tourId },
    skip: !tourId,
    fetchPolicy: "cache-and-network",
  });

  const {
    data: participantsData,
    loading: participantsLoading,
    refetch: refetchParticipants,
  } = useQuery(GET_TOUR_PARTICIPANTS_PLANNER, {
    variables: { tourId },
    skip: !tourId,
    fetchPolicy: "cache-and-network",
  });

  // ── Mutations ─────────────────────────────────────────────────────────────────
  const [createRoom, { loading: creating }] = useMutation(CREATE_TOUR_ROOM, {
    onCompleted: () => {
      showToast("Habitación creada correctamente", "success");
      closeFormModal();
      refetch();
    },
    onError: (e) => showToast(e.message, "error"),
  });

  const [updateRoom, { loading: updating }] = useMutation(UPDATE_TOUR_ROOM, {
    onCompleted: () => {
      showToast("Habitación actualizada correctamente", "success");
      closeFormModal();
      refetch();
    },
    onError: (e) => showToast(e.message, "error"),
  });

  const [deleteRoom, { loading: deleting }] = useMutation(DELETE_TOUR_ROOM, {
    onCompleted: () => {
      showToast("Habitación eliminada", "success");
      setDeleteModal({ open: false, room: null });
      refetch();
    },
    onError: (e) => showToast(e.message, "error"),
  });

  const [assignOccupant, { loading: assigning }] = useMutation(ASSIGN_OCCUPANT, {
    onCompleted: () => {
      showToast("Ocupante asignado", "success");
      refetch();
    },
    onError: (e) => showToast(e.message, "error"),
  });

  const [removeOccupant, { loading: removing }] = useMutation(REMOVE_OCCUPANT, {
    onCompleted: () => {
      showToast("Ocupante removido", "success");
      refetch();
    },
    onError: (e) => showToast(e.message, "error"),
  });

  // Raw mutations for bulk / move operations (no per-mutation toast)
  const [createRoomRaw] = useMutation(CREATE_TOUR_ROOM);
  const [assignOccupantRaw] = useMutation(ASSIGN_OCCUPANT);
  const [removeOccupantRaw] = useMutation(REMOVE_OCCUPANT);
  const [updateParticipantSexMutation] = useMutation(UPDATE_TOUR_PARTICIPANT_SEX);

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const showToast = (message, type = "success") => setToast({ message, type });

  const openCreateModal = useCallback(
    () => setFormModal({ open: true, mode: "create", room: null }),
    []
  );
  const openEditModal = useCallback(
    (room) => setFormModal({ open: true, mode: "edit", room }),
    []
  );
  const closeFormModal = useCallback(
    () => setFormModal({ open: false, mode: "create", room: null }),
    []
  );
  const openDeleteModal = useCallback((room) => setDeleteModal({ open: true, room }), []);
  const closeDeleteModal = useCallback(() => setDeleteModal({ open: false, room: null }), []);
  const openOccupantsModal = useCallback(
    (room) => setOccupantsModal({ open: true, room }),
    []
  );
  const closeOccupantsModal = useCallback(
    () => setOccupantsModal({ open: false, room: null }),
    []
  );

  // ── Standard CRUD actions ────────────────────────────────────────────────────
  const handleSubmit = async (input) => {
    if (formModal.mode === "create") {
      await createRoom({ variables: { input: { ...input, tourId } } });
    } else {
      await updateRoom({ variables: { id: formModal.room.id, input } });
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.room) return;
    await deleteRoom({ variables: { id: deleteModal.room.id } });
  };

  const handleAssignOccupant = async (roomId, participantId) => {
    await assignOccupant({ variables: { roomId, participantId } });
  };

  const handleRemoveOccupant = async (roomId, participantId) => {
    await removeOccupant({ variables: { roomId, participantId } });
  };

  // ── Planner: move occupant between rooms ──────────────────────────────────────
  /**
   * Move participantId from fromRoomId to toRoomId.
   * fromRoomId === null means the participant has no room yet (assign only).
   * toRoomId === null means unassign (remove only).
   */
  const handleMove = useCallback(
    async (participantId, fromRoomId, toRoomId) => {
      if (fromRoomId === toRoomId) return;
      setMovingId(participantId);
      try {
        if (fromRoomId) {
          await removeOccupantRaw({ variables: { roomId: fromRoomId, participantId } });
        }
        if (toRoomId) {
          await assignOccupantRaw({ variables: { roomId: toRoomId, participantId } });
        }
        await refetch();
        showToast(toRoomId ? "Participante movido" : "Participante removido", "success");
      } catch (e) {
        showToast(e.message || "Error al mover participante", "error");
      } finally {
        setMovingId(null);
      }
    },
    [removeOccupantRaw, assignOccupantRaw, refetch]
  );

  // ── Planner: update sex (persisted) ───────────────────────────────────────────
  const handleSetSex = useCallback(
    async (participantId, sex) => {
      try {
        await updateParticipantSexMutation({ variables: { participantId, sex } });
        await refetchParticipants();
      } catch (e) {
        showToast(e.message || "Error al actualizar sexo", "error");
      }
    },
    [updateParticipantSexMutation, refetchParticipants]
  );

  // ── Planner: create rooms from a suggested group ──────────────────────────────
  /**
   * Takes a GroupBucket from computeGroups and creates N rooms automatically.
   * Each room gets capacity-many participants, remainder goes into last room.
   */
  const handleCreateRoomsFromGroup = useCallback(
    async (group) => {
      const capacity = plannerCapacity;
      const hotel = plannerHotel || "Sin especificar";
      const prefix = groupRoomPrefix(group);
      const suggestions = suggestRoomsFromGroup(group.participants, capacity);
      if (suggestions.length === 0) return;

      setBulkCreating(true);
      let created = 0;
      let occupied = 0;

      for (const suggestion of suggestions) {
        try {
          const roomInput = {
            hotelName: hotel,
            roomNumber: `${prefix}-${String(suggestion.index).padStart(2, "0")}`,
            roomType: capacityToRoomType(capacity),
            capacity,
            tourId,
          };
          const res = await createRoomRaw({ variables: { input: roomInput } });
          const newRoomId = res?.data?.createTourRoom?.id;
          if (newRoomId) {
            created++;
            for (const p of suggestion.participants) {
              try {
                await assignOccupantRaw({ variables: { roomId: newRoomId, participantId: p.id } });
                occupied++;
              } catch {
                // participant may already be assigned elsewhere; continue
              }
            }
          }
        } catch {
          // continue with next room
        }
      }

      await refetch();
      setBulkCreating(false);
      showToast(
        `${created} habitación${created !== 1 ? "es" : ""} creada${
          created !== 1 ? "s" : ""
        } · ${occupied} asignados`,
        "success"
      );
    },
    [plannerCapacity, plannerHotel, tourId, createRoomRaw, assignOccupantRaw, refetch]
  );

  // ── Derived data ──────────────────────────────────────────────────────────────
  const rooms = data?.getTourRooms || [];
  const allParticipants = participantsData?.getTourParticipants || [];

  const totalOccupants = useMemo(
    () => rooms.reduce((acc, r) => acc + (r.occupantCount || 0), 0),
    [rooms]
  );

  const fullRooms = useMemo(() => rooms.filter((r) => r.isFull).length, [rooms]);

  const hotels = useMemo(() => {
    const set = new Set(rooms.map((r) => r.hotelName).filter(Boolean));
    return Array.from(set).sort();
  }, [rooms]);

  // Map: participantId → { roomNumber, hotelName, roomId }
  const participantRoomAssignments = useMemo(() => {
    const map = new Map();
    for (const r of rooms) {
      for (const o of r.occupants || []) {
        const pid = o.participant?.id;
        if (!pid) continue;
        if (!map.has(pid)) {
          map.set(pid, {
            roomNumber: r.roomNumber,
            hotelName: r.hotelName,
            roomId: r.id,
          });
        }
      }
    }
    return map;
  }, [rooms]);

  // Derived sex map from persisted participant data (replaces local sexOverrides state)
  const sexOverrides = useMemo(() => {
    const map = new Map();
    for (const p of allParticipants) {
      if (p.sex) map.set(p.id, p.sex);
    }
    return map;
  }, [allParticipants]);

  // Participants NOT assigned to any room (for planner)
  const unassignedParticipants = useMemo(() => {
    return allParticipants.filter((p) => !participantRoomAssignments.has(p.id));
  }, [allParticipants, participantRoomAssignments]);

  return {
    rooms,
    allParticipants,
    unassignedParticipants,
    totalOccupants,
    fullRooms,
    hotels,
    participantRoomAssignments,
    loading,
    participantsLoading,
    error,
    // Modals
    formModal,
    deleteModal,
    occupantsModal,
    openCreateModal,
    openEditModal,
    closeFormModal,
    openDeleteModal,
    closeDeleteModal,
    openOccupantsModal,
    closeOccupantsModal,
    // Standard actions
    handleSubmit,
    handleDelete,
    handleAssignOccupant,
    handleRemoveOccupant,
    // Loading states
    creating,
    updating,
    deleting,
    assigning,
    removing,
    // Planner
    sexOverrides,
    handleSetSex,
    plannerCapacity,
    setPlannerCapacity,
    plannerHotel,
    setPlannerHotel,
    handleMove,
    handleCreateRoomsFromGroup,
    bulkCreating,
    movingId,
    // Toast
    toast,
    setToast,
  };
}
