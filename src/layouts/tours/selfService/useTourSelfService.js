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
import { MY_TOUR_SCHEDULE } from "../tourSchedules/tourSchedules.gql";

export function useTourSelfService({ tourId, selfServiceAccess }) {
  const documentsEnabled = selfServiceAccess?.enabled && selfServiceAccess?.documents;
  const paymentsEnabled = selfServiceAccess?.enabled && selfServiceAccess?.payments;
  const scheduleEnabled = selfServiceAccess?.enabled && selfServiceAccess?.schedule;
  const itineraryEnabled = selfServiceAccess?.enabled && selfServiceAccess?.itinerary;
  const flightsEnabled = selfServiceAccess?.enabled && selfServiceAccess?.flights;
  const {
    data: participantData,
    loading: participantLoading,
    error: participantError,
    refetch: refetchParticipant,
  } = useQuery(GET_MY_TOUR_PARTICIPANT, {
    variables: { tourId },
    skip: !tourId,
    fetchPolicy: "cache-and-network",
  });
  const participant = participantData?.myTourParticipant ?? null;
  const isVerified = Boolean(participant?.selfServiceVerified);
  const {
    data: paymentData,
    loading: paymentLoading,
    error: paymentError,
  } = useQuery(GET_MY_TOUR_PAYMENT_ACCOUNT, {
    variables: { tourId },
    skip: !tourId || !paymentsEnabled,
    fetchPolicy: "cache-and-network",
  });
  const {
    data: documentSummaryData,
    loading: documentSummaryLoading,
    refetch: refetchDocumentSummary,
  } = useQuery(MY_TOUR_PARTICIPANT_DOCUMENT_SUMMARY, {
    variables: { tourId },
    skip: !tourId || !participant || !documentsEnabled,
    fetchPolicy: "cache-and-network",
  });
  const { data: scheduleData, loading: scheduleLoading } = useQuery(MY_TOUR_SCHEDULE, {
    variables: { tourId },
    skip: !tourId || !scheduleEnabled || !participant,
    fetchPolicy: "cache-and-network",
  });
  const { data: itineraryData, loading: itineraryLoading } = useQuery(MY_TOUR_ITINERARY, {
    variables: { tourId },
    skip: !tourId || !itineraryEnabled || !participant || !isVerified,
    fetchPolicy: "cache-and-network",
  });
  const { data: flightsData, loading: flightsLoading } = useQuery(MY_TOUR_FLIGHTS, {
    variables: { tourId },
    skip: !tourId || !flightsEnabled || !participant,
    fetchPolicy: "cache-and-network",
  });
  const [updateInfo, { loading: updateInfoLoading, error: updateInfoError }] = useMutation(
    UPDATE_MY_TOUR_PARTICIPANT_INFO,
    {
      onCompleted: () => {
        refetchParticipant();
        refetchDocumentSummary();
      },
    }
  );
  const [confirmVerificationMutation, { loading: confirmLoading, error: confirmError }] =
    useMutation(CONFIRM_MY_TOUR_PARTICIPANT_VERIFICATION, {
      onCompleted: () => refetchParticipant(),
    });
  const isNotLinkedError =
    participantError?.message?.includes("vinculado") ||
    participantError?.message?.includes("participante");
  return {
    participant,
    paymentAccount: paymentData?.myTourPaymentAccount ?? null,
    documentSummary: documentSummaryData?.myTourParticipantDocumentSummary ?? null,
    documentSummaryLoading,
    isVerified,
    schedule: scheduleData?.myTourSchedule ?? null,
    scheduleLoading,
    itinerary: itineraryData?.myTourItinerary ?? null,
    itineraryLoading,
    flights: flightsData?.myTourFlights ?? [],
    flightsLoading,
    updateParticipantInfo: (input) => updateInfo({ variables: { tourId, input } }),
    updateInfoLoading,
    updateInfoError,
    confirmVerification: (confirmedFields) =>
      confirmVerificationMutation({
        variables: { tourId, acceptResponsibility: true, confirmedFields },
      }),
    confirmLoading,
    confirmError,
    loading: participantLoading || paymentLoading,
    participantError,
    paymentError,
    isLinked: !!participant,
    isNotLinkedError,
  };
}
