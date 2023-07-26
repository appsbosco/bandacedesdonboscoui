import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import moment from "moment";

import { useQuery, useMutation } from "@apollo/client";
import { TextField, Button, Card, Box, Grid } from "@mui/material";
import { GET_PAYMENT_EVENTS, GET_PAYMENTS_BY_EVENT, GET_USERS } from "graphql/queries";
import {
  CREATE_PAYMENT_EVENT,
  CREATE_PAYMENT,
  UPDATE_PAYMENT,
  DELETE_PAYMENT,
} from "graphql/mutations";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import TableWithFilteringSorting from "examples/Tables/Table/Table";
import Input from "components/Input";
import SoftBox from "components/SoftBox";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import SoftTypography from "components/SoftTypography";
import Footer from "examples/Footer";
import borders from "assets/theme/base/borders";
import CustomSelect from "components/CustomSelect";
import { Delete, Edit } from "@mui/icons-material";

import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";

const PaymentComponent = () => {
  const { borderWidth, borderColor } = borders;

  const [eventName, setEventName] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedUser, setSelectedUser] = useState("");
  const [description, setDescription] = useState("");

  const [paymentAmount, setPaymentAmount] = useState("");

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editPaymentId, setEditPaymentId] = useState(null);
  const [editInitialAmount, setEditInitialAmount] = useState(null);

  const {
    data: paymentEventsData,
    loading: paymentEventsLoading,
    refetch: refetchPaymentEvents,
  } = useQuery(GET_PAYMENT_EVENTS);
  const {
    data: paymentsData,
    loading: paymentsLoading,
    refetch: refetchPayments,
  } = useQuery(GET_PAYMENTS_BY_EVENT, {
    variables: { paymentEvent: selectedEvent?._id || "" },
  });

  const { data: usersData, loading: usersLoading } = useQuery(GET_USERS);

  const [createPaymentEvent] = useMutation(CREATE_PAYMENT_EVENT, {
    onCompleted: (data) => {
      const createdEvent = data.createPaymentEvent;
      setSelectedEvent(createdEvent);
      setEventName("");
      setEventDescription("");
      setEventDate("");
      refetchPaymentEvents();
    },
  });

  const [createPayment] = useMutation(CREATE_PAYMENT, {
    onCompleted: async () => {
      setPaymentAmount("");

      await refetchPaymentEvents();

      if (paymentEventsData && selectedEvent) {
        const updatedSelectedEvent = paymentEventsData.getPaymentEvents.find(
          (event) => event._id === selectedEvent._id
        );

        setSelectedEvent(updatedSelectedEvent);
      }

      refetchPayments();
    },
  });

  const [updatePayment] = useMutation(UPDATE_PAYMENT);
  const [deletePayment] = useMutation(DELETE_PAYMENT);

  const handleEditClick = (payment) => {
    setEditPaymentId(payment._id);
    setEditInitialAmount(payment.amount);
    setIsEditModalOpen(true);
  };
  const handleUpdatePayment = async (paymentId, amount) => {
    try {
      await updatePayment({
        variables: {
          paymentId,
          input: { amount: parseFloat(amount) },
        },
      });
      // Close the modal
      setIsEditModalOpen(false); // fixed this line
      // Refetch data
      refetchPayments();
    } catch (error) {
      console.error("Error updating payment: ", error);
    }
  };

  const handleDeletePayment = (paymentId) => {
    deletePayment({ variables: { paymentId } }).then(() => {
      refetchPayments();
    });
  };

  const handleEventSubmit = (e) => {
    e.preventDefault();

    createPaymentEvent({
      variables: {
        input: {
          name: eventName,
          description: eventDescription,
          date: eventDate,
        },
      },
    });
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();

    createPayment({
      variables: {
        input: {
          user: selectedUser,
          paymentEvent: selectedEvent?._id,
          description: description,
          amount: parseFloat(paymentAmount),
          date: new Date().toISOString(),
        },
      },
    }).then(async (response) => {
      const createdPayment = response.data.createPayment;

      if (createdPayment) {
        setSelectedEvent(createdPayment.paymentEvent);

        setPaymentAmount("");

        refetchPayments();
      }
    });
  };

  if (paymentEventsLoading || paymentsLoading || usersLoading) {
    return (
      <div
        style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}
      >
        <p>Cargando...</p>
      </div>
    );
  }

  const paymentEvents = paymentEventsData?.getPaymentEvents || [];
  const payments = paymentsData?.getPaymentsByEvent || [];

  const formattedPayments = payments.map((payment) => {
    const user = payment.user;
    const formattedDate = moment(payment.date).format("DD/MM/YYYY");

    return {
      ...payment,
      id: payment._id,
      userName: user?.name + " " + user?.firstSurName + " " + user?.secondSurName || "",
      instrument: user?.instrument ? user?.instrument : user?.role || "",
      description: payment.description,
      amount: payment.amount,
      date: formattedDate,
    };
  });

  const eventColumns = [
    {
      field: "userName",
      headerName: "Nombre",
      flex: 1,
      minWidth: 150,
    },
    {
      field: "instrument",
      headerName: "Sección",
      flex: 1,
      minWidth: 100,
    },
    {
      field: "description",
      headerName: "Descripción",

      flex: 1,
      minWidth: 100,
    },
    {
      field: "amount",
      headerName: "Monto",
      type: "number",
      flex: 1,
      minWidth: 100,
    },

    {
      field: "date",
      headerName: "Fecha",
      flex: 1,
      minWidth: 100,
      hide: window.innerWidth <= 600, // hide date on small screens
    },
    {
      field: "edit",
      headerName: "Editar",
      flex: 0.5,
      renderCell: (params) => (
        <Button startIcon={<Edit />} onClick={() => handleEditClick(params.row)}></Button>
      ),
      minWidth: 80,
    },
    {
      field: "delete",
      headerName: "Eliminar",
      flex: 0.5,
      renderCell: (params) => (
        <Button startIcon={<Delete />} onClick={() => handleDeletePayment(params.row._id)}></Button>
      ),
      minWidth: 80,
    },
  ];

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <Card className="mb-6">
        <SoftBox pt={2} px={2} display="flex" justifyContent="space-between" alignItems="center">
          <SoftTypography variant="h6" fontWeight="medium">
            Registro de evento de pago
          </SoftTypography>
        </SoftBox>
        <SoftBox p={2}>
          <form onSubmit={handleEventSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={4}>
                <SoftBox
                  borderRadius="lg"
                  display="flex-col"
                  justifyContent="space-between"
                  alignItems="center"
                  p={3}
                >
                  <SoftTypography variant="h6" fontWeight="medium">
                    Nombre del registro
                  </SoftTypography>
                  <Input
                    label="Nombre del registro"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    required
                  />
                </SoftBox>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <SoftBox
                  borderRadius="lg"
                  display="flex-col"
                  justifyContent="space-between"
                  alignItems="center"
                  p={3}
                >
                  <SoftTypography variant="h6" fontWeight="medium">
                    Descripción del registro
                  </SoftTypography>
                  <Input
                    label="Descripción del registro"
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    required
                  />
                </SoftBox>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <SoftBox
                  borderRadius="lg"
                  display="flex-col"
                  justifyContent="space-between"
                  alignItems="center"
                  p={3}
                >
                  <SoftTypography variant="h6" fontWeight="medium">
                    Fecha del registro
                  </SoftTypography>

                  <Input
                    label="Fecha del registro"
                    type="Date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    required
                  />
                </SoftBox>
              </Grid>
            </Grid>

            <Grid item xs={12} sm={6} md={12}>
              {" "}
              {/* Added Grid item for the button */}
              <Grid container justifyContent="flex-end">
                {" "}
                {/* Set justify prop to "flex-end" */}
                <Button type="submit" variant="contained" color="info" onClick={handleEventSubmit}>
                  Registrar
                </Button>
              </Grid>
            </Grid>
          </form>
        </SoftBox>
      </Card>

      <Card style={{ zIndex: "1" }}>
        <SoftBox pt={2} px={2} display="flex" justifyContent="space-between" alignItems="center">
          <SoftTypography variant="h6" fontWeight="medium">
            Agregar un pago
          </SoftTypography>
        </SoftBox>
        <SoftBox p={2}>
          <form>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={4}>
                <SoftBox
                  borderRadius="lg"
                  display="flex-col"
                  justifyContent="space-between"
                  alignItems="center"
                  p={3}
                >
                  <SoftTypography variant="h6" fontWeight="medium">
                    Seleccione un evento
                  </SoftTypography>
                  <CustomSelect
                    labelId="event-label"
                    value={selectedEvent?._id || ""}
                    onChange={(e) => {
                      const eventId = e.target.value;
                      const event = paymentEvents.find((event) => event._id === eventId);
                      setSelectedEvent(event);
                    }}
                    options={paymentEvents.map((event) => ({
                      value: event._id,
                      label: event.name,
                    }))}
                  />
                </SoftBox>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <SoftBox
                  borderRadius="lg"
                  display="flex-col"
                  justifyContent="space-between"
                  alignItems="center"
                  p={3}
                >
                  <SoftTypography variant="h6" fontWeight="medium">
                    Seleccione un usuario
                  </SoftTypography>
                  <CustomSelect
                    labelId="user-label"
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    options={usersData?.getUsers.map((user) => ({
                      value: user.id,
                      label: `${user.name} ${user.firstSurName} ${user.secondSurName}`,
                    }))}
                  />
                </SoftBox>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <SoftBox
                  borderRadius="lg"
                  display="flex-col"
                  justifyContent="space-between"
                  alignItems="center"
                  p={3}
                >
                  <SoftTypography variant="h6" fontWeight="medium">
                    Ingrese el monto
                  </SoftTypography>

                  <Input
                    label="Monto"
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    required
                  />
                </SoftBox>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <SoftBox
                  borderRadius="lg"
                  display="flex-col"
                  justifyContent="space-between"
                  alignItems="center"
                  p={3}
                >
                  <SoftTypography variant="h6" fontWeight="medium">
                    Descripción
                  </SoftTypography>
                  <Input
                    autoFocus
                    margin="dense"
                    label=""
                    type="text"
                    fullWidth
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </SoftBox>
              </Grid>
            </Grid>

            <Grid item xs={12} sm={6} md={12}>
              {" "}
              {/* Added Grid item for the button */}
              <Grid container justifyContent="flex-end">
                {" "}
                {/* Set justify prop to "flex-end" */}
                <Button
                  type="submit"
                  variant="contained"
                  color="info"
                  onClick={handlePaymentSubmit}
                >
                  Agregar
                </Button>
              </Grid>
            </Grid>
          </form>
        </SoftBox>
      </Card>
      <SoftBox py={3}>
        <Card>
          <SoftBox display="flex" justifyContent="space-between" alignItems="center" p={3}>
            <SoftTypography variant="h6">Pagos BCDB</SoftTypography>
          </SoftBox>

          <Box sx={{ height: 700, width: 1 }}>
            <SoftBox display="flex-col" justifyContent="space-between" alignItems="center" p={3}>
              <SoftTypography variant="h6">
                Historial de pagos para:{" "}
                {selectedEvent?.name ? selectedEvent?.name : "Seleccione un evento"}
              </SoftTypography>

              <SoftTypography variant="body2" color="text">
                {selectedEvent?.description ? selectedEvent?.description : " "}
              </SoftTypography>
            </SoftBox>

            <SoftBox
              sx={{
                "& .MuiTableRow-root:not(:last-child)": {
                  "& td": {
                    borderBottom: `${borderWidth[1]} solid ${borderColor}`,
                  },
                },
              }}
            >
              <TableWithFilteringSorting data={formattedPayments} columns={eventColumns} />
              <EditModal
                open={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                paymentId={editPaymentId}
                initialAmount={editInitialAmount}
                onUpdate={handleUpdatePayment}
              />
            </SoftBox>
          </Box>
        </Card>
      </SoftBox>

      <Footer />
    </DashboardLayout>
  );
};

const EditModal = ({ open, onClose, paymentId, initialAmount, onUpdate }) => {
  const [amount, setAmount] = useState(initialAmount);
  useEffect(() => {
    setAmount(initialAmount);
  }, [initialAmount]);

  const handleSave = () => {
    onUpdate(paymentId, amount);
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Editar monto</DialogTitle>
      <DialogContent>
        <Input
          autoFocus
          label="Monto"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSave} color="primary">
          Actualizar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

EditModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  paymentId: PropTypes.string.isRequired,
  initialAmount: PropTypes.number.isRequired,
  onUpdate: PropTypes.func.isRequired,
};
export default PaymentComponent;
