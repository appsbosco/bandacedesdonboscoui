const APP_SERVICE_WORKER_URL = "/service-worker.js";

export function registerAppServiceWorker() {
  if (
    process.env.NODE_ENV !== "production" ||
    !("serviceWorker" in navigator) ||
    !window.isSecureContext
  ) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register(APP_SERVICE_WORKER_URL, { scope: "/" }).catch((error) => {
      console.error("[PWA] No se pudo registrar el service worker:", error);
    });
  });
}
