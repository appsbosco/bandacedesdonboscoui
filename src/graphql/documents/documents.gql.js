import { gql } from "@apollo/client";
import {
  DOCUMENT_FRAGMENT,
  DOCUMENT_CARD_FRAGMENT,
  PAGINATION_FRAGMENT,
} from "../../graphql/documents/document-fragments.gql.js";

export const MY_DOCUMENTS = gql`
  ${DOCUMENT_CARD_FRAGMENT}
  ${PAGINATION_FRAGMENT}
  query MyDocuments($filters: DocumentFiltersInput, $pagination: PaginationInput) {
    myDocuments(filters: $filters, pagination: $pagination) {
      documents {
        ...DocumentCardFragment
      }
      pagination {
        ...PaginationFragment
      }
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
  query DocumentsExpiringSummary($referenceDate: DateTime) {
    documentsExpiringSummary(referenceDate: $referenceDate) {
      expired
      expiringIn30Days
      expiringIn60Days
      expiringIn90Days
      valid
      total
    }
  }
`;

export const CREATE_DOCUMENT = gql`
  ${DOCUMENT_FRAGMENT}
  mutation CreateDocument($input: CreateDocumentInput!) {
    createDocument(input: $input) {
      ...DocumentFragment
    }
  }
`;

export const ADD_DOCUMENT_IMAGE = gql`
  ${DOCUMENT_FRAGMENT}
  mutation AddDocumentImage($input: AddDocumentImageInput!) {
    addDocumentImage(input: $input) {
      ...DocumentFragment
    }
  }
`;

export const UPSERT_DOCUMENT_EXTRACTED_DATA = gql`
  ${DOCUMENT_FRAGMENT}
  mutation UpsertDocumentExtractedData($input: UpsertDocumentExtractedDataInput!) {
    upsertDocumentExtractedData(input: $input) {
      ...DocumentFragment
    }
  }
`;

export const SET_DOCUMENT_STATUS = gql`
  ${DOCUMENT_FRAGMENT}
  mutation SetDocumentStatus($documentId: ID!, $status: DocumentStatus!) {
    setDocumentStatus(documentId: $documentId, status: $status) {
      ...DocumentFragment
    }
  }
`;

export const GET_SIGNED_UPLOAD = gql`
  mutation GetSignedUpload($input: GetSignedUploadInput!) {
    getSignedUpload(input: $input) {
      timestamp
      signature
      apiKey
      cloudName
      folder
      publicId
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

export const ENQUEUE_DOCUMENT_OCR = gql`
  mutation EnqueueDocumentOcr($input: EnqueueDocumentOcrInput!) {
    enqueueDocumentOcr(input: $input) {
      success
      jobId
    }
  }
`;
