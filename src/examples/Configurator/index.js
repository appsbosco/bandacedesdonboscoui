/**
=========================================================
* BCDB React - v4.0.0
=========================================================

* Product Page: 
* Copyright 2023 Banda CEDES Don Bosco()

Coded by Josué Chinchilla

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import { useEffect, useState } from "react";

// @mui material components
import Divider from "@mui/material/Divider";
import Icon from "@mui/material/Icon";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Switch from "@mui/material/Switch";

// @mui icons
import FacebookIcon from "@mui/icons-material/Facebook";

// BCDB React components
import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";

// Custom styles for the Configurator
import ConfiguratorRoot from "examples/Configurator/ConfiguratorRoot";

// BCDB React context
import { Instagram } from "@material-ui/icons";
import {
  setFixedNavbar,
  setOpenConfigurator,
  setSidenavColor,
  setTransparentSidenav,
  useSoftUIController,
} from "context";

function Configurator() {
  const [controller, dispatch] = useSoftUIController();
  const { openConfigurator, transparentSidenav, fixedNavbar, sidenavColor } = controller;
  const [disabled, setDisabled] = useState(false);
  const sidenavColors = ["primary", "dark", "info", "success", "warning", "error"];

  // Use the useEffect hook to change the button state for the sidenav type based on window size.
  useEffect(() => {
    // A function that sets the disabled state of the buttons for the sidenav type.
    function handleDisabled() {
      return window.innerWidth > 1200 ? setDisabled(false) : setDisabled(true);
    }

    // The event listener that's calling the handleDisabled function when resizing the window.
    window.addEventListener("resize", handleDisabled);

    // Call the handleDisabled function to set the state with the initial value.
    handleDisabled();

    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleDisabled);
  }, []);

  const handleCloseConfigurator = () => setOpenConfigurator(dispatch, false);
  const handleTransparentSidenav = () => setTransparentSidenav(dispatch, true);
  const handleWhiteSidenav = () => setTransparentSidenav(dispatch, false);
  const handleFixedNavbar = () => setFixedNavbar(dispatch, !fixedNavbar);

  // sidenav type buttons styles
  const sidenavTypeButtonsStyles = ({
    functions: { pxToRem },
    boxShadows: { buttonBoxShadow },
  }) => ({
    height: pxToRem(42),
    boxShadow: buttonBoxShadow.main,

    "&:hover, &:focus": {
      opacity: 1,
    },
  });

  return (
    <ConfiguratorRoot variant="permanent" ownerState={{ openConfigurator }}>
      <SoftBox
        display="flex"
        justifyContent="space-between"
        alignItems="baseline"
        pt={3}
        pb={0.8}
        px={3}
      >
        <SoftBox>
          <SoftTypography variant="h5">Configuración</SoftTypography>
          <SoftTypography variant="body2" color="text">
            Personalice la interfaz de usuario
          </SoftTypography>
        </SoftBox>

        <Icon
          sx={({ typography: { size, fontWeightBold }, palette: { dark } }) => ({
            fontSize: `${size.md} !important`,
            fontWeight: `${fontWeightBold} !important`,
            stroke: dark.main,
            strokeWidth: "2px",
            cursor: "pointer",
            mt: 2,
          })}
          onClick={handleCloseConfigurator}
        >
          close
        </Icon>
      </SoftBox>

      <Divider />

      <SoftBox pt={1.25} pb={3} px={3}>
        <SoftBox>
          <SoftTypography variant="h6">Colores</SoftTypography>

          <SoftBox mb={0.5}>
            {sidenavColors.map((color) => (
              <IconButton
                key={color}
                sx={({ borders: { borderWidth }, palette: { white, dark }, transitions }) => ({
                  width: "24px",
                  height: "24px",
                  padding: 0,
                  border: `${borderWidth[1]} solid ${white.main}`,
                  borderColor: sidenavColor === color && dark.main,
                  transition: transitions.create("border-color", {
                    easing: transitions.easing.sharp,
                    duration: transitions.duration.shorter,
                  }),
                  backgroundImage: ({ functions: { linearGradient }, palette: { gradients } }) =>
                    linearGradient(gradients[color].main, gradients[color].state),

                  "&:not(:last-child)": {
                    mr: 1,
                  },

                  "&:hover, &:focus, &:active": {
                    borderColor: dark.main,
                  },
                })}
                onClick={() => setSidenavColor(dispatch, color)}
              />
            ))}
          </SoftBox>
        </SoftBox>

        <SoftBox mt={3} lineHeight={1}>
          <SoftTypography variant="h6">Tipo</SoftTypography>
          <SoftTypography variant="button" color="text" fontWeight="regular">
            Elige entre 2 diferentes tipos de barra{" "}
          </SoftTypography>

          <SoftBox
            sx={{
              display: "flex",
              mt: 2,
            }}
          >
            <SoftButton
              color="info"
              variant={transparentSidenav ? "gradient" : "outlined"}
              onClick={handleTransparentSidenav}
              disabled={disabled}
              fullWidth
              sx={{
                mr: 1,
                ...sidenavTypeButtonsStyles,
              }}
            >
              Transparente
            </SoftButton>
            <SoftButton
              color="info"
              variant={transparentSidenav ? "outlined" : "gradient"}
              onClick={handleWhiteSidenav}
              disabled={disabled}
              fullWidth
              sx={sidenavTypeButtonsStyles}
            >
              Blanco
            </SoftButton>
          </SoftBox>
        </SoftBox>
        <SoftBox mt={3} mb={2} lineHeight={1}>
          <SoftTypography variant="h6">Barra de navegación fijada</SoftTypography>

          <Switch checked={fixedNavbar} onChange={handleFixedNavbar} />
        </SoftBox>

        <Divider />

        <SoftBox mt={3} mb={2}>
          <SoftBox mb={2}>
            <SoftButton
              component={Link}
              href=""
              target="_blank"
              rel="noreferrer"
              color="dark"
              variant="gradient"
              fullWidth
            >
              Ayuda
            </SoftButton>
          </SoftBox>
          <SoftButton
            component={Link}
            href=""
            target="_blank"
            rel="noreferrer"
            color="dark"
            variant="outlined"
            fullWidth
          >
            Acerca de nosotros
          </SoftButton>
        </SoftBox>

        <SoftBox mt={3} textAlign="center">
          <SoftBox mb={0.5}>
            <SoftTypography variant="h6">Gracias por apoyarnos!</SoftTypography>
          </SoftBox>

          <SoftBox display="flex" justifyContent="center">
            <SoftBox mr={1.5}>
              <SoftButton
                component={Link}
                href="https://www.instagram.com/bandacedesdonbosco"
                target="_blank"
                rel="noreferrer"
                color="dark"
              >
                <Instagram />
                &nbsp; Instagram
              </SoftButton>
            </SoftBox>
            <SoftButton
              component={Link}
              href="https://www.facebook.com/bcdbcr"
              target="_blank"
              rel="noreferrer"
              color="dark"
            >
              <FacebookIcon />
              &nbsp; Facebook
            </SoftButton>
          </SoftBox>
        </SoftBox>
      </SoftBox>
    </ConfiguratorRoot>
  );
}

export default Configurator;
