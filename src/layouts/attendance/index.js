/**
=========================================================
* Soft UI Dashboard React - v4.0.1
=========================================================

* Product Page: https://www.creative-tim.com/product/soft-ui-dashboard-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

// @mui material components
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";

// Soft UI Dashboard React components
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

// Soft UI Dashboard React examples
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import MiniStatisticsCard from "examples/Cards/StatisticsCards/MiniStatisticsCard";
import AnalyticsIcon from "@mui/icons-material/Analytics";
// Soft UI Dashboard React base styles
import typography from "assets/theme/base/typography";

import reportsBarChartData from "layouts/dashboard/data/reportsBarChartData";
import { GET_PARENTS_BY_ID } from "graphql/queries";
import { useQuery } from "@apollo/client";
import { Card } from "@mui/material";
import AttendanceHistoryTable from "./GetAttendances";
import MoodBadIcon from "@mui/icons-material/MoodBad";
import MoodIcon from "@mui/icons-material/Mood";
import SentimentNeutralIcon from "@mui/icons-material/SentimentNeutral";

function getMoodIcon(percentage) {
  if (percentage >= 70) {
    return <MoodIcon />;
  } else if (percentage >= 50) {
    return <SentimentNeutralIcon />;
  } else {
    return <MoodBadIcon />;
  }
}

function Attendance() {
  const { size } = typography;
  const { chart, items } = reportsBarChartData;
  const { data: userData, loading: userLoading, error: userError } = useQuery(GET_PARENTS_BY_ID);
  if (!userData) {
    // Handle the case where userData is not available yet
    return (
      <div className="text-center">
        <div role="status">
          <svg
            aria-hidden="true"
            className="inline w-8 h-8 mr-2 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
            viewBox="0 0 100 101"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
              fill="currentColor"
            />
            <path
              d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
              fill="currentFill"
            />
          </svg>
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  const { name, firstSurName, secondSurName, email, phone, children } = userData.getParent || {};

  const firstChild = children && children.length > 0 ? children[0] : null;

  const {
    name: childName,
    firstSurName: childFirstSurName,
    secondSurName: childSecondSurName,
    email: childEmail,
    phone: childPhone,
    instrument: childInstrument,
    inventory,
    medicalRecord,
    attendance,
  } = firstChild || {};

  // Extract attendance fields
  const attendanceRecords = attendance.map(({ id: attendanceId, date, attended }) => ({
    attendanceId,
    date,
    attended,
  }));

  console.log(attendanceRecords);

  const attendanceCounts = attendance.reduce(
    (counts, { attended }) => {
      if (attended === "present") {
        counts.present += 1;
      } else if (attended === "absent") {
        counts.absent += 1;
      } else if (attended === "unjustified_absence") {
        counts.unjustifiedAbsence += 1;
      } else if (attended === "justified_absence") {
        counts.justifiedAbsence += 1;
      }
      return counts;
    },
    { present: 0, absent: 0, unjustifiedAbsence: 0, justifiedAbsence: 0 }
  );

  const totalAttendance =
    attendanceCounts.present +
    attendanceCounts.absent +
    attendanceCounts.unjustifiedAbsence +
    attendanceCounts.justifiedAbsence;

  const attendancePresentPercentage = (attendanceCounts.present / totalAttendance) * 100;
  const attendanceAbsentPercentage = (attendanceCounts.absent / totalAttendance) * 100;

  // Determinar el color para cada porcentaje de asistencia
  const colorPresent =
    attendancePresentPercentage >= 70
      ? "success"
      : attendancePresentPercentage >= 50
      ? "#EB6031"
      : "error";

  const colorAbsent =
    attendanceAbsentPercentage >= 70
      ? "error"
      : attendanceAbsentPercentage >= 50
      ? "#EB6031"
      : "success";

  const moodIconPresent = getMoodIcon(attendancePresentPercentage);
  const moodIconAbsent = getMoodIcon(attendanceAbsentPercentage);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <SoftBox mb={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} xl={3}>
              <MiniStatisticsCard
                title={{ text: "Asistencia" }}
                count={attendanceCounts.present}
                percentage={{
                  color: colorPresent,
                  text: `${attendancePresentPercentage.toFixed(2)}%`,
                }}
                icon={{
                  color: "info",
                  component: moodIconPresent,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} xl={3}>
              <MiniStatisticsCard
                title={{ text: "Ausencias" }}
                count={attendanceCounts.absent}
                percentage={{
                  color: colorAbsent,
                  text: `${attendanceAbsentPercentage.toFixed(2)}%`,
                }}
                icon={{
                  color: "info",
                  component: moodIconAbsent,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} xl={3}>
              <MiniStatisticsCard
                title={{ text: "Ausencias justificadas" }}
                count={attendanceCounts.justifiedAbsence}
                icon={{
                  color: "info",
                  component: <AnalyticsIcon />,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} xl={3}>
              <MiniStatisticsCard
                title={{ text: "Ausencias injustificadas" }}
                count={attendanceCounts.unjustifiedAbsence}
                icon={{
                  color: "info",
                  component: <AnalyticsIcon />,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              />
            </Grid>
          </Grid>
        </SoftBox>

        <Grid container spacing={3}>
          <Grid item xs={12} md={12} lg={12}>
            <Card>
              <SoftBox display="flex" justifyContent="space-between" alignItems="center" p={3}>
                <SoftTypography variant="h6">Asistencia</SoftTypography>
              </SoftBox>
              <SoftBox
                sx={{
                  "& .MuiTableRow-root:not(:last-child)": {
                    "& td": {
                      borderBottom: ({ borders: { borderWidth, borderColor } }) =>
                        `${borderWidth[1]} solid ${borderColor}`,
                    },
                  },
                }}
              >
                <AttendanceHistoryTable
                  data={attendanceRecords}
                  childName={childName}
                  childFirstSurName={childFirstSurName}
                  childSecondSurName={childSecondSurName}
                  childInstrument={childInstrument}
                />{" "}
              </SoftBox>
            </Card>
          </Grid>
        </Grid>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Attendance;
