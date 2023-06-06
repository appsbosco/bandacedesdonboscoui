App.js;
import { useEffect, useMemo, useState } from "react";

// react-router components
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

// @mui material components
import CssBaseline from "@mui/material/CssBaseline";
import Icon from "@mui/material/Icon";
import { ThemeProvider } from "@mui/material/styles";

// BCDB React components
import SoftBox from "components/SoftBox";

// BCDB React examples
import Configurator from "examples/Configurator";
import Sidenav from "examples/Sidenav";

// BCDB React themes
import theme from "assets/theme";
import themeRTL from "assets/theme/theme-rtl";

// RTL plugins
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import rtlPlugin from "stylis-plugin-rtl";

// BCDB React routes
// BCDB React contexts
import { setMiniSidenav, setOpenConfigurator, useSoftUIController } from "context";

// Images
import brand from "assets/images/Logo-Banda-Cedes-Don-Bosco.png";
import routes, {
  protectedRoutes,
  attendanceRoutes,
  adminRoutes,
  staffRoutes,
  membersRoutes,
  principalRoutes,
} from "routes";
import { gql, useQuery } from "@apollo/client";

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

  // Accessing the routes array
  // const routes = MyComponent();

  // Cache for the rtl
  useMemo(() => {
    const cacheRtl = createCache({
      key: "rtl",
      stylisPlugins: [rtlPlugin],
    });

    setRtlCache(cacheRtl);
  }, []);

  // Open sidenav when mouse enter on mini sidenav
  const handleOnMouseEnter = () => {
    if (miniSidenav && !onMouseEnter) {
      setMiniSidenav(dispatch, false);
      setOnMouseEnter(true);
    }
  };

  // Close sidenav when mouse leave mini sidenav
  const handleOnMouseLeave = () => {
    if (onMouseEnter) {
      setMiniSidenav(dispatch, true);
      setOnMouseEnter(false);
    }
  };

  // Change the openConfigurator state
  const handleConfiguratorOpen = () => setOpenConfigurator(dispatch, !openConfigurator);

  // Setting the dir attribute for the body element
  useEffect(() => {
    document.body.setAttribute("dir", direction);
  }, [direction]);

  // Setting page scroll to 0 when changing the route
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

  // Handle loading state
  if (loading) return <div></div>; // Replace with your loading component
  if (error) return <div>Error: {error.message}</div>; // Replace with your error handling component

  const userRole = userData?.getUser?.role;
  // Now, userRole is guaranteed to be defined before rendering any routes.
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

  // Filter out "sign-in" and "sign-up" routes
  const filteredNavRoutes = navRoutes.filter((route) => {
    return route.route !== "/authentication/sign-in" && route.route !== "/authentication/sign-up";
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {layout === "dashboard" && (
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
        {renderedRoutes.map((route) => route)}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </ThemeProvider>
  );
}
