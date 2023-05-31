import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

const InventoryModal = ({ open, onClose, onSubmit, initialValues, title: modalTitle }) => {
  const [brand, setBrand] = useState(initialValues ? initialValues.brand : "");
  const [model, setModel] = useState(initialValues ? initialValues.model : "");
  const [numberId, setNumberId] = useState(initialValues ? initialValues.numberId : "");
  const [serie, setSerie] = useState(initialValues ? initialValues.serie : "");
  const [condition, setCondition] = useState(initialValues ? initialValues.condition : "");
  const [mainteinance, setMainteinance] = useState(initialValues ? initialValues.mainteinance : "");
  const [details, setDetails] = useState(initialValues ? initialValues.details : "");

  const handleSubmit = () => {
    onSubmit({
      brand,
      model,
      numberId,
      serie,
      condition,
      mainteinance,
      details,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{modalTitle}</DialogTitle>
      <DialogContent>
        <SoftBox mb={1} ml={0.5}>
          <SoftTypography component="label" variant="caption" fontWeight="bold">
            Marca
          </SoftTypography>
        </SoftBox>
        <TextField
          name="brand"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          label=""
          fullWidth
        />
        <SoftBox mb={1} ml={0.5}>
          <SoftTypography component="label" variant="caption" fontWeight="bold">
            Modelo
          </SoftTypography>
        </SoftBox>
        <TextField
          name="model"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          label=""
          fullWidth
        />
        <SoftBox mb={1} ml={0.5}>
          <SoftTypography component="label" variant="caption" fontWeight="bold">
            Número de placa
          </SoftTypography>
        </SoftBox>
        <TextField
          name="numberId"
          value={numberId}
          onChange={(e) => setNumberId(e.target.value)}
          label=""
          fullWidth
        />
        <SoftBox mb={1} ml={0.5}>
          <SoftTypography component="label" variant="caption" fontWeight="bold">
            Serie
          </SoftTypography>
        </SoftBox>
        <TextField
          name="serie"
          value={serie}
          onChange={(e) => setSerie(e.target.value)}
          label=""
          fullWidth
        />
        <SoftBox mb={1} ml={0.5}>
          <SoftTypography component="label" variant="caption" fontWeight="bold">
            Condición
          </SoftTypography>
        </SoftBox>
        <TextField
          name="condition"
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          label=""
          fullWidth
        />
        <SoftBox mb={1} ml={0.5}>
          <SoftTypography component="label" variant="caption" fontWeight="bold">
            Mantenimientos
          </SoftTypography>
        </SoftBox>
        <TextField
          name="mainteinance"
          value={mainteinance}
          onChange={(e) => setMainteinance(e.target.value)}
          label=""
          fullWidth
        />
        <SoftBox mb={1} ml={0.5}>
          <SoftTypography component="label" variant="caption" fontWeight="bold">
            Detalles
          </SoftTypography>
        </SoftBox>
        <TextField
          name="details"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          label=""
          fullWidth
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} color="primary">
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

InventoryModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  initialValues: PropTypes.shape({
    brand: PropTypes.string,
    model: PropTypes.string,
    numberId: PropTypes.string,
    serie: PropTypes.string,
    condition: PropTypes.string,
    mainteinance: PropTypes.string,
    details: PropTypes.string,
  }),
  onSubmit: PropTypes.func.isRequired,
};

InventoryModal.defaultProps = {
  title: "",
  initialValues: {
    brand: "",
    model: "",
    numberId: "",
    serie: "",
    condition: "",
    mainteinance: "",
    details: "",
  },
};

export default InventoryModal;
