import { useMutation, useQuery } from "@apollo/client";
import { GET_MY_TOUR_PARTICIPANT } from "../tours.gql";
import {
  GET_MY_TOUR_PAYMENT_ACCOUNT,
  MY_TOUR_PARTICIPANT_DOCUMENT_SUMMARY,
  MY_TOUR_ITINERARY,
  MY_TOUR_FLIGHTS,
  UPDATE_MY_TOUR_PARTICIPANT_INFO,
  CONFIRM_MY_TOUR_PARTICIPANT_VERIFICATION,
} from "./selfService.gql";

export function useTourSelfService({ tourId, selfServiceAccess }) {
  const paymentsEnabled = selfServiceAccess?.enabled && selfServiceAccess?.payments;
  const itineraryEnabled = selfServiceAccess?.enabled && selfServiceAccess?.itinerary;
  const flightsEnabled = selfServiceAccess?.enabled && selfServiceAccess?.flights;
  const { data: participantData, loading: participantLoading, error: participantError, refetch: refetchParticipant } = useQuery(GET_MY_TOUR_PARTICIPANT, { variables: { tourId }, skip: !tourId, fetchPolicy: "cache-and-network" });
  const participant = participantData?.myTourParticipant ?? null;
  const isVerified = Boolean(participant?.selfServiceVerified);
  const itineraryEligible = Boolean(participant?.itinerarySelfServiceEnabled);
  const { data: paymentData, loading: paymentLoading, error: paymentError } = useQuery(GET_MY_TOUR_PAYMENT_ACCOUNT, { variables: { tourId }, skip: !tourId || !paymentsEnabled, fetchPolicy: "cache-and-network" });
  const { data: documentSummaryData, loading: documentSummaryLoading, refetch: refetchDocumentSummary } = useQuery(MY_TOUR_PARTICIPANT_DOCUMENT_SUMMARY, { variables: { tourId }, skip: !tourId || !participant, fetchPolicy: "cache-and-network" });
  const { data: itineraryData, loading: itineraryLoading } = useQuery(MY_TOUR_ITINERARY, { variables: { tourId }, skip: !tourId || !itineraryEnabled || !itineraryEligible || !isVerified, fetchPolicy: "cache-and-network" });
  const { data: flightsData, loading: flightsLoading } = useQuery(MY_TOUR_FLIGHTS, { variables: { tourId }, skip: !tourId || !flightsEnabled || !isVerified, fetchPolicy: "cache-and-network" });
  const [updateInfo, { loading: updateInfoLoading, error: updateInfoError }] = useMutation(UPDATE_MY_TOUR_PARTICIPANT_INFO, { onCompleted: () => { refetchParticipant(); refetchDocumentSummary(); } });
  const [confirmVerificationMutation, { loading: confirmLoading, error: confirmError }] = useMutation(CONFIRM_MY_TOUR_PARTICIPANT_VERIFICATION, { onCompleted: () => refetchParticipant() });
  const isNotLinkedError = participantError?.message?.includes("vinculado") || participantError?.message?.includes("participante");
  return {
    participant,
    paymentAccount: paymentData?.myTourPaymentAccount ?? null,
    documentSummary: documentSummaryData?.myTourParticipantDocumentSummary ?? null,
    documentSummaryLoading,
    isVerified,
    itineraryEligible,
    itinerary: itineraryData?.myTourItinerary ?? null,
    itineraryLoading,
    flights: flightsData?.myTourFlights ?? [],
    flightsLoading,
    updateParticipantInfo: (input) => updateInfo({ variables: { tourId, input } }),
    updateInfoLoading,
    updateInfoError,
    confirmVerification: () => confirmVerificationMutation({ variables: { tourId } }),
    confirmLoading,
    confirmError,
    loading: participantLoading || paymentLoading,
    participantError,
    paymentError,
    isLinked: !!participant,
    isNotLinkedError,
  };
}
