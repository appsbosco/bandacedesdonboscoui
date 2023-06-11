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
import "../../../styles.css";
import "../../../main.css";
import { LazyLoadImage } from "react-lazy-load-image-component";

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
import { useContext } from "react";
import UserContext from "UserContext";
import Header from "components/Header";
import cover from "../../../assets/images/about.jpg";
import { AUTH_USER } from "graphql/mutations";

const SignIn = () => {
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "viewport";
    meta.content = "width=device-width, initial-scale=1, maximum-scale=1";
    document.head.appendChild(meta);

    return () => {
      document.head.removeChild(meta);
    };
  }, []);
  const { refreshUserData } = useContext(UserContext);

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
                <span className="relative">Iniciar </span>
              </span>
              sesión{" "}
            </h1>
            <p className="mt-6 text-lg leading-8 text-center text-slate-700 lg:text-left mb-6">
              Ingrese los datos a continuación para ingresar al sistema.
            </p>

            {message && showMessage()}
            <div className="w-full max-w-lg">
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
                    setMessage(`Autenticado correctamente. Bienvenido! `);

                    // Save token in local storage
                    const { token } = data.authUser;
                    localStorage.setItem("token", token);

                    //  Redirect to the login page
                    setTimeout(() => {
                      setMessage(null);
                      navigate("/dashboard");
                    }, 2000);
                  } catch (error) {
                    setMessage(error.message.replace("GraphQL error: ", ""));
                    setTimeout(() => {
                      setMessage(null);
                    }, 4000);
                  }
                  refreshUserData();
                }}
              >
                {/*Account Details */}

                <FormStep stepName="Account Details" validationSchema={validationSchema}>
                  <div className="space-y-7">
                    <SoftBox component="form" role="form">
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
                          <SoftTypography component="label" variant="caption" fontWeight="bold">
                            Contraseña
                          </SoftTypography>
                        </SoftBox>
                        <InputField
                          className="block w-full px-4 py-4 leading-4 transition-colors duration-200 ease-in-out border-0 shadow-sm rounded-xl bg-slate-50 text-md text-slate-900 shadow-sky-100/50 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 hover:bg-white focus:border-0 focus:bg-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-sky-600/60"
                          type="password"
                          name="password"
                          placeholder="Contraseña"
                        />{" "}
                      </SoftBox>

                      <SoftTypography component="label" variant="caption" fontWeight="bold">
                        ¿No tienes una cuenta?{" "}
                        <a style={{ color: "#323C63" }} href="/authentication/sign-up">
                          Regístrate
                        </a>
                      </SoftTypography>
                    </SoftBox>
                  </div>
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

export default SignIn;
