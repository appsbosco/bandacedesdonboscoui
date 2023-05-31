import PropTypes from "prop-types";

import { useMutation, useQuery } from "@apollo/client";
import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Modal,
  TextField,
  Typography,
} from "@mui/material";
import { gql } from "graphql-tag";
import moment from "moment";
import { useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";

const localizer = momentLocalizer(moment);

const GET_EVENTS = gql`
  query GetEvents {
    getEvents {
      id
      title
      place
      date
      time
      arrival
      departure
      description
    }
  }
`;

const ADD_EVENT = gql`
  mutation AddEvent($input: EventInput!) {
    newEvent(input: $input) {
      id
      title
      place
      date
      time
      arrival
      departure
      description
    }
  }
`;

const UPDATE_EVENT = gql`
  mutation UpdateEvent($id: ID!, $input: EventInput!) {
    updateEvent(id: $id, input: $input) {
      id
      title
      place
      date
      time
      arrival
      departure
      description
    }
  }
`;

const DELETE_EVENT = gql`
  mutation DeleteEvent($id: ID!) {
    deleteEvent(id: $id)
  }
`;

const ReactCalendar = () => {
  const [openModal, setOpenModal] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const { data: eventData, loading: eventLoading, error: eventError } = useQuery(GET_EVENTS);
  const [addEvent] = useMutation(ADD_EVENT, {
    refetchQueries: [{ query: GET_EVENTS }],
  });
  const [updateEvent] = useMutation(UPDATE_EVENT, {
    refetchQueries: [{ query: GET_EVENTS }],
  });
  const [deleteEvent] = useMutation(DELETE_EVENT, {
    refetchQueries: [{ query: GET_EVENTS }],
  });

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setOpenModal(true);
    setModalType("details");
  };

  const handleAddEvent = (newEvent) => {
    addEvent({
      variables: { input: newEvent },
    });
    setOpenModal(false);
  };

  const handleUpdateEvent = (updatedEvent) => {
    updateEvent({
      variables: { id: selectedEvent.id, input: updatedEvent },
    });
    setOpenModal(false);
  };

  const handleDeleteEvent = () => {
    deleteEvent({
      variables: { id: selectedEvent.id },
    });
    setOpenModal(false);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const events = eventData ? eventData.getEvents : [];
  console.log(events);
  return (
    <div>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="date"
        endAccessor="time"
        onSelectEvent={handleEventClick}
      />

      {modalType === "details" && selectedEvent && (
        <Modal
          open={openModal}
          onClose={handleCloseModal}
          sx={{
            boxShadow: "rgba(100, 100, 111, 0.2) 0px 7px 29px 0px",
          }}
        >
          <Box
            p={3}
            sx={{
              backgroundColor: "#FFFFFF",
              boxShadow: "rgba(100, 100, 111, 0.2) 0px 7px 29px 0px",
              maxWidth: "90%",
              width: "50%",
              borderRadius: "4px",
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              maxHeight: "90%",
              overflowY: "auto",
              "@media (max-width: 900px)": {
                width: "90%",
              },
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
              <Typography variant="h6" fontWeight="medium">
                Detalles del evento
              </Typography>
              <IconButton onClick={handleCloseModal}>
                <CloseIcon />
              </IconButton>
            </Box>

            <Box display="flex" alignItems="center" justifyContent="center" mb={3}>
              <img
                src={homeDecor1}
                alt="Event"
                style={{ width: "100%", maxWidth: "100%", height: "auto" }}
              />
            </Box>

            <Box mb={3}>
              <Typography variant="body1">
                <strong>Título:</strong> {selectedEvent.title}
              </Typography>
            </Box>

            <Box mb={3}>
              <Typography variant="body1">
                <strong>Lugar:</strong> {selectedEvent.place}
              </Typography>
            </Box>

            <Box mb={3}>
              <Typography variant="body1">
                <strong>Fecha:</strong>{" "}
                {selectedEvent.date &&
                  new Date(Number(selectedEvent.date)).toLocaleDateString("es-ES", {
                    timeZone: "UTC",
                  })}
              </Typography>
            </Box>

            <Box mb={3}>
              <Typography variant="body1">
                <strong>Hora:</strong> {selectedEvent.time}
              </Typography>
            </Box>

            <Box mb={3}>
              <Typography variant="body1">
                <strong>Hora de salida de CEDES:</strong> {selectedEvent.departure}
              </Typography>
            </Box>

            <Box mb={3}>
              <Typography variant="body1">
                <strong>Hora aproximada de llegada a CEDES:</strong> {selectedEvent.arrival}
              </Typography>
            </Box>

            <Box mb={3}>
              <Typography variant="body1">
                <strong>Descripción:</strong> {selectedEvent.description}
              </Typography>
            </Box>
          </Box>
        </Modal>
      )}

      {modalType === "remove" && (
        <Dialog open={openModal} onClose={handleCloseModal}>
          <DialogTitle>Eliminar evento</DialogTitle>
          <DialogContent>¿Estás seguro de que quieres eliminar este evento?</DialogContent>
          <DialogActions>
            <Button onClick={handleCloseModal}>Cancelar</Button>
            <Button onClick={handleDeleteEvent} color="secondary">
              Eliminar
            </Button>
          </DialogActions>
        </Dialog>
      )}

      <EventFormModal
        open={openModal}
        onClose={handleCloseModal}
        title={modalType === "edit" ? "Editar evento" : "Agregar evento"}
        initialValues={selectedEvent}
        onSubmit={modalType === "edit" ? handleUpdateEvent : handleAddEvent}
      />
    </div>
  );
};

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
          <TextField
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
          <TextField
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
            <label style={{ fontWeight: "bold" }}>Fecha del evento</label>
          </div>
          <TextField
            margin="dense"
            label=""
            type="date"
            fullWidth
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: "2rem" }}>
          <div style={{ marginBottom: "0.5rem" }}>
            <label style={{ fontWeight: "bold" }}>Hora del evento</label>
          </div>
          <TextField
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
            <label style={{ fontWeight: "bold" }}>Hora de salida de CEDES</label>
          </div>
          <TextField
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
          <TextField
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
          <TextField
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
        <Button onClick={handleSubmit} color="primary">
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

export default ReactCalendar;
