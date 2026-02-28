import PropTypes from "prop-types";
import React, { useEffect, useState, useRef } from "react";
import Footer from "examples/Footer";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { useMutation, useQuery } from "@apollo/client";
import { ASSIGN_STUDENT_TO_INSTRUCTOR, REMOVE_STUDENT_FROM_INSTRUCTOR } from "graphql/mutations";
import AttendanceTable from "./components/Table";
import { GET_USERS_BY_ID, GET_USERS } from "graphql/queries";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const safeStr = (v) => (typeof v === "string" ? v : "");
const getFullName = (u) =>
  [safeStr(u?.name), safeStr(u?.firstSurName), safeStr(u?.secondSurName)]
    .filter(Boolean)
    .join(" ")
    .trim() || "Sin nombre";

const AVATAR_PAIRS = [
  ["bg-slate-800", "text-red-400"],
  ["bg-blue-900", "text-blue-300"],
  ["bg-indigo-900", "text-violet-300"],
  ["bg-emerald-900", "text-emerald-300"],
  ["bg-rose-900", "text-rose-300"],
  ["bg-violet-900", "text-yellow-300"],
  ["bg-amber-900", "text-amber-300"],
];

const avatarColors = (str = "") => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_PAIRS[Math.abs(h) % AVATAR_PAIRS.length];
};

const getInitials = (u) =>
  (safeStr(u?.name).charAt(0) + safeStr(u?.firstSurName).charAt(0)).toUpperCase() || "?";

const userShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  name: PropTypes.string,
  firstSurName: PropTypes.string,
  secondSurName: PropTypes.string,
  instrument: PropTypes.string,
  role: PropTypes.string,
});

// ─────────────────────────────────────────────
// Avatar
// ─────────────────────────────────────────────
const Avatar = ({ user, size = "md" }) => {
  const [bg, text] = avatarColors(getFullName(user));
  const sz =
    size === "sm" ? "w-7 h-7 text-xs" : size === "lg" ? "w-11 h-11 text-sm" : "w-9 h-9 text-xs";

  return (
    <div
      className={`${sz} ${bg} ${text} rounded-full flex items-center justify-center font-bold flex-shrink-0 select-none`}
    >
      {getInitials(user)}
    </div>
  );
};

Avatar.propTypes = {
  user: userShape,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
};

