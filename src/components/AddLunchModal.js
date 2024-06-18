import PropTypes from "prop-types";
import { useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@material-ui/core";
import Input from "./Input";
import TextArea from "./TextArea";
import Select from "./Select";
import { FormControl, FormControlLabel } from "@mui/material";
import { CheckBox } from "@material-ui/icons";

const AddLunchModal = ({ open, onClose, name: modalTitle, initialValues, onSubmit }) => {
  const [name, setName] = useState(initialValues ? initialValues.name : "");
  const [description, setDescription] = useState(initialValues ? initialValues.description : "");
  const [price, setPrice] = useState(initialValues ? initialValues.price : "");
  const [availableForDays, setAvailableForDays] = useState(
    initialValues ? initialValues.availableForDays : ""
  );
  const [photo, setPhoto] = useState(initialValues ? initialValues.photo : "");
  const [closingDate, setClosingDate] = useState(initialValues ? initialValues.closingDate : "");
  const [category, setCategory] = useState(initialValues ? initialValues.category : "");

  const handleSubmit = () => {
    const dateWithCST = new Date(closingDate + ":00-06:00"); // Agrega ':00' para segundos y '-06:00' para offset de Costa Rica

    onSubmit({
      name,
      closingDate: dateWithCST.toISOString(),
      category,
      price,
      availableForDays,
      photo,
      description,
    });
  };

  const categories = [
    { value: "Bebidas", label: "Bebidas" },
    { value: "Almuerzo", label: "Almuerzo" },
    { value: "Postres", label: "Postres" },
  ];

  const daysOptions = [
    { value: "Sábado", label: "Sábado" },
    { value: "Domingo", label: "Domingo" },
  ];

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{modalTitle}</DialogTitle>
      <DialogContent>
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ marginBottom: "0.5rem" }}>
            <label style={{ fontWeight: "bold" }}>Nombre del producto</label>
          </div>
          <Input
            autoFocus
            margin="dense"
            label=""
            type="text"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: "2rem" }}>
          <div style={{ marginBottom: "0.5rem" }}>
            <label style={{ fontWeight: "bold" }}>Descripción</label>
          </div>
          <TextArea
            margin="dense"
            label=""
            type="text"
            fullWidth
            inputProps={{
              style: {
                height: "50px",
                width: "100%",
              },
            }}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ marginBottom: "0.5rem" }}>
            <label style={{ fontWeight: "bold" }}>Categoría</label>
          </div>

          <Select
            id="type"
            name="type"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={categories}
          />
        </div>

        <div style={{ marginBottom: "2rem" }}>
          <div style={{ marginBottom: "0.5rem" }}>
            <label style={{ fontWeight: "bold" }}>Precio del producto</label>
          </div>
          <Input
            autoFocus
            margin="dense"
            label=""
            type="number"
            fullWidth
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: "2rem" }}>
          <div style={{ marginBottom: "0.5rem" }}>
            <label style={{ fontWeight: "bold" }}>
              Fecha de cierre <span style={{ color: "red" }}>*</span>
            </label>
          </div>
          <Input
            margin="dense"
            label=""
            type="datetime-local"
            fullWidth
            value={closingDate}
            onChange={(e) => setClosingDate(e.target.value)}
            required
          />
        </div>

        <div style={{ marginBottom: "2rem" }}>
          <div style={{ marginBottom: "0.5rem" }}>
            <label style={{ fontWeight: "bold" }}>Link foto del producto</label>
          </div>
          <Input
            autoFocus
            margin="dense"
            label=""
            type="text"
            fullWidth
            value={photo}
            onChange={(e) => setPhoto(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: "2rem" }}>
          <div style={{ marginBottom: "0.5rem" }}>
            <label style={{ fontWeight: "bold" }}>Días Disponibles</label>
          </div>
          <Select
            id="type"
            name="type"
            value={availableForDays}
            onChange={(e) => setAvailableForDays(e.target.value)}
            options={daysOptions}
          />
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} disabled={!closingDate} color="primary">
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

AddLunchModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  name: PropTypes.string,
  initialValues: PropTypes.shape({
    name: PropTypes.string,
    closingDate: PropTypes.string,
    category: PropTypes.string,
    price: PropTypes.string,
    description: PropTypes.string,
    photo: PropTypes.string,
    availableForDays: PropTypes.string,
  }),
  onSubmit: PropTypes.func.isRequired,
};

AddLunchModal.defaultProps = {
  name: "",
  initialValues: {
    name: "",
    closingDate: "",
    category: "",
    price: "",
    description: "",
    photo: "",
    availableForDays: "",
  },
};

export default AddLunchModal;
