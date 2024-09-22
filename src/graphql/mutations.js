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

export const REQUEST_RESET_MUTATION = gql`
  mutation RequestReset($email: String!) {
    requestReset(email: $email)
  }
`;

export const RESET_PASSWORD_MUTATION = gql`
  mutation ResetPassword($token: String!, $newPassword: String!) {
    resetPassword(token: $token, newPassword: $newPassword)
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

export const UPDATE_ATTENDANCE = gql`
  mutation UpdateAttendance($updateAttendanceId: ID!, $input: AttendanceInput) {
    updateAttendance(id: $updateAttendanceId, input: $input) {
      user {
        name
      }
      id
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

export const ADD_EXALUMNO = gql`
  mutation AddExAlumno($input: ExalumnoInput!) {
    addExAlumno(input: $input) {
      id
      fullName
      phoneNumber
      identification
      instrument
      yearGraduated
      email
      address
      instrumentCondition
    }
  }
`;

export const ADD_GUATEMALA = gql`
  mutation addGuatemala($input: GuatemalaInput!) {
    addGuatemala(input: $input) {
      fullName
      phoneNumber
      identification
      instrument
      email
      comments
      children {
        id
      }
      authorized
    }
  }
`;

export const ADD_APOYO = gql`
  mutation addApoyo($input: ApoyoInput!) {
    addApoyo(input: $input) {
      fullName
      phoneNumber
      identification
      instrument
      email
      comments
      children {
        id
      }
      availability
    }
  }
`;

export const ADD_COLOR_GUARD_CAMP_REGISTRATION = gql`
  mutation Mutation($input: ColorGuardCampRegistrationInput!) {
    createColorGuardCampRegistration(input: $input) {
      id
      teamName
      instructorName
      phoneNumber
      email
      participantQuantity
    }
  }
`;

export const NEW_PERFORMANCE_ATTENDANCE = gql`
  mutation NewPerformanceAttendance($input: PerformanceAttendanceInput) {
    newPerformanceAttendance(input: $input) {
      id
      user {
        name
      }
      event {
        title
      }
      attended
      busNumber
      hotel {
        name
      }
    }
  }
`;

export const UPDATE_PERFORMANCE_ATTENDANCE = gql`
  mutation Mutation($updatePerformanceAttendanceId: ID!, $input: PerformanceAttendanceInput) {
    updatePerformanceAttendance(id: $updatePerformanceAttendanceId, input: $input) {
      user {
        name
      }
      event {
        title
      }
      busNumber
      attended
      hotel {
        name
      }
      id
    }
  }
`;

//Almuerzos
export const CREATE_PRODUCT = gql`
  mutation CreateProduct(
    $name: String!
    $description: String!
    $price: Float!
    $availableForDays: String!
    $photo: String
    $closingDate: String!
    $category: String
  ) {
    createProduct(
      name: $name
      description: $description
      price: $price
      availableForDays: $availableForDays
      photo: $photo
      closingDate: $closingDate
      category: $category
    ) {
      id
      name
      description
      price
      availableForDays
      photo
      closingDate
      createdAt
      category
    }
  }
`;

export const DELETE_PRODUCT = gql`
  mutation DeleteProduct($deleteProductId: ID!) {
    deleteProduct(id: $deleteProductId) {
      id
    }
  }
`;

export const CREATE_ORDER = gql`
  mutation CreateOrder($userId: ID!, $products: [InputOrderProduct!]!) {
    createOrder(userId: $userId, products: $products) {
      id
      userId {
        name
      }
      products {
        quantity
      }
      orderDate
    }
  }
`;

export const COMPLETE_ORDER_MUTATION = gql`
  mutation Mutation($orderId: ID!) {
    completeOrder(orderId: $orderId) {
      id
    }
  }
`;

export const UPDATE_NOTIFICATION_TOKEN = gql`
  mutation updateNotificationToken($userId: ID!, $token: String!) {
    updateNotificationToken(userId: $userId, token: $token) {
      id
      notificationTokens
    }
  }
`;

export const MARK_ATTENDANCE = gql`
  mutation MarkAttendance($studentId: ID!, $attended: Boolean!, $paymentStatus: String!) {
    markAttendance(studentId: $studentId, attended: $attended, paymentStatus: $paymentStatus) {
      id
      student {
        id
        name
      }
      attended
      paymentStatus
    }
  }
`;

export const ASSIGN_STUDENT_TO_INSTRUCTOR = gql`
  mutation assignStudentToInstructor($studentId: ID!) {
    assignStudentToInstructor(studentId: $studentId)
  }
`;

export const MARK_ATTENDANCE_AND_PAYMENT = gql`
  mutation markAttendanceAndPayment($input: AttendanceClassInput!) {
    markAttendanceAndPayment(input: $input) {
      id
      student {
        id
        name
        firstSurName
        secondSurName
      }
      date
      attendanceStatus
      justification
      paymentStatus
    }
  }
`;
