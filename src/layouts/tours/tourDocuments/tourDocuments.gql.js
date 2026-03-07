import { gql } from "@apollo/client";

/**
 * tourDocuments.gql.js
 *
 * SCHEMA NOTE: The backend has no separate TourDocument type.
 * Document data (passport, visa, exit permit) lives directly on TourParticipant.
 * All document operations use getTourParticipants + updateTourParticipant.
 *
 * The previous getTourDocumentStatus / getTourDocumentAlerts queries did not exist
 * in the backend schema and have been replaced with real endpoints.
 */

export const GET_TOUR_PARTICIPANTS_DOCS = gql`
  query GetTourParticipantsDocs($tourId: ID!) {
    getTourParticipants(tourId: $tourId) {
      id
      firstName
      firstSurname
      secondSurname
      identification
      birthDate
      sex
      instrument
      grade
      role
      status
      notes
      # Document fields
      passportNumber
      passportExpiry
      hasVisa
      visaExpiry
      hasExitPermit
      # Audit
      createdAt
      updatedAt
      addedBy {
        name
        firstSurName
      }
    }
  }
`;

export const UPDATE_PARTICIPANT_DOCS = gql`
  mutation UpdateParticipantDocs($id: ID!, $input: UpdateTourParticipantInput!) {
    updateTourParticipant(id: $id, input: $input) {
      id
      passportNumber
      passportExpiry
      hasVisa
      visaExpiry
      hasExitPermit
      notes
      updatedAt
    }
  }
`;
