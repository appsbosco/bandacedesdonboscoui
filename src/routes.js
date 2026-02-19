// Banda CEDES Don Bosco layouts
import SignIn from "layouts/authentication/sign-in";
import SignUp from "layouts/authentication/sign-up";
import ParentsSignUp from "layouts/authentication/sign-up/parents";

import Billing from "layouts/billing";
import Dashboard from "layouts/dashboard";
import Profile from "layouts/profile";
import RTL from "layouts/rtl";
import Tables from "layouts/members";
import VirtualReality from "layouts/virtual-reality";
import FolderCopyIcon from "@mui/icons-material/FolderCopy";

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
import DriveFolderUploadIcon from "@mui/icons-material/DriveFolderUpload";
import Tuner from "layouts/tuner";
import DocumentsPage from "components/documents/DocumentsPage";
import NewDocumentPage from "components/documents/NewDocumentPage";
import ParentDashboardPage from "layouts/parentDashboard";

import FinanceDashboard from "layouts/finance/index";
import SalesPage from "layouts/finance/components/SalesPage";
import ExpensesPage from "layouts/finance/components/Expenses";
import ReportsPage from "layouts/finance/components/ReportsPage";
import CatalogsPage from "layouts/finance/components/Catalogs";

import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";

/**
 * Helpers
 * - Evitan duplicación
 * - Evitan keys duplicadas en el mismo array
 * - Corrigen el uso de "size" en íconos MUI (se usa sx/fontSize)
 */
const ICON_SX_12 = { fontSize: 12 };

const muiIcon12 = (IconCmp) => <IconCmp sx={ICON_SX_12} />;

const collapse = ({ name, key, route, icon, component }) => ({
  type: "collapse",
  name,
  key,
  route,
  icon,
  component,
  noCollapse: true,
  href: null,
});

const routeOnly = ({ key, route, component }) => ({
  type: "route",
  key,
  route,
  component,
});

const title = (titleText, key) => ({
  type: "title",
  title: titleText,
  key,
});

/**
 * Route factories (fresh objects each time; no riesgo de mutación accidental)
 */
