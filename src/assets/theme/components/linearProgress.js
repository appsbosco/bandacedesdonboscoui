/**
=========================================================
* BCDB React - v3.1.0
=========================================================

* Product Page: 
* Copyright 2023 Banda CEDES Don Bosco()

Coded by Josué Chinchilla

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

// BCDB React base styles
import borders from "assets/theme/base/borders";
import colors from "assets/theme/base/colors";

// BCDB React helper functions
import pxToRem from "assets/theme/functions/pxToRem";

const { borderRadius } = borders;
const { light } = colors;

const linearProgress = {
  styleOverrides: {
    root: {
      height: pxToRem(3),
      borderRadius: borderRadius.md,
      overflow: "visible",
      position: "relative",
    },

    colorPrimary: {
      backgroundColor: light.main,
    },

    colorSecondary: {
      backgroundColor: light.main,
    },

    bar: {
      height: pxToRem(6),
      borderRadius: borderRadius.sm,
      position: "absolute",
      transform: `translate(0, ${pxToRem(-1.5)}) !important`,
      transition: "width 0.6s ease !important",
    },
  },
};

export default linearProgress;
