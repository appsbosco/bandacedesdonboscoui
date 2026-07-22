import { gql } from "@apollo/client";

const TICKET_FIELDS = gql`
  fragment TourParticipantTicketFields on TourParticipantTicket {
    id
    type
    status
    originalName
    bytes
    mimeType
    sha256
    version
    assignedAt
    createdAt
    updatedAt
    participant {
      id
      firstName
      firstSurname
      secondSurname
      instrument
      grade
      role
      linkedUser {
        id
      }
    }
    itinerary {
      id
      name
      reservationNumber
      flights {
        id
        origin
        destination
        departureAt
        departureTimeZone
        direction
      }
    }
    tour {
      id
      name
      destination
    }
  }
`;

export const MY_TOUR_PARTICIPANT_TICKET = gql`
  ${TICKET_FIELDS}
  query MyTourParticipantTicket($tourId: ID!, $participantId: ID) {
    myTourParticipantTicket(tourId: $tourId, participantId: $participantId) {
      ...TourParticipantTicketFields
    }
  }
`;

export const TOUR_PARTICIPANT_TICKETS = gql`
  ${TICKET_FIELDS}
  query TourParticipantTickets($tourId: ID!, $itineraryId: ID) {
    tourParticipantTickets(tourId: $tourId, itineraryId: $itineraryId) {
      ...TourParticipantTicketFields
    }
  }
`;

export const CREATE_TICKET_UPLOAD_AUTHORIZATION = gql`
  mutation CreateTourParticipantTicketUploadAuthorization($input: TicketUploadAuthorizationInput!) {
    createTourParticipantTicketUploadAuthorization(input: $input) {
      provider
      cloudName
      apiKey
      timestamp
      signature
      publicId
      resourceType
      deliveryType
      uploadUrl
      maxBytes
      expiresAt
    }
  }
`;

export const ASSIGN_TOUR_PARTICIPANT_TICKETS = gql`
  mutation AssignTourParticipantTickets($inputs: [AssignTourParticipantTicketInput!]!) {
    assignTourParticipantTickets(inputs: $inputs) {
      total
      succeeded
      failed
      skipped
      results {
        clientFileId
        participantId
        status
        ticketId
        errorCode
        message
      }
    }
  }
`;

export const GET_TICKET_DOWNLOAD = gql`
  query GetTourParticipantTicketDownload($ticketId: ID!, $disposition: TicketDownloadDisposition) {
    getTourParticipantTicketDownload(ticketId: $ticketId, disposition: $disposition) {
      url
      expiresAt
      fileName
      mimeType
      disposition
    }
  }
`;