const items = {
  // Public pages
  about: () =>
    collapse({
      name: "Nosotros",
      key: "nosotros",
      route: "/:lang/nosotros",
      icon: "",
      component: <About />,
    }),

  contact: () =>
    collapse({
      name: "Contacto",
      key: "Contacto",
      route: "/:lang/contacto",
      icon: "",
      component: <Contact />,
    }),

  alumniPublic: () =>
    collapse({
      name: "Alumni",
      key: "alumni",
      route: "/proyecto-exalumnos",
      icon: "",
      component: <Alumni />,
    }),

  guatemalaPublic: () =>
    collapse({
      name: "Guatemala",
      key: "guatemala",
      route: "/gira-panama",
      icon: "",
      component: <Guatemala />,
    }),

  veladaPublic: () =>
    collapse({
      name: "Velada",
      key: "concierto-noche-de-peliculas",
      route: "/60-aniversario",
      icon: "",
      component: <VeladaTickets />,
    }),

  rafflePublic: () =>
    collapse({
      name: "Raffle",
      key: "Raffle",
      route: "/raffle",
      icon: "",
      component: <Raffle eventId="66b45c2f9834903c1becfecf" />,
    }),

  apoyoPublic: () =>
    collapse({
      name: "Grupo Apoyo",
      key: "apoyo",
      route: "/grupo-apoyo",
      icon: "",
      component: <Apoyo />,
    }),

  colorGuardCampPublic: () =>
    collapse({
      name: "Color Guard Camp",
      key: "color-guard-camp",
      route: "/color-guard-camp",
      icon: "",
      component: <ColorGuardCamp />,
    }),

  classAttendancePublic: () =>
    collapse({
      name: "Asistencia",
      key: "class-attendance",
      route: "/class-attendance",
      icon: muiIcon12(FactCheckIcon),
      component: <ClassAttendance />,
    }),

  // Shared app pages
  dashboard: () =>
    collapse({
      name: "Dashboard",
      key: "dashboard",
      route: "/dashboard",
      icon: muiIcon12(DashboardIcon),
      component: <Dashboard />,
    }),

  events: () =>
    collapse({
      name: "Calendario",
      key: "events",
      route: "/events",
      icon: muiIcon12(EventIcon),
      component: <Billing />,
    }),

  almuerzos: () =>
    collapse({
      name: "Almuerzos",
      key: "almuerzos",
      route: "/almuerzos",
      icon: muiIcon12(RestaurantIcon),
      component: <Almuerzos />,
    }),

  listaAlmuerzos: () =>
    collapse({
      name: "Lista de almuerzos",
      key: "lista-almuerzos",
      route: "/lista-almuerzos",
      icon: muiIcon12(RestaurantIcon),
      component: <ListaAlmuerzos />,
    }),

  tuner: () =>
    collapse({
      name: "Afinador",
      key: "tuner",
      route: "/tuner",
      icon: muiIcon12(SentimentSatisfiedAltIcon),
      component: <Tuner />,
    }),

  profile: () =>
    collapse({
      name: "Perfil",
      key: "Profile",
      route: "/Profile",
      icon: muiIcon12(SentimentSatisfiedAltIcon),
      component: <Profile />,
    }),

  // Auth
  signIn: () =>
    collapse({
      name: "Sign In",
      key: "sign-in",
      route: "/autenticacion/iniciar-sesion",
      icon: <Document size="12px" />,
      component: <SignIn />,
    }),

  signUp: () =>
    collapse({
      name: "Sign Up",
      key: "sign-up",
      route: "/autenticacion/registrarse-privado",
      icon: <SpaceShip size="12px" />,
      component: <SignUp />,
    }),

  parentsSignUp: () =>
    collapse({
      name: "Sign Up",
      key: "parents-sign-up",
      route: "/autenticacion/registro-privado",
      icon: <SpaceShip size="12px" />,
      component: <ParentsSignUp />,
    }),

  passwordReset: () =>
    collapse({
      name: "Password Reset",
      key: "password-reset",
      route: "/autenticacion/recuperar/:token",
      icon: <SpaceShip size="12px" />,
      component: <PasswordReset />,
    }),

  // Members / org
  members: () =>
    collapse({
      name: "Miembros",
      key: "members",
      route: "/members",
      icon: muiIcon12(PeopleAltIcon),
      component: <Tables />,
    }),

  inventory: () =>
    collapse({
      name: "Inventario",
      key: "inventory",
      route: "/inventory",
      icon: muiIcon12(InventoryIcon),
      component: <Inventory />,
    }),

  alumniDashboard: () =>
    collapse({
      name: "Exalumnos",
      key: "exalumnos",
      route: "/exalumnos",
      icon: muiIcon12(SchoolIcon),
      component: <AlumniDashboard />,
    }),

  guatemalaDashboard: () =>
    collapse({
      name: "Guatemala",
      key: "guatemala",
      route: "/guatemala",
      icon: muiIcon12(PublicIcon),
      component: <GuatemalaDashboard />,
    }),

  apoyoDashboard: () =>
    collapse({
      name: "Grupo Apoyo",
      key: "apoyo-dashboard",
      route: "/grupo-apoyo-dashboard",
      icon: muiIcon12(AccessibilityIcon),
      component: <ApoyoDashboard />,
    }),

  parentDashboard: () =>
    collapse({
      name: "Asistencia de mi hijo/a",
      key: "parent-dashboard",
      route: "/parent-dashboard",
      icon: muiIcon12(DashboardIcon),
      component: <ParentDashboardPage />,
    }),

  // Payments
  payments: () =>
    collapse({
      name: "Pagos",
      key: "payments",
      route: "/payments",
      icon: muiIcon12(PaidIcon),
      component: <PaymentComponent />,
    }),

  // Attendance
  attendanceTake: () =>
    collapse({
      name: "Tomar Asistencia",
      key: "attendance",
      route: "/attendance",
      icon: muiIcon12(FactCheckIcon),
      component: <RTL />,
    }),

  attendanceHistory: () =>
    collapse({
      name: "Historial de Asistencia",
      key: "attendance-history",
      route: "/attendance-history",
      icon: muiIcon12(ReceiptLongIcon),
      component: <VirtualReality />,
    }),

  performanceAttendance: () =>
    collapse({
      name: "Asist. a presentaciones",
      key: "performance-attendance",
      route: "/performance-attendance",
      icon: muiIcon12(FactCheckIcon),
      component: <PerformanceAttendance />,
    }),

  // Email
  email: () =>
    collapse({
      name: "Correo",
      key: "email",
      route: "/email",
      icon: muiIcon12(SendIcon),
      component: <Email />,
    }),

  parentsProfile: () =>
    collapse({
      name: "Perfil",
      key: "parents-profile",
      route: "/parents-profile",
      icon: muiIcon12(SentimentSatisfiedAltIcon),
      component: <ParentsProfile />,
    }),

  // Documents
  documents: () =>
    collapse({
      name: "Documentos",
      key: "documents",
      route: "/documents",
      icon: muiIcon12(FolderCopyIcon),
      component: <DocumentsPage />,
    }),

  newDocument: () =>
    collapse({
      name: "Subir documentos",
      key: "new-document",
      route: "/new-document",
      icon: muiIcon12(DriveFolderUploadIcon),
      component: <NewDocumentPage />,
    }),

  // Tickets
  ticketList: () =>
    collapse({
      name: "Lista de entradas",
      key: "lista-entradas",
      route: "/lista-entradas",
      icon: muiIcon12(ConfirmationNumberIcon),
      component: <TicketList />,
    }),

  ticketAssign: () =>
    collapse({
      name: "Asignar entradas",
      key: "asignar-entradas",
      route: "/asignar-entradas",
      icon: muiIcon12(ConfirmationNumberIcon),
      component: <AssignTickets />,
    }),

  ticketScan: ({ name = "Escaneo de entradas", key = "qr-scanner" } = {}) =>
    collapse({
      name,
      key,
      route: "/qr-scanner",
      icon: muiIcon12(QrCodeIcon),
      component: <QRScanner />,
    }),

  // Color Guard Camp dashboard
  colorGuardCampDashboard: ({ icon = muiIcon12(SchoolIcon) } = {}) =>
    collapse({
      name: "Color Guard Camp",
      key: "color-guard-camp-dashboard",
      route: "/color-guard-camp-dashboard",
      icon,
      component: <ColorGuardCampDashboard />,
    }),

  // Finance
  finance: () =>
    collapse({
      name: "Finanzas",
      key: "finance",
      route: "/finance",
      icon: muiIcon12(AccountBalanceWalletIcon),
      component: <FinanceDashboard />,
    }),

  // subrutas (solo router; NO menú)
  financeSales: () =>
    routeOnly({
      key: "finance-sales",
      route: "/finance/sales",
      component: <SalesPage />,
    }),

  financeExpenses: () =>
    routeOnly({
      key: "finance-expenses",
      route: "/finance/expenses",
      component: <ExpensesPage />,
    }),

  financeReports: () =>
    routeOnly({
      key: "finance-reports",
      route: "/finance/reports",
      component: <ReportsPage />,
    }),

  financeCatalogs: () =>
    routeOnly({
      key: "finance-catalogs",
      route: "/finance/catalogs",
      component: <CatalogsPage />,
    }),
};

