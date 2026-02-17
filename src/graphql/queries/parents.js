import { gql } from "@apollo/client";

export const GET_PARENT_DASHBOARD = gql`
  query GetParentDashboard($dateRange: DateRangeInput, $childId: ID) {
    getParentDashboard(dateRange: $dateRange, childId: $childId) {
      parent {
        id
        name
        firstSurName
        secondSurName
        email
        phone
        avatar
        totalChildren
      }
      children {
        child {
          id
          name
          firstSurName
          secondSurName
          email
          phone
          avatar
          instrument
          grade
          state
        }
        attendanceMetrics {
          totalSessions
          present
          absentJustified
          absentUnjustified
          late
          withdrawalJustified
          withdrawalUnjustified
          attendanceRate
          lastRecordDate
        }
        classMetrics {
          totalClasses
          present
          absentJustified
          absentUnjustified
          attendanceRate
          paymentSummary {
            totalPending
            totalPaid
            totalScholarship
            pendingAmount
          }
          lastClassDate
        }
        recentRehearsalAttendance {
          id
          date
          status
          notes
          sessionId
          recordedBy
        }
        recentClassAttendance {
          id
          date
          attendanceStatus
          paymentStatus
          justification
          instructorName
        }
        pendingPayments {
          id
          date
          instructorName
          daysOverdue
        }
      }
      dateRange {
        from
        to
        presetName
      }
      generatedAt
    }
  }
`;
