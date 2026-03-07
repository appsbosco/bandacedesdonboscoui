import { gql } from "@apollo/client";

// condition = tenencia field in the backend
export const INVENTORIES_PAGINATED = gql`
  query InventoriesPaginated($filter: InventoryFilterInput, $pagination: PaginationInput) {
    inventoriesPaginated(filter: $filter, pagination: $pagination) {
      items {
        id
        brand
        model
        numberId
        serie
        condition
        details
        instrumentType
        hasInstrument
        lastMaintenanceAt
        nextMaintenanceDueAt
        maintenanceIntervalDays
        createdAt
        status
        user {
          id
          name
          firstSurName
          secondSurName
          carnet
          role
          instrument
          avatar
        }
      }
      total
      page
      limit
      facets {
        byStatus     { value count }
        byCondition  { value count }
        byInstrument { value count }
      }
    }
  }
`;

export const INVENTORY_STATS = gql`
  query InventoryStats {
    inventoryStats {
      total
      onTime
      dueSoon
      overdue
      notApplicable
    }
  }
`;

export const INVENTORY_MAINTENANCE_HISTORY = gql`
  query InventoryMaintenanceHistory($inventoryId: ID!) {
    inventoryMaintenanceHistory(inventoryId: $inventoryId) {
      id
      performedAt
      type
      notes
      performedBy
      cost
      createdAt
    }
  }
`;

// ── Mutations ─────────────────────────────────────────────────────────────────

export const ASSIGN_INVENTORY_TO_USER = gql`
  mutation AssignInventoryToUser($inventoryId: ID!, $userId: ID!) {
    assignInventoryToUser(inventoryId: $inventoryId, userId: $userId) {
      id
      user {
        id
        name
        firstSurName
        secondSurName
        carnet
        role
        instrument
      }
    }
  }
`;

export const UNASSIGN_INVENTORY = gql`
  mutation UnassignInventory($inventoryId: ID!) {
    unassignInventory(inventoryId: $inventoryId)
  }
`;

export const ADMIN_CLEANUP_INVENTORIES = gql`
  mutation AdminCleanupInventories($dryRun: Boolean) {
    adminCleanupInventories(dryRun: $dryRun) {
      count
      deleted
      dryRun
      message
    }
  }
`;

export const ADD_MAINTENANCE_RECORD = gql`
  mutation AddMaintenanceRecord($inventoryId: ID!, $input: AddMaintenanceInput!) {
    addMaintenanceRecord(inventoryId: $inventoryId, input: $input) {
      id
      performedAt
      type
      notes
      performedBy
      cost
    }
  }
`;

export const DELETE_MAINTENANCE_RECORD = gql`
  mutation DeleteMaintenanceRecord($id: ID!) {
    deleteMaintenanceRecord(id: $id)
  }
`;

// User search for assign modal — reuses the existing usersPaginated backend query
export const USERS_SEARCH = gql`
  query UsersSearchForAssign($filter: UsersFilterInput, $pagination: PaginationInput) {
    usersPaginated(filter: $filter, pagination: $pagination) {
      items {
        id
        name
        firstSurName
        secondSurName
        carnet
        role
        instrument
        avatar
      }
      total
    }
  }
`;
