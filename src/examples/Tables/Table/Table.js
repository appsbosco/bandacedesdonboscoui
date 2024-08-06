import Box from "@mui/material/Box";
import { DataGrid, GridToolbar, esES } from "@mui/x-data-grid";
import PropTypes from "prop-types";

const TableWithFilteringSorting = ({
  data,
  columns,
  onRowClick,
  userRole,
  onStateChange,
  height = 400,
}) => {
  const renderHeader = (params) => {
    return <div style={{ paddingLeft: "20px", fontWeight: "500" }}>{params.colDef.headerName}</div>;
  };

  const renderStateCell = (params) => {
    const { id, value } = params;
    const handleChange = (event) => {
      onStateChange(id, event.target.value);
    };

    return (
      // <select value={value} onChange={handleChange}>
      <p>Activo</p>
      //   <option value="inactive">Inactivo</option>
      // </select>
    );
  };

  const updatedColumns = columns.map((column, index) => {
    if (column.field === "status") {
      return {
        ...column,
        renderCell: renderStateCell,
      };
    }
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
    <Box sx={{ height: height, width: 1 }}>
      <DataGrid
        initialState={{
          pagination: {
            paginationModel: { pageSize: 10, page: 0 },
          },
        }}
        rows={data}
        columns={updatedColumns}
        slots={{
          toolbar: GridToolbar,
        }}
        slotProps={{
          toolbar: {
            showQuickFilter: true,
            quickFilterProps: { debounceMs: 500 },
            printOptions: { hideFooter: true, hideToolbar: true },
          },
        }}
        localeText={esES.components.MuiDataGrid.defaultProps.localeText}
        onRowClick={onRowClick}
        pageSizeOptions={[10, 25, 50]}
        getRowHeight={() => "auto"}
        getEstimatedRowHeight={() => 200}
        sx={{
          "&.MuiDataGrid-root--densityCompact .MuiDataGrid-cell": { py: "8px" },
          "&.MuiDataGrid-root--densityStandard .MuiDataGrid-cell": { py: "15px" },
          "&.MuiDataGrid-root--densityComfortable .MuiDataGrid-cell": { py: "22px" },
        }}
      />
    </Box>
  );
};

TableWithFilteringSorting.propTypes = {
  data: PropTypes.array.isRequired,
  columns: PropTypes.array.isRequired,
  onRowClick: PropTypes.func.isRequired,
  userRole: PropTypes.string,
  onStateChange: PropTypes.func,
  height: PropTypes.number,
};

export default TableWithFilteringSorting;
