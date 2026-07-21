import { gql } from "@apollo/client";

const ITINERARY_CORE = gql`
  fragment ItineraryCore on TourItinerary {
    id
    tourId
    name
    reservationNumber
    notes
    maxPassengers
    seatsRemaining
    flightCount
    passengerCount
    leaderCount
    isLocked
    lockedAt
    whatsappGroupUrl
    flights {
      id
      airline
      flightNumber
      origin
      destination
      departureAt
      arrivalAt
      departureTimeZone
      arrivalTimeZone
      direction
      passengerCount
    }
    participants {
      id
      firstName
      firstSurname
      secondSurname
      identification
      birthDate
      sex
      passportNumber
      passportExpiry
      instrument
      role
      hasVisa
      visaExpiry
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
      departureTimeZone
      arrivalTimeZone
      direction
      passengerCount
    }
  }
`;

export const GET_TOUR_PARTICIPANTS_FOR_TABLE = gql`
  query GetTourParticipantsForTable($tourId: ID!) {
    getTourParticipants(tourId: $tourId) {
      id
      firstName
      firstSurname
      secondSurname
      identification
      birthDate
      sex
      passportNumber
      passportExpiry
      instrument
      role
      hasVisa
      visaExpiry
      visaStatus
      visaDeniedCount
    }
  }
`;

export const GET_TOUR_AVIANCA_DOCUMENT_DATA = gql`
  query GetTourAviancaDocumentData($tourId: ID!) {
    getTourAviancaDocumentData(tourId: $tourId) {
      participantId
      passport {
        fullName
        givenNames
        surname
        nationality
        issuingCountry
        documentNumber
        passportNumber
        dateOfBirth
        sex
        expirationDate
        issueDate
      }
      visa {
        fullName
        givenNames
        surname
        nationality
        issuingCountry
        documentNumber
        passportNumber
        visaType
        visaControlNumber
        dateOfBirth
        sex
        expirationDate
        issueDate
      }
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
      reservationNumber
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

export const SET_TOUR_ITINERARY_LOCKED = gql`
  mutation SetTourItineraryLocked($id: ID!, $locked: Boolean!) {
    setTourItineraryLocked(id: $id, locked: $locked) {
      id
      isLocked
      lockedAt
    }
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

export const REASSIGN_PASSENGER_TO_ITINERARY = gql`
  mutation ReassignPassengerToItinerary(
    $sourceItineraryId: ID!
    $targetItineraryId: ID!
    $participantId: ID!
  ) {
    reassignPassengerToItinerary(
      sourceItineraryId: $sourceItineraryId
      targetItineraryId: $targetItineraryId
      participantId: $participantId
    ) {
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
