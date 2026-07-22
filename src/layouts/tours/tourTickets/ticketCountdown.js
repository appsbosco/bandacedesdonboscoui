const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function getNextDeparture(flights = [], now = Date.now()) {
  const currentTime = now instanceof Date ? now.getTime() : Number(now);

  return (
    flights
      .filter((flight) => {
        const departureTime = new Date(flight?.departureAt).getTime();
        return Number.isFinite(departureTime) && departureTime > currentTime;
      })
      .sort((first, second) => {
        return new Date(first.departureAt).getTime() - new Date(second.departureAt).getTime();
      })[0] || null
  );
}

export function calculateCountdown(target, now = Date.now()) {
  const targetTime = target instanceof Date ? target.getTime() : new Date(target).getTime();
  const currentTime = now instanceof Date ? now.getTime() : Number(now);
  const totalMs = Math.max(0, targetTime - currentTime || 0);

  return {
    totalMs,
    days: Math.floor(totalMs / DAY),
    hours: Math.floor((totalMs % DAY) / HOUR),
    minutes: Math.floor((totalMs % HOUR) / MINUTE),
    seconds: Math.floor((totalMs % MINUTE) / SECOND),
  };
}
