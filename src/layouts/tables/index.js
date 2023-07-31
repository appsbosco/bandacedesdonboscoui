import { gql, useQuery, useMutation } from "@apollo/client";
import Card from "@mui/material/Card";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import Footer from "examples/Footer";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import TableWithFilteringSorting from "examples/Tables/Table/Table";
import { useEffect, useState } from "react";
import "./reset.css";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Modal,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import LibraryMusicIcon from "@mui/icons-material/LibraryMusic";
import BadgeIcon from "@mui/icons-material/Badge";
import BloodtypeIcon from "@mui/icons-material/Bloodtype";
import HomeIcon from "@mui/icons-material/Home";
import WcIcon from "@mui/icons-material/Wc";
import CoronavirusIcon from "@mui/icons-material/Coronavirus";
import MedicationIcon from "@mui/icons-material/Medication";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import ContactPhoneIcon from "@mui/icons-material/ContactPhone";
import WorkIcon from "@mui/icons-material/Work";
import EmailIcon from "@mui/icons-material/Email";
import CakeIcon from "@mui/icons-material/Cake";
import SchoolIcon from "@mui/icons-material/School";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import GroupIcon from "@mui/icons-material/Group";
import { useMediaQuery } from "react-responsive";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { GET_USERS_BY_ID } from "graphql/queries";
import { DELETE_USER, DELETE_MEDICAL_RECORD } from "graphql/mutations";

const GET_USERS = gql`
  query getUsers {
    getUsers {
      id
      name
      firstSurName
      secondSurName
      email
      birthday
      carnet
      state
      grade
      phone
      role
      avatar
      instrument
      bands
    }
  }
`;

const GET_MEDICAL_RECORD_BY_USER = gql`
  query getMedicalRecordByUser {
    getMedicalRecords {
      identification
      id
      familyMemberRelationship
      familyMemberOccupation
      familyMemberNumberId
      familyMemberNumber
      familyMemberName
      bloodType
      address
      illness
      medicine
      medicineOnTour
      sex
      user
    }
  }
`;