/**
 * Exports: protectedRoutes + attendanceRoutes
 */
export const protectedRoutes = [
  items.members(),
  items.inventory(),
  items.alumniDashboard(),
  items.guatemalaDashboard(),
  items.apoyoDashboard(),

  title("Entradas", "entradas-eventos"),
  // En este menú “protegido”, el nombre original era "Entradas"
  collapse({
    name: "Entradas",
    key: "lista-entradas",
    route: "/lista-entradas",
    icon: muiIcon12(ConfirmationNumberIcon),
    component: <TicketList />,
  }),
  // Nombre original "QRScanner" y key "qrscanner"
  items.ticketScan({ name: "QRScanner", key: "qrscanner" }),
  items.ticketAssign(),
  items.colorGuardCampDashboard({ icon: muiIcon12(SchoolIcon) }),

  title("Pagos", "pagos"),
  items.payments(),
  items.listaAlmuerzos(),

  title("Finanzas", "finanzas"),
  items.finance(),
  items.financeSales(),
  items.financeExpenses(),
  items.financeReports(),
  items.financeCatalogs(),

  items.attendanceTake(),
  items.attendanceHistory(),
  items.performanceAttendance(),

  items.email(),
];

export const attendanceRoutes = [
  items.attendanceTake(),
  items.attendanceHistory(),
  items.performanceAttendance(),
];

/**
 * Public routes (default export)
 * - Se mantiene el set completo original
 * - Íconos vacíos se dejan como "" (como estaba)
 */
const routes = [
  items.about(),
  items.alumniPublic(),
  items.guatemalaPublic(),
  items.veladaPublic(),
  items.rafflePublic(),
  items.apoyoPublic(),
  items.colorGuardCampPublic(),
  items.classAttendancePublic(),
  items.contact(),

  items.dashboard(),
  items.events(),
  items.almuerzos(),
  items.tuner(),

  title("Cuenta", "account-pages"),
  items.profile(),
  items.signIn(),
  items.signUp(),
  items.parentsSignUp(),
  items.passwordReset(),
];

