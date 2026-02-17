/**
=========================================================
* Banda CEDES Don Bosco - v4.0.0
=========================================================
*/

import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import Footer from "examples/Footer";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import Header from "layouts/profile/components/Header";
import { Divider } from "@mui/material";
import { useQuery } from "@apollo/client";
import { GET_PARENT_DASHBOARD } from "graphql/queries/parents";

const Overview = () => {
  const { data, loading, error } = useQuery(GET_PARENT_DASHBOARD, {
    variables: {
      dateRange: { preset: "ALL_TIME" },
    },
    fetchPolicy: "cache-and-network",
  });

  if (loading && !data) {
    return (
      <DashboardLayout>
        <Header />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
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
        <Footer />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <Header />
        <SoftBox mt={5} mb={3}>
          <Card>
            <SoftBox p={3} textAlign="center">
              <SoftTypography variant="h6" color="error">
                Error al cargar información: {error.message}
              </SoftTypography>
            </SoftBox>
          </Card>
        </SoftBox>
        <Footer />
      </DashboardLayout>
    );
  }

  const dashboard = data?.getParentDashboard;
  if (!dashboard) {
    return (
      <DashboardLayout>
        <Header />
        <SoftBox mt={5} mb={3}>
          <Card>
            <SoftBox p={3} textAlign="center">
              <SoftTypography variant="h6">No se pudo cargar la información</SoftTypography>
            </SoftBox>
          </Card>
        </SoftBox>
        <Footer />
      </DashboardLayout>
    );
  }

  const { parent, children } = dashboard;
  const firstChild = children && children.length > 0 ? children[0] : null;

  return (
    <DashboardLayout>
      <Header />
      <SoftBox mt={5} mb={3}>
        <Grid container spacing={3}>
          {/* Información del Padre/Madre */}
          <Grid item xs={12} md={6} xl={4}>
            <Card sx={{ height: "100%", minHeight: "400px" }}>
              <SoftBox
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                pt={2}
                px={2}
              >
                <SoftTypography variant="h5" fontWeight="medium">
                  Información general
                </SoftTypography>
              </SoftBox>
              <SoftBox p={2}>
                <SoftBox mb={2} lineHeight={1}>
                  <SoftTypography variant="button" color="text" fontWeight="regular">
                    Esta información puede ser editada en cualquier momento.
                  </SoftTypography>
                </SoftBox>
                <SoftBox opacity={0.3}>
                  <Divider />
                </SoftBox>
                <SoftBox>
                  <SoftBox display="flex" py={1} pr={2}>
                    <SoftTypography variant="h6" fontWeight="bold">
                      Nombre completo:
                    </SoftTypography>
                    <SoftTypography variant="body2" fontWeight="regular" ml={1}>
                      {parent.name} {parent.firstSurName} {parent.secondSurName}
                    </SoftTypography>
                  </SoftBox>
                  <SoftBox display="flex" py={1} pr={2}>
                    <SoftTypography variant="h6" fontWeight="bold">
                      Email:
                    </SoftTypography>
                    <SoftTypography variant="body2" fontWeight="regular" ml={1}>
                      {parent.email}
                    </SoftTypography>
                  </SoftBox>
                  <SoftBox display="flex" py={1} pr={2}>
                    <SoftTypography variant="h6" fontWeight="bold">
                      Celular:
                    </SoftTypography>
                    <SoftTypography variant="body2" fontWeight="regular" ml={1}>
                      {parent.phone || "N/A"}
                    </SoftTypography>
                  </SoftBox>
                  <SoftBox display="flex" py={1} pr={2}>
                    <SoftTypography variant="h6" fontWeight="bold">
                      Total de hijos:
                    </SoftTypography>
                    <SoftTypography variant="body2" fontWeight="regular" ml={1}>
                      {parent.totalChildren}
                    </SoftTypography>
                  </SoftBox>
                </SoftBox>
              </SoftBox>
            </Card>
          </Grid>

          {/* Información del Hijo/a */}
          <Grid item xs={12} md={6} xl={4}>
            <Card sx={{ height: "100%", minHeight: "400px" }}>
              <SoftBox
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                pt={2}
                px={2}
              >
                <SoftTypography variant="h5" fontWeight="medium">
                  {children.length > 1 ? "Primer hijo/a" : "Mi hijo/a"}
                </SoftTypography>
              </SoftBox>
              <SoftBox p={2}>
                <SoftBox mb={2} lineHeight={1}>
                  <SoftTypography variant="button" color="text" fontWeight="regular">
                    {children.length > 1
                      ? "Información del primer hijo/a registrado. Ver dashboard para más detalles."
                      : "Información de mi hijo/a."}
                  </SoftTypography>
                </SoftBox>
                <SoftBox opacity={0.3}>
                  <Divider />
                </SoftBox>
                {firstChild ? (
                  <SoftBox>
                    <SoftBox display="flex" py={1} pr={2}>
                      <SoftTypography variant="h6" fontWeight="bold">
                        Nombre completo:
                      </SoftTypography>
                      <SoftTypography variant="body2" fontWeight="regular" ml={1}>
                        {firstChild.child.name} {firstChild.child.firstSurName}{" "}
                        {firstChild.child.secondSurName}
                      </SoftTypography>
                    </SoftBox>
                    <SoftBox display="flex" py={1} pr={2}>
                      <SoftTypography variant="h6" fontWeight="bold">
                        Email:
                      </SoftTypography>
                      <SoftTypography variant="body2" fontWeight="regular" ml={1}>
                        {firstChild.child.email || "N/A"}
                      </SoftTypography>
                    </SoftBox>
                    <SoftBox display="flex" py={1} pr={2}>
                      <SoftTypography variant="h6" fontWeight="bold">
                        Celular:
                      </SoftTypography>
                      <SoftTypography variant="body2" fontWeight="regular" ml={1}>
                        {firstChild.child.phone || "N/A"}
                      </SoftTypography>
                    </SoftBox>
                    <SoftBox display="flex" py={1} pr={2}>
                      <SoftTypography variant="h6" fontWeight="bold">
                        Instrumento:
                      </SoftTypography>
                      <SoftTypography variant="body2" fontWeight="regular" ml={1}>
                        {firstChild.child.instrument || "N/A"}
                      </SoftTypography>
                    </SoftBox>
                    <SoftBox display="flex" py={1} pr={2}>
                      <SoftTypography variant="h6" fontWeight="bold">
                        Grado:
                      </SoftTypography>
                      <SoftTypography variant="body2" fontWeight="regular" ml={1}>
                        {firstChild.child.grade || "N/A"}
                      </SoftTypography>
                    </SoftBox>
                  </SoftBox>
                ) : (
                  <SoftBox py={2}>
                    <SoftTypography variant="body2" color="text">
                      No hay hijos vinculados a esta cuenta.
                    </SoftTypography>
                  </SoftBox>
                )}
              </SoftBox>
            </Card>
          </Grid>

          {/* Métricas de Asistencia */}
          <Grid item xs={12} md={6} xl={4}>
            <Card sx={{ height: "100%", minHeight: "400px" }}>
              <SoftBox
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                pt={2}
                px={2}
              >
                <SoftTypography variant="h5" fontWeight="medium">
                  Asistencia
                </SoftTypography>
              </SoftBox>
              <SoftBox p={2}>
                <SoftBox mb={2} lineHeight={1}>
                  <SoftTypography variant="button" color="text" fontWeight="regular">
                    Resumen de asistencia del hijo/a.
                  </SoftTypography>
                </SoftBox>
                <SoftBox opacity={0.3}>
                  <Divider />
                </SoftBox>
                {firstChild ? (
                  <SoftBox>
                    <SoftBox py={1}>
                      <SoftTypography variant="h6" fontWeight="bold" mb={1}>
                        Ensayos
                      </SoftTypography>
                      <SoftBox display="flex" justifyContent="space-between" py={0.5}>
                        <SoftTypography variant="body2" fontWeight="medium">
                          Total sesiones:
                        </SoftTypography>
                        <SoftTypography variant="body2">
                          {firstChild.attendanceMetrics.totalSessions}
                        </SoftTypography>
                      </SoftBox>
                      <SoftBox display="flex" justifyContent="space-between" py={0.5}>
                        <SoftTypography variant="body2" fontWeight="medium">
                          Presentes:
                        </SoftTypography>
                        <SoftTypography variant="body2" color="success">
                          {firstChild.attendanceMetrics.present}
                        </SoftTypography>
                      </SoftBox>
                      <SoftBox display="flex" justifyContent="space-between" py={0.5}>
                        <SoftTypography variant="body2" fontWeight="medium">
                          Tasa de asistencia:
                        </SoftTypography>
                        <SoftTypography
                          variant="body2"
                          color={
                            firstChild.attendanceMetrics.attendanceRate >= 80
                              ? "success"
                              : "warning"
                          }
                        >
                          {firstChild.attendanceMetrics.attendanceRate.toFixed(1)}%
                        </SoftTypography>
                      </SoftBox>
                    </SoftBox>

                    <SoftBox opacity={0.3} my={2}>
                      <Divider />
                    </SoftBox>

                    <SoftBox py={1}>
                      <SoftTypography variant="h6" fontWeight="bold" mb={1}>
                        Clases
                      </SoftTypography>
                      <SoftBox display="flex" justifyContent="space-between" py={0.5}>
                        <SoftTypography variant="body2" fontWeight="medium">
                          Total clases:
                        </SoftTypography>
                        <SoftTypography variant="body2">
                          {firstChild.classMetrics.totalClasses}
                        </SoftTypography>
                      </SoftBox>
                      <SoftBox display="flex" justifyContent="space-between" py={0.5}>
                        <SoftTypography variant="body2" fontWeight="medium">
                          Presentes:
                        </SoftTypography>
                        <SoftTypography variant="body2" color="success">
                          {firstChild.classMetrics.present}
                        </SoftTypography>
                      </SoftBox>
                      <SoftBox display="flex" justifyContent="space-between" py={0.5}>
                        <SoftTypography variant="body2" fontWeight="medium">
                          Pagos pendientes:
                        </SoftTypography>
                        <SoftTypography
                          variant="body2"
                          color={
                            firstChild.classMetrics.paymentSummary.totalPending > 0
                              ? "error"
                              : "success"
                          }
                        >
                          {firstChild.classMetrics.paymentSummary.totalPending}
                        </SoftTypography>
                      </SoftBox>
                    </SoftBox>
                  </SoftBox>
                ) : (
                  <SoftBox py={2}>
                    <SoftTypography variant="body2" color="text">
                      No hay datos de asistencia disponibles.
                    </SoftTypography>
                  </SoftBox>
                )}
              </SoftBox>
            </Card>
          </Grid>

          {/* Información de todos los hijos (si hay más de uno) */}
          {children.length > 1 && (
            <Grid item xs={12}>
              <Card>
                <SoftBox pt={2} px={2}>
                  <SoftTypography variant="h5" fontWeight="medium">
                    Todos mis hijos ({children.length})
                  </SoftTypography>
                </SoftBox>
                <SoftBox p={2}>
                  <Grid container spacing={2}>
                    {children.map((childData, index) => (
                      <Grid item xs={12} sm={6} md={4} key={childData.child.id}>
                        <Card variant="outlined">
                          <SoftBox p={2}>
                            <SoftTypography variant="h6" fontWeight="bold" mb={1}>
                              {childData.child.name} {childData.child.firstSurName}
                            </SoftTypography>
                            <SoftBox display="flex" justifyContent="space-between" py={0.5}>
                              <SoftTypography variant="caption">Instrumento:</SoftTypography>
                              <SoftTypography variant="caption">
                                {childData.child.instrument || "N/A"}
                              </SoftTypography>
                            </SoftBox>
                            <SoftBox display="flex" justifyContent="space-between" py={0.5}>
                              <SoftTypography variant="caption">Asistencia:</SoftTypography>
                              <SoftTypography
                                variant="caption"
                                color={
                                  childData.attendanceMetrics.attendanceRate >= 80
                                    ? "success"
                                    : "warning"
                                }
                              >
                                {childData.attendanceMetrics.attendanceRate.toFixed(1)}%
                              </SoftTypography>
                            </SoftBox>
                            <SoftBox display="flex" justifyContent="space-between" py={0.5}>
                              <SoftTypography variant="caption">Pagos pendientes:</SoftTypography>
                              <SoftTypography
                                variant="caption"
                                color={
                                  childData.classMetrics.paymentSummary.totalPending > 0
                                    ? "error"
                                    : "success"
                                }
                              >
                                {childData.classMetrics.paymentSummary.totalPending}
                              </SoftTypography>
                            </SoftBox>
                          </SoftBox>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </SoftBox>
              </Card>
            </Grid>
          )}
        </Grid>
      </SoftBox>

      <Footer />
    </DashboardLayout>
  );
};

export default Overview;
