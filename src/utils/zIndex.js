/**
 * Global z-index hierarchy for the BCDB app.
 *
 * MUI components (Sidenav, AppBar, Configurator) use integer CSS z-index values
 * configured via `createTheme({ zIndex: { ... } })` in src/assets/theme/index.js.
 * Tailwind custom modals use z-[N] arbitrary values that must exceed MUI values.
 *
 *  Layer              | Value  | Who uses it
 *  ------------------|--------|--------------------------------------
 *  Sidenav drawer    |  1000  | SidenavRoot (MUI Drawer paper)
 *  AppBar            |  1100  | DashboardNavbar (MUI AppBar, theme)
 *  Configurator      |  1150  | ConfiguratorRoot (explicit override)
 *  FAB / bottom bars |  1200  | Cart, action bars (Tailwind z-[1200])
 *  Backdrop          |  1290  | Modal backdrops (Tailwind z-[1290])
 *  Modal             |  1300  | All dialogs/drawers (Tailwind z-[1300])
 *  Nested modal      |  1305  | Confirm dialogs inside drawers
 *  Side drawer panel |  1295  | Sliding panel above its own backdrop
 *  Zoom overlay      |  1310  | Full-screen image zoom
 *  Toast             |  1350  | Notifications (above modals)
 *  MUI Snackbar      |  1400  | theme.zIndex.snackbar
 *  MUI Tooltip       |  1500  | theme.zIndex.tooltip
 */

export const Z = {
  sidenav:     1000,
  appBar:      1100,
  configurator: 1150,
  fab:         1200,
  backdrop:    1290,
  drawerPanel: 1295,
  modal:       1300,
  nestedModal: 1305,
  zoom:        1310,
  toast:       1350,
  snackbar:    1400,
  tooltip:     1500,
};
