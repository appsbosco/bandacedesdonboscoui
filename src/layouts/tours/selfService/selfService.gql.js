import { gql } from "@apollo/client";

/**
 * selfService.gql.js
 * Operaciones GraphQL para el acceso self-service de usuarios vinculados a una gira.
 */

export const GET_MY_TOUR_PAYMENT_ACCOUNT = gql`
  query GetMyTourPaymentAccount($tourId: ID!) {
    myTourPaymentAccount(tourId: $tourId) {
      id
      currency
      baseAmount
      discount
      scholarship
      finalAmount
      totalPaid
      balance
      overpayment
      financialStatus
      paymentPlan {
        id
        name
        totalAmount
      }
      installments {
        id
        order
        dueDate
        amount
        concept
        paidAmount
        remainingAmount
        status
      }
    }
  }
`;

export const MY_TOUR_PARTICIPANT_DOCUMENT_SUMMARY = gql`
  query MyTourParticipantDocumentSummary($tourId: ID!) {
    myTourParticipantDocumentSummary(tourId: $tourId) {
      participantId
      passport { givenNames surname nationality issuingCountry passportNumber documentNumber dateOfBirth sex expirationDate }
      visa { visaType visaControlNumber issueDate expirationDate issuingCountry }
    }
  }
`;
export const MY_TOUR_ITINERARY = gql`
  query MyTourItinerary($tourId: ID!) {
    myTourItinerary(tourId: $tourId) { id name reservationNumber notes flights { id departureAt arrivalAt } }
  }
`;
export const MY_TOUR_FLIGHTS = gql`
  query MyTourFlights($tourId: ID!) {
    myTourFlights(tourId: $tourId) {
      id airline flightNumber origin destination departureAt arrivalAt departureLocal arrivalLocal direction
      passengers { participant { id } seatNumber }
    }
  }
`;
export const UPDATE_MY_TOUR_PARTICIPANT_INFO = gql`
  mutation UpdateMyTourParticipantInfo($tourId: ID!, $input: MyTourParticipantUpdateInput!) {
    updateMyTourParticipantInfo(tourId: $tourId, input: $input) {
      id firstName firstSurname secondSurname identification email phone birthDate selfServiceVerified selfServiceVerifiedAt
    }
  }
`;
export const CONFIRM_MY_TOUR_PARTICIPANT_VERIFICATION = gql`
  mutation ConfirmMyTourParticipantVerification($tourId: ID!) {
    confirmMyTourParticipantVerification(tourId: $tourId) { id selfServiceVerified selfServiceVerifiedAt }
  }
`;
