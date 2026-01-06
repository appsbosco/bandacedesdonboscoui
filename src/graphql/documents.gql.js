import { gql } from "@apollo/client";

// Fragments
export const DOCUMENT_FIELDS = gql`
  fragment DocumentFields on Document {
    _id
    type
    status
    source
    notes
    retentionUntil
    lastAccessedAt
    isDeleted
    createdAt
    updatedAt
    isExpired
    daysUntilExpiration
    images {
      _id
      url
      provider
      publicId
      uploadedAt
    }
    extracted {
      fullName
      givenNames
      surname
      nationality
      issuingCountry
      documentNumber
      passportNumber
      visaType
      dateOfBirth
      sex
      expirationDate
      issueDate
      mrzRaw
      mrzValid
      ocrText
      ocrConfidence
    }
  }
`;

// Queries
export const MY_DOCUMENTS = gql`
  ${DOCUMENT_FIELDS}
  query MyDocuments($filters: DocumentFiltersInput, $pagination: PaginationInput) {
    myDocuments(filters: $filters, pagination: $pagination) {
      documents {
        ...DocumentFields
      }
      pagination {
        total
        limit
        skip
        hasMore
      }
    }
  }
`;

export const DOCUMENT_BY_ID = gql`
  ${DOCUMENT_FIELDS}
  query DocumentById($id: ID!) {
    documentById(id: $id) {
      ...DocumentFields
    }
  }
`;

export const DOCUMENTS_EXPIRING_SUMMARY = gql`
  query DocumentsExpiringSummary($referenceDate: DateTime) {
    documentsExpiringSummary(referenceDate: $referenceDate) {
      total
      expired
      expiringIn30Days
      expiringIn60Days
      expiringIn90Days
      valid
      noExpirationDate
    }
  }
`;

// Mutations
export const CREATE_DOCUMENT = gql`
  ${DOCUMENT_FIELDS}
  mutation CreateDocument($input: CreateDocumentInput!) {
    createDocument(input: $input) {
      ...DocumentFields
    }
  }
`;

export const ADD_DOCUMENT_IMAGE = gql`
  ${DOCUMENT_FIELDS}
  mutation AddDocumentImage($input: AddDocumentImageInput!) {
    addDocumentImage(input: $input) {
      ...DocumentFields
    }
  }
`;

export const UPSERT_DOCUMENT_EXTRACTED_DATA = gql`
  ${DOCUMENT_FIELDS}
  mutation UpsertDocumentExtractedData($input: UpsertDocumentExtractedDataInput!) {
    upsertDocumentExtractedData(input: $input) {
      ...DocumentFields
    }
  }
`;

export const SET_DOCUMENT_STATUS = gql`
  ${DOCUMENT_FIELDS}
  mutation SetDocumentStatus($documentId: ID!, $status: DocumentStatus!) {
    setDocumentStatus(documentId: $documentId, status: $status) {
      ...DocumentFields
    }
  }
`;

export const DELETE_DOCUMENT = gql`
  mutation DeleteDocument($documentId: ID!) {
    deleteDocument(documentId: $documentId) {
      success
      message
    }
  }
`;
