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
        variables: { email },
      });

      if (data && data.requestReset) {
        // Email sent successfully
        onSubmit();
        setEmail("");
        onClose(); // Close the modal

        alert("Revisa tu correo, se ha enviado el link para cambiar la contraseña.");
      } else {
        // Show a friendly message when the server returns false
        alert("No se pudo enviar el correo. Por favor, inténtalo más tarde.");
      }
    } catch (error) {
      console.error("No se pudo enviar el correo.", error.message);
      // Show a user-friendly error message
      alert("Ocurrió un error al enviar el correo. Por favor, inténtalo más tarde");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Recuperar contraseña</DialogTitle>
      <DialogContent>
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ marginBottom: "0.5rem" }}>
            <label style={{ fontWeight: "bold" }}>Email</label>
          </div>
          <input
            type="email"
            id="email"
            className="block w-full my-6 px-32 py-4 leading-4 transition-colors duration-200 ease-in-out border-0 shadow-sm rounded-xl bg-slate-50 text-md text-slate-900 shadow-sky-100/50 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 hover:bg-white focus:border-0 focus:bg-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-sky-600/60"
            placeholder="Ingrese su correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleForgotPassword} disabled={!email} color="#0f172a">
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
