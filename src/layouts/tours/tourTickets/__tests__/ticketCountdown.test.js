import { calculateCountdown, getNextDeparture } from "../ticketCountdown";

describe("ticketCountdown", () => {
  test("descompone el tiempo restante en días, horas, minutos y segundos", () => {
    const now = new Date("2026-07-21T12:00:00.000Z");
    const target = new Date(now.getTime() + 1 * 86400000 + 2 * 3600000 + 3 * 60000 + 4000);

    expect(calculateCountdown(target, now)).toEqual({
      totalMs: 93784000,
      days: 1,
      hours: 2,
      minutes: 3,
      seconds: 4,
    });
  });

  test("mantiene el contador en cero cuando la salida ya ocurrió", () => {
    const now = new Date("2026-07-21T12:00:00.000Z");
    expect(calculateCountdown("2026-07-20T12:00:00.000Z", now)).toEqual({
      totalMs: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    });
  });

  test("selecciona la próxima salida y omite fechas pasadas o inválidas", () => {
    const flights = [
      { id: "past", departureAt: "2026-07-20T12:00:00.000Z" },
      { id: "later", departureAt: "2026-07-23T12:00:00.000Z" },
      { id: "invalid", departureAt: "sin-fecha" },
      { id: "next", departureAt: "2026-07-22T12:00:00.000Z" },
    ];

    expect(getNextDeparture(flights, new Date("2026-07-21T12:00:00.000Z"))).toEqual(flights[3]);
  });
});
