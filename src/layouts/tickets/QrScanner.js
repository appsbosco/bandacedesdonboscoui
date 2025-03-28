import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import jsQR from "jsqr";
import Card from "@mui/material/Card";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import Footer from "examples/Footer";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { useMutation, gql } from "@apollo/client";
import login from "../../assets/images/aprobado.webp";
import loginerror from "../../assets/images/denegado.webp";
import { GET_TICKETS } from "graphql/queries";

const VALIDATE_TICKET = gql`
  mutation ValidateTicket($qrCode: String!) {
    validateTicket(qrCode: $qrCode) {
      paid
      scanned
      eventId
      type
      amountPaid
      ticketQuantity
      scans
    }
  }
`;

const QRScanner = () => {
  const webcamRef = useRef(null);
  const [message, setMessage] = useState("");
  const [scanInfo, setScanInfo] = useState(null);
  const [validateTicket] = useMutation(VALIDATE_TICKET, {
    refetchQueries: [{ query: GET_TICKETS }],
  });

  const showMessage = () => {
    const imageSource = message === "Entrada paga y válida. Puede ingresar." ? login : loginerror;

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
            {scanInfo && <p>{scanInfo}</p>}
          </div>
        </div>
      </div>
    );
  };

  const processFrame = async () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    const img = new Image();
    img.src = imageSrc;
    img.onload = async () => {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.width = img.videoWidth || img.width;
      canvas.height = img.videoHeight || img.height;
      context.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code && code.data) {
        await handleScan(code.data);
      }
    };
  };

  const handleScan = async (data) => {
    try {
      const response = await validateTicket({ variables: { qrCode: data } });
      const ticket = response.data.validateTicket;

      if (ticket.paid) {
        setMessage("Entrada paga y válida. Puede ingresar.");
        setScanInfo(`Escaneos: ${ticket.scans}/${ticket.ticketQuantity}`);
      } else {
        setMessage("Entrada no está pagada. Por favor proceda al pago.");
      }
    } catch (error) {
      const errorMessage = error.message || "An error occurred. Please try again.";
      if (errorMessage.includes("Ticket not paid")) {
        setMessage("La entrada no está pagada. Por favor proceda al pago.");
      } else if (errorMessage.includes("Invalid ticket")) {
        setMessage("La entrada es inválida. Por favor intente de nuevo o contacte soporte.");
      } else {
        setMessage(errorMessage);
      }
    }
  };

  useEffect(() => {
    let scanning = true;
    const interval = setInterval(() => {
      if (scanning) {
        processFrame();
      }
    }, 500); // Adjust the interval as needed

    return () => {
      scanning = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let timeoutId = null;
    if (message) {
      timeoutId = setTimeout(() => {
        setMessage("");
        setScanInfo(null);
      }, 3000);
    }
    return () => {
      clearTimeout(timeoutId);
    };
  }, [message]);

  const videoConstraints = {
    facingMode: "environment",
  };

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

            <SoftBox display="flex">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/png"
                videoConstraints={videoConstraints}
                style={{ width: "100%" }}
                className="m-10 rounded-sm"
              />
            </SoftBox>
          </Card>
        </SoftBox>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
};

export default QRScanner;

// import React, { useRef, useState, useCallback, useEffect } from "react";
// import Webcam from "react-webcam";
// import jsQR from "jsqr";
// import Card from "@mui/material/Card";
// import SoftBox from "components/SoftBox";
// import SoftTypography from "components/SoftTypography";
// import Footer from "examples/Footer";
// import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
// import DashboardNavbar from "examples/Navbars/DashboardNavbar";
// import { useMutation, gql } from "@apollo/client";
// import login from "../../assets/images/aprobado.webp";
// import loginerror from "../../assets/images/denegado.webp";
// import { GET_TICKETS } from "graphql/queries";

// const VALIDATE_TICKET = gql`
//   mutation ValidateTicket($qrCode: String!) {
//     validateTicket(qrCode: $qrCode) {
//       paid
//       scanned
//       eventId
//       type
//       amountPaid
//       ticketQuantity
//       scans
//     }
//   }
// `;

// const QRScanner = () => {
//   const webcamRef = useRef(null);
//   const [message, setMessage] = useState("");
//   const [scanning, setScanning] = useState(false);
//   const [scanInfo, setScanInfo] = useState(null);
//   const [validateTicket] = useMutation(VALIDATE_TICKET, {
//     refetchQueries: [{ query: GET_TICKETS }],
//   });

