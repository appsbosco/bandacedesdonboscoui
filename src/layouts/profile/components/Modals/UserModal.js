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

// UserModal component
const UserModal = ({ open, onClose, onSubmit, initialValues, title: modalTitle }) => {
  const [name, setName] = useState(initialValues ? initialValues.name : "");
  const [firstSurName, setFirstSurName] = useState(initialValues ? initialValues.firstSurName : "");
  const [secondSurName, setSecondSurName] = useState(
    initialValues ? initialValues.secondSurName : ""
  );
  const [birthday, setBirthday] = useState(initialValues ? initialValues.birthday : "");
  const [carnet, setCarnet] = useState(initialValues ? initialValues.carnet : "");
  const [state, setState] = useState(initialValues ? initialValues.state : "");
  const [grade, setGrade] = useState(initialValues ? initialValues.grade : "");
  const [phone, setPhone] = useState(initialValues ? initialValues.phone : "");
  const [instrument, setInstrument] = useState(initialValues ? initialValues.instrument : "");

  const handleSubmit = () => {
    onSubmit({
      name,
      firstSurName,
      secondSurName,
      birthday,
      carnet,
      state,
      grade,
      phone,
      instrument,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{modalTitle}</DialogTitle>
      <DialogContent>
        <TextField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          margin="normal"
        />

        <TextField
          label="First Surname"
          value={firstSurName}
          onChange={(e) => setFirstSurName(e.target.value)}
          fullWidth
          margin="normal"
        />

        <TextField
          label="Second Surname"
          value={secondSurName}
          onChange={(e) => setSecondSurName(e.target.value)}
          fullWidth
          margin="normal"
        />

        <TextField
          label="Birthday"
          value={birthday}
          onChange={(e) => setBirthday(e.target.value)}
          fullWidth
          margin="normal"
        />

        <TextField
          label="Carnet"
          value={carnet}
          onChange={(e) => setCarnet(e.target.value)}
          fullWidth
          margin="normal"
        />

        <TextField
          label="State"
          value={state}
          onChange={(e) => setState(e.target.value)}
          fullWidth
          margin="normal"
        />

        <TextField
          label="Grade"
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          fullWidth
          margin="normal"
        />

        <TextField
          label="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          fullWidth
          margin="normal"
        />

        <TextField
          label="Instrument"
          value={instrument}
          onChange={(e) => setInstrument(e.target.value)}
          fullWidth
          margin="normal"
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

UserModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  initialValues: PropTypes.shape({
    name: PropTypes.string,
    firstSurName: PropTypes.string,
    secondSurName: PropTypes.string,

    birthday: PropTypes.string,
    carnet: PropTypes.string,
    state: PropTypes.string,

    grade: PropTypes.string,
    phone: PropTypes.string,
    instrument: PropTypes.string,
  }),
  onSubmit: PropTypes.func.isRequired,
};

UserModal.defaultProps = {
  title: "",
  initialValues: {
    name: "",
    firstSurName: "",
    secondSurName: "",
    birthday: "",
    carnet: "",
    state: "",

    grade: "",
    phone: "",
    instrument: "",
  },
};

export default UserModal;
