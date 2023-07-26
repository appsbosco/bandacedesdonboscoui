import { gql } from "@apollo/client";

export const GET_USERS_BY_ID = gql`
  query getUser {
    getUser {
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
      instrument
      avatar
    }
  }
`;

export const GET_PARENTS_BY_ID = gql`
  query GetParents {
    getParent {
      avatar
      email
      firstSurName
      id
      name
      password
      phone
      role
      secondSurName
      children {
        name
        firstSurName
        secondSurName
        email
        phone
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
      instrument
      avatar
    }
  }
`;
export const GET_PARENTS = gql`
  query GetParents {
    getParents {
      phone
      role
      secondSurName
      name
      id
      firstSurName
      email
      children {
        name
        firstSurName
        secondSurName
        email
        carnet
        birthday
        bands
        avatar
        grade
        id
        instrument
        phone
        role
        state
      }
    }
  }
`;

// Events
export const GET_EVENTS = gql`
  query getEvents {
    getEvents {
      id
      title
      place
      date
      time
      arrival
      departure
      description
    }
  }
`;

// Inventories
export const GET_ALL_INVENTORIES = gql`
  query GetAllInventories {
    getInventories {
      id
      condition
      brand
      model
      numberId
      serie
      mainteinance
      details
      user {
        id
        name
        firstSurName
        secondSurName
        instrument
      }
    }
  }
`;

export const GET_INVENTORY_BY_USER = gql`
  query getInventoryByUser {
    getInventoryByUser {
      id
      condition
      brand
      model
      numberId
      serie
      mainteinance
      details
    }
  }
`;

// Medical Records
export const GET_MEDICAL_RECORD_BY_USER = gql`
  query getMedicalRecordByUser {
    getMedicalRecordByUser {
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
    }
  }
`;

// Attendance

export const GET_ALL_ATTENDANCE = gql`
  query GetAllAttendance {
    getAllAttendance {
      attended
      date
      id
      user {
        name
        firstSurName
        secondSurName
        instrument
      }
    }
  }
`;

// Payments

// Query: Get Payment Events
export const GET_PAYMENT_EVENTS = gql`
  query GetPaymentEvents {
    getPaymentEvents {
      date
      description
      name
      _id
    }
  }
`;

// Query: Get Payments By Event
export const GET_PAYMENTS_BY_EVENT = gql`
  query GetPaymentsByEvent($paymentEvent: ID!) {
    getPaymentsByEvent(paymentEvent: $paymentEvent) {
      _id
      amount
      description
      date
      paymentEvent {
        name
        description
        date
      }
      user {
        name
        firstSurName
        secondSurName
        instrument
        role
      }
    }
  }
`;
