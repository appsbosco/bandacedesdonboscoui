import { gql } from "@apollo/client";

// Sign Up

export const NEW_ACCOUNT = gql`
  mutation newUser($input: UserInput) {
    newUser(input: $input) {
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
      bands
    }
  }
`;

export const NEW_PARENT = gql`
  mutation NewParent($input: ParentInput) {
    newParent(input: $input) {
      avatar
      children {
        id
      }
      email
      firstSurName
      name
      password
      phone
      role
      secondSurName
    }
  }
`;

export const UPDATE_USER = gql`
  mutation UpdateUser($updateUserId: ID!, $input: UserInput) {
    updateUser(id: $updateUserId, input: $input) {
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

// Users
export const DELETE_USER = gql`
  mutation DeleteUser($deleteUserId: ID!) {
    deleteUser(id: $deleteUserId)
  }
`;

// Profile Picture

export const UPLOAD_PROFILE_PIC = gql`
  mutation UploadProfilePic($id: ID!, $avatar: String!) {
    uploadProfilePic(id: $id, avatar: $avatar) {
      id
      avatar
    }
  }
`;

//AUTH
export const AUTH_USER = gql`
  mutation authUser($input: AuthInput) {
    authUser(input: $input) {
      token
    }
  }
`;

// Events
export const ADD_EVENT = gql`
  mutation newEvent($input: EventInput!) {
    newEvent(input: $input) {
      id
      title
      place
      date
      time
      arrival
      departure
      description
      type
    }
  }
`;

export const UPDATE_EVENT = gql`
  mutation updateEvent($id: ID!, $input: EventInput!) {
    updateEvent(id: $id, input: $input) {
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

export const DELETE_EVENT = gql`
  mutation deleteEvent($id: ID!) {
    deleteEvent(id: $id)
  }
`;

// Email
export const SEND_EMAIL = gql`
  mutation SendEmail($input: EmailInput!) {
    sendEmail(input: $input)
  }
`;

// Medical Record
export const CREATE_MEDICAL_RECORD = gql`
  mutation CreateMedicalRecord($input: MedicalRecordInput!) {
    newMedicalRecord(input: $input) {
      address
      bloodType
      familyMemberName
      familyMemberNumber
      familyMemberNumberId
      familyMemberRelationship
      familyMemberOccupation
      sex
      identification
      illness
      medicine
      medicineOnTour
      allergies
    }
  }
`;

export const UPDATE_MEDICAL_RECORD = gql`
  mutation UpdateMedicalRecord($id: ID!, $input: MedicalRecordInput!) {
    updateMedicalRecord(id: $id, input: $input) {
      id
      address
      bloodType
      familyMemberName
      familyMemberNumber
      familyMemberRelationship
      familyMemberOccupation
      familyMemberNumberId
      sex
      identification
      illness
      medicine
      medicineOnTour
      allergies
    }
  }
`;

export const DELETE_MEDICAL_RECORD = gql`
  mutation DeleteMedicalRecord($deleteMedicalRecordId: ID!) {
    deleteMedicalRecord(id: $deleteMedicalRecordId)
  }
`;
// Inventories
export const CREATE_INVENTORY = gql`
  mutation CreateInventory($input: InventoryInput!) {
    newInventory(input: $input) {
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

export const UPDATE_INVENTORY = gql`
  mutation UpdateInventory($id: ID!, $input: InventoryInput!) {
    updateInventory(id: $id, input: $input) {
      brand
      model
      numberId
      serie
      condition
      mainteinance
      details
    }
  }
`;

// Attendance
export const ADD_ATTENDANCE = gql`
  mutation ($input: AttendanceInput!) {
    newAttendance(input: $input) {
      id
      user {
        id
        name
        firstSurName
        secondSurName
        instrument
        role
      }
      date
      attended
    }
  }
`;

// Payments

// Mutation: Create Payment Event
export const CREATE_PAYMENT_EVENT = gql`
  mutation CreatePaymentEvent($input: PaymentEventInput!) {
    createPaymentEvent(input: $input) {
      _id
      name
      date
      description
    }
  }
`;

// Mutation: Create Payment
export const CREATE_PAYMENT = gql`
  mutation CreatePayment($input: PaymentInput!) {
    createPayment(input: $input) {
      _id
      user {
        name
        firstSurName
      }
      paymentEvent {
        _id
        name
      }
      description
      amount
      date
    }
  }
`;

// Mutation: Update Payment
export const UPDATE_PAYMENT = gql`
  mutation UpdatePayment($paymentId: ID!, $input: PaymentInput!) {
    updatePayment(paymentId: $paymentId, input: $input) {
      _id
      amount
      description
      date
      paymentEvent {
        name
        description
      }
      user {
        name
      }
    }
  }
`;

export const DELETE_PAYMENT = gql`
  mutation DeletePayment($paymentId: ID!) {
    deletePayment(paymentId: $paymentId) {
      _id
      paymentEvent {
        _id
      }
    }
  }
`;
