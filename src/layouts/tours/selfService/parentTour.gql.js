import { gql } from "@apollo/client";

/**
 * Queries para el acceso self-service de padres de familia.
 * El actor es un Parent, no un User.
 */

// Todos los hijos del padre que son participantes de la gira
export const GET_MY_CHILDREN_TOUR_ACCESS = gql`
  query GetMyChildrenTourAccess($tourId: ID!) {
    myChildrenTourAccess(tourId: $tourId) {
      id
      firstName
      firstSurname
      secondSurname
      identification
      email
      phone
      birthDate
      passportNumber
      passportExpiry
      hasVisa
      visaExpiry
      hasExitPermit
      selfServiceVerified
      selfServiceVerifiedAt
      role
      status
      linkedUser {
        id
      }
    }
  }
`;

export const GET_MY_CHILD_TOUR_PARTICIPANT_DOCUMENT_SUMMARY = gql`
  query GetMyChildTourParticipantDocumentSummary($tourId: ID!, $childUserId: ID!) {
    myChildTourParticipantDocumentSummary(tourId: $tourId, childUserId: $childUserId) {
      participantId
      passport { givenNames surname nationality issuingCountry passportNumber documentNumber dateOfBirth sex expirationDate }
      visa { visaType visaControlNumber issueDate expirationDate issuingCountry }
    }
  }
`;
export const GET_MY_CHILD_TOUR_ITINERARY = gql`
  query GetMyChildTourItinerary($tourId: ID!, $childUserId: ID!) {
    myChildTourItinerary(tourId: $tourId, childUserId: $childUserId) { id name reservationNumber notes flights { id departureAt arrivalAt } }
  }
`;
export const GET_MY_CHILD_TOUR_FLIGHTS = gql`
  query GetMyChildTourFlights($tourId: ID!, $childUserId: ID!) {
    myChildTourFlights(tourId: $tourId, childUserId: $childUserId) { id airline flightNumber origin destination departureAt arrivalAt departureLocal arrivalLocal direction }
  }
`;
export const UPDATE_MY_CHILD_TOUR_PARTICIPANT_INFO = gql`
  mutation UpdateMyChildTourParticipantInfo($tourId: ID!, $childUserId: ID!, $input: MyTourParticipantUpdateInput!) {
    updateMyChildTourParticipantInfo(tourId: $tourId, childUserId: $childUserId, input: $input) {
      id firstName firstSurname secondSurname identification email phone birthDate selfServiceVerified selfServiceVerifiedAt
    }
  }
`;
export const CONFIRM_MY_CHILD_TOUR_PARTICIPANT_VERIFICATION = gql`
  mutation ConfirmMyChildTourParticipantVerification($tourId: ID!, $childUserId: ID!) {
    confirmMyChildTourParticipantVerification(tourId: $tourId, childUserId: $childUserId) { id selfServiceVerified selfServiceVerifiedAt }
  }
`;

// Cuenta financiera de un hijo específico
export const GET_MY_CHILD_TOUR_PAYMENT_ACCOUNT = gql`
  query GetMyChildTourPaymentAccount($tourId: ID!, $childUserId: ID!) {
    myChildTourPaymentAccount(tourId: $tourId, childUserId: $childUserId) {
      id
      currency
      finalAmount
      totalPaid
      balance
      overpayment
      financialStatus
      paymentPlan {
        id
        name
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
