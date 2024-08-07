import React, { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import jsQR from "jsqr";
import Card from "@mui/material/Card";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import Footer from "examples/Footer";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import TableWithFilteringSorting from "examples/Tables/Table/Table";
import { useMutation, gql } from "@apollo/client";
import login from "../../assets/images/aprobado.webp";
import loginerror from "../../assets/images/denegado.webp";

const VALIDATE_TICKET = gql`
  mutation ValidateTicket($qrCode: String!) {
    validateTicket(qrCode: $qrCode) {
      id
      paid
      scanned
      userId
      eventId
      type
      amountPaid
      totalAmount
    }
  }
`;

const QRScanner = () => {
  const webcamRef = useRef(null);
  const [message, setMessage] = useState("");
  const [scanning, setScanning] = useState(false);
  const [validateTicket] = useMutation(VALIDATE_TICKET);

  const showMessage = () => {
    let imageSource = message !== "Entrada paga y válida. Puede ingresar." ? loginerror : login;

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

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      const img = new Image();
      img.src = imageSrc;
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0, img.width, img.height);
        const imageData = context.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code) {
          console.log("Detected QR code data:", code.data); // Log the detected QR code data
          handleScan(code.data);
        }
      };
    }
  }, [webcamRef]);

  const handleScan = async (data) => {
    console.log("Scanning", data);
    if (data && !scanning) {
      setScanning(true);
      try {
        const response = await validateTicket({ variables: { qrCode: data } });
        console.log("Response", response);

        const ticket = response.data.validateTicket;
        console.log("Ticket", ticket);

        if (ticket.paid) {
          setMessage("Entrada paga y válida. Puede ingresar.");
        } else {
          setMessage("Ticket no está pagado. Por favor proceda al pago.");
        }
      } catch (error) {
        console.error("Error validating ticket:", error);
        const errorMessage = error.message || "An error occurred. Please try again.";
        if (errorMessage.includes("Ticket not paid")) {
          setMessage("Ticket no está pagado. Por favor proceda al pago.");
        } else if (errorMessage.includes("Invalid ticket")) {
          setMessage("Ticket inválido. Por favor intente de nuevo o contacte soporte.");
        } else {
          setMessage(errorMessage);
          setScanning(false);
        }
      } finally {
        setScanning(false); // Ensure scanning is set to false after processing
      }
    }
  };

  const handleError = (err) => {
    console.error(err); // Log the error
    setMessage("Error scanning QR code.");
  };

  useEffect(() => {
    let timeoutId = null;
    if (message) {
      timeoutId = setTimeout(() => {
        setMessage(null);
      }, 2000);
    }

    return () => {
      clearTimeout(timeoutId);
    };
  }, [message]);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <SoftBox mb={3}>
          <Card>
            {message && showMessage()}
            <SoftBox display="flex" justifyContent="space-between" alignItems="center" p={3}>
              <SoftTypography variant="h6">Checkeo de entradas</SoftTypography>
            </SoftBox>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/png"
              videoConstraints={{ facingMode: "environment" }}
              style={{ width: "100%" }}
            />
            <button onClick={capture}>Escanear</button>
          </Card>
        </SoftBox>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
};

export default QRScanner;
