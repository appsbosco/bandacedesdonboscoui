import { gql, useQuery } from "@apollo/client";
import Box from "@mui/material/Box";
import { DataGrid, GridToolbar, esES } from "@mui/x-data-grid";
import PropTypes from "prop-types";
import { v4 as uuidv4 } from "uuid";

const GET_ALL_ATTENDANCE = gql`
  query GetAllAttendance {
    getAllAttendance {
      attended
      date
      id
      user {
        name
        firstSurName
        secondSurName
        instrument
      }
    }
  }
`;

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

const AttendanceHistoryTable = () => {
  const { loading, error, data, refetch } = useQuery(GET_ALL_ATTENDANCE, {
    notifyOnNetworkStatusChange: true,
  });

  if (loading) return <p>Cargando...</p>;
  if (error) return <p>Error :(</p>;

  const rows = data.getAllAttendance
    .slice()
    .reverse() // Reverse the order of the array
    .map((attendance) => ({
      id: attendance.id || uuidv4(),
      username:
        attendance.user.name +
        " " +
        attendance.user.firstSurName +
        " " +
        attendance.user.secondSurName,
      instrument: attendance.user.instrument,
      date: formatDateString(attendance.date),
      attended: getAttendanceDisplayString(attendance.attended),
    }));

  const columns = [
    { field: "username", headerName: "Integrante", width: 300 },
    { field: "instrument", headerName: "Instrumento", width: 150 },
    { field: "date", headerName: "Fecha", width: 150 },
    { field: "attended", headerName: "Asistencia", width: 200 },
  ];

  return (
    <div>
      <TableWithFilteringSorting data={rows} columns={columns} />
    </div>
  );
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
