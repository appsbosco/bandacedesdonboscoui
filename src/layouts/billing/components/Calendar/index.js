import PropTypes from "prop-types";

import { useMutation, useQuery } from "@apollo/client";

import CloseIcon from "@mui/icons-material/Close";
import { Box, IconButton, Modal, Typography } from "@mui/material";

import moment from "moment";
import "moment/locale/es";
import { useEffect, useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./style.css";
import LibraryMusicIcon from "@mui/icons-material/LibraryMusic";

import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined"; // @mui material components
import cover from "assets/images/about.webp";

import EventFormModal from "components/EventFormModal";
import { GET_USERS_BY_ID, GET_EVENTS } from "graphql/queries";
import { ADD_EVENT, UPDATE_EVENT, DELETE_EVENT } from "graphql/mutations";

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
      toolbar.onNavigate("PREV");
    };

    const goToNext = () => {
      toolbar.onNavigate("NEXT");
    };

    const dateFormat = "MMMM yyyy";
    const currentDate = moment(toolbar.date).format(dateFormat);

    return (
      <div className="rbc-toolbar">
        <span className="rbc-btn-group">
          <button type="button" onClick={toolbar.onView.bind(null, "month")}>
            Mes
          </button>
          {/* <button type="button" onClick={toolbar.onView.bind(null, "week")}>
            Semana
          </button>
          <button type="button" onClick={toolbar.onView.bind(null, "day")}>
            Día
          </button> */}
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
        (userRole === "Admin" || userRole === "Director" || userRole === "Dirección Logística") && (
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
        (userRole === "Admin" || userRole === "Director" || userRole === "Dirección Logística") && (
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
            <IconButton onClick={handleCloseModal}>
              <CloseIcon />
            </IconButton>
            <main>
              <article>
                <header className="relative py-16 bg-white sm:pt-24 lg:pt-28">
                  <div className="absolute inset-x-0 bottom-0 bg-white h-1/4"></div>
                  <div className="relative max-w-6xl px-4 mx-auto text-center sm:px-6 lg:px-8">
                    <a
                      href="#0"
                      className="group inline-flex items-center justify-center gap-3.5 text-base leading-5 tracking-wide text-sky-700 transition duration-200 ease-in-out hover:text-sky-600 sm:text-lg"
                    >
                      <LibraryMusicIcon />
                      Banda de marcha
                    </a>
                    <h1 className="mt-6 text-4xl font-semibold leading-tight text-center font-display text-slate-900 sm:text-5xl sm:leading-tight">
                      {selectedEvent.title}
                    </h1>
                    <p className="max-w-2xl mx-auto mt-6 text-lg leading-8 text-center text-slate-700">
                      {selectedEvent.description}
                    </p>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-8 mb-6 text-md text-slate-500">
                      <span className="flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.75"
                          stroke="currentColor"
                          className="w-6 h-6 text-slate-400"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z"
                          />
                        </svg>
                        <time dateTime="2023-02-27">
                          {" "}
                          <strong>Fecha:</strong>{" "}
                          {selectedEvent.date &&
                            new Date(Number(selectedEvent.date)).toLocaleDateString("es-ES", {
                              timeZone: "UTC", // Replace with the appropriate timezone
                            })}
                        </time>
                      </span>
                      <span className="flex items-center gap-2">
                        <PlaceOutlinedIcon fontSize="medium" className="w-6 h-6 text-slate-400" />
                        <strong>Lugar:</strong> {selectedEvent.place}
                      </span>
                      <span className="flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.75"
                          stroke="currentColor"
                          className="w-6 h-6 text-slate-400"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <strong>Hora:</strong> {selectedEvent.time}{" "}
                      </span>
                    </div>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-8 mb-6 text-md text-slate-500">
                      <span className="flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.75"
                          stroke="currentColor"
                          className="w-6 h-6 text-slate-400"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z"
                          />
                        </svg>
                        <strong>Hora de salida de CEDES:</strong> {selectedEvent.departure}
                      </span>
                      <span className="flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.75"
                          stroke="currentColor"
                          className="w-6 h-6 text-slate-400"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <strong>Hora aprox. llegada a CEDES:</strong> {selectedEvent.arrival}{" "}
                      </span>
                    </div>
                    <div className="w-full max-w-4xl mx-auto mt-16">
                      <div className="relative block w-full overflow-hidden shadow-lg aspect-w-16 aspect-h-9 rounded-3xl shadow-sky-100/50 md:aspect-w-3 md:aspect-h-2">
                        <img
                          src={cover}
                          alt=""
                          className="object-cover w-full rounded-3xl bg-slate-100"
                        />
                        <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-slate-900/10"></div>
                      </div>
                    </div>
                  </div>
                </header>

                <div className="px-4 bg-white sm:px-6 lg:px-8">
                  <div className="max-w-2xl mx-auto prose prose-lg">
                    <p></p>
                  </div>
                </div>
              </article>
            </main>
          </Box>
        </Modal>
      )}
    </div>
  );
};

export default EventsCalendar;
