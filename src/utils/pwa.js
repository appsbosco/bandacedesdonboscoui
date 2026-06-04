/**
 * Centralized PWA runtime detection utilities.
 * Call getPwaRuntimeInfo() to get a snapshot of the current environment.
 */

export function getPwaRuntimeInfo() {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return _unsupportedInfo();
  }

  const ua = navigator.userAgent || "";
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  const isIPadOS =
    /Macintosh/.test(ua) &&
    typeof navigator.maxTouchPoints === "number" &&
    navigator.maxTouchPoints > 1;
  const isAndroid = /Android/.test(ua);
  const isSafari =
    /Safari/.test(ua) && !/Chrome/.test(ua) && !/CriOS/.test(ua) && !/FxiOS/.test(ua);
  const isChrome =
    (/Chrome/.test(ua) || /CriOS/.test(ua)) &&
    !(/OPR/.test(ua) || /Edg/.test(ua) || /Brave/.test(ua));

  const isStandalone =
    (typeof window.matchMedia === "function" &&
      window.matchMedia("(display-mode: standalone)").matches) ||
    window.navigator.standalone === true;

  const supportsServiceWorker = "serviceWorker" in navigator;
  const supportsPush = "PushManager" in window;
  const supportsNotifications = "Notification" in window;
  const supportsFirebaseMessaging =
    supportsServiceWorker &&
    supportsPush &&
    supportsNotifications &&
    window.isSecureContext === true;

  const permission = supportsNotifications ? Notification.permission : "unsupported";

  // iOS/iPadOS push notifications only work from installed PWA
  const isApple = isIOS || isIPadOS;

  // Android/Chrome can prompt install via beforeinstallprompt
  const canPromptInstall = !isStandalone && !isApple;

  // Apple devices that are not yet in standalone mode need manual install guide
  const requiresManualInstallGuide = isApple && !isStandalone;

  // If permission was denied the browser won't re-prompt — user must go to settings
  const requiresManualPermissionGuide =
    supportsNotifications && permission === "denied";

  return {
    isIOS: isApple,
    isAndroid,
    isSafari,
    isChrome,
    isStandalone,
    supportsNotifications,
    supportsPush,
    supportsServiceWorker,
    supportsFirebaseMessaging,
    permission,
    canPromptInstall,
    requiresManualInstallGuide,
    requiresManualPermissionGuide,
  };
}

export function refreshPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}

function _unsupportedInfo() {
  return {
    isIOS: false,
    isAndroid: false,
    isSafari: false,
    isChrome: false,
    isStandalone: false,
    supportsNotifications: false,
    supportsPush: false,
    supportsServiceWorker: false,
    supportsFirebaseMessaging: false,
    permission: "unsupported",
    canPromptInstall: false,
    requiresManualInstallGuide: false,
    requiresManualPermissionGuide: false,
  };
}
