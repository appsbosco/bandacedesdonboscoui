import { gql } from "@apollo/client";

export const GET_TOUR_ROOMS = gql`
  query GetTourRooms($tourId: ID!) {
    getTourRooms(tourId: $tourId) {
      id
      hotelName
      roomNumber
      roomType
      capacity
      floor
      notes
      occupantCount
      isFull
      responsible {
        id
        firstName
        firstSurname
        secondSurname
      }
      occupants {
        participant {
          id
          firstName
          firstSurname
          secondSurname
          identification
          birthDate
          sex
        }
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

/** Richer participant data used by the room planner. */
export const GET_TOUR_PARTICIPANTS_PLANNER = gql`
  query GetTourParticipantsPlanner($tourId: ID!) {
    getTourParticipants(tourId: $tourId) {
      id
      firstName
      firstSurname
      secondSurname
      identification
      birthDate
      sex
      instrument
      role
    }
  }
`;

export const UPDATE_TOUR_PARTICIPANT_SEX = gql`
  mutation UpdateTourParticipantSex($participantId: ID!, $sex: Sex!) {
    updateTourParticipantSex(participantId: $participantId, sex: $sex) {
      id
      sex
    }
  }
`;

export const CREATE_TOUR_ROOM = gql`
  mutation CreateTourRoom($input: TourRoomInput!) {
    createTourRoom(input: $input) {
      id
      hotelName
      roomNumber
      roomType
      capacity
      floor
      notes
      occupantCount
      isFull
      occupants {
        participant {
          id
          firstName
          firstSurname
          secondSurname
          identification
          birthDate
          sex
        }
        confirmedAt
      }
    }
  }
`;

export const UPDATE_TOUR_ROOM = gql`
  mutation UpdateTourRoom($id: ID!, $input: TourRoomInput!) {
    updateTourRoom(id: $id, input: $input) {
      id
      hotelName
      roomNumber
      roomType
      capacity
      floor
      notes
      occupantCount
      isFull
      occupants {
        participant {
          id
          firstName
          firstSurname
          secondSurname
          identification
          birthDate
          sex
        }
        confirmedAt
      }
    }
  }
`;

export const DELETE_TOUR_ROOM = gql`
  mutation DeleteTourRoom($id: ID!) {
    deleteTourRoom(id: $id)
  }
`;

export const ASSIGN_OCCUPANT = gql`
  mutation AssignOccupant($roomId: ID!, $participantId: ID!) {
    assignOccupant(roomId: $roomId, participantId: $participantId) {
      id
      occupantCount
      isFull
      occupants {
        participant {
          id
          firstName
          firstSurname
          secondSurname
          identification
          birthDate
          sex
        }
        confirmedAt
      }
    }
  }
`;

export const REMOVE_OCCUPANT = gql`
  mutation RemoveOccupant($roomId: ID!, $participantId: ID!) {
    removeOccupant(roomId: $roomId, participantId: $participantId) {
      id
      occupantCount
      isFull
      responsible {
        id
        firstName
        firstSurname
        secondSurname
      }
      occupants {
        participant {
          id
          firstName
          firstSurname
          secondSurname
          identification
          birthDate
          sex
        }
        confirmedAt
      }
    }
  }
`;

export const SET_ROOM_RESPONSIBLE = gql`
  mutation SetRoomResponsible($roomId: ID!, $participantId: ID) {
    setRoomResponsible(roomId: $roomId, participantId: $participantId) {
      id
      responsible {
        id
        firstName
        firstSurname
        secondSurname
      }
    }
  }
`;
