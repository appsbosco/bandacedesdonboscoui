// Banda CEDES Don Bosco layouts
import SignIn from "layouts/authentication/sign-in";
import SignUp from "layouts/authentication/sign-up";
import ParentsSignUp from "layouts/authentication/sign-up/parents";

import Billing from "layouts/billing";
import Dashboard from "layouts/dashboard";
import Profile from "layouts/profile";
import RTL from "layouts/rtl";
import Tables from "layouts/tables";
import VirtualReality from "layouts/virtual-reality";

// Banda CEDES Don Bosco icons
import DashboardIcon from "@mui/icons-material/Dashboard";
import EventIcon from "@mui/icons-material/Event";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import InventoryIcon from "@mui/icons-material/Inventory";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import SentimentSatisfiedAltIcon from "@mui/icons-material/SentimentSatisfiedAlt";
import FlagIcon from "@mui/icons-material/Flag";
import Document from "examples/Icons/Document";
import SendIcon from "@mui/icons-material/Send";
import SpaceShip from "examples/Icons/SpaceShip";
import Inventory from "layouts/inventory";
import About from "components/About";
import Contact from "components/Contact";
import PaymentComponent from "layouts/Payments/Payments";
import PaidIcon from "@mui/icons-material/Paid";
import ParentsProfile from "layouts/parentsProfile";
import Email from "layouts/email";
import Attendance from "layouts/attendance";
import PasswordReset from "layouts/authentication/password-reset/PasswordReset";
import Alumni from "layouts/Alumni/Alumni";
import SchoolIcon from "@mui/icons-material/School";
import AlumniDashboard from "layouts/Alumni/AlumniDashboard";
import ColorGuardCamp from "layouts/ColorGuardCamp/ColorGuardCamp";
import ColorGuardCampDashboard from "layouts/ColorGuardCamp/ColorGuardCampDashboard";
import PerformanceAttendance from "layouts/PerformanceAttendance/PerformanceAttendance";
import Almuerzos from "layouts/almuerzos";
import ListaAlmuerzos from "layouts/almuerzos/lista";
import Guatemala from "layouts/guatemala/Guatemala";
import GuatemalaDashboard from "layouts/guatemala/GuatemalaDashboard";
import PublicIcon from "@mui/icons-material/Public";
import Apoyo from "layouts/apoyo/Apoyo";
import ApoyoDashboard from "layouts/apoyo/ApoyoDashboard";
import AccessibilityIcon from "@mui/icons-material/Accessibility";
import QRScanner from "layouts/tickets/QrScanner";
import QrCodeIcon from "@mui/icons-material/QrCode";
import TicketList from "layouts/tickets/TicketList";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import AssignTickets from "layouts/tickets/TicketAssignation";
import VeladaTickets from "layouts/tickets/BuyTickets";
import Raffle from "layouts/tickets/Raffle";
import ClassAttendance from "layouts/classAttendance/lista";
import Tuner from "layouts/tuner";

