import { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import CssBaseline from "@mui/material/CssBaseline";
import Icon from "@mui/material/Icon";
import { ThemeProvider } from "@mui/material/styles";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import rtlPlugin from "stylis-plugin-rtl";
import SoftBox from "components/SoftBox";
import theme from "assets/theme";
import routes, {
  protectedRoutes,
  attendanceRoutes,
  adminRoutes,
  staffRoutes,
  membersRoutes,
  principalRoutes,
} from "routes";
import { gql, useQuery } from "@apollo/client";
import SignUp from "layouts/authentication/sign-up";
import SignIn from "layouts/authentication/sign-in";
import Sidenav from "examples/Sidenav";
import Configurator from "examples/Configurator";
import { useSoftUIController } from "context";
import brand from "assets/images/Logo-Banda-Cedes-Don-Bosco.webp";
import Landing from "layouts/landing/Landing";
import { setMiniSidenav, setOpenConfigurator } from "context";
import { GET_USERS_BY_ID } from "graphql/queries";
import ArticlePage from "layouts/blog/ArticlePage";
import BlogListing from "layouts/blog/BlogListing";
import { parentsRoutes } from "routes";
import jwtDecode from "jwt-decode";
import { cedesRoutes } from "routes";
import Alumni from "layouts/Alumni/Alumni";
import ColorGuardCamp from "layouts/ColorGuardCamp/ColorGuardCamp";
import { colorGuardCampRoutes } from "routes";
import CalendarListing from "layouts/calendar/CalendarListing";
import Guatemala from "layouts/guatemala/Guatemala";
import Apoyo from "layouts/apoyo/Apoyo";
import VeladaTickets from "layouts/tickets/BuyTickets";
import { instructorsRoutes } from "routes";
import LanguageRedirect from "./LanguageRedirect";
import { useNavigate } from "react-router-dom";
import About from "components/About";
import Contact from "components/Contact";
import Jacks from "layouts/sponsors/Jacks";
import INS from "layouts/sponsors/INS";

import { DocumentDetail } from "components/documents/DocumentDetail";
import DocumentsPage from "components/documents/DocumentsPage";
import NewDocumentPage from "components/documents/NewDocumentPage";

function isTokenExpired(token) {
  try {
    const decodedToken = jwtDecode(token);
    return decodedToken.exp < Date.now() / 1000;
  } catch (err) {
    return true;
  }
}

export default function App() {
  const [controller, dispatch] = useSoftUIController();
  const { miniSidenav, direction, layout, openConfigurator, sidenavColor } = controller;
  const [onMouseEnter, setOnMouseEnter] = useState(false);
  const [rtlCache, setRtlCache] = useState(null);
  const { pathname } = useLocation();

  const navigate = useNavigate();
  // Check if user is authenticated
  const token = localStorage.getItem("token");
  const isAuthenticated = token && !isTokenExpired(token);

  useMemo(() => {
    const cacheRtl = createCache({
      key: "rtl",
      stylisPlugins: [rtlPlugin],
    });

    setRtlCache(cacheRtl);
  }, []);

  const handleOnMouseEnter = () => {
    if (miniSidenav && !onMouseEnter) {
      setMiniSidenav(dispatch, false);
      setOnMouseEnter(true);
    }
  };

  const handleOnMouseLeave = () => {
    if (onMouseEnter) {
      setMiniSidenav(dispatch, true);
      setOnMouseEnter(false);
    }
  };

  const handleConfiguratorOpen = () => setOpenConfigurator(dispatch, !openConfigurator);

  useEffect(() => {
    document.body.setAttribute("dir", direction);
  }, [direction]);

  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
  }, [pathname]);

  const getRoutes = (allRoutes) =>
    allRoutes.map((route) => {
      if (route.collapse) {
        return getRoutes(route.collapse);
      }

      if (route.route) {
        return <Route exact path={route.route} element={route.component} key={route.key} />;
      }

      return null;
    });

  useEffect(() => {
    const isLangPath = /^\/(es|en)(\/.*)?$/.test(pathname);
    const isLandingPath = pathname === "/" || isLangPath;

    const shouldRedirectToLogin =
      !isAuthenticated &&
      !isLandingPath &&
      (pathname.startsWith("/dashboard") ||
        pathname.startsWith("/members") ||
        pathname.startsWith("/inventory") ||
        pathname.startsWith("/performance-attendance") ||
        pathname.startsWith("/attendance") ||
        pathname.startsWith("/attendance-history") ||
        pathname.startsWith("/events") ||
        pathname.startsWith("/almuer") ||
        pathname.startsWith("/Profile"));

    if (shouldRedirectToLogin) {
      navigate("/autenticacion/iniciar-sesion", { replace: true });
    }
  }, [pathname, isAuthenticated, navigate]);

  const { data: userData, loading, error } = useQuery(GET_USERS_BY_ID);

  const userRole = userData?.getUser?.role;

  let renderedRoutes = null;

  if (userRole === "Admin" || userRole === "Director" || userRole === "Dirección Logística") {
    const adminRoutes = [...routes, ...protectedRoutes];
    renderedRoutes = getRoutes(adminRoutes);
  } else if (
    userRole === "Principal de sección" ||
    userRole === "Asistente de sección" ||
    userRole === "Líder de sección"
  ) {
    const attendanceRoutesFiltered = [...routes, ...attendanceRoutes];
    renderedRoutes = getRoutes(attendanceRoutesFiltered);
  } else if (userRole === "Instructura Color Guard") {
    const colorGuardRoutes = [...routes, ...colorGuardCampRoutes];
    renderedRoutes = getRoutes(colorGuardRoutes);
  } else if (userRole === "Staff") {
    const staffRoutesFiltered = [...routes, ...staffRoutes];
    renderedRoutes = getRoutes(staffRoutesFiltered);
  } else if (userRole === "CEDES") {
    const cedesRoutesFiltered = [...routes, ...cedesRoutes];
    renderedRoutes = getRoutes(cedesRoutesFiltered);
  } else if (userRole === "Instructor de instrumento") {
    const instructorsRoutesFiltered = [...routes, ...instructorsRoutes];
    renderedRoutes = getRoutes(instructorsRoutesFiltered);
  } else if (
    userRole !== "Integrante BCDB" &&
    userRole !== "Instructor Drumline" &&
    userRole !== "Instructura Color Guard" &&
    userRole !== "Instructora Danza"
  ) {
    const parentsRoutesFiltered = [...routes, ...parentsRoutes];
    renderedRoutes = getRoutes(parentsRoutesFiltered);
  } else {
    renderedRoutes = getRoutes(routes);
  }

  const configsButton = (
    <SoftBox
      display="flex"
      justifyContent="center"
      alignItems="center"
      width="3.5rem"
      height="3.5rem"
      bgColor="white"
      shadow="sm"
      borderRadius="50%"
      position="fixed"
      right="2rem"
      bottom="2rem"
      zIndex={99}
      color="dark"
      sx={{ cursor: "pointer" }}
      onClick={handleConfiguratorOpen}
    >
      <Icon fontSize="default" color="inherit">
        settings
      </Icon>
    </SoftBox>
  );

  const navRoutes =
    userRole === "Admin" || userRole === "Director" || userRole === "Dirección Logística"
      ? adminRoutes
      : userRole === "Principal de sección" || userRole === "Asistente de sección"
      ? principalRoutes
      : userRole === "Staff"
      ? staffRoutes
      : userRole === "Instructura Color Guard"
      ? colorGuardCampRoutes
      : userRole === "CEDES"
      ? cedesRoutes
      : userRole === "Instructor de instrumento"
      ? instructorsRoutes
      : userRole !== "Integrante BCDB" &&
        userRole !== "Instructor Drumline" &&
        userRole !== "Instructura Color Guard" &&
        userRole !== "Instructora Danza" &&
        userRole !== "Instructor de instrumento"
      ? parentsRoutes
      : membersRoutes;

  const filteredNavRoutes = navRoutes.filter((route) => {
    return (
      route.route !== "/autenticacion/iniciar-sesion" &&
      route.route !== "/autenticacion/registrarse-privado" &&
      route.route !== "/autenticacion/registro-privado" &&
      route.route !== "/autenticacion/recuperar/:token"
    );
  });

  const hideSidenavForLang = /^\/(es|en|fr)(\/.*)?$/.test(pathname);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {layout === "dashboard" && !hideSidenavForLang && (
        <>
          {pathname !== "/" &&
            pathname !== "/:lang" &&
            pathname !== "/autenticacion/iniciar-sesion" &&
            pathname !== "/autenticacion/registrarse-privado" &&
            pathname !== "/autenticacion/registro-privado" &&
            !pathname.startsWith("/autenticacion/recuperar/") &&
            pathname !== "/" &&
            pathname !== "/nosotros" &&
            pathname !== "/proyecto-exalumnos" &&
            pathname !== "/60-aniversario" &&
            pathname !== "/raffle" &&
            pathname !== "/gira-panama" &&
            pathname !== "/grupo-apoyo" &&
            pathname !== "/color-guard-camp" &&
            pathname !== "/contacto" &&
            pathname !== "/blog" &&
            pathname !== "/calendario" &&
            !pathname.startsWith("/blog/") && (
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
                {/* {configsButton} */}
              </>
            )}
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
        {renderedRoutes.map((route) => route)}

        <Route path="/calendario" element={<CalendarListing />} />
        <Route path="/proyecto-exalumnos" element={<Alumni />} />
        <Route path="/gira-panama" element={<Guatemala />} />
        <Route path="/:lang/patrocinadores/alimentos-jacks" element={<Jacks />} />
        <Route path="/:lang/patrocinadores/ins" element={<INS />} />

        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/new-document" element={<NewDocumentPage />} />
        <Route path="/documents/:id" element={<DocumentDetail />} />
        <Route path="/" element={<Navigate to="/documents" replace />} />

        <Route path="/60-aniversario" element={<VeladaTickets />} />
        <Route path="/grupo-apoyo" element={<Apoyo />} />

        <Route path="/color-guard-camp" element={<ColorGuardCamp />} />

        <Route path="/autenticacion/registrarse-privado" component={SignUp} />
        <Route path="/autenticacion/iniciar-sesion" component={SignIn} />
      </Routes>
    </ThemeProvider>
  );
}
