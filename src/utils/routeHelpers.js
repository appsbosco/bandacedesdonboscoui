import jwtDecode from "jwt-decode";
import { Route } from "react-router-dom";

// Importaciones de routes — estas sí deben ser estáticas
// porque el router necesita saber las rutas en el primer render
import routes, {
  attendanceRoutes,
  adminRoutes,
  staffRoutes,
  membersRoutes,
  parentsRoutes,
  sectionRoutes as declaredSectionRoutes,
  cedesRoutes,
  cedesFinancialRoutes,
  colorGuardCampRoutes,
  instructorsRoutes,
  ticketBoothRoutes,
  ticketManagerRoutes,
} from "routes";

/* =========================
   Constants
========================= */

export const ADMIN_ROLES = new Set(["Admin", "Director", "Dirección Logística"]);
export const TICKET_ROLES = new Set(["Taquilla"]);
export const TICKET_MANAGER_ROLES = new Set(["Tickets Admin"]);
export const SECTION_ROLES = new Set(["Principal de sección", "Asistente de sección"]);
export const ATTENDANCE_ROLES = new Set([
  "Principal de sección",
  "Asistente de sección",
  "Líder de sección",
]);

const MEMBERS_EXCLUDED_FOR_PARENTS_ROUTES = new Set([
  "Integrante BCDB",
  "Instructor Drumline",
  "Instructura Color Guard",
  "Instructora Danza",
]);

const MEMBERS_EXCLUDED_FOR_PARENTS_NAV = new Set([
  "Integrante BCDB",
  "Instructor Drumline",
  "Instructura Color Guard",
  "Instructora Danza",
  "Instructor de instrumento",
]);

export const AUTH_ROUTE_BLACKLIST = new Set([
  "/autenticacion/iniciar-sesion",
  "/autenticacion/registrarse-privado",
  "/autenticacion/registro-privado",
  "/autenticacion/recuperar/:token",
]);

export const HIDE_SIDENAV_FOR_LANG_RE = /^\/(es|en|fr)(\/.*)?$/;
export const LANDING_LANG_RE = /^\/(es|en)(\/.*)?$/;

export const PROTECTED_PREFIXES = [
  "/dashboard",
  "/lista-entradas",
  "/asignar-entradas",
  "/qr-scanner",
  "/members",
  "/inventory",
  "/performance-attendance",
  "/attendance",
  "/attendance-history",
  "/events",
  "/almuer",
  "/Profile",
  "/finance",
  "/documents",
  "/new-document",
  "/tours",
  "/booking-requests",
  "/academic",
];

const NO_SIDENAV_EXACT_PATHS = new Set([
  "/",
  "/:lang",
  "/autenticacion/iniciar-sesion",
  "/autenticacion/registrarse-privado",
  "/autenticacion/registro-privado",
  "/nosotros",
  "/proyecto-exalumnos",
  "/60-aniversario",
  "/raffle",
  "/gira-panama",
  "/grupo-apoyo",
  "/color-guard-camp",
  "/contacto",
  "/blog",
  "/calendario",
]);

const NO_SIDENAV_PREFIXES = ["/autenticacion/recuperar/", "/blog/"];

/* =========================
   Helpers
========================= */

export function isTokenExpired(token) {
  try {
    const decoded = jwtDecode(token);
    return decoded?.exp < Date.now() / 1000;
  } catch {
    return true;
  }
}

export function shouldShowSidenavForPath(pathname) {
  if (NO_SIDENAV_EXACT_PATHS.has(pathname)) return false;
  if (NO_SIDENAV_PREFIXES.some((p) => pathname.startsWith(p))) return false;
  return true;
}

export function findRouteByKey(routeDefs, key) {
  return routeDefs.find((r) => r?.key === key);
}

export function buildRouteElements(routeDefs) {
  const out = [];
  const walk = (items) => {
    items.forEach((r) => {
      if (!r) return;
      if (r.collapse) walk(r.collapse);
      if (r.route) {
        out.push(<Route path={r.route} element={r.component} key={r.key ?? r.route} />);
      }
    });
  };
  walk(routeDefs);
  return out;
}

/* =========================
   Derived route sets
   Definidos fuera de los componentes — se calculan UNA vez al cargar el módulo,
   no en cada render ni en cada llamada a resolve*
========================= */

