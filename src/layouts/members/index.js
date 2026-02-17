import SoftBox from "components/SoftBox";
import Footer from "examples/Footer";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { useMemo, useState } from "react";
import "./reset.css";
import { useUsersTables } from "../../hooks/useUsersTables";
import MusiciansTable from "./sections/MusiciansTable";
import StaffTable from "./sections/StaffTable";
import ParentsTable from "./sections/ParentsTable";
import InstructorsTable from "./sections/InstructorsTable";
import UserDetailsModal from "../../components/layouts/members/UserDetailsModal";

const Tables = () => {
  const {
    userRole,
    usersLoading,
    usersError,
    usersState,
    musiciansData,
    staffData,
    instructorsData,
    parentsData,
    getMedicalRecordForUserId,
    handleStateChange,
    deleteUserAndMedicalRecord,
  } = useUsersTables();

  const [selectedUser, setSelectedUser] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  const handleRowClick = (params) => {
    setSelectedUser(params.row);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedUser(null);
  };

  const userMedicalRecord = useMemo(() => {
    return selectedUser?.id ? getMedicalRecordForUserId(selectedUser.id) : null;
  }, [selectedUser, getMedicalRecordForUserId]);

  const canDeleteUser = useMemo(() => {
    if (!selectedUser?.id) return false;
    return (usersState || []).some((u) => u.id === selectedUser.id);
  }, [selectedUser, usersState]);

  const onConfirmDelete = async ({ userId, medicalRecordId }) => {
    try {
      return await deleteUserAndMedicalRecord({ userId, medicalRecordId });
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      return false;
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        {usersLoading ? null : null}
        {usersError ? null : null}

        <MusiciansTable
          data={musiciansData || []}
          onRowClick={handleRowClick}
          userRole={userRole}
          onStateChange={handleStateChange}
        />
        <StaffTable data={staffData || []} onRowClick={handleRowClick} />
        <ParentsTable data={parentsData || []} onRowClick={handleRowClick} />
        <InstructorsTable data={instructorsData || []} onRowClick={handleRowClick} />
      </SoftBox>

      <Footer />

      <UserDetailsModal
        open={openModal && !!selectedUser}
        user={selectedUser}
        userRole={userRole}
        medicalRecord={userMedicalRecord}
        canDeleteUser={canDeleteUser}
        onClose={handleCloseModal}
        onConfirmDelete={onConfirmDelete}
      />
    </DashboardLayout>
  );
};

export default Tables;
