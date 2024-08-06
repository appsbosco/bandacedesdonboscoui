import React, { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import jsQR from "jsqr";
import { useMutation, gql } from "@apollo/client";

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
    console.log("Scanning", data); // Log the scanning data
    if (data && !scanning) {
      setScanning(true);
      try {
        const response = await validateTicket({ variables: { qrCode: data } });
        console.log("Response", response); // Log the response

        const ticket = response.data.validateTicket;
        console.log("Ticket", ticket); // Log the ticket data

        if (ticket.paid) {
          setMessage("Ticket is paid and valid. You may enter.");
        } else {
          setMessage("Ticket is not paid. Please proceed to payment.");
        }
      } catch (error) {
        console.error("Error validating ticket:", error); // Log the error
        const errorMessage = error.message || "An error occurred. Please try again.";
        if (errorMessage.includes("Ticket not paid")) {
          setMessage("Ticket is not paid. Please proceed to payment.");
        } else if (errorMessage.includes("Invalid ticket")) {
          setMessage("Invalid ticket. Please try again or contact support.");
        } else {
          setMessage(errorMessage);
        }
      }
      setScanning(false);
    }
  };

  const handleError = (err) => {
    console.error(err); // Log the error
    setMessage("Error scanning QR code.");
  };

  return (
    <div>
      <h2>QR Scanner</h2>
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/png"
        videoConstraints={{ facingMode: "environment" }}
        style={{ width: "100%" }}
      />
      <button onClick={capture}>Scan QR</button>
      <p>{message}</p>
    </div>
  );
};

export default QRScanner;
