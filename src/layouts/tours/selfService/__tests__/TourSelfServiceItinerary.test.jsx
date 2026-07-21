import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import TourSelfServiceItinerary from "../TourSelfServiceItinerary";

const itinerary = {
  id: "itinerary-1",
  name: "Itinerario de prueba",
  maxPassengers: 60,
  passengerCount: 1,
  flights: [],
  leaders: [],
};

test("renders only the assigned itinerary WhatsApp link as a safe external link", () => {
  const whatsappGroupUrl = "https://chat.whatsapp.com/assigned-group";
  render(<TourSelfServiceItinerary itinerary={{ ...itinerary, whatsappGroupUrl }} />);

  const link = screen.getByRole("link", { name: /unirme al grupo de whatsapp/i });
  expect(link).toHaveAttribute("href", whatsappGroupUrl);
  expect(link).toHaveAttribute("target", "_blank");
  expect(link).toHaveAttribute("rel", "noopener noreferrer");
  expect(screen.getAllByRole("link")).toHaveLength(1);
  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
});

test("does not render a broken link when the itinerary has no configured group", () => {
  render(<TourSelfServiceItinerary itinerary={itinerary} />);

  expect(screen.queryByRole("link", { name: /whatsapp/i })).not.toBeInTheDocument();
});

test("renders nothing when the user has no assigned itinerary", () => {
  const { container } = render(<TourSelfServiceItinerary itinerary={null} />);
  expect(container).toBeEmptyDOMElement();
});
