// ===========================
// OPTIMIZED GRAPHQL QUERIES
// ===========================

import { gql } from "@apollo/client";

// ====== MUTATIONS ======
export const CREATE_ORDER_OPTIMIZED = gql`
  mutation CreateOrder($userId: ID!, $products: [InputOrderProduct!]!) {
    createOrder(userId: $userId, products: $products) {
      id
      orderDate
      isCompleted
      products {
        id
        quantity
        quantityPickedUp
        status
        fulfillmentDate
        productId {
          id
          name
          price
          category
          photo
          availableForDays
        }
      }
    }
  }
`;

export const DELETE_PRODUCT_OPTIMIZED = gql`
  mutation DeleteProduct($deleteProductId: ID!) {
    deleteProduct(id: $deleteProductId) {
      id
    }
  }
`;

// ====== CACHE UPDATE HELPERS ======

/**
 * Update cache after creating order - avoid refetchQueries
 */
export const updateCacheAfterCreateOrder = (cache, { data: { createOrder } }, userId) => {
  try {
    // Read existing orders from cache
    const existingData = cache.readQuery({
      query: GET_ORDERS_BY_USER_OPTIMIZED,
      variables: { userId },
    });

    if (existingData) {
      // Write new order to cache
      cache.writeQuery({
        query: GET_ORDERS_BY_USER_OPTIMIZED,
        variables: { userId },
        data: {
          orderByUserId: [createOrder, ...existingData.orderByUserId],
        },
      });
    }
  } catch (e) {
    // If cache doesn't exist, it will refetch naturally
    console.warn("Cache update failed, will refetch:", e);
  }
};

/**
 * Update cache after deleting product - avoid refetchQueries
 */
export const updateCacheAfterDeleteProduct = (cache, { data: { deleteProduct } }) => {
  try {
    const existingData = cache.readQuery({
      query: GET_PRODUCTS_OPTIMIZED,
    });

    if (existingData) {
      cache.writeQuery({
        query: GET_PRODUCTS_OPTIMIZED,
        data: {
          products: existingData.products.filter((p) => p.id !== deleteProduct.id),
        },
      });
    }
  } catch (e) {
    console.warn("Cache update failed:", e);
  }
};

export const RECORD_PICKUP_MUTATION = gql`
  mutation RecordPickup(
    $orderId: ID!
    $itemId: ID!
    $quantityPickedUp: Int!
    $pickedUpAt: String
    $lunchDay: String!
    $paymentMethod: String!
  ) {
    recordPickup(
      orderId: $orderId
      itemId: $itemId
      quantityPickedUp: $quantityPickedUp
      pickedUpAt: $pickedUpAt
      lunchDay: $lunchDay
      paymentMethod: $paymentMethod
    ) {
      id
      isCompleted
      products {
        id
        productId {
          id
          name
          price
          category
          availableForDays
        }
        quantity
        quantityPickedUp
        status
        pickedUpAt
        fulfillmentDate
        pickupRecords {
          quantity
          paymentMethod
          unitPrice
          pickedUpAt
        }
      }
    }
  }
`;

export const COMPLETE_ORDER_MUTATION = gql`
  mutation CompleteOrder($orderId: ID!, $lunchDay: String!, $paymentMethod: String!) {
    completeOrder(orderId: $orderId, lunchDay: $lunchDay, paymentMethod: $paymentMethod) {
      id
      isCompleted
      products {
        id
        productId {
          id
          name
          price
          category
          availableForDays
        }
        quantity
        quantityPickedUp
        status
        pickedUpAt
        fulfillmentDate
        pickupRecords {
          quantity
          paymentMethod
          unitPrice
          pickedUpAt
        }
      }
    }
  }
`;
