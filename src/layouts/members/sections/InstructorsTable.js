import UsersTableCard from "../../../components/layouts/members/UsersTableCard";
import { staffColumns } from "../columns";
import PropTypes from "prop-types";

const InstructorsTable = ({ data, onRowClick }) => {
  return (
    <UsersTableCard
      title="Instructores"
      data={data}
      columns={staffColumns}
      onRowClick={onRowClick}
    />
  );
};

export default InstructorsTable;

InstructorsTable.propTypes = {
  data: PropTypes.array,
  onRowClick: PropTypes.func,
};
