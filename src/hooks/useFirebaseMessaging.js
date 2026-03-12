import { useEffect } from "react";
import { useMutation } from "@apollo/client";
import { UPDATE_NOTIFICATION_TOKEN } from "graphql/mutations";
import { generateToken, messaging } from "config/firebase";
import { onMessage } from "firebase/messaging";

/**
 * Inicializa Firebase Cloud Messaging de forma diferida.
 * Se ejecuta después del primer paint, sin bloquear el render del Dashboard.
 */
export function useFirebaseMessaging(userId) {
  const [updateNotificationToken] = useMutation(UPDATE_NOTIFICATION_TOKEN);

  // Token registration — defer with setTimeout para no competir
  // con las queries de Apollo en el primer render
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const timerId = setTimeout(async () => {
      try {
        const token = await generateToken();
        if (!token || cancelled) return;
        await updateNotificationToken({ variables: { userId, token } });
      } catch (err) {
        console.error("[FCM] Token registration:", err);
      }
    }, 3000); // Espera 3s para no competir con el critical path

    return () => {
      cancelled = true;
      clearTimeout(timerId);
    };
  }, [userId, updateNotificationToken]);

  // Message listener
  useEffect(() => {
    if (!messaging) return;
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
