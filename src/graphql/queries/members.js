import { gql } from "@apollo/client";

export const GET_USERS = gql`
  query getUsers {
    getUsers {
      id
      name
      firstSurName
      secondSurName
      email
      birthday
      carnet
      state
      grade
      phone
      role
      avatar
      instrument
    }
  }
`;

export const GET_MEDICAL_RECORDS = gql`
  query GetMedicalRecords {
    getMedicalRecords {
      id
      identification
      sex
      bloodType
      address
      familyMemberName
      familyMemberNumber
      familyMemberNumberId
      familyMemberRelationship
      familyMemberOccupation
      illness
      medicine
      medicineOnTour
      allergies
      user {
        name
        id
      }
    }
  }
`;
