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
import { gql, useMutation, useQuery } from "@apollo/client";
import { Box, Button, Divider, Icon } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import MedicalRecordModal from "./components/Modals/MedicalRecordModal";
import { useState } from "react";
import InventoryModal from "./components/Modals/InventoryModal";
import {
  GET_USERS_BY_ID,
  GET_INVENTORY_BY_USER,
  GET_MEDICAL_RECORD_BY_USER,
} from "graphql/queries";
import {
  CREATE_MEDICAL_RECORD,
  UPDATE_MEDICAL_RECORD,
  CREATE_INVENTORY,
  UPDATE_INVENTORY,
} from "graphql/mutations";

const Overview = () => {
  const { data: userData, loading: userLoading, error: userError } = useQuery(GET_USERS_BY_ID);

  const {
    name,
    firstSurName,
    secondSurName,
    email,
    birthday,
    carnet,
    state,
    grade,
    phone,
    role,
    instrument,
  } = userData?.getUser || {};

  const userRole = userData?.getUser?.role;
  // Call the second query after the first query's data is available
  const {
    data: medicalRecordData,
    loading: medicalRecordLoading,
    error: medicalRecordError,
  } = useQuery(GET_MEDICAL_RECORD_BY_USER);

  const {
    data: inventoryData,
    loading: inventoryLoading,
    error: inventoryError,
  } = useQuery(GET_INVENTORY_BY_USER);

  const [selected, setSelected] = useState(null);
  const [modalType, setModalType] = useState(null); // "add", "edit", or "remove"
  const [openModal, setOpenModal] = useState(false);

  const [addMedicalRecord] = useMutation(CREATE_MEDICAL_RECORD, {
    refetchQueries: [{ query: GET_MEDICAL_RECORD_BY_USER }],
  });

  const [updateMedicalRecord] = useMutation(UPDATE_MEDICAL_RECORD, {
    refetchQueries: [{ query: GET_MEDICAL_RECORD_BY_USER }],
  });

  const [addInventory] = useMutation(CREATE_INVENTORY, {
    refetchQueries: [{ query: GET_INVENTORY_BY_USER }],
  });

  const [updateInventory] = useMutation(UPDATE_INVENTORY, {
    refetchQueries: [{ query: GET_INVENTORY_BY_USER }],
  });

  const handleOpenModal = (type, event = null) => {
    setModalType(type);
    setSelected(event);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setModalType(null);
    setSelected(null);
  };

  const handleAddMedicalRecord = async (medicalRecordData) => {
    await addMedicalRecord({ variables: { input: medicalRecordData } });
    handleCloseModal();
  };

  const handleAddInventory = async (inventoryData) => {
    await addInventory({ variables: { input: inventoryData } });
    handleCloseModal();
  };

  const handleUpdateMedicalRecord = async (medicalRecordData) => {
    await updateMedicalRecord({
      variables: { id: selected.id, input: medicalRecordData },
    });
    handleCloseModal();
  };
  const handleUpdateInventory = async (inventoryData) => {
    await updateInventory({
      variables: { id: selected.id, input: inventoryData },
    });
    handleCloseModal();
  };

  // This is the medical record for the user
  let identification;
  let sex;
  let bloodType;
  let address;
  let familyMemberName;
  let familyMemberNumber;
  let familyMemberNumberId;
  let familyMemberRelationship;
  let familyMemberOccupation;
  let illness = [];
  let medicine = [];
  let medicineOnTour = [];
  let allergies = [];

  const medicalRecords = medicalRecordData?.getMedicalRecordByUser || [];

  if (medicalRecords.length > 0) {
    const record = medicalRecords[0];

    identification = record.identification;
    sex = record.sex;
    bloodType = record.bloodType;
    address = record.address;
    familyMemberName = record.familyMemberName;
    familyMemberNumber = record.familyMemberNumber;
    familyMemberNumberId = record.familyMemberNumberId;
    familyMemberRelationship = record.familyMemberRelationship;
    familyMemberOccupation = record.familyMemberOccupation;
    illness = record.illness || []; // collect all illnesses
    medicine = record.medicine || []; // collect all medicines
    medicineOnTour = record.medicineOnTour || []; // collect all medicines on tour
    allergies = record.allergies || [];
  }

  const inventoryArray = inventoryData?.getInventoryByUser || [];

  const inventoryObject = inventoryArray.reduce((acc, item) => {
    const { id, condition, brand, model, numberId, serie, mainteinance, details } = item;

    acc[id] = {
      condition,
      brand,
      model,
      numberId,
      serie,
      mainteinance,
      details,
    };

    return acc;
  }, {});

  const values = Object.values(inventoryObject);
  values.forEach((item) => {});

  // Handle loading state
  if (userLoading || medicalRecordLoading)
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

  // Handle error state
  // if (userError || medicalRecordError) return <p>Error!</p>;

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
                <SoftBox key={identification} maxHeight="100%">
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
                  <SoftBox display="flex" py={1} pr={2}>
                    <SoftTypography variant="h6" fontWeight="bold" textTransform="">
                      Fecha de nacimiento:
                    </SoftTypography>
                    <SoftTypography variant="body2" fontWeight="regular" ml={1}>
                      {birthday}
                    </SoftTypography>
                  </SoftBox>
                  <SoftBox display="flex" py={1} pr={2}>
                    <SoftTypography variant="h6" fontWeight="bold" textTransform="">
                      Carnet:
                    </SoftTypography>
                    <SoftTypography variant="body2" fontWeight="regular" ml={1}>
                      {carnet ? carnet : "N/A"}
                    </SoftTypography>
                  </SoftBox>
                  <SoftBox display="flex" py={1} pr={2}>
                    <SoftTypography variant="h6" fontWeight="bold" textTransform="">
                      Estado:
                    </SoftTypography>
                    <SoftTypography variant="body2" fontWeight="regular" ml={1}>
                      {state ? state : "N/A"}
                    </SoftTypography>
                  </SoftBox>
                  <SoftBox display="flex" py={1} pr={2}>
                    <SoftTypography variant="h6" fontWeight="bold" textTransform="">
                      Año académico:
                    </SoftTypography>
                    <SoftTypography variant="body2" fontWeight="regular" ml={1}>
                      {grade ? grade : "N/A"}
                    </SoftTypography>
                  </SoftBox>
                  <SoftBox display="flex" py={1} pr={2}>
                    <SoftTypography variant="h6" fontWeight="bold" textTransform="">
                      Rol:
                    </SoftTypography>
                    <SoftTypography variant="body2" fontWeight="regular" ml={1}>
                      {role}
                    </SoftTypography>
                  </SoftBox>
                  <SoftBox display="flex" py={1} pr={2}>
                    <SoftTypography variant="h6" fontWeight="bold" textTransform="">
                      Instrumento:
                    </SoftTypography>
                    <SoftTypography variant="body2" fontWeight="regular" ml={1}>
                      {instrument ? instrument : "N/A"}
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
                  Ficha médica
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

                {medicalRecordData &&
                medicalRecordData.getMedicalRecordByUser &&
                medicalRecordData.getMedicalRecordByUser.length > 0 ? (
                  medicalRecordData.getMedicalRecordByUser.map((medicalRecord) => {
                    const {
                      identification,
                      sex,
                      bloodType,
                      address,
                      familyMemberName,
                      familyMemberNumber,
                      familyMemberNumberId,
                      familyMemberRelationship,
                      familyMemberOccupation,
                      illness,
                      medicine,
                      medicineOnTour,
                      allergies,
                    } = medicalRecord;

                    const formattedIllness = illness === "No" || !illness ? "N/A" : illness;
                    const formattedAllergies = allergies === "No" || !allergies ? "N/A" : allergies;

                    const formattedMedicine = medicine === "No" || !medicine ? "N/A" : medicine;
                    const formattedMedicineOnTour =
                      medicineOnTour === "No" || !medicineOnTour ? "N/A" : medicineOnTour;

                    return (
                      <SoftBox key={identification} maxHeight="100%">
                        <SoftBox display="flex" py={1} pr={2}>
                          <SoftTypography variant="h6" fontWeight="bold" textTransform="">
                            Cédula:
                          </SoftTypography>
                          <SoftTypography variant="body2" fontWeight="regular" ml={1}>
                            {identification}
                          </SoftTypography>
                        </SoftBox>
                        <SoftBox display="flex" py={1} pr={2}>
                          <SoftTypography variant="h6" fontWeight="bold" textTransform="">
                            Sexo:
                          </SoftTypography>
                          <SoftTypography variant="body2" fontWeight="regular" ml={1}>
                            {sex}
                          </SoftTypography>
                        </SoftBox>
                        <SoftBox display="flex" py={1} pr={2}>
                          <SoftTypography variant="h6" fontWeight="bold" textTransform="">
                            Tipo de sangre:
                          </SoftTypography>
                          <SoftTypography variant="body2" fontWeight="regular" ml={1}>
                            {bloodType}
                          </SoftTypography>
                        </SoftBox>
                        <SoftBox display="flex" py={1} pr={2}>
                          <SoftTypography variant="h6" fontWeight="bold" textTransform="">
                            Dirección:
                          </SoftTypography>
                          <SoftTypography variant="body2" fontWeight="regular" ml={1}>
                            {address}
                          </SoftTypography>
                        </SoftBox>

                        <SoftBox display="flex" py={1} pr={2}>
                          <SoftTypography variant="h6" fontWeight="bold" textTransform="">
                            Enfermedades:
                          </SoftTypography>
                          <SoftTypography variant="body2" fontWeight="regular" ml={1}>
                            {formattedIllness}
                          </SoftTypography>
                        </SoftBox>
                        <SoftBox display="flex" py={1} pr={2}>
                          <SoftTypography variant="h6" fontWeight="bold" textTransform="">
                            Medicamentos:
                          </SoftTypography>
                          <SoftTypography variant="body2" fontWeight="regular" ml={1}>
                            {formattedMedicine}
                          </SoftTypography>
                        </SoftBox>
                        <SoftBox display="flex" py={1} pr={2}>
                          <SoftTypography variant="h6" fontWeight="bold" textTransform="">
                            Medicamentos en giras de la banda:
                          </SoftTypography>
                          <SoftTypography variant="body2" fontWeight="regular" ml={1}>
                            {formattedMedicineOnTour}
                          </SoftTypography>
                        </SoftBox>

                        <SoftBox display="flex" py={1} pr={2}>
                          <SoftTypography variant="h6" fontWeight="bold" textTransform="">
                            Alergias a medicamentos
                          </SoftTypography>
                          <SoftTypography variant="body2" fontWeight="regular" ml={1}>
                            {formattedAllergies}
                          </SoftTypography>
                        </SoftBox>

                        <SoftBox display="flex" py={1} pr={2}>
                          <SoftTypography variant="h6" fontWeight="bold" textTransform="">
                            Nombre del encargado:
                          </SoftTypography>
                          <SoftTypography variant="body2" fontWeight="regular" ml={1}>
                            {familyMemberName}
                          </SoftTypography>
                        </SoftBox>
                        <SoftBox display="flex" py={1} pr={2}>
                          <SoftTypography variant="h6" fontWeight="bold" textTransform="">
                            Número del encargado:
                          </SoftTypography>
                          <SoftTypography variant="body2" fontWeight="regular" ml={1}>
                            {familyMemberNumber}
                          </SoftTypography>
                        </SoftBox>
                        <SoftBox display="flex" py={1} pr={2}>
                          <SoftTypography variant="h6" fontWeight="bold" textTransform="">
                            Cédula del encargado:
                          </SoftTypography>
                          <SoftTypography variant="body2" fontWeight="regular" ml={1}>
                            {familyMemberNumberId}
                          </SoftTypography>
                        </SoftBox>
                        <SoftBox display="flex" py={1} pr={2}>
                          <SoftTypography variant="h6" fontWeight="bold" textTransform="">
                            Parentesco del encargado:
                          </SoftTypography>
                          <SoftTypography variant="body2" fontWeight="regular" ml={1}>
                            {familyMemberRelationship}
                          </SoftTypography>
                        </SoftBox>
                        <SoftBox display="flex" py={1} pr={2}>
                          <SoftTypography variant="h6" fontWeight="bold" textTransform="">
                            Ocupación del encargado:
                          </SoftTypography>
                          <SoftTypography variant="body2" fontWeight="regular" ml={1}>
                            {familyMemberOccupation}
                          </SoftTypography>
                        </SoftBox>

                        <Button
                          variant="contained"
                          color="info"
                          style={{ marginTop: "1rem" }}
                          onClick={() => handleOpenModal("edit", medicalRecord)}
                        >
                          Editar ficha médica
                        </Button>

                        {modalType === "edit" && selected && (
                          <MedicalRecordModal
                            open={openModal}
                            onClose={handleCloseModal}
                            initialValues={selected} // Pass selected as initialValues
                            onSubmit={handleUpdateMedicalRecord}
                          />
                        )}
                      </SoftBox>
                    );
                  })
                ) : (
                  <SoftBox
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    p={2}
                    height="100%"
                  >
                    {userRole === "Padre/Madre de familia" ? (
                      <SoftBox
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                        p={2}
                        height="100%"
                      >
                        <SoftTypography variant="button" color="text" fontWeight="regular">
                          No debes de añadir la ficha médica
                        </SoftTypography>
                      </SoftBox>
                    ) : (
                      <Button
                        variant="contained"
                        color="info"
                        onClick={() => handleOpenModal("add")}
                      >
                        Añadir ficha médica
                      </Button>
                    )}
                    {modalType === "add" && (
                      <MedicalRecordModal
                        open={openModal}
                        onClose={handleCloseModal}
                        onSubmit={handleAddMedicalRecord}
                      />
                    )}
                  </SoftBox>
                )}
              </SoftBox>
            </Card>
          </Grid>

          <Grid item xs={12} md={6} xl={4}>
            <Card sx={{ height: "100%", minHeight: "400px" }}>
              <SoftBox display="flex" flexDirection="column" height="100%">
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
                <SoftBox p={2} flexGrow={1} overflow="auto">
                  <SoftBox mb={2} lineHeight={1}>
                    <SoftTypography variant="button" color="text" fontWeight="regular">
                      Esta información puede ser editada en cualquier momento.
                    </SoftTypography>
                  </SoftBox>
                  <SoftBox opacity={0.3}>
                    <Divider />
                  </SoftBox>

                  {inventoryData &&
                  inventoryData.getInventoryByUser &&
                  inventoryData.getInventoryByUser.length > 0 ? (
                    inventoryData.getInventoryByUser.map((item) => {
                      const { brand, model, numberId, serie, details, mainteinance, condition } =
                        item;

                      return (
                        <SoftBox key={numberId} maxHeight="100%">
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

                            <Button
                              variant="contained"
                              color="info"
                              style={{ marginTop: "1rem" }}
                              onClick={() => handleOpenModal("editInventory", item)}
                            >
                              Editar instrumento / inventario
                            </Button>

                            {modalType === "editInventory" && selected && (
                              <InventoryModal
                                open={openModal}
                                onClose={handleCloseModal}
                                initialValues={selected} // Pass selected as initialValues
                                onSubmit={handleUpdateInventory}
                              />
                            )}
                          </SoftBox>
                        </SoftBox>
                      );
                    })
                  ) : (
                    // Render the "Add Instrument" button if inventoryData is null or undefined
                    <SoftBox
                      display="flex"
                      flexDirection="column"
                      justifyContent="center"
                      alignItems="center"
                      p={2}
                      height="100%"
                    >
                      {userRole === "Asistente de sección" ||
                      userRole === "Principal de sección" ||
                      userRole === "Integrante BCDB" ||
                      userRole === "Admin" ? (
                        <>
                          <Button
                            variant="contained"
                            color="info"
                            onClick={() => handleOpenModal("addInventory")}
                          >
                            Añadir instrumento
                          </Button>
                          {modalType === "addInventory" && (
                            <InventoryModal
                              open={openModal}
                              onClose={handleCloseModal}
                              onSubmit={handleAddInventory}
                            />
                          )}
                        </>
                      ) : (
                        <SoftTypography variant="button" color="text" fontWeight="regular">
                          No debes de añadir ningún instrumento
                        </SoftTypography>
                      )}
                    </SoftBox>
                  )}
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
