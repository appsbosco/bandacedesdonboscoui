import { useCallback, useEffect, useMemo, useState } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { useQuery } from "@apollo/client";
import jwtDecode from "jwt-decode";

import theme from "assets/theme";
import brand from "assets/images/Logo-Banda-Cedes-Don-Bosco.webp";

import Sidenav from "examples/Sidenav";
import Configurator from "examples/Configurator";

import { useSoftUIController } from "context";
import { setMiniSidenav, setOpenConfigurator } from "context";

import routes, {
  protectedRoutes,
  attendanceRoutes,
  adminRoutes,
  staffRoutes,
  membersRoutes,
  principalRoutes,
  parentsRoutes,
  cedesRoutes,
  colorGuardCampRoutes,
  instructorsRoutes,
} from "routes";

import { GET_USERS_BY_ID } from "graphql/queries";

import LanguageRedirect from "./LanguageRedirect";

import Landing from "layouts/landing/Landing";
import About from "components/About";
import Contact from "components/Contact";
import BlogListing from "layouts/blog/BlogListing";
import ArticlePage from "layouts/blog/ArticlePage";
import CalendarListing from "layouts/calendar/CalendarListing";
import Alumni from "layouts/Alumni/Alumni";
import Guatemala from "layouts/guatemala/Guatemala";
import Apoyo from "layouts/apoyo/Apoyo";
import VeladaTickets from "layouts/tickets/BuyTickets";
import ColorGuardCamp from "layouts/ColorGuardCamp/ColorGuardCamp";
import Jacks from "layouts/sponsors/Jacks";
import INS from "layouts/sponsors/INS";

import DocumentsPage from "components/documents/DocumentsPage";
import NewDocumentPage from "components/documents/NewDocumentPage";
import { DocumentDetail } from "components/documents/DocumentDetail";

import SignUp from "layouts/authentication/sign-up";
import SignIn from "layouts/authentication/sign-in";

/* =========================
   Helpers / Constants
========================= */

const ADMIN_ROLES = new Set(["Admin", "Director", "Dirección Logística"]);
const ATTENDANCE_ROLES = new Set([
  "Principal de sección",
  "Asistente de sección",
  "Líder de sección",
]);
const PRINCIPAL_NAV_ROLES = new Set(["Principal de sección", "Asistente de sección"]);

const MEMBERS_EXCLUDED_FOR_PARENTS_ROUTES = new Set([
  "Integrante BCDB",
  "Instructor Drumline",
  "Instructura Color Guard",
  "Instructora Danza",
]);

const MEMBERS_EXCLUDED_FOR_PARENTS_NAV = new Set([
  "Integrante BCDB",
  "Instructor Drumline",
  "Instructura Color Guard",
  "Instructora Danza",
  "Instructor de instrumento",
]);

const AUTH_ROUTE_BLACKLIST = new Set([
  "/autenticacion/iniciar-sesion",
  "/autenticacion/registrarse-privado",
  "/autenticacion/registro-privado",
  "/autenticacion/recuperar/:token",
]);

const HIDE_SIDENAV_FOR_LANG_RE = /^\/(es|en|fr)(\/.*)?$/;

const LANDING_LANG_RE = /^\/(es|en)(\/.*)?$/;

// Se mantiene EXACTAMENTE el set de prefijos protegidos que ya estabas usando:
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/members",
  "/inventory",
  "/performance-attendance",
  "/attendance",
  "/attendance-history",
  "/events",
  "/almuer",
  "/Profile",
  "/finance",
];

// Se mantiene tu lista (consolidada) de paths donde NO se muestra Sidenav:
const NO_SIDENAV_EXACT_PATHS = new Set([
  "/",
  "/:lang", // (esto nunca matchea un pathname real, pero lo mantengo como intención)
  "/autenticacion/iniciar-sesion",
  "/autenticacion/registrarse-privado",
  "/autenticacion/registro-privado",
  "/nosotros",
  "/proyecto-exalumnos",
  "/60-aniversario",
  "/raffle",
  "/gira-panama",
  "/grupo-apoyo",
  "/color-guard-camp",
  "/contacto",
  "/blog",
  "/calendario",
]);

