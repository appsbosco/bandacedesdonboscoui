import bandaAvanzada from "assets/images/Banda Avanzada.webp";
import bigBandA from "assets/images/BigBandA.webp";
import bicentenario from "assets/images/bicentenario.webp";
import marimba from "assets/images/marimba.webp";

export const ENSEMBLE_GALLERY_URLS = {
  "bandas-de-concierto": [
    "https://res.cloudinary.com/dnhhbkmpf/image/upload/v1774558441/IMG_9858_ovhoal.webp",
    "https://res.cloudinary.com/dnhhbkmpf/image/upload/v1774558441/DSC00180_mbs8ai.webp",
    "https://res.cloudinary.com/dnhhbkmpf/image/upload/v1774558439/IMG_0048_sevkyy.webp",
    "https://res.cloudinary.com/dnhhbkmpf/image/upload/v1774558439/DSC00143_gqhojn.webp",
    "https://res.cloudinary.com/dnhhbkmpf/image/upload/v1774558440/IMG_9785_giapmx.webp",
    "https://res.cloudinary.com/dnhhbkmpf/image/upload/v1774558438/DSC00499_sxufjx.webp",
    "https://res.cloudinary.com/dnhhbkmpf/image/upload/v1774558440/IMG_2930_iwfalj.webp",
  ],
  "big-band": [
    "https://res.cloudinary.com/dnhhbkmpf/image/upload/v1774558439/IMG_3901_uved24.webp",
    "https://res.cloudinary.com/dnhhbkmpf/image/upload/v1774558440/IMG_8670_mlzjjx.webp",
    "https://res.cloudinary.com/dnhhbkmpf/image/upload/v1774558439/IMG_3694_vcrufp.webp",
    "https://res.cloudinary.com/dnhhbkmpf/image/upload/v1774558440/IMG_7425_yqkdeq.webp",
    "https://res.cloudinary.com/dnhhbkmpf/image/upload/v1774558440/IMG_5309_zhsces.webp",
    "https://res.cloudinary.com/dnhhbkmpf/image/upload/v1774558439/IMG_1795_xcnggr.webp",
  ],
  "banda-de-marcha": [
    "https://res.cloudinary.com/dnhhbkmpf/image/upload/v1774558439/DSC08088_jrudsu.webp",
    "https://res.cloudinary.com/dnhhbkmpf/image/upload/v1774558441/DSC_0151_axps9v.webp",
    "https://res.cloudinary.com/dnhhbkmpf/image/upload/v1774558442/DSC08233_xsew00.webp",
    "https://res.cloudinary.com/dnhhbkmpf/image/upload/v1774558438/DSC07321_xntj03.webp",
    "https://res.cloudinary.com/dnhhbkmpf/image/upload/v1754511066/DSC08050_wrsdaw.webp",
    "https://res.cloudinary.com/dnhhbkmpf/image/upload/v1754511066/DSC08255_ndwf2n.webp",
  ],
  cimarrona: [
    "https://res.cloudinary.com/dnv9akklf/image/upload/f_auto,q_auto/v1/bcdb/agrupaciones/cimarrona-1",
    "https://res.cloudinary.com/dnv9akklf/image/upload/f_auto,q_auto/v1/bcdb/agrupaciones/cimarrona-2",
    "https://res.cloudinary.com/dnv9akklf/image/upload/f_auto,q_auto/v1/bcdb/agrupaciones/cimarrona-3",
    "https://res.cloudinary.com/dnv9akklf/image/upload/f_auto,q_auto/v1/bcdb/agrupaciones/cimarrona-4",
  ],
};

export const ENSEMBLE_ORDER = ["banda-de-marcha", "big-band", "bandas-de-concierto"];

