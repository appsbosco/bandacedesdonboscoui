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