/**
 * Role-based routes
 * - Mantienen el contenido del archivo original
 * - Se elimina el bug de keys duplicadas dentro del mismo array
 * - Se corrige component/icon vacíos en principalRoutes para evitar fallos
 */
export const adminRoutes = [
  items.dashboard(),
  items.members(),
  items.events(),
  items.inventory(),

  title("Afinador", "tuner-pages"),
  items.tuner(),

  title("Documentos", "documents-pages"),
  items.documents(),
  items.newDocument(),

  // title("Pagos", "pagos"),
  // items.payments(),

  title("Finanzas", "finanzas"),
  items.finance(),
  items.financeSales(),
  items.financeExpenses(),
  items.financeReports(),
  items.financeCatalogs(),

  title("Asistencia", "attendance-pages"),
  items.attendanceTake(),
  items.performanceAttendance(),
  items.classAttendancePublic(),
  items.attendanceHistory(),

  title("Almuerzos", "almuerzos-pages"),
  items.almuerzos(),
  items.listaAlmuerzos(),

  title("Entradas", "entradas-eventos"),
  items.ticketList(),
  items.ticketAssign(),
  items.ticketScan({ name: "Escaneo de entradas", key: "qr-scanner" }),

  title("Otros", "otros"),
  items.colorGuardCampDashboard({ icon: muiIcon12(FlagIcon) }),
  items.alumniDashboard(),
  items.guatemalaDashboard(),

  collapse({
    name: "Apoyo",
    key: "grupo-apoyo-dashboard",
    route: "/grupo-apoyo-dashboard",
    icon: muiIcon12(AccessibilityIcon),
    component: <ApoyoDashboard />,
  }),

  title("Comunicación", "comunication"),
  items.email(),

  title("Cuenta", "account-pages"),
  items.profile(),
  items.signIn(),
  items.signUp(),
];

export const staffRoutes = [
  items.dashboard(),
  items.members(),
  items.events(),

  title("Finanzas", "finanzas"),
  items.finance(),
  items.financeSales(),
  items.financeExpenses(),
  items.financeReports(),
  items.financeCatalogs(),

  title("Asistencia", "attendance-pages"),

  items.performanceAttendance(),

  title("Entradas", "entradas-eventos"),
  items.ticketList(),
  items.ticketScan({ name: "Escaneo de entradas", key: "qr-scanner" }),

  title("Almuerzos", "almuerzos-pages"),
  items.almuerzos(),
  items.listaAlmuerzos(),

  title("Cuenta", "account-pages"),
  items.profile(),
  items.signIn(),
  items.signUp(),
];

export const principalRoutes = [
  items.dashboard(),
  items.events(),
  items.attendanceTake(),
  items.attendanceHistory(),
  items.performanceAttendance(),

  title("Finanzas", "finanzas"),
  items.finance(),
  items.financeSales(),
  items.financeExpenses(),
  items.financeReports(),
  items.financeCatalogs(),

  title("Almuerzos", "almuerzos-pages"),
  items.almuerzos(),

  title("Cuenta", "account-pages"),
  items.profile(),

  items.signIn(),
  items.signUp(),
];

export const membersRoutes = [
  items.dashboard(),
  items.events(),

  title("Almuerzos", "almuerzos-pages"),
  items.almuerzos(),

  title("Afinador", "tuner-pages"),
  items.tuner(),

  title("Documentos", "documents-pages"),
  items.documents(),
  items.newDocument(),

  title("Cuenta", "account-pages"),
  items.profile(),
];

export const parentsRoutes = [
  items.dashboard(),

  items.events(),

  title("Asistencia", "attendance-pages"),
  items.parentDashboard(),

  title("Cuenta", "account-pages"),
  items.parentsProfile(),
];

export const cedesRoutes = [
  items.dashboard(),
  items.events(),

  title("Miembros", "members-pages"),
  items.members(),
];

export const instructorsRoutes = [
  items.dashboard(),
  items.events(),
  items.almuerzos(),

  title("Miembros", "members-pages"),
  items.members(),
  items.classAttendancePublic(),
];

export const colorGuardCampRoutes = [
  items.dashboard(),
  items.colorGuardCampDashboard({ icon: muiIcon12(FlagIcon) }),
  items.events(),

  title("Cuenta", "account-pages"),
  items.profile(),
];

export default routes;
