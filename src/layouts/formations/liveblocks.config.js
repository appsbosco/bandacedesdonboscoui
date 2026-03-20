import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

const BACKEND_URL = process.env.REACT_APP_GRAPHQL_URL
  ? process.env.REACT_APP_GRAPHQL_URL.replace("/api/graphql", "")
  : "http://localhost:4000";

const client = createClient({
  authEndpoint: async (room) => {
    const token = localStorage.getItem("token");

    const res = await fetch(`${BACKEND_URL}/api/liveblocks-auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ room }),
    });

    if (!res.ok) {
      throw new Error(`Liveblocks auth failed: ${res.status}`);
    }

    return res.json();
  },
});

// Paso 1: destructurar sin exportar
const { RoomProvider, useMyPresence, useOthers, useSelf, useStorage, useMutation, useStatus } =
  createRoomContext(client);

// Paso 2: exportar con alias explícito
export {
  RoomProvider,
  useMyPresence,
  useOthers,
  useSelf,
  useStorage,
  useMutation as useLiveMutation,
  useStatus,
};
