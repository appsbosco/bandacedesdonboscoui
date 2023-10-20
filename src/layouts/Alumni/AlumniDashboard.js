import { gql, useQuery } from "@apollo/client";
import Card from "@mui/material/Card";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import Footer from "examples/Footer";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import TableWithFilteringSorting from "examples/Tables/Table/Table";

import { GET_EXALUMNOS } from "graphql/queries";

const Tables = () => {
  const { data, loading, error } = useQuery(GET_EXALUMNOS);

  // Filter users by role
  const exalumnosData = data?.getExAlumnos;

  const columns = [
    { field: "fullName", headerName: "Nombre", width: 300 },
    { field: "identification", headerName: "Identificación", width: 200 },
    { field: "email", headerName: "Correo electrónico", width: 250 },
    { field: "phoneNumber", headerName: "Número de celular", width: 200 },
    { field: "yearGraduated", headerName: "Generación", width: 200 },
    { field: "instrument", headerName: "Instrumento", width: 250 },
    { field: "instrumentCondition", headerName: "¿Tiene instrumento?", width: 200 },
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
              <SoftTypography variant="h6">Exalumnos BCDB</SoftTypography>
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

export default Tables;
