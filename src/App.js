import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { useQuery } from "@apollo/client";

import theme from "assets/theme";
import brand from "assets/images/Logo-Banda-Cedes-Don-Bosco.webp";

import Sidenav from "examples/Sidenav";
import Configurator from "examples/Configurator";

import { useSoftUIController, setMiniSidenav, setOpenConfigurator } from "context";
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
import {
  resolveNavRouteDefs,
  resolveRenderedRouteDefs,
  buildRouteElements,
  shouldShowSidenavForPath,
  isTokenExpired,
  findRouteByKey,
  sectionRoutes,
  attendanceNavRoutes,
  AUTH_ROUTE_BLACKLIST,
  HIDE_SIDENAV_FOR_LANG_RE,
  LANDING_LANG_RE,
  PROTECTED_PREFIXES,
} from "utils/routeHelpers";

import LanguageRedirect from "./LanguageRedirect";
import PageLoader from "components/ui/PageLoader";

const Landing = lazy(() => import("layouts/landing/Landing"));
const About = lazy(() => import("components/About"));
const Contact = lazy(() => import("components/Contact"));
const BlogListing = lazy(() => import("layouts/blog/BlogListing"));
const ArticlePage = lazy(() => import("layouts/blog/ArticlePage"));
const CalendarListing = lazy(() => import("layouts/calendar/CalendarListing"));
const Alumni = lazy(() => import("layouts/Alumni/Alumni"));
const Guatemala = lazy(() => import("layouts/guatemala/Guatemala"));
const Apoyo = lazy(() => import("layouts/apoyo/Apoyo"));
const VeladaTickets = lazy(() => import("layouts/tickets/BuyTickets"));
const ColorGuardCamp = lazy(() => import("layouts/ColorGuardCamp/ColorGuardCamp"));
const Jacks = lazy(() => import("layouts/sponsors/Jacks"));
const INS = lazy(() => import("layouts/sponsors/INS"));
import PerformanceAttendance from "layouts/PerformanceAttendance/PerformanceAttendance";
const DocumentDetail = lazy(() =>
  import("components/documents/DocumentDetail").then((m) => ({ default: m.DocumentDetail }))
);
const SignUp = lazy(() => import("layouts/authentication/sign-up"));
const SignIn = lazy(() => import("layouts/authentication/sign-in"));

export default function App() {
  const [controller, dispatch] = useSoftUIController();
  const { miniSidenav, direction, layout, openConfigurator, sidenavColor } = controller;

  const [isSidenavHover, setIsSidenavHover] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const isAuthenticated = useMemo(() => Boolean(token && !isTokenExpired(token)), [token]);

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
    const isLandingPath = pathname === "/" || LANDING_LANG_RE.test(pathname);
    const isProtectedPath = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
    if (!isAuthenticated && !isLandingPath && isProtectedPath) {
      navigate("/autenticacion/iniciar-sesion", { replace: true });
    }
  }, [pathname, isAuthenticated, navigate]);

  const { data: userData } = useQuery(GET_USERS_BY_ID, {
    skip: !isAuthenticated,
  });
  const userRole = userData?.getUser?.role;

  useEffect(() => {
    if (!isAuthenticated || !userRole) return;
    if (userRole !== "Taquilla" && userRole !== "Tickets Admin") return;

    const isTicketPath =
      pathname.startsWith("/qr-scanner") ||
      pathname.startsWith("/lista-entradas") ||
      pathname.startsWith("/asignar-entradas");
    const isProtectedPath = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
    const defaultPath = userRole === "Tickets Admin" ? "/lista-entradas" : "/qr-scanner";

    if (pathname === "/dashboard" || (isProtectedPath && !isTicketPath)) {
      navigate(defaultPath, { replace: true });
    }
  }, [isAuthenticated, navigate, pathname, userRole]);

  const renderedRouteDefs = useMemo(() => resolveRenderedRouteDefs(userRole), [userRole]);
  const renderedRouteElements = useMemo(
    () => buildRouteElements(renderedRouteDefs),
    [renderedRouteDefs]
  );
  const navRouteDefs = useMemo(() => resolveNavRouteDefs(userRole), [userRole]);

  const canAccessDocuments = useMemo(
    () => renderedRouteDefs.some((r) => r?.route === "/documents"),
    [renderedRouteDefs]
  );

  const filteredNavRoutes = useMemo(
    () =>
      navRouteDefs.filter((r) => {
        if (!r) return false;
        if (r.type === "title" || r.type === "divider") return true;
        if (r.type !== "collapse") return false;
        if (!r.route && !r.href) return false;
        if (r.route && AUTH_ROUTE_BLACKLIST.has(r.route)) return false;
        return true;
      }),
    [navRouteDefs]
  );

  const canRenderSidenav = useMemo(() => {
    if (layout !== "dashboard") return false;
    if (HIDE_SIDENAV_FOR_LANG_RE.test(pathname)) return false;
    return shouldShowSidenavForPath(pathname);
  }, [layout, pathname]);

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
        </>
      )}

      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<LanguageRedirect />} />
          <Route path="/:lang" element={<Landing />} />
          <Route path="/:lang/nosotros" element={<About />} />
          <Route path="/:lang/blog" element={<BlogListing />} />
          <Route path="/:lang/blog/:slug" element={<ArticlePage />} />
          <Route path="/:lang/contacto" element={<Contact />} />
          <Route path="/:lang/calendario" element={<CalendarListing />} />

          {renderedRouteElements}

          <Route path="/performance-attendance/:eventId" element={<PerformanceAttendance />} />

          {canAccessDocuments && <Route path="/documents/:id" element={<DocumentDetail />} />}

          <Route path="/calendario" element={<CalendarListing />} />
          <Route path="/proyecto-exalumnos" element={<Alumni />} />
          <Route path="/gira-panama" element={<Guatemala />} />
          <Route path="/:lang/patrocinadores/alimentos-jacks" element={<Jacks />} />
          <Route path="/:lang/patrocinadores/ins" element={<INS />} />
          <Route path="/60-aniversario" element={<VeladaTickets />} />
          <Route path="/grupo-apoyo" element={<Apoyo />} />
          <Route path="/color-guard-camp" element={<ColorGuardCamp />} />
          <Route path="/autenticacion/registrarse-privado" element={<SignUp />} />
          <Route path="/autenticacion/iniciar-sesion" element={<SignIn />} />
        </Routes>
      </Suspense>
    </ThemeProvider>
  );
}
