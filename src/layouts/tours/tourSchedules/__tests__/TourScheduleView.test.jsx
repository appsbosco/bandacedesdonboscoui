import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import TourScheduleView from "../TourScheduleView";

const schedule = {
  id: "schedule-1",
  status: "PUBLISHED",
  timeZone: "America/Los_Angeles",
  dateVariant: "HOLLYWOOD_28",
  updatedAt: "2026-12-20T18:00:00.000Z",
  days: [
    {
      id: "day-1",
      order: 0,
      date: "2026-12-26T12:00:00.000Z",
      title: "Llegada a Los Ángeles",
      events: [
        {
          id: "event-1",
          order: 0,
          startTime: null,
          endTime: null,
          title: "Recibimiento en el aeropuerto",
          audience: "ALL",
        },
      ],
    },
    {
      id: "day-2",
      order: 1,
      date: "2026-12-27T12:00:00.000Z",
      title: "Ensayo y carrozas",
      events: [
        {
          id: "event-2",
          order: 0,
          startTime: "09:00",
          endTime: "11:00",
          title: "Ensayo en colegio",
          audience: "ALL",
        },
      ],
    },
  ],
};

const flights = [
  {
    id: "flight-1",
    airline: "Avianca",
    flightNumber: "AV640",
    origin: "SJO",
    destination: "LAX",
    direction: "OUTBOUND",
    departureLocal: "2026-12-26T08:20:00",
    arrivalLocal: "2026-12-26T13:10:00",
  },
];

const connectingFlights = [
  {
    id: "flight-out-1",
    airline: "Avianca",
    flightNumber: "AV651",
    origin: "SJO",
    destination: "GUA",
    direction: "OUTBOUND",
    departureLocal: "2026-12-26T18:05:00",
    arrivalLocal: "2026-12-26T19:35:00",
  },
  {
    id: "flight-out-2",
    airline: "Avianca",
    flightNumber: "AV640",
    origin: "GUA",
    destination: "LAX",
    direction: "CONNECTING",
    departureLocal: "2026-12-26T20:55:00",
    arrivalLocal: "2026-12-27T00:15:00",
  },
  {
    id: "flight-return-1",
    airline: "Avianca",
    flightNumber: "AV641",
    origin: "LAX",
    destination: "GUA",
    direction: "INBOUND",
    departureLocal: "2027-01-04T13:50:00",
    arrivalLocal: "2027-01-04T20:30:00",
  },
  {
    id: "flight-return-2",
    airline: "Avianca",
    flightNumber: "AV650",
    origin: "GUA",
    destination: "SJO",
    direction: "CONNECTING",
    departureLocal: "2027-01-04T21:40:00",
    arrivalLocal: "2027-01-04T23:10:00",
  },
];

test("shows pending times and the viewer's flight on the first day", () => {
  render(<TourScheduleView schedule={schedule} flights={flights} tourName="Rose Parade" />);
  expect(screen.getByText("Horarios por confirmar")).toBeInTheDocument();
  expect(screen.getByText("Avianca AV640")).toBeInTheDocument();
  expect(screen.getByText("Rose Parade")).toBeInTheDocument();
});

test("filters the itinerary by day and supports the full view", () => {
  render(<TourScheduleView schedule={schedule} flights={flights} />);
  fireEvent.click(screen.getByRole("button", { name: /ver día 2/i }));
  expect(screen.getByText("Ensayo y carrozas")).toBeInTheDocument();
  expect(screen.queryByText("Llegada a Los Ángeles")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Todos" }));
  expect(screen.getAllByText("Llegada a Los Ángeles").length).toBeGreaterThan(0);
});

test("uses the viewer's complete assigned flights for the arrival and return days", () => {
  render(<TourScheduleView schedule={schedule} flights={connectingFlights} />);

  expect(
    screen.getByRole("button", { name: /ver día 1, domingo, 27 de diciembre/i })
  ).toBeInTheDocument();
  expect(screen.getByText("Tu itinerario de ida")).toBeInTheDocument();
  expect(screen.getByText("Avianca AV651")).toBeInTheDocument();
  expect(screen.getByText("Avianca AV640")).toBeInTheDocument();
  expect(screen.getAllByText("27 dic, 12:15 a. m.").length).toBeGreaterThan(0);

  fireEvent.click(screen.getByRole("button", { name: /ver día 2, lunes, 4 de enero/i }));
  expect(screen.getByText("Tu itinerario de regreso")).toBeInTheDocument();
  expect(screen.getByText("Avianca AV641")).toBeInTheDocument();
  expect(screen.getByText("Avianca AV650")).toBeInTheDocument();
  expect(screen.getAllByText("4 ene, 1:50 p. m.").length).toBeGreaterThan(0);
});
