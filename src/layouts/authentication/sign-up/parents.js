/**
=========================================================
* Banda CEDES Don Bosco - v4.0.0
=========================================================

* Product Page: https://Josué Chinchilla Salazar/product/soft-ui-dashboard-react
* Copyright 2022 Banda CEDES Don Bosco(https://Josué Chinchilla Salazar)

Coded by Josué Chinchilla Salazar

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

// react-router-dom components

// @mui material components

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LazyLoadImage } from "react-lazy-load-image-component";

// Banda CEDES Don Bosco components
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
// Authentication layout components

import * as yup from "yup";

import { gql, useMutation, useQuery } from "@apollo/client";
import InputField from "../components/InputField";
import MultiStepForm, { FormStep } from "../components/MultiStepForm";
import SelectField from "../components/SelectField";
import Header from "components/Header";
import cover from "../../../assets/images/sign-up.jpg";
import { NEW_PARENT } from "graphql/mutations";
import login from "../../../assets/images/log-in.png";
import loginerror from "../../../assets/images/loginerror.png";
import { GET_USERS } from "graphql/queries";
import CustomSelect from "components/CustomSelect";

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
  phone: yup.string().required("Campo obligatorio"),
});

const ParentSignUp = () => {
  // Use navigate to redirect user to sign in page
  const navigate = useNavigate();

  // State to show error message
  const [message, setMessage] = useState(null);

  //Bands

  // Create new account mutation
  const [newParent] = useMutation(NEW_PARENT);
  const defaultRole = "Padre/Madre de familia";

  const { data: usersData } = useQuery(GET_USERS);
  const [selectedUser, setSelectedUser] = useState("");

  const showMessage = () => {
    let imageSource = "";

    if (message && message.toLowerCase().includes("correctamente el usuario")) {
      imageSource = login;
    } else {
      imageSource = loginerror;
    }

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
            <img
              src={imageSource}
              alt="Banda CEDES Don Bosco"
              style={{ width: "60%", display: "block", margin: "0 auto", marginBottom: "1rem" }}
            />
            <p style={{ marginBottom: "1rem" }}>{message}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Header />
      <section className="relative py-20 overflow-hidden lg:py-24">
        <svg
          width="1728"
          height="894"
          viewBox="0 0 1728 894"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute inset-x-0 w-auto top-56 lg:inset-y-0"
        >
          <g clipPath="url(#clip0_8_95)">
            <g opacity="0.6" filter="url(#filter0_f_8_95)">
              <path
                d="M201.4 582.997H330V342.155L23 501.52L201.4 582.997Z"
                fill="#60A5FA"
                fillOpacity="0.45"
              />
              <path
                d="M330 342.155V284H90H-70L23 501.52L330 342.155Z"
                fill="#7DD3FC"
                fillOpacity="0.8"
              />
              <path
                d="M-70 582.997H201.4L23 501.52L-70 284V582.997Z"
                fill="#F0FDFA"
                fillOpacity="0.5"
              />
            </g>
          </g>
          <defs>
            <filter
              id="filter0_f_8_95"
              x="-370"
              y="-16"
              width="1000"
              height="898.997"
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
            >
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
              <feGaussianBlur stdDeviation="150" result="effect1_foregroundBlur_8_95" />
            </filter>
            <clipPath id="clip0_8_95">
              <rect width="1728" height="894" fill="white" />
            </clipPath>
          </defs>
        </svg>

        <div className="relative z-10 grid items-center max-w-screen-xl gap-16 px-5 mx-auto sm:px-6 lg:px-8 lg:grid-cols-2 lg:gap-8">
          <div className="flex flex-col items-center max-w-2xl mx-auto lg:items-start">
            <h1 className="text-5xl font-semibold text-center font-display text-slate-900 sm:text-6xl lg:text-left">
              <span className="relative whitespace-nowrap">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="249"
                  height="22"
                  viewBox="0 0 249 22"
                  fill="currentColor"
                  className="absolute top-2/3 left-0 h-[0.6em] w-full fill-sky-200/75"
                >
                  <path d="M247.564 18.5807C241.772 13.3568 232.473 12.7526 225.225 11.4427C217.124 9.97395 208.996 8.57031 200.846 7.46093C186.542 5.51302 172.169 4.08854 157.79 3.01562C126.033 0.645827 94.0929 0.0338481 62.3387 2.36979C42.1785 3.85416 22.008 5.90885 2.32917 10.8463C-0.0155171 11.4349 0.207047 14.6719 2.6889 14.7083C22.0261 14.9896 41.3866 12.6406 60.7109 11.8568C79.9471 11.0807 99.2274 10.6719 118.484 10.9557C142.604 11.3125 166.719 12.8333 190.722 15.5156C199.956 16.5469 209.195 17.6016 218.411 18.8255C227.864 20.0807 237.259 22 246.767 20.7422C247.709 20.6198 248.426 19.3568 247.564 18.5807Z" />
                </svg>
                <span className="relative">Registrarse </span>
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-center text-slate-700 lg:text-left mb-6">
              Ingrese los datos a continuación para ingresar al sistema.
            </p>

            {message && showMessage()}
            <div className="w-full max-w-lg">
              <MultiStepForm
                initialValues={{
                  name: "",
                  email: "",
                  firstSurName: "",
                  secondSurName: "",
                  password: "",
                  confirmPassword: "",
                  role: "",
                  phone: "",
                  children: [],
                }}
                onSubmit={async (values) => {
                  const { confirmPassword, ...inputValues } = values;

                  try {
                    inputValues.role = defaultRole;

                    const { data } = await newParent({
                      variables: {
                        input: {
                          ...inputValues,
                          children: selectedUser,
                        },
                      },
                    });
                    // User registered successfully
                    setMessage(`Se creó correctamente el usuario: ${data.newParent.name}`);

                    // Redirect to the login page
                    setTimeout(() => {
                      setMessage(null);
                      navigate("/autenticacion/iniciar-sesion");
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
                        <label
                          htmlFor="name"
                          className="block font-medium leading-6 text-md text-slate-900"
                        >
                          Nombre
                        </label>
                      </SoftBox>
                      <InputField name="name" placeholder="Nombre" />{" "}
                    </SoftBox>
                    <SoftBox mb={2}>
                      <SoftBox mb={1} ml={0.5}>
                        <label
                          htmlFor="name"
                          className="block font-medium leading-6 text-md text-slate-900"
                        >
                          Primer Apellido
                        </label>
                      </SoftBox>
                      <InputField name="firstSurName" placeholder="Primer Apellido" />{" "}
                    </SoftBox>
                    <SoftBox mb={2}>
                      <SoftBox mb={1} ml={0.5}>
                        <label
                          htmlFor="name"
                          className="block font-medium leading-6 text-md text-slate-900"
                        >
                          Segundo Apellido
                        </label>
                      </SoftBox>
                      <InputField name="secondSurName" placeholder="Segundo Apellido" />{" "}
                    </SoftBox>

                    <SoftBox mb={2}>
                      <SoftBox mb={1} ml={0.5}>
                        <label
                          htmlFor="name"
                          className="block font-medium leading-6 text-md text-slate-900"
                        >
                          Correo Electrónico
                        </label>
                      </SoftBox>
                      <InputField name="email" placeholder="Correo Electrónico" />{" "}
                    </SoftBox>

                    <SoftBox mb={2}>
                      <SoftBox mb={1} ml={0.5}>
                        <label
                          htmlFor="name"
                          className="block font-medium leading-6 text-md text-slate-900"
                        >
                          Contraseña
                        </label>
                      </SoftBox>
                      <InputField type="password" name="password" placeholder="Contraseña" />{" "}
                    </SoftBox>
                    <SoftBox mb={2}>
                      <SoftBox mb={1} ml={0.5}>
                        <label
                          htmlFor="name"
                          className="block font-medium leading-6 text-md text-slate-900"
                        >
                          Confirmar Contraseña
                        </label>
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
                      <CustomSelect
                        labelId="user-label"
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                        options={usersData?.getUsers.map((user) => ({
                          value: user.id,
                          label: `${user.name} ${user.firstSurName} ${user.secondSurName}`,
                        }))}
                      />
                      <SoftBox mb={1} ml={0.5}>
                        <label
                          htmlFor="name"
                          className="block font-medium leading-6 text-md text-slate-900"
                        >
                          Número de celular
                        </label>
                      </SoftBox>
                      <InputField name="phone" placeholder="Número de celular" />{" "}
                    </SoftBox>
                  </SoftBox>
                </FormStep>
              </MultiStepForm>
            </div>
          </div>

          <div className="w-full max-w-lg mx-auto lg:mr-0 hidden lg:block">
            <div className="relative aspect-h-5 aspect-w-4 rounded-2xl bg-slate-50">
              <LazyLoadImage
                className="object-cover object-center w-full h-full rounded-2xl"
                src={cover}
                alt=""
                sizes="(min-width: 552px) 32rem, calc(100vw - 40px)"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ParentSignUp;
