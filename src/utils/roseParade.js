export const ROSE_TOUR_START_KEY = "2026-12-26";
export const ROSE_PARADE_DATE_KEY = "2027-01-01";
export const ROSE_TOUR_END_KEY = "2027-01-04";

export function getRoseParadeEventMeta(event) {
  const timestamp = Number(event?.date);
  if (!Number.isFinite(timestamp)) return null;

  const dateKey = new Date(timestamp).toISOString().slice(0, 10);
  const isParadeDay = dateKey === ROSE_PARADE_DATE_KEY;
  const isTourDay = dateKey >= ROSE_TOUR_START_KEY && dateKey <= ROSE_TOUR_END_KEY;

  if (!isTourDay) return null;

  return {
    isParadeDay,
    label: isParadeDay ? "Desfile de las Rosas" : "Gira Rose Parade",
    shortLabel: isParadeDay ? "Rose Parade" : "Gira 2027",
  };
}
