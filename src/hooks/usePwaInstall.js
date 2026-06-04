import { useCallback, useEffect, useState } from "react";
import { getPwaRuntimeInfo } from "utils/pwa";

/**
 * Handles PWA installation flow.
 *
 * Android/Chrome: captures beforeinstallprompt so we can trigger it on demand.
 * iOS/iPadOS: no beforeinstallprompt — exposes requiresManualGuide so the UI
 *             can show step-by-step instructions.
 */
export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  const info = getPwaRuntimeInfo();

  // Initialize isInstalled from current standalone state
  useEffect(() => {
    if (info.isStandalone) {
      setIsInstalled(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setCanInstall(false);
      setIsInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return "unavailable";
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setCanInstall(false);
    if (outcome === "accepted") setIsInstalled(true);
    return outcome; // "accepted" | "dismissed"
  }, [deferredPrompt]);

  // Re-check standalone after user says "ya la instalé"
  const recheckInstalled = useCallback(() => {
    const { isStandalone } = getPwaRuntimeInfo();
    if (isStandalone) setIsInstalled(true);
    return isStandalone;
  }, []);

  return {
    canInstall,
    isInstalled: isInstalled || info.isStandalone,
    requiresManualGuide: info.requiresManualInstallGuide,
    isIOS: info.isIOS,
    promptInstall,
    recheckInstalled,
  };
}
