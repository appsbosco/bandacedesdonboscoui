/* eslint-disable react/prop-types */

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import Footer from "examples/Footer";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import Header from "layouts/profile/components/Header";
import MedicalRecordModal from "./components/Modals/MedicalRecordModal";
import InventoryModal from "./components/Modals/InventoryModal";
import {
  GET_USERS_BY_ID,
  GET_INVENTORY_BY_USER,
  GET_MEDICAL_RECORD_BY_USER,
} from "graphql/queries";
import {
  CREATE_MEDICAL_RECORD,
  UPDATE_MEDICAL_RECORD,
  CREATE_INVENTORY,
  UPDATE_INVENTORY,
} from "graphql/mutations";

// ─── Reusable field row ────────────────────────────────────────────────────────
const InfoRow = ({ label, value, highlight }) => (
  <div className="flex items-start justify-between py-3 border-b border-slate-100 last:border-0 gap-4">
    <span className="text-xs font-medium text-slate-400 uppercase tracking-wide whitespace-nowrap">
      {label}
    </span>
    <span
      className={`text-sm text-right font-medium leading-snug break-words max-w-[60%] ${
        highlight ? "text-slate-900" : "text-slate-600"
      }`}
    >
      {value || "—"}
    </span>
  </div>
);

// ─── Badge for status ─────────────────────────────────────────────────────────
const StatusBadge = ({ value }) => {
  if (!value || value === "N/A" || value === "No")
    return <span className="text-sm text-slate-400 font-medium">—</span>;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
      {value}
    </span>
  );
};

// ─── Card wrapper ─────────────────────────────────────────────────────────────
const ProfileCard = ({ title, subtitle, icon, children, action }) => (
  <div
    className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full"
    style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}
  >
    {/* Card Header */}
    <div className="flex items-center justify-between px-5 pt-5 pb-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-900 leading-tight">{title}</h2>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5 leading-tight">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
    <div className="w-full h-px bg-slate-100" />
    {/* Card Body */}
    <div className="px-5 py-4 flex-1 overflow-auto">{children}</div>
  </div>
);

// ─── Edit button ──────────────────────────────────────────────────────────────
const EditButton = ({ onClick, label }) => (
  <button
    onClick={onClick}
    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors duration-150 active:scale-95"
  >
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
    {label}
  </button>
);

// ─── Primary action button ────────────────────────────────────────────────────
const PrimaryButton = ({ onClick, label, icon }) => (
  <button
    onClick={onClick}
    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-700 transition-all duration-150 active:scale-95 shadow-sm w-full justify-center"
  >
    {icon}
    {label}
  </button>
);

// ─── Loading skeleton ─────────────────────────────────────────────────────────
const Skeleton = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 rounded-full border-2 border-slate-200 border-t-slate-900 animate-spin" />
      <p className="text-sm text-slate-400 font-medium">Cargando perfil…</p>
    </div>
  </div>
);

