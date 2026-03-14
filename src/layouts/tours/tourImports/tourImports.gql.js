import { gql } from "@apollo/client";

export const PREVIEW_TOUR_PARTICIPANT_IMPORT = gql`
  mutation PreviewTourParticipantImport($input: TourImportInput!) {
    previewTourParticipantImport(input: $input) {
      batchId
      tourId
      fileName
      totalRows
      validRows
      invalidRows
      duplicateRows
      rows {
        rowIndex
        firstName
        firstSurname
        secondSurname
        identification
        email
        phone
        birthDate
        instrument
        grade
        passportNumber
        role
        isValid
        isDuplicate
        errors
      }
    }
  }
`;

export const CONFIRM_TOUR_PARTICIPANT_IMPORT = gql`
  mutation ConfirmTourParticipantImport($input: TourImportConfirmInput!) {
    confirmTourParticipantImport(input: $input) {
      batchId
      tourId
      importedCount
      updatedCount
      duplicates
      errors
      mode
    }
  }
`;

export const CANCEL_TOUR_IMPORT_BATCH = gql`
  mutation CancelTourImportBatch($batchId: ID!) {
    cancelTourImportBatch(batchId: $batchId)
  }
`;

export const GET_TOUR_IMPORT_BATCHES = gql`
  query GetTourImportBatches($tourId: ID!) {
    getTourImportBatches(tourId: $tourId) {
      id
      status
      fileName
      totalRows
      validRows
      invalidRows
      duplicateRows
      importedCount
      createdAt
      confirmedAt
      createdBy {
        name
        firstSurName
      }
    }
  }
`;
