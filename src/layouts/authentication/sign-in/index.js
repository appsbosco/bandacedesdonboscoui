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

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// react-router-dom components

// @mui material components

// BCDB React components
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
// Authentication layout components
import CoverLayout from "layouts/authentication/components/CoverLayout";

// Images
import { gql, useMutation } from "@apollo/client";
import curved9 from "assets/images/curved-images/curved-6.jpg";
import * as yup from "yup";
import InputField from "../components/InputField";
import MultiStepForm, { FormStep } from "../components/MultiStepForm";

const AUTH_USER = gql`
  mutation authUser($input: AuthInput) {
    authUser(input: $input) {
      token
    }
  }
`;

const SignIn = () => {
  // Use navigate to redirect user to sign in page
  const navigate = useNavigate();

  // State to show error message
  const [message, setMessage] = useState(null);

  // Mutation to authenticate user
  const [authUser] = useMutation(AUTH_USER);

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

  const validationSchema = yup.object().shape({
    email: yup.string().email("Email no válido").required("Campo obligatorio"),
    password: yup.string().required("Campo obligatorio"),
  });

  useEffect(() => {
    let timeoutId = null;
    if (message) {
      timeoutId = setTimeout(() => {
        setMessage(null);
      }, 4000);
    }

    return () => {
      clearTimeout(timeoutId);
    };
  }, [message]);

  return (
    <CoverLayout
      title="Iniciar Sesión"
      description="Ingrese los datos a continuación para ingresar al sistema."
      image={curved9}
    >
      {message && showMessage()}

      <MultiStepForm
        initialValues={{
          email: "",
          password: "",
        }}
        onSubmit={async (values) => {
          try {
            const { email, password } = values;

            // Authenticate user
            const { data } = await authUser({
              variables: {
                input: {
                  email,
                  password,
                },
              },
            });

            // User registered successfully
            setMessage(`Autenticado correctamente: Bienvenido! `);

            // Save token in local storage
            const { token } = data.authUser;
            localStorage.setItem("token", token);

            //  Redirect to the login page
            setTimeout(() => {
              setMessage(null);
              navigate("/");
            }, 2000);
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
            <SoftTypography component="label" variant="caption" fontWeight="bold">
              ¿No tienes una cuenta?{" "}
              <a style={{ color: "#323C63" }} href="/authentication/sign-up">
                Regístrate
              </a>
            </SoftTypography>
          </SoftBox>
        </FormStep>
      </MultiStepForm>
    </CoverLayout>
  );
};

export default SignIn;
