import { useQuery } from "@apollo/client";
import { GET_MY_TOUR_PARTICIPANT } from "../tours.gql";
import { GET_MY_TOUR_PAYMENT_ACCOUNT } from "./selfService.gql";

/**
 * useTourSelfService — hook para la vista self-service de un usuario vinculado a una gira.
 *
 * Devuelve:
 *   - participant: datos del TourParticipant vinculado al usuario actual
 *   - paymentAccount: cuenta financiera del participante (si el módulo está habilitado)
 *   - loading / error
 *   - isLinked: si el usuario tiene participante vinculado en esta gira
 *   - notLinkedError: mensaje de error amigable si no está vinculado
 */
export function useTourSelfService({ tourId, selfServiceAccess }) {
  const paymentsEnabled = selfServiceAccess?.enabled && selfServiceAccess?.payments;

  const {
    data: participantData,
    loading: participantLoading,
    error: participantError,
  } = useQuery(GET_MY_TOUR_PARTICIPANT, {
    variables: { tourId },
    skip: !tourId,
    fetchPolicy: "cache-and-network",
  });

  const {
    data: paymentData,
    loading: paymentLoading,
    error: paymentError,
  } = useQuery(GET_MY_TOUR_PAYMENT_ACCOUNT, {
    variables: { tourId },
    skip: !tourId || !paymentsEnabled,
    fetchPolicy: "cache-and-network",
  });

  const participant = participantData?.myTourParticipant ?? null;
  const paymentAccount = paymentData?.myTourPaymentAccount ?? null;

  const loading = participantLoading || paymentLoading;

  // Detectar el caso "no vinculado" por mensaje de error del backend
  const isNotLinkedError =
    participantError?.message?.includes("vinculado") ||
    participantError?.message?.includes("participante");

  return {
    participant,
    paymentAccount,
    loading,
    participantError,
    paymentError,
    isLinked: !!participant,
    isNotLinkedError,
  };
}
