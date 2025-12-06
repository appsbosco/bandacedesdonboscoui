// app/sponsors/ins/content.js

export const insSponsorContent = {
  // ============================================
  // METADATA SEO
  // ============================================
  metadata: {
    title: "INS - Patrocinador Diamante | Banda CEDES Don Bosco Rumbo a Pasadena 2027",
    description:
      "El Instituto Nacional de Seguros (INS) se une como Patrocinador Diamante Oficial de la Banda CEDES Don Bosco en su histórica participación en el Desfile de las Rosas 2027. Seguridad, excelencia y orgullo nacional.",
    ogTitle: "INS × BCDB: Alianza Diamante Rumbo a Pasadena 2027",
    ogDescription:
      "La mayor institución aseguradora de Costa Rica impulsa a 265+ jóvenes músicos hacia el escenario mundial. Una alianza de seguridad, disciplina y excelencia.",
    ogImage: "/images/ins_og_image.jpg",
    twitterTitle: "INS × BCDB: Patrocinio Diamante Rumbo a Pasadena",
    twitterDescription:
      "El INS respalda como Patrocinador Diamante el sueño de la Banda CEDES Don Bosco en el Desfile de las Rosas 2027.",
    twitterImage: "/images/ins_twitter_card.jpg",
  },

  // ============================================
  // STRUCTURED DATA (JSON-LD)
  // ============================================
  structuredData: {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://bcdb.cr/#organization",
        name: "Banda CEDES Don Bosco",
        url: "https://bcdb.cr",
        logo: "https://bcdb.cr/images/bcdb_logo.svg",
        sameAs: [
          "https://facebook.com/bandacedesdonbosco",
          "https://instagram.com/bandacedesdonbosco",
          "https://youtube.com/@bandacedesdonbosco",
        ],
        address: {
          "@type": "PostalAddress",
          addressCountry: "CR",
          addressLocality: "San José",
        },
        foundingDate: "1942",
        knowsAbout: ["Música", "Educación", "Cultura", "Arte", "Disciplina", "Excelencia"],
      },
      {
        "@type": "Brand",
        "@id": "https://www.ins-cr.com/#brand",
        name: "Instituto Nacional de Seguros",
        alternateName: "INS Costa Rica",
        url: "https://www.ins-cr.com",
        logo: "https://bcdb.cr/images/ins_logo.svg",
        description:
          "Instituto Nacional de Seguros de Costa Rica, líder en protección y bienestar desde 1924.",
      },
      {
        "@type": "Event",
        "@id": "https://bcdb.cr/pasadena2027#event",
        name: "Tournament of Roses Parade 2027",
        description:
          "Participación histórica de la Banda CEDES Don Bosco en el Desfile de las Rosas en Pasadena, California, representando a Costa Rica ante millones de espectadores globales.",
        startDate: "2027-01-01",
        endDate: "2027-01-02",
        location: {
          "@type": "Place",
          name: "Pasadena, California",
          address: {
            "@type": "PostalAddress",
            addressLocality: "Pasadena",
            addressRegion: "CA",
            addressCountry: "US",
          },
        },
        sponsor: {
          "@id": "https://www.ins-cr.com/#brand",
        },
        funder: {
          "@id": "https://www.ins-cr.com/#brand",
        },
        organizer: {
          "@id": "https://bcdb.cr/#organization",
        },
        audience: {
          "@type": "Audience",
          audienceType: "Global Television Audience",
          geographicArea: "Worldwide",
        },
      },
      {
        "@type": "SponsorshipEvent",
        name: "Patrocinio Diamante INS × BCDB",
        sponsor: {
          "@id": "https://www.ins-cr.com/#brand",
        },
        about: {
          "@id": "https://bcdb.cr/pasadena2027#event",
        },
      },
    ],
  },

  // ============================================
  // ASSETS (rutas de imágenes/videos)
  // ============================================
  assets: {
    logos: {
      bcdb: "./Logo BCDB.png",
      ins: "./logojacks.png",
    },
    media: {
      hero: "/images/ins_hero.jpg",
      video: "/videos/ins_hero.mp4",
    },
  },

  // ============================================
  // HERO SECTION
  // ============================================
  hero: {
    badge: "Patrocinador Diamante Oficial",
    headline: "INS × BCDB\nRumbo a Pasadena 2027",
    subheading:
      "El Instituto Nacional de Seguros impulsa la excelencia musical y el orgullo nacional en el escenario mundial más importante.",
    cta: {
      primary: {
        text: "Descubrir la alianza",
        link: "#historia",
      },
    },
  },

  // ============================================
  // MÉTRICAS DE IMPACTO
  // ============================================
  metrics: [
    {
      value: "265",
      suffix: "+",
      label: "Jóvenes músicos talentosos",
      icon: "Users",
      animated: true,
    },
    {
      value: "2027",
      label: "Desfile de las Rosas",
      icon: "Calendar",
      animated: true,
    },
    {
      value: "50",
      suffix: "M+",
      label: "Espectadores globales esperados",
      icon: "Globe",
      animated: true,
    },
    {
      value: "15,000",
      suffix: "+",
      label: "Horas de preparación",
      icon: "Clock",
      animated: true,
    },
  ],

  // ============================================
  // POR QUÉ DIAMANTE
  // ============================================
  whyDiamond: {
    sectionLabel: "JERARQUÍA DIAMANTE",
    title: "¿Por qué INS es Patrocinador Diamante?",
    subtitle:
      "El máximo nivel de patrocinio para la institución de mayor solvencia y compromiso con Costa Rica.",
    reasons: [
      {
        icon: "Shield",
        title: "Autoridad y solvencia",
        description:
          "El INS es la principal entidad aseguradora del país con más de 100 años de historia, garantizando protección y confianza a millones de costarricenses.",
      },
      {
        icon: "Heart",
        title: "Impacto directo en juventud",
        description:
          "Más de 265 jóvenes músicos reciben formación integral, seguridad física y mental, y oportunidades de desarrollo profesional gracias a esta alianza estratégica.",
      },
      {
        icon: "Globe",
        title: "Proyección internacional",
        description:
          "El Desfile de las Rosas 2027 será transmitido a más de 50 millones de espectadores en todo el mundo, proyectando a Costa Rica y al INS en el escenario global.",
      },
      {
        icon: "Award",
        title: "Legado de excelencia",
        description:
          "Esta alianza fortalece el tejido social costarricense, promoviendo la cultura, la disciplina y la excelencia como pilares del desarrollo nacional.",
      },
    ],
  },

  // ============================================
  // RELATO INS × BCDB
  // ============================================
  story: {
    sectionLabel: "NUESTRA HISTORIA",
    title: "Una alianza de seguridad, excelencia y país",
    paragraphs: [
      "El Instituto Nacional de Seguros (INS), líder indiscutible en protección y bienestar en Costa Rica desde 1924, comprende que la verdadera seguridad va más allá de pólizas y coberturas: se construye invirtiendo en las personas, especialmente en la juventud que representa el futuro de nuestro país.",
      "La Banda CEDES Don Bosco, reconocida internacionalmente por su excelencia musical, encarna valores que el INS defiende profundamente: disciplina rigurosa, trabajo en equipo ejemplar, búsqueda constante de la excelencia y compromiso inquebrantable con Costa Rica.",
      "Al unirnos como Patrocinador Diamante, no solo respaldamos un proyecto musical extraordinario; estamos impulsando un movimiento de transformación social que beneficia directamente a más de 265 jóvenes talentosos y sus familias, creando un efecto multiplicador en comunidades enteras.",
      "Esta alianza histórica hacia el Desfile de las Rosas 2027 en Pasadena es un testimonio del poder de la colaboración institucional. Juntos, estamos escribiendo un capítulo dorado de orgullo nacional, demostrando que cuando las instituciones sólidas respaldan el talento costarricense, nuestro país brilla con luz propia en el mundo.",
    ],
    keyValues: [
      "Seguridad Integral",
      "Excelencia Musical",
      "Disciplina",
      "Orgullo Nacional",
      "Transformación Social",
    ],
  },

  // ============================================
  // TIMELINE CAMINO A PASADENA
  // ============================================
  timeline: {
    sectionLabel: "CAMINO A PASADENA",
    title: "La Ruta del Sueño Costarricense",
    subtitle:
      "Desde el anuncio histórico hasta el desfile mundial: cada paso es historia viva de nuestro país.",
    milestones: [
      {
        period: "Q1 2025",
        title: "Anuncio Histórico",
        description:
          "Presentación pública del INS como Patrocinador Diamante oficial y lanzamiento de la campaña nacional de comunicación e involucramiento ciudadano.",
      },
      {
        period: "Q2-Q4 2025",
        title: "Preparación Intensiva",
        description:
          "Ensayos diarios especializados, clínicas magistrales internacionales, activaciones de marca en todo el país, y fortalecimiento del programa integral de seguridad y bienestar para los músicos.",
      },
      {
        period: "Q1-Q4 2026",
        title: "Etapa de Excelencia",
        description:
          "Últimos preparativos logísticos de nivel internacional, giras nacionales de despedida en las principales ciudades, gestión exhaustiva del viaje internacional y cierre de detalles operativos con Tournament of Roses.",
      },
      {
        period: "Enero 2027",
        title: "¡Pasadena!",
        description:
          "Presentación histórica de la Banda CEDES Don Bosco en el Desfile de las Rosas, representando a Costa Rica y al INS ante más de 50 millones de espectadores globales y 700,000 asistentes presenciales.",
      },
    ],
  },

  // ============================================
  // EL DESFILE DE LAS ROSAS - NUEVA SECCIÓN
  // ============================================
  roseParade: {
    sectionLabel: "EL DESFILE MUNDIAL",
    title: "El Tournament of Roses: El escenario más grande del mundo",
    subtitle:
      "Comprendiendo la magnitud histórica y el alcance global del evento más importante de la banda.",
    facts: [
      {
        icon: "Trophy",
        title: "135 años de tradición",
        description:
          "Desde 1890, el Desfile de las Rosas ha sido un ícono cultural americano que celebra el año nuevo con arte, música y excelencia.",
      },
      {
        icon: "Globe",
        title: "50+ millones de espectadores",
        description:
          "Transmitido en vivo a más de 200 países y territorios, con audiencias que superan los 50 millones de personas alrededor del mundo.",
      },
      {
        icon: "Users",
        title: "700,000 asistentes presenciales",
        description:
          "Cerca de tres cuartos de millón de personas se reúnen en las calles de Pasadena cada año para presenciar este espectáculo único.",
      },
      {
        icon: "MapPin",
        title: "5.5 millas de recorrido",
        description:
          "Un trayecto épico por Colorado Boulevard donde cada paso cuenta, cada nota resuena, y cada músico representa a su nación con orgullo.",
      },
      {
        icon: "Star",
        title: "Bandas de élite mundial",
        description:
          "Solo las bandas más prestigiosas y preparadas del mundo reciben la invitación a participar en este desfile legendario.",
      },
      {
        icon: "Flame",
        title: "Evento del año en California",
        description:
          "Considerado el evento de mayor relevancia en el estado de California y uno de los más importantes de Estados Unidos.",
      },
    ],
    history: {
      title: "Un legado de más de un siglo",
      paragraphs: [
        "El Tournament of Roses Parade comenzó en 1890 como una modesta celebración del invierno californiano, organizada por el Valley Hunt Club de Pasadena. Lo que inició con carruajes decorados con flores naturales ha evolucionado hasta convertirse en uno de los eventos culturales más importantes del mundo.",
        "Cada año, millones de flores frescas son meticulosamente colocadas en carrozas monumentales, creando verdaderas obras de arte móviles que desafían la imaginación. Las bandas participantes son seleccionadas con años de anticipación, y representar a tu país en este desfile es considerado el mayor honor para cualquier agrupación musical.",
        "Para Costa Rica, la participación de la Banda CEDES Don Bosco en 2027 marca un hito histórico sin precedentes. Somos un país pequeño con un corazón gigante, y llevar nuestra música, nuestra cultura y nuestro espíritu indomable a Pasadena es llevar lo mejor de quienes somos al escenario más grande del mundo.",
      ],
    },
  },

  // ============================================
  // INS EN ACCIÓN (Iniciativas/Activaciones)
  // ============================================
  initiatives: {
    sectionLabel: "INS EN ACCIÓN",
    title: "Activaciones y programas conjuntos",
    subtitle:
      "Más que un patrocinio financiero: una alianza activa y comprometida que beneficia directamente a los músicos, sus familias y la comunidad costarricense.",
    items: [
      {
        title: "Clínicas de prevención de lesiones musicales",
        description:
          "Talleres especializados en salud física específica para músicos (postura, respiración, manejo de instrumentos pesados), impartidos por fisioterapeutas del INS y especialistas internacionales.",
        image: null,
        link: null,
      },
      {
        title: "Seguro de viaje internacional completo",
        description:
          "Cobertura integral para todos los integrantes durante su estadía en Estados Unidos: médica, dental, equipaje, responsabilidad civil y asistencia 24/7, garantizando tranquilidad total.",
        image: null,
        link: null,
      },
      {
        title: "Programa de bienestar integral",
        description:
          "Apoyo continuo en nutrición deportiva para músicos, fisioterapia preventiva y de recuperación, y acompañamiento psicológico durante todo el proceso de preparación de alta exigencia.",
        image: null,
        link: null,
      },
      {
        title: "Contenidos educativos multiplataforma",
        description:
          "Series de materiales audiovisuales y digitales sobre seguridad vial, autocuidado en giras, cultura del esfuerzo, y gestión del estrés, disponibles para toda la comunidad BCDB y sus familias.",
        image: null,
        link: null,
      },
      {
        title: "Activaciones de marca en conciertos nacionales",
        description:
          "Presencia activa del INS en todas las presentaciones públicas importantes, promoviendo mensajes de seguridad ciudadana, responsabilidad social y orgullo nacional.",
        image: null,
        link: null,
      },
      {
        title: "Campaña de comunicación conjunta nacional",
        description:
          "Storytelling multiplataforma de alto impacto que celebra la alianza, los valores compartidos y el impacto social transformador del proyecto en TV, radio, digital y redes sociales.",
        image: null,
        link: null,
      },
    ],
  },

  // ============================================
  // TESTIMONIOS / QUOTES
  // ============================================
  testimonials: [
    {
      quote:
        "El INS tiene el honor de acompañar a la Banda CEDES Don Bosco en este viaje histórico. Su disciplina inquebrantable, búsqueda constante de la excelencia y profundo orgullo nacional son valores que compartimos en el alma. Esta alianza nos permite demostrar que la verdadera seguridad se construye invirtiendo en la juventud, la cultura y el futuro de Costa Rica.",
      name: "Vocería Oficial INS",
      role: "Instituto Nacional de Seguros de Costa Rica",
    },
    {
      quote:
        "La alianza con el INS como nuestro Patrocinador Diamante es mucho más que un respaldo financiero: es un pilar fundamental que sostiene el sueño de alcanzar Pasadena 2027. Su compromiso genuino está presente en cada ensayo, en cada clínica de bienestar, en cada paso del camino. Juntos, estamos construyendo un legado de excelencia musical que trascenderá generaciones y llenará de orgullo a todo nuestro país.",
      name: "Dirección Ejecutiva BCDB",
      role: "Banda CEDES Don Bosco",
    },
    {
      quote:
        "Como músico de la Banda CEDES Don Bosco, saber que el INS nos respalda me da una seguridad inmensa. No solo apoyan económicamente, sino que cuidan de nuestra salud física y mental. Saber que estaremos protegidos en cada momento del viaje a Pasadena nos permite enfocarnos completamente en dar lo mejor de nosotros y representar a Costa Rica con excelencia.",
      name: "Integrante BCDB",
      role: "Músico de la Banda CEDES Don Bosco",
    },
  ],

  // ============================================
  // GALERÍA MULTIMEDIA
  // ============================================
  gallery: {
    sectionLabel: "GALERÍA DE LA ALIANZA",
    title: "Momentos que construyen historia: INS × BCDB",
    images: [
      {
        url: "/images/gallery/ins_01.jpg",
        alt: "Firma del acuerdo histórico de patrocinio diamante entre INS y BCDB",
        caption: "Firma histórica del acuerdo",
      },
      {
        url: "/images/gallery/ins_02.jpg",
        alt: "Ensayo de la banda con branding visible del INS",
        caption: "Preparación continua con respaldo INS",
      },
      {
        url: "/images/gallery/ins_03.jpg",
        alt: "Clínica especializada de prevención de lesiones musicales",
        caption: "Bienestar integral de los músicos",
      },
      {
        url: "/images/gallery/ins_04.jpg",
        alt: "Activación de marca INS en concierto masivo de la banda",
        caption: "Conectando con toda Costa Rica",
      },
      {
        url: "/images/gallery/ins_05.jpg",
        alt: "Jóvenes músicos con uniforme oficial y logo INS",
        caption: "Orgullo nacional y compromiso",
      },
      {
        url: "/images/gallery/ins_06.jpg",
        alt: "Conferencia de prensa de presentación oficial de la alianza",
        caption: "Anuncio oficial ante medios nacionales",
      },
      {
        url: "/images/gallery/ins_07.jpg",
        alt: "Logo INS en instrumentos musicales de la banda",
        caption: "Alianza visible en cada detalle",
      },
      {
        url: "/images/gallery/ins_08.jpg",
        alt: "Evento comunitario de la alianza INS × BCDB",
        caption: "Impacto social directo en comunidades",
      },
    ],
  },

  // ============================================
  // FAQs EJECUTIVAS
  // ============================================
  faqs: {
    sectionLabel: "PREGUNTAS FRECUENTES",
    title: "Todo lo que necesitas saber sobre esta alianza histórica",
    questions: [
      {
        question: "¿Qué implica ser Patrocinador Diamante del proyecto Pasadena 2027?",
        answer:
          "El nivel Diamante es la categoría de patrocinio de mayor jerarquía y exclusividad. Incluye exposición preferencial de marca en todos los materiales oficiales (impresos, digitales, audiovisuales), presencia destacada en eventos de alto nivel, activaciones de marca en conciertos nacionales, acceso prioritario a oportunidades de contenido y storytelling, y asociación estratégica directa con el proyecto cultural y educativo más importante de la Banda CEDES Don Bosco en sus 80+ años de historia. Solo hay un Patrocinador Diamante, y ese honor le corresponde al INS.",
      },
      {
        question: "¿Cuál es el alcance mediático real del Tournament of Roses Parade 2027?",
        answer:
          "El Tournament of Roses Parade es uno de los eventos de mayor audiencia en el mundo entero. Se transmite en vivo a más de 200 países y territorios, con audiencias que superan los 50 millones de espectadores solo en televisión, sin contar las decenas de millones adicionales en plataformas digitales y streaming. Además, cerca de 700,000 personas asisten presencialmente cada año a las calles de Pasadena para presenciar el desfile. Representa una plataforma de proyección global sin precedentes para Costa Rica, la Banda CEDES Don Bosco y todos nuestros patrocinadores, especialmente el INS.",
      },
      {
        question: "¿Cómo se utilizará el logo del INS durante el proyecto y en Pasadena?",
        answer:
          "El logo del INS tendrá presencia destacada y permanente en: uniformes oficiales de gala y de ensayo de todos los integrantes, instrumentos musicales (en ubicaciones visibles y estratégicas), todos los materiales promocionales impresos y digitales, sitio web oficial del proyecto, perfiles de redes sociales, conferencias de prensa y eventos públicos, contenidos audiovisuales para TV y plataformas digitales, y por supuesto, de manera prominente durante toda la participación en Pasadena 2027. Se respetarán estrictamente los lineamientos de identidad visual del INS y se coordinará cada uso con el equipo oficial de comunicación de la institución para garantizar coherencia y excelencia en la representación de marca.",
      },
      {
        question: "¿Qué actividades conjuntas concretas se realizarán durante 2025-2027?",
        answer:
          "La alianza contempla un robusto programa de actividades conjuntas que incluye: clínicas especializadas de prevención de lesiones musicales impartidas por profesionales del INS, talleres de bienestar integral (nutrición para músicos, manejo del estrés, fisioterapia preventiva), activaciones de marca en todos los conciertos y presentaciones públicas importantes, generación de contenidos educativos multiplataforma sobre seguridad y autocuidado, campañas de comunicación nacional que celebran la alianza y sus valores, eventos comunitarios en diversas regiones del país, cobertura integral de seguro de viaje internacional para todos los participantes, y presencia activa del INS en los eventos de mayor relevancia del calendario 2025-2027 de la Banda CEDES Don Bosco.",
      },
      {
        question: "¿Cómo pueden otras empresas o instituciones colaborar con este proyecto?",
        answer:
          "Si bien el INS ostenta el nivel Diamante de forma exclusiva (el más alto), existen otras categorías de patrocinio disponibles que incluyen Oro, Plata y Bronce, cada una con sus respectivos beneficios y niveles de exposición. Además, hay múltiples oportunidades de colaboración sectorial específica (logística, alimentación, transporte, tecnología, entre otras) y alianzas estratégicas puntuales para activaciones concretas. Para explorar cómo tu empresa u organización puede formar parte de este movimiento histórico y contribuir al orgullo nacional, te invitamos a contactar directamente a nuestro equipo de alianzas corporativas.",
      },
      {
        question:
          "¿Dónde puedo obtener más información, materiales de prensa o solicitar entrevistas?",
        answer:
          "Toda la información oficial sobre la alianza INS × BCDB y el proyecto Pasadena 2027 está disponible en nuestro sitio web oficial. Los medios de comunicación pueden solicitar nuestro press kit completo (que incluye imágenes de alta resolución, videos institucionales, datos clave, cronología del proyecto y material B-roll), coordinar entrevistas con vocerías oficiales tanto del INS como de la Banda CEDES Don Bosco, o solicitar coberturas especiales de eventos. Estamos disponibles para atender consultas de medios nacionales e internacionales con el objetivo de amplificar este mensaje de excelencia, seguridad y orgullo costarricense.",
      },
      {
        question: "¿Qué hace tan especial a la Banda CEDES Don Bosco?",
        answer:
          "La Banda CEDES Don Bosco, fundada en 1942, es una de las agrupaciones musicales más prestigiosas y reconocidas de Centroamérica. Con más de 80 años de trayectoria ininterrumpida, ha representado a Costa Rica en innumerables escenarios internacionales, obteniendo reconocimientos y premios de excelencia. Está conformada por más de 265 jóvenes talentosos (entre 12 y 25 años) que combinan excelencia académica con disciplina musical de alto nivel. Su filosofía salesiana de educación integral, sumada a su búsqueda constante de la perfección artística, la convierten en un símbolo viviente de los mejores valores costarricenses: trabajo duro, dedicación inquebrantable y orgullo nacional.",
      },
      {
        question: "¿Cómo puedo seguir el progreso del proyecto y apoyar como ciudadano?",
        answer:
          "Existen múltiples formas de involucrarte y ser parte de esta historia: síguenos en nuestras redes sociales oficiales donde compartimos actualizaciones constantes, asiste a nuestros conciertos y presentaciones públicas en todo el país, comparte nuestro contenido en tus propias redes para amplificar el mensaje, involucra a tu comunidad, escuela o empresa en actividades de apoyo, y sobre todo, llena de orgullo cada vez que veas a estos jóvenes extraordinarios representando lo mejor de Costa Rica. Cada costarricense es parte fundamental de este sueño nacional.",
      },
    ],
  },

  // ============================================
  // LEGAL Y RECONOCIMIENTOS
  // ============================================
  legal: {
    title: "Información legal y reconocimientos oficiales",
    content: [
      "El uso del logo y la marca registrada del Instituto Nacional de Seguros (INS) en todos los materiales relacionados con el proyecto Pasadena 2027 de la Banda CEDES Don Bosco está debidamente autorizado mediante acuerdo de patrocinio legalmente suscrito entre el INS y la Banda CEDES Don Bosco, con todas las formalidades legales correspondientes.",
      "Todos los derechos de marca del Instituto Nacional de Seguros de Costa Rica son propiedad exclusiva de dicha institución. Su uso está estrictamente regulado por lineamientos institucionales internos y normativa de identidad visual corporativa, y debe contar con autorización previa explícita para cualquier aplicación externa.",
      "La Banda CEDES Don Bosco y toda su comunidad agradecen profunda y sinceramente al Instituto Nacional de Seguros por su confianza institucional, su compromiso genuino con la juventud costarricense, y su liderazgo visionario en esta alianza histórica. Juntos, estamos construyendo un legado permanente de excelencia, seguridad, cultura y orgullo nacional que trascenderá generaciones.",
      "Para consultas sobre uso de marca, lineamientos específicos de patrocinio, oportunidades de colaboración corporativa, o cualquier aspecto legal relacionado con esta alianza estratégica, favor contactar directamente a nuestro equipo de alianzas corporativas y asuntos legales.",
    ],
  },

  // ============================================
  // FOOTER
  // ============================================
  footer: {
    sections: {
      contact: {
        title: "Contacto Oficial",
        email: "info@bcdb.cr",
        phone: "+506 2222-2222",
      },
      links: {
        title: "Enlaces de Interés",
        items: [
          { label: "Inicio BCDB", url: "/", external: false },
          { label: "Sobre Nosotros", url: "/nosotros", external: false },
          { label: "Todos los Patrocinadores", url: "/patrocinadores", external: false },
          { label: "Proyecto Pasadena 2027", url: "/pasadena2027", external: false },
          {
            label: "Sitio Oficial del INS",
            url: "https://www.ins-cr.com",
            external: true,
          },
          {
            label: "Tournament of Roses Official",
            url: "https://www.tournamentofroses.com",
            external: true,
          },
        ],
      },
      social: {
        title: "Síguenos en Redes",
        links: [
          {
            platform: "Facebook",
            url: "https://facebook.com/bandacedesdonbosco",
          },
          {
            platform: "Instagram",
            url: "https://instagram.com/bandacedesdonbosco",
          },
          {
            platform: "YouTube",
            url: "https://youtube.com/@bandacedesdonbosco",
          },
          {
            platform: "TikTok",
            url: "https://tiktok.com/@bandacedesdonbosco",
          },
        ],
      },
    },
    copyright:
      "© 2025 Banda CEDES Don Bosco. Todos los derechos reservados. | Desarrollado con orgullo costarricense rumbo a Pasadena 2027.",
  },
};
