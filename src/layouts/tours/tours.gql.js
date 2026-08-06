import { gql } from "@apollo/client";

export const GET_TOURS = gql`
  query GetTours {
    getTours {
      id
      name
      destination
      country
      startDate
      endDate
      status
      description
      createdBy {
        name
        firstSurName
      }
    }
  }
`;

export const GET_TOUR = gql`
  query GetTour($id: ID!) {
    getTour(id: $id) {
      id
      name
      destination
      country
      startDate
      endDate
      status
      description
      paymentOperatorIds
      selfServiceAccess {
        enabled
        documents
        payments
        rooms
        schedule
        itinerary
        itineraryIds
        flights
      }
      createdAt
      updatedAt
      createdBy {
        name
        firstSurName
      }
      updatedBy {
        name
        firstSurName
      }
    }
  }
`;

export const UPDATE_TOUR_SELF_SERVICE_ACCESS = gql`
  mutation UpdateTourSelfServiceAccess($tourId: ID!, $input: TourSelfServiceAccessInput!) {
    updateTourSelfServiceAccess(tourId: $tourId, input: $input) {
      id
      selfServiceAccess {
        enabled
        documents
        payments
        rooms
        schedule
        itinerary
        itineraryIds
        flights
      }
    }
  }
`;

export const UPDATE_TOUR_PAYMENT_OPERATORS = gql`
  mutation UpdateTourPaymentOperators($tourId: ID!, $userIds: [ID!]!) {
    updateTourPaymentOperators(tourId: $tourId, userIds: $userIds) {
      id
      paymentOperatorIds
    }
  }
`;

export const GET_MY_TOUR_PARTICIPANT = gql`
  query GetMyTourParticipant($tourId: ID!) {
    myTourParticipant(tourId: $tourId) {
      id
      firstName
      firstSurname
      secondSurname
      identification
      email
      phone
      birthDate
      sex
      instrument
      grade
      passportNumber
      passportExpiry
      hasVisa
      visaExpiry
      hasExitPermit
      selfServiceVerified
      selfServiceVerifiedAt
      itinerarySelfServiceEnabled
      status
      role
      notes
      linkedUser {
        id
        name
        firstSurName
      }
    }
  }
`;

export const GET_MY_TOUR_CAPABILITIES = gql`
  query GetMyTourCapabilities($tourId: ID!) {
    myTourCapabilities(tourId: $tourId) {
      canRegisterPayments
    }
  }
`;

export const CREATE_TOUR = gql`
  mutation CreateTour($input: TourInput!) {
    createTour(input: $input) {
      id
      name
      destination
      country
      startDate
      endDate
      status
      description
    }
  }
`;

export const UPDATE_TOUR = gql`
  mutation UpdateTour($id: ID!, $input: TourInput!) {
    updateTour(id: $id, input: $input) {
      id
      name
      destination
      country
      startDate
      endDate
      status
      description
    }
  }
`;

export const DELETE_TOUR = gql`
  mutation DeleteTour($id: ID!) {
    deleteTour(id: $id)
  }
`;

export const DELETE_TOUR_PARTICIPANT = gql`
  mutation DeleteTourParticipant($id: ID!) {
    deleteTourParticipant(id: $id) {
      success
      deletedId
      deletionMode
      participantStillExists
      cascadeResults {
        itineraryAssignments
        routeAssignments
        flightsModified
        roomOccupantsModified
        roomResponsiblesCleared
        itinerariesModified
        payments
        installments
        financialAccounts
        documents
      }
    }
  }
`;

export const CREATE_TOUR_PARTICIPANT = gql`
  mutation CreateTourParticipant($tourId: ID!, $input: CreateTourParticipantInput!) {
    createTourParticipant(tourId: $tourId, input: $input) {
      id
      firstName
      firstSurname
      secondSurname
      identification
      email
      phone
      birthDate
      instrument
      grade
      status
      role
      linkedUser {
        id
        name
        firstSurName
        secondSurName
        email
      }
      isRemoved
      removedAt
    }
  }
`;
