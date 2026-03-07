import { gql } from "@apollo/client";

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
        ownership
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
          instrument
          role
          carnet
        }
      }
      total
      page
      limit
      facets {
        byStatus     { value count }
        byOwnership  { value count }
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

export const UPDATE_INVENTORY = gql`
  mutation UpdateInventory($id: ID!, $input: InventoryInput!) {
    updateInventory(id: $id, input: $input) {
      id
      brand
      model
      numberId
      serie
      condition
      details
      instrumentType
      ownership
      hasInstrument
      lastMaintenanceAt
      nextMaintenanceDueAt
      maintenanceIntervalDays
      status
    }
  }
`;
