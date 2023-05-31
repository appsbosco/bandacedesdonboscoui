import { gql } from "@apollo/client";

export const CREATE_EVENT = gql`
  mutation newEvent($input: EventInput) {
    newEvent(input: $input) {
      id
      place
      date
      time
      arrival
      departure
      description
    }
  }
`;

export const UPDATE_EVENT = gql`
  mutation updateEvent($id: ID!, $input: EventInput) {
    updateEvent(id: $id, input: $input) {
      id
      place
    }
  }
`;

export const DELETE_EVENT = gql`
  mutation deleteEvent($id: ID!) {
    deleteEvent(id: $id)
  }
`;
