import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_ACADEMIC_PERIODS,
  GET_PARENT_CHILDREN_ACADEMIC_OVERVIEW,
  GET_PARENT_CHILD_EVALUATIONS,
  ACKNOWLEDGE_CHILD_ACADEMIC_PERFORMANCE,
} from "../academic.gql";

export function useChildAcademicPerformance() {
  const [selectedPeriodId, setSelectedPeriodId] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [acknowledgeModal, setAcknowledgeModal] = useState({
    open: false,
    childId: null,
    childName: null,
  });
  const [toast, setToast] = useState(null);

  const periodsQuery = useQuery(GET_ACADEMIC_PERIODS, {
    variables: { isActive: true },
    fetchPolicy: "cache-and-network",
  });

  const overviewQuery = useQuery(GET_PARENT_CHILDREN_ACADEMIC_OVERVIEW, {
    variables: {
      periodId: selectedPeriodId || null,
      year: selectedYear || null,
    },
    fetchPolicy: "cache-and-network",
  });

  const childrenOverview = overviewQuery.data?.parentChildrenAcademicOverview || [];

  // Auto-select first child whenever data arrives and nothing is selected
  useEffect(() => {
    if (childrenOverview.length > 0 && !selectedChildId) {
      setSelectedChildId(childrenOverview[0].childId);
    }
  }, [childrenOverview, selectedChildId]);

  // Full evaluation history for selected child
  const childEvalsQuery = useQuery(GET_PARENT_CHILD_EVALUATIONS, {
    variables: {
      childId: selectedChildId || "",
      filter: selectedPeriodId ? { periodId: selectedPeriodId } : undefined,
    },
    skip: !selectedChildId,
    fetchPolicy: "cache-and-network",
  });

  const [acknowledgeMutation, { loading: acknowledging }] = useMutation(
    ACKNOWLEDGE_CHILD_ACADEMIC_PERFORMANCE,
    {
      onCompleted: (data) => {
        showToast(data.acknowledgeChildAcademicPerformance?.message || "Revisión registrada", "success");
        closeAcknowledgeModal();
        overviewQuery.refetch();
        if (selectedChildId) childEvalsQuery.refetch();
      },
      onError: (e) => showToast(e.message, "error"),
    }
  );

  function showToast(message, type = "info") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  function openAcknowledgeModal(childId, childName) {
    setAcknowledgeModal({ open: true, childId, childName });
  }

  function closeAcknowledgeModal() {
    setAcknowledgeModal({ open: false, childId: null, childName: null });
  }

  async function handleAcknowledge(childId, comment) {
    await acknowledgeMutation({
      variables: { childId, periodId: selectedPeriodId || null, comment },
    });
  }

  const selectedChild = childrenOverview.find((c) => c.childId === selectedChildId) || null;

  return {
    // Data
    periods: periodsQuery.data?.academicPeriods || [],
    childrenOverview,
    selectedChild,
    selectedChildId,
    childEvaluations: childEvalsQuery.data?.parentChildEvaluations || [],

    // Loading
    loadingOverview: overviewQuery.loading,
    loadingChildEvals: childEvalsQuery.loading,
    acknowledging,

    // Error
    errorOverview: overviewQuery.error,

    // Filters
    selectedPeriodId,
    selectedYear,
    setSelectedPeriodId,
    setSelectedYear,
    setSelectedChildId,

    // Modal
    acknowledgeModal,
    openAcknowledgeModal,
    closeAcknowledgeModal,

    // Actions
    handleAcknowledge,

    // Toast
    toast,

    // Refetch
    refetch: overviewQuery.refetch,
  };
}
