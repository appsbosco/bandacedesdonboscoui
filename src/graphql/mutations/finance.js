import { gql } from "@apollo/client";

export const OPEN_CASH_SESSION = gql`
  mutation OpenCashSession($businessDate: String!, $openingCash: Float, $notes: String) {
    openCashSession(businessDate: $businessDate, openingCash: $openingCash, notes: $notes) {
      id
      businessDate
      status
      openedAt
      openingCash
      notes
    }
  }
`;

export const CLOSE_CASH_SESSION = gql`
  mutation CloseCashSession($input: CloseCashSessionInput!) {
    closeCashSession(input: $input) {
      id
      businessDate
      status
      closedAt
      countedCash
      difference
      expectedTotalsByMethod {
        cash
        sinpe
        card
        transfer
        other
      }
    }
  }
`;

export const RECORD_SALE = gql`
  mutation RecordSale($input: RecordSaleInput!) {
    recordSale(input: $input) {
      id
      businessDate
      paymentMethod
      source
      total
      status
      createdAt
      lineItems {
        id
        nameSnapshot
        quantity
        unitPriceSnapshot
        subtotal
      }
    }
  }
`;

export const VOID_SALE = gql`
  mutation VoidSale($saleId: ID!, $reason: String!) {
    voidSale(saleId: $saleId, reason: $reason) {
      id
      status
      voidReason
      voidedAt
    }
  }
`;

export const RECORD_EXPENSE = gql`
  mutation RecordExpense($input: RecordExpenseInput!) {
    recordExpense(input: $input) {
      id
      businessDate
      concept
      detail
      amount
      paymentMethod
      categorySnapshot
      categoryId
      isAssetPurchase
      purpose
      status
      createdAt
    }
  }
`;

export const VOID_EXPENSE = gql`
  mutation VoidExpense($expenseId: ID!, $reason: String!) {
    voidExpense(expenseId: $expenseId, reason: $reason) {
      id
      status
      voidReason
      voidedAt
    }
  }
`;

export const CREATE_CATEGORY = gql`
  mutation CreateCategory($input: CreateCategoryInput!) {
    createCategory(input: $input) {
      id
      name
      code
      isActive
    }
  }
`;

export const CREATE_ACTIVITY = gql`
  mutation CreateActivity($input: CreateActivityInput!) {
    createActivity(input: $input) {
      id
      name
      code
      isActive
    }
  }
`;

export const TOGGLE_CATEGORY_ACTIVE = gql`
  mutation ToggleCategoryActive($id: ID!) {
    toggleCategoryActive(id: $id) {
      id
      isActive
    }
  }
`;

export const TOGGLE_ACTIVITY_ACTIVE = gql`
  mutation ToggleActivityActive($id: ID!) {
    toggleActivityActive(id: $id) {
      id
      isActive
    }
  }
`;