export const ENSEMBLE_META = {
  "bandas-de-concierto": {
    key: "BANDAS_DE_CONCIERTO",
    slug: "bandas-de-concierto",
  },
  "big-band": {
    key: "BIG_BAND",
    slug: "big-band",
  },
  "banda-de-marcha": {
    key: "BANDA_DE_MARCHA",
    slug: "banda-de-marcha",
  },
  cimarrona: {
    key: "CIMARRONA",
    slug: "cimarrona",
  },
};

const sharedFaqsEs = [
  {
    question: "¿Con cuánto tiempo de anticipación debo solicitar una contratación?",
    answer:
      "Lo ideal es escribirnos con varias semanas de anticipación para revisar disponibilidad, necesidades del evento y detalles logísticos.",
  },
  {
    question: "¿Atienden eventos fuera del GAM?",
    answer:
      "Sí. También podemos atender eventos fuera del GAM, coordinando traslado, horarios y condiciones según el tipo de presentación.",
  },
  {
    question: "¿Qué información necesitan para cotizar?",
    answer:
      "Necesitamos la fecha, el horario, el lugar, el tipo de evento, la duración estimada, el formato que te interesa y cualquier detalle logístico importante.",
  },
];

const sharedFaqsEn = [
  {
    question: "How far in advance should I request a booking?",
    answer:
      "It is best to contact us several weeks in advance so we can review availability, event needs, and logistics.",
  },
  {
    question: "Do you perform outside the Greater Metropolitan Area?",
    answer:
      "Yes. We can also perform outside the GAM and coordinate transportation, schedules, and operating details depending on the event format.",
  },
  {
    question: "What information do you need to prepare a quote?",
    answer:
      "We need the date, time, venue, event type, estimated duration, the ensemble you are interested in, and any important logistical details.",
  },
];

