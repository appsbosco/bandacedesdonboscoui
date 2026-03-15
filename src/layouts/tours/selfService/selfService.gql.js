import { gql } from "@apollo/client";

/**
 * selfService.gql.js
 * Operaciones GraphQL para el acceso self-service de usuarios vinculados a una gira.
 */

export const GET_MY_TOUR_PAYMENT_ACCOUNT = gql`
  query GetMyTourPaymentAccount($tourId: ID!) {
    myTourPaymentAccount(tourId: $tourId) {
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
      paymentPlan {
        id
        name
        totalAmount
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
