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
      notificationTokens
      students {
        id
        name
        firstSurName
        secondSurName
      }
    }
  }
`;

export const GET_PARENTS_BY_ID = gql`
  query GetParents {
    getParent {
      id
      name
      firstSurName
      secondSurName
      email
      password
      phone
      role
      avatar
      children {
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
        bands
        attendance {
          id
          date
          attended
        }
        medicalRecord {
          id
          identification
          sex
          bloodType
        }
        inventory {
          id
          brand
          model
          numberId
          serie
          condition
          mainteinance
          details
        }
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

export const GET_USERS_AND_BANDS = gql`
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
      bands
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
      type
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
        id
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

// Query: Get Exalumnos
export const GET_EXALUMNOS = gql`
  query GetExAlumnos {
    getExAlumnos {
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

export const GET_GUATEMALA = gql`
  query GetGuatemala {
    getGuatemala {
      id
      fullName
      phoneNumber
      identification
      instrument
      email
      authorized
      comments
      children {
        id
        name
        firstSurName
        secondSurName
      }
    }
  }
`;

export const GET_APOYO = gql`
  query GetApoyo {
    getApoyo {
      id
      fullName
      phoneNumber
      identification
      instrument
      email
      comments
      availability
      children {
        id
        name
        firstSurName
        secondSurName
      }
    }
  }
`;

export const GET_COLOR_GUARD_CAMP_REGISTRATION = gql`
  query Query {
    getColorGuardCampRegistrations {
      id
      teamName
      instructorName
      phoneNumber
      email
      participantQuantity
    }
  }
`;

export const GET_PERFORMANCE_ATTENDANCE = gql`
  query GetPerformanceAttendanceByEvent($event: ID!) {
    getPerformanceAttendanceByEvent(event: $event) {
      id
      user {
        name
        firstSurName
        secondSurName
        instrument
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

export const GET_HOTELS = gql`
  query GetHotels {
    getHotels {
      id
      name
    }
  }
`;

export const GET_PRODUCTS = gql`
  query Products {
    products {
      id
      name
      description
      category
      price
      availableForDays
      photo
      closingDate
      createdAt
    }
  }
`;

export const GET_ORDERS = gql`
  query Query {
    orders {
      id
      userId {
        name
        firstSurName
        secondSurName
      }
      products {
        productId {
          id
          name
          price
        }
        quantity
      }
      orderDate
      isCompleted
    }
  }
`;

export const GET_ORDERS_BY_USER = gql`
  query OrderByUserId($userId: ID) {
    orderByUserId(userId: $userId) {
      orderDate
      userId {
        name
        secondSurName
        firstSurName
      }
      products {
        productId {
          name
        }
        quantity
      }
    }
  }
`;

export const GET_TICKETS = gql`
  query GetTickets($eventId: ID) {
    getTickets(eventId: $eventId) {
      id
      userId {
        name
        firstSurName
        secondSurName
        email
      }
      eventId
      type
      paid
      amountPaid
      ticketQuantity
      qrCode
      scanned
      scans
      buyerName
      buyerEmail
      raffleNumbers
    }
  }
`;

export const ASSIGN_TICKETS = gql`
  mutation AssignTickets($input: AssignTicketsInput!) {
    assignTickets(input: $input) {
      id
      userId {
        name
        firstSurName
        secondSurName
        email
      }
      eventId
      type
      ticketQuantity
      qrCode
    }
  }
`;

export const GET_STUDENTS_BY_INSTRUCTOR = gql`
  query GetStudentsByInstructor($instrument: String!) {
    getStudentsByInstructor(instrument: $instrument) {
      id
      name
    }
  }
`;

export const GET_ATTENDANCE_BY_STUDENT = gql`
  query GetAttendanceByStudent($studentId: ID!) {
    getAttendanceByStudent(studentId: $studentId) {
      id
      date
      attended
      paymentStatus
    }
  }
`;

export const GET_STUDENTS_BY_INSTRUMENT = gql`
  query Query {
    getUsers {
      id
      name
      instrument
      firstSurName
      secondSurName
    }
  }
`;

export const GET_ATTENDANCE_FOR_TODAY = gql`
  query GetAttendanceForToday {
    getAttendanceForToday {
      id
      student {
        id
        name
        firstSurName
        secondSurName
      }
      attended
      paymentStatus
    }
  }
`;

export const GET_USERS_BY_INSTRUMENT = gql`
  query getUsersByInstrument {
    getUsersByInstrument {
      id
      name
      firstSurName
      secondSurName
      instrument
      role
    }
  }
`;

export const GET_INSTRUCTOR_STUDENTS_ATTENDANCE = gql`
  query getInstructorStudentsAttendance($date: String!) {
    getInstructorStudentsAttendance(date: $date) {
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

export const GET_ACTIVE_SESSION = gql`
  query GetActiveSession($date: String!, $section: Section!) {
    getActiveSession(date: $date, section: $section) {
      id
      date
      dateNormalized
      section
      status
      takenBy {
        id
        name
        firstSurName
        secondSurName
      }
      takenAt
      closedAt
      attendanceCount
      attendances {
        id
        user {
          id
          name
          firstSurName
          secondSurName
          instrument
        }
        status
        notes
      }
    }
  }
`;

export const GET_USERS_BY_SECTION = gql`
  query GetUsersBySection($section: Section!) {
    getUsers {
      id
      name
      firstSurName
      secondSurName
      email
      instrument
      role
    }
  }
`;

export const GET_ALL_ATTENDANCES_REHEARSAL = gql`
  query GetAllAttendancesRehearsal($limit: Int, $offset: Int, $filter: AttendanceFilterInput) {
    getAllAttendancesRehearsal(limit: $limit, offset: $offset, filter: $filter) {
      id
      user {
        id
        name
        firstSurName
        secondSurName
        instrument
      }
      session {
        id
        date
        section
        dateNormalized
        takenBy {
          id
          name
          firstSurName
        }
      }
      status
      notes
      createdAt
      legacyDate
      legacyAttended
    }
  }
`;
export const GET_USER_ATTENDANCE_STATS = gql`
  query GetUserAttendanceStats($userId: ID!, $startDate: String, $endDate: String) {
    getUserAttendanceStats(userId: $userId, startDate: $startDate, endDate: $endDate) {
      userId
      totalSessions
      present
      absentUnjustified
      absentJustified
      late
      excusedBefore
      excusedAfter
      equivalentAbsences
      attendancePercentage
      exceedsLimit
    }
  }
`;
