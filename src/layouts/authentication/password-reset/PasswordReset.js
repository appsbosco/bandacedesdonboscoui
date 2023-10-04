import { useMutation } from "@apollo/client";
import { RESET_PASSWORD_MUTATION } from "graphql/mutations";
import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import logo from "../../../assets/images/Logo-Banda-Cedes-Don-Bosco.webp";
import login from "../../../assets/images/log-in.webp";
import loginerror from "../../../assets/images/loginerror.webp";

const PasswordReset = () => {
  const { token } = useParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetPassword] = useMutation(RESET_PASSWORD_MUTATION);

  const navigate = useNavigate();

  // State to show error message
  const [message, setMessage] = useState(null);

  const showMessage = () => {
    let imageSource = message !== "Se cambió la contraseña correctamente!" ? loginerror : login;

    return (
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: "9999",
          backgroundColor: "#ffffff",
          padding: "20px",
          textAlign: "center",
          boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
          borderRadius: "8px",
          maxWidth: "90%",
          width: "400px",
        }}
      >
        <div className="container">
          <div className="content" id="popup">
            <img
              src={imageSource}
              alt="Banda CEDES Don Bosco"
              style={{ width: "60%", display: "block", margin: "0 auto", marginBottom: "1rem" }}
            />
            <p style={{ marginBottom: "1rem" }}>{message}</p>
          </div>
        </div>
      </div>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      alert("Las contraseñas no coinciden. Por favor, verifícalas.");
      return;
    }

    try {
      await resetPassword({ variables: { token, newPassword } });
      setMessage("Se cambió la contraseña correctamente!");
    } catch (error) {
      setMessage("Error al cambiar la contraseña. Intenta más tarde.");
    }
  };

  useEffect(() => {
    let timeoutId = null;
    if (message) {
      timeoutId = setTimeout(() => {
        setMessage(null);
        navigate("/autenticacion/iniciar-sesion");
      }, 4000);
    }

    return () => {
      clearTimeout(timeoutId);
    };
  }, [message]);

  return (
    <section className="bg-white flex flex-col items-center justify-center min-h-screen">
      {message && showMessage()}
      <div>
        <img src={logo} alt="" className="w-auto h-28 sm:h-16 md:h-20 lg:h-24 xl:h-28" />
      </div>

      <div className="py-8 px-12 w-[100%] md:w-[50%] max-w-4xl lg:py-16">
        <h2 className="mb-4 text-xl font-bold text-gray-900">Cambiar contraseña</h2>
        <form onSubmit={handleSubmit}>
          <div className="sm:col-span-2">
            <label htmlFor="new-password" className="block mb-2 text-sm font-medium text-gray-900">
              Nueva Contraseña
            </label>
            <input
              type="password"
              id="new-password"
              className="block w-full my-6 px-32 py-4 leading-4 transition-colors duration-200 ease-in-out border-0 shadow-sm rounded-xl bg-slate-50 text-md text-slate-900 shadow-sky-100/50 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 hover:bg-white focus:border-0 focus:bg-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-sky-600/60"
              placeholder="Ingrese la nueva contraseña"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label
              htmlFor="confirm-password"
              className="block mb-2 text-sm font-medium text-gray-900"
            >
              Confirmar Nueva Contraseña
            </label>
            <input
              type="password"
              id="confirm-password"
              className="block w-full my-6 px-32 py-4 leading-4 transition-colors duration-200 ease-in-out border-0 shadow-sm rounded-xl bg-slate-50 text-md text-slate-900 shadow-sky-100/50 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 hover:bg-white focus:border-0 focus:bg-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-sky-600/60"
              placeholder="Confirme la nueva contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center rounded-full gap-2.5 justify-center px-16 py-3 font-semibold leading-none outline-offset-2 transition-all duration-200 ease-in-out active:transition-none bg-slate-900 text-white hover:bg-sky-800 w-full text-base sm:text-lg"
          >
            Cambiar
          </button>
        </form>
      </div>
    </section>
  );
};

export default PasswordReset;
