import LibraryMusicIcon from "@mui/icons-material/LibraryMusic";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import CloseIcon from "@mui/icons-material/Close";

import { useCallback, useEffect, useMemo, useState } from "react";
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

import { LazyLoadImage } from "react-lazy-load-image-component";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import Footer from "examples/Footer";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import BuildByDevelopers from "layouts/dashboard/components/BuildByDevelopers";
import WorkWithTheRockets from "layouts/dashboard/components/WorkWithTheRockets";

import DefaultProjectCard from "examples/Cards/ProjectCards/DefaultProjectCard";
import EventFormModal from "components/EventFormModal";

import { gql, useMutation, useQuery } from "@apollo/client";
import moment from "moment";

import {
  ADD_EVENT,
  UPDATE_EVENT,
  DELETE_EVENT,
  UPDATE_NOTIFICATION_TOKEN,
} from "graphql/mutations";
import { GET_EVENTS, GET_USERS_AND_BANDS } from "graphql/queries";

import fallbackCover from "assets/images/about.webp";
import bandaAvanzadaImg from "assets/images/Banda Avanzada.webp";
import bandaInicialImg from "assets/images/Banda Inicial.webp";
import bandaIntermediaImg from "assets/images/BandaIntermedia.webp";
import bigBandAImg from "assets/images/BigBandA.webp";
import bigBandBImg from "assets/images/BigBandB.webp";

import { generateToken, messaging } from "config/firebase";
import { onMessage } from "firebase/messaging";

// -------------------------------
// GraphQL
// -------------------------------
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

// -------------------------------
// Constantes
// -------------------------------
const ADMIN_ROLES = new Set(["Admin", "Director", "Subdirector"]);

const bandEmailMap = {
  "Banda de concierto avanzada": "bandaca@cedesdonbosco.ed.cr",
  "Banda de concierto elemental": "bandace@cedesdonbosco.ed.cr",
  "Banda de concierto inicial": "bandacin@cedesdonbosco.ed.cr",
  "Banda de concierto intermedia": "bandacint@cedesdonbosco.ed.cr",
  "Banda de marcha": "bandamarcha@cedesdonbosco.ed.cr",
  Staff: "bandastaff@cedesdonbosco.ed.cr",
  "Padres de familia": "bandapadresdefamilia@cedesdonbosco.ed.cr",
  "Big Band A": "bandabigbanda@cedesdonbosco.ed.cr",
  "Big Band B": "bandabigbandb@cedesdonbosco.ed.cr",
};

