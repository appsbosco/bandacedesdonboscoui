import { gql } from "@apollo/client";

export const DOCUMENT_FRAGMENT = gql`
  fragment DocumentFragment on Document {
    id
    type
    source
    status
    owner {
      name
      firstSurName
      secondSurName
      email
    }
    notes
    images {
      id
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
      visaControlNumber
      dateOfBirth
      sex
      expirationDate
      issueDate
      destination
      authorizerName
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
    id
    type
    status
    images {
      kind
      url
      publicId
      mimeType
    }
    extracted {
      fullName
      documentNumber
      passportNumber
      expirationDate
    }
    owner {
      name
      firstSurName
      secondSurName
      email
    }
    isExpired
    daysUntilExpiration
    createdAt
  }
`;
