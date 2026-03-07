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
