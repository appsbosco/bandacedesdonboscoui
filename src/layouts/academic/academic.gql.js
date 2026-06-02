import { gql } from "@apollo/client";

// ─── Fragments ────────────────────────────────────────────────────────────────

const EVAL_BASIC_USER_FRAGMENT = gql`
  fragment EvalBasicUserFields on EvalBasicUser {
    id
    name
    firstSurName
    email
    grade
    instrument
    avatar
  }
`;

const ACADEMIC_SUBJECT_FRAGMENT = gql`
  fragment AcademicSubjectFields on AcademicSubject {
    id
    name
    code
    isActive
    bands
    grades
  }
`;

const ACADEMIC_PERIOD_FRAGMENT = gql`
  fragment AcademicPeriodFields on AcademicPeriod {
    id
    name
    year
    order
    isActive
  }
`;

// Fragmento para LISTAS — no incluye evidenceUrl (imagen original pesada).
// Usa evidenceThumbnailUrl (120×120) para el thumbnail en tabla.
// Para datos legacy sin thumbnail, el componente hace fallback vacío o icono.
const EVALUATION_FRAGMENT = gql`
  ${EVAL_BASIC_USER_FRAGMENT}
  ${ACADEMIC_SUBJECT_FRAGMENT}
  ${ACADEMIC_PERIOD_FRAGMENT}
  fragment EvaluationFields on AcademicEvaluation {
    id
    student {
      ...EvalBasicUserFields
    }
    subject {
      ...AcademicSubjectFields
    }
    period {
      ...AcademicPeriodFields
    }
    scoreRaw
    scaleMin
    scaleMax
    scoreNormalized100
    evidencePublicId
    evidenceResourceType
    evidenceOriginalName
    evidenceThumbnailUrl
    status
    submittedByStudentAt
    reviewedByAdmin {
      ...EvalBasicUserFields
    }
    reviewedAt
    reviewComment
    parentAcknowledged
    parentAcknowledgedAt
    parentComment
    createdAt
    updatedAt
  }
`;

// Fragmento para DETALLE (modal) — incluye evidenceUrl original y evidencePreviewUrl.
// Solo se usa en GET_EVALUATION_DETAIL (lazy, al abrir modal).
const EVALUATION_DETAIL_FRAGMENT = gql`
  ${EVAL_BASIC_USER_FRAGMENT}
  ${ACADEMIC_SUBJECT_FRAGMENT}
  ${ACADEMIC_PERIOD_FRAGMENT}
  fragment EvaluationDetailFields on AcademicEvaluationDetail {
    id
    student {
      ...EvalBasicUserFields
    }
    subject {
      ...AcademicSubjectFields
    }
    period {
      ...AcademicPeriodFields
    }
    scoreRaw
    scaleMin
    scaleMax
    scoreNormalized100
    evidenceUrl
    evidencePublicId
    evidenceResourceType
    evidenceOriginalName
    evidenceThumbnailUrl
    evidencePreviewUrl
    status
    submittedByStudentAt
    reviewedByAdmin {
      ...EvalBasicUserFields
    }
    reviewedAt
    reviewComment
    parentAcknowledged
    parentAcknowledgedAt
    parentComment
    createdAt
    updatedAt
  }
`;

// recentEvaluations usa campos mínimos — la evidencia se carga solo en modal de detalle
const PERFORMANCE_FRAGMENT = gql`
  fragment PerformanceFields on StudentPerformance {
    studentId
    studentName
    averageGeneral
    approvedCount
    pendingCount
    rejectedCount
    averagesBySubject {
      subjectId
      subjectName
      average
      evaluationCount
    }
    strongestSubjects {
      subjectId
      subjectName
      average
      evaluationCount
    }
    weakestSubjects {
      subjectId
      subjectName
      average
      evaluationCount
    }
    trendDirection
    trendDelta
    riskSubjects {
      subjectId
      subjectName
      average
      reason
    }
    riskScore
    riskLevel
    recentEvaluations {
      id
      scoreNormalized100
      status
      createdAt
      subject {
        id
        name
      }
      period {
        id
        name
        year
      }
    }
  }
`;

