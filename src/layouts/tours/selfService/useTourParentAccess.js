import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  GET_MY_CHILDREN_TOUR_ACCESS,
  GET_MY_CHILD_TOUR_PAYMENT_ACCOUNT,
  GET_MY_CHILD_TOUR_PARTICIPANT_DOCUMENT_SUMMARY,
  GET_MY_CHILD_TOUR_ITINERARY,
  GET_MY_CHILD_TOUR_FLIGHTS,
  UPDATE_MY_CHILD_TOUR_PARTICIPANT_INFO,
  CONFIRM_MY_CHILD_TOUR_PARTICIPANT_VERIFICATION,
} from "./parentTour.gql";

const EMPTY_CHILDREN = [];

export function useTourParentAccess({ tourId, selfServiceAccess }) {
  const paymentsEnabled = selfServiceAccess?.enabled && selfServiceAccess?.payments !== false;
  const itineraryEnabled = selfServiceAccess?.enabled && selfServiceAccess?.itinerary !== false;
  const flightsEnabled = selfServiceAccess?.enabled && selfServiceAccess?.flights !== false;
  const [selectedChildUserId, setSelectedChildUserId] = useState(null);
  const {
    data: childrenData,
    loading: childrenLoading,
    error: childrenError,
    refetch: refetchChildren,
  } = useQuery(GET_MY_CHILDREN_TOUR_ACCESS, {
    variables: { tourId },
    skip: !tourId,
    fetchPolicy: "cache-and-network",
  });
  const children = childrenData?.myChildrenTourAccess ?? EMPTY_CHILDREN;
  useEffect(() => {
    if (!selectedChildUserId && children.length > 0)
      setSelectedChildUserId(children[0].linkedUser?.id || null);
  }, [children, selectedChildUserId]);
  const selectedChild =
    children.find((child) => child.linkedUser?.id === selectedChildUserId) ?? null;
  const isVerified = Boolean(selectedChild?.selfServiceVerified);
  const itineraryEligible = Boolean(selectedChild?.itinerarySelfServiceEnabled);
  const variables = { tourId, childUserId: selectedChildUserId };
  const { data: paymentData, loading: paymentLoading } = useQuery(
    GET_MY_CHILD_TOUR_PAYMENT_ACCOUNT,
    { variables, skip: !selectedChildUserId || !paymentsEnabled, fetchPolicy: "cache-and-network" }
  );
  const {
    data: documentSummaryData,
    loading: documentSummaryLoading,
    refetch: refetchDocumentSummary,
  } = useQuery(GET_MY_CHILD_TOUR_PARTICIPANT_DOCUMENT_SUMMARY, {
    variables,
    skip: !selectedChildUserId,
    fetchPolicy: "cache-and-network",
  });
  const { data: itineraryData, loading: itineraryLoading } = useQuery(GET_MY_CHILD_TOUR_ITINERARY, {
    variables,
    skip: !selectedChildUserId || !itineraryEnabled || !itineraryEligible || !isVerified,
    fetchPolicy: "cache-and-network",
  });
  const { data: flightsData, loading: flightsLoading } = useQuery(GET_MY_CHILD_TOUR_FLIGHTS, {
    variables,
    skip: !selectedChildUserId || !flightsEnabled || !isVerified,
    fetchPolicy: "cache-and-network",
  });
  const [updateChildInfoMutation, { loading: updateInfoLoading, error: updateInfoError }] =
    useMutation(UPDATE_MY_CHILD_TOUR_PARTICIPANT_INFO, {
      onCompleted: () => {
        refetchChildren();
        refetchDocumentSummary();
      },
    });
  const [confirmChildVerificationMutation, { loading: confirmLoading, error: confirmError }] =
    useMutation(CONFIRM_MY_CHILD_TOUR_PARTICIPANT_VERIFICATION, {
      onCompleted: () => refetchChildren(),
    });
  return {
    children,
    selectedChild,
    selectedChildUserId,
    setSelectedChildUserId,
    paymentAccount: paymentData?.myChildTourPaymentAccount ?? null,
    documentSummary: documentSummaryData?.myChildTourParticipantDocumentSummary ?? null,
    documentSummaryLoading,
    isVerified,
    itineraryEligible,
    itinerary: itineraryData?.myChildTourItinerary ?? null,
    itineraryLoading,
    flights: flightsData?.myChildTourFlights ?? [],
    flightsLoading,
    updateChildInfo: (input) => updateChildInfoMutation({ variables: { ...variables, input } }),
    updateInfoLoading,
    updateInfoError,
    confirmChildVerification: (confirmedFields) =>
      confirmChildVerificationMutation({
        variables: { ...variables, acceptResponsibility: true, confirmedFields },
      }),
    confirmLoading,
    confirmError,
    loading: childrenLoading,
    paymentLoading,
    childrenError,
    hasChildren: children.length > 0,
  };
}
