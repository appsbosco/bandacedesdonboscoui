import React, { createContext, useEffect, useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import PropTypes from "prop-types";
import { GET_USERS_BY_ID } from "graphql/queries";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const token = useMemo(() => localStorage.getItem("token"), []);

  const { data: initialData, refetch } = useQuery(GET_USERS_BY_ID, {
    skip: !token,
  });

  const refreshUserData = async () => {
    if (!token) return;
    const { data } = await refetch();
    setUserData(data.getUser);
  };

  useEffect(() => {
    setUserData(initialData?.getUser ?? null);
  }, [initialData]);

  return (
    <UserContext.Provider value={{ userData, refreshUserData }}>{children}</UserContext.Provider>
  );
};

UserProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default UserContext;
