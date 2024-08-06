import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { ADD_EXALUMNO } from "graphql/mutations";
import { gql, useMutation, useQuery } from "@apollo/client";
import { useNavigate } from "react-router-dom";
import { ADD_GUATEMALA } from "graphql/mutations";
import { GET_USERS } from "graphql/queries";
import CustomSelect from "components/CustomSelect";

const SEND_EMAIL = gql`
  mutation SendEmail($input: EmailInput!) {
    sendEmail(input: $input)
  }
`;

const Modal = ({ onClose }) => {
  const [addGuatemala] = useMutation(ADD_GUATEMALA);
  const [sendEmail] = useMutation(SEND_EMAIL);
  const { loading, data: usersData } = useQuery(GET_USERS);
  const [message, setMessage] = useState(null);
  const [fullName, setFullName] = useState(null);
  const [email, setEmail] = useState("");
  const [identification, setIdentification] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [instrument, setInstrument] = useState("");
  const [comments, setComments] = useState("");
  const [children, setChildren] = useState([]);
  const [authorized, setAuthorized] = useState(false);

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
      phoneNumber,
      identification,
      instrument,
      email,
      comments,
      children,
      authorized,
    };

    try {
      await addGuatemala({ variables: { input } });
      setIsRegistrationSuccessful(true);
      setMessage(`¡Respuesta enviada!`);

      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (error) {
      console.error("Error al inscribirse:", error.message);
    }
  };

  useEffect(() => {
    if (isRegistrationSuccessful && authorized) {
      const emailContent = `
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <meta http-equiv="Content-Type" content="text/html charset=UTF-8" />
      <html lang="en">
        <head></head>
        <div
          id="__react-email-preview"
          style="
            display: none;
            overflow: hidden;
            line-height: 1px;
            opacity: 0;
            max-height: 0;
            max-width: 0;
          "
        >
          <p style="font-size: 32px; line-height: 1.3; margin: 16px 0; font-weight: 700; color: #484848">
            ¡Hola, ${fullName} ! Has hecho la inscripción exitosamente
          </p>
          <div>
             ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿
          </div>
        </div>
      
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
                                  Gira Guatemala Banda CEDES Don Bosco, 2024 🙌🏻 🎶
                                </p>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <!-- <table
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
                                  alt=""
                                  src="https://res.cloudinary.com/dnv9akklf/image/upload/q_auto,f_auto/v1686511395/LOGO_BCDB_qvjabt.png"
                                  
                                  style="
                                  display: block;
                                  outline: none;
                                  border: none;
                                  text-decoration: none;
                                  margin: 0 auto;
                                  margin-bottom: 16px;
                                  border-radius: 50%;
                                  max-width: 100%;
                                  height: auto;
                                  "
                                />
                              </td>
                            </tr>
                          </tbody>
                        </table> -->
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
                                      Estimado/a ${fullName},
                                       
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
                                        "¡Gracias por hacer la inscripción de su hijo/a o exalumno a la Gira Cultural de nuestra banda a Guatemala, que se llevará a cabo del 26 de enero al 3 de febrero de 2025! Estamos encantados de contar con su participación en esta experiencia que promete ser tan enriquecedora como educativa."
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
                                      Detalles Importantes de la Gira:                                    
                                      </p>
                                      <p
                                        style="
                                          font-size: 18px;
                                          line-height: 1.4;
                                          margin: 16px 0;
                                          color: #484848;
                                        "
                                      >
                                      Fecha: 26 de enero al 3 de febrero de 2025
                                      </p>
      
                                     
                                    
                                      <p
                                        style="
                                          font-size: 18px;
                                          line-height: 1.4;
                                          margin: 16px 0;
                                          color: #484848;
                                        "
                                      >
                                      Actividades Principales: Visitas a colegios y universidades salesianas, lugares turísticos, y excursiones culturales y turísticas.
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
                                        ¡Estamos emocionados por la oportunidad de vivir esta experiencia juntos y de fortalecer los lazos que nos unen a través de la música y la cultura! ¡Nos vemos muy pronto!
                                      </p>
      
                                      <a
                                        href=""
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
                                          p-y: 19px;
                                          line-height: 100%;
                                          max-width: 100%;
                                          padding: 19px 0px;
                                        "
                                        ><span
                                          ><!--[if mso
                                            ]><i
                                              style="
                                                letter-spacing: undefinedpx;
                                                mso-font-width: -100%;
                                                mso-text-raise: 28.5;
                                              "
                                              hidden
                                              >&nbsp;</i
                                            ><!
                                          [endif]--></span
                                        ><span
                                          style="
                                            background-color: #293964;
                                            border-radius: 3px;
                                            color: #fff;
                                            font-size: 18px;
                                            text-decoration: none;
                                            text-align: center;
                                            display: inline-block;
                                            width: 100%;
                                            p-y: 19px;
                                            max-width: 100%;
                                            line-height: 120%;
                                            text-transform: none;
                                            mso-padding-alt: 0px;
                                            mso-text-raise: 14.25px;
                                          "
                                          >Nos vemos pronto</span
                                        ><span
                                          ><!--[if mso
                                            ]><i
                                              style="letter-spacing: undefinedpx; mso-font-width: -100%"
                                              hidden
                                              >&nbsp;</i
                                            ><!
                                          [endif]--></span
                                        ></a
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
                                        Copyright © 2024 Banda CEDES Don Bosco. Todos los derechos
                                        reservados
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
            subject:
              "Confirmación de inscripción: Gira Cultural Banda CEDES Don Bosco - Guatemala 2025",
            html: emailContent,
          },
        },
      });
    }
  }, [isRegistrationSuccessful, authorized, email, sendEmail]);

  if (loading) {
    return <div></div>;
  }

  const sortedUsers = [...usersData?.getUsers].sort((a, b) => {
    const nameA = `${a.name} ${a.firstSurName} ${a.secondSurName}`.toLowerCase();
    const nameB = `${b.name} ${b.firstSurName} ${b.secondSurName}`.toLowerCase();
    return nameA.localeCompare(nameB);
  });

  const instruments = [
    "No Aplica",
    "Flauta",
    "Clarinete",
    "Saxofón",
    "Trompeta",
    "Trombón",
    "Tuba",
    "Eufonio",
    "Corno Francés",
    "Mallets",
    "Percusión",
    "Color Guard",
    "Danza",
  ];

  return (
    <div
      id="authentication-modal"
      tabIndex="-1"
      aria-hidden="true"
      className="fixed shadow top-0 left-0 right-0 z-50  w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-[calc(100%-1rem)] max-h-full flex items-center justify-center"
    >
      {message && showMessage()}
      <div className="relative w-full max-w-2xl max-h-full">
        {/* <!-- Modal content --> */}
        <div className="relative bg-white rounded-lg shadow ">
          <div className="flex justify-end">
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </div>

          <div className="px-6 py-6 lg:px-8">
            <h3 className=" mb-8 text-3xl font-medium text-gray-900 ">
              Asistencia Gira Guatemala - 2025
            </h3>
            <form className="space-y-6" action="#" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="authorized"
                  className="block mb-2 text-sm font-medium text-gray-900"
                >
                  ¿Autoriza a su hijo/a a asistir a la gira?
                </label>
                <select
                  name="authorized"
                  id="authorized"
                  value={authorized ? "yes" : "no"}
                  onChange={(e) => setAuthorized(e.target.value === "yes")}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                >
                  <option value="yes">Sí</option>
                  <option value="no">No</option>
                </select>
              </div>

              <h3 className=" mb-8 text-xl font-medium text-gray-900 ">
                Información del encargado
              </h3>

              <div>
                <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 ">
                  Nombre completo
                </label>
                <input
                  type="text"
                  name="fullName"
                  id="fullName"
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "0.375rem",
                    width: "100%",
                    height: "calc(2.25rem + 2px)",
                    color: "#000",
                    boxShadow: "none",
                  }}
                  className="bg-gray-50 border border-gray-900 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 "
                  placeholder="Carlos Pereira"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              {authorized && (
                <>
                  <div>
                    <label
                      htmlFor="email"
                      className="block mb-2 text-sm font-medium text-gray-900 "
                    >
                      Número de cédula
                    </label>
                    <input
                      type="text"
                      name="identification"
                      id="identification"
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: "0.375rem",
                        width: "100%",
                        height: "calc(2.25rem + 2px)",
                        color: "#000",
                        boxShadow: "none",
                      }}
                      className="bg-gray-50 border border-stone-950 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 "
                      placeholder="1-1111-1111"
                      required
                      value={identification}
                      onChange={(e) => setIdentification(e.target.value)}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block mb-2 text-sm font-medium text-gray-900 "
                    >
                      Correo electrónico
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: "0.375rem",
                        width: "100%",
                        height: "calc(2.25rem + 2px)",
                        color: "#000",
                        boxShadow: "none",
                      }}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 "
                      placeholder="hola@ejemplo.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block mb-2 text-sm font-medium text-gray-900 "
                    >
                      Número telefónico
                    </label>
                    <input
                      type="text"
                      name="phoneNumber"
                      id="phoneNumber"
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: "0.375rem",
                        width: "100%",
                        height: "calc(2.25rem + 2px)",
                        color: "#000",
                        boxShadow: "none",
                      }}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 "
                      placeholder="+506 8888-8888"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>
                </>
              )}

              <hr />
              <h3 className=" mb-8 text-xl font-medium text-gray-900 ">
                Información del integrante
              </h3>

              <div>
                <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 ">
                  Integrante de la banda
                </label>
                <CustomSelect
                  labelId="user-label"
                  value={children}
                  onChange={(e) => setChildren(e.target.value)}
                  options={sortedUsers?.map((user) => ({
                    value: user.id,
                    label: `${user.name} ${user.firstSurName} ${user.secondSurName}`,
                  }))}
                />
              </div>
              <div>
                <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 ">
                  Sección de la banda del integrante
                </label>

                <CustomSelect
                  labelId="user-label"
                  value={instrument}
                  onChange={(e) => setInstrument(e.target.value)}
                  options={instruments?.map((ins) => ({
                    value: ins,
                    label: ins,
                  }))}
                />
              </div>

              <div>
                <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 ">
                  {!authorized ? "Motivo de no asistencia" : "Comentarios adicionales"}
                </label>
                <textarea
                  className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  id="comments"
                  name="comments"
                  rows="5"
                  cols="33"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center rounded-full gap-2.5 justify-center px-7 py-3 font-semibold leading-none outline-offset-2 transition-all duration-200 ease-in-out active:transition-none bg-slate-900 text-white hover:bg-sky-800 w-full text-base sm:text-lg"
              >
                Enviar
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
