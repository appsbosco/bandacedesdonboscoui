import React, { useState } from "react";
import Modal from "./Modal";
import Footer from "components/Footer";
import apoyo from "../../assets/images/apoyo.JPG";
import Header from "components/Header";

const Apoyo = () => {
  const [isModalOpen, setModalOpen] = useState(false);

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  return (
    <div>
      <Header openModal={handleOpenModal} />

      <div className=" w-screen">{isModalOpen && <Modal onClose={handleCloseModal} />}</div>

      <section
        className={`pt-16 overflow-hidden bg-white sm:pt-20 lg:pt-28 ${
          isModalOpen ? "bg-black opacity-5" : ""
        } `}
      >
        {/* <!-- Container --> */}
        <div className="max-w-screen-xl px-5 mx-auto sm:px-6 lg:px-8">
          <div className="max-w-lg mx-auto sm:max-w-3xl lg:mx-0 lg:max-w-none">
            <h1 className="text-4xl font-semibold leading-tight font-display text-slate-900 sm:text-5xl sm:leading-tight lg:text-6xl lg:leading-tight">
              Grupo de apoyo a la Banda CEDES Don Bosco
            </h1>

            {/* <!-- Tags list --> */}
            {/* <ul className="flex flex-wrap items-center gap-4 mt-8 sm:gap-6">
              <li>
                <a
                  href="#0"
                  className="inline-block px-6 py-2 text-sm font-medium transition duration-200 ease-in-out rounded-full bg-slate-50 text-slate-800 ring-1 ring-slate-100/80 hover:bg-slate-100/95 hover:text-slate-900 lg:text-md"
                >
                  Branding
                </a>
              </li>
              <li>
                <a
                  href="#0"
                  className="inline-block px-6 py-2 text-sm font-medium transition duration-200 ease-in-out rounded-full bg-slate-50 text-slate-800 ring-1 ring-slate-100/80 hover:bg-slate-100/95 hover:text-slate-900 lg:text-md"
                >
                  Product
                </a>
              </li>
              <li>
                <a
                  href="#0"
                  className="inline-block px-6 py-2 text-sm font-medium transition duration-200 ease-in-out rounded-full bg-slate-50 text-slate-800 ring-1 ring-slate-100/80 hover:bg-slate-100/95 hover:text-slate-900 lg:text-md"
                >
                  Design
                </a>
              </li>
              <li>
                <a
                  href="#0"
                  className="inline-block px-6 py-2 text-sm font-medium transition duration-200 ease-in-out rounded-full bg-slate-50 text-slate-800 ring-1 ring-slate-100/80 hover:bg-slate-100/95 hover:text-slate-900 lg:text-md"
                >
                  Custom Website
                </a>
              </li>
            </ul> */}
          </div>
        </div>

        {/* <!-- Image --> */}
        <div className="relative block w-full mt-16 overflow-hidden aspect-w-16 aspect-h-9 md:aspect-w-5 md:aspect-h-2 lg:mt-20">
          <img
            src={apoyo}
            alt="Gira Guatemala Banda CEDES Don Bosco"
            className="object-cover w-full bg-slate-100"
          />
        </div>
      </section>
      <section className="py-16 overflow-hidden bg-white sm:py-20 lg:py-28 text-justify">
        {/* <!-- Container --> */}
        <div className="grid max-w-lg px-5 mx-auto sm:max-w-2xl sm:px-6 lg:max-w-6xl lg:grid-cols-10 lg:px-8 xl:px-12">
          {/* <!-- Details --> */}
          <div className="order-2 pt-8 mt-8 border-t border-slate-200 lg:order-1 lg:col-span-3 lg:mt-0 lg:border-0 lg:pt-0 lg:pr-8">
            {/* <!-- Details list --> */}
            <dl className="space-y-8">
              {/* <!-- 1st detail --> */}
              {/* <div>
                <dt className="text-lg font-medium font-display text-slate-900">Próxima gira</dt>
                <dd className="mt-2.5 max-w-sm leading-7 text-slate-700">
                  Guatemala 2025 - Banda CEDES Don Bosco
                </dd>
              </div> */}

              {/* <!-- 2nd detail --> */}
              {/* <div>
                <dt className="text-lg font-medium font-display text-slate-900">Fecha</dt>
                <dd className="mt-2.5 max-w-sm leading-7 text-slate-700">
                  26 de enero al 3 de febrero de 2025
                </dd>
              </div> */}

              {/* <!-- 3rd detail --> */}
              {/* <div>
                <dt className="text-lg font-medium font-display text-slate-900">Lugar</dt>
                <dd className="mt-2.5 max-w-sm leading-7 text-slate-700">Guatemala</dd>
              </div> */}

              {/* <!-- 4th detail --> */}
              <div>
                <dt className="text-lg font-medium font-display text-slate-900">Participantes</dt>
                <dd className="mt-2.5 max-w-sm leading-7 text-slate-700">
                  Padres/madres de familia y exalumnos
                </dd>
              </div>

              {/* <!-- 5th detail --> */}
              <div>
                <dt className="text-lg font-medium font-display text-slate-900">
                  Inscripciones abiertas
                </dt>
                <dd className="mt-2.5 max-w-sm leading-7 text-slate-700">
                  ¡ Ya puedes inscribirte para ser parte de nuestro grupo de apoyo !
                </dd>
              </div>
            </dl>

            {/* <!-- Action --> */}
            <button
              href="#0"
              target="_blank"
              className="bg-slate-900 text-white hover:bg-sky-800 inline-flex items-center rounded-full gap-2.5 justify-center px-7 py-3 text-md leading-none outline-offset-2 transition-all duration-200 ease-in-out active:transition-none mt-14 font-medium"
              onClick={handleOpenModal}
            >
              Llenar formulario
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5 duration-200 ease-in-out text-slate-50 group-hover:text-white"
              >
                <path
                  fillRule="evenodd"
                  d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          {/* <!-- Description --> */}
          <div className="order-1 lg:order-2 lg:col-span-7 lg:pl-16">
            <h3 className="text-xl font-medium leading-8 font-display text-slate-900 sm:text-2xl sm:leading-10">
              Grupo de apoyo BCDB
            </h3>

            {/* <!-- Content --> */}
            <div className="mt-6 prose sm:prose-lg sm:mt-8">
              <p>
                El Grupo de Apoyo de la Banda CEDES Don Bosco es una parte fundamental de la
                estructura organizativa y operativa de la banda. Este grupo está compuesto
                principalmente por padres de familia, exalumnos y otros voluntarios que desean
                contribuir al éxito y desarrollo continuo de la banda. Su rol es esencial para la
                gestión logística, el apoyo en eventos y la creación de un entorno favorable para
                que los integrantes de la banda puedan enfocarse en su desarrollo musical.
              </p>

              <h3 className=" text-sm font-medium leading-8 font-display text-slate-900 sm:text-2xl sm:leading-10">
                ¿Quiénes Componen el Grupo de Apoyo?
              </h3>
              <p>El Grupo de Apoyo está integrado por:</p>
              <p>
                Padres de Familia: Que se involucran activamente en las actividades de la banda para
                apoyar a sus hijos y a la comunidad.
              </p>
              <p>
                Exalumnos: Quienes regresan para aportar su experiencia y conocimientos adquiridos
                durante su tiempo en la banda.
              </p>

              <h3 className=" text-sm font-medium leading-8 font-display text-slate-900 sm:text-2xl sm:leading-10">
                Objetivos del Grupo de Apoyo
              </h3>
              <p>
                El objetivo principal del Grupo de Apoyo es proporcionar el soporte necesario para
                que la banda funcione de manera eficiente y efectiva. Este apoyo permite que los
                miembros se concentren en sus ensayos y presentaciones, sabiendo que cuentan con un
                respaldo sólido y comprometido.
              </p>

              <p>
                El Grupo de Apoyo de la Banda CEDES Don Bosco no solo facilita la operación diaria
                de la banda, sino que también juega un papel crucial en el desarrollo de una
                comunidad fuerte y solidaria. Su dedicación y esfuerzo son una inspiración y un
                ejemplo de cómo el trabajo en equipo y el compromiso pueden llevar a grandes logros.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Apoyo;
