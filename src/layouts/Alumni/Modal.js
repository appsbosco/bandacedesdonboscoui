import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { ADD_EXALUMNO } from "graphql/mutations";
import { gql, useMutation } from "@apollo/client";
import { useNavigate } from "react-router-dom";

const SEND_EMAIL = gql`
  mutation SendEmail($input: EmailInput!) {
    sendEmail(input: $input)
  }
`;

const instrumentos = [
  "Flauta",
  "Piccolo",
  "Oboe",
  "Clarinete",
  "Clarinete bajo",
  "Saxofón alto",
  "Saxofón tenor",
  "Saxofón barítono",
  "Trompeta",
  "Trombón",
  "Eufonio",
  "Tuba",
  "Percusión",
  "Mallets",
  "Bajo eléctrico",
  "Corno Francés",
];

const instrumentLinks = {
  Flauta: "https://drive.google.com/drive/folders/1oy2A6-X3wDa97k1h-61NLt-GJsrZiLUq?usp=drive_link",
  Piccolo:
    "https://drive.google.com/drive/folders/1Um8GtdvXl9DYkKLgbA130z2062yAmi6X?usp=drive_link",
  Oboe: "https://drive.google.com/drive/folders/1AFTYnECbMsHUyQWRmdF7IUeTH-NUAhHH?usp=drive_link",
  Clarinete:
    "https://drive.google.com/drive/folders/1TxCHNsGyEd-9BmLRWDcV84hx7MerBZZZ?usp=drive_link",
  "Clarinete bajo":
    "https://drive.google.com/drive/folders/1I3AhZVvhVACcFSLJmHHuVem5in8tfFXN?usp=drive_link",
  "Saxofón alto":
    "https://drive.google.com/drive/folders/1318DhpK_ylzLehhyF_ECdPn3rBGilqoK?usp=drive_link",
  "Saxofón tenor":
    "https://drive.google.com/drive/folders/16Huuf3c6zp3ki79zu3dHSsi4x159pENl?usp=drive_link",
  "Saxofón barítono":
    "https://drive.google.com/drive/folders/1JvLHXilWyFhS_-IlpOqB_NUV1nqSodLK?usp=drive_link",
  Trompeta:
    "https://drive.google.com/drive/folders/1WBhEWXf1au09xB1HDivSsHpm0FDpaxCw?usp=drive_link",
  Trombón:
    "https://drive.google.com/drive/folders/1mEoapy4qUfx88m2fcflyDYRw8ozZCqK9?usp=drive_link",
  Eufonio:
    "https://drive.google.com/drive/folders/11afDGImW9l3MTrR6Cs5-U-19gUuF-1ii?usp=drive_link",
  Tuba: "https://drive.google.com/drive/folders/1GKGpgPu1-HpAsaggP5XxWJFz7dWPauNQ?usp=drive_link",
  Percusión:
    "https://drive.google.com/drive/folders/1ZIMGNLOzV7qCFPzZoe6_JYFzpoPEj88E?usp=drive_link",
  Mallets:
    "https://drive.google.com/drive/folders/1wACsr_XWaeWfgFXOI2PqWRDuj3cdj_BF?usp=drive_link",
  "Bajo eléctrico":
    "https://drive.google.com/drive/folders/1Kz-fxBgJF2y8WnKQfUSGXkCx65thmtmM?usp=drive_link",
  "Corno Francés":
    "https://drive.google.com/drive/folders/1XXmZ6rDP7nvURUHw6BBDVHa72W-AAgtK?usp=drive_link",
};

