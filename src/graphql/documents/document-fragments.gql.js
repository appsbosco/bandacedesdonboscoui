import { gql } from "@apollo/client";

// Document Fragments
export const DOCUMENT_FRAGMENT = gql`
  fragment DocumentFragment on Document {
    id: _id
    type
    source
    status
    notes
    images {
      kind
      url
      publicId
      width
      height
      bytes
      mimeType
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
      mrzFormat
      reasonCodes
      ocrText
      ocrConfidence
    }
    ocrAttempts
    ocrLastError
    ocrUpdatedAt
    isExpired
    daysUntilExpiration
    retentionUntil
    createdAt
    updatedAt
  }
`;

export const DOCUMENT_CARD_FRAGMENT = gql`
  fragment DocumentCardFragment on Document {
    id: _id
    type
    status
    images {
      kind
      url
    }
    extracted {
      fullName
      documentNumber
      passportNumber
      expirationDate
    }
    isExpired
    daysUntilExpiration
    createdAt
  }
`;

export const PAGINATION_FRAGMENT = gql`
  fragment PaginationFragment on PaginationInfo {
    total
    limit
    skip
    hasMore
  }
`;
