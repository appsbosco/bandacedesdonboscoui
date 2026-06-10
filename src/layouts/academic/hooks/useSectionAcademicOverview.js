import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  GET_ACADEMIC_PERIODS,
  GET_SECTION_INSTRUMENT_ACADEMIC_OVERVIEW,
  GET_SECTION_PENDING_EVALUATIONS,
  GET_STUDENT_ACADEMIC_EVALUATIONS,
  REVIEW_ACADEMIC_EVALUATION,
} from "../academic.gql";

const EMPTY_LIST = [];

export function useSectionAcademicOverview() {
  const [selectedPeriodId, setSelectedPeriodId] = useState(null);
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [toast, setToast] = useState(null);

  // Períodos son datos estables — cache-first evita request innecesaria en cada montaje.
  const periodsQuery = useQuery(GET_ACADEMIC_PERIODS, {
    variables: { isActive: true },
    fetchPolicy: "cache-first",
  });

  const overviewQuery = useQuery(GET_SECTION_INSTRUMENT_ACADEMIC_OVERVIEW, {
    variables: {
      periodId: selectedPeriodId || null,
      year: null,
    },
    fetchPolicy: "cache-and-network",
  });

  const membersOverview = overviewQuery.data?.sectionInstrumentAcademicOverview ?? EMPTY_LIST;

  // Set estable de memberIds — evita re-cálculos innecesarios en efectos descendientes.
  const memberIdSet = useMemo(
    () => new Set(membersOverview.map((m) => m.memberId)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [membersOverview]
  );

  useEffect(() => {
    if (membersOverview.length === 0) {
      if (selectedMemberId) setSelectedMemberId(null);
      return;
    }
    if (!selectedMemberId || !memberIdSet.has(selectedMemberId)) {
      setSelectedMemberId(membersOverview[0].memberId);
    }
  }, [membersOverview, memberIdSet, selectedMemberId]);

  // Evaluaciones del miembro seleccionado (tab Historial en el sheet de detalle).
  const memberEvaluationsQuery = useQuery(GET_STUDENT_ACADEMIC_EVALUATIONS, {
    variables: {
      studentId: selectedMemberId || "",
      filter: selectedPeriodId ? { periodId: selectedPeriodId } : undefined,
    },
    skip: !selectedMemberId,
    fetchPolicy: "cache-and-network",
  });

  // Una sola query reemplaza el patrón N+1 anterior (Promise.allSettled × N miembros).
  // Antes: N requests network-only → hasta 40 requests en carga cálida con 20 miembros.
  // Ahora: 1 request scoped al servidor → el backend ya filtra por sección del líder.
  const pendingQuery = useQuery(GET_SECTION_PENDING_EVALUATIONS, {
    variables: {
      filter: selectedPeriodId ? { periodId: selectedPeriodId } : undefined,
    },
    fetchPolicy: "cache-and-network",
  });

  const pendingEvaluations = useMemo(() => {
    const all = pendingQuery.data?.sectionPendingEvaluations ?? [];
    return all.slice().sort(
      (a, b) =>
        new Date(b.submittedByStudentAt || b.createdAt) -
        new Date(a.submittedByStudentAt || a.createdAt)
    );
  }, [pendingQuery.data]);

  const [reviewMutation, { loading: reviewing }] = useMutation(REVIEW_ACADEMIC_EVALUATION, {
    onCompleted: () => {
      showToast("Evaluación revisada correctamente", "success");
      overviewQuery.refetch();
      pendingQuery.refetch();
      if (selectedMemberId) memberEvaluationsQuery.refetch();
    },
    onError: (error) => showToast(error.message, "error"),
  });

  const selectedMember =
    membersOverview.find((member) => member.memberId === selectedMemberId) ?? null;

  function showToast(message, type = "info") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleReview(id, status, reviewComment) {
    await reviewMutation({ variables: { id, status, reviewComment } });
  }

  return {
    periods: periodsQuery.data?.academicPeriods ?? [],
    membersOverview,
    selectedMember,
    selectedMemberId,
    memberEvaluations: memberEvaluationsQuery.data?.studentAcademicEvaluations ?? [],
    pendingEvaluations,
    loadingOverview: overviewQuery.loading,
    loadingMemberEvaluations: memberEvaluationsQuery.loading,
    loadingPendingEvaluations: pendingQuery.loading,
    reviewing,
    errorOverview: overviewQuery.error,
    selectedPeriodId,
    setSelectedPeriodId,
    setSelectedMemberId,
    handleReview,
    toast,
    refetch: () => {
      overviewQuery.refetch();
      pendingQuery.refetch();
      if (selectedMemberId) memberEvaluationsQuery.refetch();
    },
  };
}