export const protectedRoutes = [
  {
    type: "collapse",
    name: "Miembros",
    key: "members",
    route: "/members",
    icon: <PeopleAltIcon size="12px" />,
    component: <Tables />,
    noCollapse: true,
    href: null,
  },
  {
    type: "collapse",
    name: "Inventario",
    key: "inventory",
    route: "/inventory",
    icon: <InventoryIcon size="12px" />,
    component: <Inventory />,
    noCollapse: true,
    href: null,
  },
  {
    type: "collapse",
    name: "Exalumnos",
    key: "exalumnos",
    route: "/exalumnos",
    icon: <SchoolIcon size="12px" />,
    component: <AlumniDashboard />,
    noCollapse: true,
    href: null,
  },
  {
    type: "collapse",
    name: "Guatemala",
    key: "guatemala",
    route: "/guatemala",
    icon: <PublicIcon size="12px" />,
    component: <GuatemalaDashboard />,
    noCollapse: true,
    href: null,
  },
  {
    type: "collapse",
    name: "Grupo Apoyo",
    key: "apoyo-dashboard",
    route: "/grupo-apoyo-dashboard",
    icon: <AccessibilityIcon size="12px" />,
    component: <ApoyoDashboard />,
    noCollapse: true,
    href: null,
  },
  { type: "title", title: "Entradas", key: "entradas-eventos" },
  {
    type: "collapse",
    name: "Entradas",
    key: "lista-entradas",
    route: "/lista-entradas",
    icon: <ConfirmationNumberIcon size="12px" />,
    component: <TicketList />,
    noCollapse: true,
    href: null,
  },
  {
    type: "collapse",
    name: "QRScanner",
    key: "qrscanner",
    route: "/qr-scanner",
    icon: <QrCodeIcon size="12px" />,
    component: <QRScanner />,
    noCollapse: true,
    href: null,
  },

  {
    type: "collapse",
    name: "Asignar entradas",
    key: "asignar-entradas",
    route: "/asignar-entradas",
    icon: <ConfirmationNumberIcon size="12px" />,
    component: <AssignTickets />,
    noCollapse: true,
    href: null,
  },
  {
    type: "collapse",
    name: "Color Guard Camp",
    key: "color-guard-camp-dashboard",
    route: "/color-guard-camp-dashboard",
    icon: <SchoolIcon size="12px" />,
    component: <ColorGuardCampDashboard />,
    noCollapse: true,
    href: null,
  },
  { type: "title", title: "Pagos", key: "pagos" },

  {
    type: "collapse",
    name: "Pagos",
    key: "payments",
    route: "/payments",
    icon: <PaidIcon size="12px" />,
    component: <PaymentComponent />,
    noCollapse: true,
    href: null,
  },
  {
    type: "collapse",
    name: "Lista de almuerzos",
    key: "lista-almuerzos",
    route: "/lista-almuerzos",
    icon: <RestaurantIcon size="12px" />,
    component: <ListaAlmuerzos />,
    noCollapse: true,
    href: null,
  },

  {
    type: "collapse",
    name: "Tomar Asistencia",
    key: "attendance",
    route: "/attendance",
    icon: <FactCheckIcon size="12px" />,
    component: <RTL />,
    noCollapse: true,
    href: null,
  },
  {
    type: "collapse",
    name: "Historial de Asistencia",
    key: "attendance-history",
    route: "/attendance-history",
    icon: <ReceiptLongIcon size="12px" />,
    component: <VirtualReality />,
    noCollapse: true,
    href: null,
  },

  {
    type: "collapse",
    name: "Asist. a presentaciones",
    key: "performance-attendance",
    route: "/performance-attendance",
    icon: <FactCheckIcon size="12px" />,
    component: <PerformanceAttendance />,
    noCollapse: true,
    href: null,
  },
  {
    type: "collapse",
    name: "Correo",
    key: "email",
    route: "/email",
    icon: <SendIcon size="12px" />,
    component: <Email />,
    noCollapse: true,
    href: null,
  },
];

export const attendanceRoutes = [
  {
    type: "collapse",
    name: "Tomar Asistencia",
    key: "attendance",
    route: "/attendance",
    icon: <FactCheckIcon size="12px" />,
    component: <RTL />,
    noCollapse: true,
    href: null,
  },
  {
    type: "collapse",
    name: "Historial de Asistencia",
    key: "attendance-history",
    route: "/attendance-history",
    icon: <ReceiptLongIcon size="12px" />,
    component: <VirtualReality />,
    noCollapse: true,
    href: null,
  },
  {
    type: "collapse",
    name: "Asist. a presentaciones",
    key: "performance-attendance",
    route: "/performance-attendance",
    icon: <FactCheckIcon size="12px" />,
    component: <PerformanceAttendance />,
    noCollapse: true,
    href: null,
  },
];

