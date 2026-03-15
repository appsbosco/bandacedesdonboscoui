/**
 * useTourParentAccess
 * Hook para el acceso self-service de padres de familia a giras.
 * Carga los hijos vinculados como participantes y la cuenta de pagos del hijo seleccionado.
 */
import { useState, useEffect } from "react";
import { useQuery } from "@apollo/client";
import { GET_MY_CHILDREN_TOUR_ACCESS, GET_MY_CHILD_TOUR_PAYMENT_ACCOUNT } from "./parentTour.gql";

export function useTourParentAccess({ tourId, selfServiceAccess }) {
  const paymentsEnabled = selfServiceAccess?.enabled && selfServiceAccess?.payments !== false;

  const [selectedChildUserId, setSelectedChildUserId] = useState(null);

  // ── Cargar hijos participantes de esta gira ──────────────────────────────────
  const {
    data: childrenData,
    loading: childrenLoading,
    error: childrenError,
  } = useQuery(GET_MY_CHILDREN_TOUR_ACCESS, {
    variables: { tourId },
    skip: !tourId,
    fetchPolicy: "cache-and-network",
  });

  const children = childrenData?.myChildrenTourAccess ?? [];

  // Auto-seleccionar el primer hijo cuando carguen
  useEffect(() => {
    if (!selectedChildUserId && children.length > 0) {
      const firstChildUserId = children[0].linkedUser?.id;
      if (firstChildUserId) setSelectedChildUserId(firstChildUserId);
    }
  }, [children, selectedChildUserId]);

  // ── Cargar cuenta de pagos del hijo seleccionado ─────────────────────────────
  const {
    data: paymentData,
    loading: paymentLoading,
  } = useQuery(GET_MY_CHILD_TOUR_PAYMENT_ACCOUNT, {
    variables: { tourId, childUserId: selectedChildUserId },
    skip: !selectedChildUserId || !paymentsEnabled,
    fetchPolicy: "cache-and-network",
  });

  const selectedChild = children.find((c) => c.linkedUser?.id === selectedChildUserId) ?? null;
  const paymentAccount = paymentData?.myChildTourPaymentAccount ?? null;

  return {
    children,
    selectedChild,
    selectedChildUserId,
    setSelectedChildUserId,
    paymentAccount,
    loading: childrenLoading,
    paymentLoading,
    childrenError,
    hasChildren: children.length > 0,
  };
}
