import UsersTableCard from "../../../components/layouts/members/UsersTableCard";
import { staffColumns } from "../columns";
import PropTypes from "prop-types";

const StaffTable = ({ data, onRowClick }) => {
  return (
    <UsersTableCard title="Staff" data={data} columns={staffColumns} onRowClick={onRowClick} />
  );
};

export default StaffTable;

StaffTable.propTypes = {
  data: PropTypes.array,
  onRowClick: PropTypes.func,
};
