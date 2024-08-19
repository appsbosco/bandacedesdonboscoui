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
import themeRTL from "assets/theme/theme-rtl";
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

  const { data: userData, loading, error } = useQuery(GET_USERS_BY_ID);

  // Mantener un estado de "loading" hasta que los datos estén listos y no haya errores
  if (loading || !userData) {
    return <div>Loading...</div>; // Mostrar un indicador de carga hasta que los datos estén listos
  }

  // Manejo del error de manera más controlada, sin renderizar hasta que todo esté cargado correctamente
  if (error || !userData.getUser) {
    return <div>Error: Unable to load user data. Please try again later.</div>; // Mostrar un mensaje de error específico
  }

  // Solo proceder si userData y getUser están definidos
  if (!userData || !userData.getUser) {
    return (
      <div>
        {/* Aquí puedes manejar la situación donde los datos del usuario no estén disponibles */}
        Error: User data is not available.
      </div>
    );
  }

  const userRole = userData.getUser.role;

  // Proceder con la lógica solo cuando userRole está disponible
  if (!userRole) {
    return (
      <div>
        {/* Puedes manejar este error de forma específica */}
        Error: User role is undefined.
      </div>
    );
  }

  // Check if user is authenticated
  const token = localStorage.getItem("token");
  const isAuthenticated = token && !isTokenExpired(token);

  // Redirect to login if not authenticated and trying to access /dashboard
  const shouldRedirectToLogin =
    !isAuthenticated &&
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
    return <Navigate to="/autenticacion/iniciar-sesion" />;
  }

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
  } else if (userRole === "CEDES" || userRole === "Instructor de instrumento") {
    const cedesRoutesFiltered = [...routes, ...cedesRoutes];
    renderedRoutes = getRoutes(cedesRoutesFiltered);
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
      : userRole === "CEDES" || userRole === "Instructor de instrumento"
      ? cedesRoutes
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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {layout === "dashboard" && (
        <>
          {pathname !== "/" &&
            pathname !== "/autenticacion/iniciar-sesion" &&
            pathname !== "/autenticacion/registrarse-privado" &&
            pathname !== "/autenticacion/registro-privado" &&
            !pathname.startsWith("/autenticacion/recuperar/") &&
            pathname !== "/" &&
            pathname !== "/nosotros" &&
            pathname !== "/proyecto-exalumnos" &&
            pathname !== "/velada-de-las-madres" &&
            pathname !== "/raffle" &&
            pathname !== "/gira-guatemala" &&
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
                {configsButton}
              </>
            )}
        </>
      )}

      <Routes>
        <Route path="/" element={<Landing />} />
        {renderedRoutes.map((route) => route)}
        <Route path="/blog" element={<BlogListing />} />
        <Route path="/calendario" element={<CalendarListing />} />
        <Route path="/proyecto-exalumnos" element={<Alumni />} />
        <Route path="/gira-guatemala" element={<Guatemala />} />
        <Route path="/velada-de-las-madres" element={<VeladaTickets />} />
        <Route path="/grupo-apoyo" element={<Apoyo />} />

        <Route path="/color-guard-camp" element={<ColorGuardCamp />} />
        <Route path="/blog/:id" element={<ArticlePage />} />
        <Route path="/autenticacion/registrarse-privado" component={SignUp} />
        <Route path="/autenticacion/iniciar-sesion" component={SignIn} />
      </Routes>
    </ThemeProvider>
  );
}
