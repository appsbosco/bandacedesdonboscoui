import { applyDateVariant, buildRoseParadeSchedule } from "../roseParadeSchedule";

const tour = {
  startDate: "2026-12-26T00:00:00.000Z",
  endDate: "2027-01-04T00:00:00.000Z",
};

test("builds the complete ten-day Rose Parade agenda", () => {
  const schedule = buildRoseParadeSchedule(tour);
  expect(schedule.days).toHaveLength(10);
  expect(schedule.days[0].title).toBe("Llegada a Los Ángeles");
  expect(schedule.days[9].title).toBe("Regreso a Costa Rica");
  expect(schedule.days[0].events.every((event) => event.startTime === "")).toBe(true);
});

test("switches Hollywood and Disneyland without moving the dates", () => {
  const schedule = buildRoseParadeSchedule(tour);
  const swapped = applyDateVariant(schedule, "HOLLYWOOD_30");
  expect(swapped.days[2].title).toBe("Disneyland");
  expect(swapped.days[4].title).toBe("Hollywood");
  expect(swapped.days[2].date).toBe(schedule.days[2].date);
  expect(swapped.notice).toBe("");
});
