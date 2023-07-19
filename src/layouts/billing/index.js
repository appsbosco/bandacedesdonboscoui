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

// @mui material components
// Banda CEDES Don Bosco components

// Banda CEDES Don Bosco components

// Banda CEDES Don Bosco examples
import Footer from "examples/Footer";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

// Billing page components
import EventsCalendar from "./components/Calendar";

function Billing() {
  return (
    <DashboardLayout>
      <DashboardNavbar />

      <EventsCalendar />

      <Footer />
    </DashboardLayout>
  );
}

export default Billing;
