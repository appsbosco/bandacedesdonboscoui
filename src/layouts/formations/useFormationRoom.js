import { useCallback, useEffect, useRef } from "react";
import {
  useMyPresence,
  useOthers,
  useStorage,
  useLiveMutation,
  useStatus,
} from "./liveblocks.config.js";
import { LiveMap } from "@liveblocks/client";

const BACKEND_URL = process.env.REACT_APP_GRAPHQL_URL
  ? process.env.REACT_APP_GRAPHQL_URL.replace("/api/graphql", "")
  : "http://localhost:4000";

function getSlotKey(slot) {
  return `${slot.zone}:${slot.row}:${slot.col}`;
}

function getSlotEntries(slotsStorage) {
  if (!slotsStorage) return [];
  if (typeof slotsStorage.entries === "function") {
    return Array.from(slotsStorage.entries());
  }
  if (Array.isArray(slotsStorage)) {
    return slotsStorage.filter((slot) => slot?.zone).map((slot) => [getSlotKey(slot), slot]);
  }
  if (typeof slotsStorage === "object") {
    return Object.entries(slotsStorage);
  }
  return [];
}

function getSlotValues(slotsStorage) {
  return getSlotEntries(slotsStorage)
    .map(([, slot]) => slot)
    .filter(Boolean);
}

function getSlotStorageSize(slotsStorage) {
  if (!slotsStorage) return 0;
  if (typeof slotsStorage.size === "number") return slotsStorage.size;
  return getSlotEntries(slotsStorage).length;
}

function ensureLiveSlots(storage) {
  const liveSlots = storage.get("slots");
  if (
    liveSlots &&
    typeof liveSlots.get === "function" &&
    typeof liveSlots.set === "function" &&
    typeof liveSlots.delete === "function" &&
    typeof liveSlots.keys === "function"
  ) {
    return liveSlots;
  }

  const upgradedSlots = new LiveMap(getSlotEntries(liveSlots));
  storage.set("slots", upgradedSlots);
  return upgradedSlots;
}

