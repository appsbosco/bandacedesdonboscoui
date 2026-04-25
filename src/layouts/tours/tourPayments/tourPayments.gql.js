import { gql } from "@apollo/client";

// ─── Payment Plans ────────────────────────────────────────────────────────────

export const GET_PAYMENT_PLANS_BY_TOUR = gql`
  query GetPaymentPlansByTour($tourId: ID!) {
    getPaymentPlansByTour(tourId: $tourId) {
      id
      name
      currency
      totalAmount
      isDefault
      installments {
        id
        order
        dueDate
        amount
        concept
      }
      createdAt
    }
  }
`;

export const CREATE_PAYMENT_PLAN = gql`
  mutation CreatePaymentPlan($input: CreatePaymentPlanInput!) {
    createPaymentPlan(input: $input) {
      id
      name
      currency
      totalAmount
      isDefault
      installments {
        id
        order
        dueDate
        amount
        concept
      }
    }
  }
`;

export const UPDATE_PAYMENT_PLAN = gql`
  mutation UpdatePaymentPlan($id: ID!, $input: UpdatePaymentPlanInput!) {
    updatePaymentPlan(id: $id, input: $input) {
      id
      name
      currency
      totalAmount
      isDefault
      installments {
        id
        order
        dueDate
        amount
        concept
      }
    }
  }
`;

export const DELETE_PAYMENT_PLAN = gql`
  mutation DeletePaymentPlan($id: ID!) {
    deletePaymentPlan(id: $id)
  }
`;

// ─── Financial Accounts ───────────────────────────────────────────────────────

export const GET_FINANCIAL_ACCOUNTS_BY_TOUR = gql`
  query GetFinancialAccountsByTour($tourId: ID!, $filter: FinancialAccountsFilter) {
    getFinancialAccountsByTour(tourId: $tourId, filter: $filter) {
      id
      currency
      baseAmount
      discount
      scholarship
      finalAmount
      totalPaid
      balance
      overpayment
      financialStatus
      adjustments {
        id
        concept
        amount
        appliedAt
        notes
      }
      participant {
        id
        firstName
        firstSurname
        secondSurname
        identification
        instrument
        email
      }
      paymentPlan {
        id
        name
      }
      updatedAt
    }
  }
`;

export const GET_FINANCIAL_ACCOUNT = gql`
  query GetFinancialAccount($participantId: ID!, $tourId: ID!) {
    getFinancialAccount(participantId: $participantId, tourId: $tourId) {
      id
      currency
      baseAmount
      discount
      scholarship
      finalAmount
      totalPaid
      balance
      overpayment
      financialStatus
      adjustments {
        id
        concept
        amount
        appliedAt
        notes
      }
      participant {
        id
        firstName
        firstSurname
        secondSurname
        identification
        instrument
      }
      paymentPlan {
        id
        name
      }
    }
  }
`;

export const CREATE_FINANCIAL_ACCOUNT = gql`
  mutation CreateFinancialAccount($input: CreateFinancialAccountInput!) {
    createFinancialAccount(input: $input) {
      id
      finalAmount
      financialStatus
    }
  }
`;

export const UPDATE_FINANCIAL_ACCOUNT = gql`
  mutation UpdateFinancialAccount($id: ID!, $input: UpdateFinancialAccountInput!) {
    updateFinancialAccount(id: $id, input: $input) {
      id
      baseAmount
      discount
      scholarship
      finalAmount
      totalPaid
      balance
      financialStatus
      adjustments {
        id
        concept
        amount
        appliedAt
        notes
      }
    }
  }
`;

export const CREATE_FINANCIAL_ACCOUNTS_FOR_ALL = gql`
  mutation CreateFinancialAccountsForAll($tourId: ID!, $baseAmount: Float!, $planId: ID) {
    createFinancialAccountsForAll(tourId: $tourId, baseAmount: $baseAmount, planId: $planId) {
      total
      created
      skipped
      errors {
        participantId
        name
        error
      }
    }
  }
`;

// ─── Installments ─────────────────────────────────────────────────────────────

export const GET_INSTALLMENTS_BY_PARTICIPANT = gql`
  query GetInstallmentsByParticipant($participantId: ID!, $tourId: ID) {
    getInstallmentsByParticipant(participantId: $participantId, tourId: $tourId) {
      id
      order
      dueDate
      amount
      concept
      paidAmount
      remainingAmount
      status
      paidAt
    }
  }
`;

