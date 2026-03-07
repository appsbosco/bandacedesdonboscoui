import { gql } from "@apollo/client";

const ROUTE_CORE = gql`
  fragment RouteCore on TourRoute {
    id
    tourId
    name
    direction
    origin
    destination
    notes
    passengerCount
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
    }
    createdAt
    updatedAt
  }
`;

export const GET_TOUR_ROUTES = gql`
  ${ROUTE_CORE}
  query GetTourRoutes($tourId: ID!) {
    getTourRoutes(tourId: $tourId) {
      ...RouteCore
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

export const CREATE_TOUR_ROUTE = gql`
  ${ROUTE_CORE}
  mutation CreateTourRoute($tourId: ID!, $input: TourRouteInput!) {
    createTourRoute(tourId: $tourId, input: $input) {
      ...RouteCore
    }
  }
`;

export const UPDATE_TOUR_ROUTE = gql`
  mutation UpdateTourRoute($id: ID!, $input: TourRouteInput!) {
    updateTourRoute(id: $id, input: $input) {
      id
      name
      direction
      origin
      destination
      notes
    }
  }
`;

export const DELETE_TOUR_ROUTE = gql`
  mutation DeleteTourRoute($id: ID!) {
    deleteTourRoute(id: $id)
  }
`;

export const ASSIGN_FLIGHTS_TO_ROUTE = gql`
  ${ROUTE_CORE}
  mutation AssignFlightsToRoute($routeId: ID!, $flightIds: [ID!]!) {
    assignFlightsToRoute(routeId: $routeId, flightIds: $flightIds) {
      ...RouteCore
    }
  }
`;

export const UNASSIGN_FLIGHTS_FROM_ROUTE = gql`
  ${ROUTE_CORE}
  mutation UnassignFlightsFromRoute($routeId: ID!, $flightIds: [ID!]!) {
    unassignFlightsFromRoute(routeId: $routeId, flightIds: $flightIds) {
      ...RouteCore
    }
  }
`;

export const ASSIGN_PASSENGERS_TO_ROUTE = gql`
  mutation AssignPassengersToRoute($routeId: ID!, $participantIds: [ID!]!) {
    assignPassengersToRoute(routeId: $routeId, participantIds: $participantIds) {
      route { id passengerCount }
      assigned
      removed
      skipped
      conflicts {
        participantId
        participantName
        conflictingRoute
      }
      passengerCount
    }
  }
`;

export const REMOVE_PASSENGERS_FROM_ROUTE = gql`
  mutation RemovePassengersFromRoute($routeId: ID!, $participantIds: [ID!]!) {
    removePassengersFromRoute(routeId: $routeId, participantIds: $participantIds) {
      route { id passengerCount }
      assigned
      removed
      skipped
      conflicts {
        participantId
        participantName
        conflictingRoute
      }
      passengerCount
    }
  }
`;
