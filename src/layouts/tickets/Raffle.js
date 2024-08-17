import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { gql, useQuery } from "@apollo/client";

const GET_RAFFLE_NUMBERS = gql`
  query GetTicketsNumbers {
    getTicketsNumbers {
      number
      buyerName
      buyerEmail
      userId {
        name
        firstSurName
        secondSurName
      }
      paid
    }
  }
`;

export default function Raffle({ eventId }) {
  const [winner, setWinner] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentNumber, setCurrentNumber] = useState(null);

  const { loading, error, data } = useQuery(GET_RAFFLE_NUMBERS);

  useEffect(() => {
    let interval;
    if (isDrawing && data && data.getTicketsNumbers) {
      const raffleNumbers = data.getTicketsNumbers;

      interval = setInterval(() => {
        const randomIndex = Math.floor(Math.random() * raffleNumbers.length);
        setCurrentNumber(raffleNumbers[randomIndex]);
      }, 30); // Cambia el número cada 100ms

      setTimeout(() => {
        clearInterval(interval);
        const randomIndex = Math.floor(Math.random() * raffleNumbers.length);
        setWinner(raffleNumbers[randomIndex]);
        setIsDrawing(false);
      }, 3000);
    }

    return () => clearInterval(interval);
  }, [isDrawing, data]);

  const handleDraw = () => {
    if (data && data.getTicketsNumbers) {
      setIsDrawing(true);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center m-auto space-y-8 raffles w-full">
      <h1 className="text-6xl">Sorteo</h1>
      <button onClick={handleDraw} disabled={isDrawing}>
        {isDrawing ? "Sorteando..." : "Sortear un ganador"}
      </button>
      <div className="flex flex-col items-center justify-center h-full text-9xl">
        {isDrawing && currentNumber ? (
          `${currentNumber.number}`
        ) : winner ? (
          <div className="flex flex-col items-center justify-center m-auto">
            <p>{winner?.number}</p>
            <p className="text-xl"> {winner?.buyerName}</p>
            <p className="text-xl">{winner?.paid ? "Pagado" : "No Pagado"}</p>
          </div>
        ) : (
          "Click para sortear"
        )}
      </div>
    </div>
  );
}

Raffle.propTypes = {
  eventId: PropTypes.string.isRequired,
};