const ACADEMIC_COVERAGE_FRAGMENT = gql`
  fragment AcademicCoverageFields on StudentAcademicCoverage {
    allEvaluationsSubmitted
    expectedEvaluationsCount
    submittedEvaluationsCount
    missingEvaluationsCount
    coverageByPeriod {
      periodId
      periodName
      year
      expectedEvaluationsCount
      submittedEvaluationsCount
      missingEvaluationsCount
      missingSubjects {
        subjectId
        subjectName
      }
    }
  }
`;

// ─── Queries ──────────────────────────────────────────────────────────────────

export const GET_ACADEMIC_SUBJECTS = gql`
  ${ACADEMIC_SUBJECT_FRAGMENT}
  query GetAcademicSubjects($grade: String, $isActive: Boolean) {
    academicSubjects(grade: $grade, isActive: $isActive) {
      ...AcademicSubjectFields
      createdAt
      updatedAt
    }
  }
`;

export const GET_ACADEMIC_PERIODS = gql`
  ${ACADEMIC_PERIOD_FRAGMENT}
  query GetAcademicPeriods($year: Int, $isActive: Boolean) {
    academicPeriods(year: $year, isActive: $isActive) {
      ...AcademicPeriodFields
      createdAt
      updatedAt
    }
  }
`;

export const GET_MY_ACADEMIC_EVALUATIONS = gql`
  ${EVALUATION_FRAGMENT}
  query GetMyAcademicEvaluations($filter: AcademicDashboardFilter) {
    myAcademicEvaluations(filter: $filter) {
      ...EvaluationFields
    }
  }
`;

export const GET_MY_ACADEMIC_PERFORMANCE = gql`
  ${PERFORMANCE_FRAGMENT}
  query GetMyAcademicPerformance($periodId: ID, $year: Int) {
    myAcademicPerformance(periodId: $periodId, year: $year) {
      ...PerformanceFields
    }
  }
`;

export const GET_MY_ACADEMIC_EVALUATION_COVERAGE = gql`
  ${ACADEMIC_COVERAGE_FRAGMENT}
  query GetMyAcademicEvaluationCoverage($year: Int) {
    myAcademicEvaluationCoverage(year: $year) {
      ...AcademicCoverageFields
    }
  }
`;

export const GET_STUDENT_ACADEMIC_EVALUATIONS = gql`
  ${EVALUATION_FRAGMENT}
  query GetStudentAcademicEvaluations($studentId: ID!, $filter: AcademicDashboardFilter) {
    studentAcademicEvaluations(studentId: $studentId, filter: $filter) {
      ...EvaluationFields
    }
  }
`;

export const GET_STUDENT_ACADEMIC_PERFORMANCE = gql`
  ${PERFORMANCE_FRAGMENT}
  query GetStudentAcademicPerformance($studentId: ID!, $periodId: ID, $year: Int) {
    studentAcademicPerformance(studentId: $studentId, periodId: $periodId, year: $year) {
      ...PerformanceFields
    }
  }
`;

export const GET_ADMIN_ACADEMIC_DASHBOARD = gql`
  query GetAdminAcademicDashboard($filter: AcademicDashboardFilter) {
    adminAcademicDashboard(filter: $filter) {
      totalStudentsWithData
      studentsInGreen
      studentsInYellow
      studentsInRed
      worstPerformers {
        studentId
        studentName
        averageGeneral
        riskLevel
        riskScore
        trendDirection
        trendDelta
        riskSubjects {
          subjectId
          subjectName
          average
          reason
        }
        averagesBySubject {
          subjectId
          subjectName
          average
          evaluationCount
        }
        approvedCount
        pendingCount
        rejectedCount
        recentEvaluations {
          id
          status
          scoreNormalized100
        }
      }
      mostImproved {
        studentId
        studentName
        averageGeneral
        trendDelta
        trendDirection
        riskLevel
        recentEvaluations {
          id
        }
      }
      mostDeclined {
        studentId
        studentName
        averageGeneral
        trendDelta
        trendDirection
        riskLevel
        recentEvaluations {
          id
        }
      }
      subjectPerformanceSummary {
        subjectId
        subjectName
        overallAverage
        studentsCount
        atRiskCount
      }
      periodComparisonSummary {
        periodId
        periodName
        year
        overallAverage
        studentsCount
      }
    }
  }
`;