const routes = [
  {
    type: "collapse",
    name: "Nosotros",
    key: "nosotros",
    route: "/:lang/nosotros",
    icon: "",
    component: <About />,
    noCollapse: true,
    href: null,
  },
  {
    type: "collapse",
    name: "Alumni",
    key: "alumni",
    route: "/proyecto-exalumnos",
    icon: "",
    component: <Alumni />,
    noCollapse: true,
    href: null,
  },
  {
    type: "collapse",
    name: "Guatemala",
    key: "guatemala",
    route: "/gira-guatemala",
    icon: "",
    component: <Guatemala />,
    noCollapse: true,
    href: null,
  },
  {
    type: "collapse",
    name: "Velada",
    key: "concierto-noche-de-peliculas",
    route: "/concierto-noche-de-peliculas",
    icon: "",
    component: <VeladaTickets />,
    noCollapse: true,
    href: null,
  },

  {
    type: "collapse",
    name: "Raffle",
    key: "Raffle",
    route: "/raffle",
    icon: "",
    component: <Raffle eventId="66b45c2f9834903c1becfecf" />,
    noCollapse: true,
    href: null,
  },
  {
    type: "collapse",
    name: "Grupo Apoyo",
    key: "apoyo",
    route: "/grupo-apoyo",
    icon: "",
    component: <Apoyo />,
    noCollapse: true,
    href: null,
  },
  {
    type: "collapse",
    name: "Color Guard Camp",
    key: "color-guard-camp",
    route: "/color-guard-camp",
    icon: "",
    component: <ColorGuardCamp />,
    noCollapse: true,
    href: null,
  },
  {
    type: "collapse",
    name: "Asistencia",
    key: "class-attendance",
    route: "/class-attendance",
    icon: <FactCheckIcon size="12px" />,
    component: <ClassAttendance />,
    noCollapse: true,
    href: null,
  },

  {
    type: "collapse",
    name: "Contacto",
    key: "Contacto",
    route: "/:lang/contacto",
    icon: "",
    component: <Contact />,
    noCollapse: true,
    href: null,
  },

  {
    type: "collapse",
    name: "Dashboard",
    key: "dashboard",
    route: "/dashboard",
    icon: <DashboardIcon size="12px" />,
    component: <Dashboard />,
    noCollapse: true,
    href: null,
  },
  {
    type: "collapse",
    name: "Calendario",
    key: "events",
    route: "/:lang/events",

    icon: <EventIcon size="12px" />,
    component: <Billing />,
    noCollapse: true,
    href: null,
  },
  {
    type: "collapse",
    name: "Almuerzos",
    key: "almuerzos",
    route: "/almuerzos",
    icon: <RestaurantIcon size="12px" />,
    component: <Almuerzos />,
    noCollapse: true,
    href: null,
  },
  {
    type: "collapse",
    name: "Afinador",
    key: "tuner",
    route: "/tuner",
    icon: <SentimentSatisfiedAltIcon size="12px" />,
    component: <Tuner />,
    noCollapse: true,
    href: null,
  },
  { type: "title", title: "Cuenta", key: "account-pages" },
  {
    type: "collapse",
    name: "Perfil",
    key: "Profile",
    route: "/Profile",
    icon: <SentimentSatisfiedAltIcon size="12px" />,
    component: <Profile />,
    noCollapse: true,
    href: null,
  },
  {
    type: "collapse",
    name: "Sign In",
    key: "sign-in",
    route: "/autenticacion/iniciar-sesion",
    icon: <Document size="12px" />,
    component: <SignIn />,
    noCollapse: true,
    href: null,
  },
  {
    type: "collapse",
    name: "Sign Up",
    key: "sign-up",
    route: "/autenticacion/registrarse-privado",
    icon: <SpaceShip size="12px" />,
    component: <SignUp />,
    noCollapse: true,
    href: null,
  },
  {
    type: "collapse",
    name: "Sign Up",
    key: "parents-sign-up",
    route: "/autenticacion/registro-privado",
    icon: <SpaceShip size="12px" />,
    component: <ParentsSignUp />,
    noCollapse: true,
    href: null,
  },
  {
    type: "collapse",
    name: "Password Reset",
    key: "password-reset",
    route: "/autenticacion/recuperar/:token",
    icon: <SpaceShip size="12px" />,
    component: <PasswordReset />,
    noCollapse: true,
    href: null,
  },
];

