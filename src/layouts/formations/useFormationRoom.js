import { useCallback, useEffect, useRef } from "react";
import {
  useMyPresence,
  useOthers,
  useStorage,
  useLiveMutation,
  useStatus,
} from "./liveblocks.config.js";

const BACKEND_URL = process.env.NODE_ENV === "production" ? "" : "http://localhost:4000";

export function useFormationRoom({ formationId, currentUser, initialSlots }) {
  const [myPresence, updateMyPresence] = useMyPresence();
  const others = useOthers();
  const status = useStatus();
  const debounceRef = useRef(null);

  const slotsMap = useStorage((root) => root.slots);
  const slots = slotsMap ? Array.from(slotsMap.values()) : [];

  // Presencia
  useEffect(() => {
    if (currentUser) {
      updateMyPresence({
        userId: currentUser.id,
        displayName: currentUser.name || currentUser.displayName,
        role: currentUser.role,
        color: currentUser.color || null,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  const moveSlot = useLiveMutation(
    ({ storage }, keyA, keyB) => {
      const liveSlots = storage.get("slots");
      const slotA = liveSlots.get(keyA);
      const slotB = liveSlots.get(keyB);
      if (!slotA || !slotB) return;
      if (slotA.locked || slotB.locked) return;
      liveSlots.set(keyA, {
        ...slotA,
        section: slotB.section,
        userId: slotB.userId,
        displayName: slotB.displayName,
        avatar: slotB.avatar || null,
      });
      liveSlots.set(keyB, {
        ...slotB,
        section: slotA.section,
        userId: slotA.userId,
        displayName: slotA.displayName,
        avatar: slotA.avatar || null,
      });
      updateMyPresence({ dragging: { slotId: null, displayName: null } });
    },
    [updateMyPresence]
  );

  const toggleSlotLock = useLiveMutation(({ storage }, key) => {
    const liveSlots = storage.get("slots");
    const slot = liveSlots.get(key);
    if (!slot) return;
    liveSlots.set(key, { ...slot, locked: !slot.locked });
  }, []);

  const setSlots = useLiveMutation(({ storage }, newSlots) => {
    const liveSlots = storage.get("slots");
    for (const key of Array.from(liveSlots.keys())) {
      liveSlots.delete(key);
    }
    for (const slot of newSlots) {
      liveSlots.set(`${slot.zone}:${slot.row}:${slot.col}`, slot);
    }
  }, []);

  const startDragging = useCallback(
    ({ slotId, displayName }) => {
      updateMyPresence({ dragging: { slotId, displayName } });
    },
    [updateMyPresence]
  );

  const stopDragging = useCallback(() => {
    updateMyPresence({ dragging: { slotId: null, displayName: null } });
  }, [updateMyPresence]);

  const persistToMongo = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (!slotsMap || slotsMap.size === 0) return;
      const slotsArray = Array.from(slotsMap.values()).filter((s) => s?.zone);
      const token = localStorage.getItem("token");
      try {
        await fetch(`${BACKEND_URL}/api/formations/${formationId}/persist`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ slots: slotsArray }),
        });
      } catch (e) {
        console.error("[useFormationRoom] persist failed:", e.message);
      }
    }, 2500);
  }, [slotsMap, formationId]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!slotsMap || slotsMap.size === 0) return;
      const slotsArray = Array.from(slotsMap.values()).filter((s) => s?.zone);
      navigator.sendBeacon(
        `${BACKEND_URL}/api/formations/${formationId}/persist`,
        new Blob([JSON.stringify({ slots: slotsArray })], { type: "application/json" })
      );
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [slotsMap, formationId]);

  const connectedUsers = others
    .map((other) => ({
      userId: other.presence.userId,
      displayName: other.presence.displayName,
      role: other.presence.role,
      color: other.presence.color,
    }))
    .filter((u) => u.userId);

  const draggingStates = others
    .map((other) => ({
      userId: other.presence.userId,
      displayName: other.presence.displayName,
      color: other.presence.color,
      dragging: other.presence.dragging,
    }))
    .filter((o) => o.dragging?.slotId);

  return {
    slots,
    slotsMap,
    setSlots,
    moveSlot,
    toggleSlotLock,
    startDragging,
    stopDragging,
    persistToMongo,
    connectedUsers,
    draggingStates,
    myPresence,
    connectionStatus: status,
    isConnected: status === "connected",
    isLoading: slotsMap === null,
  };
}
