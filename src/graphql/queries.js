import { gql } from "@apollo/client";

export const GET_EVENTS = gql`
  query getEvents {
    getEvents {
      id
      place
      description
    }
  }
`;
