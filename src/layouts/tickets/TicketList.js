import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import Footer from "examples/Footer";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { useMutation, useQuery, gql } from "@apollo/client";
import { GET_TICKETS } from "graphql/queries";

const GET_EVENTS = gql`
  query GetEventsT {
    getEventsT {
      id
      name
      date
      description
      ticketLimit
      totalTickets
      raffleEnabled
      price
    }
  }
`;

const UPDATE_PAYMENT_STATUS = gql`
  mutation UpdatePaymentStatus($ticketId: ID!, $amountPaid: Float!) {
    updatePaymentStatus(ticketId: $ticketId, amountPaid: $amountPaid) {
      id
      paid
      amountPaid
    }
  }
`;

const TicketList = () => {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventPrice, setEventPrice] = useState(0);
  const [totalPurchased, setTotalPurchased] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [percentagePaid, setPercentagePaid] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [filteredTickets, setFilteredTickets] = useState([]);

  const { loading: eventsLoading, error: eventsError, data: eventsData } = useQuery(GET_EVENTS);
  const {
    loading: ticketsLoading,
    error: ticketsError,
    data: ticketsData,
  } = useQuery(GET_TICKETS, {
    variables: { eventId: selectedEvent?.id },
  });
  const [updatePaymentStatus] = useMutation(UPDATE_PAYMENT_STATUS);

  useEffect(() => {
    if (ticketsData && ticketsData.getTickets) {
      const purchased = ticketsData.getTickets.reduce(
        (acc, ticket) => acc + ticket.ticketQuantity,
        0
      );
      const paid = ticketsData.getTickets.reduce(
        (acc, ticket) => (ticket.paid ? acc + ticket.ticketQuantity : acc),
        0
      );
      const percentage = purchased > 0 ? (paid / purchased) * 100 : 0;
      setTotalPurchased(purchased);
      setTotalPaid(paid);
      setPercentagePaid(percentage.toFixed(2));

      const filtered = ticketsData.getTickets.filter((ticket) => {
        const fullName = ticket.userId
          ? `${ticket.userId.name} ${ticket.userId.firstSurName} ${ticket.userId.secondSurName}`
          : ticket.buyerName;
        const email = ticket.userId ? ticket.userId.email : ticket.buyerEmail;
        const raffleNumbers = ticket.raffleNumbers ? ticket.raffleNumbers.join(", ") : "";

        return (
          ticket.paid.toString().toLowerCase().includes(searchText.toLowerCase()) ||
          fullName.toLowerCase().includes(searchText.toLowerCase()) ||
          email.toLowerCase().includes(searchText.toLowerCase()) ||
          raffleNumbers.toLowerCase().includes(searchText.toLowerCase())
        );
      });
      setFilteredTickets(filtered);
    }
  }, [ticketsData, searchText]);

  if (eventsLoading || ticketsLoading) return <p>Cargando...</p>;
  if (eventsError || ticketsError) return <p>Error :(</p>;

  const handleMarkAsPaid = (ticketId, ticketQuantity) => {
    const amountPaid = ticketQuantity * eventPrice;
    updatePaymentStatus({
      variables: { ticketId, amountPaid },
    });
  };

  const handleEventChange = (e) => {
    const eventId = e.target.value;
    const selectedEvent = eventsData.getEventsT.find((event) => event.id === eventId);
    setSelectedEvent(selectedEvent);
    setEventPrice(selectedEvent ? selectedEvent.price : 0);
  };

  const availableTickets = selectedEvent ? selectedEvent.ticketLimit - totalPurchased : 0;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <div className="p-6 page-content">
        <div className="flex flex-col md:flex-row items-center justify-between w-full mb-6">
          <h4 className="text-xl font-medium w-6/12">Lista de entradas</h4>

          <select
            value={selectedEvent?.id || ""}
            onChange={handleEventChange}
            className="p-2 border my-4 rounded md:w-6/12 w-full"
          >
            <option value="">Seleccione un evento</option>
            {eventsData?.getEventsT?.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-6">
          <div className="xl:col-span-9">
            <div className="space-y-6">
              {selectedEvent ? (
                <>
                  <div className="grid lg:grid-cols-3 sm:grid-cols-2 gap-6">
                    <div className="border rounded-lg p-6 overflow-hidden border-default-200">
                      <div className="flex items-center gap-4">
                        <div className="inline-flex items-center justify-center rounded-full bg-primary/20 text-primary h-16 w-16">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            data-lucide="banknote"
                            className="lucide lucide-banknote h-8 w-8"
                          >
                            <rect width="20" height="12" x="2" y="6" rx="2"></rect>
                            <circle cx="12" cy="12" r="2"></circle>
                            <path d="M6 12h.01M18 12h.01"></path>
                          </svg>
                        </div>
                        <div className="">
                          <p className="text-base text-default-500 font-medium mb-1">
                            Entradas compradas
                          </p>
                          <h4 className="text-2xl text-default-950 font-semibold mb-2">
                            {totalPurchased}
                          </h4>
                          <p className="text-base text-default-500 font-medium mb-1">
                            Entradas disponibles: {availableTickets}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="border rounded-lg p-6 overflow-hidden border-default-200">
                      <div className="flex items-center gap-4">
                        <div className="inline-flex items-center justify-center rounded-full bg-yellow-500/20 text-yellow-500 h-16 w-16">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            data-lucide="wallet"
                            className="lucide lucide-wallet h-8 w-8"
                          >
                            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path>
                            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path>
                            <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path>
                          </svg>
                        </div>
                        <div>
                          <p className="text-base text-default-500 font-medium mb-1">
                            Entradas pagadas
                          </p>
                          <h4 className="text-2xl text-default-950 font-semibold mb-2">
                            {totalPaid} = ₡{(totalPaid * eventPrice).toFixed(2)}
                          </h4>
                        </div>
                      </div>
                    </div>
                    <div className="border rounded-lg p-6 overflow-hidden border-default-200">
                      <div className="flex items-center gap-4">
                        <div className="inline-flex items-center justify-center rounded-full bg-green-500/20 text-green-500 h-16 w-16">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            data-lucide="star"
                            className="lucide lucide-star h-8 w-8 fill-green-500"
                          >
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                          </svg>
                        </div>
                        <div className="">
                          <p className="text-base text-default-500 font-medium mb-1">
                            Porcentaje pagadas
                          </p>
                          <h4 className="text-2xl text-default-950 font-semibold mb-2">
                            {percentagePaid}%
                          </h4>
                        </div>
                      </div>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Buscar"
                    className="p-2 border my-4 rounded md:w-6/12 w-full"
                  />
                  <div className="grid grid-cols-1">
                    <div className="border rounded-lg border-default-200">
                      <div className="relative overflow-x-auto">
                        <div className="min-w-full inline-block align-middle">
                          <div className="overflow-hidden">
                            <table className="min-w-full divide-y divide-default-200">
                              <thead className="bg-default-100">
                                <tr className="text-start">
                                  <th className="px-6 py-3 text-start text-sm whitespace-nowrap font-medium text-default-800 min-w-[10rem]">
                                    Estado
                                  </th>
                                  <th className="px-6 py-3 text-start text-sm whitespace-nowrap font-medium text-default-800">
                                    Nombre completo
                                  </th>
                                  <th className="px-6 py-3 text-start text-sm whitespace-nowrap font-medium text-default-800">
                                    Correo
                                  </th>
                                  <th className="px-6 py-3 text-start text-sm whitespace-nowrap font-medium text-default-800">
                                    Tipo
                                  </th>
                                  <th className="px-6 py-3 text-start text-sm whitespace-nowrap font-medium text-default-800">
                                    Escaneada
                                  </th>
                                  <th className="px-6 py-3 text-start text-sm whitespace-nowrap font-medium text-default-800">
                                    Números
                                  </th>
                                  <th className="px-6 py-3 text-start text-sm whitespace-nowrap font-medium text-default-800">
                                    Cantidad
                                  </th>
                                  <th className="px-6 py-3 text-start text-sm whitespace-nowrap font-medium text-default-800">
                                    Total a pagar
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-default-200">
                                {filteredTickets.length === 0 ? (
                                  <tr>
                                    <td
                                      colSpan="8"
                                      className="px-6 py-4 text-center text-lg text-gray-500"
                                    >
                                      No hay entradas para este evento.
                                    </td>
                                  </tr>
                                ) : (
                                  filteredTickets.map((ticket) => (
                                    <tr key={ticket.id}>
                                      <td className="px-6 py-4">
                                        {ticket.paid ? (
                                          <span className="inline-flex items-center gap-1 py-1 px-4 rounded-full text-sm font-medium bg-green-500/20 text-green-500">
                                            Pagado
                                          </span>
                                        ) : (
                                          <button
                                            onClick={() =>
                                              handleMarkAsPaid(ticket.id, ticket.ticketQuantity)
                                            }
                                            className="inline-flex items-center gap-1 py-1 px-4 rounded-full text-sm font-medium bg-red-700 text-white"
                                          >
                                            Completar
                                          </button>
                                        )}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-default-500">
                                        {ticket.userId
                                          ? `${
                                              ticket.userId?.name +
                                              " " +
                                              ticket.userId?.firstSurName +
                                              " " +
                                              ticket.userId?.secondSurName
                                            }  `
                                          : ticket.buyerName}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-default-500">
                                        {ticket.userId ? ticket.userId?.email : ticket.buyerEmail}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-default-500">
                                        {ticket.type === "assigned" ? "Asignada" : "Comprada"}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-default-500">
                                        {ticket.scanned === true
                                          ? `Sí : ${ticket.scans}/${ticket.ticketQuantity}`
                                          : `No : ${ticket.scans}/${ticket.ticketQuantity}`}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-default-500">
                                        {ticket.raffleNumbers?.join(", ") || "-"}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-default-500">
                                        {ticket.ticketQuantity}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-default-500">
                                        ₡{(ticket.ticketQuantity * eventPrice).toFixed(2)}
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-6 text-center text-lg text-gray-500">
                  Seleccione un evento para ver las entradas.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </DashboardLayout>
  );
};

TicketList.propTypes = {
  eventId: PropTypes.string,
};

export default TicketList;
