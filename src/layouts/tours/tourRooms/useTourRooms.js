import { useState, useCallback, useMemo, useRef } from "react";
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
  SET_ROOM_RESPONSIBLE,
} from "./tourRooms.gql";
import {
  suggestRoomsFromGroup,
  groupRoomPrefix,
  capacityToRoomType,
  computeRebalanceOps,
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

  // ── Live refs — always hold the latest derived data for use in callbacks ───────
  // This avoids the temporal-dead-zone error that occurs when useCallback closures
  // reference const declarations defined later in the same function body.
  const roomsRef = useRef([]);
  const allParticipantsRef = useRef([]);
  const sexOverridesRef = useRef(new Map());

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
  const [updateRoomRaw] = useMutation(UPDATE_TOUR_ROOM);
  const [updateParticipantSexMutation] = useMutation(UPDATE_TOUR_PARTICIPANT_SEX);
  const [setRoomResponsibleMutation] = useMutation(SET_ROOM_RESPONSIBLE);

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
    // Sync capacity upward if room is now over its stored capacity
    const room = roomsRef.current.find((r) => r.id === roomId);
    if (room) {
      const newCount = (room.occupantCount || 0) + 1;
      if (newCount > room.capacity) {
        try {
          await updateRoomRaw({ variables: { id: roomId, input: { capacity: newCount } } });
        } catch {
          // non-critical — ignore
        }
      }
    }
  };

  const handleRemoveOccupant = async (roomId, participantId) => {
    await removeOccupant({ variables: { roomId, participantId } });
    // Shrink capacity to match new occupant count
    const room = roomsRef.current.find((r) => r.id === roomId);
    if (room) {
      const newCount = Math.max(1, (room.occupantCount || 1) - 1);
      if (newCount !== room.capacity) {
        try {
          await updateRoomRaw({ variables: { id: roomId, input: { capacity: newCount } } });
        } catch {
          // non-critical — ignore
        }
      }
    }
  };

  // ── Planner: move occupant between rooms (with rebalancing) ──────────────────
  /**
   * Move participantId from fromRoomId to toRoomId.
   * fromRoomId === null  → participant currently has no room (assign only).
   * toRoomId   === null  → unassign (remove only).
   *
   * After the primary move this function:
   *  1. Cascades overflow: if toRoom exceeds MAX_ROOM_CAPACITY, the oldest
   *     occupant is pushed to the next sex-compatible room in sorted order.
   *  2. Auto-adjusts capacity: sets capacity = occupantCount on every affected room.
   *
   * All operations are computed up-front (computeRebalanceOps) and executed in
   * a single batch before the final refetch, minimising round-trips.
   */
  const handleMove = useCallback(
    async (participantId, fromRoomId, toRoomId) => {
      if (fromRoomId === toRoomId) return;
      setMovingId(participantId);
      try {
        // Compute the full operation plan (primary move + cascade + capacity sync)
        // Use refs so we always get the latest data without closure dependency issues.
        const ops = computeRebalanceOps({
          rooms: roomsRef.current,
          participantId,
          fromRoomId,
          toRoomId,
          sexOverrides: sexOverridesRef.current,
          allParticipants: allParticipantsRef.current,
        });

        // Execute operations in order
        for (const op of ops) {
          if (op.type === "remove") {
            await removeOccupantRaw({
              variables: { roomId: op.roomId, participantId: op.participantId },
            });
          } else if (op.type === "assign") {
            await assignOccupantRaw({
              variables: { roomId: op.roomId, participantId: op.participantId },
            });
          } else if (op.type === "updateCapacity") {
            await updateRoomRaw({
              variables: { id: op.roomId, input: { capacity: op.capacity } },
            });
          }
        }

        await refetch();

        const cascadeCount = ops.filter(
          (o) => o.type === "assign" && o.roomId !== toRoomId
        ).length;
        const msg = toRoomId
          ? cascadeCount > 0
            ? `Participante movido · ${cascadeCount} reajuste${cascadeCount !== 1 ? "s" : ""} en cadena`
            : "Participante movido"
          : "Participante quitado de habitación";
        showToast(msg, "success");
      } catch (e) {
        showToast(e.message || "Error al mover participante", "error");
        await refetch(); // sync state on error
      } finally {
        setMovingId(null);
      }
    },
    // Refs (roomsRef, allParticipantsRef, sexOverridesRef) are intentionally omitted
    // from deps — refs are stable objects; their .current is always up to date.
    [removeOccupantRaw, assignOccupantRaw, updateRoomRaw, refetch]
  );

  // ── Planner: inline capacity change (CapacityEditor in RoomListPanel) ─────────
  const handleCapacityChange = useCallback(
    async (room, newCapacity) => {
      try {
        await updateRoomRaw({
          variables: {
            id: room.id,
            input: { capacity: newCapacity },
          },
        });
        await refetch();
      } catch (e) {
        showToast(e.message || "Error al cambiar capacidad", "error");
      }
    },
    [updateRoomRaw, refetch]
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

  // ── Planner: set / clear responsible person for a room ───────────────────────
  const handleSetResponsible = useCallback(
    async (roomId, participantId) => {
      try {
        await setRoomResponsibleMutation({ variables: { roomId, participantId: participantId || null } });
        await refetch();
      } catch (e) {
        showToast(e.message || "Error al actualizar responsable", "error");
      }
    },
    [setRoomResponsibleMutation, refetch]
  );

  // ── Planner: create rooms from a suggested group ──────────────────────────────
  /**
   * Takes a GroupBucket from computeGroups and creates rooms automatically.
   *
   * Key guarantee: EVERY participant in group.participants ends up assigned.
   * Room capacity comes from suggestion.capacity (computed by optimalRoomSizes),
   * NOT from plannerCapacity (which is only for manual room creation).
   */
  const handleCreateRoomsFromGroup = useCallback(
    async (group) => {
      const hotel = plannerHotel || "Sin especificar";
      const prefix = groupRoomPrefix(group);
      // Pass { prefix } as options — capacity is determined by optimalRoomSizes internally
      const suggestions = suggestRoomsFromGroup(group.participants, { prefix });
      if (suggestions.length === 0) return;

      setBulkCreating(true);
      let created = 0;
      let occupied = 0;
      let skipped = 0;

      for (const suggestion of suggestions) {
        try {
          const roomInput = {
            hotelName: hotel,
            // suggestion.name already includes the prefix (e.g. "M-1", "M-2")
            roomNumber: suggestion.name,
            // ← FIX: use suggestion.capacity, not plannerCapacity
            roomType: capacityToRoomType(suggestion.capacity),
            capacity: suggestion.capacity,
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
                // participant may already be assigned elsewhere; count as skipped
                skipped++;
              }
            }
          }
        } catch {
          // continue with next room on creation failure
        }
      }

      await refetch();
      await refetchParticipants();
      setBulkCreating(false);

      const skippedNote = skipped > 0 ? ` · ${skipped} omitido${skipped !== 1 ? "s" : ""}` : "";
      showToast(
        `${created} habitación${created !== 1 ? "es" : ""} creada${created !== 1 ? "s" : ""} · ${occupied} asignados${skippedNote}`,
        skipped > 0 ? "warning" : "success"
      );
    },
    // plannerCapacity intentionally removed — room sizes come from optimalRoomSizes
    [plannerHotel, tourId, createRoomRaw, assignOccupantRaw, refetch, refetchParticipants]
  );

  // ── Derived data ──────────────────────────────────────────────────────────────
  const rooms = data?.getTourRooms || [];
  const allParticipants = participantsData?.getTourParticipants || [];

  // Keep refs in sync so callbacks always read fresh data
  roomsRef.current = rooms;
  allParticipantsRef.current = allParticipants;

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
  sexOverridesRef.current = sexOverrides;

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
    handleSetResponsible,
    handleCapacityChange,
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
