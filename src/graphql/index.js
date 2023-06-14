import { useMutation, useQuery } from "@apollo/client";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@material-ui/core";
import gql from "graphql-tag";
import moment from "moment";
import "moment/locale/es";
import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./style.css";
import Input from "components/Input";
import TextArea from "components/TextArea";
import { GET_EVENTS } from "./queries";
import { ADD_EVENT, UPDATE_EVENT, DELETE_EVENT } from "./mutations";

const EventsCalendar = () => {
  const { loading, error, data, refetch } = useQuery(GET_EVENTS);
  const [addEvent] = useMutation(ADD_EVENT);
  const [updateEvent] = useMutation(UPDATE_EVENT);
  const [deleteEvent] = useMutation(DELETE_EVENT);

  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: "",
    place: "",
    date: "",
    time: "",
    arrival: "",
    departure: "",
    description: "",
  });

  const localizer = momentLocalizer(moment);

  useEffect(() => {
    if (data) {
      const processedEvents = data.getEvents.map((event) => ({
        ...event,
        start: new Date(parseInt(event.date)),
        end: new Date(parseInt(event.date)),
      }));
      setEvents(processedEvents);
    }
  }, [data]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEventForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (selectedEvent) {
      try {
        const { data } = await updateEvent({
          variables: {
            id: selectedEvent.id,
            input: eventForm,
          },
        });
      } catch (error) {
        console.error("Update event error:", error.message);
      }
    } else {
      try {
        const { data } = await addEvent({
          variables: {
            input: eventForm,
          },
        });
      } catch (error) {
        console.error("Add event error:", error.message);
      }
    }
    setShowModal(false);
    refetch();
  };

  const handleDelete = async () => {
    if (selectedEvent) {
      await deleteEvent({
        variables: {
          id: selectedEvent.id,
        },
      });
    }
    setShowModal(false);
    refetch();
  };

  if (loading) {
    return (
      <div
        style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}
      >
        <p>Cargando...</p>
      </div>
    );
  }
  if (error) return `Error! ${error.message}`;

  const onSelectEvent = (event) => {
    setSelectedEvent(event);
    setEventForm(event);
    setShowModal(true);
  };

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

  const closeModal = () => {
    setSelectedEvent(null);
    setShowModal(false);
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

  const onSelectSlot = (slotInfo) => {
    const { start, end } = slotInfo;
    const newEvent = {
      start: moment(start).toDate(),
      end: moment(end).toDate(),
      title: "Nuevo Evento",
      place: "",
      date: "",
      time: "",
      arrival: "",
      departure: "",
      description: "",
    };
    setSelectedEvent(null);
    setEventForm(newEvent);
    setShowModal(true);
  };

  return (
    <div style={{ height: "80vh" }}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        onSelectEvent={onSelectEvent}
        onSelectSlot={onSelectSlot}
        selectable
        eventPropGetter={eventStyleGetter}
        components={{
          toolbar: CustomToolbar,
        }}
      />
      {showModal && (
        <Dialog open={showModal} onClose={closeModal}>
          <DialogTitle>{selectedEvent ? "Editar evento" : "Añadir evento"}</DialogTitle>
          <DialogContent>
            <form onSubmit={handleFormSubmit}>
              <Input
                autoFocus
                margin="dense"
                name="title"
                label="Title"
                type="text"
                fullWidth
                value={eventForm.title}
                onChange={handleInputChange}
              />

              <Input
                margin="dense"
                name="place"
                label="Place"
                type="text"
                fullWidth
                value={eventForm.place}
                onChange={handleInputChange}
              />

              <Input
                margin="dense"
                name="date"
                label="Date"
                type="date"
                fullWidthE
                value={eventForm.date}
                onChange={handleInputChange}
              />

              <Input
                margin="dense"
                name="time"
                label="Time"
                type="text"
                fullWidth
                value={eventForm.time}
                onChange={handleInputChange}
              />

              <Input
                margin="dense"
                name="arrival"
                label="Arrival"
                type="text"
                fullWidth
                value={eventForm.arrival}
                onChange={handleInputChange}
              />

              <Input
                margin="dense"
                name="departure"
                label="Departure"
                type="text"
                fullWidth
                value={eventForm.departure}
                onChange={handleInputChange}
              />

              <TextArea
                margin="dense"
                name="description"
                label="Description"
                type="text"
                fullWidth
                value={eventForm.description}
                onChange={handleInputChange}
              />

              <DialogActions>
                <Button onClick={closeModal} color="primary">
                  Cancelar
                </Button>
                <Button type="submit" color="primary">
                  {selectedEvent ? "Actualizar" : "Añadir"}
                </Button>
                {selectedEvent && (
                  <Button color="secondary" onClick={handleDelete}>
                    Eliminar
                  </Button>
                )}
              </DialogActions>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default EventsCalendar;