export const adminRoutes = [
  {
    type: "collapse",
    name: "Dashboard",
    key: "dashboard",
    route: "/dashboard",
    icon: <DashboardIcon size="12px" />,
    component: <Dashboard />,
    noCollapse: true,
    href: null,
  },
  {
    type: "collapse",
    name: "Miembros",
    key: "members",
    route: "/members",
    icon: <PeopleAltIcon size="12px" />,
    component: <Tables />,
    noCollapse: true,
    href: null,
  },
  {
    type: "collapse",
    name: "Calendario",
    key: "events",
    route: "/events",
    icon: <EventIcon size="12px" />,
    component: <Billing />,
    noCollapse: true,
    href: null,
  },
  {
    type: "collapse",
    name: "Inventario",
    key: "inventory",
    route: "/inventory",
    icon: <InventoryIcon size="12px" />,
    component: <Inventory />,
    noCollapse: true,
    href: null,
  },
  { type: "title", title: "Afinador", key: "tuner-pages" },
  {
    type: "collapse",
    name: "Afinador",
    key: "tuner",
    route: "/tuner",
    icon: <SentimentSatisfiedAltIcon size="12px" />,
    component: <Tuner />,
    noCollapse: true,
    href: null,
  },
  { type: "title", title: "Pagos", key: "pagos" },
  {
    type: "collapse",
    name: "Pagos",
    key: "payments",
    route: "/payments",
    icon: <PaidIcon size="12px" />,
    component: <PaymentComponent />,
    noCollapse: true,
    href: null,
  },
  { type: "title", title: "Asistencia", key: "attendance-pages" },

  {
    type: "collapse",
    name: "Tomar Asistencia",
    key: "attendance",
    route: "/attendance",
    icon: <FactCheckIcon size="12px" />,
    component: <RTL />,
    noCollapse: true,
    href: null,
  },
  {
    type: "collapse",
    name: "Asist. a presentaciones",
    key: "performance-attendance",
    route: "/performance-attendance",
    icon: <FactCheckIcon size="12px" />,
    component: <PerformanceAttendance />,
    noCollapse: true,
    href: null,
  },
  {
    type: "collapse",
    name: "Historial de Asistencia",
    key: "attendance-history",
    route: "/attendance-history",
    icon: <ReceiptLongIcon size="12px" />,
    component: <VirtualReality />,
    noCollapse: true,
    href: null,
  },
  { type: "title", title: "Almuerzos", key: "almuerzos-pages" },

  {
    type: "collapse",
    name: "Almuerzos",
    key: "almuerzos",
    route: "/almuerzos",
    icon: <RestaurantIcon size="12px" />,
    component: <Almuerzos />,
    noCollapse: true,
    href: null,
  },
  {
    type: "collapse",
    name: "Lista de almuerzos",
    key: "lista-almuerzos",
    route: "/lista-almuerzos",
    icon: <RestaurantIcon size="12px" />,
    component: <ListaAlmuerzos />,
    noCollapse: true,
    href: null,
  },

  { type: "title", title: "Entradas", key: "entradas-eventos" },

  {
    type: "collapse",
    name: "Lista de entradas",
    key: "lista-entradas",
    route: "/lista-entradas",
    icon: <ConfirmationNumberIcon size="12px" />,
    component: <TicketList />,
    noCollapse: true,
    href: null,
  },
  {
    type: "collapse",
    name: "Asignar entradas",
    key: "asignar-entradas",
    route: "/asignar-entradas",
    icon: <ConfirmationNumberIcon size="12px" />,
    component: <AssignTickets />,
    noCollapse: true,
    href: null,
  },
  {
    type: "collapse",
    name: "Escaneo de entradas",
    key: "qr-scanner",
    route: "/qr-scanner",
    icon: <QrCodeIcon size="12px" />,
    component: <QRScanner />,
    noCollapse: true,
    href: null,
  },

  { type: "title", title: "Otros", key: "otros" },

  {
    type: "collapse",
    name: "Color Guard Camp",
    key: "color-guard-camp-dashboard",
    route: "/color-guard-camp-dashboard",
    icon: <FlagIcon size="12px" />,
    component: <ColorGuardCampDashboard />,
    noCollapse: true,
    href: null,
  },
  {
    type: "collapse",
    name: "Exalumnos",
    key: "exalumnos",
    route: "/exalumnos",
    icon: <SchoolIcon size="12px" />,
    component: <AlumniDashboard />,
    noCollapse: true,
    href: null,
  },

  {
    type: "collapse",
    name: "Guatemala",
    key: "guatemala",
    route: "/guatemala",
    icon: <PublicIcon size="12px" />,
    component: <GuatemalaDashboard />,
    noCollapse: true,
    href: null,
  },

  {
    type: "collapse",
    name: "Apoyo",
    key: "grupo-apoyo-dashboard",
    route: "/grupo-apoyo-dashboard",
    icon: <AccessibilityIcon size="12px" />,
    component: <ApoyoDashboard />,
    noCollapse: true,
    href: null,
  },
  { type: "title", title: "Comunicación", key: "comunication" },
  {
    type: "collapse",
    name: "Correo",
    key: "email",
    route: "/email",
    icon: <SendIcon size="12px" />,
    component: <Email />,
    noCollapse: true,
    href: null,
  },
  { type: "title", title: "Cuenta", key: "account-pages" },
  {
    type: "collapse",
    name: "Perfil",
    key: "Profile",
    route: "/Profile",
    icon: <SentimentSatisfiedAltIcon size="12px" />,
    component: <Profile />,
    noCollapse: true,
    href: null,
  },
  {
    type: "collapse",
    name: "Sign In",
    key: "sign-in",
    route: "/autenticacion/iniciar-sesion",
    icon: <Document size="12px" />,
    component: <SignIn />,
    noCollapse: true,
    href: null,
  },
  {
    type: "collapse",
    name: "Sign Up",
    key: "sign-up",
    route: "/autenticacion/registrarse-privado",
    icon: <SpaceShip size="12px" />,
    component: <SignUp />,
    noCollapse: true,
    href: null,
  },
];

