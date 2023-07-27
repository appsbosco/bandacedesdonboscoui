import React, { useEffect, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import Card from "@mui/material/Card";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import Footer from "examples/Footer";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import "./reset.css";
import Input from "components/Input";
import { Button } from "@mui/material";
import { gql, useMutation, useQuery } from "@apollo/client";
import { SEND_EMAIL } from "graphql/mutations";
import { GET_USERS } from "graphql/queries";
import Select from "components/Select";
import CustomSelect from "components/CustomSelect";

const Email = () => {
  const [recipients, setRecipients] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false); // To track if the email is being sent

  const [selectedRole, setSelectedRole] = useState("");
  const [selectedBand, setSelectedBand] = useState("");

  const [recipientType, setRecipientType] = useState(""); // The type of recipient

  const [sendEmail] = useMutation(SEND_EMAIL);
  const { loading, error, data } = useQuery(GET_USERS);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let timeoutId = null;
    if (message) {
      timeoutId = setTimeout(() => {
        setMessage(null);
      }, 3000);
    }

    return () => {
      clearTimeout(timeoutId);
    };
  }, [message]);

  const options =
    !loading &&
    !error &&
    data &&
    data.getUsers.map((user) => ({
      value: user.email,
      label: user.email,
      role: user.role,
      bands: user.bands,
    }));

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

  const handleRecipientChange = (event) => {
    setRecipients(event.target.value);
  };

  const handleSend = async () => {
    try {
      setSending(true);

      let recipientsEmails = [];

      switch (recipientType) {
        case "Rol":
          recipientsEmails = options
            .filter((user) => user.role === selectedRole)
            .map((user) => user.value);
          break;
        case "Formato":
          recipientsEmails = options
            .filter((user) => user.bands.includes(selectedBand))
            .map((user) => user.value);
          break;
        case "Persona Individual":
          recipientsEmails = [recipients];
          break;
        case "Otro":
          recipientsEmails = [recipients];
          break;
        default:
          break;
      }

      await sendEmail({
        variables: {
          input: {
            to: recipientsEmails.join(", "),
            subject,
            text: content,
            html: content,
          },
        },
      });

      setSending(false);
      setRecipients("");
      setSubject("");
      setContent("");
      setSelectedRole("");
      setSelectedBand("");

      setMessage("Correo enviado");
    } catch (error) {
      setMessage("Ocurrió un error al enviar el correo.");
      setSending(false);
    }
  };

  const recipientTypes = ["Rol", "Formato", "Persona Individual", "Otro"];

  const roles = [
    "Integrante BCDB",
    "Principal de sección",
    "Asistente de sección",
    "Director",
    "Dirección Logística",
    "Staff",
    "Asistente Drumline",
    "Asistente Color Guard",
    "Asistente Danza",
    "Instructor de instrumento",
    "Padre/Madre de familia",
  ];
  const bandOptions = [
    "Banda de marcha",
    "Banda de concierto elemental",
    "Banda de concierto inicial",
    "Banda de concierto intermedia",
    "Banda de concierto avanzada",
    "Big Band A",
    "Big Band B",
  ];

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <SoftBox py={3}>
        <Card>
          {message && showMessage()}
          <SoftBox display="flex" justifyContent="space-between" alignItems="center" p={3}>
            <SoftTypography variant="h6">Redactar correo</SoftTypography>
            <Button variant="contained" color="info" onClick={handleSend} disabled={sending}>
              {sending ? "Enviando..." : "Enviar"}
            </Button>
          </SoftBox>

          <SoftBox mb={2} lineHeight={1} p={2.5}>
            <SoftTypography variant="button" color="text" fontWeight="regular">
              Tipo de destinatario:
            </SoftTypography>

            <Select
              name="recipientType"
              value={recipientType}
              onChange={(e) => setRecipientType(e.target.value)}
              options={recipientTypes.map((type) => ({ value: type, label: type }))}
            />
          </SoftBox>

          {recipientType === "Rol" && (
            <SoftBox mb={2} lineHeight={1} p={2.5}>
              <SoftTypography variant="button" color="text" fontWeight="regular">
                Roles:
              </SoftTypography>

              <Select
                name="role"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                options={roles.map((role) => ({ value: role, label: role }))}
              />
            </SoftBox>
          )}

          {recipientType === "Formato" && (
            <SoftBox mb={2} lineHeight={1} p={2.5}>
              <SoftTypography variant="button" color="text" fontWeight="regular">
                Bandas:
              </SoftTypography>
              <Select
                name="band"
                value={selectedBand}
                onChange={(e) => setSelectedBand(e.target.value)}
                options={bandOptions.map((band) => ({ value: band, label: band }))}
              />
            </SoftBox>
          )}

          {recipientType === "Persona Individual" && (
            <SoftBox mb={2} lineHeight={1} p={2.5}>
              <SoftTypography variant="button" color="text" fontWeight="regular">
                Destinatarios:
              </SoftTypography>
              <CustomSelect
                labelId="user-label"
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
                options={options}
              />
              {/* <Select
                id="bloodType"
                name="recipients"
                value={recipients}
                onChange={handleRecipientChange}
                options={options}
              /> */}
            </SoftBox>
          )}

          {recipientType === "Otro" && (
            <SoftBox mb={2} lineHeight={1} p={2.5}>
              <SoftTypography variant="button" color="text" fontWeight="regular">
                Destinatarios:
              </SoftTypography>

              <Input
                name="recipients"
                value={recipients}
                onChange={handleRecipientChange}
                label=""
                fullWidth
                type="text"
              />
            </SoftBox>
          )}

          <hr style={{ borderBottom: "1px solid #000;", margin: "0px 1rem" }} />

          <SoftBox mb={2} lineHeight={1} p={2.5}>
            <SoftTypography variant="button" color="text" fontWeight="regular">
              Asunto:
            </SoftTypography>

            <Input
              name="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              label=""
              fullWidth
              type="text"
              id="model"
            />
          </SoftBox>
          <hr style={{ borderBottom: "1px solid #000;", margin: "0px 1rem" }} />

          <SoftBox mb={2} lineHeight={1} p={3}>
            <ReactQuill value={content} onChange={setContent} style={{ height: "100%" }} />
          </SoftBox>
        </Card>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
};

export default Email;
