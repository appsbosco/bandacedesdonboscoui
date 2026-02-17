import Card from "@mui/material/Card";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import TableWithFilteringSorting from "examples/Tables/Table/Table";
import PropTypes from "prop-types";

const tableSx = {
  "& .MuiTableRow-root:not(:last-child)": {
    "& td": {
      borderBottom: ({ borders: { borderWidth, borderColor } }) =>
        `${borderWidth[1]} solid ${borderColor}`,
    },
  },
};

const UsersTableCard = ({ title, data, columns, onRowClick, userRole, onStateChange }) => {
  return (
    <SoftBox mb={3}>
      <Card>
        <SoftBox display="flex" justifyContent="space-between" alignItems="center" p={3}>
          <SoftTypography variant="h6">{title}</SoftTypography>
        </SoftBox>
        <SoftBox sx={tableSx}>
          <TableWithFilteringSorting
            data={data || []}
            columns={columns}
            onRowClick={onRowClick}
            userRole={userRole}
            onStateChange={onStateChange}
          />
        </SoftBox>
      </Card>
    </SoftBox>
  );
};

export default UsersTableCard;

UsersTableCard.propTypes = {
  title: PropTypes.string,
  data: PropTypes.array,
  columns: PropTypes.array,
  onRowClick: PropTypes.func,
  userRole: PropTypes.string,
  onStateChange: PropTypes.func,
};
