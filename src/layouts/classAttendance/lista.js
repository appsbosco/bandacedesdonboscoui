import React, { useEffect, useState } from "react";
import Footer from "examples/Footer";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { useMutation, useQuery } from "@apollo/client";
import { ASSIGN_STUDENT_TO_INSTRUCTOR } from "graphql/mutations";
import CustomSelect from "components/CustomSelect";
import AttendanceTable from "./components/Table";
import { GET_USERS_BY_ID } from "graphql/queries";
import { GET_USERS } from "graphql/queries";

const ClassAttendance = () => {
  const [selectedStudent, setSelectedStudent] = useState("");
  const [students, setFilteredStudents] = useState([]);
  const [assignedStudents, setAssignedStudents] = useState([]);
  const [message, setMessage] = useState("");

  // Obtener el instructor autenticado
  const { loading: userLoading, error: userError, data: userData } = useQuery(GET_USERS_BY_ID);

  // Obtener todos los usuarios (estudiantes e instructores)
  const { loading: usersLoading, error: usersError, data: usersData } = useQuery(GET_USERS);

  // Mutation para asignar estudiante
  const [assignStudentToInstructor, { loading: assignLoading, error: assignError }] = useMutation(
    ASSIGN_STUDENT_TO_INSTRUCTOR,
    {
      refetchQueries: [{ query: GET_USERS }, { query: GET_USERS_BY_ID }],
    }
  );

  // Filtrar los estudiantes por instrumento una vez que se tenga la data del instructor
  useEffect(() => {
    if (usersData && userData) {
      const instructor = userData.getUser;
      const allUsers = usersData.getUsers;

      // Filtrar estudiantes que tocan el mismo instrumento y no son instructores
      // const studentsWithSameInstrument = allUsers.filter(
      //   (user) =>
      //     user.instrument === instructor.instrument &&
      //     user.role !== "Instructor de instrumento" &&
      //     !instructor.students.some((student) => student.id === user.id)
      // );
      const studentsWithSameInstrument = allUsers.filter(
        (user) =>
          user.role !== "Instructor de instrumento" &&
          user.role !== "Staff" &&
          user.role !== "Director" &&
          user.role !== "Dirección Logística" &&
          !instructor.students.some((student) => student.id === user.id)
      );

      setFilteredStudents(studentsWithSameInstrument);
      setAssignedStudents(instructor.students);
    }
  }, [usersData, userData]);

  const showMessage = () => {
    return (
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: "9999",
          backgroundColor: "#ffffff",
          padding: "20px",
          textAlign: "center",
          boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
          borderRadius: "8px",
          maxWidth: "90%",
          width: "400px",
        }}
      >
        <div className="container">
          <div className="content" id="popup">
            <p style={{ marginBottom: "1rem" }}>{message}</p>
          </div>
        </div>
      </div>
    );
  };

  const handleAssign = async () => {
    try {
      await assignStudentToInstructor({
        variables: { studentId: selectedStudent },
      });

      setMessage(`¡Estudiante asignado correctamente!`);
      setSelectedStudent("");
      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (err) {
      console.error(err);
      setMessage(`Error al asignar estudiante: ${err.message}`);
    }
  };

  // Manejamos los estados de carga y errores de ambas consultas
  if (userLoading || usersLoading) return <p>Cargando...</p>;
  if (userError) return <p>Error al cargar el usuario: {userError.message}</p>;
  if (usersError) return <p>Error al cargar los usuarios: {usersError.message}</p>;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <div className="p-6 page-content">
        <div className="flex items-center justify-between w-full mb-6">
          <h4 className="text-xl font-medium">Mis estudiantes</h4>
        </div>
        <div className="grid gap-6">
          <div className="xl:col-span-9">
            <div className="space-y-6">
              {message && showMessage()}

              <label className="block text-sm font-medium text-gray-700">Asignar estudiante</label>
              <CustomSelect
                labelId="student-label"
                name="studentId"
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                options={students.map((student) => ({
                  value: student.id,
                  label: `${student.name} ${student.firstSurName} ${student.secondSurName}`,
                }))}
                required
              />

              <button
                type="submit"
                className="relative z-10 w-full inline-flex items-center justify-center rounded-full border border-primary bg-white px-6 py-3 text-center text-sm font-medium text-black shadow-sm transition-all duration-500 hover:bg-black hover:text-white"
                onClick={handleAssign}
                disabled={!selectedStudent}
              >
                {assignLoading ? "Procesando..." : "Asignar estudiante"}
              </button>

              <AttendanceTable students={assignedStudents} />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </DashboardLayout>
  );
};

export default ClassAttendance;