export const sectionRoutes = [
  findRouteByKey(membersRoutes, "dashboard"),
  findRouteByKey(membersRoutes, "events"),
  findRouteByKey(membersRoutes, "documents-pages"),
  findRouteByKey(membersRoutes, "documents"),
  findRouteByKey(membersRoutes, "new-document"),
  { type: "title", title: "Giras", key: "section-tours-pages" },
  findRouteByKey(membersRoutes, "tours"),
  findRouteByKey(membersRoutes, "tour-detail"),
  { type: "title", title: "Asistencia", key: "section-attendance-pages" },
  ...attendanceRoutes,
  { type: "title", title: "Entradas", key: "section-ticket-pages" },
  findRouteByKey(membersRoutes, "mis-entradas"),
  { type: "title", title: "Formaciones", key: "section-formations-pages" },
  findRouteByKey(adminRoutes, "formations"),
  findRouteByKey(adminRoutes, "formation-detail"),
  findRouteByKey(membersRoutes, "almuerzos-pages"),
  findRouteByKey(membersRoutes, "almuerzos"),
  { type: "title", title: "Académico", key: "section-self-academic-pages" },
  findRouteByKey(membersRoutes, "academic-student"),
  findRouteByKey(membersRoutes, "account-pages"),
  findRouteByKey(membersRoutes, "Profile"),
].filter(Boolean);

export const sectionExalumnoRoutes = [
  ...sectionRoutes,
  { type: "title", title: "Seguimiento académico", key: "section-academic-pages" },
  findRouteByKey(declaredSectionRoutes, "academic-section"),
].filter(Boolean);

export const attendanceNavRoutes = [
  findRouteByKey(membersRoutes, "dashboard"),
  findRouteByKey(membersRoutes, "events"),
  findRouteByKey(membersRoutes, "documents-pages"),
  findRouteByKey(membersRoutes, "documents"),
  findRouteByKey(membersRoutes, "new-document"),
  { type: "title", title: "Asistencia", key: "attendance-only-pages" },
  ...attendanceRoutes,
  findRouteByKey(membersRoutes, "almuerzos-pages"),
  findRouteByKey(membersRoutes, "almuerzos"),
  findRouteByKey(membersRoutes, "account-pages"),
  findRouteByKey(membersRoutes, "Profile"),
].filter(Boolean);

// Pre-built route arrays — evaluated once at module load time
// resolveRenderedRouteDefs / resolveNavRouteDefs solo hacen un lookup en este mapa
const RENDERED_ROUTE_MAP = {
  admin: [...routes, ...adminRoutes],
  section: [...routes, ...sectionRoutes],
  sectionExalumno: [...routes, ...sectionExalumnoRoutes],
  attendance: [...routes, ...attendanceNavRoutes],
  colorGuard: [...routes, ...colorGuardCampRoutes],
  staff: [...routes, ...staffRoutes],
  cedes: [...routes, ...cedesRoutes],
  cedesFinancial: [...routes, ...cedesFinancialRoutes],
  instructor: [...routes, ...instructorsRoutes],
  ticketManager: [...routes, ...ticketManagerRoutes],
  ticketBooth: [...routes, ...ticketBoothRoutes],
  members: [...routes, ...membersRoutes],
  parents: [...routes, ...parentsRoutes],
};

const NAV_ROUTE_MAP = {
  admin: adminRoutes,
  section: sectionRoutes,
  sectionExalumno: sectionExalumnoRoutes,
  attendance: attendanceNavRoutes,
  staff: staffRoutes,
  colorGuard: colorGuardCampRoutes,
  cedes: cedesRoutes,
  cedesFinancial: cedesFinancialRoutes,
  instructor: instructorsRoutes,
  ticketManager: ticketManagerRoutes,
  ticketBooth: ticketBoothRoutes,
  members: membersRoutes,
  parents: parentsRoutes,
};

function resolveRoleKey(userOrRole) {
  const user =
    typeof userOrRole === "object" && userOrRole !== null
      ? userOrRole
      : { role: userOrRole, state: null };
  const userRole = user?.role ?? null;

  if (!userRole) return "parents";
  if (ADMIN_ROLES.has(userRole)) return "admin";
  if (userRole === "Principal de sección" && user?.state === "Exalumno") return "sectionExalumno";
  if (SECTION_ROLES.has(userRole)) return "section";
  if (ATTENDANCE_ROLES.has(userRole)) return "attendance";
  if (TICKET_MANAGER_ROLES.has(userRole)) return "ticketManager";
  if (TICKET_ROLES.has(userRole)) return "ticketBooth";
  if (userRole === "Instructura Color Guard") return "colorGuard";
  if (userRole === "Staff") return "staff";
  if (userRole === "CEDES") return "cedes";
  if (userRole === "CEDES Financiero") return "cedesFinancial";
  if (userRole === "Instructor de instrumento") return "instructor";
  if (MEMBERS_EXCLUDED_FOR_PARENTS_ROUTES.has(userRole)) return "members";
  return "parents";
}

export function resolveRenderedRouteDefs(user) {
  return RENDERED_ROUTE_MAP[resolveRoleKey(user)];
}

export function resolveNavRouteDefs(user) {
  return NAV_ROUTE_MAP[resolveRoleKey(user)];
}
