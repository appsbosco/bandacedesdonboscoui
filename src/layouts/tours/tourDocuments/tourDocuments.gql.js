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
      visaStatus
      visaDecisionDate
      visaDeniedCount
      visaLastDeniedAt
      visaLastDeniedReason
      visaBlockedAt
      visaNotes
      visaBlockedBy {
        id
        name
        firstSurName
      }
      visaHistory {
        id
        status
        reason
        notes
        decidedAt
        denialOrdinal
        decidedBy {
          id
          name
          firstSurName
        }
      }
      hasExitPermit
      selfServiceVerified
      selfServiceVerifiedAt
      selfServiceVerificationRevokedAt
      selfServiceVerificationRevocationReason
      selfServiceVerificationRevokedBy { id name firstSurName }
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

export const REVOKE_PARTICIPANT_VERIFICATION = gql`
  mutation RevokeParticipantVerification($participantId: ID!, $reason: String!) {
    revokeTourParticipantSelfServiceVerification(participantId: $participantId, reason: $reason) {
      id
      selfServiceVerified
      selfServiceVerifiedAt
      selfServiceVerificationRevokedAt
      selfServiceVerificationRevocationReason
      selfServiceVerificationRevokedBy { id name firstSurName }
    }
  }
`;

export const GET_TOUR_DOCUMENT_EXTRACTED_DATA = gql`
  query GetTourDocumentExtractedData($tourId: ID!) {
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

export const UPDATE_PARTICIPANT_VISA_STATUS = gql`
  mutation UpdateParticipantVisaStatus($participantId: ID!, $input: UpdateTourParticipantVisaStatusInput!) {
    updateTourParticipantVisaStatus(participantId: $participantId, input: $input) {
      id
      hasVisa
      visaExpiry
      visaStatus
      visaDecisionDate
      visaDeniedCount
      visaLastDeniedAt
      visaLastDeniedReason
      visaBlockedAt
      visaNotes
      visaBlockedBy {
        id
        name
        firstSurName
      }
      visaHistory {
        id
        status
        reason
        notes
        decidedAt
        denialOrdinal
        decidedBy {
          id
          name
          firstSurName
        }
      }
      updatedAt
    }
  }
`;
