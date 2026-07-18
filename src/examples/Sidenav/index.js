/**
=========================================================
* Banda CEDES Don Bosco - v4.0.0
=========================================================

* Product Page: 
* Copyright 2023 Banda CEDES Don Bosco()

Coded by Josué Chinchilla

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import { useCallback, useEffect, useMemo, useRef } from "react";

// react-router-dom components
import { NavLink, useLocation } from "react-router-dom";

// prop-types is a library for typechecking of props.
import PropTypes from "prop-types";

// @mui material components
import Divider from "@mui/material/Divider";
import Icon from "@mui/material/Icon";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import List from "@mui/material/List";
import Tooltip from "@mui/material/Tooltip";
import useMediaQuery from "@mui/material/useMediaQuery";

// Banda CEDES Don Bosco components
import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";

// Banda CEDES Don Bosco examples
import SidenavCard from "examples/Sidenav/SidenavCard";
import SidenavCollapse from "examples/Sidenav/SidenavCollapse";

// Custom styles for the Sidenav
import SidenavRoot from "examples/Sidenav/SidenavRoot";

// Banda CEDES Don Bosco context
import { setMiniSidenav, useSoftUIController } from "context";

const SIDENAV_PREFERENCE_KEY = "bcdb-sidenav-collapsed";

function Sidenav({ color = "info", brand = "", brandName, routes, ...rest }) {
  const [controller, dispatch] = useSoftUIController();
  const { miniSidenav, transparentSidenav } = controller;
  const location = useLocation();
  const { pathname } = location;
  const collapseName = pathname.split("/").slice(1)[0];
  const isDesktop = useMediaQuery((theme) => theme.breakpoints.up("xl"));
  const sidenavRef = useRef(null);

  const closeSidenav = useCallback(() => setMiniSidenav(dispatch, true), [dispatch]);

  const toggleDesktopSidenav = useCallback(() => {
    const nextMiniSidenav = !miniSidenav;

    setMiniSidenav(dispatch, nextMiniSidenav);
    localStorage.setItem(SIDENAV_PREFERENCE_KEY, String(nextMiniSidenav));
  }, [dispatch, miniSidenav]);

  useEffect(() => {
    if (!isDesktop) {
      setMiniSidenav(dispatch, true);
      return;
    }

    const savedPreference = localStorage.getItem(SIDENAV_PREFERENCE_KEY);
    setMiniSidenav(dispatch, savedPreference === "true");
  }, [dispatch, isDesktop]);

  useEffect(() => {
    if (isDesktop || miniSidenav) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (sidenavRef.current?.contains(event.target)) {
        return;
      }

      closeSidenav();
    }

    document.addEventListener("pointerdown", handlePointerDown, true);

    return () => document.removeEventListener("pointerdown", handlePointerDown, true);
  }, [closeSidenav, isDesktop, miniSidenav]);

  // Render all the routes from the routes.js (All the visible items on the Sidenav)
  const renderRoutes = useMemo(
    () =>
      routes.map(({ type, name, icon, title, noCollapse, key, route, href }) => {
        let returnValue;

        if (type === "collapse") {
          returnValue = href ? (
            <Link
              href={href}
              key={key}
              target="_blank"
              rel="noreferrer"
              sx={{ textDecoration: "none" }}
            >
              <SidenavCollapse
                color={color}
                name={name}
                icon={icon}
                active={key === collapseName}
                noCollapse={noCollapse}
              />
            </Link>
          ) : (
            <NavLink to={route} key={key}>
              <SidenavCollapse
                color={color}
                key={key}
                name={name}
                icon={icon}
                active={key === collapseName}
                noCollapse={noCollapse}
              />
            </NavLink>
          );
        } else if (type === "title") {
          const titleWords = title.split(/\s+/);
          const compactTitle = (
            titleWords.length === 1
              ? title.slice(0, 3)
              : titleWords.map((word) => word[0]).join("")
          )
            .slice(0, 3)
            .toUpperCase();

          returnValue = (
            <Tooltip key={key} title={title} placement="right" arrow disableHoverListener={!miniSidenav}>
              <SoftTypography
                display="block"
                variant="caption"
                fontWeight="bold"
                textTransform="uppercase"
                opacity={0.6}
                pl={3}
                mt={2}
                mb={1}
                ml={1}
                sx={({ breakpoints, palette, functions: { pxToRem } }) => ({
                  [breakpoints.up("xl")]: miniSidenav
                    ? {
                        width: pxToRem(48),
                        marginLeft: "auto",
                        marginRight: "auto",
                        padding: `${pxToRem(4)} 0`,
                        textAlign: "center",
                        letterSpacing: pxToRem(0.8),
                        color: palette.text.main,
                        borderTop: `1px solid ${palette.grey[300]}`,
                      }
                    : {},
                })}
              >
                {miniSidenav && isDesktop ? compactTitle : title}
              </SoftTypography>
            </Tooltip>
          );
        } else if (type === "divider") {
          returnValue = <Divider key={key} />;
        }

        return returnValue;
      }),
    [collapseName, color, isDesktop, miniSidenav, routes]
  );

  const signOut = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  }, []);

  return (
    <SidenavRoot
      {...rest}
      ref={sidenavRef}
      variant="permanent"
      ownerState={{ transparentSidenav, miniSidenav, isDesktop }}
    >
      <SoftBox
        pt={3}
        pb={1}
        px={miniSidenav && isDesktop ? 1.5 : 4}
        minHeight="5rem"
        display="flex"
        alignItems="center"
        justifyContent={miniSidenav && isDesktop ? "center" : "space-between"}
        textAlign="center"
      >
        <SoftBox
          display={{ xs: "block", xl: "none" }}
          position="absolute"
          top={0}
          right={0}
          p={1.625}
          onClick={closeSidenav}
          sx={{ cursor: "pointer" }}
        >
          <SoftTypography variant="h6" color="secondary">
            <Icon sx={{ fontWeight: "bold" }}>close</Icon>
          </SoftTypography>
        </SoftBox>
        <SoftBox
          component={NavLink}
          to="/"
          display={miniSidenav && isDesktop ? "none" : "flex"}
          alignItems="center"
          minWidth={0}
        >
          {brand && (
            <SoftBox
              component="img"
              src={brand}
              alt="Logo Banda CEDES Don Bosco"
              width="100%"
              alignItems=""
            />
          )}
        </SoftBox>
        <Tooltip title={miniSidenav ? "Expandir menú" : "Colapsar menú"} placement="right">
          <IconButton
            aria-label={miniSidenav ? "Expandir menú lateral" : "Colapsar menú lateral"}
            onClick={toggleDesktopSidenav}
            sx={({ breakpoints, palette }) => ({
              display: "none",
              color: palette.text.main,
              [breakpoints.up("xl")]: { display: "inline-flex" },
            })}
          >
            <Icon>{miniSidenav ? "keyboard_double_arrow_right" : "keyboard_double_arrow_left"}</Icon>
          </IconButton>
        </Tooltip>
      </SoftBox>
      <Divider />
      <List>{renderRoutes}</List>
      <SoftBox
        pt={2}
        my={2}
        mx={2}
        mt="auto"
        sx={({ breakpoints }) => ({
          [breakpoints.up("xl")]: { display: miniSidenav ? "none" : "block" },
        })}
      >
        <SoftBox mb={2}>
          <SoftButton
            component="a"
            href="/autenticacion/iniciar-sesion"
            target=""
            rel="noreferrer"
            variant="gradient"
            color={color}
            fullWidth
            onClick={signOut}
          >
            Cerrar sesión
          </SoftButton>
        </SoftBox>
        <SidenavCard />
      </SoftBox>
    </SidenavRoot>
  );
}

// Typechecking props for the Sidenav
Sidenav.propTypes = {
  color: PropTypes.oneOf(["primary", "secondary", "info", "success", "warning", "error", "dark"]),
  brand: PropTypes.string,
  brandName: PropTypes.string.isRequired,
  routes: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default Sidenav;
