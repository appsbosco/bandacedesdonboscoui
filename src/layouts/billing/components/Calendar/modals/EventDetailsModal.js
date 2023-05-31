import { Modal } from "@mui/material";
import PropTypes from "prop-types";

function EventDetailsModal({ openModal, handleCloseModal, selectedEvent }) {
  return (
    <Modal
      open={openModal}
      onClose={handleCloseModal}
      sx={{ boxShadow: " rgba(100, 100, 111, 0.2) 0px 7px 29px 0px" }}
    >
      {/* The rest of your component here */}
    </Modal>
  );
}

EventDetailsModal.propTypes = {
  openModal: PropTypes.bool.isRequired,
  handleCloseModal: PropTypes.func.isRequired,
  selectedEvent: PropTypes.object.isRequired,
};
