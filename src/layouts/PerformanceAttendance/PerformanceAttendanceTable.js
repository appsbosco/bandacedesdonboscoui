import * as React from "react";
import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { GET_PERFORMANCE_ATTENDANCE } from "graphql/queries";
import { UPDATE_PERFORMANCE_ATTENDANCE } from "graphql/mutations";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import {
  DataGrid,
  esES,
  GridRowModes,
  GridToolbarContainer,
  GridActionsCellItem,
  GridRowEditStopReasons,
  GridToolbar,
} from "@mui/x-data-grid";
import PropTypes from "prop-types";
import { GET_HOTELS } from "graphql/queries";
import { MenuItem, Select } from "@mui/material";
import { GET_USERS_BY_ID } from "graphql/queries";

const PerformanceAttendanceTable = ({ refetchToggle, selectedEvent }) => {
  //Queries
  const { data, loading, error, refetch } = useQuery(GET_PERFORMANCE_ATTENDANCE, {
    variables: { event: selectedEvent },
    skip: !selectedEvent,
  });

  React.useEffect(() => {
    refetch();
  }, [refetchToggle, refetch]);

  // Queries
  const { data: hotelsData, loading: hotelsLoading, error: hotelsError } = useQuery(GET_HOTELS);

  const { data: userData } = useQuery(GET_USERS_BY_ID);
  const [userRole, setUserRole] = useState("");

  const [userInstrument, setUserInstrument] = useState(null);

  React.useEffect(() => {
    if (userData) {
      setUserInstrument(userData.getUser.instrument);
    }
  }, [userData]);
  React.useEffect(() => {
    if (userData) {
      setUserRole(userData.getUser.role);
    }
  }, [userData]);

  //Mutations
  const [updatePerformanceAttendance, { data: mutationData, error: mutationError }] = useMutation(
    UPDATE_PERFORMANCE_ATTENDANCE
  );

  React.useEffect(() => {
    let filteredRows = [];
    if (
      userRole === "Admin" ||
      userRole === "Director" ||
      userRole === "Staff" ||
      userRole === "Dirección Logística"
    ) {
      filteredRows = data?.getPerformanceAttendanceByEvent || [];
    } else {
      filteredRows =
        data?.getPerformanceAttendanceByEvent.filter(
          (item) => item.user.instrument === userInstrument
        ) || [];
    }

    setRows(
      filteredRows.map((item) => ({
        id: item.id,
        name: `${item.user.name} ${item.user.firstSurName} ${item.user.secondSurName}`,
        event: item.event.title,
        attended: item.attended,
        busNumber: item.busNumber,
        hotel: { id: item?.hotel?.id, name: item?.hotel?.name },
      }))
    );
  }, [data, userInstrument, userRole]);

  const initialRows =
    data?.getPerformanceAttendanceByEvent.map((item) => ({
      id: item.id,
      name: item.user.name,
      event: item.event.title,
      attended: item.attended,
      busNumber: item.busNumber,
      hotel: { id: item?.hotel?.id, name: item?.hotel?.name },
    })) || [];

  const [rows, setRows] = React.useState(initialRows);
  const [rowModesModel, setRowModesModel] = React.useState({});

  const handleRowEditStop = (params, event) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };

  const handleEditClick = (id) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
  };

  const handleSaveClick = (id) => async () => {
    const editedRow = rows.find((row) => row.id === id);
    const isAbsent = editedRow.attended === "Ausente";
    await updatePerformanceAttendance({
      variables: {
        updatePerformanceAttendanceId: id,
        input: {
          attended: editedRow.attended,
          busNumber: isAbsent ? null : editedRow.busNumber,
          hotel: isAbsent ? null : editedRow.hotel.id,
        },
      },
    });

    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
    await refetch();
  };

  const handleCancelClick = (id) => () => {
    setRowModesModel({
      ...rowModesModel,
      [id]: { mode: GridRowModes.View, ignoreModifications: true },
    });
    refetch();
  };

  const handleAttendedChange = (id) => (event) => {
    const newRows = rows.map((row) => {
      if (row.id === id) {
        return { ...row, attended: event.target.value };
      }
      return row;
    });
    setRows(newRows);
  };

  const handleBusNumberChange = (id) => (event) => {
    const newRows = rows.map((row) => {
      if (row.id === id) {
        return { ...row, busNumber: event.target.value };
      }
      return row;
    });
    setRows(newRows);
  };
  const columns = [
    {
      field: "name",
      headerName: "Nombre",
      width: 300,
      editable: true,
    },

    {
      field: "attended",
      headerName: "Asistencia",
      width: 150,
      renderCell: (params) => {
        const isInEditMode = rowModesModel[params.id]?.mode === GridRowModes.Edit;

        return isInEditMode ? (
          <Select value={params.value || ""} onChange={handleAttendedChange(params.id)}>
            <MenuItem value="">Seleccione asistencia</MenuItem>
            <MenuItem value="Presente">Presente</MenuItem>
            <MenuItem value="Ausente">Ausente</MenuItem>
          </Select>
        ) : (
          params.value || ""
        );
      },
    },
    {
      field: "busNumber",
      headerName: "Número de Bus",
      width: 200,
      renderCell: (params) => {
        const isInEditMode = rowModesModel[params.id]?.mode === GridRowModes.Edit;

        return isInEditMode ? (
          <Select
            value={params.value || "Seleccione un bus"}
            onChange={handleBusNumberChange(params.id)}
            disabled={params.row?.attended === "Ausente"}
          >
            <MenuItem value="Seleccione un bus">Seleccione un bus</MenuItem>
            <MenuItem value={1}>Bus 1</MenuItem>
            <MenuItem value={2}>Bus 2</MenuItem>
            <MenuItem value={3}>Bus 3</MenuItem>
            <MenuItem value={4}>Bus 4</MenuItem>
            <MenuItem value={5}>Bus 5</MenuItem>
          </Select>
        ) : (
          params.value || ""
        );
      },
    },
    {
      field: "hotel",
      headerName: "Hotel",
      width: 200,
      renderCell: (params) => {
        const isInEditMode =
          rowModesModel[params.id]?.mode === GridRowModes.Edit &&
          (userRole === "Admin" || userRole === "Director");

        const handleHotelChange = (event) => {
          const newRows = rows.map((row) => {
            if (row.id === params.id) {
              return {
                ...row,
                hotel: {
                  id: event.target.value,
                  name:
                    hotelsData?.getHotels.find((hotel) => hotel.id === event.target.value)?.name ||
                    row.hotel.name,
                },
              };
            }
            return row;
          });
          setRows(newRows);
        };

        return isInEditMode ? (
          <Select
            value={params.value?.id || "Seleccione un hotel"}
            onChange={handleHotelChange}
            disabled={params.row?.attended === "Ausente"} // Asumiendo que el valor 'Ausente' desactiva la selección del hotel
          >
            <MenuItem value="Seleccione un hotel">Seleccione un hotel</MenuItem>
            {hotelsData?.getHotels.map((hotel) => (
              <MenuItem key={hotel.id} value={hotel.id}>
                {hotel.name}
              </MenuItem>
            ))}
          </Select>
        ) : (
          params.value?.name || ""
        );
      },
    },
    {
      field: "actions",
      type: "actions",
      headerName: "Editar",
      width: 100,
      cellClassName: "actions",
      getActions: ({ id }) => {
        const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;

        if (isInEditMode) {
          return [
            <GridActionsCellItem
              key={`${id}-save`}
              icon={<SaveIcon />}
              label="Save"
              sx={{ color: "primary.main" }}
              onClick={handleSaveClick(id)}
            />,
            <GridActionsCellItem
              key={`${id}-cancel`}
              icon={<CancelIcon />}
              label="Cancel"
              className="textPrimary"
              onClick={handleCancelClick(id)}
              color="inherit"
            />,
          ];
        }

        return [
          <GridActionsCellItem
            key={`${id}-edit`}
            icon={<EditIcon />}
            label="Edit"
            className="textPrimary"
            onClick={handleEditClick(id)}
            color="inherit"
          />,
        ];
      },
    },
  ];

  return (
    <Box
      sx={{
        height: 500,
        width: "100%",
        "& .actions": {
          color: "text.secondary",
        },
        "& .textPrimary": {
          color: "text.primary",
        },
      }}
    >
      <DataGrid
        rows={rows}
        columns={columns}
        editMode="row"
        components={{ Toolbar: GridToolbar }}
        slotProps={{
          toolbar: {
            showQuickFilter: true,
            quickFilterProps: { debounceMs: 500 },
          },
        }}
        rowModesModel={rowModesModel}
        onRowModesModelChange={setRowModesModel}
        onRowEditStop={handleRowEditStop}
        localeText={esES.components.MuiDataGrid.defaultProps.localeText}
      />
    </Box>
  );
};

PerformanceAttendanceTable.propTypes = {
  selectedEvent: PropTypes.string.isRequired,
  refetchToggle: PropTypes.bool,
};

export default PerformanceAttendanceTable;
