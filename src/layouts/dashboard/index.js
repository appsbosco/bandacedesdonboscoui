import PropTypes from "prop-types";
import { useState } from "react";

// @mui material components
import CloseIcon from "@mui/icons-material/Close";
import { Box, IconButton, Modal, TextField, Typography } from "@mui/material";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";
import Tooltip from "@mui/material/Tooltip";

// BCDB React components
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

// BCDB React examples
import Footer from "examples/Footer";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

// BCDB React base styles

// Dashboard layout components
import BuildByDevelopers from "layouts/dashboard/components/BuildByDevelopers";
import WorkWithTheRockets from "layouts/dashboard/components/WorkWithTheRockets";

// Data
import { gql, useMutation, useQuery } from "@apollo/client";
import homeDecor1 from "assets/images/home-decor-1.jpg";
import DefaultProjectCard from "examples/Cards/ProjectCards/DefaultProjectCard";
import moment from "moment";

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

const GET_EVENTS = gql`
  query getEvents {
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
  mutation newEvent($input: EventInput!) {
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
  mutation updateEvent($id: ID!, $input: EventInput!) {
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
  mutation deleteEvent($id: ID!) {
    deleteEvent(id: $id)
  }
`;

const Dashboard = () => {
  const { data: userData } = useQuery(GET_USERS_BY_ID);

  const userRole = userData?.getUser?.role;

  const { data: eventData, loading: eventLoading, error: eventError } = useQuery(GET_EVENTS);
  const [openModal, setOpenModal] = useState(false);
  const [modalType, setModalType] = useState(null); // "add", "edit", or "remove"
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [addEvent] = useMutation(ADD_EVENT, {
    refetchQueries: [{ query: GET_EVENTS }],
  });
  const [updateEvent] = useMutation(UPDATE_EVENT, {
    refetchQueries: [{ query: GET_EVENTS }],
  });
  const [deleteEvent] = useMutation(DELETE_EVENT, {
    refetchQueries: [{ query: GET_EVENTS }],
  });

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

  const handleAddEvent = async (eventData) => {
    await addEvent({ variables: { input: eventData } });
    handleCloseModal();
  };

  const handleUpdateEvent = async (eventData) => {
    await updateEvent({
      variables: { id: selectedEvent.id, input: eventData },
    });
    handleCloseModal();
  };

  const handleDeleteEvent = async () => {
    await deleteEvent({ variables: { id: selectedEvent.id } });
    handleCloseModal();
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <SoftBox mb={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={7}>
              <BuildByDevelopers />
            </Grid>
            <Grid item xs={12} lg={5}>
              <WorkWithTheRockets />
            </Grid>
          </Grid>
        </SoftBox>
        <SoftBox mb={3}>
          <SoftBox mb={3} style={{ overflowX: "auto" }}>
            <Card>
              <SoftBox pt={2} px={2} style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <SoftBox mb={0.5}>
                    <SoftTypography variant="h6" fontWeight="medium">
                      Próximos Eventos
                    </SoftTypography>
                  </SoftBox>
                  <SoftBox mb={1}>
                    <SoftTypography variant="button" fontWeight="regular" color="text">
                      Resumen de los próximos eventos de la BCDB
                    </SoftTypography>
                  </SoftBox>
                </div>
                {userRole !== "Admin" &&
                userRole !== "Director" &&
                userRole !== "Subdirector" ? null : (
                  <SoftTypography variant="body2" color="secondary">
                    <Tooltip placement="top">
                      <Icon onClick={() => handleOpenModal("add")}>add</Icon>
                    </Tooltip>
                  </SoftTypography>
                )}
              </SoftBox>
              {/* Other components */}
              <SoftBox p={2} style={{ minWidth: "100%", height: "100%" }}>
                <Grid
                  container
                  spacing={3}
                  style={{ display: "flex", flexWrap: "nowrap", overflowX: "auto", height: "100%" }}
                >
                  {eventData &&
                    eventData.getEvents.map((event) => {
                      const formattedDate = new Date(event.date).toLocaleDateString("en-GB");
                      return (
                        <Grid
                          item
                          xs={12}
                          md={6}
                          xl={3}
                          key={event.id}
                          style={{
                            minWidth: "350px",
                            flexShrink: 0,
                            maxWidth: "100%",
                            minHeight: "100%",
                          }}
                        >
                          <DefaultProjectCard
                            style={{
                              minWidth: "100%",
                              maxWidth: "100%",
                              minHeight: "100%",
                            }}
                            image={homeDecor1}
                            label={`Lugar: ${event.place}`}
                            title={`${event.title}`}
                            description={`${event.description}`}
                            actions={[
                              {
                                type: "internal",
                                route: "",
                                color: "info",
                                label: "Ver más",
                                onClick: () => handleOpenModal("details", event),
                              },
                              {
                                type: "internal",
                                route: "",
                                color: "info",
                                label: "Editar",
                                onClick: () => handleOpenModal("edit", event),
                              },
                              {
                                type: "internal",
                                route: "", // Add the route for remove event
                                color: "error", // Use a suitable color for remove event
                                label: "Eliminar",
                                icon: "delete", // Add the icon for remove event (replace with the appropriate icon name if needed)
                                onClick: () => handleOpenModal("remove", event),
                              },
                            ].filter(Boolean)}
                            handleVerMasClick={() => handleOpenModal("details", event)}
                            handleEditarClick={() => handleOpenModal("edit", event)}
                            handleRemoveClick={() => handleOpenModal("remove", event)}
                          />
                        </Grid>
                      );
                    })}
                </Grid>
              </SoftBox>
              {/* Event Details Modal */}

              {/* Add Event Modal */}
              {modalType === "add" && (
                <EventFormModal
                  open={openModal}
                  onClose={handleCloseModal}
                  title="Agregar evento"
                  onSubmit={handleAddEvent}
                />
              )}

              {/* Edit Event Modal */}
              {modalType === "edit" && selectedEvent && (
                <EventFormModal
                  open={openModal}
                  onClose={handleCloseModal}
                  title="Editar evento"
                  initialValues={selectedEvent}
                  onSubmit={handleUpdateEvent}
                />
              )}

              {/* Remove Event Modal */}
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
            </Card>
          </SoftBox>
        </SoftBox>
      </SoftBox>

      <Footer />
    </DashboardLayout>
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

export default Dashboard;