const Tables = () => {
  const { data: userData } = useQuery(GET_USERS_BY_ID);
  const [deleteUser] = useMutation(DELETE_USER);
  const [deleteMedicalRecord] = useMutation(DELETE_MEDICAL_RECORD);

  const { loading, error, data, refetch } = useQuery(GET_USERS);
  const [selectedUser, setSelectedUser] = useState(null);

  const [userMedicalRecord, setUserMedicalRecord] = useState(null);

  const [openModal, setOpenModal] = useState(true);

  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleStateChange = (id, newState) => {
    const updatedData = data.getUsers.map((user) => {
      if (user.id === id) {
        return { ...user, state: newState };
      }
      return user;
    });

    setData({ ...data, getUsers: updatedData });
  };

  const userRole = userData?.getUser.role;

  const isMobile = useMediaQuery({ maxWidth: 640 }); // Adjust the max width as per your requirements

  useEffect(() => {
    const fetchData = async () => {
      try {
        await refetch();
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    if (!loading) {
      fetchData();
    }
  }, [loading, refetch]);

  const {
    data: medicalRecordData,
    loading: medicalRecordLoading,
    error: medicalRecordError,
  } = useQuery(GET_MEDICAL_RECORD_BY_USER);

  useEffect(() => {
    if (selectedUser && medicalRecordData) {
      const userRecord = medicalRecordData.getMedicalRecords.find(
        (record) => record.user === selectedUser.id
      );
      setUserMedicalRecord(userRecord);
    }
  }, [selectedUser, medicalRecordData]);

  // Filter users by role
  const musiciansData =
    data?.getUsers.filter(
      (user) =>
        user.role === "Principal de sección" ||
        user.role === "Integrante BCDB" ||
        user.role === "Asistente de sección"
    ) || [];

  const staffData =
    data?.getUsers.filter(
      (user) =>
        user.role !== "Principal de sección" &&
        user.role !== "Integrante BCDB" &&
        user.role !== "Asistente de sección" &&
        user.role !== "Padre/Madre de familia"
    ) || [];

  const parentsData = data?.getUsers.filter((user) => user.role === "Padre/Madre de familia") || [];

  const columns = [
    { field: "name", headerName: "Nombre", width: 200 },
    { field: "firstSurName", headerName: "Primer Apellido", width: 200 },
    { field: "secondSurName", headerName: "Segundo Apellido", width: 250 },
    { field: "instrument", headerName: "Instrumento", width: 150 },
    { field: "role", headerName: "Rol", width: 200 },
    { field: "status", headerName: "Estado", width: 120 },
  ];

  const staffColumns = [
    { field: "name", headerName: "Nombre", width: 200 },
    { field: "firstSurName", headerName: "Primer Apellido", width: 200 },
    { field: "secondSurName", headerName: "Segundo Apellido", width: 250 },
    { field: "role", headerName: "Rol", width: 200 },
  ];

  const parentsColumns = [
    { field: "name", headerName: "Nombre", width: 200 },
    { field: "firstSurName", headerName: "Primer Apellido", width: 200 },
    { field: "secondSurName", headerName: "Segundo Apellido", width: 250 },
    { field: "role", headerName: "Rol", width: 200 },
    { field: "phone", headerName: "Número", width: 200 },
  ];

  const handleRowClick = (params) => {
    setSelectedUser(params.row);
    setOpenModal(true);
  };

  if (loading) {
    // Handle loading state
  }

  if (error) {
    // Handle error state
  }
  const handleConfirmDelete = () => {
    deleteUser({ variables: { deleteUserId: selectedUser?.id } })
      .then(() => {
        if (userMedicalRecord?.id) {
          return deleteMedicalRecord({
            variables: { deleteMedicalRecordId: userMedicalRecord.id },
          });
        }
      })
      .then(() => {
        refetch();
        setSelectedUser(null);
        setOpenModal(false);
      });
  };

  const handleDeleteUser = (id) => {
    setShowConfirmation(true);
    setSelectedUser(null);
  };

  const handleCancelDelete = () => {
    setShowConfirmation(false);
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <SoftBox mb={3}>
          <Card>
            <SoftBox display="flex" justifyContent="space-between" alignItems="center" p={3}>
              <SoftTypography variant="h6">Integrantes</SoftTypography>
            </SoftBox>

            <SoftBox
              sx={{
                "& .MuiTableRow-root:not(:last-child)": {
                  "& td": {
                    borderBottom: ({ borders: { borderWidth, borderColor } }) =>
                      `${borderWidth[1]} solid ${borderColor}`,
                  },
                },
              }}
            >
              <TableWithFilteringSorting
                data={musiciansData || []}
                columns={columns}
                onRowClick={handleRowClick}
                userRole={userRole}
                onStateChange={handleStateChange}
              />
            </SoftBox>
          </Card>
        </SoftBox>
        <SoftBox mb={3}>
          <Card>
            <SoftBox display="flex" justifyContent="space-between" alignItems="center" p={3}>
              <SoftTypography variant="h6">Staff</SoftTypography>
            </SoftBox>
            <SoftBox
              sx={{
                "& .MuiTableRow-root:not(:last-child)": {
                  "& td": {
                    borderBottom: ({ borders: { borderWidth, borderColor } }) =>
                      `${borderWidth[1]} solid ${borderColor}`,
                  },
                },
              }}
            >
              <TableWithFilteringSorting
                data={staffData || []}
                columns={staffColumns}
                onRowClick={handleRowClick}
              />
            </SoftBox>
          </Card>
        </SoftBox>

        <SoftBox mb={3}>
          <Card>
            <SoftBox display="flex" justifyContent="space-between" alignItems="center" p={3}>
              <SoftTypography variant="h6">Padres / Madres de familia</SoftTypography>
            </SoftBox>
            <SoftBox
              sx={{
                "& .MuiTableRow-root:not(:last-child)": {
                  "& td": {
                    borderBottom: ({ borders: { borderWidth, borderColor } }) =>
                      `${borderWidth[1]} solid ${borderColor}`,
                  },
                },
              }}
            >
              <TableWithFilteringSorting
                data={parentsData || []}
                columns={parentsColumns}
                onRowClick={handleRowClick}
              />
            </SoftBox>
          </Card>
        </SoftBox>
      </SoftBox>
      <Footer />

      {selectedUser && openModal && (
        <Modal
          open={openModal}
          onClose={handleCloseModal}
          sx={{ boxShadow: " rgba(100, 100, 111, 0.2) 0px 7px 29px 0px" }}
        >
          <Box
            p={3}
            sx={{
              backgroundColor: "#FFFFFF",
              boxShadow: " rgba(100, 100, 111, 0.2) 0px 7px 29px 0px",
              maxWidth: "90%",
              width: "50%",
              borderRadius: "4px",
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              maxHeight: "90%",
              overflowY: "auto",
              "@media (max-width: 900px)": {
                width: "90%",
              },
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <IconButton onClick={handleCloseModal}>
                <CloseIcon />
              </IconButton>
              {userRole === "Admin" || userRole === "Director" ? (
                <Button
                  type="submit"
                  style={{ color: "red" }}
                  onClick={() => handleDeleteUser(selectedUser?.id)}
                >
                  Eliminar usuario
                </Button>
              ) : null}
            </div>

            <Dialog open={showConfirmation} onClose={handleCancelDelete}>
              <DialogTitle>Confirmar eliminación</DialogTitle>
              <DialogContent>
                <p>¿Está seguro de que desea eliminar al usuario?</p>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCancelDelete} color="primary">
                  Cancelar
                </Button>
                <Button onClick={handleConfirmDelete} color="primary">
                  Eliminar
                </Button>
              </DialogActions>
            </Dialog>
            <main>
              <article>
                <header className="relative py-16 bg-white sm:pt-24 lg:pt-28">
                  <div className="absolute inset-x-0 bottom-0 bg-white h-1/4"></div>
                  <div className="relative max-w-6xl px-4 mx-auto text-center sm:px-6 lg:px-8">
                    <a
                      href="#0"
                      className="group inline-flex items-center justify-center gap-3.5 text-base leading-5 tracking-wide text-sky-700 transition duration-200 ease-in-out hover:text-sky-600 sm:text-lg"
                    >
                      Miembro de la banda:
                    </a>

                    {!selectedUser.avatar || selectedUser.avatar === "" ? (
                      <div className=""></div>
                    ) : (
                      <div className="w-full px-2 pt-2">
                        <a
                          href=""
                          className="relative block w-full overflow-hidden group aspect-w-16 aspect-h-9 rounded-xl md:aspect-w-3 md:aspect-h-2"
                        >
                          <LazyLoadImage
                            src={selectedUser.avatar}
                            alt=""
                            effect="opacity"
                            style={{
                              objectFit: "cover",
                              width: "100%",
                              height: "100%",
                            }}
                            className="object-cover w-full transition duration-300 rounded-xl bg-slate-100 group-hover:scale-105"
                          />
                          {/* <img
                            src={selectedUser.avatar}
                            alt=""
                            className="object-cover w-full transition duration-300 rounded-xl bg-slate-100 group-hover:scale-105"
                          /> */}
                          <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-slate-900/5"></div>
                        </a>
                      </div>
                    )}

                    <h1 className="mt-6 text-4xl font-semibold leading-tight text-center font-display text-slate-900 sm:text-5xl sm:leading-tight">
                      {selectedUser.name +
                        " " +
                        selectedUser.firstSurName +
                        " " +
                        selectedUser.secondSurName}
                    </h1>
                    <p className="max-w-2xl mx-auto mt-6 text-lg leading-8 text-center text-slate-700 mb-6">
                      {selectedUser.instrument}
                    </p>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-8 mb-6 text-md text-slate-500">
                      <span className="flex items-center gap-2">
                        <EmailIcon fontSize="medium" />
                        <strong>Correo:</strong> {selectedUser.email ? selectedUser.email : "N/A"}
                      </span>
                      <span className="flex items-center gap-2">
                        <ContactPhoneIcon fontSize="medium" />

                        <strong>Celular:</strong>

                        <a
                          href={"tel:" + selectedUser.phone}
                          className="inline-block duration-200 ease-in-out text-sky-700 hover:text-sky-600"
                        >
                          {" "}
                          {selectedUser.phone ? selectedUser.phone : "N/A"}
                        </a>
                      </span>
                    </div>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-8 mb-6 text-md text-slate-500">
                      <span className="flex items-center gap-2">
                        <BadgeIcon fontSize="medium" />
                        <strong>Carnet:</strong> {selectedUser.carnet ? selectedUser.carnet : "N/A"}
                      </span>

                      <span className="flex items-center gap-2">
                        <SchoolIcon fontSize="medium" />
                        <strong>Año académico:</strong>{" "}
                        {selectedUser.grade ? selectedUser.grade : "N/A"}
                      </span>

                      <span className="flex items-center gap-2">
                        <GroupIcon fontSize="medium" />
                        <strong>Estado:</strong> {selectedUser.state ? selectedUser.state : "N/A"}
                      </span>
                    </div>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-8 mb-6 text-md text-slate-500">
                      <span className="flex items-center gap-2">
                        <CakeIcon fontSize="medium" />
                        <strong>Fecha nacimiento:</strong>{" "}
                        {selectedUser.birthday ? selectedUser.birthday : "N/A"}
                      </span>
                      <span className="flex items-center gap-2">
                        <AdminPanelSettingsIcon fontSize="medium" />
                        <strong>Rol:</strong> {selectedUser.role ? selectedUser.role : "N/A"}
                      </span>
                    </div>

                    <div style={{ borderBottom: "1px solid #000;" }}></div>
                    <hr style={{ borderBottom: "1px solid #000;", margin: "3rem" }} />

                    {userMedicalRecord ? (
                      <>
                        <ol className="col-span-2 grid grid-cols-1 gap-x-8 gap-y-10 text-base leading-7 text-gray-600 [counter-reset:section] sm:grid-cols-2 lg:gap-y-16">
                          {isMobile ? (
                            <>
                              <li className="relative mt-3 flex h-fit items-center font-writing text-2xl tracking-wide text-slate-600 sm:top-6 sm:left-14 sm:mt-0 sm:block sm:text-[27px] md:left-20">
                                <span className="inline-block w-52 max-w-[240px] transform sm:w-auto sm:-rotate-12">
                                  Información personal :D
                                </span>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="124"
                                  height="121"
                                  viewBox="0 0 124 121"
                                  fill="none"
                                  className="relative w-24 h-auto transform rotate-90 -translate-y-5 -left-4 -scale-y-100 text-slate-600 sm:-left-8 sm:w-32 sm:translate-y-2 sm:-rotate-6 sm:scale-100"
                                >
                                  <g clipPath="url(#clip0_257_335)">
                                    <path
                                      d="M101.672 26.3321C96.8237 38.134 92.186 44.0573 79.0339 44.4141C70.6979 44.6403 60.8529 42.694 53.4527 38.7688C49.1632 36.4936 56.8633 35.9887 58.3238 36.046C75.2213 36.7084 91.469 47.7751 94.8076 64.9225C96.9834 76.0979 88.4245 81.9067 78.6041 84.1752C63.6278 87.6349 47.752 81.2525 36.0397 72.0991C32.1436 69.0541 19.8172 60.5149 22.0934 54.2698C23.9793 49.0954 31.7507 55.0061 34.018 56.9118C37.2506 59.6288 44.0244 65.7437 43.9149 70.3449C43.7576 76.9438 32.7995 78.0771 28.2217 77.7848C19.5283 77.2298 10.3327 73.6012 2.05876 71.0225C1.4496 70.8325 5.37871 69.9759 6.06477 69.8198C8.02976 69.3721 9.72632 68.1441 11.7325 67.8657C13.2208 67.6592 21.2769 68.287 16.2554 69.947C14.4855 70.532 2.71379 69.3189 2.58655 69.7453C2.06535 71.4868 10.2182 79.8642 11.7371 81.4008C15.3955 85.1003 14.5874 73.4626 14.2296 71.9325"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                    />
                                  </g>
                                  <defs>
                                    <clipPath id="clip0_257_335">
                                      <rect
                                        width="106"
                                        height="67"
                                        fill="white"
                                        transform="matrix(-0.748497 0.663138 0.663138 0.748497 79.3407 0)"
                                      />
                                    </clipPath>
                                  </defs>
                                </svg>
                              </li>
                              <li className="relative  ">
                                <div>
                                  <div className="flex items-center justify-center rounded-lg h-11 w-11 bg-gradient-to-br from-sky-50 via-slate-50 to-sky-50 ring-1 ring-slate-900/5">
                                    <BadgeIcon />
                                  </div>

                                  <p className="mt-2 text-lg font-semibold font-display text-slate-900">
                                    Identificación
                                  </p>
                                </div>
                                <p className="mt-3 text-base leading-7 text-slate-700">
                                  {userMedicalRecord.identification
                                    ? userMedicalRecord.identification
                                    : "N/A"}
                                </p>
                              </li>
                            </>
                          ) : (
                            <>
                              <li className="relative  ">
                                <div>
                                  <div className="flex items-center justify-center rounded-lg h-11 w-11 bg-gradient-to-br from-sky-50 via-slate-50 to-sky-50 ring-1 ring-slate-900/5">
                                    <BadgeIcon />
                                  </div>

                                  <p className="mt-2 text-lg font-semibold font-display text-slate-900">
                                    Identificación
                                  </p>
                                </div>
                                <p className="mt-3 text-base leading-7 text-slate-700">
                                  {userMedicalRecord.identification
                                    ? userMedicalRecord.identification
                                    : "N/A"}
                                </p>
                              </li>
                              <li className="relative mt-3 flex h-fit items-center font-writing text-2xl tracking-wide text-slate-600 sm:top-6 sm:left-14 sm:mt-0 sm:block sm:text-[27px] md:left-20">
                                <span className="inline-block w-52 max-w-[240px] transform sm:w-auto sm:-rotate-12">
                                  Información personal :D
                                </span>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="124"
                                  height="121"
                                  viewBox="0 0 124 121"
                                  fill="none"
                                  className="relative w-24 h-auto transform rotate-90 -translate-y-5 -left-4 -scale-y-100 text-slate-600 sm:-left-8 sm:w-32 sm:translate-y-2 sm:-rotate-6 sm:scale-100"
                                >
                                  <g clipPath="url(#clip0_257_335)">
                                    <path
                                      d="M101.672 26.3321C96.8237 38.134 92.186 44.0573 79.0339 44.4141C70.6979 44.6403 60.8529 42.694 53.4527 38.7688C49.1632 36.4936 56.8633 35.9887 58.3238 36.046C75.2213 36.7084 91.469 47.7751 94.8076 64.9225C96.9834 76.0979 88.4245 81.9067 78.6041 84.1752C63.6278 87.6349 47.752 81.2525 36.0397 72.0991C32.1436 69.0541 19.8172 60.5149 22.0934 54.2698C23.9793 49.0954 31.7507 55.0061 34.018 56.9118C37.2506 59.6288 44.0244 65.7437 43.9149 70.3449C43.7576 76.9438 32.7995 78.0771 28.2217 77.7848C19.5283 77.2298 10.3327 73.6012 2.05876 71.0225C1.4496 70.8325 5.37871 69.9759 6.06477 69.8198C8.02976 69.3721 9.72632 68.1441 11.7325 67.8657C13.2208 67.6592 21.2769 68.287 16.2554 69.947C14.4855 70.532 2.71379 69.3189 2.58655 69.7453C2.06535 71.4868 10.2182 79.8642 11.7371 81.4008C15.3955 85.1003 14.5874 73.4626 14.2296 71.9325"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                    />
                                  </g>
                                  <defs>
                                    <clipPath id="clip0_257_335">
                                      <rect
                                        width="106"
                                        height="67"
                                        fill="white"
                                        transform="matrix(-0.748497 0.663138 0.663138 0.748497 79.3407 0)"
                                      />
                                    </clipPath>
                                  </defs>
                                </svg>
                              </li>
                            </>
                          )}

                          <li className="relative ">
                            <div>
                              <div className="flex items-center justify-center rounded-lg h-11 w-11 bg-gradient-to-br from-sky-50 via-slate-50 to-sky-50 ring-1 ring-slate-900/5">
                                <HomeIcon />
                              </div>

                              <p className="mt-2 text-lg font-semibold font-display text-slate-900">
                                Dirección
                              </p>
                            </div>
                            <p className="mt-3 text-base leading-7 text-slate-700">
                              {userMedicalRecord.address ? userMedicalRecord.address : "N/A"}
                            </p>
                          </li>
                          <li className="relative ">
                            <div>
                              <div className="flex items-center justify-center rounded-lg h-11 w-11 bg-gradient-to-br from-sky-50 via-slate-50 to-sky-50 ring-1 ring-slate-900/5">
                                <BloodtypeIcon />
                              </div>

                              <p className="mt-2 text-lg font-semibold font-display text-slate-900">
                                Tipo de sangre
                              </p>
                            </div>
                            <p className="mt-3 text-base leading-7 text-slate-700">
                              {userMedicalRecord.bloodType ? userMedicalRecord.bloodType : "N/A"}
                            </p>
                          </li>
                          <li className="relative ">
                            <div>
                              <div className="flex items-center justify-center rounded-lg h-11 w-11 bg-gradient-to-br from-sky-50 via-slate-50 to-sky-50 ring-1 ring-slate-900/5">
                                <WcIcon />
                              </div>

                              <p className="mt-2 text-lg font-semibold font-display text-slate-900">
                                Sexo
                              </p>
                            </div>
                            <p className="mt-3 text-base leading-7 text-slate-700">
                              {userMedicalRecord.sex ? userMedicalRecord.sex : "N/A"}
                            </p>
                          </li>
                          <li className="relative ">
                            <div>
                              <div className="flex items-center justify-center rounded-lg h-11 w-11 bg-gradient-to-br from-sky-50 via-slate-50 to-sky-50 ring-1 ring-slate-900/5">
                                <CoronavirusIcon />
                              </div>

                              <p className="mt-2 text-lg font-semibold font-display text-slate-900">
                                Enfermedades
                              </p>
                            </div>
                            <p className="mt-3 text-base leading-7 text-slate-700">
                              {userMedicalRecord.illness ? userMedicalRecord.illness : "N/A"}
                            </p>
                          </li>
                          <li className="relative ">
                            <div>
                              <div className="flex items-center justify-center rounded-lg h-11 w-11 bg-gradient-to-br from-sky-50 via-slate-50 to-sky-50 ring-1 ring-slate-900/5">
                                <MedicationIcon />
                              </div>

                              <p className="mt-2 text-lg font-semibold font-display text-slate-900">
                                Medicamentos
                              </p>
                            </div>
                            <p className="mt-3 text-base leading-7 text-slate-700">
                              {userMedicalRecord.medicine ? userMedicalRecord.medicine : "N/A"}
                            </p>
                          </li>
                          <li className="relative ">
                            <div>
                              <div className="flex items-center justify-center rounded-lg h-11 w-11 bg-gradient-to-br from-sky-50 via-slate-50 to-sky-50 ring-1 ring-slate-900/5">
                                <MedicalServicesIcon />
                              </div>

                              <p className="mt-2 text-lg font-semibold font-display text-slate-900">
                                Medicamentos en giras
                              </p>
                            </div>
                            <p className="mt-3 text-base leading-7 text-slate-700">
                              {userMedicalRecord.medicineOnTour
                                ? userMedicalRecord.medicineOnTour
                                : "N/A"}
                            </p>
                          </li>

                          <li className="relative ">
                            <div>
                              <div className="flex items-center justify-center rounded-lg h-11 w-11 bg-gradient-to-br from-sky-50 via-slate-50 to-sky-50 ring-1 ring-slate-900/5">
                                <MedicalServicesIcon />
                              </div>

                              <p className="mt-2 text-lg font-semibold font-display text-slate-900">
                                Alergias
                              </p>
                            </div>
                            <p className="mt-3 text-base leading-7 text-slate-700">
                              {userMedicalRecord.allergies ? userMedicalRecord.allergies : "N/A"}
                            </p>
                          </li>
                        </ol>

                        <ol className="col-span-2 grid grid-cols-1 gap-x-8 gap-y-10 text-base leading-7 text-gray-600 [counter-reset:section] sm:grid-cols-2 lg:gap-y-16 mt-6">
                          <li className="relative  ">
                            <div>
                              <div className="flex items-center justify-center rounded-lg h-11 w-11 "></div>

                              <p className="mt-2 text-lg font-semibold font-display text-slate-900"></p>
                            </div>
                            <p className="mt-3 text-base leading-7 text-slate-700"></p>
                          </li>

                          <li className="relative mt-3 flex h-fit items-center font-writing text-2xl tracking-wide text-slate-600 sm:top-6 sm:left-14 sm:mt-0 sm:block sm:text-[27px] md:left-20">
                            <span className="inline-block w-52 max-w-[240px] transform sm:w-auto sm:-rotate-12">
                              Información del encargado
                            </span>
                            {/* <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="124"
                              height="121"
                              viewBox="0 0 124 121"
                              fill="none"
                              className="relative w-24 h-auto transform rotate-90 -translate-y-5 -left-4 -scale-y-100 text-slate-600 sm:-left-8 sm:w-32 sm:translate-y-2 sm:-rotate-6 sm:scale-100"
                            >
                              <g clipPath="url(#clip0_257_335)">
                                <path
                                  d="M101.672 26.3321C96.8237 38.134 92.186 44.0573 79.0339 44.4141C70.6979 44.6403 60.8529 42.694 53.4527 38.7688C49.1632 36.4936 56.8633 35.9887 58.3238 36.046C75.2213 36.7084 91.469 47.7751 94.8076 64.9225C96.9834 76.0979 88.4245 81.9067 78.6041 84.1752C63.6278 87.6349 47.752 81.2525 36.0397 72.0991C32.1436 69.0541 19.8172 60.5149 22.0934 54.2698C23.9793 49.0954 31.7507 55.0061 34.018 56.9118C37.2506 59.6288 44.0244 65.7437 43.9149 70.3449C43.7576 76.9438 32.7995 78.0771 28.2217 77.7848C19.5283 77.2298 10.3327 73.6012 2.05876 71.0225C1.4496 70.8325 5.37871 69.9759 6.06477 69.8198C8.02976 69.3721 9.72632 68.1441 11.7325 67.8657C13.2208 67.6592 21.2769 68.287 16.2554 69.947C14.4855 70.532 2.71379 69.3189 2.58655 69.7453C2.06535 71.4868 10.2182 79.8642 11.7371 81.4008C15.3955 85.1003 14.5874 73.4626 14.2296 71.9325"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                />
                              </g>
                              <defs>
                                <clipPath id="clip0_257_335">
                                  <rect
                                    width="106"
                                    height="67"
                                    fill="white"
                                    transform="matrix(-0.748497 0.663138 0.663138 0.748497 79.3407 0)"
                                  />
                                </clipPath>
                              </defs>
                            </svg> */}
                          </li>

                          <li className="relative ">
                            <div>
                              <div className="flex items-center justify-center rounded-lg h-11 w-11 bg-gradient-to-br from-sky-50 via-slate-50 to-sky-50 ring-1 ring-slate-900/5">
                                <FamilyRestroomIcon />
                              </div>

                              <p className="mt-2 text-lg font-semibold font-display text-slate-900">
                                Nombre del encargado
                              </p>
                            </div>
                            <p className="mt-3 text-base leading-7 text-slate-700">
                              {userMedicalRecord.familyMemberName
                                ? userMedicalRecord.familyMemberName
                                : "N/A"}
                            </p>
                          </li>
                          <li className="relative ">
                            <div>
                              <div className="flex items-center justify-center rounded-lg h-11 w-11 bg-gradient-to-br from-sky-50 via-slate-50 to-sky-50 ring-1 ring-slate-900/5">
                                <BadgeIcon />
                              </div>

                              <p className="mt-2 text-lg font-semibold font-display text-slate-900">
                                Identificación del encargado
                              </p>
                            </div>
                            <p className="mt-3 text-base leading-7 text-slate-700">
                              {userMedicalRecord.familyMemberNumberId
                                ? userMedicalRecord.familyMemberNumberId
                                : "N/A"}{" "}
                            </p>
                          </li>

                          <li className="relative ">
                            <div>
                              <div className="flex items-center justify-center rounded-lg h-11 w-11 bg-gradient-to-br from-sky-50 via-slate-50 to-sky-50 ring-1 ring-slate-900/5">
                                <WcIcon />
                              </div>

                              <p className="mt-2 text-lg font-semibold font-display text-slate-900">
                                Parentesco con el encargado
                              </p>
                            </div>
                            <p className="mt-3 text-base leading-7 text-slate-700">
                              {userMedicalRecord.familyMemberRelationship
                                ? userMedicalRecord.familyMemberRelationship
                                : "N/A"}
                            </p>
                          </li>

                          <li className="relative ">
                            <div>
                              <div className="flex items-center justify-center rounded-lg h-11 w-11 bg-gradient-to-br from-sky-50 via-slate-50 to-sky-50 ring-1 ring-slate-900/5">
                                <ContactPhoneIcon />
                              </div>

                              <p className="mt-2 text-lg font-semibold font-display text-slate-900">
                                Teléfono del encargado
                              </p>
                            </div>
                            <p className="mt-3 text-base leading-7 text-slate-700">
                              <a
                                href={"tel:" + selectedUser.phone}
                                className="inline-block duration-200 ease-in-out text-sky-700 hover:text-sky-600"
                              >
                                {userMedicalRecord.familyMemberNumber
                                  ? userMedicalRecord.familyMemberNumber
                                  : "N/A"}
                              </a>
                            </p>
                          </li>
                          <li className="relative ">
                            <div>
                              <div className="flex items-center justify-center rounded-lg h-11 w-11 bg-gradient-to-br from-sky-50 via-slate-50 to-sky-50 ring-1 ring-slate-900/5">
                                <WorkIcon />
                              </div>

                              <p className="mt-2 text-lg font-semibold font-display text-slate-900">
                                Ocupación del encargado
                              </p>
                            </div>
                            <p className="mt-3 text-base leading-7 text-slate-700">
                              {userMedicalRecord.familyMemberOccupation
                                ? userMedicalRecord.familyMemberOccupation
                                : "N/A"}
                            </p>
                          </li>
                        </ol>
                      </>
                    ) : (
                      <p style={{ fontWeight: 500 }}>
                        Esta persona aún no ha llenado su ficha médica.
                      </p>
                    )}
                  </div>
                </header>

                <div className="px-4 bg-white sm:px-6 lg:px-8">
                  <div className="max-w-2xl mx-auto prose prose-lg">
                    <p></p>
                  </div>
                </div>
              </article>
            </main>
          </Box>
        </Modal>
      )}
    </DashboardLayout>
  );
};

export default Tables;
