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

// @mui material components
import Icon from "@mui/material/Icon";
import { styled } from "@mui/material/styles";

export default styled(Icon)(({ theme, ownerState }) => {
  const { typography } = theme;
  const { size } = ownerState;

  const { fontWeightBold, size: fontSize } = typography;

  return {
    fontWeight: fontWeightBold,
    fontSize: size === "small" && `${fontSize.md} !important`,
  };
});
