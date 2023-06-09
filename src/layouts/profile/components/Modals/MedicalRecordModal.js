import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import PropTypes from "prop-types";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import Input from "components/Input";
import Select from "components/Select";
import TextArea from "components/TextArea";

// MedicalRecordForm component
const MedicalRecordModal = ({ open, onClose, onSubmit, initialValues, title: modalTitle }) => {
  const [identification, setIdentification] = useState(
    initialValues ? initialValues.identification : ""
  );
  const [sex, setSex] = useState(initialValues ? initialValues.sex : "");
  const [bloodType, setBloodType] = useState(initialValues ? initialValues.bloodType : "");
  const [address, setAddress] = useState(initialValues ? initialValues.address : "");
  const [familyMemberName, setFamilyMemberName] = useState(
    initialValues ? initialValues.familyMemberName : ""
  );
  const [familyMemberNumber, setFamilyMemberNumber] = useState(
    initialValues ? initialValues.familyMemberNumber : ""
  );
  const [familyMemberNumberId, setFamilyMemberNumberId] = useState(
    initialValues ? initialValues.familyMemberNumberId : ""
  );
  const [familyMemberRelationship, setFamilyMemberRelationship] = useState(
    initialValues ? initialValues.familyMemberRelationship : ""
  );
  const [familyMemberOccupation, setFamilyMemberOccupation] = useState(
    initialValues ? initialValues.familyMemberOccupation : ""
  );
  const [illness, setIllness] = useState(initialValues ? initialValues.illness : "");
  const [medicine, setMedicine] = useState(initialValues ? initialValues.medicine : "");
  const [medicineOnTour, setMedicineOnTour] = useState(
    initialValues ? initialValues.medicineOnTour : ""
  );

  const handleSubmit = () => {
    onSubmit({
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
    });
  };

  const bloodTypes = [
    { value: "A+", label: "A+" },
    { value: "A-", label: "A-" },
    { value: "B+", label: "B+" },
    { value: "B-", label: "B-" },
    { value: "AB+", label: "AB+" },
    { value: "AB-", label: "AB-" },
    { value: "O+", label: "O+" },
    { value: "O-", label: "O-" },
  ];

  const sexTypes = [
    { value: "Masculino", label: "Masculino" },
    { value: "Femenino", label: "Femenino" },
  ];

  const relationshipTypes = [
    { value: "Padre", label: "Padre" },
    { value: "Madre", label: "Madre" },
    { value: "Hijo/Hija", label: "Hijo/Hija" },
    { value: "Hermano/Hermana", label: "Hermano/Hermana" },
    { value: "Abuelo/Abuela", label: "Abuelo/Abuela" },
    { value: "Nieto/Nieta", label: "Nieto/Nieta" },
    { value: "Bisabuelo/Bisabuela", label: "Bisabuelo/Bisabuela" },
    { value: "Tío/Tía", label: "Tío/Tía" },
    { value: "Sobrino/Sobrina", label: "Sobrino/Sobrina" },
    { value: "Primo/Prima", label: "Primo/Prima" },
    { value: "Esposo/Esposa", label: "Esposo/Esposa" },
    { value: "Cuñado/Cuñada", label: "Cuñado/Cuñada" },
    { value: "Suegro/Suegra", label: "Suegro/Suegra" },
    { value: "Yerno/Nuera", label: "Yerno/Nuera" },
    { value: "Hermanastro/Hermanastra", label: "Hermanastro/Hermanastra" },
    { value: "Padrino/Madrina", label: "Padrino/Madrina" },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{modalTitle}</DialogTitle>
      <DialogContent>
        <a
          href="#0"
          className="group inline-flex items-center justify-center gap-3.5 text-base leading-5 tracking-wide text-sky-700 transition duration-200 ease-in-out hover:text-sky-600 sm:text-lg"
        >
          Información personal:
        </a>
        <SoftBox mb={1} ml={0.5}>
          <SoftTypography component="label" variant="caption" fontWeight="bold">
            Identificación
          </SoftTypography>
        </SoftBox>

        <Input
          name="identification"
          value={identification}
          onChange={(e) => setIdentification(e.target.value)}
          fullWidth
          type="text"
          id="identification"
        />
        <SoftBox mb={1} ml={0.5}>
          <SoftTypography component="label" variant="caption" fontWeight="bold">
            Sexo
          </SoftTypography>
        </SoftBox>

        <Select
          id="sex"
          name="sex"
          value={sex}
          onChange={(e) => setSex(e.target.value)}
          options={sexTypes}
          fullWidth
        />

        <SoftBox mb={1} ml={0.5}>
          <SoftTypography component="label" variant="caption" fontWeight="bold">
            Tipo de sangre
          </SoftTypography>
        </SoftBox>

        <Select
          id="bloodType"
          name="bloodType"
          value={bloodType}
          onChange={(e) => setBloodType(e.target.value)}
          options={bloodTypes}
        />

        <SoftBox mb={1} ml={0.5}>
          <SoftTypography component="label" variant="caption" fontWeight="bold">
            Dirección exacta de residencia
          </SoftTypography>
        </SoftBox>

        <TextArea
          name="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          fullWidth
          rows="5"
          placeholder=""
        />

        <hr style={{ borderBottom: "1px solid #000;", margin: "2rem" }} />

        <a
          href="#0"
          className="group inline-flex items-center justify-center gap-3.5 text-base leading-5 tracking-wide text-sky-700 transition duration-200 ease-in-out hover:text-sky-600 sm:text-lg"
        >
          Condiciones médicas:
        </a>
        <br />
        <p style={{ fontSize: "0.8rem" }}>Dejar en blanco en caso de no tener</p>

        <SoftBox mb={1} ml={0.5}>
          <SoftTypography component="label" variant="caption" fontWeight="bold">
            Enfermedades
          </SoftTypography>
        </SoftBox>

        <Input
          name="illness"
          value={illness}
          onChange={(e) => setIllness(e.target.value)}
          fullWidth
          type="text"
          id="illness"
        />
        <SoftBox mb={1} ml={0.5}>
          <SoftTypography component="label" variant="caption" fontWeight="bold">
            Medicamentos que debe tomar
          </SoftTypography>
        </SoftBox>

        <Input
          value={medicine}
          onChange={(e) => setMedicine(e.target.value)}
          fullWidth
          type="text"
          id="medicine"
        />
        <SoftBox mb={1} ml={0.5}>
          <SoftTypography component="label" variant="caption" fontWeight="bold">
            Medicamentos que debe tomar en giras de la BCDB
          </SoftTypography>
        </SoftBox>

        <Input
          name="medicineOnTour"
          value={medicineOnTour}
          onChange={(e) => setMedicineOnTour(e.target.value)}
          fullWidth
          type="text"
          id="medicineOnTour"
        />
        <hr style={{ borderBottom: "1px solid #000;", margin: "2rem" }} />

        <a
          href="#0"
          className="group inline-flex items-center justify-center gap-3.5 text-base leading-5 tracking-wide text-sky-700 transition duration-200 ease-in-out hover:text-sky-600 sm:text-lg"
        >
          Información del encargado o contacto de emergencia
        </a>
        <SoftBox mb={1} ml={0.5}>
          <SoftTypography component="label" variant="caption" fontWeight="bold">
            Nombre completo
          </SoftTypography>
        </SoftBox>

        <Input
          name="familyMemberName"
          value={familyMemberName}
          onChange={(e) => setFamilyMemberName(e.target.value)}
          fullWidth
          type="text"
          id="familyMemberName"
        />

        <SoftBox mb={1} ml={0.5}>
          <SoftTypography component="label" variant="caption" fontWeight="bold">
            Número de contacto
          </SoftTypography>
        </SoftBox>

        <Input
          name="familyMemberNumber"
          value={familyMemberNumber}
          onChange={(e) => setFamilyMemberNumber(e.target.value)}
          fullWidth
          type="text"
          id="familyMemberNumber"
        />

        <SoftBox mb={1} ml={0.5}>
          <SoftTypography component="label" variant="caption" fontWeight="bold">
            Cédula de identidad
          </SoftTypography>
        </SoftBox>

        <Input
          name="familyMemberNumberId"
          value={familyMemberNumberId}
          onChange={(e) => setFamilyMemberNumberId(e.target.value)}
          fullWidth
          type="text"
          id="familyMemberNumberId"
        />

        <SoftBox mb={1} ml={0.5}>
          <SoftTypography component="label" variant="caption" fontWeight="bold">
            Parentesco
          </SoftTypography>
        </SoftBox>

        <Select
          name="familyMemberRelationship"
          value={familyMemberRelationship}
          onChange={(e) => setFamilyMemberRelationship(e.target.value)}
          fullWidth
          options={relationshipTypes}
        />
        <SoftBox mb={1} ml={0.5}>
          <SoftTypography component="label" variant="caption" fontWeight="bold">
            Ocupación
          </SoftTypography>
        </SoftBox>

        <Input
          name="familyMemberOccupation"
          value={familyMemberOccupation}
          onChange={(e) => setFamilyMemberOccupation(e.target.value)}
          fullWidth
          type="text"
          id="familyMemberOccupation"
        />

        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} color="primary">
            Guardar
          </Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
};

MedicalRecordModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,

  initialValues: PropTypes.shape({
    identification: PropTypes.string,
    sex: PropTypes.string,
    bloodType: PropTypes.string,
    address: PropTypes.string,
    familyMemberName: PropTypes.string,
    familyMemberNumber: PropTypes.string,
    familyMemberNumberId: PropTypes.string,
    familyMemberRelationship: PropTypes.string,
    familyMemberOccupation: PropTypes.string,
    illness: PropTypes.string,
    medicine: PropTypes.string,
    medicineOnTour: PropTypes.string,
  }),
  onSubmit: PropTypes.func.isRequired,
};

MedicalRecordModal.defaultProps = {
  title: "",

  initialValues: {
    identification: "",
    sex: "",
    bloodType: "",
    address: "",
    familyMemberName: "",
    familyMemberNumber: "",
    familyMemberNumberId: "",
    familyMemberRelationship: "",
    familyMemberOccupation: "",
    illness: "",
    medicine: "",
    medicineOnTour: "",
  },
};

export default MedicalRecordModal;
