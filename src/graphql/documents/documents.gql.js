import { gql } from "@apollo/client";
import { DOCUMENT_FRAGMENT, DOCUMENT_CARD_FRAGMENT } from "./document-fragments.gql.js";

export const MY_DOCUMENTS = gql`
  ${DOCUMENT_CARD_FRAGMENT}
  query MyDocuments(
    $type: DocumentType
    $status: DocumentStatus
    $expiredOnly: Boolean
    $limit: Int
    $skip: Int
  ) {
    myDocuments(
      type: $type
      status: $status
      expiredOnly: $expiredOnly
      limit: $limit
      skip: $skip
    ) {
      documents {
        ...DocumentCardFragment
      }
      total
      hasMore
    }
  }
`;

export const DOCUMENT_BY_ID = gql`
  ${DOCUMENT_FRAGMENT}
  query DocumentById($id: ID!) {
    documentById(id: $id) {
      ...DocumentFragment
    }
  }
`;

export const DOCUMENTS_EXPIRING_SUMMARY = gql`
  query DocumentsExpiringSummary($referenceDate: String) {
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

export const ALL_DOCUMENTS = gql`
  ${DOCUMENT_CARD_FRAGMENT}
  query AllDocuments(
    $ownerSearch: String
    $type: DocumentType
    $status: DocumentStatus
    $expiredOnly: Boolean
    $limit: Int
    $skip: Int
  ) {
    allDocuments(
      ownerSearch: $ownerSearch
      type: $type
      status: $status
      expiredOnly: $expiredOnly
      limit: $limit
      skip: $skip
    ) {
      documents {
        ...DocumentCardFragment
      }
      total
      hasMore
    }
  }
`;

export const CREATE_DOCUMENT = gql`
  mutation CreateDocument($type: DocumentType!, $notes: String) {
    createDocument(type: $type, notes: $notes) {
      id
      type
      status
    }
  }
`;

export const GET_SIGNED_UPLOAD = gql`
  mutation GetSignedUpload($documentId: ID!, $kind: ImageKind) {
    getSignedUpload(documentId: $documentId, kind: $kind) {
      signature
      timestamp
      cloudName
      apiKey
      folder
      publicId
      resourceType
    }
  }
`;

export const DOCUMENT_VISIBILITY_SETTINGS = gql`
  query DocumentVisibilitySettings {
    documentVisibilitySettings {
      restrictSensitiveUploadsToAdmins
      sensitiveTypes
    }
  }
`;

export const UPDATE_DOCUMENT_VISIBILITY_SETTINGS = gql`
  mutation UpdateDocumentVisibilitySettings($restrictSensitiveUploadsToAdmins: Boolean!) {
    updateDocumentVisibilitySettings(
      restrictSensitiveUploadsToAdmins: $restrictSensitiveUploadsToAdmins
    ) {
      restrictSensitiveUploadsToAdmins
      sensitiveTypes
    }
  }
`;

export const ADD_DOCUMENT_IMAGE = gql`
  mutation AddDocumentImage($documentId: ID!, $image: AddDocumentImageInput!) {
    addDocumentImage(documentId: $documentId, image: $image) {
      id
      status
      images {
        id
        kind
        url
      }
    }
  }
`;

export const UPSERT_DOCUMENT_EXTRACTED_DATA = gql`
  ${DOCUMENT_FRAGMENT}
  mutation UpsertDocumentExtractedData(
    $documentId: ID!
    $data: UpsertDocumentExtractedDataInput!
  ) {
    upsertDocumentExtractedData(documentId: $documentId, data: $data) {
      ...DocumentFragment
    }
  }
`;

export const SET_DOCUMENT_STATUS = gql`
  mutation SetDocumentStatus($documentId: ID!, $status: DocumentStatus!) {
    setDocumentStatus(documentId: $documentId, status: $status) {
      id
      status
    }
  }
`;

export const DELETE_DOCUMENT = gql`
  mutation DeleteDocument($documentId: ID!) {
    deleteDocument(documentId: $documentId)
  }
`;

export const ENQUEUE_DOCUMENT_OCR = gql`
  mutation EnqueueDocumentOcr($documentId: ID!) {
    enqueueDocumentOcr(documentId: $documentId) {
      ok
      jobId
      message
    }
  }
`;

export const PROCESS_DOCUMENT_OCR = gql`
  ${DOCUMENT_FRAGMENT}
  mutation ProcessDocumentOcr($documentId: ID!) {
    processDocumentOcr(documentId: $documentId) {
      ...DocumentFragment
    }
  }
`;