//   const showMessage = () => {
//     let imageSource = message !== "Entrada paga y válida. Puede ingresar." ? loginerror : login;

//     return (
//       <div
//         style={{
//           position: "fixed",
//           top: "50%",
//           left: "50%",
//           transform: "translate(-50%, -50%)",
//           zIndex: "9999",
//           backgroundColor: "#ffffff",
//           padding: "20px",
//           textAlign: "center",
//           boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
//           borderRadius: "8px",
//           maxWidth: "90%",
//           width: "400px",
//         }}
//       >
//         <div className="container">
//           <div className="content" id="popup">
//             <img
//               src={imageSource}
//               alt="Banda CEDES Don Bosco"
//               style={{ width: "60%", display: "block", margin: "0 auto", marginBottom: "1rem" }}
//             />
//             <p style={{ marginBottom: "1rem" }}>{message}</p>
//             {scanInfo && <p>{scanInfo}</p>}
//           </div>
//         </div>
//       </div>
//     );
//   };

//   const capture = useCallback(() => {
//     const imageSrc = webcamRef.current.getScreenshot();
//     if (imageSrc) {
//       const canvas = document.createElement("canvas");
//       const context = canvas.getContext("2d");
//       const img = new Image();
//       img.src = imageSrc;
//       img.onload = () => {
//         canvas.width = img.width;
//         canvas.height = img.height;
//         context.drawImage(img, 0, 0, img.width, img.height);
//         const imageData = context.getImageData(0, 0, img.width, img.height);
//         const code = jsQR(imageData.data, imageData.width, imageData.height);
//         if (code) {
//           handleScan(code.data);
//         }
//       };
//     }
//   }, [webcamRef]);

//   const handleScan = async (data) => {
//     if (data && !scanning) {
//       setScanning(true);
//       try {
//         const response = await validateTicket({ variables: { qrCode: data } });
//         console.log("Response", response);

//         const ticket = response.data.validateTicket;
//         console.log("Ticket", ticket);

//         if (ticket.paid) {
//           setMessage("Entrada paga y válida. Puede ingresar.");
//           setScanInfo(`Escaneos: ${ticket.scans}/${ticket.ticketQuantity}`);
//         } else {
//           setMessage("Entrada no está pagada. Por favor proceda al pago.");
//         }
//       } catch (error) {
//         console.error("Error validating ticket:", error);
//         const errorMessage = error.message || "An error occurred. Please try again.";
//         if (errorMessage.includes("Ticket not paid")) {
//           setMessage("La entrada no está pagada. Por favor proceda al pago.");
//         } else if (errorMessage.includes("Invalid ticket")) {
//           setMessage("La entrada es inválida. Por favor intente de nuevo o contacte soporte.");
//         } else {
//           setMessage(errorMessage);
//           setScanning(false);
//         }
//       } finally {
//         setScanning(false); // Ensure scanning is set to false after processing
//       }
//     }
//   };

//   const handleError = (err) => {
//     console.error(err); // Log the error
//     setMessage("Error scanning QR code.");
//   };

//   useEffect(() => {
//     let timeoutId = null;
//     if (message) {
//       timeoutId = setTimeout(() => {
//         setMessage(null);
//         setScanInfo(null);
//       }, 3000);
//     }

//     return () => {
//       clearTimeout(timeoutId);
//     };
//   }, [message]);

//   return (
//     <DashboardLayout>
//       <DashboardNavbar />
//       <SoftBox py={3}>
//         <SoftBox mb={3}>
//           <Card>
//             {message && showMessage()}
//             <SoftBox display="flex" justifyContent="space-between" alignItems="center" p={3}>
//               <SoftTypography variant="h6">Checkeo de entradas</SoftTypography>
//             </SoftBox>
//             <Webcam
//               audio={false}
//               ref={webcamRef}
//               screenshotFormat="image/png"
//               videoConstraints={{ facingMode: "environment" }}
//               style={{ width: "100%" }}
//             />
//             <button onClick={capture}>Escanear</button>
//           </Card>
//         </SoftBox>
//       </SoftBox>
//       <Footer />
//     </DashboardLayout>
//   );
// };

// export default QRScanner;
