import React, { useEffect, useState } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import PropTypes from "prop-types";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import CustomSelect from "components/CustomSelect";
import { GET_TICKETS } from "graphql/queries";

const GET_USERS = gql`
  query GetUsers {
    getUsers {
      id
      name
      firstSurName
      secondSurName
      email
      birthday
      carnet
      state
      grade
      phone
      role
      instrument
      avatar
      bands
    }
  }
`;

const GET_EVENTS = gql`
  query GetEventsT {
    getEventsT {
      id
      name
      price
    }
  }
`;

const ASSIGN_TICKETS = gql`
  mutation AssignTickets($input: TicketInput!) {
    assignTickets(input: $input) {
      id
      userId {
        name
        firstSurName
        secondSurName
        email
      }
      eventId
      type
      ticketQuantity
      qrCode
    }
  }
`;

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

const AssignTickets = () => {
  const [input, setInput] = useState({
    userId: "",
    eventId: "",
    type: "assigned",
    ticketQuantity: 2,
  });

  const [purchaseInput, setPurchaseInput] = useState({
    eventId: "",
    buyerName: "",
    buyerEmail: "",
    ticketQuantity: 2,
  });

  const [isRegisteredUser, setIsRegisteredUser] = useState(true);
  const [filter, setFilter] = useState({ role: "", instrument: "" });
  const [filteredUsers, setFilteredUsers] = useState([]);

  const { loading: usersLoading, error: usersError, data: usersData } = useQuery(GET_USERS);
  const { loading: eventsLoading, error: eventsError, data: eventsData } = useQuery(GET_EVENTS);
  const [assignTickets, { loading: assignLoading, error: assignError }] = useMutation(
    ASSIGN_TICKETS,
    {
      update: (cache, { data: { assignTickets } }) => {
        const data = cache.readQuery({
          query: GET_TICKETS,
          variables: { eventId: input.eventId },
        });

        if (data) {
          const { getTickets } = data;
          cache.writeQuery({
            query: GET_TICKETS,
            variables: { eventId: input.eventId },
            data: { getTickets: getTickets.concat([assignTickets]) },
          });
        } else {
          cache.writeQuery({
            query: GET_TICKETS,
            variables: { eventId: input.eventId },
            data: { getTickets: [assignTickets] },
          });
        }
      },
    }
  );

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

  useEffect(() => {
    if (usersData) {
      setFilteredUsers(usersData.getUsers);
    }
  }, [usersData]);
  if (usersLoading || eventsLoading) return <p>Cargando...</p>;
  if (usersError || eventsError) return <p>Error al cargar datos :(</p>;

  const handleChange = (name, value) => {
    if (name === "ticketQuantity") {
      value = parseInt(value, 10);
    }
    setInput({ ...input, [name]: value });
  };

  const handlePurchaseChange = (name, value) => {
    if (name === "ticketQuantity") {
      value = parseInt(value, 10);
    }
    setPurchaseInput({ ...purchaseInput, [name]: value });
  };

  const handleFilterChange = (name, value) => {
    setFilter({ ...filter, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isRegisteredUser && (!input.eventId || !input.userId)) {
      alert("Por favor selecciona un evento y un usuario.");
      return;
    }

    if (
      !isRegisteredUser &&
      (!purchaseInput.eventId || !purchaseInput.buyerName || !purchaseInput.buyerEmail)
    ) {
      alert("Por favor completa todos los campos para el comprador no registrado.");
      return;
    }

    try {
      if (isRegisteredUser) {
        await assignTickets({ variables: { input } });
        alert("Entradas asignadas con éxito!");
        setFilteredUsers((prevUsers) => prevUsers.filter((user) => user.id !== input.userId));
      } else {
        await purchaseTicket({ variables: purchaseInput });
        alert("Entradas compradas con éxito!");
      }
    } catch (error) {
      console.error("Error assigning or purchasing tickets:", error);
      alert("Error al asignar o comprar entradas");
    }
  };

  const displayedUsers = filteredUsers.filter((user) => {
    return (
      (!filter.role || user.role === filter.role) &&
      (!filter.instrument || user.instrument === filter.instrument)
    );
  });

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <div className="p-6 page-content">
        <div className="flex items-center justify-between w-full mb-6">
          <h4 className="text-xl font-medium mb-6">Asignar o Comprar Entradas</h4>
        </div>
        <div className="grid gap-6">
          <div className="xl:col-span-9">
            <div className="space-y-6">
              <div className="border rounded-lg p-6 overflow-hidden border-default-200">
                <div className="relative overflow-x-auto">
                  <div className="min-w-full inline-block align-middle">
                    <div className="overflow-hidden">
                      <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700">
                            Seleccionar un evento
                          </label>
                          <CustomSelect
                            labelId="event-label"
                            name="eventId"
                            value={isRegisteredUser ? input.eventId : purchaseInput.eventId}
                            onChange={(e) =>
                              isRegisteredUser
                                ? handleChange("eventId", e.target.value)
                                : handlePurchaseChange("eventId", e.target.value)
                            }
                            options={eventsData?.getEventsT?.map((event) => ({
                              value: event.id,
                              label: event.name,
                            }))}
                            required
                          />
                        </div>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 ">
                            <input
                              type="checkbox"
                              className=" border border-gray-300 rounded mx-4"
                              style={{
                                width: "1.25rem",
                                height: "1.25rem",
                                borderColor: "#000000",
                              }}
                              checked={!isRegisteredUser}
                              onChange={() => setIsRegisteredUser(!isRegisteredUser)}
                            />
                            Usuario no registrado
                          </label>
                        </div>
                        {isRegisteredUser ? (
                          <>
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700">
                                Filtrar por Rol
                              </label>
                              <CustomSelect
                                labelId="role-filter-label"
                                name="role"
                                value={filter.role}
                                onChange={(e) => handleFilterChange("role", e.target.value)}
                                options={[
                                  { value: "", label: "Todos los roles" },
                                  ...Array.from(
                                    new Set(usersData?.getUsers?.map((user) => user.role))
                                  ).map((role) => ({
                                    value: role,
                                    label: role,
                                  })),
                                ]}
                              />
                            </div>
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700">
                                Filtrar por Instrumento
                              </label>
                              <CustomSelect
                                labelId="instrument-filter-label"
                                name="instrument"
                                value={filter.instrument}
                                onChange={(e) => handleFilterChange("instrument", e.target.value)}
                                options={[
                                  { value: "", label: "Todos los instrumentos" },
                                  ...Array.from(
                                    new Set(usersData?.getUsers?.map((user) => user.instrument))
                                  ).map((instrument) => ({
                                    value: instrument,
                                    label: instrument,
                                  })),
                                ]}
                              />
                            </div>
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700">
                                Seleccionar Integrante
                              </label>
                              <CustomSelect
                                labelId="user-label"
                                name="userId"
                                value={input.userId}
                                onChange={(e) => handleChange("userId", e.target.value)}
                                options={displayedUsers?.map((user) => ({
                                  value: user.id,
                                  label: `${user.name} ${user.firstSurName} ${user.secondSurName}`,
                                }))}
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700">
                                Nombre del Comprador
                              </label>
                              <input
                                type="text"
                                name="buyerName"
                                value={purchaseInput.buyerName}
                                onChange={(e) =>
                                  handlePurchaseChange(e.target.name, e.target.value)
                                }
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                                required
                              />
                            </div>
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700">
                                Email del Comprador
                              </label>
                              <input
                                type="email"
                                name="buyerEmail"
                                value={purchaseInput.buyerEmail}
                                onChange={(e) =>
                                  handlePurchaseChange(e.target.name, e.target.value)
                                }
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                                required
                              />
                            </div>
                          </>
                        )}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700">
                            Cantidad de Entradas
                          </label>
                          <input
                            type="number"
                            name="ticketQuantity"
                            value={
                              isRegisteredUser ? input.ticketQuantity : purchaseInput.ticketQuantity
                            }
                            onChange={(e) =>
                              isRegisteredUser
                                ? handleChange(e.target.name, e.target.value)
                                : handlePurchaseChange(e.target.name, e.target.value)
                            }
                            className="mt-1 block  p-2 border border-gray-300 rounded-md w-[98%] mx-2"
                            min="1"
                            required
                          />
                        </div>
                        <button
                          type="submit"
                          className="relative z-10 w-full inline-flex items-center justify-center rounded-full border border-primary bg-white px-6 py-3 text-center text-sm font-medium text-black shadow-sm transition-all duration-500 hover:bg-black hover:text-white"
                          disabled={assignLoading || purchaseLoading}
                        >
                          {assignLoading || purchaseLoading ? "Procesando..." : "Asignar entradas"}
                        </button>
                        {(assignError || purchaseError) && (
                          <p className="mt-4 text-red-500">
                            Error: {assignError?.message || purchaseError?.message}
                          </p>
                        )}
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </DashboardLayout>
  );
};

AssignTickets.propTypes = {
  eventId: PropTypes.string,
};

export default AssignTickets;
