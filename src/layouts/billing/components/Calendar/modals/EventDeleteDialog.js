import PropTypes from "prop-types";

import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";

function EventDeleteDialog({ openModal, handleCloseModal, handleDeleteEvent }) {
  return (
    <Dialog open={openModal} onClose={handleCloseModal}>
      <DialogTitle>Eliminar evento</DialogTitle>
      <DialogContent>¿Estás seguro de que quieres eliminar este evento?</DialogContent>
      <DialogActions>
        <Button onClick={handleCloseModal}>Cancelar</Button>
        <Button onClick={handleDeleteEvent} color="secondary">
          Eliminar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

EventDeleteDialog.propTypes = {
  openModal: PropTypes.bool.isRequired,
  handleCloseModal: PropTypes.func.isRequired,
  handleDeleteEvent: PropTypes.func.isRequired,
};
