import React, { useState } from "react";
import PropTypes from "prop-types";
import { IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { gql, useMutation } from "@apollo/client";
import { GET_TICKETS } from "graphql/queries";

const PURCHASE_TICKET = gql`
  mutation PurchaseTicket(
    $eventId: ID!
    $buyerName: String!
    $buyerEmail: String!
    $ticketQuantity: Int!
  ) {
    purchaseTicket(
      eventId: $eventId
      buyerName: $buyerName
      buyerEmail: $buyerEmail
      ticketQuantity: $ticketQuantity
    ) {
      id
      eventId
      type
      ticketQuantity
      qrCode
      buyerName
      buyerEmail
    }
  }
`;

const Modal = ({ onClose }) => {
  const [purchaseTicket, { loading: purchaseLoading, error: purchaseError }] = useMutation(
    PURCHASE_TICKET,
    {
      update: (cache, { data: { purchaseTicket } }) => {
        const data = cache.readQuery({
          query: GET_TICKETS,
          variables: { eventId: purchaseInput.eventId },
        });

        if (data) {
          const { getTickets } = data;
          cache.writeQuery({
            query: GET_TICKETS,
            variables: { eventId: purchaseInput.eventId },
            data: { getTickets: getTickets.concat([purchaseTicket]) },
          });
        } else {
          cache.writeQuery({
            query: GET_TICKETS,
            variables: { eventId: purchaseInput.eventId },
            data: { getTickets: [purchaseTicket] },
          });
        }
      },
    }
  );
  const [message, setMessage] = useState("");

  const [purchaseInput, setPurchaseInput] = useState({
    eventId: "6887aef1f539d32d81515d6f",
    buyerName: "",
    buyerEmail: "",
    ticketQuantity: 2,
  });

  const handlePurchaseChange = (name, value) => {
    if (name === "ticketQuantity") {
      value = parseInt(value, 10);
    }
    setPurchaseInput({ ...purchaseInput, [name]: value });
  };

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

    try {
      await purchaseTicket({ variables: purchaseInput });

      setMessage(`Entradas asignadas con éxito. Revisa tu correo electrónico!`);

      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (error) {
      alert("Error al reservar entradas");

      console.error("Error al inscribirse:", error.message);
    }
  };

  return (
    <div
      id="authentication-modal"
      tabIndex="-1"
      aria-hidden="true"
      className="fixed shadow top-0 left-0 right-0 z-50  w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-[calc(100%-1rem)] max-h-full flex items-center justify-center"
    >
      {message && showMessage()}
      <div className="modal-backdrop">
        {/* <!-- Modal content --> */}
        <div className="modal-content override">
          <div className="flex justify-end">
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </div>

          <div className="">
            <h3 className=" mb-8 text-3xl font-medium text-gray-900 ">Comprar entradas</h3>
            <form className="space-y-6" action="#" onSubmit={handleSubmit}>
              <h3 className=" mb-8 text-xl font-medium text-gray-900 ">
                Información del comprador
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 ">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    name="buyerName"
                    id="buyerName"
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: "0.375rem",
                      width: "100%",
                      height: "calc(2.25rem + 2px)",
                      color: "#000",
                      boxShadow: "none",
                    }}
                    className="bg-gray-50 border border-gray-900 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 "
                    placeholder="Digite su nombre completo"
                    required
                    value={purchaseInput.buyerName}
                    onChange={(e) => handlePurchaseChange(e.target.name, e.target.value)}
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 ">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    name="buyerEmail"
                    id="buyerEmail"
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
                    value={purchaseInput.buyerEmail}
                    onChange={(e) => handlePurchaseChange(e.target.name, e.target.value)}
                  />
                </div>

                <hr />
                <div className="col-span-2 md:col-span-1">
                  <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 ">
                    Cantidad de entradas
                  </label>
                  <input
                    type="number"
                    name="ticketQuantity"
                    id="ticketQuantity"
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: "0.375rem",
                      width: "100%",
                      height: "calc(2.25rem + 2px)",
                      color: "#000",
                      boxShadow: "none",
                    }}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 "
                    required
                    value={purchaseInput.ticketQuantity}
                    onChange={(e) => handlePurchaseChange(e.target.name, e.target.value)}
                  />
                </div>
              </div>
              <button
                type="submit"
                className="relative z-10 w-full inline-flex items-center justify-center rounded-full border border-primary bg-[#293964] px-6 py-3 text-center text-sm font-medium text-white shadow-sm transition-all duration-500 hover:bg-black hover:text-white"
                disabled={purchaseLoading}
              >
                {purchaseLoading ? "Procesando..." : "Reservar entradas"}
              </button>

              {purchaseError && (
                <p className="mt-4 text-red-500">Error: {purchaseError?.message}</p>
              )}
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
