import React, { createContext, useState } from "react";
import { gql, useQuery } from "@apollo/client";
import PropTypes from "prop-types";
import { GET_USERS_BY_ID } from "graphql/queries";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);

  const { data: initialData, refetch } = useQuery(GET_USERS_BY_ID);

  const refreshUserData = async () => {
    const { data } = await refetch();
    setUserData(data.getUser);
  };

  useState(() => {
    if (initialData) {
      setUserData(initialData.getUser);
    }
  }, [initialData]);

  return (
    <UserContext.Provider value={{ userData, refreshUserData }}>{children}</UserContext.Provider>
  );
};

UserProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default UserContext;
