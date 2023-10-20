import Header from "components/Header";
import React, { useEffect, useState } from "react";
import Modal from "./ColorGuardCampModal";
import Footer from "components/Footer";
import colorguardcamp from "../../assets/images/ColorGuardCamp.webp";
import { IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PropTypes from "prop-types";

const ModalInfo = ({ onClose }) => {
  return (
    <div
      id="medium-modal"
      tabIndex="-1"
      className="fixed shadow top-0 left-0 right-0 z-50  w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-[calc(100%-1rem)] max-h-full flex items-center justify-center"
    >
      <div className="relative w-full max-w-lg max-h-full">
        <div className="relative bg-white rounded-lg shadow ">
          <div className="flex items-center justify-between p-5 border-b rounded-t ">
            <h3 className="text-xl font-medium text-gray-900">Información importante</h3>
            <button
              type="button"
              className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center "
              data-modal-hide="medium-modal"
            >
              <svg
                className="w-3 h-3"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 14 14"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                />
              </svg>
              <span className="sr-only">Información importante</span>
            </button>
          </div>

          <div className="p-6 space-y-6">
            <p className="text-base leading-relaxed text-gray-500">
              Leer la información detenidamente antes de proceder con la inscripción al campamento
            </p>
            <h3 className="text-lg font-medium leading-8 font-display text-slate-900 sm:text-xl sm:leading-10">
              Notas Importantes:
            </h3>
            <ul className="list-disc px-10">
              <li>
                {" "}
                Para garantizar una entrada sin inconvenientes al campus de CEDES Don Bosco, les
                solicitamos proporcionar el número de placa del vehículo con el que ingresarán, a
                más tardar el miércoles 15 de noviembre. Por favor, envíen esta información al
                siguiente correo electrónico: banda@cedesdonbosco.ed.cr, para proceder con el
                registro correspondiente del vehículo en nuestro sistema.
              </li>
              <li>
                {" "}
                Los participantes deben adherirse a las normas de comportamiento y presentación
                personal de CEDES Don Bosco.{" "}
              </li>
              <li>
                {" "}
                Está prohibido el uso y consumo de bebidas alcohólicas, cigarrillos u otras drogas
                en las instalaciones.{" "}
              </li>
              <li>
                {" "}
                Se recomienda asistir con ropa deportiva decorosa y, si es posible, con una camiseta
                de la banda o equipo que representan.
              </li>
              <li>
                {" "}
                Mantengamos el orden, la limpieza de las instalaciones y los servicios sanitarios.
              </li>
              <li>
                {" "}
                Se solicita permanecer en el gimnasio durante la actividad; para el almuerzo, pueden
                hacer uso de las canchas y áreas aledañas.
              </li>
              <li>
                {" "}
                Evitemos el uso de vocabulario vulgar y soez. Sigamos las indicaciones de las
                personas a cargo de la actividad.
              </li>
            </ul>
          </div>
          <div className="flex items-center p-6 space-x-2 border-t border-gray-200 rounded-b ">
            <button
              onClick={onClose}
              className="inline-flex items-center rounded-full gap-2.5 justify-center px-7 py-3 font-semibold leading-none outline-offset-2 transition-all duration-200 ease-in-out active:transition-none bg-slate-900 text-white hover:bg-sky-800 w-full text-base sm:text-lg"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
ModalInfo.propTypes = {
  onClose: PropTypes.func.isRequired,
};

const ColorGuardCamp = () => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [isModalInfoOpen, setModalInfoOpen] = useState(false);

  const handleIsModalInfoOpen = () => {
    setModalInfoOpen(true);
  };

  const handleCloseModalInfo = () => {
    setModalInfoOpen(false);
  };

  useEffect(() => {
    handleIsModalInfoOpen();
  }, []);

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };
  return (
    <div>
      <Header openModal={handleOpenModal} />

      <div className="w-screen">
        {isModalInfoOpen && <ModalInfo onClose={handleCloseModalInfo} />}
      </div>

      <div className=" w-screen">{isModalOpen && <Modal onClose={handleCloseModal} />}</div>

      <section
        className={`pt-16 overflow-hidden bg-white sm:pt-20 lg:pt-28 ${
          isModalOpen || isModalInfoOpen ? "bg-black opacity-5" : ""
        } `}
      >
        {/* <!-- Container --> */}
        <div className="max-w-screen-xl px-5 mx-auto sm:px-6 lg:px-8">
          <div className="max-w-lg mx-auto sm:max-w-3xl lg:mx-0 lg:max-w-none">
            <h1 className="text-4xl font-semibold leading-tight font-display text-slate-900 sm:text-5xl sm:leading-tight lg:text-6xl lg:leading-tight">
              1er Convivio Nacional de equipos de Color Guard de Costa Rica, edición 2023.
            </h1>

            {/* <!-- Tags list --> */}
            <ul className="flex flex-wrap items-center gap-4 mt-8 sm:gap-6">
              <li>
                <a
                  href="#information"
                  className="inline-block px-6 py-2 text-sm font-medium transition duration-200 ease-in-out rounded-full bg-slate-50 text-slate-800 ring-1 ring-slate-100/80 hover:bg-slate-100/95 hover:text-slate-900 lg:text-md"
                >
                  Información
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* <!-- Image --> */}
        <div className="relative block w-full mt-16 overflow-hidden aspect-w-16 aspect-h-9 md:aspect-w-5 md:aspect-h-2 lg:mt-20">
          <img
            src={colorguardcamp}
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
                  1er Convivio Nacional de equipos de Color Guard de Costa Rica, edición 2023
                </dd>
              </div>

              {/* <!-- 2nd detail --> */}
              <div>
                <dt className="text-lg font-medium font-display text-slate-900">Fecha</dt>
                <dd className="mt-2.5 max-w-sm leading-7 text-slate-700">
                  Sábado 18 de noviembre, 2023.
                </dd>
              </div>

              {/* <!-- 3rd detail --> */}
              <div>
                <dt className="text-lg font-medium font-display text-slate-900">Lugar</dt>
                <dd className="mt-2.5 max-w-sm leading-7 text-slate-700">
                  Gimnasio de CEDES Don Bosco.
                </dd>
              </div>

              {/* <!-- 4th detail --> */}
              <div>
                <dt className="text-lg font-medium font-display text-slate-900">
                  Cierre de inscripciones
                </dt>
                <dd className="mt-2.5 max-w-sm leading-7 text-slate-700">11 de noviembre, 2023.</dd>
              </div>

              {/* <!-- 5th detail --> */}
              <div>
                <dt className="text-lg font-medium font-display text-slate-900">
                  Inscripciones abiertas
                </dt>
                <dd className="mt-2.5 max-w-sm leading-7 text-slate-700">
                  ¡ Ya puedes inscribirte para ser parte del evento !
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
          <div className="order-1 lg:order-2 lg:col-span-7 lg:pl-16" id="information">
            <h3 className="text-xl font-medium leading-8 font-display text-slate-900 sm:text-2xl sm:leading-10">
              ¡Bienvenidos al Color Guard Camp 2023!
            </h3>

            {/* <!-- Content --> */}
            <div className="mt-6 prose sm:prose-lg sm:mt-8">
              <p>
                Nos complace invitarles al “1er Convivio Nacional de equipos de Color Guard de Costa
                Rica, edición 2023” que se llevará a cabo el sábado 18 de noviembre en las
                instalaciones del Gimnasio de CEDES Don Bosco, de 8:30am a 4:00pm. Este evento busca
                reunir a la comunidad de Color Guard del país, fomentar la camaradería, el
                aprendizaje y el crecimiento de esta hermosa disciplina artística en nuestra nación.
              </p>

              <div className="">
                <h3 className="text-lg font-medium leading-8 font-display text-slate-900 sm:text-xl sm:leading-10">
                  Detalles del Evento:
                </h3>

                <ul className="list-disc">
                  <li> Fecha: Sábado 18 de noviembre</li>
                  <li> Lugar: Gimnasio de CEDES Don Bosco</li>
                  <li> Hora: 8:30am a 4:00pm</li>
                  <li> Costo: ¡Evento gratuito!</li>
                </ul>
              </div>

              <div className="">
                <h3 className="text-lg font-medium leading-8 font-display text-slate-900 sm:text-xl sm:leading-10">
                  Inscripción:
                </h3>
                <p>
                  ¡La inscripción es por equipo y la pueden realizar fácilmente dando click en los
                  botones de inscribirse! El plazo para inscribirse vence el 11 de noviembre, así
                  que asegúrate de registrar tu equipo a tiempo.
                </p>
              </div>

              <div className="">
                <h3 className="text-lg font-medium leading-8 font-display text-slate-900 sm:text-xl sm:leading-10">
                  Notas Importantes:
                </h3>
                <ul className="list-disc">
                  <li>
                    {" "}
                    Para garantizar una entrada sin inconvenientes al campus de CEDES Don Bosco, les
                    solicitamos proporcionar el número de placa del vehículo con el que ingresarán,
                    a más tardar el miércoles 15 de noviembre. Por favor, envíen esta información al
                    siguiente correo electrónico: banda@cedesdonbosco.ed.cr, para proceder con el
                    registro correspondiente del vehículo en nuestro sistema.
                  </li>
                  <li>
                    {" "}
                    Los participantes deben adherirse a las normas de comportamiento y presentación
                    personal de CEDES Don Bosco.{" "}
                  </li>
                  <li>
                    {" "}
                    Está prohibido el uso y consumo de bebidas alcohólicas, cigarrillos u otras
                    drogas en las instalaciones.{" "}
                  </li>
                  <li>
                    {" "}
                    Se recomienda asistir con ropa deportiva decorosa y, si es posible, con una
                    camiseta de la banda o equipo que representan.
                  </li>
                  <li>
                    {" "}
                    Mantengamos el orden, la limpieza de las instalaciones y los servicios
                    sanitarios.
                  </li>
                  <li>
                    {" "}
                    Se solicita permanecer en el gimnasio durante la actividad; para el almuerzo,
                    pueden hacer uso de las canchas y áreas aledañas.
                  </li>
                  <li>
                    {" "}
                    Evitemos el uso de vocabulario vulgar y soez. Sigamos las indicaciones de las
                    personas a cargo de la actividad.
                  </li>
                </ul>
              </div>

              <p>Por favor, difundan esta información a sus respectivos artistas a cargo.</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ColorGuardCamp;