const Modal = ({ onClose }) => {
  const [addExAlumno] = useMutation(ADD_EXALUMNO);
  const [sendEmail] = useMutation(SEND_EMAIL);
  const [message, setMessage] = useState(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [identification, setIdentification] = useState("");
  const [yearGraduated, setYearGraduated] = useState(2023);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [instrument, setInstrument] = useState("");
  const [address, setAddress] = useState("");
  const [instrumentCondition, setInstrumentCondition] = useState("");

  const [isRegistrationSuccessful, setIsRegistrationSuccessful] = useState(false);
  const navigate = useNavigate();

  const showMessage = () => {
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
            <p style={{ marginBottom: "1rem" }}>{message}</p>
          </div>
        </div>
      </div>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const input = {
      fullName,
      email,
      identification,
      yearGraduated: parseInt(yearGraduated),
      phoneNumber,
      instrument,
      address,
      instrumentCondition,
    };

    try {
      await addExAlumno({ variables: { input } });
      setIsRegistrationSuccessful(true);
      setMessage(`¡Muchas gracias por inscribirte!`);
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("Error al inscribirse:", error.message);
      setMessage(error.message);
      setTimeout(() => {
        setMessage(null);
      }, 2000);
    }
  };

  useEffect(() => {
    if (isRegistrationSuccessful) {
      const repertorioLink = instrumentLinks[instrument] || "#";

      const emailContent = `
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8" />
        </head>
        <body
          style="
            background-color: #ffffff;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu,
              Cantarell, 'Helvetica Neue', sans-serif;
          "
        >
          <table
            style="
              background-color: #ffffff;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu,
                Cantarell, 'Helvetica Neue', sans-serif;
            "
            align="center"
            border="0"
            cellpadding="0"
            cellspacing="0"
            role="presentation"
            width="100%"
          >
            <tbody>
              <tr>
                <td>
                  <table
                    align="center"
                    role="presentation"
                    cellspacing="0"
                    cellpadding="0"
                    border="0"
                    width="100%"
                    style="max-width: 37.5em; margin: 0 auto; padding: 20px 0 48px; width: 580px"
                  >
                    <tr style="width: 100%">
                      <td>
                        <table
                          align="center"
                          border="0"
                          cellpadding="0"
                          cellspacing="0"
                          role="presentation"
                          width="100%"
                        >
                          <tbody>
                            <tr>
                              <td>
                                <img
                                  alt="BCDB"
                                  src="https://res.cloudinary.com/dnv9akklf/image/upload/q_auto,f_auto/v1686511395/LOGO_BCDB_qvjabt.png"
                                  style="
                                    display: block;
                                    outline: none;
                                    border: none;
                                    text-decoration: none;
                                    margin: 0;
                                    padding: 0;
                                    max-width: 30%;
                                    height: auto;
                                  "
                                />
                                <p
                                  style="
                                    font-size: 26px;
                                    line-height: 1.3;
                                    margin: 16px 0;
                                    font-weight: 700;
                                    color: #484848;
                                  "
                                >
                                  Concierto "Una Noche de Películas", 2024 🙌🏻 🎶
                                </p>
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        <table
                          style="padding-bottom: 20px"
                          align="center"
                          border="0"
                          cellpadding="0"
                          cellspacing="0"
                          role="presentation"
                          width="100%"
                        >
                          <tbody>
                            <tr>
                              <td>
                                <table
                                  width="100%"
                                  align="center"
                                  role="presentation"
                                  cellspacing="0"
                                  cellpadding="0"
                                  border="0"
                                >
                                  <tbody style="width: 100%">
                                    <tr style="width: 100%">
                                      <p
                                        style="
                                          font-size: 32px;
                                          line-height: 1.3;
                                          margin: 16px 0;
                                          font-weight: 700;
                                          color: #484848;
                                        "
                                      >
                                        ¡Hola, ${fullName}! Te has inscrito exitosamente.
                                      </p>
                                      <p
                                        style="
                                          font-size: 18px;
                                          line-height: 1.4;
                                          margin: 16px 0;
                                          color: #484848;
                                          padding: 24px;
                                          background-color: #f2f3f3;
                                          border-radius: 4px;
                                        "
                                      >
                                        "Esperamos que este correo te encuentre lleno/a de entusiasmo y listo/a para unirte a un nuevo concierto. Nos complace anunciarte que te has inscrito exitosamente al próximo concierto con la banda de exalumnos. Va a ser una increíble presentación y queremos contar con cada uno de ustedes para hacer de este evento un verdadero éxito."
                                      </p>

                                      <p
                                        style="
                                          font-size: 20px;
                                          line-height: 1.4;
                                          margin: 16px 0;
                                          color: #484848;
                                          font-weight: bold;
                                        "
                                      >
                                        Información importante:
                                      </p>
                                      <p
                                        style="
                                          font-size: 18px;
                                          line-height: 1.4;
                                          margin: 16px 0;
                                          color: #484848;
                                        "
                                      >
                                        Los ensayos serán los días:
                                      </p>
                                      <p
                                        style="
                                          font-size: 18px;
                                          line-height: 1.4;
                                          margin: 16px 0;
                                          color: #484848;
                                        "
                                      >
                                        - Sábado 5 de Octubre de 6:00pm a 8:00pm
                                      </p>
                                      <p
                                        style="
                                          font-size: 18px;
                                          line-height: 1.4;
                                          margin: 16px 0;
                                          color: #484848;
                                        "
                                      >
                                        - Sábado 19 de Octubre de 6:00pm a 8:00pm
                                      </p>
                                      <p
                                        style="
                                          font-size: 18px;
                                          line-height: 1.4;
                                          margin: 16px 0;
                                          color: #484848;
                                        "
                                      >
                                        - Sábado 26 de Octubre de 6:00pm a 8:00pm
                                      </p>
                                      <p
                                        style="
                                          font-size: 18px;
                                          line-height: 1.4;
                                          margin: 16px 0;
                                          color: #484848;
                                        "
                                      >
                                        - Sábado 16 de Noviembre de 7:00pm a 9:00pm
                                      </p>

                                      <br />
                                      <p
                                        style="
                                          font-size: 18px;
                                          line-height: 1.4;
                                          margin: 16px 0;
                                          color: #484848;
                                          font-weight: bold;
                                        "
                                      >
                                        Concierto
                                      </p>
                                      <p
                                        style="
                                          font-size: 18px;
                                          line-height: 1.4;
                                          margin: 16px 0;
                                          color: #484848;
                                        "
                                      >
                                        Fecha: 23 de Noviembre, 2024.
                                      </p>
                                      <p
                                        style="
                                          font-size: 18px;
                                          line-height: 1.4;
                                          margin: 16px 0;
                                          color: #484848;
                                        "
                                      >
                                        Hora: 7:00pm
                                      </p>
                                      <p
                                        style="
                                          font-size: 18px;
                                          line-height: 1.4;
                                          margin: 16px 0;
                                          color: #484848;
                                        "
                                      >
                                        Lugar: SUM CEDES Don Bosco
                                      </p>

                                      <br />

                                      <p
                                        style="
                                          font-size: 18px;
                                          line-height: 1.4;
                                          margin: 16px 0;
                                          color: #484848;
                                          font-weight: bold;
                                        "
                                      >
                                        Repertorio
                                      </p>
                                      <p
                                        style="
                                          font-size: 18px;
                                          line-height: 1.4;
                                          margin: 16px 0;
                                          color: #484848;
                                        "
                                      >
                                        Puedes descargar el repertorio para tu instrumento aquí: <a href="${repertorioLink}" target="_blank" style="color: #1a0dab; text-decoration: underline;">Descargar Repertorio</a>
                                      </p>

                                      <br />
                                      <p
                                        style="
                                          font-size: 18px;
                                          line-height: 1.4;
                                          margin: 16px 0;
                                          color: #484848;
                                          padding-bottom: 16px;
                                        "
                                      >
                                        ¡Sigamos haciendo música y preparémonos para ofrecer una presentación inolvidable! ¡Nos vemos pronto!
                                      </p>

                                      <a
                                        href="https://chat.whatsapp.com/ELC6XzbrSq96zyXEpGZThT"
                                        target="_blank"
                                        style="
                                          background-color: #293964;
                                          border-radius: 3px;
                                          color: #fff;
                                          font-size: 18px;
                                          text-decoration: none;
                                          text-align: center;
                                          display: inline-block;
                                          width: 100%;
                                          line-height: 100%;
                                          max-width: 100%;
                                          padding: 19px 0px;
                                        "
                                        >Unirse al grupo de WhatsApp</a
                                      >
                                    </tr>
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <hr
                          style="
                            width: 100%;
                            border: none;
                            border-top: 1px solid #eaeaea;
                            border-color: #cccccc;
                            margin: 20px 0;
                          "
                        />
                        <table
                          align="center"
                          border="0"
                          cellpadding="0"
                          cellspacing="0"
                          role="presentation"
                          width="100%"
                        >
                          <tbody>
                            <tr>
                              <td>
                                <table
                                  width="100%"
                                  align="center"
                                  role="presentation"
                                  cellspacing="0"
                                  cellpadding="0"
                                  border="0"
                                >
                                  <tbody style="width: 100%">
                                    <tr style="width: 100%">
                                      <p
                                        style="
                                          font-size: 14px;
                                          line-height: 24px;
                                          margin: 16px 0;
                                          color: #9ca299;
                                          margin-bottom: 10px;
                                        "
                                      >
                                        Copyright © 2024 Banda CEDES Don Bosco. Todos los derechos reservados
                                      </p>
                                      <a
                                        target="_blank"
                                        style="
                                          color: #9ca299;
                                          text-decoration: underline;
                                          font-size: 14px;
                                        "
                                        href="https://bandacedesdonbosco.com/"
                                      ></a>
                                    </tr>
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
      `;

      sendEmail({
        variables: {
          input: {
            to: email,
            subject: "Inscripción Exitosa",
            html: emailContent,
          },
        },
      });
    }
  }, [isRegistrationSuccessful, email, sendEmail, instrument]);

  return (
    <div id="authentication-modal" tabIndex="-1" aria-hidden="true" className="modal-backdrop">
      {message && showMessage()}
      <div className="modal-backdrop">
        {/* <!-- Modal content --> */}
        <div className="modal-content">
          <div className="flex justify-end">
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </div>

          <div className="">
            <h3 className=" mb-8 text-2xl font-medium text-gray-900 ">Inscribirme al concierto</h3>
            <form className="space-y-6" action="#" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 ">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    id="fullName"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 "
                    placeholder="Digite su nombre completo"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 ">
                    Número de cédula
                  </label>
                  <input
                    type="text"
                    name="identification"
                    id="identification"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 "
                    placeholder="Digite su número de cédula"
                    required
                    value={identification}
                    onChange={(e) => setIdentification(e.target.value)}
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 ">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    className="bg-gray-50 border-2 border-slate-100	 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 "
                    placeholder="Digite su correo electrónico"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="col-span-1">
                  <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 ">
                    Año graduación
                  </label>
                  <input
                    type="number"
                    name="yearGraduated"
                    id="yearGraduated"
                    className="bg-gray-50 border border-slate-100	 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 "
                    placeholder="Digite el año de graduación"
                    required
                    value={yearGraduated}
                    onChange={(e) => setYearGraduated(e.target.value)}
                  />
                </div>

                <div className="col-span-1">
                  <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 ">
                    Número telefónico
                  </label>
                  <input
                    type="text"
                    name="phoneNumber"
                    id="phoneNumber"
                    className="bg-gray-50 border-2 border-black text-sm rounded-lg  block w-full p-2.5 "
                    placeholder="Digite su número telefónico"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 ">
                    Instrumento
                  </label>
                  <select
                    type="text"
                    name="instrument"
                    id="instrument"
                    placeholder="Seleccione el instrumento que toca"
                    value={instrument}
                    onChange={(e) => setInstrument(e.target.value)}
                    className="border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: "0.375rem",
                      width: "100%",
                      height: "calc(2.25rem + 2px)",
                      color: "#000",
                    }}
                  >
                    <option value="">Seleccione una opción</option>

                    {instrumentos.map((instrumento) => (
                      <option key={instrumento} value={instrumento}>
                        {instrumento}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 ">
                    ¿Cuenta con instrumento propio?
                  </label>
                  <select
                    id="instrumentCondition"
                    name="instrumentCondition"
                    value={instrumentCondition}
                    onChange={(e) => setInstrumentCondition(e.target.value)}
                    className="border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: "0.375rem",
                      width: "100%",
                      height: "calc(2.25rem + 2px)",
                      color: "#000",
                    }}
                  >
                    <option value="">Seleccione una opción</option>
                    <option value="Sí">Sí</option>
                    <option value="No">No</option>
                  </select>
                  <p className="block my-2 text-xs ">
                    De ser la respuesta `No`, se intentará conseguir el préstamo de un instrumento,
                    más no se garantiza el 100%.
                  </p>
                </div>
                <div className="col-span-2">
                  <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 ">
                    Dirección de residencia
                  </label>
                  <textarea
                    className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    id="address"
                    name="address"
                    rows="5"
                    cols="33"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="inline-flex items-center rounded-full gap-2.5 justify-center px-7 py-3 font-semibold leading-none outline-offset-2 transition-all duration-200 ease-in-out active:transition-none bg-slate-900 text-white hover:bg-sky-800 w-full text-base sm:text-lg"
                disabled
              >
                Inscribirme
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

Modal.propTypes = {
  onClose: PropTypes.func.isRequired,
};
export default Modal;