export function useFormationRoom({ formationId, currentUser, initialSlots }) {
  const [myPresence, updateMyPresence] = useMyPresence();
  const others = useOthers();
  const status = useStatus();
  const debounceRef = useRef(null);

  const slotsMap = useStorage((root) => root.slots);
  const slots = getSlotValues(slotsMap);

  // ── Hidratar presencia ──────────────────────────────────────────────────────
  useEffect(() => {
    if (currentUser) {
      updateMyPresence({
        userId: currentUser.id,
        displayName: currentUser.name || currentUser.displayName,
        role: currentUser.role,
        avatar: currentUser.avatar || null,
        color: currentUser.color || null,
        activeSlotKey: null,
        dragFromKey: null,
        dragOverKey: null,
        isDragging: false,
        dragging: { slotId: null, displayName: null },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  // ── Mutaciones de storage ───────────────────────────────────────────────────
  const moveSlot = useLiveMutation(
    ({ storage }, keyA, keyB) => {
      const liveSlots = ensureLiveSlots(storage);
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
    const liveSlots = ensureLiveSlots(storage);
    const slot = liveSlots.get(key);
    if (!slot) return;
    liveSlots.set(key, { ...slot, locked: !slot.locked });
  }, []);

  const setSlots = useLiveMutation(({ storage }, newSlots) => {
    const liveSlots = ensureLiveSlots(storage);
    for (const key of Array.from(liveSlots.keys())) {
      liveSlots.delete(key);
    }
    for (const slot of newSlots) {
      liveSlots.set(getSlotKey(slot), slot);
    }
  }, []);

  // ── Presencia de grid ───────────────────────────────────────────────────────
  const setActiveSlot = useCallback(
    (key) => {
      updateMyPresence({ activeSlotKey: key });
    },
    [updateMyPresence]
  );

  const notifyDragStart = useCallback(
    ({ slotId, displayName }) => {
      updateMyPresence({
        isDragging: true,
        dragFromKey: slotId,
        dragOverKey: slotId,
        activeSlotKey: slotId,
        dragging: { slotId, displayName },
      });
    },
    [updateMyPresence]
  );

  const notifyDragOver = useCallback(
    (key) => {
      updateMyPresence({ dragOverKey: key });
    },
    [updateMyPresence]
  );

  const notifyDragEnd = useCallback(() => {
    updateMyPresence({
      isDragging: false,
      dragFromKey: null,
      dragOverKey: null,
      activeSlotKey: null,
      dragging: { slotId: null, displayName: null },
    });
  }, [updateMyPresence]);

  // ── Persistencia ────────────────────────────────────────────────────────────
  const persistToMongo = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (!slotsMap || getSlotStorageSize(slotsMap) === 0) return;
      const slotsArray = getSlotValues(slotsMap).filter((s) => s?.zone);
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
      if (!slotsMap || getSlotStorageSize(slotsMap) === 0) return;
      const slotsArray = getSlotValues(slotsMap).filter((s) => s?.zone);
      navigator.sendBeacon(
        `${BACKEND_URL}/api/formations/${formationId}/persist`,
        new Blob([JSON.stringify({ slots: slotsArray })], { type: "application/json" })
      );
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [slotsMap, formationId]);

  // ── Derived: presencia de otros usuarios ────────────────────────────────────
  const connectedUsers = others
    .map((other) => ({
      connectionId: other.connectionId ?? other.presence.userId,
      userId: other.presence.userId,
      displayName: other.presence.displayName,
      role: other.presence.role,
      avatar: other.presence.avatar || null,
      color: other.presence.color,
      activeSlotKey: other.presence.activeSlotKey,
      dragFromKey: other.presence.dragFromKey,
      dragOverKey: other.presence.dragOverKey,
      isDragging: other.presence.isDragging,
      dragging: other.presence.dragging,
    }))
    .filter((u) => u.userId);

  const draggingStates = connectedUsers.filter((u) => u.dragging?.slotId);

  // ── Derived: colaboradores agrupados por slot (para overlays del grid) ──────
  const collaboratorsBySlot = {};
  for (const user of connectedUsers) {
    // Prioridad: dragOver > activeSlot > dragFrom
    const targetKey =
      user.isDragging && user.dragOverKey
        ? user.dragOverKey
        : user.activeSlotKey || user.dragFromKey;

    if (targetKey) {
      if (!collaboratorsBySlot[targetKey]) collaboratorsBySlot[targetKey] = [];
      collaboratorsBySlot[targetKey].push({
        ...user,
        isDragTarget: user.isDragging && user.dragOverKey === targetKey,
        isDragSource:
          user.isDragging && user.dragFromKey === targetKey && user.dragOverKey !== targetKey,
      });
    }

    // Si está arrastrando, también marca el slot origen con estado secundario
    if (user.isDragging && user.dragFromKey && user.dragFromKey !== user.dragOverKey) {
      const fromKey = user.dragFromKey;
      if (!collaboratorsBySlot[fromKey]) collaboratorsBySlot[fromKey] = [];
      // Solo agregar si no está ya (evitar duplicados)
      const alreadyAdded = collaboratorsBySlot[fromKey].some(
        (c) => c.connectionId === user.connectionId && c.isDragSource
      );
      if (!alreadyAdded) {
        collaboratorsBySlot[fromKey].push({
          ...user,
          isDragTarget: false,
          isDragSource: true,
        });
      }
    }
  }

  // ── Return ──────────────────────────────────────────────────────────────────
  return {
    slots,
    slotsMap,
    setSlots,
    moveSlot,
    toggleSlotLock,
    // Presencia básica (compatibilidad)
    startDragging: notifyDragStart,
    stopDragging: notifyDragEnd,
    // Presencia de grid (nuevas)
    notifyDragOver,
    setActiveSlot,
    // Persistencia
    persistToMongo,
    // Datos de presencia
    connectedUsers,
    draggingStates,
    collaboratorsBySlot,
    myPresence,
    connectionStatus: status,
    isConnected: status === "connected",
    isLoading: slotsMap === null,
  };
}
