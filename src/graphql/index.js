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
