export function trackDonationEvent(event, details = {}) {
  if (typeof window === "undefined") return;
  const payload = { event, ...details };
  if (Array.isArray(window.dataLayer)) window.dataLayer.push(payload);
  window.dispatchEvent(new CustomEvent("bcdb:analytics", { detail: payload }));
}
