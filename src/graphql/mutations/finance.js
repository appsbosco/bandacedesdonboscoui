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

// ─── Caja ─────────────────────────────────────────────────────────────────────

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

// ─── Ventas ───────────────────────────────────────────────────────────────────

export const RECORD_SALE = gql`
  mutation RecordSale($input: RecordSaleInput!) {
    recordSale(input: $input) {
      id
      businessDate
      paymentMethod
      source
      total
      status
      scope
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

export const REFUND_SALE = gql`
  mutation RefundSale($saleId: ID!, $reason: String!) {
    refundSale(saleId: $saleId, reason: $reason) {
      id
      status
      refundReason
      voidedAt
    }
  }
`;

// ─── Egresos ──────────────────────────────────────────────────────────────────

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
      scope
      expenseType
      vendor
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

// ─── Catálogos ────────────────────────────────────────────────────────────────

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

// ─── Comités — Configuración ──────────────────────────────────────────────────

/**
 * SEED_COMMITTEES — crea los 6 comités por defecto (idempotente).
 */
export const SEED_COMMITTEES = gql`
  mutation SeedCommittees {
    seedCommittees {
      ...CommitteeFields
    }
  }
  ${COMMITTEE_FIELDS}
`;

/**
 * CREATE_COMMITTEE — crea un comité nuevo.
 */
export const CREATE_COMMITTEE = gql`
  mutation CreateCommittee($input: CreateCommitteeInput!) {
    createCommittee(input: $input) {
      ...CommitteeFields
    }
  }
  ${COMMITTEE_FIELDS}
`;

/**
 * UPDATE_COMMITTEE_DISTRIBUTION_CONFIG
 * updates: [CommitteePercentageUpdateInput!]! → [{ committeeId, percentage }]
 * La suma de todos los porcentajes activos debe ser exactamente 100%.
 */
export const UPDATE_COMMITTEE_DISTRIBUTION_CONFIG = gql`
  mutation UpdateCommitteeDistributionConfig($updates: [CommitteePercentageUpdateInput!]!) {
    updateCommitteeDistributionConfig(updates: $updates) {
      committees {
        ...CommitteeFields
      }
      totalPercentage
      isValid
    }
  }
  ${COMMITTEE_FIELDS}
`;

// ─── Comités — Saldo inicial ──────────────────────────────────────────────────

/**
 * INITIALIZE_COMMITTEE_BUDGETS
 * Solo puede ejecutarse una vez (un solo BudgetInitialization ACTIVE).
 *
 * Input: { totalAmount, businessDate, description?, notes? }
 */
export const INITIALIZE_COMMITTEE_BUDGETS = gql`
  mutation InitializeCommitteeBudgets($input: InitializeCommitteeBudgetsInput!) {
    initializeCommitteeBudgets(input: $input) {
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

// ─── Comités — Distribución de utilidades ─────────────────────────────────────

/**
 * DISTRIBUTE_ACTIVITY_PROFIT
 * Liquida la utilidad de una actividad y la distribuye entre comités.
 * Una actividad solo puede liquidarse una vez.
 *
 * Input: {
 *   activityId: ID!
 *   businessDate: String!
 *   dateFrom?: String   ← rango para calcular utilidad
 *   dateTo?: String
 *   notes?: String
 *   forceIfZero?: Boolean
 * }
 */
export const DISTRIBUTE_ACTIVITY_PROFIT = gql`
  mutation DistributeActivityProfit($input: DistributeActivityProfitInput!) {
    distributeActivityProfit(input: $input) {
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

// ─── Comités — Gastos ─────────────────────────────────────────────────────────

/**
 * RECORD_COMMITTEE_EXPENSE
 * Registra un gasto que rebaja el presupuesto de un comité.
 *
 * FLUJO A (recomendado desde ExpensesPage):
 *   Registrar primero con recordExpense → obtener expenseId
 *   → llamar con { committeeId, businessDate, amount, concept, expenseId }
 *
 * FLUJO B (sin caja previa):
 *   Llamar con { committeeId, businessDate, amount, concept, expenseData: { ... } }
 *
 * Input: RecordCommitteeExpenseInput {
 *   committeeId: ID!
 *   businessDate: String!
 *   amount: Float!
 *   concept: String!
 *   notes?: String
 *   activityId?: ID
 *   expenseId?: ID               ← Flujo A
 *   expenseData?: CommitteeExpenseDataInput  ← Flujo B
 *   allowNegativeBalance?: Boolean
 * }
 */
export const RECORD_COMMITTEE_EXPENSE = gql`
  mutation RecordCommitteeExpense($input: RecordCommitteeExpenseInput!) {
    recordCommitteeExpense(input: $input) {
      id
      committeeId
      committeeNameSnapshot
      entryType
      businessDate
      creditAmount
      debitAmount
      runningBalance
      percentageSnapshot
      description
      notes
      expenseId
      activityId
      status
      createdAt
    }
  }
`;
