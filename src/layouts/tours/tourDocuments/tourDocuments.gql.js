import { gql } from "@apollo/client";

/**
 * tourDocuments.gql.js
 *
 * TourParticipant expone una proyección sincronizada para passport / visa / permit.
 * La fuente canónica vive en el módulo Documents cuando el participante está
 * vinculado a un User; la edición manual en TourParticipant queda como fallback
 * solo para participantes no vinculados.
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
      linkedUser {
        id
      }
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
