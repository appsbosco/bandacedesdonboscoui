import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_ACADEMIC_SUBJECTS,
  GET_ACADEMIC_PERIODS,
  GET_MY_ACADEMIC_EVALUATIONS,
  GET_MY_ACADEMIC_PERFORMANCE,
  SUBMIT_ACADEMIC_EVALUATION,
  UPDATE_OWN_PENDING_EVALUATION,
  DELETE_OWN_PENDING_EVALUATION,
} from "../academic.gql";

export function useAcademicEvaluations({ periodId, year, grade } = {}) {
  const [filter, setFilter] = useState({ periodId, subjectId: null, status: null });
  const [formModal, setFormModal] = useState({
    open: false,
    mode: "create",
    evaluation: null,
    initialSelection: null,
  });
  const [deleteModal, setDeleteModal] = useState({ open: false, evaluation: null });
  const [toast, setToast] = useState(null);

  // ─── Queries ─────────────────────────────────────────────────────────────────

  const subjectsQuery = useQuery(GET_ACADEMIC_SUBJECTS, {
    variables: { isActive: true },
    fetchPolicy: "cache-and-network",
  });

  const periodsQuery = useQuery(GET_ACADEMIC_PERIODS, {
    variables: { isActive: true },
    fetchPolicy: "cache-and-network",
  });

  const evaluationsQuery = useQuery(GET_MY_ACADEMIC_EVALUATIONS, {
    variables: { filter: buildFilter(filter) },
    fetchPolicy: "cache-and-network",
  });

  const performanceQuery = useQuery(GET_MY_ACADEMIC_PERFORMANCE, {
    variables: { periodId: filter.periodId || null, year: year || null },
    fetchPolicy: "cache-and-network",
  });

  // ─── Mutations ───────────────────────────────────────────────────────────────

  const [submitMutation, { loading: submitting }] = useMutation(SUBMIT_ACADEMIC_EVALUATION, {
    onCompleted: () => {
      showToast("Evaluación registrada correctamente", "success");
      closeFormModal();
      evaluationsQuery.refetch();
      performanceQuery.refetch();
    },
    onError: (e) => showToast(e.message, "error"),
  });

  const [updateMutation, { loading: updating }] = useMutation(UPDATE_OWN_PENDING_EVALUATION, {
    onCompleted: () => {
      showToast("Evaluación actualizada", "success");
      closeFormModal();
      evaluationsQuery.refetch();
      performanceQuery.refetch();
    },
    onError: (e) => showToast(e.message, "error"),
  });

  const [deleteMutation, { loading: deleting }] = useMutation(DELETE_OWN_PENDING_EVALUATION, {
    onCompleted: () => {
      showToast("Evaluación eliminada", "success");
      setDeleteModal({ open: false, evaluation: null });
      evaluationsQuery.refetch();
      performanceQuery.refetch();
    },
    onError: (e) => showToast(e.message, "error"),
  });

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  function showToast(message, type = "info") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  function openFormModal(mode = "create", evaluation = null, initialSelection = null) {
    setFormModal({ open: true, mode, evaluation, initialSelection });
  }

  function closeFormModal() {
    setFormModal({ open: false, mode: "create", evaluation: null, initialSelection: null });
  }

  function openDeleteModal(evaluation) {
    setDeleteModal({ open: true, evaluation });
  }

  function closeDeleteModal() {
    setDeleteModal({ open: false, evaluation: null });
  }

  async function handleSubmit(input) {
    await submitMutation({ variables: { input } });
  }

  async function handleUpdate(id, input) {
    await updateMutation({ variables: { id, input } });
  }

  async function handleDelete(id) {
    await deleteMutation({ variables: { id } });
  }

  const subjects = (subjectsQuery.data?.academicSubjects || []).filter((subject) => {
    if (!grade) return true;

    const subjectGrades = Array.isArray(subject?.grades)
      ? subject.grades.filter(Boolean)
      : [];

    return subjectGrades.length === 0 || subjectGrades.includes(grade);
  });

  return {
    // Data
    subjects,
    periods: periodsQuery.data?.academicPeriods || [],
    evaluations: evaluationsQuery.data?.myAcademicEvaluations || [],
    performance: performanceQuery.data?.myAcademicPerformance || null,

    // Loading
    loadingSubjects: subjectsQuery.loading,
    loadingPeriods: periodsQuery.loading,
    loadingEvaluations: evaluationsQuery.loading,
    loadingPerformance: performanceQuery.loading,
    submitting,
    updating,
    deleting,

    // Errors
    errorEvaluations: evaluationsQuery.error,
    errorPerformance: performanceQuery.error,

    // Filter
    filter,
    setFilter,

    // Modals
    formModal,
    deleteModal,
    openFormModal,
    closeFormModal,
    openDeleteModal,
    closeDeleteModal,

    // Actions
    handleSubmit,
    handleUpdate,
    handleDelete,

    // Toast
    toast,

    // Refetch
    refetch: () => {
      evaluationsQuery.refetch();
      performanceQuery.refetch();
    },
  };
}

function buildFilter(filter) {
  const f = {};
  if (filter.periodId) f.periodId = filter.periodId;
  if (filter.subjectId) f.subjectId = filter.subjectId;
  if (filter.status) f.status = filter.status;
  return Object.keys(f).length > 0 ? f : undefined;
}
