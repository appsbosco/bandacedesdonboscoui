/**
=========================================================
* BCDB React - v4.0.0
=========================================================

* Product Page: https://www.creative-tim.com/product/soft-ui-dashboard-react
* Copyright 2022 Banda CEDES Don Bosco(https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

// react-router-dom components

// @mui material components

import { useState } from "react";
import { useNavigate } from "react-router-dom";

// BCDB React components
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
// Authentication layout components
import CoverLayout from "layouts/authentication/components/CoverLayout";

// Images
import curved9 from "assets/images/curved-images/curved-6.jpg";
import * as yup from "yup";

import { gql, useMutation } from "@apollo/client";
import InputField from "../components/InputField";
import MultiStepForm, { FormStep } from "../components/MultiStepForm";
import SelectField from "../components/SelectField";

const validationSchema = yup.object().shape({
  name: yup.string().required("Campo obligatorio"),
  firstSurName: yup.string().required("Campo obligatorio"),
  secondSurName: yup.string().required("Campo obligatorio"),
  email: yup.string().email("Email no válido").required("Campo obligatorio"),
  password: yup.string().required("Campo obligatorio"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password"), null], "Las contraseñas deben coincidir")
    .required("Campo obligatorio"),
});

const validationSchemaGeneralDetails = yup.object().shape({
  //state: yup.string().required("Campo obligatorio"),
  role: yup.string().required("Campo obligatorio"),
  // instrument: yup.string().required("Campo obligatorio"),
  phone: yup.string().required("Campo obligatorio"),
  // birthday: yup.string().required("Campo obligatorio"),
});

const validationSchemaStudentDetails = yup.object().shape({
  //carnet: yup.string().required("Campo obligatorio"),
  // grade: yup.string().required("Campo obligatorio"),
});

const states = ["Estudiante Activo", "Exalumno"];
const roles = [
  "Integrante BCDB",
  "Principal de sección",
  "Asistente de sección",
  "Director",
  "Dirección Logística",
  "Staff",
  "Asistente Drumline",
  "Asistente Color Guard",
  "Asistente Danza",
  "Instructor de instrumento",
];

const instrument = [
  "No Aplica",
  "Flauta",
  "Clarinete",
  "Saxofón",
  "Trompeta",
  "Trombón",
  "Tuba",
  "Eufonio",
  "Corno Francés",
  "Mallets",
  "Percusión",
  "Color Guard",
  "Danza",
];

const grades = [
  "Tercero Primaria",
  "Cuarto Primaria",
  "Quinto Primaria",
  "Sexto Primaria",
  "Septimo",
  "Octavo",
  "Noveno",
  "Décimo",
  "Undécimo",
  "Duodécimo",
];

const options = ["Sí", "No"];

// Create new account mutation

const NEW_ACCOUNT = gql`
  mutation newUser($input: UserInput) {
    newUser(input: $input) {
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
      instrument
      avatar
    }
  }
`;

const SignUp = () => {
  // Use navigate to redirect user to sign in page
  const navigate = useNavigate();

  // State to show error message
  const [message, setMessage] = useState(null);

  // Create new account mutation
  const [newUser] = useMutation(NEW_ACCOUNT);

  const showMessage = () => {
    return (
      <div
        style={{
          backgroundColor: "#ffffff",
          padding: "10px",
          margin: "10px auto",
          maxWidth: "300px",
          textAlign: "center",
          boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
        }}
      >
        <p>{message}</p>
      </div>
    );
  };
  const [userAnswer, setUserAnswer] = useState("");

  const handleUserAnswerChange = (event) => {
    setUserAnswer(event.target.value);
  };
  return (
    <CoverLayout
      title="Registrarse"
      description="Ingrese los datos a continuación para registrarse en el sistema"
      image={curved9}
    >
      {message && showMessage()}

      <MultiStepForm
        initialValues={{
          name: "",
          email: "",
          firstSurName: "",
          secondSurName: "",
          password: "",
          confirmPassword: "",
          state: "",
          role: "",
          instrument: "",
          phone: "",
          birthday: "",
          carnet: "",
          grade: "",
        }}
        onSubmit={async (values) => {
          const {
            confirmPassword, // Exclude the confirmPassword field
            birthday, // Include the birthday field
            ...inputValues // Spread the rest of the values into a new object
          } = values;

          const dateParts = birthday.split("-");
          const day = parseInt(dateParts[2]);
          const month = new Date(birthday).toLocaleString("es-ES", { month: "long" });
          const year = parseInt(dateParts[0]);

          const formattedBirthday = `${day} de ${month} del ${year}`;
          try {
            const { data } = await newUser({
              variables: {
                input: {
                  ...inputValues,
                  birthday: formattedBirthday,
                },
              },
            });
            // User registered successfully
            setMessage(`Se creó correctamente el usuario: ${data.newUser.name}`);

            // Redirect to the login page
            setTimeout(() => {
              setMessage(null);
              navigate("/authentication/sign-in");
            }, 3000);
          } catch (error) {
            setMessage(error.message.replace("GraphQL error: ", ""));
            setTimeout(() => {
              setMessage(null);
            }, 4000);
          }
        }}
      >
        {/*Account Details */}

        <FormStep stepName="Account Details" validationSchema={validationSchema}>
          <SoftBox component="form" role="form">
            <SoftBox mb={2}>
              <SoftBox mb={1} ml={0.5}>
                <SoftTypography component="label" variant="caption" fontWeight="bold">
                  Nombre
                </SoftTypography>
              </SoftBox>
              <InputField name="name" placeholder="Nombre" />{" "}
            </SoftBox>
            <SoftBox mb={2}>
              <SoftBox mb={1} ml={0.5}>
                <SoftTypography component="label" variant="caption" fontWeight="bold">
                  Primer Apellido
                </SoftTypography>
              </SoftBox>
              <InputField name="firstSurName" placeholder="Primer Apellido" />{" "}
            </SoftBox>
            <SoftBox mb={2}>
              <SoftBox mb={1} ml={0.5}>
                <SoftTypography component="label" variant="caption" fontWeight="bold">
                  Segundo Apellido
                </SoftTypography>
              </SoftBox>
              <InputField name="secondSurName" placeholder="Segundo Apellido" />{" "}
            </SoftBox>

            <SoftBox mb={2}>
              <SoftBox mb={1} ml={0.5}>
                <SoftTypography component="label" variant="caption" fontWeight="bold">
                  Correo Electrónico
                </SoftTypography>
              </SoftBox>
              <InputField name="email" placeholder="Correo Electrónico" />{" "}
            </SoftBox>

            <SoftBox mb={2}>
              <SoftBox mb={1} ml={0.5}>
                <SoftTypography component="label" variant="caption" fontWeight="bold">
                  Contraseña
                </SoftTypography>
              </SoftBox>
              <InputField type="password" name="password" placeholder="Contraseña" />{" "}
            </SoftBox>
            <SoftBox mb={2}>
              <SoftBox mb={1} ml={0.5}>
                <SoftTypography component="label" variant="caption" fontWeight="bold">
                  Confirmar Contraseña
                </SoftTypography>
              </SoftBox>
              <InputField type="password" name="confirmPassword" placeholder="Contraseña" />{" "}
            </SoftBox>
          </SoftBox>
        </FormStep>

        {/* General Details */}
        <FormStep
          stepName="General Info"
          validationSchema={validationSchemaGeneralDetails}
          disabled={message === "User already registered"} // Disable the step if the error message is "User already registered"
        >
          <SoftBox component="form" role="form">
            <SoftBox mb={2}>
              <SoftBox mb={1} ml={0.5}>
                <SoftTypography component="label" variant="caption" fontWeight="bold">
                  ¿Es usted músico de la BCDB?
                </SoftTypography>
              </SoftBox>
              <SelectField
                label=""
                name="answer"
                options={options}
                value={userAnswer}
                onChange={handleUserAnswerChange}
              />
            </SoftBox>

            {userAnswer === "Sí" && (
              <>
                <SoftBox mb={2}>
                  <SoftBox mb={1} ml={0.5}>
                    <SoftTypography component="label" variant="caption" fontWeight="bold">
                      Estado
                    </SoftTypography>
                  </SoftBox>
                  <SelectField label="" name="state" options={states} />
                </SoftBox>
                <SoftBox mb={2}>
                  <SoftBox mb={1} ml={0.5}>
                    <SoftTypography component="label" variant="caption" fontWeight="bold">
                      Instrumento
                    </SoftTypography>
                  </SoftBox>
                  <SelectField label="" name="instrument" options={instrument} />
                </SoftBox>
              </>
            )}
            <SoftBox mb={2}>
              <SoftBox mb={1} ml={0.5}>
                <SoftTypography component="label" variant="caption" fontWeight="bold">
                  Rol
                </SoftTypography>
              </SoftBox>
              <SelectField label="" name="role" options={roles} />
            </SoftBox>

            <SoftBox mb={2}>
              <SoftBox mb={1} ml={0.5}>
                <SoftTypography component="label" variant="caption" fontWeight="bold">
                  Número de celular
                </SoftTypography>
              </SoftBox>
              <InputField name="phone" placeholder="Número de celular" />{" "}
            </SoftBox>
            <SoftBox mb={2}>
              <SoftBox mb={1} ml={0.5}>
                <SoftTypography component="label" variant="caption" fontWeight="bold">
                  Fecha de nacimiento
                </SoftTypography>
              </SoftBox>
              <InputField type="date" name="birthday" placeholder="Fecha de nacimiento" />{" "}
            </SoftBox>
          </SoftBox>
        </FormStep>

        {/* Student Details */}
        <FormStep stepName="Student Details" validationSchema={validationSchemaStudentDetails}>
          <SoftBox component="form" role="form">
            <SoftBox mb={2}>
              <SoftBox mb={1} ml={0.5}>
                <SoftTypography component="label" variant="text" fontWeight="bold">
                  Los siguientes campos son para estudiantes activos del colegio. De no ser
                  estudiante, puede avanzar.
                </SoftTypography>
              </SoftBox>
              <SoftBox mb={1} ml={0.5}>
                <SoftTypography component="label" variant="caption" fontWeight="bold">
                  Carnet Institucional
                </SoftTypography>
              </SoftBox>
              <InputField name="carnet" placeholder="Carnet" />{" "}
            </SoftBox>
            <SoftBox mb={2}>
              <SoftBox mb={1} ml={0.5}>
                <SoftTypography component="label" variant="caption" fontWeight="bold">
                  Año lectivo
                </SoftTypography>
              </SoftBox>
              <SelectField label="" name="grade" options={grades} />
            </SoftBox>
          </SoftBox>
        </FormStep>
      </MultiStepForm>
    </CoverLayout>
  );
};

export default SignUp;
