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
