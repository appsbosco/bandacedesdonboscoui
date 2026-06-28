import { initializeApp } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyAOgbxy6F-X6LouEHgNluCITlwN7uaN018",
  authDomain: "bcdb-app-9466f.firebaseapp.com",
  projectId: "bcdb-app-9466f",
  storageBucket: "bcdb-app-9466f.firebasestorage.app",
  messagingSenderId: "406724473775",
  appId: "1:406724473775:web:f05efa64455b951006355a",
  measurementId: "G-21V5MDTRXN",
};

const app = initializeApp(firebaseConfig);

let messagingInstance = null;

function canUseMessaging() {
  return (
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    "serviceWorker" in navigator &&
    "Notification" in window &&
    window.isSecureContext
  );
}

export function getFirebaseMessagingInstance() {
  if (!canUseMessaging()) return null;
  if (!messagingInstance) {
    messagingInstance = getMessaging(app);
  }
  return messagingInstance;
}

async function ensureMessagingServiceWorker() {
  const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
    scope: "/firebase-cloud-messaging-push-scope/",
  });

  if (!registration.active) {
    const worker = registration.installing || registration.waiting;
    if (worker) {
      await new Promise((resolve, reject) => {
        const handleStateChange = () => {
          if (worker.state === "activated") resolve();
          if (worker.state === "redundant") {
            reject(new Error("[FCM] El service worker de mensajería no pudo activarse."));
          }
        };

        worker.addEventListener("statechange", handleStateChange);
        handleStateChange();
      });
    }
  }

  return registration;
}

/**
 * Gets the FCM token only when permission is already granted.
 * Does NOT request permission — call requestPermissionAndGetToken() for that.
 */
export const generateToken = async () => {
  if (!canUseMessaging()) return null;
  if (Notification.permission !== "granted") return null;

  const messaging = getFirebaseMessagingInstance();
  if (!messaging) return null;

  const serviceWorkerRegistration = await ensureMessagingServiceWorker();

  return getToken(messaging, {
    vapidKey:
      "BJmb2xP_HgqJHavQ-ur2jLzepOyjt2V8Dubb59y8KMn6OZqEfZs_vclMuLd_8CDVofoCB0-u5jdXHx-VQw57_hA",
    serviceWorkerRegistration,
  });
};

/**
 * Asks for notification permission (native browser prompt) and then
 * returns the FCM token if granted. Must be called from a user gesture.
 * Returns null if permission was denied or the environment is unsupported.
 */
export const requestPermissionAndGetToken = async () => {
  if (!canUseMessaging()) return null;

  if (Notification.permission === "denied") {
    if (process.env.NODE_ENV === "development") {
      console.warn("[FCM] Permission denied — cannot re-prompt. User must enable manually.");
    }
    return null;
  }

  let permission = Notification.permission;
  if (permission !== "granted") {
    permission = await Notification.requestPermission();
  }

  if (permission !== "granted") return null;

  const messaging = getFirebaseMessagingInstance();
  if (!messaging) return null;

  const serviceWorkerRegistration = await ensureMessagingServiceWorker();

  return getToken(messaging, {
    vapidKey:
      "BJmb2xP_HgqJHavQ-ur2jLzepOyjt2V8Dubb59y8KMn6OZqEfZs_vclMuLd_8CDVofoCB0-u5jdXHx-VQw57_hA",
    serviceWorkerRegistration,
  });
};