const NO_SIDENAV_PREFIXES = ["/autenticacion/recuperar/", "/blog/"];

function isTokenExpired(token) {
  try {
    const decodedToken = jwtDecode(token);
    return decodedToken?.exp < Date.now() / 1000;
  } catch {
    return true;
  }
}

function buildRouteElements(routeDefs) {
  const out = [];

  const walk = (items) => {
    items.forEach((r) => {
      if (!r) return;

      if (r.collapse) walk(r.collapse);

      if (r.route) {
        out.push(<Route path={r.route} element={r.component} key={r.key ?? r.route} />);
      }
    });
  };

  walk(routeDefs);
  return out;
}

function shouldShowSidenavForPath(pathname) {
  if (NO_SIDENAV_EXACT_PATHS.has(pathname)) return false;
  if (NO_SIDENAV_PREFIXES.some((p) => pathname.startsWith(p))) return false;
  return true;
}

function resolveRenderedRouteDefs(userRole) {
  // OJO: para NO cambiar comportamiento actual,
  // cuando userRole aún no existe (undefined/null), cae a "parentsRoutes" como antes.
  if (ADMIN_ROLES.has(userRole)) return [...routes, ...protectedRoutes];
  if (ATTENDANCE_ROLES.has(userRole)) return [...routes, ...attendanceRoutes];
  if (userRole === "Instructura Color Guard") return [...routes, ...colorGuardCampRoutes];
  if (userRole === "Staff") return [...routes, ...staffRoutes];
  if (userRole === "CEDES") return [...routes, ...cedesRoutes];
  if (userRole === "Instructor de instrumento") return [...routes, ...instructorsRoutes];

  if (!MEMBERS_EXCLUDED_FOR_PARENTS_ROUTES.has(userRole)) {
    return [...routes, ...parentsRoutes];
  }

  return routes;
}

function resolveNavRouteDefs(userRole) {
  if (ADMIN_ROLES.has(userRole)) return adminRoutes;
  if (PRINCIPAL_NAV_ROLES.has(userRole)) return principalRoutes;
  if (userRole === "Staff") return staffRoutes;
  if (userRole === "Instructura Color Guard") return colorGuardCampRoutes;
  if (userRole === "CEDES") return cedesRoutes;
  if (userRole === "Instructor de instrumento") return instructorsRoutes;

  if (!MEMBERS_EXCLUDED_FOR_PARENTS_NAV.has(userRole)) return parentsRoutes;

  return membersRoutes;
}

/* =========================
   Component
========================= */

