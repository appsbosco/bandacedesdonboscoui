import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_ACADEMIC_SUBJECTS,
  GET_ACADEMIC_PERIODS,
  GET_ADMIN_ACADEMIC_DASHBOARD,
  GET_ADMIN_RISK_RANKING,
  GET_ADMIN_PENDING_EVALUATIONS,
  GET_ADMIN_ACADEMIC_STUDENTS,
  GET_STUDENT_ACADEMIC_EVALUATIONS,
  GET_STUDENT_ACADEMIC_PERFORMANCE,
  CREATE_ACADEMIC_SUBJECT,
  UPDATE_ACADEMIC_SUBJECT,
  DELETE_ACADEMIC_SUBJECT,
  CREATE_ACADEMIC_PERIOD,
  UPDATE_ACADEMIC_PERIOD,
  UPDATE_ACADEMIC_EVALUATION_AS_ADMIN,
  DELETE_ACADEMIC_EVALUATION_AS_ADMIN,
  REVIEW_ACADEMIC_EVALUATION,
} from "../academic.gql";

export function useAcademicDashboard() {
  const [filter, setFilter] = useState({ periodId: null, year: null, grade: null, instrument: null });
  const [reviewModal, setReviewModal] = useState({ open: false, evaluation: null });
  const [studentDrawer, setStudentDrawer] = useState({ open: false, studentId: null, studentName: null });
  const [subjectModal, setSubjectModal] = useState({ open: false, mode: "create", subject: null });
  const [periodModal, setPeriodModal] = useState({ open: false, mode: "create", period: null });
  const [toast, setToast] = useState(null);

  // ─── Queries ─────────────────────────────────────────────────────────────────

  const studentsQuery = useQuery(GET_ADMIN_ACADEMIC_STUDENTS, {
    variables: { filter: buildApiFilter(filter) },
    fetchPolicy: "cache-and-network",
  });

  const subjectsQuery = useQuery(GET_ACADEMIC_SUBJECTS, {
    fetchPolicy: "cache-first",
    nextFetchPolicy: "cache-first",
  });

  const periodsQuery = useQuery(GET_ACADEMIC_PERIODS, {
    fetchPolicy: "cache-first",
    nextFetchPolicy: "cache-first",
  });

  const dashboardQuery = useQuery(GET_ADMIN_ACADEMIC_DASHBOARD, {
    variables: { filter: buildApiFilter(filter) },
    fetchPolicy: "cache-and-network",
  });

  const riskRankingQuery = useQuery(GET_ADMIN_RISK_RANKING, {
    variables: { filter: buildApiFilter(filter), limit: 50 },
    fetchPolicy: "cache-and-network",
  });

  const pendingEvalsQuery = useQuery(GET_ADMIN_PENDING_EVALUATIONS, {
    variables: { filter: buildApiFilter(filter) },
    fetchPolicy: "cache-and-network",
  });

  // Student evaluations — solo cuando el drawer está abierto
  const studentEvalsQuery = useQuery(GET_STUDENT_ACADEMIC_EVALUATIONS, {
    variables: {
      studentId: studentDrawer.studentId || "",
      filter: buildApiFilter(filter),
    },
    skip: !studentDrawer.open || !studentDrawer.studentId,
    fetchPolicy: "cache-and-network",
  });

  // Student performance — solo cuando el drawer está abierto
  const studentPerfQuery = useQuery(GET_STUDENT_ACADEMIC_PERFORMANCE, {
    variables: {
      studentId: studentDrawer.studentId || "",
    },
    skip: !studentDrawer.open || !studentDrawer.studentId,
    fetchPolicy: "cache-and-network",
  });

  // ─── Mutations ───────────────────────────────────────────────────────────────

  const [createSubjectMutation, { loading: creatingSubject }] = useMutation(CREATE_ACADEMIC_SUBJECT, {
    onCompleted: () => {
      showToast("Materia creada", "success");
      closeSubjectModal();
      subjectsQuery.refetch();
    },
    onError: (e) => showToast(e.message, "error"),
  });

  const [updateSubjectMutation, { loading: updatingSubject }] = useMutation(UPDATE_ACADEMIC_SUBJECT, {
    onCompleted: () => {
      showToast("Materia actualizada", "success");
      closeSubjectModal();
      subjectsQuery.refetch();
    },
    onError: (e) => showToast(e.message, "error"),
  });

  const [deleteSubjectMutation, { loading: deletingSubject }] = useMutation(DELETE_ACADEMIC_SUBJECT, {
    onCompleted: () => {
      showToast("Materia eliminada", "success");
      subjectsQuery.refetch();
    },
    onError: (e) => showToast(e.message, "error"),
  });

  const [createPeriodMutation, { loading: creatingPeriod }] = useMutation(CREATE_ACADEMIC_PERIOD, {
    onCompleted: () => {
      showToast("Período creado", "success");
      closePeriodModal();
      periodsQuery.refetch();
    },
    onError: (e) => showToast(e.message, "error"),
  });

  const [updatePeriodMutation, { loading: updatingPeriod }] = useMutation(UPDATE_ACADEMIC_PERIOD, {
    onCompleted: () => {
      showToast("Período actualizado", "success");
      closePeriodModal();
      periodsQuery.refetch();
    },
    onError: (e) => showToast(e.message, "error"),
  });

  const [reviewMutation, { loading: reviewing }] = useMutation(REVIEW_ACADEMIC_EVALUATION, {
    onError: (e) => showToast(e.message, "error"),
  });

  const [updateEvaluationAsAdminMutation, { loading: updatingEvaluation }] = useMutation(
    UPDATE_ACADEMIC_EVALUATION_AS_ADMIN,
    {
      onError: (e) => showToast(e.message, "error"),
    }
  );

  const [deleteEvaluationAsAdminMutation, { loading: deletingEvaluation }] = useMutation(
    DELETE_ACADEMIC_EVALUATION_AS_ADMIN,
    {
      onError: (e) => showToast(e.message, "error"),
    }
  );

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  function showToast(message, type = "info") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  async function refreshAcademicData() {
    await Promise.all([
      dashboardQuery.refetch(),
      riskRankingQuery.refetch(),
      pendingEvalsQuery.refetch(),
      ...(studentDrawer.studentId ? [studentEvalsQuery.refetch(), studentPerfQuery.refetch()] : []),
    ]);
  }

  function openReviewModal(evaluation) {
    setReviewModal({ open: true, evaluation });
  }
  function closeReviewModal() {
    setReviewModal({ open: false, evaluation: null });
  }

  function openStudentDrawer(studentId, studentName) {
    setStudentDrawer({ open: true, studentId, studentName });
  }
  function closeStudentDrawer() {
    setStudentDrawer({ open: false, studentId: null, studentName: null });
  }

  function openSubjectModal(mode = "create", subject = null) {
    setSubjectModal({ open: true, mode, subject });
  }
  function closeSubjectModal() {
    setSubjectModal({ open: false, mode: "create", subject: null });
  }

  function openPeriodModal(mode = "create", period = null) {
    setPeriodModal({ open: true, mode, period });
  }
  function closePeriodModal() {
    setPeriodModal({ open: false, mode: "create", period: null });
  }

  async function handleCreateSubject(input) {
    await createSubjectMutation({ variables: { input } });
  }

  async function handleUpdateSubject(id, input) {
    await updateSubjectMutation({ variables: { id, input } });
  }

  async function handleDeleteSubject(id) {
    await deleteSubjectMutation({ variables: { id } });
  }

  async function handleCreatePeriod(input) {
    await createPeriodMutation({ variables: { input } });
  }

  async function handleUpdatePeriod(id, input) {
    await updatePeriodMutation({ variables: { id, input } });
  }

  async function handleReview(id, status, reviewComment) {
    await reviewMutation({ variables: { id, status, reviewComment } });
    const successMessage =
      status === "approved"
        ? "Evaluacion aprobada correctamente"
        : status === "rejected"
        ? "Evaluacion rechazada correctamente"
        : "Evaluacion revisada correctamente";
    showToast(successMessage, "success");
    closeReviewModal();
    await refreshAcademicData();
  }

  async function handleReviewEvaluationAsAdmin(id, status, reviewComment, input = null) {
    if (input && status) {
      await Promise.all([
        updateEvaluationAsAdminMutation({ variables: { id, input } }),
        reviewMutation({ variables: { id, status, reviewComment } }),
      ]);

      const successMessage =
        status === "approved"
          ? "Evaluacion aprobada correctamente"
          : status === "rejected"
          ? "Evaluacion rechazada correctamente"
          : "Evaluacion revisada correctamente";

      showToast(successMessage, "success");
      closeReviewModal();
      await refreshAcademicData();
      return;
    }

    if (input) {
      await handleUpdateEvaluationAsAdmin(id, input, {
        refresh: !status,
        toastMessage: status ? null : "Nota actualizada",
      });
    }

    if (status) {
      await handleReview(id, status, reviewComment);
    }
  }

  async function handleUpdateEvaluationAsAdmin(id, input, options = {}) {
    const { refresh = true, toastMessage = "Nota actualizada" } = options;
    await updateEvaluationAsAdminMutation({ variables: { id, input } });
    if (toastMessage) showToast(toastMessage, "success");
    if (refresh) {
      await refreshAcademicData();
    }
  }

  async function handleDeleteEvaluationAsAdmin(id) {
    await deleteEvaluationAsAdminMutation({ variables: { id } });
    showToast("Evaluación eliminada", "success");
    await refreshAcademicData();
  }

  return {
    // Data
    allUsers: studentsQuery.data?.adminAcademicStudents || [],
    subjects: subjectsQuery.data?.academicSubjects || [],
    periods: periodsQuery.data?.academicPeriods || [],
    dashboard: dashboardQuery.data?.adminAcademicDashboard || null,
    riskRanking: riskRankingQuery.data?.adminAcademicRiskRanking || [],
    pendingEvaluations: pendingEvalsQuery.data?.adminPendingEvaluations || [],
    studentEvaluations: studentEvalsQuery.data?.studentAcademicEvaluations || [],
    studentPerformance: studentPerfQuery.data?.studentAcademicPerformance || null,

    // Loading
    loadingUsers: studentsQuery.loading,
    loadingDashboard: dashboardQuery.loading,
    loadingRiskRanking: riskRankingQuery.loading,
    loadingPendingEvals: pendingEvalsQuery.loading,
    loadingStudentEvals: studentEvalsQuery.loading,
    loadingStudentPerf: studentPerfQuery.loading,
    reviewing,
    updatingEvaluation,
    deletingEvaluation,
    creatingSubject,
    updatingSubject,
    deletingSubject,
    creatingPeriod,
    updatingPeriod,

    // Errors
    errorDashboard: dashboardQuery.error,

    // Filter
    filter,
    setFilter,

    // Modals/Drawers
    reviewModal,
    studentDrawer,
    subjectModal,
    periodModal,
    openReviewModal,
    closeReviewModal,
    openStudentDrawer,
    closeStudentDrawer,
    openSubjectModal,
    closeSubjectModal,
    openPeriodModal,
    closePeriodModal,

    // Actions
    handleCreateSubject,
    handleUpdateSubject,
    handleDeleteSubject,
    handleCreatePeriod,
    handleUpdatePeriod,
    handleReview,
    handleReviewEvaluationAsAdmin,
    handleUpdateEvaluationAsAdmin,
    handleDeleteEvaluationAsAdmin,

    // Toast
    toast,

    // Refetch
    refetch: () => {
      dashboardQuery.refetch();
      riskRankingQuery.refetch();
      pendingEvalsQuery.refetch();
    },
  };
}

function buildApiFilter(filter) {
  const f = {};
  if (filter.periodId) f.periodId = filter.periodId;
  if (filter.year) f.year = filter.year;
  if (filter.grade) f.grade = filter.grade;
  if (filter.instrument) f.instrument = filter.instrument;
  return Object.keys(f).length > 0 ? f : undefined;
}
