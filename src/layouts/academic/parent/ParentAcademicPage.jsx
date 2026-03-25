import React from "react";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import SoftBox from "components/SoftBox";
import { ParentAcademicSection } from "./ParentAcademicSection";

function ParentAcademicPage() {
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <ParentAcademicSection />
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default ParentAcademicPage;
