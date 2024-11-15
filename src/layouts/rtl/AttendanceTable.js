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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
        }}
      >
        <p>Cargando</p>
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
    .filter(
      (user) => user.instrument === userInstrument && user.role !== "Instructor de instrumento"
    )
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
