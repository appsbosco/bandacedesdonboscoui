import React, { useState } from "react";
import { useMutation, gql } from "@apollo/client";
import { QrReader } from "react-qr-reader";

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

function QRScanner() {
  const [validateTicket] = useMutation(VALIDATE_TICKET);
  const [message, setMessage] = useState("");
  const [scanning, setScanning] = useState(false);

  const handleScan = async (data) => {
    if (data && !scanning) {
      setScanning(true);
      try {
        const response = await validateTicket({ variables: { qrCode: data } });
        const ticket = response.data.validateTicket;

        if (ticket.paid) {
          setMessage("Ticket is paid and valid.");
        } else {
          setMessage("Ticket is not paid.");
        }
      } catch (error) {
        setMessage("Invalid ticket.");
      }
      setScanning(false);
    }
  };

  const handleError = (err) => {
    console.error(err);
    setMessage("Error scanning QR code.");
  };

  return (
    <div>
      <h2>QR Scanner</h2>
      <QrReader delay={300} onError={handleError} onScan={handleScan} style={{ width: "100%" }} />
      <p>{message}</p>
    </div>
  );
}

export default QRScanner;