export const ENSEMBLE_CONTENT = {
  es: {
    listing: {
      title: "Agrupaciones para distintos tipos de evento",
      description:
        "Conoce los formatos de la Banda CEDES Don Bosco y encuentra la opción ideal para conciertos, actos institucionales, desfiles, celebraciones y actividades especiales.",
      eyebrow: "Agrupaciones",
      cta: "Solicitar contratación",
      secondaryCta: "Hablar con el equipo",
      seoTitle: "Agrupaciones | Banda CEDES Don Bosco",
      seoDescription:
        "Conoce las agrupaciones de la Banda CEDES Don Bosco y solicita contrataciones para conciertos, eventos corporativos, desfiles, actos protocolarios y celebraciones.",
    },
    ensembles: {
      "bandas-de-concierto": {
        name: "Bandas de Concierto",
        shortDescription:
          "Presentaciones formales con repertorio variado para conciertos, actividades culturales y eventos institucionales.",
        heroSubtitle:
          "Una propuesta musical pensada para eventos que buscan calidad artística, repertorio bien cuidado y una presentación formal.",
        heroImage: bandaAvanzada,
        gallery: ENSEMBLE_GALLERY_URLS["bandas-de-concierto"],
        seoTitle: "Bandas de Concierto | Banda CEDES Don Bosco",
        seoDescription:
          "Contrata las Bandas de Concierto de la Banda CEDES Don Bosco para conciertos, actividades culturales, temporadas artísticas y eventos institucionales.",
        description: [
          "Las Bandas de Concierto de la Banda CEDES Don Bosco reúnen a jóvenes músicos en un proceso formativo y artístico con una identidad institucional sólida.",
          "Su repertorio incluye música de concierto para banda, obras costarricenses, selecciones temáticas y programas adaptados a escenarios formales o actividades culturales.",
        ],
        repertoire: [
          "Música de concierto para banda",
          "Obras latinoamericanas y repertorio costarricense",
          "Selecciones temáticas para temporadas especiales",
          "Adaptaciones para actos institucionales y culturales",
        ],
        recommendedEvents: [
          "Conciertos de temporada",
          "Festivales culturales",
          "Aniversarios institucionales",
          "Actividades académicas",
          "Eventos municipales y comunitarios",
        ],
        highlights: [
          {
            title: "Presentación formal",
            text: "Ideal para auditorios, teatros y espacios ceremoniales.",
          },
          {
            title: "Repertorio adaptable",
            text: "El programa puede ajustarse según el tipo de evento y el público.",
          },
          {
            title: "Experiencia institucional",
            text: "Una propuesta respaldada por la trayectoria artística de la banda.",
          },
        ],
        faqs: [
          ...sharedFaqsEs,
          {
            question: "¿Pueden preparar repertorio temático?",
            answer:
              "Sí. Según la actividad, podemos proponer un programa acorde con la temática, el protocolo o el público al que va dirigido.",
          },
        ],
      },
      "big-band": {
        name: "Big Band",
        shortDescription:
          "Latino, jazz y música popular para eventos elegantes, festivales y presentaciones con mucha energía.",
        heroSubtitle:
          "Un formato con gran presencia sonora y un repertorio flexible para actividades sociales, empresariales y artísticas.",
        heroImage:
          "https://res.cloudinary.com/dnhhbkmpf/image/upload/v1774558440/IMG_8670_mlzjjx.webp",
        gallery: ENSEMBLE_GALLERY_URLS["big-band"],
        seoTitle: "Big Band | Banda CEDES Don Bosco",
        seoDescription:
          "Contrata la Big Band de la Banda CEDES Don Bosco para eventos elegantes, festivales, actividades sociales y corporativas con repertorio latino, jazz y popular.",
        description: [
          "La Big Band de la Banda CEDES Don Bosco ofrece una propuesta musical elegante, enérgica y cercana, con un repertorio pensado para conectar con distintos públicos.",
          "Es una muy buena opción para quienes buscan música en vivo con personalidad, buen nivel escénico y un ambiente ideal para eventos sociales o corporativos.",
        ],
        repertoire: [
          "Repertorio latino bailable y de concierto",
          "Standards de jazz y swing",
          "Música popular y selecciones contemporáneas",
          "Programas para festivales y veladas especiales",
        ],
        recommendedEvents: [
          "Eventos corporativos",
          "Festivales y galas",
          "Recepciones y cenas especiales",
          "Actividades sociales",
          "Celebraciones institucionales",
        ],
        highlights: [
          {
            title: "Sonido con presencia",
            text: "Un formato que llena muy bien el espacio y aporta carácter al evento.",
          },
          {
            title: "Repertorio flexible",
            text: "Se puede adaptar al estilo y al ambiente que busca cada actividad.",
          },
          {
            title: "Ideal para ocasiones especiales",
            text: "Funciona muy bien en eventos sociales, empresariales y culturales.",
          },
        ],
        faqs: [
          ...sharedFaqsEs,
          {
            question:
              "¿La Big Band funciona para eventos de ambientación y también como show principal?",
            answer:
              "Sí. Puede funcionar como música de ambientación o como una presentación principal, según el enfoque del evento.",
          },
        ],
      },
      "banda-de-marcha": {
        name: "Banda de Marcha",
        shortDescription:
          "El formato principal para eventos de gran escala, con fuerza visual, energía y alto impacto musical.",
        heroSubtitle:
          "Una agrupación ideal para desfiles, actos cívicos, eventos institucionales y presentaciones que requieren potencia, orden y presencia.",
        heroImage:
          "https://res.cloudinary.com/dnhhbkmpf/image/upload/v1754511066/DSC08255_ndwf2n.webp",
        gallery: ENSEMBLE_GALLERY_URLS["banda-de-marcha"],
        seoTitle: "Banda de Marcha | Banda CEDES Don Bosco",
        seoDescription:
          "Contrata la Banda de Marcha de la Banda CEDES Don Bosco para desfiles, actos cívicos, eventos institucionales y espectáculos de alto impacto.",
        description: [
          "La Banda de Marcha es el formato más representativo para eventos multitudinarios y actividades que necesitan una presencia fuerte y bien organizada.",
          "Combina ejecución musical, disciplina de desfile, coordinación visual y la energía necesaria para espacios abiertos y actos protocolarios.",
        ],
        repertoire: [
          "Repertorio para desfiles y actos cívicos",
          "Música de alto impacto para eventos masivos",
          "Selecciones institucionales y protocolarias",
          "Programas escénicos para exhibición",
        ],
        recommendedEvents: [
          "Desfiles",
          "Actos cívicos",
          "Eventos institucionales",
          "Espectáculos de apertura",
          "Celebraciones de gran formato",
        ],
        highlights: [
          {
            title: "Fuerza visual",
            text: "Su desplazamiento y montaje están pensados para públicos grandes.",
          },
          {
            title: "Energía colectiva",
            text: "Es ideal para actividades al aire libre y eventos de alta convocatoria.",
          },
          {
            title: "Muy útil en actos formales",
            text: "Se adapta muy bien a contextos institucionales y ceremoniales.",
          },
        ],
        faqs: [
          ...sharedFaqsEs,
          {
            question: "¿Qué requieren para presentarse en un desfile o recorrido?",
            answer:
              "Necesitamos conocer el trayecto, los horarios, los accesos, el punto de concentración, la hidratación y las condiciones básicas de operación del evento.",
          },
        ],
      },
      cimarrona: {
        name: "Cimarrona",
        shortDescription:
          "Música festiva y tradicional para celebraciones, recorridos, eventos comunales y actividades cercanas al público.",
        heroSubtitle:
          "Un formato alegre, móvil y muy cercano que aporta calidez, identidad y ambiente festivo a celebraciones públicas o privadas.",
        heroImage: marimba,
        gallery: ENSEMBLE_GALLERY_URLS.cimarrona,
        seoTitle: "Cimarrona | Banda CEDES Don Bosco",
        seoDescription:
          "Contrata la Cimarrona de la Banda CEDES Don Bosco para celebraciones, eventos comunales, actividades especiales y experiencias festivas.",
        description: [
          "La Cimarrona ofrece una experiencia musical cercana, dinámica y alegre, ideal para acompañar celebraciones con repertorio tradicional y ambiente popular.",
          "Es un formato muy flexible que funciona bien en actividades comunales, recibimientos, recorridos y eventos donde la interacción con el público es importante.",
        ],
        repertoire: [
          "Música tradicional y festiva",
          "Repertorio popular para recorridos y celebraciones",
          "Selecciones alegres para recibimientos y aperturas",
          "Ambientación musical para actividades especiales",
        ],
        recommendedEvents: [
          "Celebraciones privadas",
          "Eventos comunales",
          "Recibimientos y aperturas",
          "Actividades especiales",
          "Procesiones y recorridos festivos",
        ],
        highlights: [
          {
            title: "Ambiente desde el inicio",
            text: "Genera cercanía y alegría desde el primer momento.",
          },
          {
            title: "Formato móvil",
            text: "Funciona muy bien en recorridos, recibimientos y espacios abiertos.",
          },
          {
            title: "Sello cultural",
            text: "Aporta un lenguaje musical tradicional, familiar y festivo.",
          },
        ],
        faqs: [
          ...sharedFaqsEs,
          {
            question: "¿La cimarrona puede acompañar recorridos?",
            answer:
              "Sí. Es uno de los formatos más adecuados para recorridos cortos, aperturas, recibimientos y actividades en movimiento.",
          },
        ],
      },
    },
  },
  en: {
    listing: {
      title: "Ensembles for different event types",
      description:
        "Explore the Banda CEDES Don Bosco ensemble formats and find the right option for concerts, corporate functions, parades, celebrations, and special events.",
      eyebrow: "Ensembles",
      cta: "Request booking",
      secondaryCta: "Contact the team",
      seoTitle: "Ensembles | Banda CEDES Don Bosco",
      seoDescription:
        "Discover the Banda CEDES Don Bosco ensembles and request bookings for concerts, corporate events, parades, protocol ceremonies, and celebrations.",
    },
    ensembles: {
      "bandas-de-concierto": {
        name: "Concert Bands",
        shortDescription:
          "Formal performances with varied repertoire for concerts, cultural activities, and institutional events.",
        heroSubtitle:
          "A musical format designed for events that need artistic quality, thoughtful repertoire, and a formal presentation.",
        heroImage: bandaAvanzada,
        gallery: ENSEMBLE_GALLERY_URLS["bandas-de-concierto"],
        seoTitle: "Concert Bands | Banda CEDES Don Bosco",
        seoDescription:
          "Book the Banda CEDES Don Bosco Concert Bands for concert seasons, cultural programs, institutional ceremonies, and formal presentations.",
        description: [
          "The Banda CEDES Don Bosco Concert Bands bring together young musicians in a strong artistic and educational process with a solid institutional identity.",
          "Their repertoire includes concert band music, Costa Rican works, themed selections, and programs adapted for formal venues or cultural events.",
        ],
        repertoire: [
          "Concert band literature",
          "Latin American and Costa Rican repertoire",
          "Themed seasonal programs",
          "Adapted sets for institutional ceremonies",
        ],
        recommendedEvents: [
          "Concert seasons",
          "Cultural festivals",
          "Institutional anniversaries",
          "Academic activities",
          "Municipal and community events",
        ],
        highlights: [
          {
            title: "Formal presentation",
            text: "Well suited for auditoriums, theatres, and ceremonial venues.",
          },
          {
            title: "Flexible repertoire",
            text: "Programs can be adjusted to the audience and the event type.",
          },
          {
            title: "Institutional experience",
            text: "A proposal supported by the band’s artistic background.",
          },
        ],
        faqs: [
          ...sharedFaqsEn,
          {
            question: "Can you prepare themed repertoire?",
            answer:
              "Yes. Depending on the event, we can propose a program that fits the theme, protocol, or target audience.",
          },
        ],
      },
      "big-band": {
        name: "Big Band",
        shortDescription:
          "Latin, jazz, and popular music for elegant events, festivals, and energetic live performances.",
        heroSubtitle:
          "A format with strong sound and flexible repertoire for social, corporate, and artistic occasions.",
        heroImage: bigBandA,
        gallery: ENSEMBLE_GALLERY_URLS["big-band"],
        seoTitle: "Big Band | Banda CEDES Don Bosco",
        seoDescription:
          "Book the Banda CEDES Don Bosco Big Band for elegant events, festivals, corporate functions, and social celebrations with Latin, jazz, and popular repertoire.",
        description: [
          "The Banda CEDES Don Bosco Big Band offers an elegant, energetic, and approachable live music experience, with repertoire designed to connect with different audiences.",
          "It is a great option for organizers looking for live music with personality, strong stage presence, and the right atmosphere for social or corporate events.",
        ],
        repertoire: [
          "Latin repertoire",
          "Jazz and swing standards",
          "Popular music selections",
          "Special programs for festivals and gala nights",
        ],
        recommendedEvents: [
          "Corporate events",
          "Festivals and galas",
          "Special dinners and receptions",
          "Social celebrations",
          "Institutional functions",
        ],
        highlights: [
          {
            title: "Strong sound",
            text: "A format that fills the space well and adds character to the event.",
          },
          {
            title: "Flexible repertoire",
            text: "It can adapt to the style and atmosphere each event needs.",
          },
          {
            title: "Great for special occasions",
            text: "Works very well for social, corporate, and cultural events.",
          },
        ],
        faqs: [
          ...sharedFaqsEn,
          {
            question: "Can the Big Band work as background music and as a featured show?",
            answer:
              "Yes. It can work as ambient music or as the main performance, depending on the event goals.",
          },
        ],
      },
      "banda-de-marcha": {
        name: "Marching Band",
        shortDescription:
          "The main format for large-scale events, with visual strength, collective energy, and strong musical impact.",
        heroSubtitle:
          "An ensemble ideal for parades, civic ceremonies, institutional events, and performances that require power, discipline, and presence.",
        heroImage: bicentenario,
        gallery: ENSEMBLE_GALLERY_URLS["banda-de-marcha"],
        seoTitle: "Marching Band | Banda CEDES Don Bosco",
        seoDescription:
          "Book the Banda CEDES Don Bosco Marching Band for parades, civic ceremonies, institutional events, and high-impact public performances.",
        description: [
          "The Marching Band is the signature format for large-scale events and public activities that need a strong and organized presence.",
          "It combines musical execution, parade discipline, visual coordination, and the energy required for open-air and ceremonial settings.",
        ],
        repertoire: [
          "Parade and civic ceremony repertoire",
          "High-impact music for large audiences",
          "Institutional and protocol selections",
          "Show-style performance programs",
        ],
        recommendedEvents: [
          "Parades",
          "Civic ceremonies",
          "Institutional events",
          "Opening shows",
          "Large-scale celebrations",
        ],
        highlights: [
          {
            title: "Visual strength",
            text: "Its movement and presentation are designed for large audiences.",
          },
          {
            title: "Collective energy",
            text: "Ideal for outdoor activities and high-attendance events.",
          },
          {
            title: "Well suited for formal settings",
            text: "It works especially well in ceremonial and institutional contexts.",
          },
        ],
        faqs: [
          ...sharedFaqsEn,
          {
            question: "What do you require for a parade or route performance?",
            answer:
              "We need route information, schedules, access points, assembly area, hydration arrangements, and the basic operating conditions of the event.",
          },
        ],
      },
      cimarrona: {
        name: "Cimarrona",
        shortDescription:
          "Festive and traditional music for celebrations, community events, moving performances, and close audience interaction.",
        heroSubtitle:
          "A cheerful, mobile, and audience-friendly ensemble that brings warmth, identity, and a festive atmosphere to public or private celebrations.",
        heroImage: marimba,
        gallery: ENSEMBLE_GALLERY_URLS.cimarrona,
        seoTitle: "Cimarrona | Banda CEDES Don Bosco",
        seoDescription:
          "Book the Banda CEDES Don Bosco Cimarrona for celebrations, community events, special occasions, and festive live experiences.",
        description: [
          "The Cimarrona offers a close, dynamic, and joyful live music experience, ideal for celebrations with traditional repertoire and a festive atmosphere.",
          "It is a very flexible format that works well for community events, welcomes, short routes, and occasions where audience interaction matters.",
        ],
        repertoire: [
          "Traditional festive repertoire",
          "Popular music for moving performances and celebrations",
          "Upbeat music for welcomes and openings",
          "Live atmosphere for special occasions",
        ],
        recommendedEvents: [
          "Private celebrations",
          "Community events",
          "Welcomes and openings",
          "Special activities",
          "Festive routes and processions",
        ],
        highlights: [
          {
            title: "Atmosphere from the start",
            text: "It creates warmth and celebration from the very first moment.",
          },
          {
            title: "Mobile format",
            text: "Works very well for short routes, welcomes, and open spaces.",
          },
          {
            title: "Cultural identity",
            text: "Brings a traditional, familiar, and festive musical language.",
          },
        ],
        faqs: [
          ...sharedFaqsEn,
          {
            question: "Can the Cimarrona accompany moving events?",
            answer:
              "Yes. It is one of the most suitable formats for short routes, openings, welcomes, and moving celebrations.",
          },
        ],
      },
    },
  },
};

export function getLocaleContent(lang = "es") {
  return ENSEMBLE_CONTENT[lang === "en" ? "en" : "es"];
}

export function getEnsembleContent(lang = "es", slug = "") {
  const locale = getLocaleContent(lang);
  return locale.ensembles[slug] || null;
}
