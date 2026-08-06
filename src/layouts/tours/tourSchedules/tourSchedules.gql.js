import { gql } from "@apollo/client";

export const TOUR_SCHEDULE_FIELDS = gql`
  fragment TourScheduleFields on TourSchedule {
    id
    tourId
    timeZone
    status
    dateVariant
    notice
    publishedAt
    createdAt
    updatedAt
    days {
      id
      order
      date
      title
      events {
        id
        order
        startTime
        endTime
        title
        location
        audience
      }
    }
  }
`;

export const GET_TOUR_SCHEDULE = gql`
  ${TOUR_SCHEDULE_FIELDS}
  query GetTourSchedule($tourId: ID!) {
    getTourSchedule(tourId: $tourId) {
      ...TourScheduleFields
    }
  }
`;

export const MY_TOUR_SCHEDULE = gql`
  ${TOUR_SCHEDULE_FIELDS}
  query MyTourSchedule($tourId: ID!) {
    myTourSchedule(tourId: $tourId) {
      ...TourScheduleFields
    }
  }
`;

export const MY_CHILD_TOUR_SCHEDULE = gql`
  ${TOUR_SCHEDULE_FIELDS}
  query MyChildTourSchedule($tourId: ID!, $childUserId: ID!) {
    myChildTourSchedule(tourId: $tourId, childUserId: $childUserId) {
      ...TourScheduleFields
    }
  }
`;

export const SAVE_TOUR_SCHEDULE = gql`
  ${TOUR_SCHEDULE_FIELDS}
  mutation SaveTourSchedule($tourId: ID!, $input: TourScheduleInput!) {
    saveTourSchedule(tourId: $tourId, input: $input) {
      ...TourScheduleFields
    }
  }
`;
