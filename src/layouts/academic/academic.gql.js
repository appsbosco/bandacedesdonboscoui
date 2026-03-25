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
    evidenceUrl
    evidencePublicId
    evidenceResourceType
    evidenceOriginalName
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

const PERFORMANCE_FRAGMENT = gql`
  ${EVALUATION_FRAGMENT}
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
      ...EvaluationFields
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

export const GET_ADMIN_PENDING_EVALUATIONS = gql`
  ${EVALUATION_FRAGMENT}
  query GetAdminPendingEvaluations($filter: AcademicDashboardFilter) {
    adminPendingEvaluations(filter: $filter) {
      ...EvaluationFields
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
  ${EVALUATION_FRAGMENT}
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
          ...EvaluationFields
        }
      }
      pendingAcknowledgements {
        ...EvaluationFields
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

export const ACKNOWLEDGE_CHILD_ACADEMIC_PERFORMANCE = gql`
  mutation AcknowledgeChildAcademicPerformance($childId: ID!, $periodId: ID, $comment: String) {
    acknowledgeChildAcademicPerformance(childId: $childId, periodId: $periodId, comment: $comment) {
      success
      message
    }
  }
`;