export const staffRoutes = [
  {
    type: "collapse",
    name: "Dashboard",
    key: "dashboard",
    route: "/dashboard",
    icon: <DashboardIcon size="12px" />,
    component: <Dashboard />,
    noCollapse: true,
    href: null,
  },
  {
    type: "collapse",
    name: "Miembros",
    key: "members",
    route: "/members",
    icon: <PeopleAltIcon size="12px" />,
    component: <Tables />,
    noCollapse: true,
    href: null,
  },
  {
    type: "collapse",
    name: "Calendario",
    key: "events",
    route: "/events",
    icon: <EventIcon size="12px" />,
    component: <Billing />,
    noCollapse: true,
    href: null,
  },
  { type: "title", title: "Pagos", key: "pagos" },

  {
    type: "collapse",
    name: "Pagos",
    key: "payments",
    route: "/payments",
    icon: <PaidIcon size="12px" />,
    component: <PaymentComponent />,
    noCollapse: true,
    href: null,
  },
  {
    type: "collapse",
    name: "Asist. a presentaciones",
    key: "performance-attendance",
    route: "/performance-attendance",
    icon: <FactCheckIcon size="12px" />,
    component: <PerformanceAttendance />,
    noCollapse: true,
    href: null,
  },

  { type: "title", title: "Entradas", key: "entradas-eventos" },

  {
    type: "collapse",
    name: "Lista de entradas",
    key: "lista-entradas",
    route: "/lista-entradas",
    icon: <ConfirmationNumberIcon size="12px" />,
    component: <TicketList />,
    noCollapse: true,
    href: null,
  },
  {
    type: "collapse",
    name: "Escaneo de entradas",
    key: "qr-scanner",
    route: "/qr-scanner",
    icon: <QrCodeIcon size="12px" />,
    component: <QRScanner />,
    noCollapse: true,
    href: null,
  },
  { type: "title", title: "Almuerzos", key: "almuerzos-pages" },

  {
    type: "collapse",
    name: "Almuerzos",
    key: "almuerzos",
    route: "/almuerzos",
    icon: <RestaurantIcon size="12px" />,
    component: <Almuerzos />,
    noCollapse: true,
    href: null,
  },
  {
    type: "collapse",
    name: "Lista de almuerzos",
    key: "lista-almuerzos",
    route: "/lista-almuerzos",
    icon: <RestaurantIcon size="12px" />,
    component: <ListaAlmuerzos />,
    noCollapse: true,
    href: null,
  },
  { type: "title", title: "Cuenta", key: "account-pages" },
  {
    type: "collapse",
    name: "Perfil",
    key: "Profile",
    route: "/Profile",
    icon: <SentimentSatisfiedAltIcon size="12px" />,
    component: <Profile />,
    noCollapse: true,
    href: null,
  },
  {
    type: "collapse",
    name: "Sign In",
    key: "sign-in",
    route: "/autenticacion/iniciar-sesion",
    icon: <Document size="12px" />,
    component: <SignIn />,
    noCollapse: true,
    href: null,
  },
  {
    type: "collapse",
    name: "Sign Up",
    key: "sign-up",
    route: "/autenticacion/registrarse-privado",
    icon: <SpaceShip size="12px" />,
    component: <SignUp />,
    noCollapse: true,
    href: null,
  },
];

