import { gql } from "@apollo/client";

const ITINERARY_CORE = gql`
  fragment ItineraryCore on TourItinerary {
    id
    tourId
    name
    notes
    maxPassengers
    seatsRemaining
    flightCount
    passengerCount
    leaderCount
    flights {
      id
      airline
      flightNumber
      origin
      destination
      departureAt
      arrivalAt
      direction
      passengerCount
    }
    participants {
      id
      firstName
      firstSurname
      secondSurname
      identification
      instrument
      visaStatus
      visaDeniedCount
    }
    leaders {
      id
      firstName
      firstSurname
      secondSurname
      identification
      instrument
    }
    createdAt
    updatedAt
  }
`;

export const GET_TOUR_ITINERARIES = gql`
  ${ITINERARY_CORE}
  query GetTourItineraries($tourId: ID!) {
    getTourItineraries(tourId: $tourId) {
      ...ItineraryCore
    }
  }
`;

export const GET_UNASSIGNED_TOUR_FLIGHTS = gql`
  query GetUnassignedTourFlights($tourId: ID!) {
    getUnassignedTourFlights(tourId: $tourId) {
      id
      airline
      flightNumber
      origin
      destination
      departureAt
      arrivalAt
      direction
      passengerCount
    }
  }
`;

export const CREATE_TOUR_ITINERARY = gql`
  ${ITINERARY_CORE}
  mutation CreateTourItinerary($tourId: ID!, $input: TourItineraryInput!) {
    createTourItinerary(tourId: $tourId, input: $input) {
      ...ItineraryCore
    }
  }
`;

export const UPDATE_TOUR_ITINERARY = gql`
  mutation UpdateTourItinerary($id: ID!, $input: TourItineraryInput!) {
    updateTourItinerary(id: $id, input: $input) {
      id
      name
      notes
      maxPassengers
      seatsRemaining
    }
  }
`;

export const DELETE_TOUR_ITINERARY = gql`
  mutation DeleteTourItinerary($id: ID!) {
    deleteTourItinerary(id: $id)
  }
`;

export const ASSIGN_FLIGHTS_TO_ITINERARY = gql`
  ${ITINERARY_CORE}
  mutation AssignFlightsToItinerary($itineraryId: ID!, $flightIds: [ID!]!) {
    assignFlightsToItinerary(itineraryId: $itineraryId, flightIds: $flightIds) {
      ...ItineraryCore
    }
  }
`;

export const UNASSIGN_FLIGHTS_FROM_ITINERARY = gql`
  ${ITINERARY_CORE}
  mutation UnassignFlightsFromItinerary($itineraryId: ID!, $flightIds: [ID!]!) {
    unassignFlightsFromItinerary(itineraryId: $itineraryId, flightIds: $flightIds) {
      ...ItineraryCore
    }
  }
`;

export const ASSIGN_PASSENGERS_TO_ITINERARY = gql`
  mutation AssignPassengersToItinerary($itineraryId: ID!, $participantIds: [ID!]!) {
    assignPassengersToItinerary(itineraryId: $itineraryId, participantIds: $participantIds) {
      itinerary { id passengerCount seatsRemaining maxPassengers }
      assigned
      removed
      skipped
      conflicts {
        participantId
        participantName
        reason
        conflictingItinerary
      }
      passengerCount
      maxPassengers
      seatsRemaining
    }
  }
`;

export const REMOVE_PASSENGERS_FROM_ITINERARY = gql`
  mutation RemovePassengersFromItinerary($itineraryId: ID!, $participantIds: [ID!]!) {
    removePassengersFromItinerary(itineraryId: $itineraryId, participantIds: $participantIds) {
      itinerary { id passengerCount seatsRemaining maxPassengers }
      assigned
      removed
      skipped
      conflicts { participantId participantName reason conflictingItinerary }
      passengerCount
      maxPassengers
      seatsRemaining
    }
  }
`;

export const SET_ITINERARY_LEADERS = gql`
  mutation SetItineraryLeaders($itineraryId: ID!, $leaderIds: [ID!]!) {
    setItineraryLeaders(itineraryId: $itineraryId, leaderIds: $leaderIds) {
      id
      leaderCount
      leaders {
        id
        firstName
        firstSurname
        secondSurname
        identification
        instrument
      }
    }
  }
`;
