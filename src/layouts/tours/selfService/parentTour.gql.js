import { gql } from "@apollo/client";

/**
 * Queries para el acceso self-service de padres de familia.
 * El actor es un Parent, no un User.
 */

// Todos los hijos del padre que son participantes de la gira
export const GET_MY_CHILDREN_TOUR_ACCESS = gql`
  query GetMyChildrenTourAccess($tourId: ID!) {
    myChildrenTourAccess(tourId: $tourId) {
      id
      firstName
      firstSurname
      secondSurname
      identification
      passportNumber
      passportExpiry
      hasVisa
      visaExpiry
      hasExitPermit
      role
      status
      linkedUser {
        id
      }
    }
  }
`;

// Cuenta financiera de un hijo específico
export const GET_MY_CHILD_TOUR_PAYMENT_ACCOUNT = gql`
  query GetMyChildTourPaymentAccount($tourId: ID!, $childUserId: ID!) {
    myChildTourPaymentAccount(tourId: $tourId, childUserId: $childUserId) {
      id
      currency
      finalAmount
      totalPaid
      balance
      overpayment
      financialStatus
      paymentPlan {
        id
        name
        installments {
          id
          order
          dueDate
          amount
          concept
        }
      }
    }
  }
`;
