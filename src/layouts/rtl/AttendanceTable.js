import { gql, useMutation, useQuery } from "@apollo/client";
import { Button, MenuItem, Select } from "@mui/material";
import Box from "@mui/material/Box";
import { DataGrid, GridToolbar, esES } from "@mui/x-data-grid";
import PropTypes from "prop-types";
import { useEffect, useState } from "react";

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
const GET_USERS = gql`
  query getUsers {
    getUsers {
      id
      name
      firstSurName
      secondSurName
      instrument
      role
    }
  }
`;

const ADD_ATTENDANCE = gql`
  mutation ($input: AttendanceInput!) {
    newAttendance(input: $input) {
      id
      user {
        id
        name
        firstSurName
        secondSurName
        instrument
        role
      }
      date
      attended
    }
  }
`;

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
      setAttendanceData(data.getUsers.map((user) => ({ userId: user.id, attended: "false" })));
    }
  }, [data]);

  const handleAttendanceChange = (userId, attended) => {
    const existingAttendanceIndex = attendanceData.findIndex((item) => item.userId === userId);

    if (existingAttendanceIndex !== -1) {
      const updatedAttendanceData = [...attendanceData];
      updatedAttendanceData[existingAttendanceIndex].attended = attended;
      setAttendanceData(updatedAttendanceData);
    } else {
      setAttendanceData([...attendanceData, { userId, attended }]);
    }
  };

  const users = data ? data.getUsers : [];

  const handleSaveAttendance = async () => {
    const date = new Date().toISOString();

    for (let i = 0; i < attendanceData.length; i++) {
      const { userId, attended } = attendanceData[i];
      const user = users.find((user) => user.id === userId);

      if (user.instrument === userInstrument) {
        try {
          await addAttendance({ variables: { input: { user: userId, date, attended } } });
        } catch (error) {
          console.error(error);
        }
      }
    }

    refetch(); // Manually trigger a refetch of the GET_ALL_ATTENDANCE query
  };

  if (loading) return <p>Loading...</p>;
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
        const attended = attendance ? attendance.attended : "false";

        return (
          <Select
            value={attended}
            onChange={(event) => handleAttendanceChange(user.id, event.target.value)}
          >
            <MenuItem value={"true"}>Presente</MenuItem>
            <MenuItem value={"false"}>Ausente</MenuItem>
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
      <TableWithFilteringSorting data={rows} columns={columns} />

      <Button
        style={{ margin: "2%", color: "white" }}
        variant="contained"
        onClick={handleSaveAttendance}
      >
        Guardar asistencia
      </Button>
    </div>
  );
};

const TableWithFilteringSorting = ({ data, columns }) => {
  return (
    <Box sx={{ height: 400, width: 1 }}>
      <DataGrid
        initialState={{
          pagination: {
            paginationModel: { pageSize: 10, page: 0 },
          },
        }}
        rows={data}
        columns={columns}
        checkboxSelection
        components={{
          Toolbar: GridToolbar,
        }}
        slotProps={{
          toolbar: {
            showQuickFilter: true,
            quickFilterProps: { debounceMs: 500 },
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