// -------------------------------
// Helpers
// -------------------------------
function escapeHtml(input) {
  const s = String(input ?? "");
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeTimeTo12h(time) {
  // Acepta "HH:mm", "h:mma", "h:mm a", etc.
  const raw = String(time ?? "").trim();
  if (!raw) return "";
  const m = moment(raw, ["HH:mm", "H:mm", "h:mma", "h:mmA", "h:mm a", "h:mm A"], true);
  return m.isValid() ? m.format("h:mma") : raw; // fallback a lo que venga
}

function formatDateEsUTC(dateMs) {
  const n = Number(dateMs);
  if (!Number.isFinite(n)) return "";
  // Formato tipo: 14 de febrero del 2026
  return moment.utc(n).format("D [de] MMMM [del] YYYY");
}

function buildEventSortKeyMs(event) {
  // Construye un timestamp comparable: date (ms) + hora (minutos)
  const dateMs = Number(event?.date);
  const timeStr = String(event?.time ?? "").trim();

  const base = Number.isFinite(dateMs) ? moment.utc(dateMs).startOf("day") : null;

  if (!base) return Number.POSITIVE_INFINITY;

  if (!timeStr) return base.valueOf();

  // parse hora robusto
  const t = moment(timeStr, ["HH:mm", "H:mm", "h:mma", "h:mmA", "h:mm a", "h:mm A"], true);
  if (!t.isValid()) return base.valueOf();

  const hours = t.hours();
  const minutes = t.minutes();
  return base.clone().add(hours, "hours").add(minutes, "minutes").valueOf();
}

function getEventImage(type) {
  const t = String(type ?? "");

  if (t.includes("Big Band B")) return bigBandBImg;
  if (t.includes("Big Band A")) return bigBandAImg;
  if (t.includes("Banda de concierto intermedia")) return bandaIntermediaImg;
  if (t.includes("Banda de concierto inicial")) return bandaInicialImg;
  if (t.includes("Banda de concierto avanzada")) return bandaAvanzadaImg;

  return fallbackCover;
}

function buildEventEmailHtml(eventData) {
  const title = escapeHtml(eventData?.title);
  const description = escapeHtml(eventData?.description);
  const place = escapeHtml(eventData?.place);
  const type = escapeHtml(eventData?.type);

  const formattedDate = formatDateEsUTC(eventData?.date);
  const formattedTime = normalizeTimeTo12h(eventData?.time); // "2:00pm"

  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<meta http-equiv="Content-Type" content="text/html charset=UTF-8" />
<html lang="es">
  <head></head>
  <body style="background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen-Sans,Ubuntu,Cantarell,'Helvetica Neue',sans-serif;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
      <tbody>
        <tr>
          <td>
            <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:37.5em;margin:0 auto;padding:20px 0 48px;width:580px">
              <tr style="width:100%">
                <td>
                  <img
                    alt="BCDB"
                    src="https://res.cloudinary.com/dnv9akklf/image/upload/q_auto,f_auto/v1686511395/LOGO_BCDB_qvjabt.png"
                    style="display:block;outline:none;border:none;text-decoration:none;margin:0;padding:0;max-width:30%;height:auto;"
                  />
                  <p style="font-size:26px;line-height:1.3;margin:16px 0;font-weight:700;color:#484848;">
                    ${title} 🙌🏻 🎶
                  </p>

                  <p style="font-size:32px;line-height:1.3;margin:16px 0;font-weight:700;color:#484848;">
                    ¡Hola! Tienes una nueva presentación con la BCDB.
                  </p>

                  <p style="font-size:18px;line-height:1.4;margin:16px 0;color:#484848;padding:24px;background-color:#f2f3f3;border-radius:4px;">
                    Esperamos que este correo le encuentre lleno/a de entusiasmo. Nos complace anunciarle que se avecina una nueva presentación y queremos contar con cada uno de ustedes para hacer de este evento un verdadero éxito.
                  </p>

                  <p style="font-size:18px;line-height:1.4;margin:16px 0;color:#484848;">
                    Formato: ${type}
                  </p>
                  <p style="font-size:18px;line-height:1.4;margin:16px 0;color:#484848;">
                    Fecha: ${escapeHtml(formattedDate)}
                  </p>
                  <p style="font-size:18px;line-height:1.4;margin:16px 0;color:#484848;">
                    Hora: ${escapeHtml(formattedTime)}
                  </p>
                  <p style="font-size:18px;line-height:1.4;margin:16px 0;color:#484848;">
                    Lugar: ${place}
                  </p>
                  <p style="font-size:18px;line-height:1.4;margin:16px 0;color:#484848;padding-bottom:16px;">
                    Descripción del evento: ${description}
                  </p>

                  <a
                    href="https://bandacedesdonbosco.com/"
                    target="_blank"
                    style="background-color:#293964;border-radius:3px;color:#fff;font-size:18px;text-decoration:none;text-align:center;display:inline-block;width:100%;padding:19px 0px;line-height:120%;"
                  >
                    Ver más
                  </a>

                  <hr style="width:100%;border:none;border-top:1px solid #eaeaea;border-color:#cccccc;margin:20px 0;" />

                  <p style="font-size:14px;line-height:24px;margin:16px 0;color:#9ca299;margin-bottom:10px;">
                    Copyright © 2026 Banda CEDES Don Bosco. Todos los derechos reservados.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </body>
</html>
  `.trim();
}

// -------------------------------
// Component
// -------------------------------
const Dashboard = () => {
  // Queries
  const { data: userData, loading: userLoading, error: userError } = useQuery(GET_USERS_BY_ID);

  const {
    data: usersData,
    loading: usersLoading,
    error: usersError,
  } = useQuery(GET_USERS_AND_BANDS);

  const { data: eventData, loading: eventLoading, error: eventError } = useQuery(GET_EVENTS);

  const userRole = userData?.getUser?.role ?? null;
  const userId = userData?.getUser?.id ?? null;
  const canManageEvents = ADMIN_ROLES.has(String(userRole ?? ""));

  // Mutations
  const [updateNotificationToken] = useMutation(UPDATE_NOTIFICATION_TOKEN);
  const [sendEmail] = useMutation(SEND_EMAIL);

  const [addEvent] = useMutation(ADD_EVENT, {
    refetchQueries: [{ query: GET_EVENTS }],
    awaitRefetchQueries: true,
  });

  const [updateEvent] = useMutation(UPDATE_EVENT, {
    refetchQueries: [{ query: GET_EVENTS }],
    awaitRefetchQueries: true,
  });

  const [deleteEvent] = useMutation(DELETE_EVENT, {
    refetchQueries: [{ query: GET_EVENTS }],
    awaitRefetchQueries: true,
  });

  // UI state
  const [openModal, setOpenModal] = useState(false);
  const [modalType, setModalType] = useState(null); // "add" | "edit" | "remove" | "details"
  const [selectedEvent, setSelectedEvent] = useState(null);

  // -------------------------------
  // Effects
  // -------------------------------

  // 1) Registrar/actualizar token push (solo cuando exista userId)
  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    (async () => {
      try {
        const token = await generateToken();
        if (!token || cancelled) return;

        await updateNotificationToken({ variables: { userId, token } });
      } catch (err) {
        // evita reventar UI
        console.error("Error actualizando token de notificación:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, updateNotificationToken]);

  // 2) Listener opcional para notificaciones en foreground (si está configurado)
  useEffect(() => {
    if (!messaging) return;

    try {
      const unsub = onMessage(messaging, (payload) => {
        // aquí podés disparar toast/snackbar si querés
        // console.log("Foreground message:", payload);
      });
      return () => {
        // firebase onMessage retorna función de unsubscribe en algunas versiones,
        // en otras no; por eso el try/catch y guard.
        if (typeof unsub === "function") unsub();
      };
    } catch {
      return undefined;
    }
  }, []);

  // -------------------------------
  // Derived data (memo)
  // -------------------------------
  const sortedEvents = useMemo(() => {
    const events = Array.isArray(eventData?.getEvents) ? [...eventData.getEvents] : [];
    events.sort((a, b) => buildEventSortKeyMs(a) - buildEventSortKeyMs(b));
    return events;
  }, [eventData?.getEvents]);

  // -------------------------------
  // Handlers (callbacks estables)
  // -------------------------------
  const handleCloseModal = useCallback(() => {
    setOpenModal(false);
    setModalType(null);
    setSelectedEvent(null);
  }, []);

  const handleOpenModal = useCallback((type, event = null) => {
    setModalType(type);

    if (event) {
      // Pre-formateo seguro (sin doble setState)
      setSelectedEvent({
        ...event,
        time: normalizeTimeTo12h(event.time),
        departure: normalizeTimeTo12h(event.departure),
        arrival: normalizeTimeTo12h(event.arrival),
      });
    } else {
      setSelectedEvent(null);
    }

    setOpenModal(true);
  }, []);

  const handleSendEmail = useCallback(
    async (newEventData) => {
      const bandEmail = bandEmailMap[newEventData?.type];
      if (!bandEmail) {
        console.error("No se encontró correo para tipo:", newEventData?.type);
        return;
      }

      const html = buildEventEmailHtml(newEventData);

      try {
        const res = await sendEmail({
          variables: {
            input: {
              to: bandEmail,
              subject: "Tienes una nueva presentación con la BCDB",
              text: "",
              html,
            },
          },
        });

        if (!res?.data?.sendEmail) {
          console.error("sendEmail retornó false/empty");
        }
      } catch (err) {
        console.error("Error enviando email:", err);
      }
    },
    [sendEmail]
  );

  const handleAddEvent = useCallback(
    async (newEvent) => {
      try {
        await addEvent({ variables: { input: newEvent } });
        await handleSendEmail(newEvent);
        handleCloseModal();
      } catch (err) {
        console.error("Error creando evento:", err);
      }
    },
    [addEvent, handleCloseModal, handleSendEmail]
  );

  const handleUpdateEvent = useCallback(
    async (updatedEvent) => {
      if (!selectedEvent?.id) return;
      try {
        await updateEvent({
          variables: { id: selectedEvent.id, input: updatedEvent },
        });
        handleCloseModal();
      } catch (err) {
        console.error("Error actualizando evento:", err);
      }
    },
    [selectedEvent?.id, updateEvent, handleCloseModal]
  );

  const handleDeleteEvent = useCallback(async () => {
    if (!selectedEvent?.id) return;
    try {
      await deleteEvent({ variables: { id: selectedEvent.id } });
      handleCloseModal();
    } catch (err) {
      console.error("Error eliminando evento:", err);
    }
  }, [selectedEvent?.id, deleteEvent, handleCloseModal]);

  // -------------------------------
  // Render states
  // -------------------------------
  if (userLoading || usersLoading || eventLoading) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <SoftBox py={3} px={2}>
          <SoftTypography variant="h6" fontWeight="medium">
            Cargando...
          </SoftTypography>
        </SoftBox>
        <Footer />
      </DashboardLayout>
    );
  }

  if (userError || usersError || eventError) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <SoftBox py={3} px={2}>
          <SoftTypography variant="h6" fontWeight="medium" color="error">
            Ocurrió un error cargando datos.
          </SoftTypography>
          <SoftTypography variant="button" color="text">
            {String(userError?.message || usersError?.message || eventError?.message || "")}
          </SoftTypography>
        </SoftBox>
        <Footer />
      </DashboardLayout>
    );
  }

  // Si por alguna razón la API devuelve algo raro
  const users = Array.isArray(usersData?.getUsers) ? usersData.getUsers : [];

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

                {canManageEvents ? (
                  <SoftTypography variant="body2" color="secondary">
                    <Tooltip placement="top" title="Agregar evento">
                      <Icon sx={{ cursor: "pointer" }} onClick={() => handleOpenModal("add")}>
                        add
                      </Icon>
                    </Tooltip>
                  </SoftTypography>
                ) : null}
              </SoftBox>

              <SoftBox p={2} style={{ minWidth: "100%", height: "100%" }}>
                {sortedEvents.length === 0 ? (
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
                    {sortedEvents.map((event) => {
                      const eventImage = getEventImage(event?.type);

                      const actions = [
                        {
                          type: "internal",
                          route: "",
                          color: "info",
                          label: "Ver más",
                          onClick: () => handleOpenModal("details", event),
                        },
                        canManageEvents && {
                          type: "internal",
                          route: "",
                          color: "info",
                          label: "Editar",
                          onClick: () => handleOpenModal("edit", event),
                        },
                        canManageEvents && {
                          type: "internal",
                          route: "",
                          color: "error",
                          label: "Eliminar",
                          icon: "delete",
                          onClick: () => handleOpenModal("remove", event),
                        },
                      ].filter(Boolean);

                      return (
                        <Grid
                          item
                          xs={12}
                          md={6}
                          xl={3}
                          key={event?.id || `${event?.title}-${event?.date}-${event?.time}`}
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
                            image={eventImage}
                            label={`Lugar: ${event?.place ?? ""}`}
                            title={`${event?.title ?? ""}`}
                            description={`${event?.description ?? ""}`}
                            actions={actions}
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

              {/* Remove Event Dialog */}
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

              {/* Details Modal */}
              {modalType === "details" && selectedEvent && (
                <Modal
                  open={openModal}
                  onClose={handleCloseModal}
                  sx={{ boxShadow: "rgba(100, 100, 111, 0.2) 0px 7px 29px 0px" }}
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
                      "@media (max-width: 900px)": { width: "90%" },
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
                              {selectedEvent?.type ?? ""}
                            </a>

                            <h1 className="mt-6 text-4xl font-semibold leading-tight text-center font-display text-slate-900 sm:text-5xl sm:leading-tight">
                              {selectedEvent?.title ?? ""}
                            </h1>

                            <p className="max-w-2xl mx-auto mt-6 text-lg leading-8 text-center text-slate-700">
                              {selectedEvent?.description ?? ""}
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

                                <time>
                                  <strong>Fecha:</strong>{" "}
                                  {selectedEvent?.date
                                    ? new Date(Number(selectedEvent.date)).toLocaleDateString(
                                        "es-ES",
                                        {
                                          timeZone: "UTC",
                                        }
                                      )
                                    : ""}
                                </time>
                              </span>

                              <span className="flex items-center gap-2">
                                <PlaceOutlinedIcon
                                  fontSize="medium"
                                  className="w-6 h-6 text-slate-400"
                                />
                                <strong>Lugar:</strong> {selectedEvent?.place ?? ""}
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
                                <strong>Hora:</strong> {selectedEvent?.time ?? ""}
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
                                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                                  />
                                </svg>
                                <strong>Hora de salida de CEDES:</strong>{" "}
                                {selectedEvent?.departure ?? ""}
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
                                {selectedEvent?.arrival ?? ""}
                              </span>
                            </div>

                            <div className="w-full max-w-4xl mx-auto mt-16">
                              <div className="relative block w-full overflow-hidden shadow-lg aspect-w-16 aspect-h-9 rounded-3xl shadow-sky-100/50 md:aspect-w-3 md:aspect-h-2">
                                <LazyLoadImage
                                  src={getEventImage(selectedEvent?.type)}
                                  alt=""
                                  effect="opacity"
                                  style={{ objectFit: "cover", width: "100%", height: "100%" }}
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
