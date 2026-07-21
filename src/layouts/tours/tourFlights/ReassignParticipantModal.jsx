/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";

function participantName(participant) {
  return [participant?.firstName, participant?.firstSurname, participant?.secondSurname]
    .filter(Boolean)
    .join(" ");
}

export default function ReassignParticipantModal({
  participant,
  sourceItinerary,
  itineraries = [],
  onClose,
  onConfirm,
  loading = false,
}) {
  const [targetId, setTargetId] = useState("");

  useEffect(() => {
    setTargetId("");
  }, [participant?.id, sourceItinerary?.id]);

  if (!participant) return null;

  const isReassignment = Boolean(sourceItinerary);
  const destinations = itineraries.filter((itinerary) => itinerary.id !== sourceItinerary?.id);
  const selected = destinations.find((itinerary) => itinerary.id === targetId);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selected || selected.isLocked || sourceItinerary?.isLocked || selected.seatsRemaining <= 0)
      return;
    await onConfirm(sourceItinerary?.id || null, selected.id, participant.id);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[1400] flex items-center justify-center overflow-y-auto p-4"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(event) => event.target === event.currentTarget && !loading && onClose()}
    >
      <form
        onSubmit={handleSubmit}
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div className="min-w-0 pr-4">
            <h3 className="text-base font-bold text-gray-900">
              {isReassignment ? "Reasignar participante" : "Asignar a itinerario"}
            </h3>
            <p className="mt-1 truncate text-sm font-semibold text-gray-700">
              {participantName(participant)}
            </p>
            {isReassignment ? (
              <p className="mt-0.5 text-xs text-gray-500">
                Itinerario actual: <strong>{sourceItinerary.name}</strong>
              </p>
            ) : (
              <p className="mt-0.5 text-xs font-semibold text-amber-600">
                Actualmente sin itinerario
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Cerrar modal"
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-800">
            {isReassignment ? (
              <>
                Seleccioná el nuevo itinerario. La persona se moverá automáticamente y liberará un
                cupo en <strong>{sourceItinerary.name}</strong>.
              </>
            ) : (
              "Seleccioná un itinerario con cupos disponibles para asignar a esta persona."
            )}
          </div>

          <fieldset className="space-y-2">
            <legend className="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-500">
              Itinerario de destino
            </legend>
            {destinations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
                No hay otro itinerario disponible.
              </div>
            ) : (
              destinations.map((itinerary) => {
                const available = Math.max(0, itinerary.seatsRemaining ?? 0);
                const capacity = itinerary.maxPassengers ?? 0;
                const occupied = itinerary.passengerCount ?? Math.max(0, capacity - available);
                const isFull = available === 0;
                const isLocked = Boolean(itinerary.isLocked);
                const isSelected = targetId === itinerary.id;

                return (
                  <label
                    key={itinerary.id}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors ${
                      isFull || isLocked
                        ? "cursor-not-allowed border-gray-100 bg-gray-50 opacity-60"
                        : isSelected
                        ? "cursor-pointer border-gray-900 bg-gray-50 ring-1 ring-gray-900"
                        : "cursor-pointer border-gray-200 bg-white hover:border-gray-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name="targetItinerary"
                      value={itinerary.id}
                      checked={isSelected}
                      disabled={isFull || isLocked || loading}
                      onChange={() => setTargetId(itinerary.id)}
                      className="h-4 w-4 border-gray-300 text-gray-900 focus:ring-gray-900"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-gray-900">
                        {itinerary.name}
                      </span>
                      <span className="mt-0.5 block text-xs text-gray-500">
                        {occupied} de {capacity} pasajeros
                      </span>
                    </span>
                    <span
                      className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        isLocked
                          ? "bg-amber-100 text-amber-800"
                          : isFull
                          ? "bg-red-100 text-red-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {isLocked
                        ? "🔒"
                        : isFull
                        ? "Sin cupos"
                        : `${available} cupo${available !== 1 ? "s" : ""}`}
                    </span>
                  </label>
                );
              })
            )}
          </fieldset>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={
              !selected ||
              selected.isLocked ||
              sourceItinerary?.isLocked ||
              selected.seatsRemaining <= 0 ||
              loading
            }
            className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading
              ? isReassignment
                ? "Reasignando…"
                : "Asignando…"
              : isReassignment
              ? "Confirmar reasignación"
              : "Confirmar asignación"}
          </button>
        </div>
      </form>
    </div>
  );
}
