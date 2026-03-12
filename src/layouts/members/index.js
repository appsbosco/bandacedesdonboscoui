/* eslint-disable react/prop-types */
import { useState, useMemo, useCallback } from "react";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import PremiumUsersTable from "../../components/members/PremiumUsersTable";
import PremiumParentsTable from "../../components/members/PremiumParentsTable";
import UserDetailsModal from "../../components/layouts/members/UserDetailsModal";
import { useMembersUtils } from "../../hooks/useMembersUtils";
import { useUsersPaginated } from "../../hooks/useUsersPaginated";
import { useParentsPaginated } from "../../hooks/useParentsPaginated";
import "./reset.css";

// ── Role sets ────────────────────────────────────────────────────────────────
const MUSICIAN_ROLES = ["Principal de sección", "Integrante BCDB", "Asistente de sección", "Admin"];

const STAFF_ROLES = [
  "Director",
  "Dirección Logística",
  "CEDES",
  "Logística",
  "Instructura Color Guard",
  "Instructor Drumline",
  "Staff",
];

const INSTRUCTOR_ROLES = ["Instructor de instrumento"];

// ── Tab definitions ──────────────────────────────────────────────────────────
const TABS = [
  { key: "musicians", label: "Integrantes" },
  { key: "staff", label: "Staff" },
  { key: "instructors", label: "Instructores" },
  { key: "parents", label: "Padres" },
];

// ── Tab bar ──────────────────────────────────────────────────────────────────
function TabBar({ activeIndex, onChange }) {
  return (
    <div className="flex border-b border-gray-200 mb-5">
      {TABS.map((tab, i) => (
        <button
          key={tab.key}
          onClick={() => onChange(i)}
          className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px ${
            i === activeIndex
              ? "border-gray-900 text-gray-900"
              : "border-transparent text-gray-400 hover:text-gray-700"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ── Standard paginated tab (Musicians / Staff / Instructors) ─────────────────
function PaginatedTab({ roles, onRowClick }) {
  const hook = useUsersPaginated({ roles });
  const showInstrument = roles.some(
    (r) => MUSICIAN_ROLES.includes(r) || INSTRUCTOR_ROLES.includes(r)
  );
  return (
    <PremiumUsersTable
      title=""
      items={hook.items}
      total={hook.total}
      loading={hook.loading}
      filter={hook.filter}
      facets={hook.facets}
      pagination={hook.pagination}
      setPagination={hook.setPagination}
      setSearchText={hook.setSearchText}
      setFilterField={hook.setFilterField}
      clearFilters={hook.clearFilters}
      onRowClick={onRowClick}
      showInstrument={showInstrument}
    />
  );
}

// ── Parents tab — server-side search by parent OR child ──────────────────────
function ParentsTab({ onRowClick }) {
  const hook = useParentsPaginated();
  return (
    <PremiumParentsTable
      items={hook.items}
      total={hook.total}
      loading={hook.loading}
      filter={hook.filter}
      pagination={hook.pagination}
      setPagination={hook.setPagination}
      setSearchText={hook.setSearchText}
      clearFilters={hook.clearFilters}
      onRowClick={onRowClick}
    />
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
const MembersPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);

  const { userRole, getMedicalRecordForUserId, deleteUserAndMedicalRecord } = useMembersUtils();

  const handleRowClick = useCallback((user) => setSelectedUser(user), []);
  const handleCloseModal = useCallback(() => setSelectedUser(null), []);

  const medicalRecord = useMemo(
    () => (selectedUser ? getMedicalRecordForUserId(selectedUser.id) : null),
    [selectedUser, getMedicalRecordForUserId]
  );

  const canDeleteUser = useMemo(() => userRole === "Admin" || userRole === "Director", [userRole]);

  const onConfirmDelete = useCallback(
    async ({ userId, medicalRecordId }) => {
      try {
        return await deleteUserAndMedicalRecord({ userId, medicalRecordId });
      } catch (err) {
        console.error("[MembersPage] delete error:", err);
        return false;
      }
    },
    [deleteUserAndMedicalRecord]
  );

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <div className="px-4 pb-10 pt-2 max-w-screen-xl">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-gray-900">Miembros</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Gestión de integrantes, staff, instructores y padres.
          </p>
        </div>

        <TabBar activeIndex={activeTab} onChange={setActiveTab} />

        {/* Only the active tab is mounted — one query at a time */}
        {activeTab === 0 && <PaginatedTab roles={MUSICIAN_ROLES} onRowClick={handleRowClick} />}
        {activeTab === 1 && <PaginatedTab roles={STAFF_ROLES} onRowClick={handleRowClick} />}
        {activeTab === 2 && <PaginatedTab roles={INSTRUCTOR_ROLES} onRowClick={handleRowClick} />}
        {activeTab === 3 && <ParentsTab onRowClick={handleRowClick} />}
      </div>
      <Footer />

      <UserDetailsModal
        open={!!selectedUser}
        user={selectedUser}
        userRole={userRole}
        medicalRecord={medicalRecord}
        canDeleteUser={canDeleteUser}
        onClose={handleCloseModal}
        onConfirmDelete={onConfirmDelete}
      />
    </DashboardLayout>
  );
};

export default MembersPage;
