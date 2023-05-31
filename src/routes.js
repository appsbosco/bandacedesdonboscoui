// BCDB React layouts
import SignIn from "layouts/authentication/sign-in";
import SignUp from "layouts/authentication/sign-up";
import Billing from "layouts/billing";
import Dashboard from "layouts/dashboard";
import Profile from "layouts/profile";
import RTL from "layouts/rtl";
import Tables from "layouts/tables";
import VirtualReality from "layouts/virtual-reality";

// BCDB React icons
import DashboardIcon from "@mui/icons-material/Dashboard";
import EventIcon from "@mui/icons-material/Event";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import InventoryIcon from "@mui/icons-material/Inventory";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import SentimentSatisfiedAltIcon from "@mui/icons-material/SentimentSatisfiedAlt";
import Document from "examples/Icons/Document";
import SpaceShip from "examples/Icons/SpaceShip";
import Inventory from "layouts/inventory";

const routes = [
  {
    type: "collapse",
    name: "Dashboard",
    key: "dashboard",
    route: "/dashboard",
    icon: <DashboardIcon size="12px" />,
    component: <Dashboard />,
    noCollapse: true,
    allowedRoles: ["Director", "Staff", "Subdirector"], // specify which roles can access this route
  },
  {
    type: "collapse",
    name: "Miembros",
    key: "members",
    route: "/members",
    icon: <PeopleAltIcon size="12px" />,
    component: <Tables />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Calendario",
    key: "events",
    route: "/events",
    icon: <EventIcon size="12px" />,
    component: <Billing />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Tomar Asistencia",
    key: "attendance",
    route: "/attendance",
    icon: <FactCheckIcon size="12px" />,
    component: <RTL />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Historial de Asistencia",
    key: "attendance-history",
    route: "/attendance-history",
    icon: <ReceiptLongIcon size="12px" />,
    component: <VirtualReality />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Inventario",
    key: "inventory",
    route: "/inventory",
    icon: <InventoryIcon size="12px" />,
    component: <Inventory />,
    noCollapse: true,
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
  },
  {
    type: "collapse",
    name: "Sign In",
    key: "sign-in",
    route: "/authentication/sign-in",
    icon: <Document size="12px" />,
    component: <SignIn />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Sign Up",
    key: "sign-up",
    route: "/authentication/sign-up",
    icon: <SpaceShip size="12px" />,
    component: <SignUp />,
    noCollapse: true,
  },
];

export default routes;
