import { useEffect } from "react";
import { useMutation } from "@apollo/client";
import { UPDATE_NOTIFICATION_TOKEN } from "graphql/mutations";
import { generateToken, getFirebaseMessagingInstance } from "config/firebase";
import { onMessage } from "firebase/messaging";

/**
 * Sincroniza el token FCM del usuario autenticado en cualquier ruta protegida.
 */
export function useFirebaseMessaging(userId) {
  const [updateNotificationToken] = useMutation(UPDATE_NOTIFICATION_TOKEN);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const syncToken = async () => {
      try {
        const token = await generateToken();
        if (!token || cancelled) return;
        await updateNotificationToken({ variables: { userId, token } });
      } catch (err) {
        console.error("[FCM] Token registration:", err);
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
