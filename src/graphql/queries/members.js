import { gql } from "@apollo/client";

export const USERS_PAGINATED_FOR_MEMBERS = gql`
  query UsersPaginatedForMembers($filter: UsersFilterInput, $pagination: PaginationInput) {
    usersPaginated(filter: $filter, pagination: $pagination) {
      items {
        id
        name
        firstSurName
        secondSurName
        email
        carnet
        birthday
        state
        grade
        phone
        role
        avatar
        instrument
        bands
      }
      total
      page
      limit
      facets {
        byState      { value count }
        byRole       { value count }
        byInstrument { value count }
        byEnsemble   { value count }
      }
    }
  }
`;

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

export const PARENTS_PAGINATED_FOR_MEMBERS = gql`
  query ParentsPaginatedForMembers($filter: ParentsFilterInput, $pagination: PaginationInput) {
    parentsPaginated(filter: $filter, pagination: $pagination) {
      items {
        id
        name
        firstSurName
        secondSurName
        email
        phone
        role
        avatar
        matchedBy
        matchedChildIds
        children {
          id
          name
          firstSurName
          secondSurName
          carnet
          email
        }
      }
      total
      page
      limit
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
