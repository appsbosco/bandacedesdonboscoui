import Header from "components/Header";
import React, { useState } from "react";
import Modal from "./Modal";
import Footer from "components/Footer";
import exalumnos from "../../assets/images/EXALUMNOS.webp";

const Alumni = () => {
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
              Proyecto de exalumnos Banda CEDES Don Bosco - Antiguo Técnico Don Bosco y CEDES Don
              Bosco
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
            src={exalumnos}
            alt="Exalumnos Banda CEDES Don Bosco"
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
              <div>
                <dt className="text-lg font-medium font-display text-slate-900">Próximo Evento</dt>
                <dd className="mt-2.5 max-w-sm leading-7 text-slate-700">
                  Concierto Noche de películas
                </dd>
              </div>

              {/* <!-- 2nd detail --> */}
              <div>
                <dt className="text-lg font-medium font-display text-slate-900">Fecha</dt>
                <dd className="mt-2.5 max-w-sm leading-7 text-slate-700">23 de noviembre, 2024.</dd>
              </div>

              {/* <!-- 3rd detail --> */}
              <div>
                <dt className="text-lg font-medium font-display text-slate-900">Lugar</dt>
                <dd className="mt-2.5 max-w-sm leading-7 text-slate-700">
                  SUM de CEDES Don Bosco.
                </dd>
              </div>

              {/* <!-- 4th detail --> */}
              <div>
                <dt className="text-lg font-medium font-display text-slate-900">Participantes</dt>
                <dd className="mt-2.5 max-w-sm leading-7 text-slate-700">
                  Exalumnos graduados de CEDES Don Bosco y antiguo Técnico Don Bosco.
                </dd>
              </div>

              {/* <!-- 5th detail --> */}
              <div>
                <dt className="text-lg font-medium font-display text-slate-900">
                  Inscripciones abiertas
                </dt>
                <dd className="mt-2.5 max-w-sm leading-7 text-slate-700">
                  ¡ Ya puedes inscribirte para ser parte del concierto !
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
              Inscribirme
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
              Acerca del proyecto de exalumnos de la Banda CEDES Don Bosco
            </h3>

            {/* <!-- Content --> */}
            <div className="mt-6 prose sm:prose-lg sm:mt-8">
              <p>
                La Banda CEDES Don Bosco, con una tradición imponente y un legado que ha atravesado
                generaciones, representa uno de los pilares fundamentales de la formación y carisma
                salesiano. Esta banda, a lo largo de su existencia, no solo ha sido un conjunto
                musical, sino una familia que ha inculcado valores, disciplina y un sentido de
                pertenencia en todos sus integrantes. Es en este contexto que surge el proyecto de
                exalumnos de la Banda CEDES Don Bosco.
              </p>
              <p>
                El objetivo principal de este proyecto es fortalecer y perpetuar la tradición y el
                legado de la banda. A través de la integración de exalumnos con los actuales
                miembros, se busca crear una red de apoyo y experiencia que aporte de manera activa
                al enriquecimiento del conjunto. Este vinculo entre generaciones previas y actuales
                se convierte en un puente que garantiza la transmisión de la esencia y el espíritu
                de la banda, asegurando su continuidad y crecimiento en el futuro.
              </p>

              <p>
                Por otro lado, reconociendo el valor del Antiguo Técnico Don Bosco en la formación
                de muchos de sus integrantes, este proyecto también busca honrar y mantener vivo el
                legado de esta institución. Ambas entidades, CEDES Don Bosco y el Antiguo Técnico,
                han sido fundamentales en la formación de jóvenes con valores y principios sólidos,
                y es esencial que ambas se reconozcan y se apoyen mutuamente en este proyecto
                conjunto.
              </p>

              <p>
                En resumen, el proyecto de exalumnos no solo busca mantener viva la llama de la
                tradición y el carisma salesiano, sino también fortalecer y apoyar la Banda CEDES
                Don Bosco, aportando la experiencia, talento y pasión de aquellos que, en algún
                momento de sus vidas, fueron parte de esta gran familia. Es una invitación a todos
                los exintegrantes a reencontrarse con sus raíces, a contribuir al crecimiento de la
                banda y a fortalecer el sentido de pertenencia y comunidad que siempre ha
                caracterizado a esta institución.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Alumni;
