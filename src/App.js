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
import brand from "assets/images/Logo-Banda-Cedes-Don-Bosco.png";
import Landing from "layouts/landing/Landing";

const GET_USERS_BY_ID = gql`
  query getUser {
    getUser {
      id
      name
      firstSurName
      secondSurName
      email
      birthday
      carnet
      state
      grade
      phone
      role
      instrument
    }
  }
`;

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

  if (loading) return <div></div>;
  if (error) return <div>Error: {error.message}</div>;

  const userRole = userData?.getUser?.role;

  // Check if user is authenticated
  const isAuthenticated = localStorage.getItem("token"); // Modify this based on your token storage mechanism

  // Redirect to login if not authenticated and trying to access /dashboard
  const shouldRedirectToLogin =
    !isAuthenticated &&
    (pathname.startsWith("/dashboard") ||
      pathname.startsWith("/members") ||
      pathname.startsWith("/inventory") ||
      pathname.startsWith("/attendance") ||
      pathname.startsWith("/attendance-history") ||
      pathname.startsWith("/events") ||
      pathname.startsWith("/Profile"));

  if (shouldRedirectToLogin) {
    return <Navigate to="/authentication/sign-in" />;
  }

  let renderedRoutes = null;

  if (userRole === "Admin" || userRole === "Director" || userRole === "Dirección Logística") {
    const adminRoutes = [...routes, ...protectedRoutes];
    renderedRoutes = getRoutes(adminRoutes);
  } else if (userRole === "Principal de sección" || userRole === "Asistente de sección") {
    const attendanceRoutesFiltered = [...routes, ...attendanceRoutes];
    renderedRoutes = getRoutes(attendanceRoutesFiltered);
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
      : membersRoutes;

  const filteredNavRoutes = navRoutes.filter((route) => {
    return route.route !== "/authentication/sign-in" && route.route !== "/authentication/sign-up";
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {layout === "dashboard" &&
        pathname !== "/" &&
        pathname !== "/authentication/sign-in" &&
        pathname !== "/authentication/sign-up" &&
        pathname !== "/" &&
        pathname !== "/nosotros" &&
        pathname !== "/contacto" && (
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
      <Routes>
        <Route path="/" element={<Landing />} />
        {renderedRoutes.map((route) => route)}
        <Route path="/authentication/sign-up" component={SignUp} />
        <Route path="/authentication/sign-in" component={SignIn} />
      </Routes>
    </ThemeProvider>
  );
}
