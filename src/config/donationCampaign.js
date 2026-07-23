export const donationCampaign = {
  goal: 660000,
  raised: 309750,
  contributionPerStudent: 2200,
  participantCount: 300,
  currency: "USD",
  lastUpdated: "2026-07-22",
  titleKey: "donate.title",
  accountHolder: "Asociación de Oratorios Salesianos Don Bosco",
  contactEmail: "banda@cedesdonbosco.ed.cr",
  deductibleReceiptWhatsapp: "50641070700",
  shortUrl: "https://bandacedesdonbosco.com/es/donar",
};

export const campaignProgress = {
  remaining: Math.max(donationCampaign.goal - donationCampaign.raised, 0),
  percentage: Math.min((donationCampaign.raised / donationCampaign.goal) * 100, 100),
  fundedStudents: Math.floor(donationCampaign.raised / donationCampaign.contributionPerStudent),
  remainingStudents: Math.ceil(
    Math.max(donationCampaign.goal - donationCampaign.raised, 0) /
      donationCampaign.contributionPerStudent
  ),
  totalStudentEquivalents: Math.ceil(
    donationCampaign.goal / donationCampaign.contributionPerStudent
  ),
};

export const cardPayments = [
  {
    amount: 10,
    src: "https://checkout.baccredomatic.com/payment_button?token=NDY1NmFlODE5YjAzZGQxLmQzNTMyMjgxNzcwOTA2NTc4&color=%23ffffff&background=%23e4002b&text=Aportar ahora&hasimage=true",
  },
  {
    amount: 25,
    src: "https://checkout.baccredomatic.com/payment_button?token=NmI1Njc5ZTQ4ODI5NzcuNmI2MDdmZGYxNzcwOTA2ODY0&color=%23ffffff&background=%23e4002b&text=Aportar ahora&hasimage=true",
  },
  {
    amount: 50,
    src: "https://checkout.baccredomatic.com/payment_button?token=NTIzOGQ2NjA5NzQxYi40NzRiNjkxNmUxNzcwOTA2ODAx&color=%23ffffff&background=%23e4002b&text=Aportar ahora&hasimage=true",
  },
  {
    amount: 100,
    src: "https://checkout.baccredomatic.com/payment_button?token=MTg2ODg5NWQyMzY2OGUyMTcxNDEuOTcxNzcwOTA2OTA0&color=%23ffffff&background=%23e4002b&text=Aportar ahora&hasimage=true",
  },
];

export const transferMethods = [
  { id: "sinpe", value: "7135-4630", labelKey: "donate.payment.sinpe" },
  { id: "crc", value: "CR94 0151 0871 0010 0032 39", labelKey: "donate.payment.crc" },
  { id: "usd", value: "CR50 0151 0001 0026 2301 41", labelKey: "donate.payment.usd" },
];

export const donationAmounts = [10, 25, 50, 100, 250, 550, 1100, 2200];

const sponsorLogo = (filename) => `/images/sponsors/${encodeURIComponent(filename)}`;

export const sponsors = [
  {
    id: "grupo-ins",
    name: "Grupo INS",
    logo: sponsorLogo("Logo INS verde (1).webp"),
    level: "principal",
    contributionType: "financial",
    featured: true,
    alt: "Logotipo de Grupo INS",
  },
  {
    id: "alimentos-jacks",
    name: "Alimentos Jack's",
    logo: sponsorLogo("Jacks logo (1).webp"),
    level: "strategic",
    contributionType: "financial",
    alt: "Logotipo de Alimentos Jack's",
  },
  {
    id: "roma",
    name: "Roma",
    logo: sponsorLogo("Logo Roma Nuevo (2).webp"),
    level: "collaborator",
    contributionType: "financial",
    alt: "Logotipo de Roma",
  },

  {
    id: "universidad-hispanoamericana",
    name: "Universidad Hispanoamericana",
    logo: sponsorLogo("logo UH horizontal.png"),
    level: "collaborator",
    contributionType: "financial",
    alt: "Logotipo de Universidad Hispanoamericana",
  },
  {
    id: "azu",
    name: "AZU",
    logo: sponsorLogo("Azu logo.webp"),
    level: "collaborator",
    contributionType: "financial",
    alt: "Logotipo de AZU",
  },
  {
    id: "code-development-group",
    name: "CODE Development Group",
    logo: sponsorLogo("CODE Logo Color (1).png"),
    level: "collaborator",
    contributionType: "financial",
    alt: "Logotipo de CODE Development Group",
  },
  {
    id: "farmacias-la-bomba",
    name: "Farmacias La Bomba",
    logo: sponsorLogo("FARMACIAS LA BOMBA BANDA.png"),
    level: "collaborator",
    contributionType: "financial",
    alt: "Logotipo de Farmacias La Bomba",
  },
  {
    id: "ambitec",
    name: "Ambitec",
    logo: sponsorLogo("cropped-logo-ambitec (1).webp"),
    level: "collaborator",
    contributionType: "financial",
    alt: "Logotipo de Ambitec",
  },
  {
    id: "sn",
    name: "Sol Naciente",
    logo: sponsorLogo("LogoSN.webp"),
    level: "strategic",
    contributionType: "financial",
    alt: "Logotipo de Sol Naciente",
  },
  {
    id: "mundo-musical",
    name: "Mundo Musical",
    logo: sponsorLogo("Mundo-musical.png"),
    level: "collaborator",
    contributionType: "inKind",
    alt: "Logotipo de Mundo Musical",
  },
  {
    id: "transportes-marvi",
    name: "Transportes Marvi",
    logo: sponsorLogo("TRANSPORTES-MARVI.PNG"),
    level: "collaborator",
    contributionType: "inKind",
    alt: "Logotipo de Transportes Marvi",
  },
  {
    id: "laboratorio-echandi",
    name: "Laboratorio Echandi",
    logo: sponsorLogo("logo-Lab-Echandi.png"),
    level: "collaborator",
    contributionType: "financial",
    alt: "Logotipo de Laboratorio Echandi",
  },
  {
    id: "alberto-varon",
    name: "Alberto Varón",
    logo: sponsorLogo("alberto-varon.jpeg"),
    level: "collaborator",
    contributionType: "financial",
    alt: "Logotipo de Alberto Varón",
  },
  {
    id: "explora-america",
    name: "Explora América",
    logo: sponsorLogo("exploramerica_Mesa de trabajo 1-01.webp"),
    level: "collaborator",
    contributionType: "financial",
    alt: "Logotipo de Explora América",
  },
];

export const sponsorLevelOrder = {
  principal: 0,
  strategic: 1,
  collaborator: 2,
  inKind: 3,
  outreach: 4,
};
