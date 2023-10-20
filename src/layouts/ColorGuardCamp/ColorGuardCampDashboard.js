import { gql, useQuery } from "@apollo/client";
import Card from "@mui/material/Card";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import Footer from "examples/Footer";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import TableWithFilteringSorting from "examples/Tables/Table/Table";
import { GET_COLOR_GUARD_CAMP_REGISTRATION } from "graphql/queries";

const ColorGuardCampDashboard = () => {
  const { data, loading, error } = useQuery(GET_COLOR_GUARD_CAMP_REGISTRATION);

  // Filter users by role
  const exalumnosData = data?.getColorGuardCampRegistrations;

  const columns = [
    { field: "teamName", headerName: "Nombre del equipo", width: 300 },
    { field: "instructorName", headerName: "Nombre del líder/instructor", width: 300 },
    { field: "participantQuantity", headerName: "Participantes", width: 200 },
    { field: "email", headerName: "Correo electrónico", width: 250 },
    { field: "phoneNumber", headerName: "Número de celular", width: 200 },
  ];

  if (loading) {
    // Handle loading state
  }

  if (error) {
    // Handle error state
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <SoftBox mb={3}>
          <Card>
            <SoftBox display="flex" justifyContent="space-between" alignItems="center" p={3}>
              <SoftTypography variant="h6">Inscripciones Color Guard Camp</SoftTypography>
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
              <TableWithFilteringSorting
                data={exalumnosData || []}
                columns={columns}
                height={700}
              />
            </SoftBox>
          </Card>
        </SoftBox>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
};

export default ColorGuardCampDashboard;
