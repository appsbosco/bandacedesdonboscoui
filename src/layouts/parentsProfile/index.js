/**
=========================================================
* Banda CEDES Don Bosco - v4.0.0
=========================================================

* Product Page: 
* Copyright 2023 Banda CEDES Don Bosco()

Coded by Josué Chinchilla

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

// @mui material components
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";

// @mui icons

// Banda CEDES Don Bosco components
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

// Banda CEDES Don Bosco examples
import Footer from "examples/Footer";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";

// Overview page components
import Header from "layouts/profile/components/Header";

// Data

// Images
import { gql, useQuery } from "@apollo/client";
import { Divider } from "@mui/material";

import { GET_PARENTS_BY_ID } from "graphql/queries";

const Overview = () => {
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
    inventory,
    medicalRecord,
    attendance,
  } = firstChild || {};

  const {
    id: inventoryId,
    brand,
    model,
    numberId,
    serie,
    condition,
    mainteinance,
    details,
  } = inventory[0] || {};

  // Extract medicalRecord fields
  const { id: medicalRecordId, identification, sex, bloodType } = medicalRecord[0] || {};

  // Extract attendance fields
  const { id: attendanceId, date, attended } = attendance[0] || {};

  return (
    <DashboardLayout>
      <Header />
      <SoftBox mt={5} mb={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6} xl={4}>
            <Card sx={{ height: "100%", minHeight: "400px" }}>
              <SoftBox
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                pt={2}
                px={2}
              >
                <SoftTypography variant="h5" fontWeight="medium" textTransform="">
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
                <SoftBox key={name} maxHeight="100%">
                  <SoftBox display="flex" py={1} pr={2}>
                    <SoftTypography variant="h6" fontWeight="bold" textTransform="">
                      Nombre completo:
                    </SoftTypography>
                    <SoftTypography variant="body2" fontWeight="regular" ml={1}>
                      {name} {firstSurName} {secondSurName}
                    </SoftTypography>
                  </SoftBox>
                  <SoftBox display="flex" py={1} pr={2}>
                    <SoftTypography variant="h6" fontWeight="bold" textTransform="">
                      Email:
                    </SoftTypography>
                    <SoftTypography variant="body2" fontWeight="regular" ml={1}>
                      {email}
                    </SoftTypography>
                  </SoftBox>
                  <SoftBox display="flex" py={1} pr={2}>
                    <SoftTypography variant="h6" fontWeight="bold" textTransform="">
                      Celular:
                    </SoftTypography>
                    <SoftTypography variant="body2" fontWeight="regular" ml={1}>
                      {phone}
                    </SoftTypography>
                  </SoftBox>
                </SoftBox>
              </SoftBox>
            </Card>
          </Grid>
          <Grid item xs={12} md={6} xl={4}>
            <Card sx={{ height: "100%", minHeight: "400px" }}>
              <SoftBox
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                pt={2}
                px={2}
              >
                <SoftTypography variant="h5" fontWeight="medium" textTransform="">
                  Mi Hijo/a
                </SoftTypography>
              </SoftBox>
              <SoftBox p={2}>
                <SoftBox mb={2} lineHeight={1}>
                  <SoftTypography variant="button" color="text" fontWeight="regular">
                    Información de mi hijo/a.
                  </SoftTypography>
                </SoftBox>
                <SoftBox opacity={0.3}>
                  <Divider />
                </SoftBox>
                <SoftBox key={name} maxHeight="100%">
                  <SoftBox display="flex" py={1} pr={2}>
                    <SoftTypography variant="h6" fontWeight="bold" textTransform="">
                      Nombre completo:
                    </SoftTypography>
                    <SoftTypography variant="body2" fontWeight="regular" ml={1}>
                      {childName} {childFirstSurName} {childSecondSurName}
                    </SoftTypography>
                  </SoftBox>
                  <SoftBox display="flex" py={1} pr={2}>
                    <SoftTypography variant="h6" fontWeight="bold" textTransform="">
                      Email:
                    </SoftTypography>
                    <SoftTypography variant="body2" fontWeight="regular" ml={1}>
                      {childEmail}
                    </SoftTypography>
                  </SoftBox>
                  <SoftBox display="flex" py={1} pr={2}>
                    <SoftTypography variant="h6" fontWeight="bold" textTransform="">
                      Celular:
                    </SoftTypography>
                    <SoftTypography variant="body2" fontWeight="regular" ml={1}>
                      {childPhone}
                    </SoftTypography>
                  </SoftBox>
                </SoftBox>
              </SoftBox>
            </Card>
          </Grid>

          <Grid item xs={12} md={6} xl={4}>
            <Card sx={{ height: "100%", minHeight: "400px" }}>
              <SoftBox
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                pt={2}
                px={2}
              >
                <SoftTypography variant="h5" fontWeight="medium" textTransform="">
                  Instrumento
                </SoftTypography>
              </SoftBox>
              <SoftBox p={2}>
                <SoftBox mb={2} lineHeight={1}>
                  <SoftTypography variant="button" color="text" fontWeight="regular">
                    Instrumento de mi hijo/a.
                  </SoftTypography>
                </SoftBox>
                <SoftBox opacity={0.3}>
                  <Divider />
                </SoftBox>
                <SoftBox key={name} maxHeight="100%">
                  <SoftBox>
                    <SoftBox display="flex" py={1} pr={2}>
                      <SoftTypography variant="h6" fontWeight="medium" textTransform="">
                        Marca:
                      </SoftTypography>
                      <SoftTypography variant="body2" fontWeight="regular" ml={1}>
                        {brand ? brand : "N/A"}
                      </SoftTypography>
                    </SoftBox>
                    <SoftBox display="flex" py={1} pr={2}>
                      <SoftTypography variant="h6" fontWeight="medium" textTransform="">
                        Modelo:
                      </SoftTypography>
                      <SoftTypography variant="body2" fontWeight="regular" ml={1}>
                        {model ? model : "N/A"}
                      </SoftTypography>
                    </SoftBox>
                    <SoftBox display="flex" py={1} pr={2}>
                      <SoftTypography variant="h6" fontWeight="medium" textTransform="">
                        Número de placa:
                      </SoftTypography>
                      <SoftTypography variant="body2" fontWeight="regular" ml={1}>
                        {numberId ? numberId : "N/A"}
                      </SoftTypography>
                    </SoftBox>
                    <SoftBox display="flex" py={1} pr={2}>
                      <SoftTypography variant="h6" fontWeight="medium" textTransform="">
                        Número de serie:
                      </SoftTypography>
                      <SoftTypography variant="body2" fontWeight="regular" ml={1}>
                        {serie ? serie : "N/A"}
                      </SoftTypography>
                    </SoftBox>
                    <SoftBox display="flex" py={1} pr={2}>
                      <SoftTypography variant="h6" fontWeight="medium" textTransform="">
                        Condición:
                      </SoftTypography>
                      <SoftTypography variant="body2" fontWeight="regular" ml={1}>
                        {condition ? condition : "N/A"}
                      </SoftTypography>
                    </SoftBox>
                    <SoftBox display="flex" py={1} pr={2}>
                      <SoftTypography variant="h6" fontWeight="medium" textTransform="">
                        Mantenimiento:
                      </SoftTypography>
                      <SoftTypography variant="body2" fontWeight="regular" ml={1}>
                        {mainteinance ? mainteinance : "N/A"}
                      </SoftTypography>
                    </SoftBox>
                    <SoftBox display="flex" py={1} pr={2}>
                      <SoftTypography variant="h6" fontWeight="medium" textTransform="">
                        Detalles:
                      </SoftTypography>
                      <SoftTypography variant="body2" fontWeight="regular" ml={1}>
                        {details ? details : "N/A"}
                      </SoftTypography>
                    </SoftBox>
                  </SoftBox>
                </SoftBox>
              </SoftBox>
            </Card>
          </Grid>
        </Grid>
      </SoftBox>

      <Footer />
    </DashboardLayout>
  );
};

export default Overview;
