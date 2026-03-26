import { gql } from "@apollo/client";

export const CREATE_BOOKING_REQUEST = gql`
  mutation CreateBookingRequest($input: BookingRequestInput!) {
    createBookingRequest(input: $input) {
      id
      ensemble
      fullName
      email
      eventType
      eventTypeOther
      budgetCurrency
      status
      eventDate
      createdAt
    }
  }
`;

export const GET_BOOKING_REQUESTS = gql`
  query GetBookingRequests($filter: BookingRequestFilterInput) {
    getBookingRequests(filter: $filter) {
      id
      ensemble
      fullName
      company
      email
      phone
      eventType
      eventTypeOther
      eventDate
      eventTime
      venue
      province
      canton
      district
      address
      estimatedDuration
      expectedAudience
      estimatedBudget
      budgetCurrency
      message
      acceptedDataPolicy
      status
      statusNotes
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_BOOKING_REQUEST_STATUS = gql`
  mutation UpdateBookingRequestStatus($id: ID!, $input: UpdateBookingRequestStatusInput!) {
    updateBookingRequestStatus(id: $id, input: $input) {
      id
      status
      statusNotes
      updatedAt
    }
  }
`;
