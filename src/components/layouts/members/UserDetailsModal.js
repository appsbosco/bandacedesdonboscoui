import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Modal,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
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
import PropTypes from "prop-types";

const DoodleArrow = ({ className }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="124"
      height="121"
      viewBox="0 0 124 121"
      fill="none"
      className={className}
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
  );
};

const IconBubble = ({ children }) => {
  return (
    <div className="flex items-center justify-center rounded-lg h-11 w-11 bg-gradient-to-br from-sky-50 via-slate-50 to-sky-50 ring-1 ring-slate-900/5">
      {children}
    </div>
  );
};

const InfoItem = ({ icon, title, value, link }) => {
  return (
    <li className="relative">
      <div>
        <IconBubble>{icon}</IconBubble>
        <p className="mt-2 text-lg font-semibold font-display text-slate-900">{title}</p>
      </div>
      <p className="mt-3 text-base leading-7 text-slate-700">
        {link ? (
          <a
            href={link}
            className="inline-block duration-200 ease-in-out text-sky-700 hover:text-sky-600"
          >
            {value || "N/A"}
          </a>
        ) : (
          value || "N/A"
        )}
      </p>
    </li>
  );
};

const UserDetailsModal = ({
  open,
  user,
  userRole,
  medicalRecord,
  canDeleteUser,
  onClose,
  onConfirmDelete,
}) => {
  const isMobile = useMediaQuery({ maxWidth: 640 });
  const [imageOpen, setImageOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const fullName = useMemo(() => {
    if (!user) return "";
    return `${user.name || ""} ${user.firstSurName || ""} ${user.secondSurName || ""}`.trim();
  }, [user]);

  useEffect(() => {
    if (!open) {
      setImageOpen(false);
      setConfirmOpen(false);
    }
  }, [open]);

  if (!user) return null;

  const showDeleteButton = (userRole === "Admin" || userRole === "Director") && canDeleteUser;

  const personalHeading = (
    <li className="relative mt-3 flex h-fit items-center font-writing text-2xl tracking-wide text-slate-600 sm:top-6 sm:left-14 sm:mt-0 sm:block sm:text-[27px] md:left-20">
      <span className="inline-block w-52 max-w-[240px] transform sm:w-auto sm:-rotate-12">
        Información personal :D
      </span>
      <DoodleArrow className="relative w-24 h-auto transform rotate-90 -translate-y-5 -left-4 -scale-y-100 text-slate-600 sm:-left-8 sm:w-32 sm:translate-y-2 sm:-rotate-6 sm:scale-100" />
    </li>
  );

  const guardianHeading = (
    <li className="relative mt-3 flex h-fit items-center font-writing text-2xl tracking-wide text-slate-600 sm:top-6 sm:left-14 sm:mt-0 sm:block sm:text-[27px] md:left-20">
      <span className="inline-block w-52 max-w-[240px] transform sm:w-auto sm:-rotate-12">
        Información del encargado
      </span>
    </li>
  );

  const handleDeleteClick = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setConfirmOpen(true);
  };

  const handleCancelDelete = () => setConfirmOpen(false);

  const handleConfirmDelete = async () => {
    const ok = await onConfirmDelete({
      userId: user?.id,
      medicalRecordId: medicalRecord?.id || null,
    });
    if (ok) {
      setConfirmOpen(false);
      onClose();
    }
  };

  const personalItems = medicalRecord
    ? [
        { icon: <BadgeIcon />, title: "Identificación", value: medicalRecord.identification },
        { icon: <HomeIcon />, title: "Dirección", value: medicalRecord.address },
        { icon: <BloodtypeIcon />, title: "Tipo de sangre", value: medicalRecord.bloodType },
        { icon: <WcIcon />, title: "Sexo", value: medicalRecord.sex },
        { icon: <CoronavirusIcon />, title: "Enfermedades", value: medicalRecord.illness },
        { icon: <MedicationIcon />, title: "Medicamentos", value: medicalRecord.medicine },
        {
          icon: <MedicalServicesIcon />,
          title: "Medicamentos en giras",
          value: medicalRecord.medicineOnTour,
        },
        { icon: <MedicalServicesIcon />, title: "Alergias", value: medicalRecord.allergies },
      ]
    : [];

  const guardianItems = medicalRecord
    ? [
        {
          icon: <FamilyRestroomIcon />,
          title: "Nombre del encargado",
          value: medicalRecord.familyMemberName,
        },
        {
          icon: <BadgeIcon />,
          title: "Identificación del encargado",
          value: medicalRecord.familyMemberNumberId,
        },
        {
          icon: <WcIcon />,
          title: "Parentesco con el encargado",
          value: medicalRecord.familyMemberRelationship,
        },
        {
          icon: <ContactPhoneIcon />,
          title: "Teléfono del encargado",
          value: medicalRecord.familyMemberNumber,
          link: medicalRecord.familyMemberNumber ? `tel:${medicalRecord.familyMemberNumber}` : null,
        },
        {
          icon: <WorkIcon />,
          title: "Ocupación del encargado",
          value: medicalRecord.familyMemberOccupation,
        },
      ]
    : [];

  return (
    <Modal
      open={open}
      onClose={onClose}
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
          "@media (max-width: 900px)": { width: "90%" },
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
          {showDeleteButton ? (
            <Button type="submit" style={{ color: "red" }} onClick={handleDeleteClick}>
              Eliminar usuario
            </Button>
          ) : null}
        </div>

        <Dialog open={confirmOpen} onClose={handleCancelDelete}>
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

                {!user.avatar || user.avatar === "" ? (
                  <div className=""></div>
                ) : (
                  <div className="w-full px-2 pt-2">
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setImageOpen(true);
                      }}
                      className="relative block w-full overflow-hidden group aspect-w-16 aspect-h-9 rounded-xl md:aspect-w-3 md:aspect-h-2"
                    >
                      <LazyLoadImage
                        src={user.avatar}
                        alt=""
                        effect="opacity"
                        style={{ objectFit: "cover", width: "100%", height: "100%" }}
                        className="object-cover w-full transition duration-300 rounded-xl bg-slate-100 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-slate-900/5"></div>
                    </a>

                    <Modal
                      open={imageOpen}
                      onClose={() => setImageOpen(false)}
                      aria-labelledby="modal-modal-title"
                      aria-describedby="modal-modal-description"
                    >
                      <Box
                        sx={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          width: { xs: "90%", sm: "70%", md: "50%", lg: "40%", xl: "30%" },
                          bgcolor: "background.paper",
                          boxShadow: 24,
                          p: 4,
                          overflow: "auto",
                        }}
                      >
                        <img
                          src={user.avatar}
                          alt="User avatar"
                          style={{ maxWidth: "100%", height: "auto" }}
                        />
                      </Box>
                    </Modal>
                  </div>
                )}

                <h1 className="mt-6 text-4xl font-semibold leading-tight text-center font-display text-slate-900 sm:text-5xl sm:leading-tight">
                  {fullName}
                </h1>
                <p className="max-w-2xl mx-auto mt-6 text-lg leading-8 text-center text-slate-700 mb-6">
                  {user.instrument || "N/A"}
                </p>

                <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-8 mb-6 text-md text-slate-500">
                  <span className="flex items-center gap-2">
                    <EmailIcon fontSize="medium" />
                    <strong>Correo:</strong> {user.email ? user.email : "N/A"}
                  </span>
                  <span className="flex items-center gap-2">
                    <ContactPhoneIcon fontSize="medium" />
                    <strong>Celular:</strong>
                    <a
                      href={user.phone ? `tel:${user.phone}` : "#"}
                      className="inline-block duration-200 ease-in-out text-sky-700 hover:text-sky-600"
                    >
                      {user.phone ? user.phone : "N/A"}
                    </a>
                  </span>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-8 mb-6 text-md text-slate-500">
                  <span className="flex items-center gap-2">
                    <BadgeIcon fontSize="medium" />
                    <strong>Carnet:</strong> {user.carnet ? user.carnet : "N/A"}
                  </span>
                  <span className="flex items-center gap-2">
                    <SchoolIcon fontSize="medium" />
                    <strong>Año académico:</strong> {user.grade ? user.grade : "N/A"}
                  </span>
                  <span className="flex items-center gap-2">
                    <GroupIcon fontSize="medium" />
                    <strong>Estado:</strong> {user.state ? user.state : "N/A"}
                  </span>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-8 mb-6 text-md text-slate-500">
                  <span className="flex items-center gap-2">
                    <CakeIcon fontSize="medium" />
                    <strong>Fecha nacimiento:</strong> {user.birthday ? user.birthday : "N/A"}
                  </span>
                  <span className="flex items-center gap-2">
                    <AdminPanelSettingsIcon fontSize="medium" />
                    <strong>Rol:</strong> {user.role ? user.role : "N/A"}
                  </span>
                </div>

                <div style={{ borderBottom: "1px solid #000;" }}></div>
                <hr style={{ borderBottom: "1px solid #000;", margin: "3rem" }} />

                {medicalRecord ? (
                  <>
                    <ol className="col-span-2 grid grid-cols-1 gap-x-8 gap-y-10 text-base leading-7 text-gray-600 [counter-reset:section] sm:grid-cols-2 lg:gap-y-16">
                      {isMobile ? (
                        <>
                          {personalHeading}
                          {personalItems.map((it, idx) => (
                            <InfoItem
                              key={`${it.title}-${idx}`}
                              icon={it.icon}
                              title={it.title}
                              value={it.value}
                              link={it.link}
                            />
                          ))}
                        </>
                      ) : (
                        <>
                          {personalItems.length > 0 ? (
                            <InfoItem
                              icon={personalItems[0].icon}
                              title={personalItems[0].title}
                              value={personalItems[0].value}
                              link={personalItems[0].link}
                            />
                          ) : null}
                          {personalHeading}
                          {personalItems.slice(1).map((it, idx) => (
                            <InfoItem
                              key={`${it.title}-${idx}`}
                              icon={it.icon}
                              title={it.title}
                              value={it.value}
                              link={it.link}
                            />
                          ))}
                        </>
                      )}
                    </ol>

                    <ol className="col-span-2 grid grid-cols-1 gap-x-8 gap-y-10 text-base leading-7 text-gray-600 [counter-reset:section] sm:grid-cols-2 lg:gap-y-16 mt-6">
                      <li className="relative">
                        <div>
                          <div className="flex items-center justify-center rounded-lg h-11 w-11"></div>
                          <p className="mt-2 text-lg font-semibold font-display text-slate-900"></p>
                        </div>
                        <p className="mt-3 text-base leading-7 text-slate-700"></p>
                      </li>

                      {guardianHeading}

                      {guardianItems.map((it, idx) => (
                        <InfoItem
                          key={`${it.title}-${idx}`}
                          icon={it.icon}
                          title={it.title}
                          value={it.value}
                          link={it.link}
                        />
                      ))}
                    </ol>
                  </>
                ) : (
                  <p style={{ fontWeight: 500 }}>Esta persona aún no ha llenado su ficha médica.</p>
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
  );
};

