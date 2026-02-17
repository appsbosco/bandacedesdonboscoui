import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_USERS_BY_ID, GET_PARENTS } from "graphql/queries";
import { DELETE_USER, DELETE_MEDICAL_RECORD } from "../graphql/mutations";
import { GET_USERS, GET_MEDICAL_RECORDS } from "../graphql/queries/members";
import { calculateAgeFromBirthdayEs } from "../utils/date";

export function useUsersTables() {
  const { data: userData } = useQuery(GET_USERS_BY_ID, {
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
  });

  const { data: parentData } = useQuery(GET_PARENTS, {
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
  });

  const {
    loading: usersLoading,
    error: usersError,
    data: usersQueryData,
  } = useQuery(GET_USERS, {
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
  });

  const {
    data: medicalRecordData,
    loading: medicalRecordLoading,
    error: medicalRecordError,
  } = useQuery(GET_MEDICAL_RECORDS, {
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
  });

  const [usersState, setUsersState] = useState([]);

  useEffect(() => {
    if (usersQueryData?.getUsers) setUsersState(usersQueryData.getUsers);
  }, [usersQueryData]);

  const [deleteUser] = useMutation(DELETE_USER, {
    refetchQueries: [{ query: GET_USERS }, { query: GET_MEDICAL_RECORDS }, { query: GET_PARENTS }],
    awaitRefetchQueries: true,
  });

  const [deleteMedicalRecord] = useMutation(DELETE_MEDICAL_RECORD, {
    refetchQueries: [{ query: GET_MEDICAL_RECORDS }],
    awaitRefetchQueries: true,
  });

  const userRole = userData?.getUser?.role;

  const medicalRecordsMap = useMemo(() => {
    const records = medicalRecordData?.getMedicalRecords || [];
    return Object.fromEntries(records.filter((r) => r?.user?.id).map((r) => [r.user.id, r]));
  }, [medicalRecordData]);

  const musiciansData = useMemo(() => {
    const allowedRoles = ["Principal de sección", "Integrante BCDB", "Asistente de sección"];

    return (usersState || [])
      .filter((u) => allowedRoles.includes(u.role))
      .map((u) => {
        const medical = medicalRecordsMap[u.id] || {};
        return {
          ...u,
          age: u.birthday ? calculateAgeFromBirthdayEs(u.birthday) : "N/A",
          identification: medical.identification || "N/A",
          address: medical.address || "N/A",
          familyMemberName: medical.familyMemberName || "N/A",
          familyMemberNumberId: medical.familyMemberNumberId || "N/A",
          familyMemberRelationship: medical.familyMemberRelationship || "N/A",
        };
      });
  }, [usersState, medicalRecordsMap]);

  const staffData = useMemo(() => {
    return (usersState || []).filter(
      (u) =>
        u.role !== "Principal de sección" &&
        u.role !== "Integrante BCDB" &&
        u.role !== "Asistente de sección" &&
        u.role !== "Instructor de instrumento" &&
        u.role !== "Padre/Madre de familia"
    );
  }, [usersState]);

  const instructorsData = useMemo(() => {
    return (usersState || []).filter((u) => u.role === "Instructor de instrumento");
  }, [usersState]);

  const parentsData = parentData?.getParents || [];

  const handleStateChange = useCallback((id, newState) => {
    setUsersState((prev) => prev.map((u) => (u.id === id ? { ...u, state: newState } : u)));
  }, []);

  const getMedicalRecordForUserId = useCallback(
    (userId) => {
      if (!userId) return null;
      return medicalRecordsMap[userId] || null;
    },
    [medicalRecordsMap]
  );

  const deleteUserAndMedicalRecord = useCallback(
    async ({ userId, medicalRecordId }) => {
      if (!userId) return false;

      await deleteUser({ variables: { deleteUserId: userId } });

      if (medicalRecordId) {
        await deleteMedicalRecord({ variables: { deleteMedicalRecordId: medicalRecordId } });
      }

      return true;
    },
    [deleteUser, deleteMedicalRecord]
  );

  return {
    userRole,
    usersLoading,
    usersError,
    medicalRecordLoading,
    medicalRecordError,
    usersState,
    musiciansData,
    staffData,
    instructorsData,
    parentsData,
    getMedicalRecordForUserId,
    handleStateChange,
    deleteUserAndMedicalRecord,
  };
}
