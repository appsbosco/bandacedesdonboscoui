import PropTypes from "prop-types";
import { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Input,
} from "@material-ui/core";
import { REQUEST_RESET_MUTATION } from "graphql/mutations";
import { useMutation } from "@apollo/client";

const ForgotPasswordModal = ({ open, onClose, onSubmit }) => {
  const [email, setEmail] = useState("");
  const [requestReset] = useMutation(REQUEST_RESET_MUTATION);

  const handleForgotPassword = async () => {
    try {
      const { data } = await requestReset({
        variables: { email }, // Pass the email parameter
      });
      if (data.requestReset) {
        // Email sent successfully
        onSubmit();
        setEmail("");
        onClose(); // Close the modal
      } else {
        // console.error("Error sending reset link.");
      }
    } catch (error) {
      console.error("Error sending reset link:", error.message);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Recuperar Contraseña</DialogTitle>
      <DialogContent>
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ marginBottom: "0.5rem" }}>
            <label style={{ fontWeight: "bold" }}>Email</label>
          </div>
          <Input
            autoFocus
            margin="dense"
            label=""
            type="email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleForgotPassword} disabled={!email} color="primary">
          Recuperar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

ForgotPasswordModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default ForgotPasswordModal;
