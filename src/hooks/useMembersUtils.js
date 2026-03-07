import { useCallback, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_USERS_BY_ID } from "graphql/queries";
import { DELETE_USER, DELETE_MEDICAL_RECORD } from "../graphql/mutations";
import { GET_MEDICAL_RECORDS } from "../graphql/queries/members";

/**
 * Provides member-page utilities WITHOUT loading the full user list.
 * - userRole:                  current logged-in user's role
 * - getMedicalRecordForUserId: look up a medical record by userId
 * - deleteUserAndMedicalRecord: delete a user + their medical record
 */
export function useMembersUtils() {
  const { data: userData } = useQuery(GET_USERS_BY_ID, {
    fetchPolicy: "cache-first",
  });

  const { data: medicalData } = useQuery(GET_MEDICAL_RECORDS, {
    fetchPolicy: "cache-and-network",
  });

  const [deleteUser] = useMutation(DELETE_USER, {
    refetchQueries: [{ query: GET_MEDICAL_RECORDS }],
    awaitRefetchQueries: true,
  });

  const [deleteMedicalRecord] = useMutation(DELETE_MEDICAL_RECORD, {
    refetchQueries: [{ query: GET_MEDICAL_RECORDS }],
    awaitRefetchQueries: true,
  });

  const userRole = userData?.getUser?.role;

  const medicalRecordsMap = useMemo(() => {
    const records = medicalData?.getMedicalRecords || [];
    return Object.fromEntries(
      records.filter((r) => r?.user?.id).map((r) => [r.user.id, r])
    );
  }, [medicalData]);

  const getMedicalRecordForUserId = useCallback(
    (userId) => (!userId ? null : medicalRecordsMap[userId] || null),
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

  return { userRole, getMedicalRecordForUserId, deleteUserAndMedicalRecord };
}
