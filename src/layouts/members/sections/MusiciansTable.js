import UsersTableCard from "../../../components/layouts/members/UsersTableCard";
import { musiciansColumns } from "../columns";
import PropTypes from "prop-types";

const MusiciansTable = ({ data, onRowClick, userRole, onStateChange }) => {
  return (
    <UsersTableCard
      title="Integrantes"
      data={data}
      columns={musiciansColumns}
      onRowClick={onRowClick}
      userRole={userRole}
      onStateChange={onStateChange}
    />
  );
};

export default MusiciansTable;

MusiciansTable.propTypes = {
  data: PropTypes.array,
  onRowClick: PropTypes.func,
  userRole: PropTypes.string,
  onStateChange: PropTypes.func,
};
