import React, { useState } from "react";
import { Link } from "react-router-dom";
import Header from "components/Header";
import Footer from "components/Footer";
import BlogHero from "./blog-hero-bg.svg";
import { useTranslation } from "react-i18next";

const articlesPerPage = 3;

const CalendarListing = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const { t } = useTranslation();

  // Calculate the index range of the articles to display on the current page
  const indexOfLastArticle = currentPage * articlesPerPage;

  return (
    <div>
      <Header />

      <section className="relative overflow-hidden bg-white lg:px-8">
        <div className="relative max-w-screen-xl px-5 py-16 mx-auto sm:px-6 lg:px-8 bg-slate-50 sm:py-24 lg:rounded-b-3xl lg:py-32">
          <img src={BlogHero} alt="" className="absolute inset-0 w-full h-full" />
          <div className="relative flex flex-col items-center justify-center">
            <h1 className="text-5xl font-semibold text-center font-display text-slate-900 sm:text-6xl">
              Bienvenidos a{" "}
              <span className="relative whitespace-nowrap">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="249"
                  height="22"
                  viewBox="0 0 249 22"
                  fill="currentColor"
                  className="absolute top-2/3 left-0 h-[0.6em] w-full scale-110 fill-sky-200/75"
                >
                  <path d="M247.564 18.5807C241.772 13.3568 232.473 12.7526 225.225 11.4427C217.124 9.97395 208.996 8.57031 200.846 7.46093C186.542 5.51302 172.169 4.08854 157.79 3.01562C126.033 0.645827 94.0929 0.0338481 62.3387 2.36979C42.1785 3.85416 22.008 5.90885 2.32917 10.8463C-0.0155171 11.4349 0.207047 14.6719 2.6889 14.7083C22.0261 14.9896 41.3866 12.6406 60.7109 11.8568C79.9471 11.0807 99.2274 10.6719 118.484 10.9557C142.604 11.3125 166.719 12.8333 190.722 15.5156C199.956 16.5469 209.195 17.6016 218.411 18.8255C227.864 20.0807 237.259 22 246.767 20.7422C247.709 20.6198 248.426 19.3568 247.564 18.5807Z" />
                </svg>
                <span className="relative"> {t("calendar.hero.title_suffix")}</span>
              </span>
            </h1>
            <p className="max-w-xl mx-auto mt-6 text-lg leading-8 text-center text-slate-700">
              {t("calendar.hero.description")}
            </p>
          </div>
        </div>
      </section>

      <section id="articles" className="py-16 overflow-hidden bg-white sm:py-24 lg:py-28">
        <div className="max-w-screen-xl px-5 mx-auto sm:px-6 lg:px-8">
          <h2 className="text-4xl font-semibold text-center font-display text-slate-900 sm:text-5xl">
            {t("calendar.upcoming.title")}
          </h2>

          <section className="bg-white  antialiased">
            <div className="max-w-screen-xl px-4 py-8 mx-auto lg:px-6 sm:py-16 lg:py-24">
              <div className=" flex items-center justify-center text-center">
                <p> No hay presentaciones próximas </p>
              </div>
              {/* <div className="flow-root max-w-3xl mx-auto mt-8 sm:mt-12 lg:mt-8">
                <div className="-my-4 divide-y divide-gray-200 ">
                  <div className="flex flex-col gap-2 py-4 sm:gap-6 sm:flex-row sm:items-center">
                    <p className=" text-lg font-normal text-gray-500 sm:text-right clipRule shrink-0">
                      04 de Noviembre - 5:00pm
                    </p>
                    <h3 className="text-lg font-semibold text-gray-900 ">
                      <a href="#" className="hover:underline">
                        Inauguración de de la Navidad / Multiplaza del Este / Banda de Marcha{" "}
                      </a>
                    </h3>
                  </div>
                  <div className="flex flex-col gap-2 py-4 sm:gap-6 sm:flex-row sm:items-center">
                    <p className="text-lg font-normal text-gray-500 sm:text-right clipRule shrink-0">
                      28 de Noviembre - 6:00pm
                    </p>
                    <h3 className="text-lg font-semibold text-gray-900 ">
                      <a href="#" className="hover:underline">
                        Cuento de Navidad-Colectivo de Arte Inclusivo Rompecabezas UNED / Auditorio
                        Nacional / Banda de Concierto{" "}
                      </a>
                    </h3>
                  </div>

                  <div className="flex flex-col gap-2 py-4 sm:gap-6 sm:flex-row sm:items-center">
                    <p className=" text-lg font-normal text-gray-500 sm:text-right clipRule shrink-0">
                      29 de Noviembre - 2:30pm
                    </p>
                    <h3 className="text-lg font-semibold text-gray-900 ">
                      <a href="#" className="hover:underline">
                        Edwards Lifesciences Zona Franca La Lima Cartago / Banda de Marcha{" "}
                      </a>
                    </h3>
                  </div>

                  <div className="flex flex-col gap-2 py-4 sm:gap-6 sm:flex-row sm:items-center">
                    <p className=" text-lg font-normal text-gray-500 sm:text-right clipRule shrink-0">
                      29 de Noviembre - 7:00pm
                    </p>
                    <h3 className="text-lg font-semibold text-gray-900 ">
                      <a href="#" className="hover:underline">
                        Velada Navideña Bailable Parroquia de Concepción de Alajuelita / Don Bosco
                        Big Band.
                      </a>
                    </h3>
                  </div>

                  <div className="flex flex-col gap-2 py-4 sm:gap-6 sm:flex-row sm:items-center">
                    <p className=" text-lg font-normal text-gray-500 sm:text-right clipRule shrink-0">
                      02 de Diciembre - 6:00pm
                    </p>
                    <h3 className="text-lg font-semibold text-gray-900 ">
                      <a href="#" className="hover:underline">
                        Festival Navideño Blanca Navidad Liberia, Guanacaste / Banda de Marcha
                      </a>
                    </h3>
                  </div>

                  <div className="flex flex-col gap-2 py-4 sm:gap-6 sm:flex-row sm:items-center">
                    <p className=" text-lg font-normal text-gray-500 sm:text-right clipRule shrink-0">
                      03 de Diciembre - 6:00pm
                    </p>
                    <h3 className="text-lg font-semibold text-gray-900 ">
                      <a href="#" className="hover:underline">
                        Festival Navideño Cañas, Guanacaste / Banda de Marcha{" "}
                      </a>
                    </h3>
                  </div>

                  <div className="flex flex-col gap-2 py-4 sm:gap-6 sm:flex-row sm:items-center">
                    <p className=" text-lg font-normal text-gray-500 sm:text-right clipRule shrink-0">
                      04 de Diciembre - 6:00pm
                    </p>
                    <h3 className="text-lg font-semibold text-gray-900 ">
                      <a href="#" className="hover:underline">
                        Festival Navideño Santa Cruz, Guanacaste / Banda de Marcha{" "}
                      </a>
                    </h3>
                  </div>

                  <div className="flex flex-col gap-2 py-4 sm:gap-6 sm:flex-row sm:items-center">
                    <p className=" text-lg font-normal text-gray-500 sm:text-right clipRule shrink-0">
                      06 de Diciembre - 11:30am
                    </p>
                    <h3 className="text-lg font-semibold text-gray-900 ">
                      <a href="#" className="hover:underline">
                        Mckinsey & Company Ultra Park, Heredia / Banda de Marcha{" "}
                      </a>
                    </h3>
                  </div>

                  <div className="flex flex-col gap-2 py-4 sm:gap-6 sm:flex-row sm:items-center">
                    <p className=" text-lg font-normal text-gray-500 sm:text-right clipRule shrink-0">
                      08 de Diciembre - 6:00pm
                    </p>
                    <h3 className="text-lg font-semibold text-gray-900 ">
                      <a href="#" className="hover:underline">
                        Festival Navideño Nicoya Brilla Guanacaste / Banda de Marcha{" "}
                      </a>
                    </h3>
                  </div>

                  <div className="flex flex-col gap-2 py-4 sm:gap-6 sm:flex-row sm:items-center">
                    <p className=" text-lg font-normal text-gray-500 sm:text-right clipRule shrink-0">
                      09 de Diciembre - 6:00pm
                    </p>
                    <h3 className="text-lg font-semibold text-gray-900 ">
                      <a href="#" className="hover:underline">
                        Festival Luces del Valle Pérez Zeledón, San José / Banda de Marcha{" "}
                      </a>
                    </h3>
                  </div>
                  <div className="flex flex-col gap-2 py-4 sm:gap-6 sm:flex-row sm:items-center">
                    <p className=" text-lg font-normal text-gray-500 sm:text-right clipRule shrink-0">
                      10 de Diciembre - 6:00pm
                    </p>
                    <h3 className="text-lg font-semibold text-gray-900 ">
                      <a href="#" className="hover:underline">
                        Festival Navideño Goicoechea, San José / Banda de Marcha{" "}
                      </a>
                    </h3>
                  </div>

                  <div className="flex flex-col gap-2 py-4 sm:gap-6 sm:flex-row sm:items-center">
                    <p className=" text-lg font-normal text-gray-500 sm:text-right clipRule shrink-0">
                      16 de Diciembre - 6:00pm
                    </p>
                    <h3 className="text-lg font-semibold text-gray-900 ">
                      <a href="#" className="hover:underline">
                        Festival de la Luz MSJ, San José / Banda de Marcha{" "}
                      </a>
                    </h3>
                  </div>

                  <div className="flex flex-col gap-2 py-4 sm:gap-6 sm:flex-row sm:items-center">
                    <p className=" text-lg font-normal text-gray-500 sm:text-right clipRule shrink-0">
                      17 de Diciembre - 9:00am
                    </p>
                    <h3 className="text-lg font-semibold text-gray-900 ">
                      <a href="#" className="hover:underline">
                        Fiesta Navideña, Obras del Espíritu Santo, Estadio Nacional / Banda de
                        Marcha{" "}
                      </a>
                    </h3>
                  </div>
                </div>
              </div> */}
            </div>
          </section>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CalendarListing;
