import { useMutation } from "@apollo/client";
import { RESET_PASSWORD_MUTATION } from "graphql/mutations";
import { useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import logo from "../../../assets/images/Logo-Banda-Cedes-Don-Bosco.webp";

const PasswordReset = () => {
  const { token } = useParams();
  const [newPassword, setNewPassword] = useState("");
  const [resetPassword] = useMutation(RESET_PASSWORD_MUTATION);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await resetPassword({ variables: { token, newPassword } });
      alert("Se cambió la contraseña correctamente!");

      <Navigate to="/autenticacion/iniciar-sesion" />;
    } catch (error) {
      alert("Error al cambiar la contraseña. Intenta más tarde.");
    }
  };

  return (
    <section className="bg-white flex flex-col items-center justify-center min-h-screen">
      <div>
        <img src={logo} alt="" className="w-auto h-16 sm:h-16 md:h-20 lg:h-24 xl:h-28" />
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
