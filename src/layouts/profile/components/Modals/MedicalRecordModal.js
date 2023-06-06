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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{modalTitle}</DialogTitle>
      <DialogContent>
        <SoftBox mb={1} ml={0.5}>
          <SoftTypography component="label" variant="caption" fontWeight="bold">
            Identificación
          </SoftTypography>
        </SoftBox>
        <TextField
          name="identification"
          value={identification}
          onChange={(e) => setIdentification(e.target.value)}
          fullWidth
        />
        <SoftBox mb={1} ml={0.5}>
          <SoftTypography component="label" variant="caption" fontWeight="bold">
            Sexo
          </SoftTypography>
        </SoftBox>
        <TextField name="sex" value={sex} onChange={(e) => setSex(e.target.value)} fullWidth />
        <SoftBox mb={1} ml={0.5}>
          <SoftTypography component="label" variant="caption" fontWeight="bold">
            Tipo de sangre
          </SoftTypography>
        </SoftBox>
        <TextField
          name="bloodType"
          value={bloodType}
          onChange={(e) => setBloodType(e.target.value)}
          fullWidth
        />
        <SoftBox mb={1} ml={0.5}>
          <SoftTypography component="label" variant="caption" fontWeight="bold">
            Dirección
          </SoftTypography>
        </SoftBox>
        <TextField
          name="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          fullWidth
        />
        <SoftBox mb={1} ml={0.5}>
          <SoftTypography component="label" variant="caption" fontWeight="bold">
            Nombre del encargado
          </SoftTypography>
        </SoftBox>
        <TextField
          name="familyMemberName"
          value={familyMemberName}
          onChange={(e) => setFamilyMemberName(e.target.value)}
          fullWidth
        />
        <SoftBox mb={1} ml={0.5}>
          <SoftTypography component="label" variant="caption" fontWeight="bold">
            Número del encargado
          </SoftTypography>
        </SoftBox>
        <TextField
          name="familyMemberNumber"
          value={familyMemberNumber}
          onChange={(e) => setFamilyMemberNumber(e.target.value)}
          fullWidth
        />
        <SoftBox mb={1} ml={0.5}>
          <SoftTypography component="label" variant="caption" fontWeight="bold">
            Cédula del encargado
          </SoftTypography>
        </SoftBox>
        <TextField
          name="familyMemberNumberId"
          value={familyMemberNumberId}
          onChange={(e) => setFamilyMemberNumberId(e.target.value)}
          fullWidth
        />
        <SoftBox mb={1} ml={0.5}>
          <SoftTypography component="label" variant="caption" fontWeight="bold">
            Parentesco del encargado
          </SoftTypography>
        </SoftBox>
        <TextField
          name="familyMemberRelationship"
          value={familyMemberRelationship}
          onChange={(e) => setFamilyMemberRelationship(e.target.value)}
          fullWidth
        />
        <SoftBox mb={1} ml={0.5}>
          <SoftTypography component="label" variant="caption" fontWeight="bold">
            Ocupación del encargado
          </SoftTypography>
        </SoftBox>
        <TextField
          name="familyMemberOccupation"
          value={familyMemberOccupation}
          onChange={(e) => setFamilyMemberOccupation(e.target.value)}
          fullWidth
        />
        <SoftBox mb={1} ml={0.5}>
          <SoftTypography component="label" variant="caption" fontWeight="bold">
            Enfermedades
          </SoftTypography>
        </SoftBox>
        <TextField
          name="illness"
          value={illness}
          onChange={(e) => setIllness(e.target.value)}
          fullWidth
        />
        <SoftBox mb={1} ml={0.5}>
          <SoftTypography component="label" variant="caption" fontWeight="bold">
            Medicamentos que debe tomar
          </SoftTypography>
        </SoftBox>
        <TextField
          name="medicine"
          value={medicine}
          onChange={(e) => setMedicine(e.target.value)}
          fullWidth
        />
        <SoftBox mb={1} ml={0.5}>
          <SoftTypography component="label" variant="caption" fontWeight="bold">
            Medicamentos que debe tomar en giras de la BCDB
          </SoftTypography>
        </SoftBox>
        <TextField
          name="medicineOnTour"
          value={medicineOnTour}
          onChange={(e) => setMedicineOnTour(e.target.value)}
          fullWidth
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
