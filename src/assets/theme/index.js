// @mui material components
import { createTheme } from "@mui/material/styles";

// BCDB React base styles
import borders from "assets/theme/base/borders";
import boxShadows from "assets/theme/base/boxShadows";
import breakpoints from "assets/theme/base/breakpoints";
import colors from "assets/theme/base/colors";
import globals from "assets/theme/base/globals";
import typography from "assets/theme/base/typography";

// BCDB React helper functions
import boxShadow from "assets/theme/functions/boxShadow";
import hexToRgb from "assets/theme/functions/hexToRgb";
import linearGradient from "assets/theme/functions/linearGradient";
import pxToRem from "assets/theme/functions/pxToRem";
import rgba from "assets/theme/functions/rgba";

// BCDB React components base styles for @mui material components
import appBar from "assets/theme/components/appBar";
import avatar from "assets/theme/components/avatar";
import breadcrumbs from "assets/theme/components/breadcrumbs";
import button from "assets/theme/components/button";
import buttonBase from "assets/theme/components/buttonBase";
import card from "assets/theme/components/card";
import cardContent from "assets/theme/components/card/cardContent";
import cardMedia from "assets/theme/components/card/cardMedia";
import container from "assets/theme/components/container";
import divider from "assets/theme/components/divider";
import autocomplete from "assets/theme/components/form/autocomplete";
import checkbox from "assets/theme/components/form/checkbox";
import formControlLabel from "assets/theme/components/form/formControlLabel";
import formLabel from "assets/theme/components/form/formLabel";
import input from "assets/theme/components/form/input";
import inputBase from "assets/theme/components/form/inputBase";
import radio from "assets/theme/components/form/radio";
import iconButton from "assets/theme/components/iconButton";
import linearProgress from "assets/theme/components/linearProgress";
import link from "assets/theme/components/link";
import list from "assets/theme/components/list";
import listItem from "assets/theme/components/list/listItem";
import listItemText from "assets/theme/components/list/listItemText";
import menu from "assets/theme/components/menu";
import menuItem from "assets/theme/components/menu/menuItem";
import popover from "assets/theme/components/popover";
import sidenav from "assets/theme/components/sidenav";
import slider from "assets/theme/components/slider";
import stepper from "assets/theme/components/stepper";
import step from "assets/theme/components/stepper/step";
import stepConnector from "assets/theme/components/stepper/stepConnector";
import stepIcon from "assets/theme/components/stepper/stepIcon";
import stepLabel from "assets/theme/components/stepper/stepLabel";
import svgIcon from "assets/theme/components/svgIcon";
import tabs from "assets/theme/components/tabs";
import tab from "assets/theme/components/tabs/tab";
import tooltip from "assets/theme/components/tooltip";
import select from "./components/form/select";
import tableCell from "./components/table/tableCell";
import tableContainer from "./components/table/tableContainer";
import tableHead from "./components/table/tableHead";

export default createTheme({
  breakpoints: { ...breakpoints },
  palette: { ...colors },
  typography: { ...typography },
  boxShadows: { ...boxShadows },
  borders: { ...borders },
  functions: {
    boxShadow,
    hexToRgb,
    linearGradient,
    pxToRem,
    rgba,
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ...globals,
        ...container,
      },
    },
    MuiDrawer: { ...sidenav },
    MuiList: { ...list },
    MuiListItem: { ...listItem },
    MuiListItemText: { ...listItemText },
    MuiCard: { ...card },
    MuiCardMedia: { ...cardMedia },
    MuiCardContent: { ...cardContent },
    MuiButton: { ...button },
    MuiIconButton: { ...iconButton },
    MuiInputBase: { ...inputBase },
    MuiMenu: { ...menu },
    MuiMenuItem: { ...menuItem },
    // MuiSwitch: { ...switchButton },
    MuiDivider: { ...divider },
    MuiTableContainer: { ...tableContainer },
    MuiTableHead: { ...tableHead },
    MuiTableCell: { ...tableCell },
    MuiLinearProgress: { ...linearProgress },
    MuiBreadcrumbs: { ...breadcrumbs },
    MuiSlider: { ...slider },
    MuiAvatar: { ...avatar },
    MuiTooltip: { ...tooltip },
    MuiAppBar: { ...appBar },
    MuiTabs: { ...tabs },
    MuiTab: { ...tab },
    MuiStepper: { ...stepper },
    MuiStep: { ...step },
    MuiStepConnector: { ...stepConnector },
    MuiStepLabel: { ...stepLabel },
    MuiStepIcon: { ...stepIcon },
    MuiSelect: { ...select },
    MuiFormControlLabel: { ...formControlLabel },
    MuiFormLabel: { ...formLabel },
    MuiCheckbox: { ...checkbox },
    MuiRadio: { ...radio },
    MuiAutocomplete: { ...autocomplete },
    //  MuiInput: { ...input },
    MuiOutlinedInput: { ...input },
    MuiFilledInput: { ...input },
    MuiPopover: { ...popover },
    MuiButtonBase: { ...buttonBase },
    // MuiIcon: { ...icon },
    MuiSvgIcon: { ...svgIcon },
    MuiLink: { ...link },
  },
});