// ─────────────────────────────────────────────
// StudentSearchDropdown
// ─────────────────────────────────────────────
const StudentSearchDropdown = ({ students, value, onChange }) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const selected = students.find((s) => s.id === value);
  const filtered = students.filter((s) =>
    getFullName(s).toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={wrapRef} className="relative flex-1 min-w-0">
      <div
        className={`flex items-center min-h-[44px] rounded-xl border bg-white transition-all
          ${
            open && !selected
              ? "border-gray-900 ring-2 ring-gray-900/10"
              : "border-gray-300 hover:border-gray-400"
          }`}
      >
        {selected ? (
          <div className="flex items-center gap-2.5 px-3 py-1.5 w-full">
            <Avatar user={selected} size="sm" />
            <span className="text-sm font-medium text-gray-800 flex-1 truncate">
              {getFullName(selected)}
            </span>
            {selected.instrument && (
              <span className="text-xs text-gray-400 hidden sm:block mr-1">
                {selected.instrument}
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                onChange("");
                setQuery("");
              }}
              className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors text-base leading-none"
            >
              ×
            </button>
          </div>
        ) : (
          <input
            autoComplete="off"
            type="text"
            className="flex-1 px-4 py-2.5 text-sm bg-transparent outline-none placeholder-gray-400 text-gray-800 min-w-0"
            placeholder="Buscar estudiante por nombre..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
          />
        )}
      </div>

      {open && !selected && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-2xl shadow-gray-200/80 z-50 max-h-60 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-gray-400">
              No se encontraron estudiantes
            </p>
          ) : (
            <div className="py-1.5 px-1.5 space-y-0.5">
              {filtered.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onChange(s.id);
                    setQuery("");
                    setOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left"
                >
                  <Avatar user={s} size="sm" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-gray-800 truncate">
                      {getFullName(s)}
                    </span>
                    {s.instrument && <span className="text-xs text-gray-400">{s.instrument}</span>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

StudentSearchDropdown.propTypes = {
  students: PropTypes.arrayOf(userShape).isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
};

StudentSearchDropdown.defaultProps = {
  value: "",
};

// ─────────────────────────────────────────────
// StudentCard
// ─────────────────────────────────────────────
const StudentCard = ({ student, onRemove, removing }) => {
  const [confirm, setConfirm] = useState(false);

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all
        ${
          removing
            ? "opacity-40 pointer-events-none"
            : "border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300 hover:shadow-sm"
        }`}
    >
      <Avatar user={student} size="md" />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{getFullName(student)}</p>
        {student.instrument && <p className="text-xs text-gray-400">{student.instrument}</p>}
      </div>

      {removing ? (
        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin flex-shrink-0" />
      ) : !confirm ? (
        <button
          type="button"
          onClick={() => setConfirm(true)}
          className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
          <span className="hidden sm:inline">Quitar</span>
        </button>
      ) : (
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-gray-500 hidden sm:block">¿Desasignar?</span>
          <button
            type="button"
            onClick={() => {
              setConfirm(false);
              onRemove(student.id);
            }}
            className="px-3 py-1 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
          >
            Sí
          </button>
          <button
            type="button"
            onClick={() => setConfirm(false)}
            className="px-3 py-1 text-xs font-semibold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            No
          </button>
        </div>
      )}
    </div>
  );
};

StudentCard.propTypes = {
  student: userShape.isRequired,
  onRemove: PropTypes.func.isRequired,
  removing: PropTypes.bool,
};

StudentCard.defaultProps = {
  removing: false,
};

// ─────────────────────────────────────────────
// Toast
// ─────────────────────────────────────────────
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <>
      <style>{`@keyframes toastIn{from{transform:translateX(16px);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
      <div
        style={{ animation: "toastIn 0.25s ease-out" }}
        className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-white text-sm font-medium max-w-xs
          ${type === "success" ? "bg-gray-900" : "bg-red-600"}`}
      >
        {type === "success" ? (
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        )}
        <span className="flex-1">{message}</span>
        <button
          type="button"
          onClick={onClose}
          className="opacity-60 hover:opacity-100 text-lg leading-none"
        >
          ×
        </button>
      </div>
    </>
  );
};

Toast.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(["success", "error"]).isRequired,
  onClose: PropTypes.func.isRequired,
};

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
const ClassAttendance = () => {
  const [selectedStudent, setSelectedStudent] = useState("");
  const [availableStudents, setAvailableStudents] = useState([]);
  const [assignedStudents, setAssignedStudents] = useState([]);
  const [toast, setToast] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  const showToast = (message, type = "success") => setToast({ message, type });

  const { loading: userLoading, error: userError, data: userData } = useQuery(GET_USERS_BY_ID);
  const { loading: usersLoading, error: usersError, data: usersData } = useQuery(GET_USERS);

  const [assignStudentToInstructor, { loading: assignLoading }] = useMutation(
    ASSIGN_STUDENT_TO_INSTRUCTOR,
    { refetchQueries: [{ query: GET_USERS }, { query: GET_USERS_BY_ID }] }
  );

  const [removeStudentFromInstructor] = useMutation(REMOVE_STUDENT_FROM_INSTRUCTOR, {
    refetchQueries: [{ query: GET_USERS }, { query: GET_USERS_BY_ID }],
  });

  useEffect(() => {
    if (!usersData || !userData) return;

    const instructor = userData.getUser;
    const allUsers = usersData.getUsers;

    const EXCLUDED = [
      "Instructor de instrumento",
      "Staff",
      "Director",
      "Dirección Logística",
      "Admin",
    ];

    const assignedIds = new Set((instructor.students || []).map((s) => s.id));

    setAvailableStudents(
      allUsers.filter(
        (u) => !EXCLUDED.includes(u.role) && u.name && u.firstSurName && !assignedIds.has(u.id)
      )
    );

    setAssignedStudents((instructor.students || []).filter((s) => s?.name && s?.firstSurName));
  }, [usersData, userData]);

  const handleAssign = async () => {
    if (!selectedStudent) return;

    try {
      await assignStudentToInstructor({ variables: { studentId: selectedStudent } });

      const student = availableStudents.find((s) => s.id === selectedStudent);
      if (student) {
        setAssignedStudents((p) => [...p, student]);
        setAvailableStudents((p) => p.filter((s) => s.id !== selectedStudent));
      }

      setSelectedStudent("");
      showToast("Estudiante asignado correctamente");
    } catch (err) {
      showToast(`Error: ${err.message}`, "error");
    }
  };

  const handleRemove = async (studentId) => {
    setRemovingId(studentId);

    try {
      await removeStudentFromInstructor({ variables: { studentId } });

      const student = assignedStudents.find((s) => s.id === studentId);
      if (student) {
        setAssignedStudents((p) => p.filter((s) => s.id !== studentId));
        setAvailableStudents((p) => [...p, student]);
      }

      showToast("Estudiante desasignado");
    } catch (err) {
      showToast(`Error: ${err.message}`, "error");
    } finally {
      setRemovingId(null);
    }
  };

  if (userLoading || usersLoading) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <div className="flex flex-col items-center justify-center gap-4 py-28 text-gray-400">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
          <span className="text-sm">Cargando...</span>
        </div>
        <Footer />
      </DashboardLayout>
    );
  }

  if (userError || usersError) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <div className="flex items-center justify-center py-28">
          <p className="text-sm text-red-500">Error: {(userError || usersError).message}</p>
        </div>
        <Footer />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-16 space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Mis estudiantes</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {assignedStudents.length} estudiante{assignedStudents.length !== 1 ? "s" : ""} asignado
            {assignedStudents.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Assign */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-700">
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Asignar estudiante</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Selecciona un estudiante para añadirlo a tu lista
              </p>
            </div>
          </div>

          <div className="flex gap-2.5 items-start flex-wrap sm:flex-nowrap">
            <StudentSearchDropdown
              students={availableStudents}
              value={selectedStudent}
              onChange={setSelectedStudent}
            />

            <button
              type="button"
              onClick={handleAssign}
              disabled={!selectedStudent || assignLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 w-full sm:w-auto justify-center"
            >
              {assignLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                  Asignando...
                </>
              ) : (
                <>
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Asignar
                </>
              )}
            </button>
          </div>
        </div>

        {/* Assigned list */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-600">
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Estudiantes asignados</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Gestiona tu lista — eliminar cuentas es exclusivo del Admin
              </p>
            </div>
          </div>

          {assignedStudents.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-gray-400">
              <svg
                width="44"
                height="44"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
                className="opacity-30"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
              <p className="text-sm font-medium text-gray-500">Sin estudiantes asignados</p>
              <span className="text-xs text-gray-400">Usa el buscador de arriba para comenzar</span>
            </div>
          ) : (
            <div className="space-y-2">
              {assignedStudents.map((student) => (
                <StudentCard
                  key={student.id}
                  student={student}
                  onRemove={handleRemove}
                  removing={removingId === student.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* Attendance table */}
        {assignedStudents.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <AttendanceTable students={assignedStudents} />
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <Footer />
    </DashboardLayout>
  );
};

export default ClassAttendance;
