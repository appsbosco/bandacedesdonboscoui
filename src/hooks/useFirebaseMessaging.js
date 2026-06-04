import { useEffect } from "react";
import { useMutation } from "@apollo/client";
import { UPDATE_NOTIFICATION_TOKEN } from "graphql/mutations";
import { generateToken, getFirebaseMessagingInstance } from "config/firebase";
import { onMessage } from "firebase/messaging";

/**
 * Passively syncs the FCM token for an already-authenticated user.
 * Only runs when Notification.permission === "granted" — never requests
 * permission automatically. Use usePushNotifications for the explicit flow.
 */
export function useFirebaseMessaging(userId) {
  const [updateNotificationToken] = useMutation(UPDATE_NOTIFICATION_TOKEN);

  useEffect(() => {
    if (!userId) return;
    // Only sync when permission is already granted — never auto-request
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    let cancelled = false;

    const syncToken = async () => {
      try {
        const token = await generateToken();
        if (!token || cancelled) return;
        const storageKey = `fcmTokenSynced:${userId}`;
        if (localStorage.getItem(storageKey) === token) return;
        await updateNotificationToken({ variables: { userId, token } });
        localStorage.setItem(storageKey, token);
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error("[FCM] Token sync:", err);
        }
      }
    };

    syncToken();

    return () => {
      cancelled = true;
    };
  }, [userId, updateNotificationToken]);

  useEffect(() => {
    const messaging = getFirebaseMessagingInstance();
    if (!messaging) return undefined;

    try {
      const unsub = onMessage(messaging, () => {});
      return () => {
        if (typeof unsub === "function") unsub();
      };
    } catch {
      return undefined;
    }
  }, []);
}
