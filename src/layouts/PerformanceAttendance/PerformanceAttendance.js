import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { GET_USERS_BY_ID, GET_USERS } from "graphql/queries";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import SoftBox from "components/SoftBox";
import { Card } from "@mui/material";
import SoftTypography from "components/SoftTypography";
import Footer from "examples/Footer";
import { GET_EVENTS } from "graphql/queries";
import { Button, MenuItem, Select } from "@mui/material";
import Box from "@mui/material/Box";
import { DataGrid, GridToolbar, esES } from "@mui/x-data-grid";
import { GET_HOTELS } from "graphql/queries";
import { NEW_PERFORMANCE_ATTENDANCE } from "graphql/mutations";
import CustomSelect from "components/CustomSelect";
import { GET_PERFORMANCE_ATTENDANCE } from "graphql/queries";
import PerformanceAttendanceTable from "./PerformanceAttendanceTable";

const PerformanceAttendance = () => {
  //States
  const [selectedEvent, setSelectedEvent] = useState("");
  const [selectedEventDetails, setSelectedEventDetails] = useState({});

  const [filteredUsers, setFilteredUsers] = useState([]);

  const [events, setEvents] = useState([]);
  const [attendanceStatus, setAttendanceStatus] = useState({});
  const [busAssignments, setBusAssignments] = useState({});
  const [hotelAssignments, setHotelAssignments] = useState({});
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [message, setMessage] = useState(null);

  const [refetchToggle, setRefetchToggle] = useState(false);

  //Queries
  const { data: userData } = useQuery(GET_USERS_BY_ID);
  const { data: usersData } = useQuery(GET_USERS);
  const { data: eventsData } = useQuery(GET_EVENTS);
  const { data: hotelsData } = useQuery(GET_HOTELS);

  const { data, loading } = useQuery(GET_PERFORMANCE_ATTENDANCE, {
    variables: { event: selectedEvent },
    skip: !selectedEvent,
  });
  //Mutations
  const [newAttendance, { data: newAttendanceData, error }] = useMutation(
    NEW_PERFORMANCE_ATTENDANCE
  );

  //HandleEvents
  const handleEventSelection = (event) => {
    setSelectedEvent(event.target.value);

    const eventDetails = eventsData?.getEvents.find((e) => e.id === event.target.value);
    if (eventDetails) {
      setSelectedEventDetails(eventDetails);
    }
  };

  const handleAttendanceChange = (userId, status) => {
    setAttendanceStatus((prev) => ({ ...prev, [userId]: status }));
  };

  const handleBusAssignment = (userId, busId) => {
    setBusAssignments((prev) => ({ ...prev, [userId]: busId }));
  };

  const handleHotelAssignment = (userId, hotelId) => {
    setHotelAssignments((prev) => ({ ...prev, [userId]: hotelId }));
  };

  const handleSave = () => {
    if (!selectedEvent) {
      alert("Por favor, selecciona un evento antes de guardar.");
      return;
    }

    for (const user of filteredUsers) {
      const isAbsent = attendanceStatus[user.id] === "Ausente";
      const hotelAssignment = isAbsent ? null : hotelAssignments[user.id];

      newAttendance({
        variables: {
          input: {
            user: user.id,
            event: selectedEvent,
            attended: attendanceStatus[user.id],
            busNumber: parseInt(busAssignments[user.id], 10),
            hotel: hotelAssignment === "Seleccione un hotel" ? null : hotelAssignment,
          },
        },
      })
        .then(() => {
          setShowSuccessMessage(true);
          setMessage("Asistencia guardada correctamente");
          setRefetchToggle((prev) => !prev);
        })
        .catch((error) => {
          console.error(error);
        });
    }
  };

  //UseEffects

  useEffect(() => {
    if (eventsData) {
      setEvents(eventsData.getEvents);
    }
  }, [eventsData]);

  useEffect(() => {
    if (userData && usersData) {
      const userInstrument = userData?.getUser?.instrument;
      const allowedRoles = [
        "Principal de sección",
        "Líder de sección",
        "Asistente de sección",
        "Staff",
        "Dirección Logística",
        "Admin",
        "Director",
      ];
      if (allowedRoles.includes(userData?.getUser.role)) {
        const filtered = usersData?.getUsers.filter((user) => user.instrument === userInstrument);
        setFilteredUsers(filtered);

        const defaultAttendance = {};
        filtered.forEach((user) => {
          defaultAttendance[user.id] = "Presente";
        });
        setAttendanceStatus(defaultAttendance);

        const defaultBusAssignments = {};
        filtered.forEach((user) => {
          defaultBusAssignments[user.id] = "Seleccione un bus";
        });
        setBusAssignments(defaultBusAssignments);

        const defaultHotelAssignments = {};
        filtered.forEach((user) => {
          defaultHotelAssignments[user.id] = "Seleccione un hotel";
        });
        setHotelAssignments(defaultHotelAssignments);
      } else {
        setFilteredUsers(usersData?.getUsers || []);
        console.log("All users set as Filtered Users:", usersData?.getUsers);
      }
    }
  }, [userData, usersData]);

  useEffect(() => {
    let timeoutId = null;
    if (message) {
      timeoutId = setTimeout(() => {
        setMessage(null);
        setShowSuccessMessage(false);
      }, 2000);
    }

    return () => {
      clearTimeout(timeoutId);
    };
  }, [message]);

  useEffect(() => {
    if (error) {
      console.error("Error al guardar asistencia:", error.message);
    }
  }, [error]);

  //Columns
  const columns = [
    {
      field: "name",
      headerName: "Integrante",
      width: 300,
      renderCell: (params) => <div style={{ paddingLeft: "20px" }}>{params.value}</div>,
    },
    {
      field: "attendance",
      headerName: "Asistencia",
      width: 150,
      renderCell: (params) => {
        const user = params.row;
        return (
          <Select
            value={attendanceStatus[user.id] || ""}
            onChange={(event) => handleAttendanceChange(user.id, event.target.value)}
          >
            <MenuItem value="">Seleccione asistencia</MenuItem>
            <MenuItem value="Presente">Presente</MenuItem>
            <MenuItem value="Ausente">Ausente</MenuItem>
          </Select>
        );
      },
    },
    {
      field: "bus",
      headerName: "Bus",
      width: 200,
      renderCell: (params) => {
        const user = params.row;
        const isAbsent = attendanceStatus[user.id] === "Ausente";

        return (
          <Select
            value={busAssignments[user.id] || "Seleccione un bus"}
            onChange={(event) => handleBusAssignment(user.id, event.target.value)}
            disabled={isAbsent}
          >
            <MenuItem value="Seleccione un bus">Seleccione un bus</MenuItem>
            <MenuItem value={1}>Bus 1</MenuItem>
            <MenuItem value={2}>Bus 2</MenuItem>
            <MenuItem value={3}>Bus 3</MenuItem>
            <MenuItem value={4}>Bus 4</MenuItem>
            <MenuItem value={5}>Bus 5</MenuItem>
          </Select>
        );
      },
    },
    {
      field: "hotel",
      headerName: "Hotel",
      width: 200,
      renderCell: (params) => {
        const user = params.row;
        const isAbsent = attendanceStatus[user.id] === "Ausente";

        return (
          <Select
            value={hotelAssignments[user.id] || "Seleccione un hotel"}
            onChange={(event) => handleHotelAssignment(user.id, event.target.value)}
            disabled={isAbsent || userData?.getUser?.role !== "Admin"}
          >
            <MenuItem value="Seleccione un hotel">Seleccione un hotel</MenuItem>
            {hotelsData?.getHotels.map((hotel) => (
              <MenuItem key={hotel.id} value={hotel.id}>
                {hotel.name}
              </MenuItem>
            ))}
          </Select>
        );
      },
    },
  ];

  //Rows
  const rows =
    filteredUsers?.map((user) => ({
      id: user.id,
      name: user.name + " " + user.firstSurName + " " + user.secondSurName,
      attendance: attendanceStatus[user.id] || "",
    })) || [];

  const showMessage = () => {
    return (
      showSuccessMessage && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: "9999",
            backgroundColor: "#ffffff",
            padding: "20px",
            textAlign: "center",
            boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
            borderRadius: "8px",
            maxWidth: "90%",
            width: "400px",
          }}
        >
          <div className="container">
            <div className="content" id="popup">
              <p style={{ marginBottom: "1rem" }}>{message}</p>
            </div>
          </div>
        </div>
      )
    );
  };

  return (
    <DashboardLayout>
      {showMessage()}
      <DashboardNavbar />
      {/* <SoftBox py={3}>
        <Card>
          <SoftBox display="flex" justifyContent="space-between" alignItems="center" p={3}>
            <SoftTypography variant="h6">Toma de asistencia</SoftTypography>
          </SoftBox>
          <SoftBox
            sx={{
              "& .MuiTableRow-root:not(:last-child)": {
                "& td": {
                  borderBottom: ({ borders: { borderWidth, borderColor } }) =>
                    `${borderWidth[1]} solid ${borderColor}`,
                },
              },
            }}
          >
            <SoftBox
              borderRadius="lg"
              display="flex-col"
              justifyContent="space-between"
              alignItems="center"
              p={3}
            >
              <SoftTypography variant="h6" fontWeight="medium">
                Seleccione un evento
              </SoftTypography>
              <CustomSelect
                labelId="event-label"
                value={selectedEvent || ""}
                onChange={handleEventSelection}
                options={events.map((event) => ({
                  value: event.id,
                  label: event.title,
                }))}
              />
            </SoftBox>
            <Box sx={{ height: 400, width: "100%" }}>
              <DataGrid
                rows={rows}
                columns={columns}
                components={{ Toolbar: GridToolbar }}
                disableReorder={true}
                slotProps={{
                  toolbar: {
                    showQuickFilter: true,
                    quickFilterProps: { debounceMs: 500 },
                  },
                }}
                localeText={esES.components.MuiDataGrid.defaultProps.localeText}
              />
            </Box>
            <div className="m-4">
              <Button variant="contained" color="info" onClick={handleSave}>
                Guardar
              </Button>
            </div>
          </SoftBox>
        </Card>
      </SoftBox> */}
      <SoftBox py={3}>
        <Card>
          <SoftBox display="flex" justifyContent="space-between" alignItems="center" p={3}>
            <SoftTypography variant="h6">
              Reporte de asistencia a: {selectedEventDetails.title}{" "}
            </SoftTypography>
          </SoftBox>
          <SoftBox
            sx={{
              "& .MuiTableRow-root:not(:last-child)": {
                "& td": {
                  borderBottom: ({ borders: { borderWidth, borderColor } }) =>
                    `${borderWidth[1]} solid ${borderColor}`,
                },
              },
            }}
          >
            <PerformanceAttendanceTable
              refetchToggle={refetchToggle}
              selectedEvent={selectedEvent}
              data={data}
            />
          </SoftBox>
        </Card>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
};

export default PerformanceAttendance;
