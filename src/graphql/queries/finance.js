import { gql } from "@apollo/client";

export const GET_CATEGORIES = gql`
  query GetCategories($onlyActive: Boolean) {
    categories(onlyActive: $onlyActive) {
      id
      name
      code
      isActive
    }
  }
`;

export const GET_ACTIVITIES = gql`
  query GetActivities($onlyActive: Boolean) {
    activities(onlyActive: $onlyActive) {
      id
      name
      code
      isActive
    }
  }
`;

export const GET_CASH_SESSION_DETAIL = gql`
  query CashSessionDetail($businessDate: String, $cashSessionId: ID) {
    cashSessionDetail(businessDate: $businessDate, cashSessionId: $cashSessionId) {
      id
      businessDate
      status
      openedAt
      closedAt
      openingCash
      countedCash
      difference
      notes
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

export const GET_SALES_BY_DATE = gql`
  query SalesByDate($businessDate: String!) {
    salesByDate(businessDate: $businessDate) {
      id
      businessDate
      paymentMethod
      source
      total
      status
      activityId
      voidReason
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

export const GET_EXPENSES_BY_DATE = gql`
  query ExpensesByDate($businessDate: String!) {
    expensesByDate(businessDate: $businessDate) {
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
      vendor
      status
      voidReason
      createdAt
    }
  }
`;

export const GET_DAILY_SUMMARY = gql`
  query DailySummary($businessDate: String!) {
    dailySummary(businessDate: $businessDate) {
      businessDate
      totalSales
      totalExpenses
      net
      session {
        id
        status
        openingCash
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
      salesByMethod {
        method
        total
        count
      }
      expensesByMethod {
        method
        total
        count
      }
      productSales {
        productId
        name
        totalUnits
        totalRevenue
      }
      expensesByCategory {
        categoryId
        categorySnapshot
        totalAmount
        count
      }
    }
  }
`;

export const GET_RANGE_SUMMARY = gql`
  query RangeSummary($dateFrom: String!, $dateTo: String!) {
    rangeSummary(dateFrom: $dateFrom, dateTo: $dateTo) {
      dateFrom
      dateTo
      totalSales
      totalExpenses
      net
      salesByMethod {
        method
        total
        count
      }
      expensesByMethod {
        method
        total
        count
      }
      productSales {
        productId
        name
        totalUnits
        totalRevenue
      }
      expensesByCategory {
        categoryId
        categorySnapshot
        totalAmount
        count
      }
      activitiesSummary {
        activityId
        name
        totalSales
        totalExpenses
        net
      }
    }
  }
`;

export const GET_MONTHLY_DATASET = gql`
  query MonthlyReportDataset($month: Int!, $year: Int!) {
    monthlyReportDataset(month: $month, year: $year) {
      month
      year
      generatedAt
      summary {
        totalSales
        totalExpenses
        net
        salesByMethod {
          method
          total
          count
        }
        expensesByMethod {
          method
          total
          count
        }
        productSales {
          name
          totalUnits
          totalRevenue
        }
        expensesByCategory {
          categorySnapshot
          totalAmount
          count
        }
        activitiesSummary {
          name
          totalSales
          totalExpenses
          net
        }
      }
      dailyBreakdown {
        businessDate
        totalSales
        totalExpenses
        net
        salesByMethod {
          method
          total
          count
        }
        expensesByCategory {
          categorySnapshot
          totalAmount
          count
        }
      }
      assetPurchases {
        id
        businessDate
        concept
        amount
        purpose
        vendor
      }
    }
  }
`;
