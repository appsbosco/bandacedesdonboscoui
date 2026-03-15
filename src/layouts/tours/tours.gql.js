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
      selfServiceAccess {
        enabled
        documents
        payments
        rooms
        itinerary
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
        itinerary
        flights
      }
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
      cascadeResults {
        itineraryAssignments
        routeAssignments
        roomsModified
        payments
        installments
        financialAccounts
      }
    }
  }
`;
