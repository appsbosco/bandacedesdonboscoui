import { gql, useQuery } from "@apollo/client";
import Box from "@mui/material/Box";
import { DataGrid, GridToolbar, esES } from "@mui/x-data-grid";
import { GET_ALL_ATTENDANCE } from "graphql/queries";
import PropTypes from "prop-types";
import { v4 as uuidv4 } from "uuid";

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

  if (loading)
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
  if (error) return <p>Error :(</p>;

  const rows = data.getAllAttendance
    .slice()
    .reverse()
    .map((attendance) => ({
      id: attendance.id || uuidv4(),
      username:
        attendance.user?.name +
        " " +
        attendance.user?.firstSurName +
        " " +
        attendance.user?.secondSurName,
      instrument: attendance.user?.instrument,
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
