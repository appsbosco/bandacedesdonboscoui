import { gql, useQuery } from "@apollo/client";
import Card from "@mui/material/Card";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import Footer from "examples/Footer";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { useEffect } from "react";
import AttendanceTable from "./AttendanceTable";

const GET_USERS = gql`
  query getUsers {
    getUsers {
      id
      name
      firstSurName
      secondSurName
      instrument
      role
    }
  }
`;

const Tables = () => {
  const { loading, error, data, refetch } = useQuery(GET_USERS);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await refetch();
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    if (!loading) {
      fetchData();
    }
  }, [loading, refetch]);

  // Filter users by role
  const musiciansData =
    data?.getUsers.filter(
      (user) => user.role === "Principal de sección" || user.role === "Integrante BCDB"
    ) || [];

  const staffData =
    data?.getUsers.filter(
      (user) => user.role !== "Principal de sección" || user.role === "Integrante BCDB"
    ) || [];

  const columns = [
    { field: "name", headerName: "Nombre", width: 200 },
    { field: "firstSurName", headerName: "Primer Apellido", width: 200 },
    { field: "secondSurName", headerName: "Segundo Apellido", width: 250 },
    { field: "instrument", headerName: "Instrumento", width: 150 },
    { field: "role", headerName: "Rol", width: 200 },
  ];

  const staffColumns = [
    { field: "name", headerName: "Nombre", width: 200 },
    { field: "firstSurName", headerName: "Primer Apellido", width: 200 },
    { field: "secondSurName", headerName: "Segundo Apellido", width: 250 },
    { field: "role", headerName: "Rol", width: 200 },
  ];
  if (loading) {
    // Handle loading state
  }

  if (error) {
    // Handle error state
  }

  console.log(data); //
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <Card>
          <SoftBox display="flex" justifyContent="space-between" alignItems="center" p={3}>
            <SoftTypography variant="h6">Toma de asistencia</SoftTypography>
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
            <AttendanceTable />
          </SoftBox>
        </Card>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
};

export default Tables;
