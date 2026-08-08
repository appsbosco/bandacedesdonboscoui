import Footer from "examples/Footer";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import AttendanceTable from "./AttendanceTable";

const Attendance = () => (
  <DashboardLayout>
    <DashboardNavbar />
    <main className="mx-auto w-full max-w-[1440px] pb-8 pt-3 sm:px-4 sm:pt-6">
      <AttendanceTable />
    </main>
    <div className="mt-10 pb-4">
      <Footer links={[]} />
    </div>
  </DashboardLayout>
);

export default Attendance;
