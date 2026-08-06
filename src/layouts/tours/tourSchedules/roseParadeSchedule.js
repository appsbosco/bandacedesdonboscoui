const DAY_CONTENT = [
  {
    title: "Llegada a Los Ángeles",
    events: [
      "Recibimiento por el equipo de GMT en el aeropuerto",
      "Traslado al hotel",
      "Check-in privado del grupo",
    ],
  },
  {
    title: "Ensayo y carrozas",
    events: ["Ensayo en colegio", "Trabajo en la construcción de las carrozas"],
  },
  {
    title: "Hollywood",
    events: [
      "Visita al TCL Theatre y vista del Hollywood Sign",
      "Tour por Hollywood",
      "The Original Farmer’s Market y The Grove",
    ],
  },
  {
    title: "Rose Bowl y Bandfest",
    events: [
      {
        title: "Reunión de trabajo de Dirección con Drum Majors",
        audience: "DIRECTORS",
      },
      "Foto oficial frente al Rose Bowl Stadium",
      "Presentación de Bandfest",
      "Encuentro con las bandas participantes del Rose Parade",
    ],
  },
  {
    title: "Disneyland",
    events: [
      "Visita a Disneyland",
      "Disney’s Imagination Campus",
      "Desfile por Main Street U.S.A.",
    ],
  },
  {
    title: "Griffith y Santa Monica",
    events: ["Visita al Griffith Observatory", "Santa Monica Beach & Pier"],
  },
  {
    title: "Rose Parade",
    events: [
      "138th Rose Parade",
      "Regreso al hotel para descansar y ver la repetición del desfile",
      "Posible visita de compras a Citadel",
    ],
  },
  {
    title: "Universal Studios",
    events: ["Visita de día completo a Universal Studios Hollywood"],
  },
  { title: "Día de compras", events: ["Actividad de compras"] },
  {
    title: "Regreso a Costa Rica",
    events: ["Check-out del hotel", "Traslado al aeropuerto"],
  },
];

export const PENDING_DATE_NOTICE =
  "Hollywood y Disneyland podrían intercambiarse entre el 28 y el 30 de diciembre, según la confirmación de la Fiesta de Bandas GMT.";

function dateKey(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function addDays(date, amount) {
  const next = new Date(`${dateKey(date)}T12:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() + amount);
  return `${next.toISOString().slice(0, 10)}T12:00:00.000Z`;
}

function createEvent(event, order) {
  const normalized = typeof event === "string" ? { title: event } : event;
  return {
    clientId: `template-event-${order}-${normalized.title}`,
    order,
    startTime: "",
    endTime: "",
    title: normalized.title,
    location: "",
    audience: normalized.audience || "ALL",
  };
}

export function buildRoseParadeSchedule(tour) {
  return {
    timeZone: "America/Los_Angeles",
    status: "DRAFT",
    dateVariant: "PENDING",
    notice: PENDING_DATE_NOTICE,
    days: DAY_CONTENT.map((day, index) => ({
      clientId: `template-day-${index}`,
      order: index,
      date: addDays(tour.startDate, index),
      title: day.title,
      events: day.events.map(createEvent),
    })),
  };
}

export function applyDateVariant(schedule, nextVariant) {
  const currentUsesHollywoodOn30 = schedule.dateVariant === "HOLLYWOOD_30";
  const nextUsesHollywoodOn30 = nextVariant === "HOLLYWOOD_30";
  let days = schedule.days;

  if (currentUsesHollywoodOn30 !== nextUsesHollywoodOn30) {
    const hollywoodIndex = days.findIndex((day) => /hollywood/i.test(day.title));
    const disneyIndex = days.findIndex((day) => /disney/i.test(day.title));
    if (hollywoodIndex >= 0 && disneyIndex >= 0) {
      const hollywood = days[hollywoodIndex];
      const disney = days[disneyIndex];
      days = days.map((day, index) => {
        if (index === hollywoodIndex) {
          return { ...day, title: disney.title, events: disney.events };
        }
        if (index === disneyIndex) {
          return { ...day, title: hollywood.title, events: hollywood.events };
        }
        return day;
      });
    }
  }

  return {
    ...schedule,
    days,
    dateVariant: nextVariant,
    notice: nextVariant === "PENDING" ? PENDING_DATE_NOTICE : "",
  };
}
