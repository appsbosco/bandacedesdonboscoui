import { gql } from "@apollo/client";

export const ADD_CHILD_TO_PARENT = gql`
  mutation AddChildToParent($input: AddChildInput!) {
    addChildToParent(input: $input) {
      id
      name
      firstSurName
      secondSurName
      children {
        id
        name
        firstSurName
        secondSurName
        role
      }
    }
  }
`;

export const REMOVE_CHILD_FROM_PARENT = gql`
  mutation RemoveChildFromParent($input: RemoveChildInput!) {
    removeChildFromParent(input: $input) {
      id
      children {
        id
        name
        firstSurName
      }
    }
  }
`;
