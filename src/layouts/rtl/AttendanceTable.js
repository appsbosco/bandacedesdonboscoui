import { gql, useMutation, useQuery } from "@apollo/client";
import { Button, MenuItem, Select } from "@mui/material";
import Box from "@mui/material/Box";
import { DataGrid, GridToolbar, esES } from "@mui/x-data-grid";
import { ADD_ATTENDANCE } from "graphql/mutations";
import { GET_USERS } from "graphql/queries";
import { GET_USERS_BY_ID } from "graphql/queries";
import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CircularProgress } from "@mui/material";

const AttendanceTable = () => {
  const { data: userData } = useQuery(GET_USERS_BY_ID);

  const userInstrument = userData?.getUser?.instrument;
  const { loading, error, data, refetch } = useQuery(GET_USERS);
  const [addAttendance] = useMutation(ADD_ATTENDANCE, {
    refetchQueries: [{ query: GET_USERS }],
  });
  const [attendanceData, setAttendanceData] = useState([]);

  useEffect(() => {
    if (data) {
      const initialAttendanceData = data.getUsers.map((user) => ({
        userId: user.id,
        attended: "present", // Change the initial value to the default value you want
      }));
      setAttendanceData(initialAttendanceData);
    }
  }, [data]);

  const handleAttendanceChange = (userId, attended) => {
    const existingAttendanceIndex = attendanceData.findIndex((item) => item.userId === userId);

    if (existingAttendanceIndex !== -1) {
      const updatedAttendanceData = [...attendanceData];
      updatedAttendanceData[existingAttendanceIndex] = {
        ...updatedAttendanceData[existingAttendanceIndex],
        attended,
      };
      setAttendanceData(updatedAttendanceData);
    } else {
      setAttendanceData([...attendanceData, { userId, attended }]);
    }
  };

  const users = data ? data.getUsers : [];

  const [isLoading, setIsLoading] = useState(false);

  const handleSaveAttendance = async () => {
    setIsLoading(true);

    const date = new Date().toISOString();

    for (let i = 0; i < attendanceData.length; i++) {
      const { userId, attended } = attendanceData[i];
      const user = users.find((user) => user.id === userId);

      if (user.instrument === userInstrument) {
        try {
          await addAttendance({
            variables: { input: { user: userId, date, attended } },
          });
          // toast.success("Guardado correctamente");
        } catch (error) {
          console.error(error);
        }
      }
    }

    refetch();
    window.location.href = "/attendance-history";

    setIsLoading(false);
  };

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
  if (error) return <p>Error: {error.message}</p>;

  const columns = [
    { field: "name", headerName: "Integrante", flex: 1 },
    {
      field: "attended",
      headerName: "Asistencia",
      flex: 1,
      renderCell: (params) => {
        const user = params.row;
        const attendance = attendanceData.find((item) => item.userId === user.id);
        const selectedStatus = attendance?.attended || "";

        return (
          <Select
            value={selectedStatus}
            onChange={(event) => handleAttendanceChange(user.id, event.target.value)}
          >
            <MenuItem value="present">Presente</MenuItem>
            <MenuItem value="absent">Ausente</MenuItem>
            <MenuItem value="justified_absence">Ausencia justificada</MenuItem>
            <MenuItem value="unjustified_absence">Ausencia injustificada</MenuItem>
            <MenuItem value="justified_withdrawal">Retiro justificado</MenuItem>
            <MenuItem value="unjustified_withdrawal">Retiro injustificado</MenuItem>
          </Select>
        );
      },
    },
  ];

  const rows = users
    .filter((user) => user.instrument === userInstrument)
    .map((user) => ({
      id: user.id,
      name: user.name + " " + user.firstSurName + " " + user.secondSurName,
    }));

  return (
    <div>
      {loading ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
          }}
        >
          <CircularProgress />
        </div>
      ) : (
        <>
          <TableWithFilteringSorting data={rows} columns={columns} />

          <Button
            style={{ margin: "2%" }}
            variant="contained"
            color="info"
            onClick={handleSaveAttendance}
          >
            {isLoading ? "Guardando..." : "Guardar asistencia"}
          </Button>
        </>
      )}
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
    <Box sx={{ height: 400, width: 1 }}>
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

export default AttendanceTable;