export default function App() {
  const [controller, dispatch] = useSoftUIController();
  const { miniSidenav, direction, layout, openConfigurator, sidenavColor } = controller;

  const [isSidenavHover, setIsSidenavHover] = useState(false);

  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Auth (se mantiene igual: lectura directa de localStorage)
  const token = localStorage.getItem("token");
  const isAuthenticated = Boolean(token && !isTokenExpired(token));

  // UI handlers (memoizados)
  const handleOnMouseEnter = useCallback(() => {
    if (miniSidenav && !isSidenavHover) {
      setMiniSidenav(dispatch, false);
      setIsSidenavHover(true);
    }
  }, [miniSidenav, isSidenavHover, dispatch]);

  const handleOnMouseLeave = useCallback(() => {
    if (isSidenavHover) {
      setMiniSidenav(dispatch, true);
      setIsSidenavHover(false);
    }
  }, [isSidenavHover, dispatch]);

  const handleConfiguratorOpen = useCallback(() => {
    setOpenConfigurator(dispatch, !openConfigurator);
  }, [dispatch, openConfigurator]);

  // Direction (RTL/LTR)
  useEffect(() => {
    document.body.setAttribute("dir", direction);
  }, [direction]);

  // Scroll to top on route change
  useEffect(() => {
    document.documentElement.scrollTop = 0;
    if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
  }, [pathname]);

  useEffect(() => {
    const isLangPath = LANDING_LANG_RE.test(pathname);
    const isLandingPath = pathname === "/" || isLangPath;

    const isProtectedPath = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

    const shouldRedirectToLogin = !isAuthenticated && !isLandingPath && isProtectedPath;

    if (shouldRedirectToLogin) {
      navigate("/autenticacion/iniciar-sesion", { replace: true });
    }
  }, [pathname, isAuthenticated, navigate]);

  // User role
  const { data: userData } = useQuery(GET_USERS_BY_ID);
  const userRole = userData?.getUser?.role;

  // Route defs por rol (centralizado)
  const renderedRouteDefs = useMemo(() => resolveRenderedRouteDefs(userRole), [userRole]);
  const renderedRouteElements = useMemo(
    () => buildRouteElements(renderedRouteDefs),
    [renderedRouteDefs]
  );

  const navRouteDefs = useMemo(() => resolveNavRouteDefs(userRole), [userRole]);

  const filteredNavRoutes = useMemo(() => {
    return navRouteDefs.filter((r) => {
      if (!r) return false;

      // Mantener headers/categorías
      if (r.type === "title") return true;

      if (r.type === "divider") return true; // opcional
      if (r.type !== "collapse") return false;

      // Mantener links externos si algún día los usas
      const hasNavigation = Boolean(r.route || r.href);
      if (!hasNavigation) return false;

      // Quitar auth del sidenav
      if (r.route && AUTH_ROUTE_BLACKLIST.has(r.route)) return false;

      return true;
    });
  }, [navRouteDefs]);

  // Sidenav visibility
  const hideSidenavForLang = useMemo(() => HIDE_SIDENAV_FOR_LANG_RE.test(pathname), [pathname]);
  const canRenderSidenav = useMemo(() => {
    if (layout !== "dashboard") return false;
    if (hideSidenavForLang) return false;
    return shouldShowSidenavForPath(pathname);
  }, [layout, hideSidenavForLang, pathname]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {canRenderSidenav && (
        <>
          <Sidenav
            color={sidenavColor}
            brand={brand}
            brandName="BCDB"
            routes={filteredNavRoutes}
            onMouseEnter={handleOnMouseEnter}
            onMouseLeave={handleOnMouseLeave}
          />
          <Configurator />
          {/* <ConfigsButton /> */}
        </>
      )}

      <Routes>
        <Route path="/" element={<LanguageRedirect />} />

        <Route path="/:lang" element={<Landing />} />
        <Route path="/:lang/nosotros" element={<About />} />
        <Route path="/:lang/blog" element={<BlogListing />} />
        <Route path="/:lang/blog/:slug" element={<ArticlePage />} />
        <Route path="/:lang/contacto" element={<Contact />} />
        <Route path="/:lang/calendario" element={<CalendarListing />} />

        {/* Rutas por rol */}
        {renderedRouteElements}

        {/* Rutas públicas adicionales */}
        <Route path="/calendario" element={<CalendarListing />} />
        <Route path="/proyecto-exalumnos" element={<Alumni />} />
        <Route path="/gira-panama" element={<Guatemala />} />
        <Route path="/:lang/patrocinadores/alimentos-jacks" element={<Jacks />} />
        <Route path="/:lang/patrocinadores/ins" element={<INS />} />

        {/* Documentos */}
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/new-document" element={<NewDocumentPage />} />
        <Route path="/documents/:id" element={<DocumentDetail />} />

        {/* Eventos */}
        <Route path="/60-aniversario" element={<VeladaTickets />} />
        <Route path="/grupo-apoyo" element={<Apoyo />} />
        <Route path="/color-guard-camp" element={<ColorGuardCamp />} />

        {/* Auth (React Router v6) */}
        <Route path="/autenticacion/registrarse-privado" element={<SignUp />} />
        <Route path="/autenticacion/iniciar-sesion" element={<SignIn />} />
      </Routes>
    </ThemeProvider>
  );
}