export default UserDetailsModal;

DoodleArrow.propTypes = {
  className: PropTypes.string,
};

IconBubble.propTypes = {
  children: PropTypes.node,
};

InfoItem.propTypes = {
  icon: PropTypes.node,
  title: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.node]),
  link: PropTypes.string,
};

UserDetailsModal.propTypes = {
  open: PropTypes.bool,
  user: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    firstSurName: PropTypes.string,
    secondSurName: PropTypes.string,
    avatar: PropTypes.string,
    instrument: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    carnet: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    grade: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    state: PropTypes.string,
    birthday: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    role: PropTypes.string,
  }),
  userRole: PropTypes.string,
  medicalRecord: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    identification: PropTypes.string,
    address: PropTypes.string,
    bloodType: PropTypes.string,
    sex: PropTypes.string,
    illness: PropTypes.string,
    medicine: PropTypes.string,
    medicineOnTour: PropTypes.string,
    allergies: PropTypes.string,
    familyMemberName: PropTypes.string,
    familyMemberNumberId: PropTypes.string,
    familyMemberRelationship: PropTypes.string,
    familyMemberNumber: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    familyMemberOccupation: PropTypes.string,
  }),
  canDeleteUser: PropTypes.bool,
  onClose: PropTypes.func,
  onConfirmDelete: PropTypes.func,
};