export const principalRoutes = [
  {
    type: "collapse",
    name: "Dashboard",
    key: "dashboard",
    route: "/dashboard",
    icon: <DashboardIcon size="12px" />,
    component: <Dashboard />,
    noCollapse: true,
    href: null,
  },
  {
    type: "collapse",
    name: "Calendario",
    key: "events",
    route: "/events",
    icon: <EventIcon size="12px" />,
    component: <Billing />,
    noCollapse: true,
    href: null,
  },
  {
    type: "collapse",
    name: "Tomar Asistencia",
    key: "attendance",
    route: "/attendance",
    icon: <FactCheckIcon size="12px" />,
    component: <RTL />,
    noCollapse: true,
    href: null,
  },
  {
    type: "collapse",
    name: "Historial de Asistencia",
    key: "attendance-history",
    route: "/attendance-history",
    icon: <ReceiptLongIcon size="12px" />,
    component: <VirtualReality />,
    noCollapse: true,
    href: null,
  },
  {
    type: "collapse",
    name: "Asist. a presentaciones",
    key: "performance-attendance",
    route: "/performance-attendance",
    icon: <FactCheckIcon size="12px" />,
    component: <PerformanceAttendance />,
    noCollapse: true,
    href: null,
  },

  {
    type: "collapse",
    name: "Almuerzos",
    key: "almuerzos",
    route: "/almuerzos",
    icon: <RestaurantIcon size="12px" />,
    component: <Almuerzos />,
    noCollapse: true,
    href: null,
  },
  { type: "title", title: "Cuenta", key: "account-pages" },
  {
    type: "collapse",
    name: "Perfil",
    key: "Profile",
    route: "/Profile",
    icon: <SentimentSatisfiedAltIcon size="12px" />,
    component: <Profile />,
    noCollapse: true,
    href: null,
  },
  {
    type: "collapse",
    name: "Sign In",
    key: "sign-in",
    route: "/autenticacion/iniciar-sesion",
    icon: "",
    component: "",
    noCollapse: true,
    href: null,
  },
  {
    type: "collapse",
    name: "Sign Up",
    key: "sign-up",
    route: "/autenticacion/registrarse-privado",
    icon: "",
    component: "",
    noCollapse: true,
    href: null,
  },
];

export const membersRoutes = [
  {
    type: "collapse",
    name: "Dashboard",
    key: "dashboard",
    route: "/dashboard",
    icon: <DashboardIcon size="12px" />,
    component: <Dashboard />,
    noCollapse: true,
    href: null,
  },

  {
    type: "collapse",
    name: "Calendario",
    key: "events",
    route: "/events",
    icon: <EventIcon size="12px" />,
    component: <Billing />,
    noCollapse: true,
    href: null,
  },
  { type: "title", title: "Almuerzos", key: "almuerzos-pages" },
  {
    type: "collapse",
    name: "Almuerzos",
    key: "almuerzos",
    route: "/almuerzos",
    icon: <RestaurantIcon size="12px" />,
    component: <Almuerzos />,
    noCollapse: true,
    href: null,
  },
  { type: "title", title: "Afinador", key: "tuner-pages" },
  {
    type: "collapse",
    name: "Afinador",
    key: "tuner",
    route: "/tuner",
    icon: <SentimentSatisfiedAltIcon size="12px" />,
    component: <Tuner />,
    noCollapse: true,
    href: null,
  },
  { type: "title", title: "Cuenta", key: "account-pages" },
  {
    type: "collapse",
    name: "Perfil",
    key: "Profile",
    route: "/Profile",
    icon: <SentimentSatisfiedAltIcon size="12px" />,
    component: <Profile />,
    noCollapse: true,
    href: null,
  },
];

