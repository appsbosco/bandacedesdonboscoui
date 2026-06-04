import { useCallback, useEffect, useState } from "react";
import { useMutation } from "@apollo/client";
import { UPDATE_NOTIFICATION_TOKEN } from "graphql/mutations";
import { requestPermissionAndGetToken, generateToken } from "config/firebase";
import { refreshPermission } from "utils/pwa";

/**
 * Full push notification permission + registration flow.
 *
 * - Never auto-requests permission on mount.
 * - requestPermissionAndRegister() must be called from a user gesture.
 * - Handles "denied" state gracefully (no re-prompt attempt).
 * - Deduplicates token registration via localStorage cache.
 */
export function usePushNotifications(userId) {
  const [permission, setPermission] = useState(refreshPermission);
  const [isRegistering, setIsRegistering] = useState(false);
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);

  const [updateNotificationToken] = useMutation(UPDATE_NOTIFICATION_TOKEN);

  const isSupported =
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    window.isSecureContext === true;

  // Sync token whenever permission is "granted" and we don't have one yet.
  // Covers both the initial mount (already granted) and the case where the user
  // manually enabled notifications in browser settings and we called refreshStatus().
  useEffect(() => {
    if (!userId || !isSupported) return;
    if (permission !== "granted") return;
    if (token) return; // already have a token — nothing to do

    let cancelled = false;

    const sync = async () => {
      try {
        const t = await generateToken();
        if (!t || cancelled) return;
        const cacheKey = `fcmTokenSynced:${userId}`;
        if (localStorage.getItem(cacheKey) === t) {
          setToken(t);
          return;
        }
        await updateNotificationToken({ variables: { userId, token: t } });
        localStorage.setItem(cacheKey, t);
        setToken(t);
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error("[usePushNotifications] Token sync:", err);
        }
      }
    };

    sync();
    return () => {
      cancelled = true;
    };
  }, [permission, userId, isSupported, token, updateNotificationToken]);

  /**
   * Must be called from a user gesture (button click).
   * Requests permission if not yet granted, then registers the token.
   */
  const requestPermissionAndRegister = useCallback(async () => {
    if (!userId || !isSupported) return;
    if (Notification.permission === "denied") {
      setPermission("denied");
      return;
    }

    setIsRegistering(true);
    setError(null);

    try {
      const t = await requestPermissionAndGetToken();
      setPermission(refreshPermission());

      if (!t) return;

      const cacheKey = `fcmTokenSynced:${userId}`;
      if (localStorage.getItem(cacheKey) !== t) {
        await updateNotificationToken({ variables: { userId, token: t } });
        localStorage.setItem(cacheKey, t);
      }
      setToken(t);
    } catch (err) {
      setError(err?.message || "Error registrando notificaciones");
      if (process.env.NODE_ENV === "development") {
        console.error("[usePushNotifications] requestPermissionAndRegister:", err);
      }
    } finally {
      setIsRegistering(false);
    }
  }, [userId, isSupported, updateNotificationToken]);

  /** Re-reads Notification.permission from the browser (useful after manual settings change). */
  const refreshStatus = useCallback(() => {
    setPermission(refreshPermission());
  }, []);

  /** Removes the cached token so next sync will re-register. */
  const unregisterToken = useCallback(() => {
    if (userId) localStorage.removeItem(`fcmTokenSynced:${userId}`);
    setToken(null);
  }, [userId]);

  return {
    permission,
    isSupported,
    isRegistering,
    token,
    error,
    requestPermissionAndRegister,
    refreshStatus,
    unregisterToken,
  };
}
