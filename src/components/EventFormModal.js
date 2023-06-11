import PropTypes from "prop-types";
import { useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@material-ui/core";
import Input from "./Input";
import TextArea from "./TextArea";

const EventFormModal = ({ open, onClose, title: modalTitle, initialValues, onSubmit }) => {
  const [title, setTitle] = useState(initialValues ? initialValues.title : "");
  const [place, setPlace] = useState(initialValues ? initialValues.place : "");
  const [date, setDate] = useState(initialValues ? initialValues.date : "");
  const [time, setTime] = useState(initialValues ? initialValues.time : "");
  const [arrival, setArrival] = useState(initialValues ? initialValues.arrival : "");
  const [departure, setDeparture] = useState(initialValues ? initialValues.departure : "");
  const [description, setDescription] = useState(initialValues ? initialValues.description : "");

  const handleSubmit = () => {
    onSubmit({ title, place, date, time, arrival, departure, description });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{modalTitle}</DialogTitle>
      <DialogContent>
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ marginBottom: "0.5rem" }}>
            <label style={{ fontWeight: "bold" }}>Título del evento</label>
          </div>
          <Input
            autoFocus
            margin="dense"
            label=""
            type="text"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: "2rem" }}>
          <div style={{ marginBottom: "0.5rem" }}>
            <label style={{ fontWeight: "bold" }}>Lugar del evento</label>
          </div>
          <Input
            margin="dense"
            label=""
            type="text"
            fullWidth
            value={place}
            onChange={(e) => setPlace(e.target.value)}
          />
        </div>
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ marginBottom: "0.5rem" }}>
            <label style={{ fontWeight: "bold" }}>
              Fecha del evento <span style={{ color: "red" }}>*</span>
            </label>
          </div>
          <Input
            margin="dense"
            label=""
            type="date"
            fullWidth
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <div style={{ marginBottom: "2rem" }}>
          <div style={{ marginBottom: "0.5rem" }}>
            <label style={{ fontWeight: "bold" }}>Hora del evento</label>
          </div>
          <Input
            margin="dense"
            label=""
            type="time"
            fullWidth
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: "2rem" }}>
          <div style={{ marginBottom: "0.5rem" }}>
            <label style={{ fontWeight: "bold" }}>Hora salida de CEDES</label>
          </div>
          <Input
            margin="dense"
            label=""
            type="time"
            fullWidth
            value={departure}
            onChange={(e) => setDeparture(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: "2rem" }}>
          <div style={{ marginBottom: "0.5rem" }}>
            <label style={{ fontWeight: "bold" }}>Hora aproximada de llegada a CEDES</label>
          </div>
          <Input
            margin="dense"
            label=""
            type="time"
            fullWidth
            value={arrival}
            onChange={(e) => setArrival(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: "2rem" }}>
          <div style={{ marginBottom: "0.5rem" }}>
            <label style={{ fontWeight: "bold" }}>Descripción del evento</label>
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
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} disabled={!date} color="primary">
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

EventFormModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  initialValues: PropTypes.shape({
    title: PropTypes.string,
    place: PropTypes.string,
    date: PropTypes.string,
    time: PropTypes.string,
    arrival: PropTypes.string,
    departure: PropTypes.string,
    description: PropTypes.string,
  }),
  onSubmit: PropTypes.func.isRequired,
};

EventFormModal.defaultProps = {
  title: "",
  initialValues: {
    title: "",
    place: "",
    date: "",
    time: "",
    arrival: "",
    departure: "",
    description: "",
  },
};

export default EventFormModal;
