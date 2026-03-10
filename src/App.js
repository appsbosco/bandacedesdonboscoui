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

import { DocumentDetail } from "components/documents/DocumentDetail";

import SignUp from "layouts/authentication/sign-up";
import SignIn from "layouts/authentication/sign-in";

/* =========================
   Helpers / Constants
========================= */

const ADMIN_ROLES = new Set(["Admin", "Director", "Dirección Logística"]);

const SECTION_ROLES = new Set(["Principal de sección", "Asistente de sección"]);

const ATTENDANCE_ROLES = new Set([
  "Principal de sección",
  "Asistente de sección",
  "Líder de sección",
]);

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
  "/documents",
  "/new-document",
];

const NO_SIDENAV_EXACT_PATHS = new Set([
  "/",
  "/:lang",
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

function findRouteByKey(routeDefs, key) {
  return routeDefs.find((r) => r?.key === key);
}

/**
 * Rutas especiales para:
 * - Principal de sección
 * - Asistente de sección
 *
 * Basadas en membersRoutes + attendanceRoutes, pero SIN finanzas
 * y con Documentos visibles.
 */
const sectionRoutes = [
  findRouteByKey(membersRoutes, "dashboard"),
  findRouteByKey(membersRoutes, "events"),

  findRouteByKey(membersRoutes, "documents-pages"),
  findRouteByKey(membersRoutes, "documents"),
  findRouteByKey(membersRoutes, "new-document"),

  { type: "title", title: "Asistencia", key: "section-attendance-pages" },
  ...attendanceRoutes,

  // Formations: Principals can view/save step 4 (read-only config, full grid)
  { type: "title", title: "Formaciones", key: "section-formations-pages" },
  findRouteByKey(adminRoutes, "formations"),
  findRouteByKey(adminRoutes, "formation-detail"),

  findRouteByKey(membersRoutes, "almuerzos-pages"),
  findRouteByKey(membersRoutes, "almuerzos"),

  findRouteByKey(membersRoutes, "account-pages"),
  findRouteByKey(membersRoutes, "Profile"),
].filter(Boolean);

const attendanceNavRoutes = [
  findRouteByKey(membersRoutes, "dashboard"),
  findRouteByKey(membersRoutes, "events"),

  findRouteByKey(membersRoutes, "documents-pages"),
  findRouteByKey(membersRoutes, "documents"),
  findRouteByKey(membersRoutes, "new-document"),

  { type: "title", title: "Asistencia", key: "attendance-only-pages" },
  ...attendanceRoutes,

  findRouteByKey(membersRoutes, "almuerzos-pages"),
  findRouteByKey(membersRoutes, "almuerzos"),

  findRouteByKey(membersRoutes, "account-pages"),
  findRouteByKey(membersRoutes, "Profile"),
].filter(Boolean);

function resolveRenderedRouteDefs(userRole) {
  if (ADMIN_ROLES.has(userRole)) return [...routes, ...adminRoutes];
  if (SECTION_ROLES.has(userRole)) return [...routes, ...sectionRoutes];
  if (ATTENDANCE_ROLES.has(userRole)) return [...routes, ...attendanceNavRoutes];
  if (userRole === "Instructura Color Guard") return [...routes, ...colorGuardCampRoutes];
  if (userRole === "Staff") return [...routes, ...staffRoutes];
  if (userRole === "CEDES") return [...routes, ...cedesRoutes];
  if (userRole === "Instructor de instrumento") return [...routes, ...instructorsRoutes];

  if (MEMBERS_EXCLUDED_FOR_PARENTS_ROUTES.has(userRole)) {
    return [...routes, ...membersRoutes];
  }

  return [...routes, ...parentsRoutes];
}

function resolveNavRouteDefs(userRole) {
  if (ADMIN_ROLES.has(userRole)) return adminRoutes;
  if (SECTION_ROLES.has(userRole)) return sectionRoutes;
  if (ATTENDANCE_ROLES.has(userRole)) return attendanceNavRoutes;
  if (userRole === "Staff") return staffRoutes;
  if (userRole === "Instructura Color Guard") return colorGuardCampRoutes;
  if (userRole === "CEDES") return cedesRoutes;
  if (userRole === "Instructor de instrumento") return instructorsRoutes;

  if (MEMBERS_EXCLUDED_FOR_PARENTS_NAV.has(userRole)) return membersRoutes;

  return parentsRoutes;
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

  const token = localStorage.getItem("token");
  const isAuthenticated = Boolean(token && !isTokenExpired(token));

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

  useEffect(() => {
    document.body.setAttribute("dir", direction);
  }, [direction]);

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

  const { data: userData } = useQuery(GET_USERS_BY_ID);
  const userRole = userData?.getUser?.role;

  const renderedRouteDefs = useMemo(() => resolveRenderedRouteDefs(userRole), [userRole]);

  const renderedRouteElements = useMemo(
    () => buildRouteElements(renderedRouteDefs),
    [renderedRouteDefs]
  );

  const navRouteDefs = useMemo(() => resolveNavRouteDefs(userRole), [userRole]);

  const canAccessDocuments = useMemo(() => {
    return renderedRouteDefs.some((r) => r?.route === "/documents");
  }, [renderedRouteDefs]);

  const filteredNavRoutes = useMemo(() => {
    return navRouteDefs.filter((r) => {
      if (!r) return false;

      if (r.type === "title") return true;
      if (r.type === "divider") return true;
      if (r.type !== "collapse") return false;

      const hasNavigation = Boolean(r.route || r.href);
      if (!hasNavigation) return false;

      if (r.route && AUTH_ROUTE_BLACKLIST.has(r.route)) return false;

      return true;
    });
  }, [navRouteDefs]);

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

        {/* Detalle de documentos solo para roles con acceso */}
        {canAccessDocuments && <Route path="/documents/:id" element={<DocumentDetail />} />}

        {/* Rutas públicas adicionales */}
        <Route path="/calendario" element={<CalendarListing />} />
        <Route path="/proyecto-exalumnos" element={<Alumni />} />
        <Route path="/gira-panama" element={<Guatemala />} />
        <Route path="/:lang/patrocinadores/alimentos-jacks" element={<Jacks />} />
        <Route path="/:lang/patrocinadores/ins" element={<INS />} />

        {/* Eventos */}
        <Route path="/60-aniversario" element={<VeladaTickets />} />
        <Route path="/grupo-apoyo" element={<Apoyo />} />
        <Route path="/color-guard-camp" element={<ColorGuardCamp />} />

        {/* Auth */}
        <Route path="/autenticacion/registrarse-privado" element={<SignUp />} />
        <Route path="/autenticacion/iniciar-sesion" element={<SignIn />} />
      </Routes>
    </ThemeProvider>
  );
}
