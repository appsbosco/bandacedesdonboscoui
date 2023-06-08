import React from "react";

import tour from "../assets/images/tour.JPG";
import Header from "./Header";
import Footer from "components/Footer";
import about from "../assets/images/about-hero-bg.svg";
import aboutHero from "../assets/images/about.jpg";

const About = () => {
  return (
    <>
      <Header />
      <section className="relative bg-slate-50/50">
        <img
          src={about}
          alt=""
          className="absolute inset-0 object-cover object-left w-full h-full lg:w-2/3"
        />

        <div className="relative max-w-screen-xl px-5 py-16 mx-auto sm:py-24 lg:py-32 sm:px-6 lg:px-8">
          <div className="max-w-3xl px-4 mx-auto sm:px-6 lg:mx-0 lg:w-2/3 lg:max-w-none lg:px-8 lg:pr-16">
            <h1 className="text-5xl font-semibold font-display text-slate-900 sm:text-6xl">
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
                <span className="relative">Historia </span>
              </span>
              y versatilidad de la Banda CEDES Don Bosco
            </h1>
            <p className="mt-8 text-lg leading-8 text-slate-700">
              La Banda de CEDES Don Bosco (BCDB) está formada por alumnos y exalumnos de CEDES Don
              Bosco, con edades comprendidas entre los 9 y los 24 años. Está integrada
              principalmente por estudiantes de la Escuela San Juan Bosco y el Colegio Técnico
              Profesional Don Bosco.
            </p>
            <p className="mt-6 text-lg leading-8 text-slate-700">
              Fundada en 1965 en el barrio Don Bosco, actualmente CEDES Don Bosco se encuentra
              ubicado en Concepción Arriba de Alajuelita. La BCDB ha participado en diversos
              festivales a nivel nacional e internacional, destacando su presencia en países como El
              Salvador, Panamá y Estados Unidos.
            </p>
          </div>
        </div>

        <div className="bg-picton-blue-25 relative h-96 w-full md:h-[600px] lg:absolute lg:inset-y-0 lg:right-0 lg:h-full lg:w-1/3">
          <img
            src={aboutHero}
            alt=""
            className="absolute inset-0 object-cover object-top w-full h-full"
          />
          <svg
            width="229"
            height="40"
            viewBox="0 0 229 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute left-0 w-auto h-8 -translate-x-1/2 bottom-16 mt-14 sm:mt-20 sm:h-10"
          >
            <g clipPath="url(#clip0_204_150)">
              <path
                d="M1 19L29.4 39L57.7 19L86.1 39L114.5 19L142.8 39L171.2 19L199.6 39L228 19"
                stroke="#0369A1"
                strokeWidth="2"
                strokeMiterlimit="10"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M1 19L29.4 39L57.7 19L86.1 39L114.5 19L142.8 39L171.2 19L199.6 39L228 19"
                stroke="black"
                strokeOpacity="0.2"
                strokeWidth="2"
                strokeMiterlimit="10"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M1 1L29.4 21L57.7 1L86.1 21L114.5 1L142.8 21L171.2 1L199.6 21L228 1"
                stroke="#BAE6FD"
                strokeWidth="2"
                strokeMiterlimit="10"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
            <defs>
              <clipPath id="clip0_204_150">
                <rect width="229" height="40" fill="white" />
              </clipPath>
            </defs>
          </svg>
        </div>
      </section>

      <section className="py-16 overflow-hidden bg-white sm:py-24 lg:py-32">
        <div className="max-w-screen-xl px-5 mx-auto sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-y-16 gap-x-8 sm:gap-y-20 lg:grid-cols-2">
            <div className="lg:order-2">
              <div className="max-w-2xl mx-auto lg:mx-0">
                <h2 className="text-4xl font-semibold font-display text-slate-900 sm:text-5xl">
                  Nuestra trayectoria
                  <span className="relative whitespace-nowrap">
                    <svg
                      width="329"
                      height="31"
                      viewBox="0 0 329 31"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="absolute top-[70%] left-1/2 h-[0.62em] w-auto -translate-x-1/2 fill-sky-200/90"
                    >
                      <mask
                        id="mask0_239_1189"
                        style={{ maskType: "luminance" }}
                        maskUnits="userSpaceOnUse"
                        x="0"
                        y="0"
                        width="329"
                        height="31"
                      >
                        <path
                          d="M0.147461 0.918457H328.121V30.1173H0.147461V0.918457Z"
                          fill="white"
                        />
                      </mask>
                      <g mask="url(#mask0_239_1189)">
                        <path d="M270.105 20.3507C253.379 18.442 236.624 16.7484 219.848 15.2738C229.174 15.8156 238.495 16.3968 247.81 17.0606C247.836 17.0606 247.86 17.0642 247.883 17.0642C255.302 18.0796 262.713 19.1667 270.105 20.3507ZM156.373 6.05272C158.594 6.05272 160.812 6.04913 163.033 6.06348C169.547 6.10295 176.056 6.19982 182.566 6.34334C179.715 6.32181 176.867 6.29311 174.02 6.26799C169.368 6.22853 164.72 6.21059 160.068 6.19623C158.835 6.14242 157.604 6.09577 156.373 6.05272ZM84.3602 5.72621C100.973 4.66059 117.611 4.05063 134.252 3.89635C117.603 4.20491 100.975 4.84357 84.3602 5.72621ZM163.46 10.3583C154.324 10.0533 145.184 9.83802 136.042 9.6658C128.219 9.30341 120.391 8.97691 112.563 8.69704C119.414 8.59658 126.263 8.52482 133.112 8.47818C156.739 8.73651 180.358 9.9636 203.899 12.0769C190.42 11.3737 176.935 10.8068 163.46 10.3583ZM327.139 22.9484C305.186 20.096 283.134 17.8105 261.033 15.9555C240.91 12.9416 220.683 10.5377 200.396 8.79392C216.731 9.01996 233.09 9.41105 249.412 10.1968C260.803 11.5531 272.171 13.1102 283.502 14.9042C285.249 15.1805 285.777 13.2968 283.989 13.0134C281.621 12.6402 279.245 12.3101 276.874 11.9549C290.335 13.2466 303.779 14.7392 317.193 16.4506C319.3 16.7197 319.603 14.4844 317.512 14.1795C304.748 12.2994 291.913 10.9036 279.037 9.83802C261.243 8.09068 243.41 6.72366 225.554 5.71903C164.598 0.0608174 103.074 0.505725 42.18 7.15422C31.7917 7.49508 21.5097 8.49971 11.6034 10.8426C9.98643 11.2266 9.96311 12.2527 10.7275 12.877C10.2792 12.938 9.83355 13.0026 9.38785 13.0672C7.00132 13.3793 4.61997 13.713 2.24122 14.079C-0.793126 14.549 -0.15568 17.8069 2.87348 17.3476C44.6805 10.9754 87.848 10.8355 130.458 11.8365C142.142 12.3532 153.821 12.9667 165.492 13.7058C217.335 16.9852 268.968 22.3851 320.337 29.6507C322.697 29.988 324.089 27.4226 321.345 26.8414C310.086 24.4661 298.772 22.2811 287.425 20.2718C287.71 20.2969 287.995 20.322 288.283 20.3472C295.025 20.9607 301.76 21.6173 308.497 22.299C311.936 22.647 315.377 22.9735 318.818 23.3036C320.298 23.4436 321.78 23.5907 323.259 23.7342C323.384 23.8347 323.542 23.9064 323.718 23.9172C324.944 23.9925 326.164 24.0679 327.385 24.1396C328.47 24.2042 327.921 23.0489 327.139 22.9484Z" />
                      </g>
                    </svg>

                    <span className="relative text-sky-700">por el tiempo</span>
                  </span>
                </h2>
                <p className="mt-6 text-lg leading-8 text-slate-700">
                  Desde su creación en 1965, la Banda ha participado en diversos festivales a nivel
                  nacional e internacional, en países como El Salvador, Panamá y Estados Unidos. A
                  nivel nacional, hemos formado parte de 17 ediciones del Festival de la Luz de la
                  Municipalidad de San José, ganando la categoría `Mejor Banda Colegial` en la
                  edición de 2007.
                </p>

                <p className="mt-6 text-lg leading-8 text-slate-700">
                  Gracias a nuestro profesionalismo, hemos tenido el honor de participar en eventos
                  de gran relevancia en el país, como la Inauguración del Estadio Nacional, los
                  Juegos Centroamericanos y del Caribe, el Campeonato Centroamericano y del Caribe
                  de Atletismo NACAC, el desfile del 120 Aniversario del Teatro Nacional, el
                  traspaso de poderes del segundo mandato del presidente Oscar Arias, el Festival
                  Estudiantil de las Artes (FEA) y muchos otros.
                </p>
                <p className="mt-6 text-lg leading-8 text-slate-700">
                  La Banda de CEDES Don Bosco se destaca por su versatilidad en cuanto a repertorios
                  y formatos de presentación. Actualmente, podemos presentarnos como Banda de
                  Concierto (55 integrantes), Banda de Marcha (200 integrantes) y Big Band (22
                  integrantes). Además, cada año formamos una Banda Inicial con nuevos prospectos
                  que se integran a la banda de marcha. Actualmente, contamos con una Banda Inicial
                  de 35 músicos en proceso de formación.
                </p>
              </div>
            </div>

            <div className="relative w-full max-w-xl pb-24 mx-auto lg:order-1 lg:mx-0 lg:max-w-none">
              <div className="relative w-full max-w-lg mx-auto lg:mr-auto lg:ml-0">
                <div className="aspect-w-5 aspect-h-7">
                  <img
                    src={tour}
                    alt=""
                    className="object-cover object-left w-full h-full rounded-2xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default About;
