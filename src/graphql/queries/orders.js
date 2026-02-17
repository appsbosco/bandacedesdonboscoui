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