// Detalle completo — llamar SOLO al abrir modal. Carga evidenceUrl + evidencePreviewUrl.
export const GET_EVALUATION_DETAIL = gql`
  ${EVALUATION_DETAIL_FRAGMENT}
  query GetEvaluationDetail($id: ID!) {
    evaluationDetail(id: $id) {
      ...EvaluationDetailFields
    }
  }
`;

export const GET_ADMIN_PENDING_EVALUATIONS = gql`
  ${EVALUATION_FRAGMENT}
  query GetAdminPendingEvaluations($filter: AcademicDashboardFilter) {
    adminPendingEvaluations(filter: $filter) {
      ...EvaluationFields
    }
  }
`;

// Versión paginada — preferir esta en producción para no traer todos los pendientes
export const GET_ADMIN_PENDING_EVALUATIONS_PAGINATED = gql`
  ${EVALUATION_FRAGMENT}
  query GetAdminPendingEvaluationsPaginated(
    $filter: AcademicDashboardFilter
    $pagination: PaginationCursorInput
  ) {
    adminPendingEvaluationsPaginated(filter: $filter, pagination: $pagination) {
      hasNextPage
      nextCursor
      items {
        ...EvaluationFields
      }
    }
  }
`;

export const GET_ADMIN_ACADEMIC_STUDENTS = gql`
  query GetAdminAcademicStudents($filter: AcademicDashboardFilter) {
    adminAcademicStudents(filter: $filter) {
      id
      name
      firstSurName
      secondSurName
      email
      grade
      instrument
      avatar
      allEvaluationsSubmitted
      expectedEvaluationsCount
      submittedEvaluationsCount
      missingEvaluationsCount
      coverageByPeriod {
        periodId
        periodName
        year
        expectedEvaluationsCount
        submittedEvaluationsCount
        missingEvaluationsCount
        missingSubjects {
          subjectId
          subjectName
        }
      }
    }
  }
`;

export const GET_ADMIN_RISK_RANKING = gql`
  query GetAdminAcademicRiskRanking($filter: AcademicDashboardFilter, $limit: Int) {
    adminAcademicRiskRanking(filter: $filter, limit: $limit) {
      studentId
      studentName
      averageGeneral
      riskLevel
      riskScore
      trendDirection
      trendDelta
      riskSubjects {
        subjectId
        subjectName
        average
        reason
      }
      approvedCount
      pendingCount
      rejectedCount
      recentEvaluations {
        id
      }
    }
  }
`;

export const GET_PARENT_CHILDREN_ACADEMIC_OVERVIEW = gql`
  query GetParentChildrenAcademicOverview($periodId: ID, $year: Int) {
    parentChildrenAcademicOverview(periodId: $periodId, year: $year) {
      childId
      childName
      childGrade
      performance {
        studentId
        averageGeneral
        approvedCount
        pendingCount
        rejectedCount
        trendDirection
        trendDelta
        riskLevel
        riskScore
        riskSubjects {
          subjectId
          subjectName
          average
          reason
        }
        averagesBySubject {
          subjectId
          subjectName
          average
          evaluationCount
        }
        recentEvaluations {
          id
          scoreNormalized100
          status
          evidenceThumbnailUrl
          subject { id name }
          period { id name year }
        }
      }
      pendingAcknowledgements {
        id
        scoreRaw
        scaleMax
        scoreNormalized100
        status
        evidenceThumbnailUrl
        evidencePublicId
        evidenceResourceType
        parentAcknowledged
        createdAt
        subject { id name }
        period { id name year }
      }
    }
  }
`;

export const GET_SECTION_INSTRUMENT_ACADEMIC_OVERVIEW = gql`
  ${PERFORMANCE_FRAGMENT}
  query GetSectionInstrumentAcademicOverview($periodId: ID, $year: Int) {
    sectionInstrumentAcademicOverview(periodId: $periodId, year: $year) {
      memberId
      memberName
      memberGrade
      memberInstrument
      memberAvatar
      allEvaluationsSubmitted
      expectedEvaluationsCount
      submittedEvaluationsCount
      missingEvaluationsCount
      coverageByPeriod {
        periodId
        periodName
        year
        expectedEvaluationsCount
        submittedEvaluationsCount
        missingEvaluationsCount
        missingSubjects {
          subjectId
          subjectName
        }
      }
      performance {
        ...PerformanceFields
      }
    }
  }
`;

