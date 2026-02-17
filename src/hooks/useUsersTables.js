import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_USERS_BY_ID, GET_PARENTS } from "graphql/queries";
import { DELETE_USER, DELETE_MEDICAL_RECORD } from "../graphql/mutations";
import { GET_USERS, GET_MEDICAL_RECORDS } from "../graphql/queries/members";
import { calculateAgeFromBirthdayEs } from "../utils/date";

function normalizeRole(role) {
  return String(role || "")
    .replace(/\u00A0/g, " ")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// ===============================
// Role groups (ALLOWLISTS)
// ===============================
const MUSICIAN_ROLES = new Set(
  ["Principal de sección", "Integrante BCDB", "Asistente de sección"].map(normalizeRole)
);

const INSTRUCTOR_ROLES = new Set(["Instructor de instrumento"].map(normalizeRole));

const PARENT_ROLES = new Set(["Padre/Madre de familia"].map(normalizeRole));

const STAFF_ROLES = new Set(
  [
    "Director",
    "Dirección Logística",
    "CEDES",
    "Logística",
    "Instructura Color Guard",
    "Instructor Drumline",
    "Staff",
  ].map(normalizeRole)
);

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

  // ===============================
  // SINGLE SOURCE OF TRUTH: partition
  // ===============================
  const partition = useMemo(() => {
    const buckets = {
      musicians: [],
      instructors: [],
      parentsFromUsers: [],
      staff: [],
      unknown: [],
      unknownRoles: [],
    };

    const unknownSet = new Set();

    for (const u of usersState || []) {
      const key = normalizeRole(u?.role);

      if (MUSICIAN_ROLES.has(key)) {
        buckets.musicians.push(u);
        continue;
      }

      if (INSTRUCTOR_ROLES.has(key)) {
        buckets.instructors.push(u);
        continue;
      }

      if (PARENT_ROLES.has(key)) {
        buckets.parentsFromUsers.push(u);
        continue;
      }

      if (STAFF_ROLES.has(key)) {
        buckets.staff.push(u);
        continue;
      }

      // Si el rol no cae en ningún grupo, NO lo metemos en staff.
      buckets.unknown.push(u);
      unknownSet.add(u?.role || "(sin role)");
    }

    buckets.unknownRoles = Array.from(unknownSet);

    return buckets;
  }, [usersState]);

  const musiciansData = useMemo(() => {
    return (partition.musicians || []).map((u) => {
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
  }, [partition.musicians, medicalRecordsMap]);

  const staffData = useMemo(() => {
    return partition.staff || [];
  }, [partition.staff]);

  const instructorsData = useMemo(() => {
    return partition.instructors || [];
  }, [partition.instructors]);

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
    unknownUsers: partition.unknown,
    unknownRoles: partition.unknownRoles,
    getMedicalRecordForUserId,
    handleStateChange,
    deleteUserAndMedicalRecord,
  };
}
