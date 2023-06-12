import LibraryMusicIcon from "@mui/icons-material/LibraryMusic";
import { useState } from "react";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined"; // @mui material components
import CloseIcon from "@mui/icons-material/Close";
import { Box, IconButton, Modal } from "@mui/material";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";
import Tooltip from "@mui/material/Tooltip";
import cover from "assets/images/about.jpg";
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
import { LazyLoadImage } from "react-lazy-load-image-component";

// Data
import { gql, useMutation, useQuery } from "@apollo/client";
import homeDecor1 from "assets/images/about.jpg";
import DefaultProjectCard from "examples/Cards/ProjectCards/DefaultProjectCard";
import moment from "moment";
import Input from "components/Input";
import TextArea from "components/TextArea";
import EventFormModal from "components/EventFormModal";
import { ADD_EVENT, UPDATE_EVENT, DELETE_EVENT } from "graphql/mutations";
import { GET_EVENTS, GET_USERS } from "graphql/queries";

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
      avatar
    }
  }
`;

const SEND_EMAIL = gql`
  mutation SendEmail($input: EmailInput!) {
    sendEmail(input: $input)
  }
`;

const Dashboard = () => {
  const { data: userData } = useQuery(GET_USERS_BY_ID);

  const { data: usersData } = useQuery(GET_USERS);

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

  const [sendEmail] = useMutation(SEND_EMAIL);

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

  const handleSendEmail = (eventData) => {
    const formattedTime = new Date(`2000-01-01T${eventData.time}`).toLocaleTimeString([], {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });

    const dateObj = new Date(eventData.date);
    const formattedDate = dateObj.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const users = usersData?.getUsers;
    if (users) {
      users.forEach((user) => {
        const { email, name } = user;
        const emailContent = `
        <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
        <meta http-equiv="Content-Type" content="text/html charset=UTF-8" />
        <html lang="en">
          <head></head>
          <div
            id="__react-email-preview"
            style="
              display: none;
              overflow: hidden;
              line-height: 1px;
              opacity: 0;
              max-height: 0;
              max-width: 0;
            "
          >
          <p
          style="
            font-size: 32px;
            line-height: 1.3;
            margin: 16px 0;
            font-weight: 700;
            color: #484848;
          "
        >
          ¡Hola, ${name} ! Tienes una nueva presentación con la BCDB.
        </p>
            <div>
               ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿
            </div>
          </div>
        
          <body
            style="
              background-color: #ffffff;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu,
                Cantarell, 'Helvetica Neue', sans-serif;
            "
          >
            <table
              style="
                background-color: #ffffff;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu,
                  Cantarell, 'Helvetica Neue', sans-serif;
              "
              align="center"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
              width="100%"
            >
              <tbody>
                <tr>
                  <td>
                    <table
                      align="center"
                      role="presentation"
                      cellspacing="0"
                      cellpadding="0"
                      border="0"
                      width="100%"
                      style="max-width: 37.5em; margin: 0 auto; padding: 20px 0 48px; width: 580px"
                    >
                      <tr style="width: 100%">
                        <td>
                          <table
                            align="center"
                            border="0"
                            cellpadding="0"
                            cellspacing="0"
                            role="presentation"
                            width="100%"
                          >
                            <tbody>
                              <tr>
                                <td>
                                  <img
                                    alt="BCDB"
                                    src="https://res.cloudinary.com/dnv9akklf/image/upload/v1686511395/LOGO_BCDB_qvjabt.png"
                                    style="
                                    display: block;
                              outline: none;
                              border: none;
                              text-decoration: none;
                              margin: 0;
                              padding: 0;
                              max-width: 30%;
                              height: auto;
                                    "
                                  />
                                  <p
                                  style="
                                    font-size: 26px;
                                    line-height: 1.3;
                                    margin: 16px 0;
                                    font-weight: 700;
                                    color: #484848;
                                  "
                                >
                                  ${eventData.title} 🙌🏻 🎶
                                </p>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                          <!-- <table
                            align="center"
                            border="0"
                            cellpadding="0"
                            cellspacing="0"
                            role="presentation"
                            width="100%"
                          >
                            <tbody>
                              <tr>
                                <td>
                                  <img
                                    alt=""
                                    src="https://res.cloudinary.com/dnv9akklf/image/upload/v1686511395/LOGO_BCDB_qvjabt.png"
                                    
                                    style="
                                    display: block;
                                    outline: none;
                                    border: none;
                                    text-decoration: none;
                                    margin: 0 auto;
                                    margin-bottom: 16px;
                                    border-radius: 50%;
                                    max-width: 100%;
                                    height: auto;
                                    "
                                  />
                                </td>
                              </tr>
                            </tbody>
                          </table> -->
                          <table
                            style="padding-bottom: 20px"
                            align="center"
                            border="0"
                            cellpadding="0"
                            cellspacing="0"
                            role="presentation"
                            width="100%"
                          >
                            <tbody>
                              <tr>
                                <td>
                                  <table
                                    width="100%"
                                    align="center"
                                    role="presentation"
                                    cellspacing="0"
                                    cellpadding="0"
                                    border="0"
                                  >
                                    <tbody style="width: 100%">
                                      <tr style="width: 100%">
                                        <p
                                          style="
                                            font-size: 32px;
                                            line-height: 1.3;
                                            margin: 16px 0;
                                            font-weight: 700;
                                            color: #484848;
                                          "
                                        >
                                          ¡Hola, ${name} ! Tienes una nueva presentación con la BCDB.
                                        </p>
                                        <p
                                          style="
                                            font-size: 18px;
                                            line-height: 1.4;
                                            margin: 16px 0;
                                            color: #484848;
                                            padding: 24px;
                                            background-color: #f2f3f3;
                                            border-radius: 4px;
                                          "
                                        >
                                          “Esperamos que este correo le encuentre lleno de entusiasmo y
                                          listo/a para unirse a una nueva presentación. Nos complace
                                          anunciarle que se avecina una increíble presentación y queremos
                                          contar con cada uno de ustedes para hacer de este evento un
                                          verdadero éxito.”
                                        </p>
                                        <p
                                          style="
                                            font-size: 18px;
                                            line-height: 1.4;
                                            margin: 16px 0;
                                            color: #484848;
                                          "
                                        >
                                          Fecha:  ${formattedDate}
                                        </p>
                                        <p
                                          style="
                                            font-size: 18px;
                                            line-height: 1.4;
                                            margin: 16px 0;
                                            color: #484848;
                                          "
                                        >
                                          Hora: 
                                          ${formattedTime}
                                        </p>
                                        <p
                                          style="
                                            font-size: 18px;
                                            line-height: 1.4;
                                            margin: 16px 0;
                                            color: #484848;
                                          "
                                        >
                                          Lugar: ${eventData.place}
                                        </p>
                                        <p
                                          style="
                                            font-size: 18px;
                                            line-height: 1.4;
                                            margin: 16px 0;
                                            color: #484848;
                                            padding-bottom: 16px;
                                          "
                                        >
                                          Descripción del evento:  ${eventData.description}
                                        </p>
        
                                        <p
                                          style="
                                            font-size: 18px;
                                            line-height: 1.4;
                                            margin: 16px 0;
                                            color: #484848;
                                            padding-bottom: 16px;
                                          "
                                        >
                                          ¡Sigamos haciendo música y preparémonos para ofrecer una
                                          presentación inolvidable! ¡Nos vemos pronto!
                                        </p>
        
                                        <a
                                          href="https://bandacedesdonbosco.com/"
                                          target="_blank"
                                          style="
                                            background-color: #293964;
                                            border-radius: 3px;
                                            color: #fff;
                                            font-size: 18px;
                                            text-decoration: none;
                                            text-align: center;
                                            display: inline-block;
                                            width: 100%;
                                            p-y: 19px;
                                            line-height: 100%;
                                            max-width: 100%;
                                            padding: 19px 0px;
                                          "
                                          ><span
                                            ><!--[if mso
                                              ]><i
                                                style="
                                                  letter-spacing: undefinedpx;
                                                  mso-font-width: -100%;
                                                  mso-text-raise: 28.5;
                                                "
                                                hidden
                                                >&nbsp;</i
                                              ><!
                                            [endif]--></span
                                          ><span
                                            style="
                                              background-color: #293964;
                                              border-radius: 3px;
                                              color: #fff;
                                              font-size: 18px;
                                              text-decoration: none;
                                              text-align: center;
                                              display: inline-block;
                                              width: 100%;
                                              p-y: 19px;
                                              max-width: 100%;
                                              line-height: 120%;
                                              text-transform: none;
                                              mso-padding-alt: 0px;
                                              mso-text-raise: 14.25px;
                                            "
                                            >Ver más</span
                                          ><span
                                            ><!--[if mso
                                              ]><i
                                                style="letter-spacing: undefinedpx; mso-font-width: -100%"
                                                hidden
                                                >&nbsp;</i
                                              ><!
                                            [endif]--></span
                                          ></a
                                        >
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                          <hr
                            style="
                              width: 100%;
                              border: none;
                              border-top: 1px solid #eaeaea;
                              border-color: #cccccc;
                              margin: 20px 0;
                            "
                          />
                          <table
                            align="center"
                            border="0"
                            cellpadding="0"
                            cellspacing="0"
                            role="presentation"
                            width="100%"
                          >
                            <tbody>
                              <tr>
                                <td>
                                  <table
                                    width="100%"
                                    align="center"
                                    role="presentation"
                                    cellspacing="0"
                                    cellpadding="0"
                                    border="0"
                                  >
                                    <tbody style="width: 100%">
                                      <tr style="width: 100%">
                                        <p
                                          style="
                                            font-size: 14px;
                                            line-height: 24px;
                                            margin: 16px 0;
                                            color: #9ca299;
                                            margin-bottom: 10px;
                                          "
                                        >
                                          Copyright © 2023 Banda CEDES Don Bosco. Todos los derechos
                                          reservados
                                        </p>
                                        <a
                                          target="_blank"
                                          style="
                                            color: #9ca299;
                                            text-decoration: underline;
                                            font-size: 14px;
                                          "
                                          href="https://bandacedesdonbosco.com/"
                                        ></a>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </body>
        </html>
        
  `;
        sendEmail({
          variables: {
            input: {
              to: email,
              subject: "Tienes una nueva presentación con la BCDB",
              text: "",
              html: emailContent,
            },
          },
        })
          .then(({ data }) => {
            if (data.sendEmail) {
              console.log("Email sent successfully");
            } else {
              console.log("Failed to send email");
            }
          })
          .catch((error) => {
            console.error("Error sending email:", error);
          });
      });
    }
  };

  const handleAddEvent = async (eventData) => {
    await addEvent({ variables: { input: eventData } });
    handleSendEmail(eventData);
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
                {eventData?.getEvents && eventData?.getEvents.length === 0 ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                    }}
                  >
                    <p>No tienes eventos próximos</p>
                  </div>
                ) : (
                  <Grid
                    container
                    spacing={3}
                    style={{
                      display: "flex",
                      flexWrap: "nowrap",
                      overflowX: "auto",
                      height: "100%",
                    }}
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
                )}
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
                                    new Date(Number(selectedEvent.date)).toLocaleDateString(
                                      "es-ES",
                                      {
                                        timeZone: "UTC", // Replace with the appropriate timezone
                                      }
                                    )}
                                </time>
                              </span>
                              <span className="flex items-center gap-2">
                                <PlaceOutlinedIcon
                                  fontSize="medium"
                                  className="w-6 h-6 text-slate-400"
                                />
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
                                <strong>Hora aprox. llegada a CEDES:</strong>{" "}
                                {selectedEvent.arrival}
                              </span>
                            </div>
                            <div className="w-full max-w-4xl mx-auto mt-16">
                              <div className="relative block w-full overflow-hidden shadow-lg aspect-w-16 aspect-h-9 rounded-3xl shadow-sky-100/50 md:aspect-w-3 md:aspect-h-2">
                                <LazyLoadImage
                                  src={cover}
                                  alt=""
                                  effect="opacity"
                                  style={{
                                    objectFit: "cover",
                                    width: "100%",
                                    height: "100%",
                                  }}
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
            </Card>
          </SoftBox>
        </SoftBox>
      </SoftBox>

      <Footer />
    </DashboardLayout>
  );
};

export default Dashboard;
