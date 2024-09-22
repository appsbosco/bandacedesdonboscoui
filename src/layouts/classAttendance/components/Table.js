import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useMutation, useQuery } from "@apollo/client";
import { MARK_ATTENDANCE_AND_PAYMENT } from "graphql/mutations";
import { GET_INSTRUCTOR_STUDENTS_ATTENDANCE } from "graphql/queries";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const AttendanceTable = ({ students }) => {
  const [attendanceData, setAttendanceData] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { loading, error, data, refetch } = useQuery(GET_INSTRUCTOR_STUDENTS_ATTENDANCE, {
    variables: { date: selectedDate.toISOString() },
  });

  const [markAttendanceAndPayment, { loading: mutationLoading }] = useMutation(
    MARK_ATTENDANCE_AND_PAYMENT,
    {
      onCompleted: () => {
        refetch();
      },
      onError: (error) => {
        console.error("Error al guardar la asistencia y pago:", error);
      },
    }
  );

  useEffect(() => {
    if (data) {
      const initialData = {};
      data.getInstructorStudentsAttendance.forEach((record) => {
        initialData[record.student.id] = {
          attendanceStatus: record.attendanceStatus,
          paymentStatus: record.paymentStatus,
          justification: record.justification || "",
          isSaved: true,
        };
      });
      setAttendanceData(initialData);
    }
  }, [data]);

  useEffect(() => {
    refetch({ date: selectedDate.toISOString() });
  }, [selectedDate]);

  const handleAttendanceChange = (studentId, field, value) => {
    setAttendanceData({
      ...attendanceData,
      [studentId]: {
        ...attendanceData[studentId],
        [field]: value,
        isSaved: false,
      },
    });
  };

  const handleSave = async (studentId) => {
    const studentData = attendanceData[studentId] || {};

    // Establecer valores predeterminados si están indefinidos
    const attendanceStatus = studentData.attendanceStatus || "Presente";
    const paymentStatus = studentData.paymentStatus || "Pendiente";
    const justification = studentData.justification || "";

    try {
      await markAttendanceAndPayment({
        variables: {
          input: {
            studentId,
            attendanceStatus,
            justification,
            paymentStatus,
            date: selectedDate.toISOString(),
          },
        },
      });
      setAttendanceData({
        ...attendanceData,
        [studentId]: {
          ...attendanceData[studentId],
          isSaved: true,
        },
      });
    } catch (error) {
      console.error("Error al guardar la asistencia y pago:", error);
    }
  };

  if (loading) return <p>Cargando asistencia...</p>;
  if (error) return <p>Error al cargar la asistencia: {error.message}</p>;

  return (
    <div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Seleccionar Fecha</label>
        <DatePicker
          selected={selectedDate}
          onChange={(date) => setSelectedDate(date)}
          dateFormat="dd/MM/yyyy"
          className="mt-1 block w-full border border-gray-300 rounded-md p-2"
        />
      </div>

      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr>
            <th className="border border-gray-300 p-2">Estudiante</th>
            <th className="border border-gray-300 p-2">Asistencia</th>
            <th className="border border-gray-300 p-2">Justificación</th>
            <th className="border border-gray-300 p-2">Estado del Pago</th>
            <th className="border border-gray-300 p-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => {
            const studentData = attendanceData[student.id] || {};
            const isSaved = studentData.isSaved;

            return (
              <tr key={student.id}>
                <td className="border border-gray-300 p-2">
                  {student.name} {student.firstSurName} {student.secondSurName}
                </td>
                <td className="border border-gray-300 p-2">
                  <select
                    value={studentData.attendanceStatus || "Presente"}
                    onChange={(e) =>
                      handleAttendanceChange(student.id, "attendanceStatus", e.target.value)
                    }
                  >
                    <option value="Presente">Presente</option>
                    <option value="Ausencia Justificada">Ausencia Justificada</option>
                    <option value="Ausencia No Justificada">Ausencia No Justificada</option>
                  </select>
                </td>
                <td className="border border-gray-300 p-2">
                  <input
                    type="text"
                    value={studentData.justification || ""}
                    onChange={(e) =>
                      handleAttendanceChange(student.id, "justification", e.target.value)
                    }
                    disabled={studentData.attendanceStatus !== "Ausencia Justificada"}
                    placeholder="Justificación"
                    className={`border ${
                      studentData.attendanceStatus === "Ausencia Justificada" &&
                      !studentData.justification
                        ? "border-red-500"
                        : "border-gray-300"
                    } p-2 rounded-md`}
                  />
                </td>
                <td className="border border-gray-300 p-2">
                  <select
                    value={studentData.paymentStatus || "Pendiente"}
                    onChange={(e) =>
                      handleAttendanceChange(student.id, "paymentStatus", e.target.value)
                    }
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="Pagado">Pagado</option>
                    <option value="Becado">Becado</option>
                  </select>
                </td>
                <td className="border border-gray-300 p-2">
                  <button
                    onClick={() => handleSave(student.id)}
                    className={`bg-blue-500 text-white px-3 py-1 rounded ${
                      isSaved ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    disabled={isSaved || mutationLoading}
                  >
                    {isSaved ? "Guardado" : "Guardar"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

AttendanceTable.propTypes = {
  students: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      firstSurName: PropTypes.string.isRequired,
      secondSurName: PropTypes.string.isRequired,
    })
  ),
};

export default AttendanceTable;