// ─── Empty state ──────────────────────────────────────────────────────────────
const EmptyState = ({ icon, message, action }) => (
  <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
    <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
      {icon}
    </div>
    <p className="text-sm text-slate-400 font-medium leading-snug max-w-[180px]">{message}</p>
    {action}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
const Overview = () => {
  const { data: userData, loading: userLoading } = useQuery(GET_USERS_BY_ID);
  const { data: medicalRecordData, loading: medicalRecordLoading } = useQuery(
    GET_MEDICAL_RECORD_BY_USER
  );
  const { data: inventoryData } = useQuery(GET_INVENTORY_BY_USER);

  const {
    name,
    firstSurName,
    secondSurName,
    email,
    birthday,
    carnet,
    state,
    grade,
    phone,
    role,
    instrument,
  } = userData?.getUser || {};
  const userRole = userData?.getUser?.role;

  const [selected, setSelected] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  const [addMedicalRecord] = useMutation(CREATE_MEDICAL_RECORD, {
    refetchQueries: [{ query: GET_MEDICAL_RECORD_BY_USER }],
  });
  const [updateMedicalRecord] = useMutation(UPDATE_MEDICAL_RECORD, {
    refetchQueries: [{ query: GET_MEDICAL_RECORD_BY_USER }],
  });
  const [addInventory] = useMutation(CREATE_INVENTORY, {
    refetchQueries: [{ query: GET_INVENTORY_BY_USER }],
  });
  const [updateInventory] = useMutation(UPDATE_INVENTORY, {
    refetchQueries: [{ query: GET_INVENTORY_BY_USER }],
  });

  const handleOpenModal = (type, event = null) => {
    setModalType(type);
    setSelected(event);
    setOpenModal(true);
  };
  const handleCloseModal = () => {
    setOpenModal(false);
    setModalType(null);
    setSelected(null);
  };

  const handleAddMedicalRecord = async (data) => {
    await addMedicalRecord({ variables: { input: data } });
    handleCloseModal();
  };
  const handleUpdateMedicalRecord = async (data) => {
    await updateMedicalRecord({ variables: { id: selected.id, input: data } });
    handleCloseModal();
  };
  const handleAddInventory = async (data) => {
    await addInventory({ variables: { input: data } });
    handleCloseModal();
  };
  const handleUpdateInventory = async (data) => {
    await updateInventory({ variables: { id: selected.id, input: data } });
    handleCloseModal();
  };

  const medicalRecords = medicalRecordData?.getMedicalRecordByUser || [];
  const inventoryItems = inventoryData?.getInventoryByUser || [];

  if (userLoading || medicalRecordLoading) return <Skeleton />;

  const canAddInventory = [
    "Asistente de sección",
    "Principal de sección",
    "Integrante BCDB",
    "Admin",
  ].includes(userRole);

  return (
    <DashboardLayout>
      <Header />

      <div className="px-4 sm:px-6 lg:px-8 mt-8 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {/* ── Información general ────────────────────────── */}
          <ProfileCard
            title="Información general"
            subtitle="Datos personales del integrante"
            icon={
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            }
          >
            <InfoRow
              label="Nombre completo"
              value={`${name || ""} ${firstSurName || ""} ${secondSurName || ""}`.trim()}
              highlight
            />
            <InfoRow label="Email" value={email} />
            <InfoRow label="Celular" value={phone} />
            <InfoRow label="Fecha de nacimiento" value={birthday} />
            <InfoRow label="Carnet" value={carnet || "N/A"} />
            <InfoRow label="Estado" value={state || "N/A"} />
            <InfoRow label="Año académico" value={grade || "N/A"} />
            <InfoRow label="Rol" value={role} />
            <InfoRow label="Instrumento" value={instrument || "N/A"} />
          </ProfileCard>

          {/* ── Ficha médica ───────────────────────────────── */}
          <ProfileCard
            title="Ficha médica"
            subtitle="Información de salud y contacto de emergencia"
            icon={
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            }
            action={
              medicalRecords.length > 0 && (
                <EditButton
                  label="Editar"
                  onClick={() => handleOpenModal("edit", medicalRecords[0])}
                />
              )
            }
          >
            {medicalRecords.length > 0 ? (
              (() => {
                const r = medicalRecords[0];
                const fmt = (v) => (!v || v === "No" ? "—" : v);
                return (
                  <>
                    {/* Personal */}
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1 mt-1">
                      Personal
                    </p>
                    <InfoRow label="Cédula" value={r.identification} highlight />
                    <InfoRow label="Sexo" value={r.sex} />
                    <InfoRow label="Tipo de sangre" value={r.bloodType} />
                    <InfoRow label="Dirección" value={r.address} />

                    {/* Salud */}
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1 mt-4">
                      Salud
                    </p>
                    <InfoRow label="Enfermedades" value={fmt(r.illness)} />
                    <InfoRow label="Medicamentos" value={fmt(r.medicine)} />
                    <InfoRow label="Medicamentos en giras" value={fmt(r.medicineOnTour)} />
                    <InfoRow label="Alergias" value={fmt(r.allergies)} />

                    {/* Encargado */}
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1 mt-4">
                      Contacto de emergencia
                    </p>
                    <InfoRow label="Nombre" value={r.familyMemberName} highlight />
                    <InfoRow label="Teléfono" value={r.familyMemberNumber} />
                    <InfoRow label="Cédula" value={r.familyMemberNumberId} />
                    <InfoRow label="Parentesco" value={r.familyMemberRelationship} />
                    <InfoRow label="Ocupación" value={r.familyMemberOccupation} />

                    {modalType === "edit" && selected && (
                      <MedicalRecordModal
                        open={openModal}
                        onClose={handleCloseModal}
                        initialValues={selected}
                        onSubmit={handleUpdateMedicalRecord}
                      />
                    )}
                  </>
                );
              })()
            ) : userRole === "Padre/Madre de familia" ? (
              <EmptyState
                icon={
                  <svg
                    className="w-6 h-6 text-slate-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                    />
                  </svg>
                }
                message="No es necesario añadir una ficha médica para tu rol."
              />
            ) : (
              <EmptyState
                icon={
                  <svg
                    className="w-6 h-6 text-slate-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                }
                message="Aún no tienes una ficha médica registrada."
                action={
                  <PrimaryButton
                    onClick={() => handleOpenModal("add")}
                    label="Añadir ficha médica"
                    icon={
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    }
                  />
                }
              />
            )}

            {modalType === "add" && (
              <MedicalRecordModal
                open={openModal}
                onClose={handleCloseModal}
                onSubmit={handleAddMedicalRecord}
              />
            )}
          </ProfileCard>

          {/* ── Instrumento / Inventario ──────────────────── */}
          <ProfileCard
            title="Instrumento"
            subtitle="Equipo asignado e inventario"
            icon={
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                />
              </svg>
            }
            action={
              inventoryItems.length > 0 && (
                <EditButton
                  label="Editar"
                  onClick={() => handleOpenModal("editInventory", inventoryItems[0])}
                />
              )
            }
          >
            {inventoryItems.length > 0 ? (
              inventoryItems.map((item) => {
                const { brand, model, numberId, serie, details, mainteinance, condition } = item;

                const conditionColor =
                  {
                    Excelente: "bg-emerald-100 text-emerald-700",
                    Bueno: "bg-blue-100 text-blue-700",
                    Regular: "bg-amber-100 text-amber-700",
                    Malo: "bg-red-100 text-red-700",
                  }[condition] || "bg-slate-100 text-slate-600";

                return (
                  <div key={numberId}>
                    {/* Condition badge prominent */}
                    {condition && (
                      <div className="mb-4 flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${conditionColor}`}
                        >
                          Condición: {condition}
                        </span>
                      </div>
                    )}
                    <InfoRow label="Marca" value={brand || "N/A"} highlight />
                    <InfoRow label="Modelo" value={model || "N/A"} />
                    <InfoRow label="N° de placa" value={numberId || "N/A"} />
                    <InfoRow label="N° de serie" value={serie || "N/A"} />
                    <InfoRow label="Mantenimiento" value={mainteinance || "N/A"} />
                    {details && (
                      <div className="pt-3 pb-1">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                          Detalles
                        </p>
                        <p className="text-sm text-slate-600 leading-relaxed">{details}</p>
                      </div>
                    )}

                    {modalType === "editInventory" && selected && (
                      <InventoryModal
                        open={openModal}
                        onClose={handleCloseModal}
                        initialValues={selected}
                        onSubmit={handleUpdateInventory}
                      />
                    )}
                  </div>
                );
              })
            ) : canAddInventory ? (
              <EmptyState
                icon={
                  <svg
                    className="w-6 h-6 text-slate-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                    />
                  </svg>
                }
                message="Aún no tienes un instrumento asignado."
                action={
                  <PrimaryButton
                    onClick={() => handleOpenModal("addInventory")}
                    label="Añadir instrumento"
                    icon={
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    }
                  />
                }
              />
            ) : (
              <EmptyState
                icon={
                  <svg
                    className="w-6 h-6 text-slate-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                    />
                  </svg>
                }
                message="No es necesario añadir un instrumento para tu rol."
              />
            )}

            {modalType === "addInventory" && (
              <InventoryModal
                open={openModal}
                onClose={handleCloseModal}
                onSubmit={handleAddInventory}
              />
            )}
          </ProfileCard>
        </div>
      </div>

      <Footer />
    </DashboardLayout>
  );
};

export default Overview;