// ─── Mutations ────────────────────────────────────────────────────────────────

export const CREATE_ACADEMIC_SUBJECT = gql`
  ${ACADEMIC_SUBJECT_FRAGMENT}
  mutation CreateAcademicSubject($input: AcademicSubjectInput!) {
    createAcademicSubject(input: $input) {
      ...AcademicSubjectFields
    }
  }
`;

export const UPDATE_ACADEMIC_SUBJECT = gql`
  ${ACADEMIC_SUBJECT_FRAGMENT}
  mutation UpdateAcademicSubject($id: ID!, $input: AcademicSubjectInput!) {
    updateAcademicSubject(id: $id, input: $input) {
      ...AcademicSubjectFields
    }
  }
`;

export const DELETE_ACADEMIC_SUBJECT = gql`
  mutation DeleteAcademicSubject($id: ID!) {
    deleteAcademicSubject(id: $id)
  }
`;

export const CREATE_ACADEMIC_PERIOD = gql`
  ${ACADEMIC_PERIOD_FRAGMENT}
  mutation CreateAcademicPeriod($input: AcademicPeriodInput!) {
    createAcademicPeriod(input: $input) {
      ...AcademicPeriodFields
    }
  }
`;

export const UPDATE_ACADEMIC_PERIOD = gql`
  ${ACADEMIC_PERIOD_FRAGMENT}
  mutation UpdateAcademicPeriod($id: ID!, $input: AcademicPeriodInput!) {
    updateAcademicPeriod(id: $id, input: $input) {
      ...AcademicPeriodFields
    }
  }
`;

export const SUBMIT_ACADEMIC_EVALUATION = gql`
  ${EVALUATION_FRAGMENT}
  mutation SubmitAcademicEvaluation($input: SubmitAcademicEvaluationInput!) {
    submitAcademicEvaluation(input: $input) {
      ...EvaluationFields
    }
  }
`;

export const UPDATE_OWN_PENDING_EVALUATION = gql`
  ${EVALUATION_FRAGMENT}
  mutation UpdateOwnPendingAcademicEvaluation($id: ID!, $input: UpdateAcademicEvaluationInput!) {
    updateOwnPendingAcademicEvaluation(id: $id, input: $input) {
      ...EvaluationFields
    }
  }
`;

export const UPDATE_ACADEMIC_EVALUATION_AS_ADMIN = gql`
  ${EVALUATION_FRAGMENT}
  mutation UpdateAcademicEvaluationAsAdmin($id: ID!, $input: UpdateAcademicEvaluationInput!) {
    updateAcademicEvaluationAsAdmin(id: $id, input: $input) {
      ...EvaluationFields
    }
  }
`;

export const DELETE_ACADEMIC_EVALUATION_AS_ADMIN = gql`
  mutation DeleteAcademicEvaluationAsAdmin($id: ID!) {
    deleteAcademicEvaluationAsAdmin(id: $id)
  }
`;

export const DELETE_OWN_PENDING_EVALUATION = gql`
  mutation DeleteOwnPendingAcademicEvaluation($id: ID!) {
    deleteOwnPendingAcademicEvaluation(id: $id)
  }
`;

export const REVIEW_ACADEMIC_EVALUATION = gql`
  ${EVALUATION_FRAGMENT}
  mutation ReviewAcademicEvaluation($id: ID!, $status: EvaluationStatus!, $reviewComment: String) {
    reviewAcademicEvaluation(id: $id, status: $status, reviewComment: $reviewComment) {
      ...EvaluationFields
    }
  }
`;

export const GET_PARENT_CHILD_EVALUATIONS = gql`
  ${EVALUATION_FRAGMENT}
  query GetParentChildEvaluations($childId: ID!, $filter: AcademicDashboardFilter) {
    parentChildEvaluations(childId: $childId, filter: $filter) {
      ...EvaluationFields
    }
  }
`;

export const ACKNOWLEDGE_CHILD_ACADEMIC_PERFORMANCE = gql`
  mutation AcknowledgeChildAcademicPerformance($childId: ID!, $periodId: ID, $comment: String) {
    acknowledgeChildAcademicPerformance(childId: $childId, periodId: $periodId, comment: $comment) {
      success
      message
    }
  }
`;
