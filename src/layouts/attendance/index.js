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

// Soft UI Dashboard React base styles
import typography from "assets/theme/base/typography";

import reportsBarChartData from "layouts/dashboard/data/reportsBarChartData";
import { GET_PARENTS_BY_ID } from "graphql/queries";
import { useQuery } from "@apollo/client";
import { Card } from "@mui/material";
import AttendanceHistoryTable from "./GetAttendances";
import MoodBadIcon from "@mui/icons-material/MoodBad";

function Attendance() {
  const { size } = typography;
  const { chart, items } = reportsBarChartData;
  const { data: userData, loading: userLoading, error: userError } = useQuery(GET_PARENTS_BY_ID);
  if (!userData) {
    // Handle the case where userData is not available yet
    return (
      <div
        style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}
      >
        <p>Cargando...</p>
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
  const colorPresent = attendancePresentPercentage >= 70 ? "success" : "error";
  const colorAbsent = attendanceAbsentPercentage <= 70 ? "success" : "error";

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
                  component: <MoodBadIcon />,
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
                  component: <MoodBadIcon />,
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
                  component: <MoodBadIcon />,
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
                  component: <MoodBadIcon />,
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
