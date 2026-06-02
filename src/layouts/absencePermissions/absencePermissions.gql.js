import { gql } from "@apollo/client";

// ─── Fragments ────────────────────────────────────────────────────────────────

const PERMISSION_USER_FIELDS = gql`
  fragment PermissionUserFields on User {
    id
    name
    firstSurName
    secondSurName
    instrument
    avatar
    state
  }
`;

const ABSENCE_PERMISSION_CORE = gql`
  ${PERMISSION_USER_FIELDS}
  fragment AbsencePermissionCore on AbsencePermission {
    id
    student {
      ...PermissionUserFields
    }
    requesterType
    permissionType
    requestedByParent {
      id
      name
      firstSurName
      secondSurName
    }
    requestedByUser {
      id
      name
      firstSurName
      secondSurName
    }
    targetType
    rehearsalSession {
      id
      dateNormalized
      section
      status
    }
    event {
      id
      title
      date
      place
    }
    absenceDate
    reason
    attachments
    requestStatus
    justificationStatus
    reviewedBy {
      id
      name
      firstSurName
      secondSurName
    }
    reviewedAt
    adminNotes
    createdAt
    updatedAt
  }
`;

const ABSENCE_PERMISSION_WITH_HISTORY = gql`
  ${ABSENCE_PERMISSION_CORE}
  fragment AbsencePermissionWithHistory on AbsencePermission {
    ...AbsencePermissionCore
    statusHistory {
      requestStatus
      justificationStatus
      changedBy {
        id
        name
        firstSurName
      }
      notes
      changedAt
    }
  }
`;

// ─── Queries ──────────────────────────────────────────────────────────────────

export const GET_MY_ABSENCE_PERMISSIONS = gql`
  ${ABSENCE_PERMISSION_CORE}
  query GetMyAbsencePermissions($limit: Int, $offset: Int) {
    getMyAbsencePermissions(limit: $limit, offset: $offset) {
      items {
        ...AbsencePermissionCore
      }
      totalCount
      hasMore
    }
  }
`;

export const GET_ABSENCE_PERMISSIONS_FOR_CHILD = gql`
  ${ABSENCE_PERMISSION_CORE}
  query GetAbsencePermissionsForChild($childId: ID!, $limit: Int, $offset: Int) {
    getAbsencePermissionsForChild(childId: $childId, limit: $limit, offset: $offset) {
      items {
        ...AbsencePermissionCore
      }
      totalCount
      hasMore
    }
  }
`;

export const GET_MY_USER_ABSENCE_PERMISSIONS = gql`
  ${ABSENCE_PERMISSION_CORE}
  query GetMyUserAbsencePermissions($limit: Int, $offset: Int) {
    getMyUserAbsencePermissions(limit: $limit, offset: $offset) {
      items {
        ...AbsencePermissionCore
      }
      totalCount
      hasMore
    }
  }
`;

export const GET_ABSENCE_PERMISSIONS_ADMIN = gql`
  ${ABSENCE_PERMISSION_CORE}
  query GetAbsencePermissionsAdmin(
    $filter: AbsencePermissionFilterInput
    $limit: Int
    $offset: Int
  ) {
    getAbsencePermissionsAdmin(filter: $filter, limit: $limit, offset: $offset) {
      items {
        ...AbsencePermissionCore
      }
      totalCount
      hasMore
    }
  }
`;

export const GET_ABSENCE_PERMISSIONS_FOR_SECTION = gql`
  ${ABSENCE_PERMISSION_CORE}
  query GetAbsencePermissionsForSection(
    $section: Section!
    $startDate: String
    $endDate: String
    $limit: Int
    $offset: Int
  ) {
    getAbsencePermissionsForSection(
      section: $section
      startDate: $startDate
      endDate: $endDate
      limit: $limit
      offset: $offset
    ) {
      items {
        ...AbsencePermissionCore
      }
      totalCount
      hasMore
    }
  }
`;

export const GET_PERMISSIONS_FOR_SESSION = gql`
  query GetPermissionsForSession($sessionId: ID!) {
    getPermissionsForSession(sessionId: $sessionId) {
      id
      studentId
      permissionType
      requestStatus
      justificationStatus
      reason
      requesterType
      suggestedAttendanceStatus
    }
  }
`;

export const GET_PERMISSIONS_FOR_EVENT = gql`
  query GetPermissionsForEvent($eventId: ID!) {
    getPermissionsForEvent(eventId: $eventId) {
      id
      studentId
      permissionType
      requestStatus
      justificationStatus
      reason
      requesterType
      suggestedAttendanceStatus
    }
  }
`;

export const GET_PERMISSIONS_FOR_REHEARSAL_DATE = gql`
  query GetPermissionsForRehearsalDate($date: String!) {
    getPermissionsForRehearsalDate(date: $date) {
      id
      studentId
      permissionType
      requestStatus
      justificationStatus
      reason
      requesterType
      suggestedAttendanceStatus
    }
  }
`;

export const GET_ABSENCE_PERMISSION_DETAIL = gql`
  ${ABSENCE_PERMISSION_WITH_HISTORY}
  query GetAbsencePermission($id: ID!) {
    getAbsencePermission(id: $id) {
      ...AbsencePermissionWithHistory
    }
  }
`;

// ─── For the request form: calendar events ────────────────────────────────────

export const GET_EVENTS_FOR_PERMISSION_FORM = gql`
  query GetEventsForPermissionForm {
    getEvents {
      id
      title
      date
      place
      category
    }
  }
`;

// ─── Mutations ────────────────────────────────────────────────────────────────

export const CREATE_ABSENCE_PERMISSION_REQUEST = gql`
  ${ABSENCE_PERMISSION_CORE}
  mutation CreateAbsencePermissionRequest($input: CreateAbsencePermissionInput!) {
    createAbsencePermissionRequest(input: $input) {
      ...AbsencePermissionCore
    }
  }
`;

export const REVIEW_ABSENCE_PERMISSION_REQUEST = gql`
  ${ABSENCE_PERMISSION_WITH_HISTORY}
  mutation ReviewAbsencePermissionRequest($id: ID!, $input: ReviewAbsencePermissionInput!) {
    reviewAbsencePermissionRequest(id: $id, input: $input) {
      ...AbsencePermissionWithHistory
    }
  }
`;

export const CANCEL_ABSENCE_PERMISSION_REQUEST = gql`
  ${ABSENCE_PERMISSION_CORE}
  mutation CancelAbsencePermissionRequest($id: ID!) {
    cancelAbsencePermissionRequest(id: $id) {
      ...AbsencePermissionCore
    }
  }
`;

export const REOPEN_ABSENCE_PERMISSION_REQUEST = gql`
  ${ABSENCE_PERMISSION_CORE}
  mutation ReopenAbsencePermissionRequest($id: ID!) {
    reopenAbsencePermissionRequest(id: $id) {
      ...AbsencePermissionCore
    }
  }
`;
