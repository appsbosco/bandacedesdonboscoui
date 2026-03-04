import { gql } from "@apollo/client";

// ─── Fragments ────────────────────────────────────────────────────────────────

const COMMITTEE_FIELDS = gql`
  fragment CommitteeFields on Committee {
    id
    name
    slug
    distributionPercentage
    description
    isActive
    displayOrder
  }
`;

const DISTRIBUTION_SNAPSHOT_FIELDS = gql`
  fragment DistributionSnapshotFields on DistributionSnapshot {
    committeeId
    committeeName
    committeeSlug
    percentage
    amount
    ledgerEntryId
  }
`;

const COMMITTEE_BUDGET_SUMMARY_FIELDS = gql`
  fragment CommitteeBudgetSummaryFields on CommitteeBudgetSummary {
    committee {
      ...CommitteeFields
    }
    initialAllocation
    utilityDistributions
    manualCredits
    totalCredits
    expenseDebits
    manualDebits
    totalDebits
    currentBalance
    entryCount
    distributionPercentage
  }
  ${COMMITTEE_FIELDS}
`;

// ─── Catálogos ────────────────────────────────────────────────────────────────

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

export const GET_CASH_BOXES = gql`
  query GetCashBoxes($onlyActive: Boolean) {
    cashBoxes(onlyActive: $onlyActive) {
      id
      name
      code
      description
      isActive
      isDefault
    }
  }
`;

// ─── Sesiones de caja ─────────────────────────────────────────────────────────

export const GET_CASH_SESSION_DETAIL = gql`
  query GetCashSessionDetail($businessDate: String, $cashSessionId: ID) {
    cashSessionDetail(businessDate: $businessDate, cashSessionId: $cashSessionId) {
      id
      businessDate
      cashBoxId
      cashBoxSnapshot
      status
      openedAt
      closedAt
      openingCash
      difference
      countedCash
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

export const GET_CASH_SESSIONS_BY_DATE = gql`
  query GetCashSessionsByDate($businessDate: String!) {
    cashSessionsByDate(businessDate: $businessDate) {
      id
      businessDate
      cashBoxId
      cashBoxSnapshot
      status
      openedAt
      closedAt
      openingCash
      countedCash
      difference
    }
  }
`;

// ─── Ventas / Egresos ─────────────────────────────────────────────────────────

export const GET_SALES_BY_DATE = gql`
  query SalesByDate($businessDate: String!) {
    salesByDate(businessDate: $businessDate) {
      id
      businessDate
      paymentMethod
      source
      total
      status
      scope
      cashSessionId
      activityId
      donationType
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
      expenseType
      categorySnapshot
      categoryId
      isAssetPurchase
      purpose
      vendor
      scope
      cashSessionId
      activityId
      status
      voidReason
      createdAt
    }
  }
`;

// ─── Reportes principales ─────────────────────────────────────────────────────

/**
 * GET_DAILY_SUMMARY
 * NOTA: El campo `session` del schema v1 NO existe en el backend v2.
 * Se usa cashBoxBreakdown para obtener info de sesiones.
 */
export const GET_DAILY_SUMMARY = gql`
  query DailySummary($businessDate: String!) {
    dailySummary(businessDate: $businessDate) {
      businessDate
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
      cashBoxBreakdown {
        cashBoxId
        cashBoxName
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
        sessionSales
        sessionExpenses
        sessionNet
        sessionByMethod {
          method
          total
          count
        }
      }
      breakdown {
        sessionSales
        sessionExpenses
        sessionNet
        externalSales
        externalExpenses
        externalNet
      }
      donations {
        monetary
        inKindEstimated
        count
      }
      bankSummary {
        accountId
        accountName
        credits
        debits
        closingBalance
      }
      assetPurchases {
        id
        businessDate
        concept
        amount
        purpose
        vendor
      }
      inventoryConsumption {
        itemId
        itemName
        totalQuantity
        totalCost
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
        inventoryCostConsumed
        totalDonations
        net
      }
      donations {
        monetary
        inKindEstimated
        count
      }
      inventoryConsumption {
        itemId
        itemName
        totalQuantity
        totalCost
      }
      totalAssetPurchases
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
          inventoryCostConsumed
          net
        }
        donations {
          monetary
          inKindEstimated
        }
        totalAssetPurchases
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
      bankMovements {
        id
        businessDate
        accountId
        type
        direction
        amount
        concept
      }
    }
  }
`;

// ─── Comités ──────────────────────────────────────────────────────────────────

export const GET_COMMITTEES = gql`
  query GetCommittees($onlyActive: Boolean) {
    committees(onlyActive: $onlyActive) {
      ...CommitteeFields
    }
  }
  ${COMMITTEE_FIELDS}
