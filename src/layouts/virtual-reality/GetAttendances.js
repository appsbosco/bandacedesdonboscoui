import { gql, useQuery } from "@apollo/client";
import Box from "@mui/material/Box";
import { DataGrid, GridToolbar, esES } from "@mui/x-data-grid";
import { GET_ALL_ATTENDANCE } from "graphql/queries";
import PropTypes from "prop-types";
import { v4 as uuidv4 } from "uuid";
import MoodBadIcon from "@mui/icons-material/MoodBad";
import MoodIcon from "@mui/icons-material/Mood";
import SentimentNeutralIcon from "@mui/icons-material/SentimentNeutral";

const formatDateString = (dateString) => {
  const date = new Date(parseInt(dateString));
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const getAttendanceDisplayString = (attendance) => {
  switch (attendance) {
    case "present":
      return "Presente";
    case "absent":
      return "Ausente";
    case "justified_absence":
      return "Ausencia justificada";
    case "unjustified_absence":
      return "Ausencia injustificada";
    case "justified_withdrawal":
      return "Retiro justificado";
    case "unjustified_withdrawal":
      return "Retiro injustificado";
    default:
      return "";
  }
};

const calculateAttendancePercentages = (attendanceData) => {
  const targetUserId = "64863226a7248e5c1790313b";
  const targetUserAttendance = attendanceData.filter((a) => a.user?.id === targetUserId).length;
  if (targetUserAttendance === 0) {
    console.error("El usuario objetivo no tiene registros de asistencia.");
    return {};
  }

  const userAttendanceGroups = {};
  attendanceData.forEach((attendance) => {
    const userName =
      attendance?.user?.name +
      " " +
      attendance?.user?.firstSurName +
      " " +
      attendance?.user?.secondSurName;
    if (!userAttendanceGroups[userName]) {
      userAttendanceGroups[userName] = { present: 0, total: 0 };
    }

    if (attendance.attended === "present") {
      userAttendanceGroups[userName].present += 1;
    }
    userAttendanceGroups[userName].total += 1;
  });

  const userAttendancePercentages = {};
  for (const userName in userAttendanceGroups) {
    const { present } = userAttendanceGroups[userName];
    const percentage = (present / targetUserAttendance) * 100;
    userAttendancePercentages[userName] = percentage;
  }

  return userAttendancePercentages;
};

function getMoodIcon(percentage) {
  if (percentage >= 80) {
    return <MoodIcon />;
  } else if (percentage >= 60) {
    return <SentimentNeutralIcon />;
  } else {
    return <MoodBadIcon />;
  }
}

function getMoodColor(percentage) {
  if (percentage >= 80) {
    return "green";
  } else if (percentage >= 60) {
    return "orange";
  } else {
    return "red";
  }
}

const AttendanceHistoryTable = () => {
  const { loading, error, data, refetch } = useQuery(GET_ALL_ATTENDANCE, {
    notifyOnNetworkStatusChange: true,
  });

  if (loading)
    return (
      <div
        style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}
      >
        <p>Cargando</p>
      </div>
    );
  if (error) return <p>Error :(</p>;

  const validAttendances = data.getAllAttendance.filter((a) => a.user?.id !== undefined);
  const userAttendancePercentages = calculateAttendancePercentages(validAttendances);

  const rows = data.getAllAttendance
    .slice()
    .reverse()
    .map((attendance) => {
      const userName =
        attendance.user?.name +
        " " +
        attendance.user?.firstSurName +
        " " +
        attendance.user?.secondSurName;
      const attendancePercentage = userAttendancePercentages[userName] || 0;
      return {
        id: attendance.id || uuidv4(),
        username: userName,
        instrument: attendance.user?.instrument,
        date: formatDateString(attendance.date),
        attended: getAttendanceDisplayString(attendance.attended),
        attendancePercentage: attendancePercentage.toFixed(2) + "%",
        mood: getMoodIcon(attendancePercentage),
      };
    });

  const columns = [
    { field: "username", headerName: "Integrante", width: 300 },
    { field: "instrument", headerName: "Instrumento", width: 150 },
    { field: "date", headerName: "Fecha", width: 150 },
    { field: "attended", headerName: "Asistencia", width: 200 },
    { field: "attendancePercentage", headerName: "Porcentaje de Asistencia", width: 200 },
    {
      field: "mood",
      headerName: "Estado",
      width: 150,
      renderCell: (params) => {
        const color = getMoodColor(parseFloat(params.row.attendancePercentage));
        return <span style={{ color }}>{params.value}</span>;
      },
    },
  ];

  return <TableWithFilteringSorting data={rows} columns={columns} />;
};

const TableWithFilteringSorting = ({ data, columns }) => {
  const renderHeader = (params) => {
    return <div style={{ paddingLeft: "20px", fontWeight: "500" }}>{params.colDef.headerName}</div>;
  };

  const updatedColumns = columns.map((column, index) => {
    if (index === 0) {
      return {
        ...column,
        headerAlign: "left",
        renderHeader: renderHeader,
        renderCell: (params) => <div style={{ paddingLeft: "20px" }}>{params.value}</div>,
      };
    }
    return column;
  });

  return (
    <Box sx={{ height: 700, width: 1 }}>
      <DataGrid
        initialState={{
          pagination: {
            paginationModel: { pageSize: 10, page: 0 },
          },
        }}
        rows={data}
        columns={updatedColumns}
        components={{
          Toolbar: GridToolbar,
        }}
        slots={{ toolbar: GridToolbar }}
        slotProps={{
          toolbar: {
            showQuickFilter: true,
            quickFilterProps: { debounceMs: 500 },
            printOptions: { hideFooter: true, hideToolbar: true },
          },
        }}
        localeText={esES.components.MuiDataGrid.defaultProps.localeText}
      />
    </Box>
  );
};

TableWithFilteringSorting.propTypes = {
  data: PropTypes.array.isRequired,
  columns: PropTypes.array.isRequired,
};

export default AttendanceHistoryTable;