export const ASSIGN_PAYMENT_PLAN = gql`
  mutation AssignPaymentPlan($participantId: ID!, $tourId: ID!, $planId: ID!) {
    assignPaymentPlan(participantId: $participantId, tourId: $tourId, planId: $planId) {
      id
      order
      dueDate
      amount
      concept
      paidAmount
      remainingAmount
      status
    }
  }
`;

export const ASSIGN_DEFAULT_PLAN_TO_ALL = gql`
  mutation AssignDefaultPlanToAll($tourId: ID!) {
    assignDefaultPlanToAll(tourId: $tourId) {
      assigned
      skipped
      total
    }
  }
`;

export const UPDATE_INSTALLMENT = gql`
  mutation UpdateInstallment($id: ID!, $input: UpdateInstallmentInput!) {
    updateInstallment(id: $id, input: $input) {
      id
      order
      dueDate
      amount
      concept
      paidAmount
      remainingAmount
      status
    }
  }
`;

// ─── Payments ─────────────────────────────────────────────────────────────────

export const GET_TOUR_PAYMENTS = gql`
  query GetTourPayments($tourId: ID!) {
    getTourPayments(tourId: $tourId) {
      id
      amount
      paymentDate
      method
      reference
      notes
      unappliedAmount
      createdAt
      participant {
        id
        firstName
        firstSurname
        secondSurname
        identification
        instrument
      }
      appliedTo {
        installment {
          id
          order
          concept
          dueDate
        }
        amountApplied
      }
      registeredBy {
        name
        firstSurName
      }
    }
  }
`;

export const GET_PAYMENTS_BY_PARTICIPANT = gql`
  query GetPaymentsByParticipant($participantId: ID!, $tourId: ID) {
    getPaymentsByParticipant(participantId: $participantId, tourId: $tourId) {
      id
      amount
      paymentDate
      method
      reference
      notes
      unappliedAmount
      appliedTo {
        installment {
          id
          order
          concept
        }
        amountApplied
      }
      registeredBy {
        name
        firstSurName
      }
      createdAt
    }
  }
`;

export const REGISTER_PAYMENT = gql`
  mutation RegisterPayment($input: RegisterPaymentInput!) {
    registerPayment(input: $input) {
      id
      amount
      paymentDate
      method
      unappliedAmount
      appliedTo {
        installment {
          id
          concept
          order
        }
        amountApplied
      }
      participant {
        id
        firstName
        firstSurname
      }
    }
  }
`;

export const DELETE_PAYMENT = gql`
  mutation DeleteTourPayment($id: ID!) {
    deleteTourPayment(id: $id)
  }
`;

// ─── Reports ──────────────────────────────────────────────────────────────────

export const GET_FINANCIAL_TABLE = gql`
  query GetFinancialTable($tourId: ID!) {
    getFinancialTable(tourId: $tourId) {
      tourId
      tourName
      columns {
        order
        dueDate
        concept
        amount
      }
      rows {
        accountId
        participantId
        hasFinancialAccount
        fullName
        identification
        instrument
        visaStatus
        visaDeniedCount
        linkedUserName
        linkedUserEmail
        isRemoved
        removedAt
        removedByName
        removalHadPayments
        finalAmount
        totalPaid
        balance
        overpayment
        financialStatus
        installments {
          installmentId
          order
          dueDate
          concept
          amount
          paidAmount
          remainingAmount
          status
        }
      }
    }
  }
`;

export const GET_FINANCIAL_SUMMARY = gql`
  query GetFinancialSummary($tourId: ID!) {
    getFinancialSummary(tourId: $tourId) {
      tourId
      tourName
      totalParticipants
      totalAssigned
      totalCollected
      totalBalance
      byStatus {
        PENDING
        UP_TO_DATE
        LATE
        PARTIAL
        PAID
        OVERPAID
      }
    }
  }
`;

export const GET_PAYMENT_FLOW = gql`
  query GetPaymentFlow($tourId: ID!) {
    getPaymentFlow(tourId: $tourId) {
      date
      totalAmount
      count
      cumulative
    }
  }
`;

export const GET_PARTICIPANTS_BY_FINANCIAL_STATUS = gql`
  query GetParticipantsByFinancialStatus($tourId: ID!, $status: FinancialStatus) {
    getParticipantsByFinancialStatus(tourId: $tourId, status: $status) {
      id
      finalAmount
      totalPaid
      balance
      financialStatus
      participant {
        id
        firstName
        firstSurname
        identification
        instrument
      }
    }
  }
`;
