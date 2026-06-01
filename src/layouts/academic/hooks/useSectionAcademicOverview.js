import { useCallback, useEffect, useRef, useState } from "react";
import { useApolloClient, useMutation, useQuery } from "@apollo/client";
import {
  GET_ACADEMIC_PERIODS,
  GET_SECTION_INSTRUMENT_ACADEMIC_OVERVIEW,
  GET_STUDENT_ACADEMIC_EVALUATIONS,
  REVIEW_ACADEMIC_EVALUATION,
} from "../academic.gql";

const EMPTY_LIST = [];

export function useSectionAcademicOverview() {
  const client = useApolloClient();
  const [selectedPeriodId, setSelectedPeriodId] = useState(null);
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [pendingEvaluations, setPendingEvaluations] = useState([]);
  const [loadingPendingEvaluations, setLoadingPendingEvaluations] = useState(false);
  const [toast, setToast] = useState(null);
  const pendingRequestId = useRef(0);

  const periodsQuery = useQuery(GET_ACADEMIC_PERIODS, {
    variables: { isActive: true },
    fetchPolicy: "cache-and-network",
  });

  const overviewQuery = useQuery(GET_SECTION_INSTRUMENT_ACADEMIC_OVERVIEW, {
    variables: {
      periodId: selectedPeriodId || null,
      year: null,
    },
    fetchPolicy: "cache-and-network",
  });

  const membersOverview = overviewQuery.data?.sectionInstrumentAcademicOverview || EMPTY_LIST;

  useEffect(() => {
    if (membersOverview.length === 0) {
      if (selectedMemberId) setSelectedMemberId(null);
      return;
    }

    const exists = membersOverview.some((member) => member.memberId === selectedMemberId);
    if (!selectedMemberId || !exists) {
      setSelectedMemberId(membersOverview[0].memberId);
    }
  }, [membersOverview, selectedMemberId]);

  const memberEvaluationsQuery = useQuery(GET_STUDENT_ACADEMIC_EVALUATIONS, {
    variables: {
      studentId: selectedMemberId || "",
      filter: selectedPeriodId ? { periodId: selectedPeriodId } : undefined,
    },
    skip: !selectedMemberId,
    fetchPolicy: "cache-and-network",
  });

  const loadPendingEvaluations = useCallback(async () => {
    const requestId = pendingRequestId.current + 1;
    pendingRequestId.current = requestId;

    if (membersOverview.length === 0) {
      setPendingEvaluations([]);
      setLoadingPendingEvaluations(false);
      return;
    }

    setLoadingPendingEvaluations(true);
    try {
      const results = await Promise.allSettled(
        membersOverview.map((member) =>
          client.query({
            query: GET_STUDENT_ACADEMIC_EVALUATIONS,
            variables: {
              studentId: member.memberId,
              filter: selectedPeriodId ? { periodId: selectedPeriodId } : undefined,
            },
            fetchPolicy: "network-only",
          })
        )
      );

      const pending = results
        .filter((result) => result.status === "fulfilled")
        .flatMap((result) => result.value.data?.studentAcademicEvaluations || [])
        .filter((evaluation) => evaluation.status === "pending")
        .sort(
          (left, right) =>
            new Date(right.submittedByStudentAt || right.createdAt) -
            new Date(left.submittedByStudentAt || left.createdAt)
        );

      if (pendingRequestId.current === requestId) {
        setPendingEvaluations(pending);
      }
    } finally {
      if (pendingRequestId.current === requestId) {
        setLoadingPendingEvaluations(false);
      }
    }
  }, [client, membersOverview, selectedPeriodId]);

  useEffect(() => {
    loadPendingEvaluations();
  }, [loadPendingEvaluations]);

  const [reviewMutation, { loading: reviewing }] = useMutation(REVIEW_ACADEMIC_EVALUATION, {
    onCompleted: () => {
      showToast("Evaluación revisada correctamente", "success");
      overviewQuery.refetch();
      if (selectedMemberId) memberEvaluationsQuery.refetch();
      loadPendingEvaluations();
    },
    onError: (error) => showToast(error.message, "error"),
  });

  const selectedMember =
    membersOverview.find((member) => member.memberId === selectedMemberId) || null;

  function showToast(message, type = "info") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleReview(id, status, reviewComment) {
    await reviewMutation({ variables: { id, status, reviewComment } });
  }

  return {
    periods: periodsQuery.data?.academicPeriods || [],
    membersOverview,
    selectedMember,
    selectedMemberId,
    memberEvaluations: memberEvaluationsQuery.data?.studentAcademicEvaluations || [],
    pendingEvaluations,
    loadingOverview: overviewQuery.loading,
    loadingMemberEvaluations: memberEvaluationsQuery.loading,
    loadingPendingEvaluations,
    reviewing,
    errorOverview: overviewQuery.error,
    selectedPeriodId,
    setSelectedPeriodId,
    setSelectedMemberId,
    handleReview,
    toast,
    refetch: () => {
      overviewQuery.refetch();
      if (selectedMemberId) memberEvaluationsQuery.refetch();
      loadPendingEvaluations();
    },
  };
}