export const parentsRoutes = [
  {
    type: "collapse",
    name: "Dashboard",
    key: "dashboard",
    route: "/dashboard",
    icon: <DashboardIcon size="12px" />,
    component: <Dashboard />,
    noCollapse: true,
    href: null,
  },
  {
    type: "collapse",
    name: "Calendario",
    key: "events",
    route: "/events",
    icon: <EventIcon size="12px" />,
    component: <Billing />,
    noCollapse: true,
    href: null,
  },
  { type: "title", title: "Asistencia", key: "account-pages" },
  {
    type: "collapse",
    name: "Asistencia",
    key: "attendance",
    route: "/attendance",
    icon: <DashboardIcon size="12px" />,
    component: <Attendance />,
    noCollapse: true,
    href: null,
  },

  { type: "title", title: "Cuenta", key: "account-pages" },
  {
    type: "collapse",
    name: "Perfil",
    key: "parents-profile",
    route: "/parents-profile",
    icon: <SentimentSatisfiedAltIcon size="12px" />,
    component: <ParentsProfile />,
    noCollapse: true,
    href: null,
  },
];

export const cedesRoutes = [
  {
    type: "collapse",
    name: "Dashboard",
    key: "dashboard",
    route: "/dashboard",
    icon: <DashboardIcon size="12px" />,
    component: <Dashboard />,
    noCollapse: true,
    href: null,
  },
  {
    type: "collapse",
    name: "Calendario",
    key: "events",
    route: "/events",
    icon: <EventIcon size="12px" />,
    component: <Billing />,
    noCollapse: true,
    href: null,
  },
  { type: "title", title: "Miembros", key: "account-pages" },
  {
    type: "collapse",
    name: "Miembros",
    key: "members",
    route: "/members",
    icon: <PeopleAltIcon size="12px" />,
    component: <Tables />,
    noCollapse: true,
    href: null,
  },
];

export const instructorsRoutes = [
  {
    type: "collapse",
    name: "Dashboard",
    key: "dashboard",
    route: "/dashboard",
    icon: <DashboardIcon size="12px" />,
    component: <Dashboard />,
    noCollapse: true,
    href: null,
  },
  {
    type: "collapse",
    name: "Calendario",
    key: "events",
    route: "/events",
    icon: <EventIcon size="12px" />,
    component: <Billing />,
    noCollapse: true,
    href: null,
  },
  {
    type: "collapse",
    name: "Almuerzos",
    key: "almuerzos",
    route: "/almuerzos",
    icon: <RestaurantIcon size="12px" />,
    component: <Almuerzos />,
    noCollapse: true,
    href: null,
  },
  { type: "title", title: "Miembros", key: "account-pagess" },
  {
    type: "collapse",
    name: "Miembros",
    key: "members",
    route: "/members",
    icon: <PeopleAltIcon size="12px" />,
    component: <Tables />,
    noCollapse: true,
    href: null,
  },
  {
    type: "collapse",
    name: "Asistencia",
    key: "class-attendance",
    route: "/class-attendance",
    icon: <FactCheckIcon size="12px" />,
    component: <ClassAttendance />,
    noCollapse: true,
    href: null,
  },
];

export const colorGuardCampRoutes = [
  {
    type: "collapse",
    name: "Dashboard",
    key: "dashboard",
    route: "/dashboard",
    icon: <DashboardIcon size="12px" />,
    component: <Dashboard />,
    noCollapse: true,
    href: null,
  },
  {
    type: "collapse",
    name: "Color Guard Camp",
    key: "color-guard-camp-dashboard",
    route: "/color-guard-camp-dashboard",
    icon: <FlagIcon size="12px" />,
    component: <ColorGuardCampDashboard />,
    noCollapse: true,
    href: null,
  },
  {
    type: "collapse",
    name: "Calendario",
    key: "events",
    route: "/events",
    icon: <EventIcon size="12px" />,
    component: <Billing />,
    noCollapse: true,
    href: null,
  },
  { type: "title", title: "Cuenta", key: "account-pages" },
  {
    type: "collapse",
    name: "Perfil",
    key: "Profile",
    route: "/Profile",
    icon: <SentimentSatisfiedAltIcon size="12px" />,
    component: <Profile />,
    noCollapse: true,
    href: null,
  },
];

export default routes;
