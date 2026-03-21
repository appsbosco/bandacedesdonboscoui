import { gql } from "@apollo/client";

// ── Formation list ────────────────────────────────────────────────────────────

export const FORMATIONS_LIST = gql`
  query FormationsList($filter: FormationFilterInput) {
    formations(filter: $filter) {
      id
      name
      date
      type
      columns
      zoneOrders { zone sectionOrder }
      zoneMemberCounts { zone count }
      notes
      createdBy { id name firstSurName }
      createdAt
      updatedAt
    }
  }
`;

export const FORMATION_DETAIL = gql`
  query FormationDetail($id: ID!) {
    formation(id: $id) {
      id
      name
      date
      type
      columns
      templateId
      zoneOrders { zone sectionOrder }
      zoneColumns { zone columns rows pattern }
      instrumentMappings { instrument section }
      excludedUserIds
      slots {
        zone
        row
        col
        section
        userId
        displayName
        avatar
        locked
      }
      zoneMemberCounts { zone count }
      notes
      createdBy { id name firstSurName }
      createdAt
      updatedAt
    }
  }
`;

// ── Templates ─────────────────────────────────────────────────────────────────

export const FORMATION_TEMPLATES = gql`
  query FormationTemplates {
    formationTemplates {
      id
      name
      defaultColumns
      zoneOrders { zone sectionOrder }
      zoneColumns { zone columns rows pattern }
      instrumentMappings { instrument section }
      notes
      createdAt
    }
  }
`;

export const CREATE_FORMATION_TEMPLATE = gql`
  mutation CreateFormationTemplate($input: CreateFormationTemplateInput!) {
    createFormationTemplate(input: $input) { id name }
  }
`;

export const UPDATE_FORMATION_TEMPLATE = gql`
  mutation UpdateFormationTemplate($id: ID!, $input: UpdateFormationTemplateInput!) {
    updateFormationTemplate(id: $id, input: $input) { id name }
  }
`;

export const DELETE_FORMATION_TEMPLATE = gql`
  mutation DeleteFormationTemplate($id: ID!) {
    deleteFormationTemplate(id: $id)
  }
`;

// ── Users by section ──────────────────────────────────────────────────────────

export const FORMATION_USERS_BY_SECTION = gql`
  query FormationUsersBySection(
    $excludedIds: [ID!]
    $instrumentMappings: [InstrumentMappingInput!]
  ) {
    formationUsersBySection(
      excludedIds: $excludedIds
      instrumentMappings: $instrumentMappings
    ) {
      sections {
        section
        count
        members { userId name instrument avatar }
      }
      unmapped { userId name instrument avatar }
    }
  }
`;

// ── Formation mutations ───────────────────────────────────────────────────────

export const CREATE_FORMATION = gql`
  mutation CreateFormation($input: CreateFormationInput!) {
    createFormation(input: $input) { id name date type columns zoneColumns { zone columns rows pattern } }
  }
`;

export const UPDATE_FORMATION = gql`
  mutation UpdateFormation($id: ID!, $input: UpdateFormationInput!) {
    updateFormation(id: $id, input: $input) { id name updatedAt }
  }
`;

export const DELETE_FORMATION = gql`
  mutation DeleteFormation($id: ID!) {
    deleteFormation(id: $id)
  }
`;
