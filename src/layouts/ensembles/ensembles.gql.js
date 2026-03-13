import { gql } from "@apollo/client";

export const GET_ENSEMBLES = gql`
  query GetEnsembles {
    ensembles {
      id
      key
      name
      category
      isDefault
      isActive
      sortOrder
      memberCount
    }
  }
`;

export const USERS_PAGINATED = gql`
  query UsersPaginated($filter: UsersFilterInput, $pagination: PaginationInput) {
    usersPaginated(filter: $filter, pagination: $pagination) {
      items {
        id
        name
        firstSurName
        secondSurName
        email
        carnet
        state
        role
        grade
        instrument
        bands
        avatar
        phone
      }
      total
      page
      limit
      facets {
        byState  { value count }
        byRole   { value count }
        byInstrument { value count }
        byEnsemble   { value count }
      }
    }
  }
`;

export const ENSEMBLE_MEMBERS = gql`
  query EnsembleMembers($ensembleKey: String!, $filter: UsersFilterInput, $pagination: PaginationInput) {
    ensembleMembers(ensembleKey: $ensembleKey, filter: $filter, pagination: $pagination) {
      items {
        id
        name
        firstSurName
        secondSurName
        email
        carnet
        state
        role
        grade
        instrument
        bands
        avatar
        phone
      }
      total
      page
      limit
      facets {
        byState  { value count }
        byRole   { value count }
        byInstrument { value count }
        byEnsemble   { value count }
      }
    }
  }
`;

export const ADD_USER_TO_ENSEMBLES = gql`
  mutation AddUserToEnsembles($userIds: [ID!]!, $ensembleKeys: [String!]!) {
    addUserToEnsembles(userIds: $userIds, ensembleKeys: $ensembleKeys) {
      updatedCount
      skippedCount
      errors { userId reason }
    }
  }
`;

export const REMOVE_USER_FROM_ENSEMBLES = gql`
  mutation RemoveUserFromEnsembles($userIds: [ID!]!, $ensembleKeys: [String!]!) {
    removeUserFromEnsembles(userIds: $userIds, ensembleKeys: $ensembleKeys) {
      updatedCount
      skippedCount
      errors { userId reason }
    }
  }
`;

export const ENSEMBLE_AVAILABLE = gql`
  query EnsembleAvailable($ensembleKey: String!, $filter: UsersFilterInput, $pagination: PaginationInput) {
    ensembleAvailable(ensembleKey: $ensembleKey, filter: $filter, pagination: $pagination) {
      items {
        id
        name
        firstSurName
        secondSurName
        email
        carnet
        state
        role
        grade
        instrument
        bands
        avatar
        phone
      }
      total
      page
      limit
      facets {
        byState  { value count }
        byRole   { value count }
        byInstrument { value count }
        byEnsemble   { value count }
      }
    }
  }
`;

export const ENSEMBLE_COUNTS = gql`
  query EnsembleCounts($ensembleKey: String!) {
    ensembleCounts(ensembleKey: $ensembleKey) {
      membersTotal
      availableTotal
        inOtherTotal
    }
  }
`;

export const ENSEMBLE_INSTRUMENT_STATS = gql`
  query EnsembleInstrumentStats($ensembleKey: String!) {
    ensembleInstrumentStats(ensembleKey: $ensembleKey) {
      instrument
      count
    }
  }
`;

export const SET_USER_ENSEMBLES = gql`
  mutation SetUserEnsembles($userId: ID!, $ensembleKeys: [String!]!) {
    setUserEnsembles(userId: $userId, ensembleKeys: $ensembleKeys) {
      id
      bands
    }
  }
`;



 
export const ENSEMBLE_IN_OTHER = gql`
  query EnsembleInOther($ensembleKey: String!, $filter: UsersFilterInput, $pagination: PaginationInput) {
    ensembleInOther(ensembleKey: $ensembleKey, filter: $filter, pagination: $pagination) {
      items {
        id
        name
        firstSurName
        secondSurName
        email
        carnet
        state
        role
        grade
        instrument
        bands
        avatar
        phone
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
 
