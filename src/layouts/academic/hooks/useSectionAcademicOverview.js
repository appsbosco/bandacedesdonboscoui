import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  GET_ACADEMIC_PERIODS,
  GET_SECTION_INSTRUMENT_ACADEMIC_OVERVIEW,
  GET_STUDENT_ACADEMIC_EVALUATIONS,
  REVIEW_ACADEMIC_EVALUATION,
} from "../academic.gql";

export function useSectionAcademicOverview() {
  const [selectedPeriodId, setSelectedPeriodId] = useState(null);
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [toast, setToast] = useState(null);

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

  const membersOverview = overviewQuery.data?.sectionInstrumentAcademicOverview || [];

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

  const [reviewMutation, { loading: reviewing }] = useMutation(REVIEW_ACADEMIC_EVALUATION, {
    onCompleted: () => {
      showToast("Evaluación revisada correctamente", "success");
      overviewQuery.refetch();
      if (selectedMemberId) memberEvaluationsQuery.refetch();
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
    loadingOverview: overviewQuery.loading,
    loadingMemberEvaluations: memberEvaluationsQuery.loading,
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
    },
  };
}
