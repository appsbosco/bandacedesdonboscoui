import { gql } from "@apollo/client";

export const GET_TOUR_FLIGHTS = gql`
  query GetTourFlights($tourId: ID!) {
    getTourFlights(tourId: $tourId) {
      id
      airline
      flightNumber
      origin
      destination
      departureAt
      arrivalAt
      direction
      routeGroup
      notes
      passengerCount
      passengers {
        participant {
          id
          firstName
          firstSurname
          secondSurname
          identification
        }
        seatNumber
        confirmedAt
      }
      createdBy {
        name
        firstSurName
      }
      updatedBy {
        name
        firstSurName
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_TOUR_FLIGHT = gql`
  query GetTourFlight($id: ID!) {
    getTourFlight(id: $id) {
      id
      airline
      flightNumber
      origin
      destination
      departureAt
      arrivalAt
      direction
      routeGroup
      notes
      passengerCount
      passengers {
        participant {
          id
          firstName
          firstSurname
          secondSurname
          identification
        }
        seatNumber
        confirmedAt
      }
    }
  }
`;

export const CREATE_TOUR_FLIGHT = gql`
  mutation CreateTourFlight($input: TourFlightInput!) {
    createTourFlight(input: $input) {
      id
      airline
      flightNumber
      origin
      destination
      departureAt
      arrivalAt
      direction
      routeGroup
      notes
      passengerCount
    }
  }
`;

export const UPDATE_TOUR_FLIGHT = gql`
  mutation UpdateTourFlight($id: ID!, $input: TourFlightInput!) {
    updateTourFlight(id: $id, input: $input) {
      id
      airline
      flightNumber
      origin
      destination
      departureAt
      arrivalAt
      direction
      routeGroup
      notes
      passengerCount
    }
  }
`;

export const DELETE_TOUR_FLIGHT = gql`
  mutation DeleteTourFlight($id: ID!) {
    deleteTourFlight(id: $id)
  }
`;

export const ASSIGN_PASSENGER = gql`
  mutation AssignPassenger($flightId: ID!, $participantId: ID!) {
    assignPassenger(flightId: $flightId, participantId: $participantId) {
      id
      passengerCount
      passengers {
        participant {
          id
          firstName
          firstSurname
          secondSurname
          identification
        }
        seatNumber
        confirmedAt
      }
    }
  }
`;

export const ASSIGN_PASSENGERS = gql`
  mutation AssignPassengers($flightId: ID!, $participantIds: [ID!]!) {
    assignPassengers(flightId: $flightId, participantIds: $participantIds) {
      assigned
      skipped
      conflicts {
        participantId
        participantName
        conflictingFlight
        conflictingRoute
      }
      flight {
        id
        passengerCount
        passengers {
          participant {
            id
            firstName
            firstSurname
            secondSurname
            identification
          }
          seatNumber
          confirmedAt
        }
      }
    }
  }
`;

export const REMOVE_PASSENGER = gql`
  mutation RemovePassenger($flightId: ID!, $participantId: ID!) {
    removePassenger(flightId: $flightId, participantId: $participantId) {
      id
      passengerCount
      passengers {
        participant {
          id
          firstName
          firstSurname
          secondSurname
          identification
        }
        seatNumber
        confirmedAt
      }
    }
  }
`;
