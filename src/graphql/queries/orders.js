// ===========================
// OPTIMIZED GRAPHQL QUERIES
// ===========================

import { gql } from "@apollo/client";

// ====== PRODUCTS ======
export const GET_PRODUCTS_OPTIMIZED = gql`
  query GetProducts {
    products {
      id
      name
      price
      description
      category
      photo
      closingDate
      availableForDays
    }
  }
`;

// ====== ORDERS ======
export const GET_ORDERS_BY_USER_OPTIMIZED = gql`
  query GetOrdersByUser($userId: ID) {
    orderByUserId(userId: $userId) {
      id
      orderDate
      isCompleted
      products {
        quantity
        productId {
          id
          name
          price
        }
      }
    }
  }
`;

export const GET_ORDERS = gql`
  query GetOrders {
    orders {
      id
      orderDate
      fulfillmentDate
      isCompleted
      userId {
        id
        name
        firstSurName
        secondSurName
      }
      products {
        id
        productId {
          id
          name
          price
        }
        quantity
        quantityPickedUp
        status
        pickedUpAt
      }
    }
  }
`;

export const REPORT_DAILY_SUMMARY = gql`
  query ReportDailySummary($startDate: String!, $endDate: String!) {
    reportDailySummary(startDate: $startDate, endDate: $endDate) {
      date
      totalOrders
      totalItems
      totalUnits
      pendingUnits
      pickedUpUnits
    }
  }
`;

export const REPORT_PRODUCT_RANGE = gql`
  query ReportProductRange($startDate: String!, $endDate: String!) {
    reportProductRange(startDate: $startDate, endDate: $endDate) {
      productId
      name
      totalOrdered
      totalPickedUp
      totalPending
    }
  }
`;

export const REPORT_DAY_BREAKDOWN = gql`
  query ReportDayBreakdown($startDate: String!, $endDate: String!) {
    reportDayBreakdown(startDate: $startDate, endDate: $endDate) {
      date
      products {
        productId
        name
        totalOrdered
        totalPickedUp
        totalPending
      }
    }
  }
`;
