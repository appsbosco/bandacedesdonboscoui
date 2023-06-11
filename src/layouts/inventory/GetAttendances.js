import { gql, useQuery } from "@apollo/client";
import Box from "@mui/material/Box";
import { DataGrid, GridToolbar, esES } from "@mui/x-data-grid";
import { GET_ALL_INVENTORIES } from "graphql/queries";
import PropTypes from "prop-types";
import { v4 as uuidv4 } from "uuid";

const InventoryTable = () => {
  const { loading, error, data, refetch } = useQuery(GET_ALL_INVENTORIES, {
    notifyOnNetworkStatusChange: true,
  });

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
  if (error) return <p>Error :(</p>;

  const inventoryData = data && data.getInventories ? data.getInventories : [];

  const rows = inventoryData.map((inventory) => {
    const user = inventory.user || {};
    return {
      id: inventory.id || uuidv4(),
      username: `${user.name || ""} ${user.firstSurName || ""} ${user.secondSurName || ""}`,
      instrument: user.instrument || "",
      condition: inventory.condition,
      brand: inventory.brand,
      model: inventory.model,
      numberId: inventory.numberId,
      serie: inventory.serie,
      mainteinance: inventory.mainteinance,
      details: inventory.details,
    };
  });

  const columns = [
    { field: "username", headerName: "Usuario", width: 300 },
    { field: "instrument", headerName: "Instrumento", width: 150 },
    { field: "condition", headerName: "Condición", width: 150 },
    { field: "brand", headerName: "Marca", width: 150 },
    { field: "model", headerName: "Modelo", width: 150 },
    { field: "numberId", headerName: "Número de placa institucional", width: 150 },
    { field: "serie", headerName: "Serie", width: 150 },
    { field: "mainteinance", headerName: "Mantenimiento", width: 150 },
    { field: "details", headerName: "Detalles", width: 150 },
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

export default InventoryTable;
