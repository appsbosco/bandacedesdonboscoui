import UsersTableCard from "../../../components/layouts/members/UsersTableCard";
import { parentsColumns } from "../columns";
import PropTypes from "prop-types";

const ParentsTable = ({ data, onRowClick }) => {
  return (
    <UsersTableCard
      title="Padres / Madres de familia"
      data={data}
      columns={parentsColumns}
      onRowClick={onRowClick}
    />
  );
};

export default ParentsTable;

ParentsTable.propTypes = {
  data: PropTypes.array,
  onRowClick: PropTypes.func,
};