`;

export const GET_COMMITTEE_DISTRIBUTION_CONFIG = gql`
  query GetCommitteeDistributionConfig {
    committeeDistributionConfig {
      committees {
        ...CommitteeFields
      }
      totalPercentage
      isValid
    }
  }
  ${COMMITTEE_FIELDS}
`;

export const GET_ALL_COMMITTEE_BUDGETS = gql`
  query GetAllCommitteeBudgets {
    allCommitteeBudgets {
      committees {
        ...CommitteeBudgetSummaryFields
      }
      totalBudget
      totalExpended
      totalAvailable
      isInitialized
      initialization {
        id
        totalAmount
        businessDate
        description
        status
        createdAt
        distributionSnapshot {
          ...DistributionSnapshotFields
        }
      }
    }
  }
  ${COMMITTEE_BUDGET_SUMMARY_FIELDS}
  ${DISTRIBUTION_SNAPSHOT_FIELDS}
`;

export const GET_COMMITTEE_BUDGET_SUMMARY = gql`
  query GetCommitteeBudgetSummary($committeeId: ID!) {
    committeeBudgetSummary(committeeId: $committeeId) {
      ...CommitteeBudgetSummaryFields
    }
  }
  ${COMMITTEE_BUDGET_SUMMARY_FIELDS}
`;

/**
 * GET_COMMITTEE_LEDGER
 * NOTA: No acepta limit/offset — devuelve todas las entradas filtradas.
 */
export const GET_COMMITTEE_LEDGER = gql`
  query GetCommitteeLedger(
    $committeeId: ID!
    $dateFrom: String
    $dateTo: String
    $entryType: CommitteeLedgerEntryType
  ) {
    committeeLedger(
      committeeId: $committeeId
      dateFrom: $dateFrom
      dateTo: $dateTo
      entryType: $entryType
    ) {
      committee {
        ...CommitteeFields
      }
      entries {
        id
        entryType
        businessDate
        creditAmount
        debitAmount
        runningBalance
        percentageSnapshot
        description
        notes
        status
        voidReason
        activityId
        expenseId
        activitySettlementId
        budgetInitializationId
        createdAt
      }
      currentBalance
      totalCredits
      totalDebits
      entryCount
    }
  }
  ${COMMITTEE_FIELDS}
`;

export const GET_BUDGET_INITIALIZATION = gql`
  query GetBudgetInitialization {
    budgetInitialization {
      id
      totalAmount
      businessDate
      description
      notes
      status
      createdAt
      distributionSnapshot {
        ...DistributionSnapshotFields
      }
    }
  }
  ${DISTRIBUTION_SNAPSHOT_FIELDS}
`;

// ─── Actividades y liquidaciones ──────────────────────────────────────────────

export const GET_ACTIVITY_PROFIT_CALCULATION = gql`
  query GetActivityProfitCalculation($activityId: ID!, $dateFrom: String, $dateTo: String) {
    activityProfitCalculation(activityId: $activityId, dateFrom: $dateFrom, dateTo: $dateTo) {
      activityId
      activityName
      totalSales
      totalExpenses
      inventoryCostConsumed
      netProfit
      isAlreadySettled
      settlementId
      settlementDate
      dateFrom
      dateTo
    }
  }
`;

export const GET_ACTIVITIES_PENDING_SETTLEMENT = gql`
  query GetActivitiesPendingSettlement($dateFrom: String, $dateTo: String) {
    activitiesPendingSettlement(dateFrom: $dateFrom, dateTo: $dateTo) {
      activityId
      activityName
      totalSales
      totalExpenses
      inventoryCostConsumed
      netProfit
      isAlreadySettled
      settlementId
      settlementDate
    }
  }
`;

export const GET_ACTIVITY_SETTLEMENT = gql`
  query GetActivitySettlement($activityId: ID!) {
    activitySettlement(activityId: $activityId) {
      id
      activityId
      activityNameSnapshot
      businessDate
      totalSales
      totalExpenses
      inventoryCostConsumed
      netProfit
      totalDistributed
      calculatedFromDate
      calculatedToDate
      notes
      status
      createdAt
      distributionSnapshot {
        ...DistributionSnapshotFields
      }
    }
  }
  ${DISTRIBUTION_SNAPSHOT_FIELDS}
`;

export const GET_ALL_ACTIVITY_SETTLEMENTS = gql`
  query GetAllActivitySettlements($dateFrom: String, $dateTo: String) {
    allActivitySettlements(dateFrom: $dateFrom, dateTo: $dateTo) {
      id
      activityId
      activityNameSnapshot
      businessDate
      totalSales
      totalExpenses
      inventoryCostConsumed
      netProfit
      totalDistributed
      calculatedFromDate
      calculatedToDate
      notes
      status
      createdAt
      distributionSnapshot {
        ...DistributionSnapshotFields
      }
    }
  }
  ${DISTRIBUTION_SNAPSHOT_FIELDS}
`;
