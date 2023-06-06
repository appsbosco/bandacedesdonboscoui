import PropTypes from "prop-types";

import { useMutation, useQuery } from "@apollo/client";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@material-ui/core";
import CloseIcon from "@mui/icons-material/Close";
import { Box, IconButton, Modal, Typography } from "@mui/material";
import homeDecor1 from "assets/images/home-decor-1.jpg";
import gql from "graphql-tag";
import moment from "moment";
import "moment/locale/es";
import { useEffect, useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./style.css";

const GET_USERS_BY_ID = gql`
  query getUser {
    getUser {
      id
      name
      firstSurName
      secondSurName
      email
      birthday
      carnet
      state
      grade
      phone
      role
      instrument
    }
  }
`;
// GraphQL queries and mutations
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

const EventsCalendar = () => {
  const { data: userData } = useQuery(GET_USERS_BY_ID);

  const userRole = userData?.getUser?.role;
  const { loading, error, data, refetch } = useQuery(GET_EVENTS);
  const [modalType, setModalType] = useState(null); // "add", "edit", or "remove"

  const [addEvent] = useMutation(ADD_EVENT, {
    refetchQueries: [{ query: GET_EVENTS }],
  });
  const [updateEvent] = useMutation(UPDATE_EVENT, {
    refetchQueries: [{ query: GET_EVENTS }],
  });
  const [deleteEvent] = useMutation(DELETE_EVENT, {
    refetchQueries: [{ query: GET_EVENTS }],
  });

  const [openModal, setOpenModal] = useState(false);

  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const localizer = momentLocalizer(moment);

  useEffect(() => {
    if (data) {
      const processedEvents = data.getEvents
        .map((event) => {
          // Convert the millisecond value to a valid date string
          const eventDate = new Date(parseInt(event.date, 10)).toISOString();

          // Check if the event date is valid
          if (isNaN(new Date(eventDate).getTime())) {
            console.error(`Invalid date format: ${event.date}`);
            return null; // Skip this event if the date is invalid
          }

          // Format the event date as "YYYY-MM-DD"
          const formattedDate = eventDate.slice(0, 10);

          return {
            ...event,
            start: formattedDate,
            end: formattedDate,
          };
        })
        .filter((event) => event !== null); // Remove events with invalid dates

      setEvents(processedEvents);
    }
  }, [data]);

  const handleUpdateEvent = async (eventData) => {
    await updateEvent({
      variables: { id: selectedEvent.id, input: eventData },
    });
    handleCloseModal();
  };

  if (loading) return "Loading...";
  if (error) return `Error! ${error.message}`;

  const eventStyleGetter = (event, start, end, isSelected) => {
    let style = {
      backgroundColor: "#f9f9f9",
      borderRadius: "5px",
      opacity: 0.8,
      color: "black",
      border: "1px solid #ddd",
      display: "block",
      padding: "10px",
    };
    return {
      style: style,
    };
  };

  const CustomToolbar = (toolbar) => {
    const goToBack = () => {
      toolbar.date.setMonth(toolbar.date.getMonth() - 1);
      toolbar.onNavigate("prev");
    };

    const goToNext = () => {
      toolbar.date.setMonth(toolbar.date.getMonth() + 1);
      toolbar.onNavigate("next");
    };

    const dateFormat = "MMMM yyyy";
    const currentDate = moment(toolbar.date).format(dateFormat);

    return (
      <div className="rbc-toolbar">
        <span className="rbc-btn-group">
          <button type="button" onClick={toolbar.onView.bind(null, "month")}>
            Mes
          </button>
          <button type="button" onClick={toolbar.onView.bind(null, "week")}>
            Semana
          </button>
          <button type="button" onClick={toolbar.onView.bind(null, "day")}>
            Día
          </button>
        </span>
        <span className="rbc-toolbar-label">{currentDate}</span>
        <span className="rbc-btn-group">
          <button type="button" onClick={goToBack}>
            Atrás
          </button>
          <button type="button" onClick={goToNext}>
            Siguiente
          </button>
        </span>
      </div>
    );
  };

  CustomToolbar.propTypes = {
    onView: PropTypes.func.isRequired,
    views: PropTypes.arrayOf(PropTypes.string).isRequired,
  };

  const handleAddEvent = async (eventData) => {
    await addEvent({ variables: { input: eventData } });
    handleCloseModal();
  };

  const formatTimeTo12Hour = (time) => {
    return moment(time, "HH:mm").format("h:mma");
  };

  const handleOpenModal = (type, event = null) => {
    setModalType(type);
    setSelectedEvent(event);

    if (event) {
      setSelectedEvent((prevEvent) => ({
        ...prevEvent,
        time: formatTimeTo12Hour(event.time),
        departure: formatTimeTo12Hour(event.departure),
        arrival: formatTimeTo12Hour(event.arrival),
      }));
    }

    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setModalType(null);
    setSelectedEvent(null);
  };

  console.log(events);

  return (
    <div style={{ height: "80vh" }}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        onSelectEvent={(event) => {
          if (userRole === "Admin" || userRole === "Director" || userRole === "Subdirector") {
            handleOpenModal("edit", event);
          } else {
            handleOpenModal("details", event);
          }
        }}
        onSelectSlot={() => handleOpenModal("add")}
        selectable
        eventPropGetter={eventStyleGetter}
        components={{
          toolbar: CustomToolbar,
        }}
      />

      {/* // Edit Event Modal */}
      {modalType === "edit" &&
        selectedEvent &&
        (userRole === "Admin" || userRole === "Director" || userRole === "Subdirector") && (
          <EventFormModal
            open={openModal}
            onClose={handleCloseModal}
            title="Editar evento"
            initialValues={selectedEvent}
            onSubmit={handleUpdateEvent}
          />
        )}

      {/* // Add Event Modal */}
      {modalType === "add" &&
        (userRole === "Admin" || userRole === "Director" || userRole === "Subdirector") && (
          <EventFormModal
            open={openModal}
            onClose={handleCloseModal}
            title="Agregar evento"
            onSubmit={handleAddEvent}
          />
        )}
      {/* Event Details Modal */}

      {modalType === "details" && selectedEvent && (
        <Modal
          open={openModal}
          onClose={handleCloseModal}
          sx={{ boxShadow: " rgba(100, 100, 111, 0.2) 0px 7px 29px 0px" }}
        >
          <Box
            p={3}
            sx={{
              backgroundColor: "#FFFFFF",
              boxShadow: " rgba(100, 100, 111, 0.2) 0px 7px 29px 0px",
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
              {/* Replace 'image-url' with the actual URL of the image */}
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
                    timeZone: "UTC", // Replace with the appropriate timezone
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
            value={moment(time, "HH:mm").format("h:mma")}
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

export default EventsCalendar;
