import React, { useEffect, useState, useMemo } from "react";
import PropTypes from "prop-types";
import Footer from "examples/Footer";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { useLazyQuery, useQuery, useMutation, gql } from "@apollo/client";
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

const EventSelector = React.memo(({ eventsData, handleEventChange, selectedEvent }) => (
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
));

const TicketList = () => {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventPrice, setEventPrice] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [filteredTickets, setFilteredTickets] = useState([]);

  const { loading: eventsLoading, error: eventsError, data: eventsData } = useQuery(GET_EVENTS);
  const [
    loadTickets,
    { loading: ticketsLoading, error: ticketsError, data: ticketsData, refetch },
  ] = useLazyQuery(GET_TICKETS);
  const [updatePaymentStatus] = useMutation(UPDATE_PAYMENT_STATUS);

  const totalPurchased = useMemo(() => {
    if (!ticketsData) return 0;
    return ticketsData?.getTickets?.reduce((acc, ticket) => acc + ticket.ticketQuantity, 0);
  }, [ticketsData]);

  const totalPaid = useMemo(() => {
    if (!ticketsData) return 0;
    return ticketsData?.getTickets?.reduce(
      (acc, ticket) => (ticket.paid ? acc + ticket.ticketQuantity : acc),
      0
    );
  }, [ticketsData]);

  const percentagePaid = useMemo(() => {
    return totalPurchased > 0 ? (totalPaid / totalPurchased) * 100 : 0;
  }, [totalPurchased, totalPaid]);

  useEffect(() => {
    if (ticketsData && ticketsData?.getTickets) {
      const filtered = ticketsData?.getTickets.filter((ticket) => {
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

  if (eventsLoading) {
    return (
      <div className="loading-placeholder">
        <div className="grid min-h-[140px] w-full place-items-center overflow-x-scroll rounded-lg p-6 lg:overflow-visible">
          <svg
            className="w-16 h-16 animate-spin text-gray-900/50"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
          >
            <path
              d="M32 3C35.8083 3 39.5794 3.75011 43.0978 5.20749C46.6163 6.66488 49.8132 8.80101 52.5061 11.4939C55.199 14.1868 57.3351 17.3837 58.7925 20.9022C60.2499 24.4206 61 28.1917 61 32C61 35.8083 60.2499 39.5794 58.7925 43.0978C57.3351 46.6163 55.199 49.8132 52.5061 52.5061C49.8132 55.199 46.6163 57.3351 43.0978 58.7925C39.5794 60.2499 35.8083 61 32 61C28.1917 61 24.4206 60.2499 20.9022 58.7925C17.3837 57.3351 14.1868 55.199 11.4939 52.5061C8.801 49.8132 6.66487 46.6163 5.20749 43.0978C3.7501 39.5794 3 35.8083 3 32C3 28.1917 3.75011 24.4206 5.2075 20.9022C6.66489 17.3837 8.80101 14.1868 11.4939 11.4939C14.1868 8.80099 17.3838 6.66487 20.9022 5.20749C24.4206 3.7501 28.1917 3 32 3L32 3Z"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
            <path
              d="M32 3C36.5778 3 41.0906 4.08374 45.1692 6.16256C49.2477 8.24138 52.7762 11.2562 55.466 14.9605C58.1558 18.6647 59.9304 22.9531 60.6448 27.4748C61.3591 31.9965 60.9928 36.6232 59.5759 40.9762"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-900"
            ></path>
          </svg>
        </div>
      </div>
    );
  }

  if (ticketsLoading) {
    return (
      <div className="loading-placeholder">
        <div className="grid min-h-[140px] w-full place-items-center overflow-x-scroll rounded-lg p-6 lg:overflow-visible">
          <svg
            className="w-16 h-16 animate-spin text-gray-900/50"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
          >
            <path
              d="M32 3C35.8083 3 39.5794 3.75011 43.0978 5.20749C46.6163 6.66488 49.8132 8.80101 52.5061 11.4939C55.199 14.1868 57.3351 17.3837 58.7925 20.9022C60.2499 24.4206 61 28.1917 61 32C61 35.8083 60.2499 39.5794 58.7925 43.0978C57.3351 46.6163 55.199 49.8132 52.5061 52.5061C49.8132 55.199 46.6163 57.3351 43.0978 58.7925C39.5794 60.2499 35.8083 61 32 61C28.1917 61 24.4206 60.2499 20.9022 58.7925C17.3837 57.3351 14.1868 55.199 11.4939 52.5061C8.801 49.8132 6.66487 46.6163 5.20749 43.0978C3.7501 39.5794 3 35.8083 3 32C3 28.1917 3.75011 24.4206 5.2075 20.9022C6.66489 17.3837 8.80101 14.1868 11.4939 11.4939C14.1868 8.80099 17.3838 6.66487 20.9022 5.20749C24.4206 3.7501 28.1917 3 32 3L32 3Z"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
            <path
              d="M32 3C36.5778 3 41.0906 4.08374 45.1692 6.16256C49.2477 8.24138 52.7762 11.2562 55.466 14.9605C58.1558 18.6647 59.9304 22.9531 60.6448 27.4748C61.3591 31.9965 60.9928 36.6232 59.5759 40.9762"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-900"
            ></path>
          </svg>
        </div>
      </div>
    );
  }

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
    loadTickets({ variables: { eventId } });
  };

  const handleRefreshTickets = () => {
    if (selectedEvent) {
      refetch({ eventId: selectedEvent.id });
    }
  };

  const availableTickets = selectedEvent ? selectedEvent.ticketLimit - totalPurchased : 0;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <div className="p-6 page-content">
        <div className="flex flex-col md:flex-row items-center justify-between w-full mb-6">
          <h4 className="text-xl font-medium w-6/12">Lista de entradas</h4>
          <EventSelector
            eventsData={eventsData}
            handleEventChange={handleEventChange}
            selectedEvent={selectedEvent}
          />
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

                  <button
                    onClick={handleRefreshTickets}
                    className="bg-blue-500 text-white py-2 px-4 rounded mb-4"
                  >
                    Actualizar lista de tiquetes
                  </button>

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
                                            Completar{" "}
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

EventSelector.propTypes = {
  eventsData: PropTypes.shape({
    getEventsT: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        date: PropTypes.string.isRequired,
        description: PropTypes.string,
        ticketLimit: PropTypes.number.isRequired,
        totalTickets: PropTypes.number,
        raffleEnabled: PropTypes.bool,
        price: PropTypes.number.isRequired,
      })
    ).isRequired,
  }).isRequired,
  handleEventChange: PropTypes.func.isRequired,
  selectedEvent: PropTypes.shape({
    id: PropTypes.string,
  }),
};

export default TicketList;
