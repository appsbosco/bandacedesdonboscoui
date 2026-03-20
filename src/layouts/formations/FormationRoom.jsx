/* eslint-disable react/prop-types */
import React from "react";
import { RoomProvider } from "./liveblocks.config.js";
import { LiveMap } from "@liveblocks/client";

/**
 * Wraps children inside a Liveblocks RoomProvider for a specific formation.
 *
 * initialSlots: el array de slots que viene de Mongo (formation.slots).
 * Solo se usa si la room no existe aún en Liveblocks — si ya existe,
 * el storage de la room tiene precedencia automáticamente.
 */
export default function FormationRoom({ formationId, initialSlots, children }) {
  const roomId = `formation-${formationId}`;

  // Convertir array de slots a LiveMap: "ZONE:row:col" → slotData
  const initialStorage = React.useMemo(
    () => ({
      slots: new LiveMap(
        (initialSlots || []).map((slot) => [`${slot.zone}:${slot.row}:${slot.col}`, slot])
      ),
    }),

    []
  );

  return (
    <RoomProvider
      id={roomId}
      initialPresence={{
        userId: null,
        displayName: null,
        role: null,
        color: null,
        dragging: { slotId: null, displayName: null },
        selectedSlotId: null,
      }}
      initialStorage={initialStorage}
    >
      {children}
    </RoomProvider>
  );
}
