/* eslint-disable react/prop-types */
import React from "react";

export default function FormationPresenceBar({ connectedUsers, connectionStatus, draggingStates }) {
  const statusColor =
    {
      connected: "bg-emerald-500",
      connecting: "bg-amber-400",
      reconnecting: "bg-amber-400",
      disconnected: "bg-red-500",
    }[connectionStatus] || "bg-slate-300";

  const statusLabel =
    {
      connected: "En vivo",
      connecting: "Conectando…",
      reconnecting: "Reconectando…",
      disconnected: "Sin conexión",
    }[connectionStatus] || connectionStatus;

  return (
    <div className="flex items-center gap-3 py-2 flex-wrap">
      {/* Estado de conexión */}
      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${statusColor}`} />
        <span className="text-xs text-slate-400">{statusLabel}</span>
      </div>

      {/* Avatares de otros usuarios */}
      {connectedUsers.length > 0 && (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400">Editando:</span>
          <div className="flex -space-x-1.5">
            {connectedUsers.map((u) => (
              <div
                key={u.userId}
                title={`${u.displayName} (${u.role})`}
                style={{ background: u.color || "#6366f1" }}
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2 border-white shadow-sm"
              >
                {(u.displayName || "?").charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* "X está moviendo a Y" */}
      {draggingStates.map((d) => (
        <div key={d.userId} className="flex items-center gap-1.5">
          <span
            style={{ background: d.color || "#6366f1" }}
            className="w-2 h-2 rounded-full animate-pulse"
          />
          <span className="text-xs text-slate-500">
            <strong>{d.displayName}</strong> moviendo a <strong>{d.dragging.displayName}</strong>
          </span>
        </div>
      ))}
    </div>
  );
}
