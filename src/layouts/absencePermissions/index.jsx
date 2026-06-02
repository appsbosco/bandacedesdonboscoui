import React from "react";
import { useQuery } from "@apollo/client";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import SoftBox from "components/SoftBox";
import { GET_USERS_BY_ID } from "graphql/queries";
import { ParentPermissionsView } from "./ParentPermissionsView";
import { MemberPermissionsView } from "./MemberPermissionsView";
import { AdminPermissionsView } from "./AdminPermissionsView";
import { SectionPermissionsView } from "./SectionPermissionsView";
import { SectionExalumnoPermissionsView } from "./SectionExalumnoPermissionsView";

const ADMIN_ROLES = new Set(["Admin", "Director", "Dirección Logística"]);
const SECTION_ROLES = new Set(["Principal de sección", "Asistente de sección"]);

function resolveView(user) {
  const role = user?.role ?? null;
  if (!role) return "parent";
  if (ADMIN_ROLES.has(role)) return "admin";
  if (user?.state === "Exalumno" && SECTION_ROLES.has(role)) return "sectionExalumno";
  if (SECTION_ROLES.has(role)) return "section";
  // Members (Integrante BCDB, etc.) who are Exalumnos can self-request
  return "member";
}

function AbsencePermissionsPage() {
  const { data, loading } = useQuery(GET_USERS_BY_ID);
  const currentUser = data?.getUser ?? null;

  const view = resolveView(currentUser);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        {loading ? (
          <div className="flex justify-center items-center min-h-64">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {view === "parent" && <ParentPermissionsView />}
            {view === "member" && <MemberPermissionsView />}
            {view === "admin" && <AdminPermissionsView />}
            {view === "section" && <SectionPermissionsView />}
            {view === "sectionExalumno" && <SectionExalumnoPermissionsView />}
          </>
        )}
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default AbsencePermissionsPage;
