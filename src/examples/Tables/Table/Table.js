import Box from "@mui/material/Box";
import { DataGrid, GridToolbar, esES } from "@mui/x-data-grid";
import PropTypes from "prop-types";
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

export default TableWithFilteringSorting;
