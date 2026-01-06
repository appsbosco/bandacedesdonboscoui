import React from "react";
import { useTranslation } from "react-i18next";
import INS_LOGO_URL from "../../assets/images/Logo INS.webp";

const INS_WEBSITE_URL = "https://www.grupoins.com/";

const INS = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language;

  return (
    <>
      {/* Hero Section */}
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
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full bg-sky-100/80 ring-1 ring-sky-200/50">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4 text-sky-700"
              >
                <path
                  fillRule="evenodd"
                  d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-xs font-semibold uppercase tracking-wide text-sky-700 sm:text-sm">
                Alianza estratégica
              </span>
            </div>

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
                <span className="relative">INS</span>
              </span>
              , patrocinador oficial de la Banda CEDES Don Bosco
            </h1>
            <p className="mt-6 text-lg leading-8 text-center text-slate-700 lg:text-left">
              Una alianza comprometida con la música, la cultura y la juventud costarricense rumbo
              al Desfile de las Rosas 2027.
            </p>
            <div className="flex flex-wrap items-center justify-center mt-10 gap-y-6 gap-x-6 lg:justify-start">
              <a
                href={INS_WEBSITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="h-11 bg-slate-900 text-white hover:bg-sky-800 inline-flex items-center rounded-full gap-2.5 justify-center px-7 py-3 text-md font-semibold leading-none outline-offset-2 transition-all duration-200 ease-in-out active:transition-none"
              >
                Conocer al INS
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
              <a
                href={`/${lang}/nosotros`}
                className="h-11 text-slate-900 shadow-sm shadow-sky-100/50 ring-1 ring-slate-100 hover:bg-slate-200/60 hover:shadow-sky-100/50 bg-slate-100/80 inline-flex items-center rounded-full gap-2.5 justify-center px-7 py-3 text-md font-semibold leading-none outline-offset-2 transition-all duration-200 ease-in-out active:transition-none"
              >
                Conocer la banda
              </a>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-sky-200/40 via-sky-100/20 to-transparent rounded-3xl blur-3xl"></div>
              <div className="relative overflow-hidden rounded-3xl bg-white p-12 shadow-2xl shadow-sky-100/50 ring-1 ring-slate-900/5 sm:p-16 lg:p-20">
                <img
                  src={INS_LOGO_URL}
                  alt="Logo del Instituto Nacional de Seguros - INS, patrocinador oficial de la Banda CEDES Don Bosco"
                  width={320}
                  height={107}
                  className="h-24 w-auto object-contain sm:h-28 lg:h-32"
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sección de Agradecimiento */}
      <section className="relative pt-20 pb-20 overflow-hidden bg-gradient-to-b from-slate-50 via-slate-50 to-white sm:pt-24 sm:pb-24 lg:pt-32 lg:pb-32">
        <div className="max-w-screen-xl px-5 mx-auto sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-semibold font-display text-slate-900 sm:text-5xl">
              Nuestro más sincero agradecimiento
            </h2>
            <div className="mt-8 space-y-6 text-lg leading-8 text-slate-700">
              <p>
                La Banda CEDES Don Bosco se enorgullece de contar con el respaldo del Instituto
                Nacional de Seguros (INS) como nuestro patrocinador oficial. Esta alianza representa
                mucho más que un apoyo económico: es un compromiso compartido con la cultura, la
                disciplina, el desarrollo de nuestra juventud y el fortalecimiento de las
                comunidades costarricenses.
              </p>
              <p>
                Gracias al INS, cientos de jóvenes músicos tienen la oportunidad de crecer,
                representar a Costa Rica en escenarios internacionales y perseguir el sueño de
                participar en el prestigioso Desfile de las Rosas 2027. Este apoyo impulsa no solo
                la música, sino valores fundamentales como el trabajo en equipo, la excelencia y el
                orgullo nacional.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sobre el INS */}
      <section className="relative pt-20 pb-20 overflow-hidden bg-white sm:pt-24 sm:pb-24 lg:pt-32 lg:pb-32">
        <div className="max-w-screen-xl px-5 mx-auto sm:px-6 lg:px-8">
          <div className="grid items-start max-w-xl gap-12 mx-auto lg:mx-0 lg:max-w-none lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <h2 className="text-4xl font-semibold font-display text-slate-900 sm:text-5xl">
                Sobre el{" "}
                <span className="relative whitespace-nowrap">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="249"
                    height="22"
                    viewBox="0 0 249 22"
                    fill="currentColor"
                    className="absolute top-2/3 left-0 h-[0.6em] w-full fill-sky-200/75"
                  >
                    <path d="M247.564 18.5808C241.772 13.3568 232.473 12.7526 225.225 11.4427C217.124 9.97398 208.996 8.57034 200.846 7.46096C186.542 5.51305 172.169 4.08857 157.79 3.01565C126.033 0.645858 94.0929 0.0338786 62.3387 2.36982C42.1785 3.85419 22.008 5.90888 2.32917 10.8464C-0.0155171 11.4349 0.207047 14.6719 2.6889 14.7084C22.0261 14.9896 41.3866 12.6406 60.7109 11.8568C79.9471 11.0808 99.2274 10.6719 118.484 10.9558C142.604 11.3125 166.719 12.8334 190.722 15.5156C199.956 16.5469 209.195 17.6016 218.411 18.8255C227.864 20.0808 237.259 22 246.767 20.7422C247.709 20.6198 248.426 19.3568 247.564 18.5808Z" />
                  </svg>
                  <span className="relative text-sky-700">INS</span>
                </span>
              </h2>
              <p className="mt-6 text-lg leading-8 text-slate-700">
                Una institución comprometida con el bienestar y la protección de las familias
                costarricenses.
              </p>
            </div>
            <div className="lg:col-span-7">
              <div className="space-y-6 text-base leading-7 text-slate-700">
                <p>
                  El Instituto Nacional de Seguros (INS) es una institución autónoma costarricense
                  con una larga trayectoria en la protección y el respaldo de las familias, empresas
                  y comunidades del país. Fundado con el propósito de ofrecer servicios de seguros
                  accesibles y confiables, el INS se ha consolidado como un pilar fundamental en la
                  economía y el bienestar social de Costa Rica.
                </p>
                <p>
                  A lo largo de su historia, el INS ha demostrado un compromiso inquebrantable con
                  la prevención, la educación y la responsabilidad social. Su labor trasciende el
                  ámbito asegurador: la institución trabaja activamente en programas de prevención
                  de riesgos, educación vial, protección del medio ambiente y apoyo a iniciativas
                  culturales y deportivas que fortalecen el tejido social costarricense.
                </p>
                <p>
                  El INS ofrece una amplia gama de productos y servicios diseñados para proteger lo
                  que más importa: desde seguros de vida, salud y automóviles, hasta seguros
                  empresariales, agrícolas y de responsabilidad civil. Su modelo de atención se
                  caracteriza por la cercanía, la eficiencia y un profundo conocimiento de las
                  necesidades del pueblo costarricense.
                </p>
                <p>
                  Además de su labor aseguradora, el INS impulsa constantemente iniciativas de
                  impacto social que buscan mejorar la calidad de vida de las comunidades. La
                  institución entiende que su responsabilidad va más allá de indemnizar siniestros:
                  se trata de construir un país más seguro, más preparado y más resiliente ante los
                  desafíos del futuro.
                </p>
              </div>

              <div className="mt-10">
                <h3 className="text-xl font-medium font-display text-slate-900">
                  Áreas de impacto del INS
                </h3>
                <ul className="mt-6 space-y-4">
                  <li className="flex items-start gap-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-6 h-6 text-sky-700 shrink-0"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-base leading-7 text-slate-700">
                      <strong>Protección integral:</strong> Cobertura de seguros para personas,
                      familias, empresas y sectores productivos del país.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-6 h-6 text-sky-700 shrink-0"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-base leading-7 text-slate-700">
                      <strong>Prevención y educación:</strong> Campañas de prevención de accidentes,
                      seguridad vial y gestión de riesgos en comunidades.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-6 h-6 text-sky-700 shrink-0"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-base leading-7 text-slate-700">
                      <strong>Respaldo económico:</strong> Generación de empleo y contribución al
                      desarrollo económico sostenible de Costa Rica.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-6 h-6 text-sky-700 shrink-0"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-base leading-7 text-slate-700">
                      <strong>Compromiso ambiental:</strong> Programas de sostenibilidad y
                      protección del medio ambiente.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-6 h-6 text-sky-700 shrink-0"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-base leading-7 text-slate-700">
                      <strong>Apoyo cultural y deportivo:</strong> Patrocinio de iniciativas que
                      promueven el arte, la música, el deporte y el desarrollo juvenil.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-6 h-6 text-sky-700 shrink-0"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-base leading-7 text-slate-700">
                      <strong>Fortalecimiento comunitario:</strong> Inversión en proyectos sociales
                      que benefician directamente a las comunidades costarricenses.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ¿Por qué esta alianza? */}
      <section className="relative pt-20 pb-20 overflow-hidden bg-gradient-to-b from-slate-50 via-slate-50 to-white sm:pt-24 sm:pb-24 lg:pt-32 lg:pb-32">
        <div className="max-w-screen-xl px-5 mx-auto sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-semibold font-display text-slate-900 sm:text-5xl">
              ¿Por qué esta alianza?
            </h2>
            <p className="mt-6 text-lg leading-8 text-slate-700">
              Valores compartidos que nos unen rumbo al Desfile de las Rosas 2027.
            </p>
          </div>

          <div className="grid max-w-xl gap-10 mx-auto mt-16 lg:mx-0 lg:mt-20 lg:max-w-none lg:grid-cols-3">
            <div className="relative p-8 overflow-hidden rounded-2xl bg-white shadow-lg shadow-slate-200/60 ring-1 ring-slate-900/5">
              <div className="flex items-center justify-center w-12 h-12 mb-6 rounded-full bg-sky-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-6 h-6 text-sky-700"
                >
                  <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 01-2.07-.655zM16.44 15.98a4.97 4.97 0 002.07-.654.78.78 0 00.357-.442 3 3 0 00-4.308-3.517 6.484 6.484 0 011.907 3.96 2.32 2.32 0 01-.026.654zM18 8a2 2 0 11-4 0 2 2 0 014 0zM5.304 16.19a.844.844 0 01-.277-.71 5 5 0 019.947 0 .843.843 0 01-.277.71A6.975 6.975 0 0110 18a6.974 6.974 0 01-4.696-1.81z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium font-display text-slate-900">
                Compromiso con la juventud
              </h3>
              <p className="mt-4 text-base leading-7 text-slate-700">
                Tanto el INS como la Banda CEDES Don Bosco creen en el poder transformador de
                invertir en los jóvenes, ofreciéndoles oportunidades de crecimiento, disciplina y
                desarrollo personal.
              </p>
            </div>

            <div className="relative p-8 overflow-hidden rounded-2xl bg-white shadow-lg shadow-slate-200/60 ring-1 ring-slate-900/5">
              <div className="flex items-center justify-center w-12 h-12 mb-6 rounded-full bg-sky-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-6 h-6 text-sky-700"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-medium font-display text-slate-900">
                Excelencia y representación
              </h3>
              <p className="mt-4 text-base leading-7 text-slate-700">
                La búsqueda constante de la excelencia une a ambas instituciones. Representar a
                Costa Rica en el escenario mundial con orgullo y profesionalismo es un objetivo
                compartido.
              </p>
            </div>

            <div className="relative p-8 overflow-hidden rounded-2xl bg-white shadow-lg shadow-slate-200/60 ring-1 ring-slate-900/5">
              <div className="flex items-center justify-center w-12 h-12 mb-6 rounded-full bg-sky-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-6 h-6 text-sky-700"
                >
                  <path d="M10.75 10.818v2.614A3.13 3.13 0 0011.888 13c.482-.315.612-.648.612-.875 0-.227-.13-.56-.612-.875a3.13 3.13 0 00-1.138-.432zM8.33 8.62c.053.055.115.11.184.164.208.16.46.284.736.363V6.603a2.45 2.45 0 00-.35.13c-.14.065-.27.143-.386.233-.377.292-.514.627-.514.909 0 .184.058.39.202.592.037.051.08.102.128.152z" />
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-6a.75.75 0 01.75.75v.316a3.78 3.78 0 011.653.713c.426.33.744.74.925 1.2a.75.75 0 01-1.395.55 1.35 1.35 0 00-.447-.563 2.187 2.187 0 00-.736-.363V9.3c.698.093 1.383.32 1.959.696.787.514 1.29 1.27 1.29 2.13 0 .86-.504 1.616-1.29 2.13-.576.377-1.261.603-1.959.696v.299a.
75.75 0 11-1.5 0v-.3c-.697-.092-1.382-.318-1.958-.695-.482-.315-.857-.717-1.078-1.188a.75.75 0 111.359-.636c.08.173.245.376.54.569.313.205.706.353 1.138.432v-2.748a3.782 3.782 0 01-1.653-.713C6.9 9.433 6.5 8.681 6.5 7.875c0-.805.4-1.558 1.097-2.096a3.78 3.78 0 011.653-.713V4.75A.75.75 0 0110 4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-medium font-display text-slate-900">
                Impacto cultural y social
              </h3>
              <p className="mt-4 text-base leading-7 text-slate-700">
                Esta alianza trasciende lo económico: se trata de fortalecer la identidad cultural
                costarricense, promover la música como herramienta de transformación social y unir
                comunidades.
              </p>
            </div>
          </div>

          <div className="max-w-3xl mx-auto mt-16 lg:mt-20">
            <div className="p-8 overflow-hidden rounded-2xl bg-sky-50/50 ring-1 ring-sky-100 sm:p-10">
              <h3 className="text-2xl font-semibold font-display text-slate-900">
                Lo que significa para el proyecto 2027
              </h3>
              <p className="mt-4 text-base leading-7 text-slate-700">
                El patrocinio del INS es un pilar fundamental para que la Banda CEDES Don Bosco
                pueda enfrentar el desafío de prepararse para el Desfile de las Rosas 2027. Este
                apoyo nos permite cubrir aspectos esenciales como logística, equipamiento, formación
                musical de alto nivel y todos los preparativos necesarios para representar a Costa
                Rica con excelencia en uno de los eventos más prestigiosos del mundo. Sin esta
                alianza, el sueño de marchar en Pasadena sería significativamente más difícil de
                alcanzar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Lo que este patrocinio hace posible */}
      <section className="relative pt-20 pb-20 overflow-hidden bg-white sm:pt-24 sm:pb-24 lg:pt-32 lg:pb-32">
        <div className="max-w-screen-xl px-5 mx-auto sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-semibold font-display text-slate-900 sm:text-5xl">
              Lo que este patrocinio hace posible
            </h2>
            <p className="mt-6 text-lg leading-8 text-slate-700">
              El apoyo del INS se traduce en acciones concretas que impulsan nuestro proyecto rumbo
              al Desfile de las Rosas 2027.
            </p>
          </div>

          <div className="grid max-w-4xl gap-6 mx-auto mt-16 lg:mt-20 sm:grid-cols-2">
            <div className="flex items-start gap-4 p-6 overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-white ring-1 ring-slate-200/60">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-sky-100 shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5 text-sky-700"
                >
                  <path d="M6.5 3c-1.051 0-2.093.04-3.125.117A1.49 1.49 0 002 4.607V10.5h9V4.606c0-.771-.59-1.43-1.375-1.489A41.568 41.568 0 006.5 3zM2 12v2.5A1.5 1.5 0 003.5 16h.041a3 3 0 015.918 0h.791a.75.75 0 00.75-.75V12H2z" />
                  <path d="M6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM13.25 5a.75.75 0 00-.75.75v8.514a3.001 3.001 0 014.893 1.44c.37-.275.61-.719.595-1.227a24.905 24.905 0 00-1.784-8.549A1.486 1.486 0 0014.823 5H13.25zM14.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold font-display text-slate-900">
                  Transporte y logística
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Traslado de más de 280 miembros de la banda, instrumentos y equipamiento hacia
                  Estados Unidos para el Desfile de las Rosas 2027.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-white ring-1 ring-slate-200/60">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-sky-100 shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5 text-sky-700"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold font-display text-slate-900">
                  Instrumentos y equipamiento
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Mantenimiento, reparación y adquisición de instrumentos musicales de alta calidad,
                  así como equipamiento técnico necesario para ensayos y presentaciones.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-white ring-1 ring-slate-200/60">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-sky-100 shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5 text-sky-700"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 2a.75.75 0 01.75.75v.258a33.186 33.186 0 016.668.83.75.75 0 01-.336 1.461 31.28 31.28 0 00-1.103-.232l1.702 7.545a.75.75 0 01-.387.832A4.981 4.981 0 0115 14c-.825 0-1.606-.2-2.294-.556a.75.75 0 01-.387-.832l1.77-7.849a31.743 31.743 0 00-3.339-.254v11.505a20.01 20.01 0 013.78.501.75.75 0 11-.339 1.462A18.558 18.558 0 0010 17.5c-1.442 0-2.845.165-4.191.477a.75.75 0 01-.338-1.462 20.01 20.01 0 013.779-.501V4.509c-1.129.026-2.243.112-3.34.254l1.771 7.85a.75.75 0 01-.387.83A4.98 4.98 0 015 14a4.98 4.98 0 01-2.294-.556.75.75 0 01-.387-.832L4.02 5.067c-.37.07-.738.148-1.103.232a.75.75 0 01-.336-1.462 33.186 33.186 0 016.668-.829V2.75A.75.75 0 0110 2zM5 7.543L3.92 12.33a3.499 3.499 0 002.16 0L5 7.543zm10 0l-1.08 4.787a3.498 3.498 0 002.16 0L15 7.543z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold font-display text-slate-900">
                  Uniformes y vestuario oficial
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Diseño, confección y personalización de uniformes de gala y presentación que
                  representan dignamente a Costa Rica en el escenario internacional.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-white ring-1 ring-slate-200/60">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-sky-100 shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5 text-sky-700"
                >
                  <path
                    fillRule="evenodd"
                    d="M1 4.75C1 3.784 1.784 3 2.75 3h14.5c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0117.25 17H2.75A1.75 1.75 0 011 15.25V4.75zm1.75-.25a.25.25 0 00-.25.25v10.5c0 .138.112.25.25.25h14.5a.25.25 0 00.25-.25V4.75a.25.25 0 00-.25-.25H2.75z"
                    clipRule="evenodd"
                  />
                  <path
                    fillRule="evenodd"
                    d="M5 8a.75.75 0 01.75-.75h8.5a.75.75 0 010 1.5h-8.5A.75.75 0 015 8zm0 3.5a.75.75 0 01.75-.75h4a.75.75 0 010 1.5h-4a.75.75 0 01-.75-.75z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold font-display text-slate-900">
                  Gastos administrativos y operativos
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Cobertura de trámites migratorios, seguros, permisos y gestiones administrativas
                  necesarias para la participación internacional.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-white ring-1 ring-slate-200/60">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-sky-100 shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5 text-sky-700"
                >
                  <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 01-2.07-.655zM16.44 15.98a4.97 4.97 0 002.07-.654.78.78 0 00.357-.442 3 3 0 00-4.308-3.517 6.484 6.484 0 011.907 3.96 2.32 2.32 0 01-.026.654zM18 8a2 2 0 11-4 0 2 2 0 014 0zM5.304 16.19a.844.844 0 01-.277-.71 5 5 0 019.947 0 .843.843 0 01-.277.71A6.975 6.975 0 0110 18a6.974 6.974 0 01-4.696-1.81z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold font-display text-slate-900">
                  Formación y capacitación musical
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Clínicas con instructores internacionales, talleres de perfeccionamiento técnico y
                  entrenamientos especializados para el evento.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-white ring-1 ring-slate-200/60">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-sky-100 shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5 text-sky-700"
                >
                  <path d="M15.98 1.804a1 1 0 00-1.96 0l-.24 1.192a1 1 0 01-.784.785l-1.192.238a1 1 0 000 1.962l1.192.238a1 1 0 01.785.785l.238 1.192a1 1 0 001.962 0l.238-1.192a1 1 0 01.785-.785l1.192-.238a1 1 0 000-1.962l-1.192-.238a1 1 0 01-.785-.785l-.238-1.192zM6.949 5.684a1 1 0 00-1.898 0l-.683 2.051a1 1 0 01-.633.633l-2.051.683a1 1 0 000 1.898l2.051.684a1 1 0 01.633.632l.683 2.051a1 1 0 001.898 0l.683-2.051a1 1 0 01.633-.633l2.051-.683a1 1 0 000-1.898l-2.051-.683a1 1 0 01-.633-.633L6.95 5.684zM13.949 13.684a1 1 0 00-1.898 0l-.184.551a1 1 0 01-.632.633l-.551.183a1 1 0 000 1.898l.551.183a1 1 0 01.633.633l.183.551a1 1 0 001.898 0l.184-.551a1 1 0 01.632-.633l.551-.183a1 1 0 000-1.898l-.551-.184a1 1 0 01-.633-.632l-.183-.551z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold font-display text-slate-900">
                  Preparación física y apoyo integral
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Programas de acondicionamiento físico, apoyo nutricional y acompañamiento
                  psicológico para los miembros de la banda durante la preparación intensiva.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-white ring-1 ring-slate-200/60">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-sky-100 shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5 text-sky-700"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.25 2A2.25 2.25 0 002 4.25v11.5A2.25 2.25 0 004.25 18h11.5A2.25 2.25 0 0018 15.75V4.25A2.25 2.25 0 0015.75 2H4.25zM15 5.75a.75.75 0 00-1.5 0v8.5a.75.75 0 001.5 0v-8.5zm-8.5 6a.75.75 0 00-1.5 0v2.5a.75.75 0 001.5 0v-2.5zm3.5-4a.75.75 0 00-1.5 0v6.5a.75.75 0 001.5 0v-6.5z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold font-display text-slate-900">
                  Comunicación y difusión
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Producción de material audiovisual, cobertura mediática y estrategias de
                  comunicación para visibilizar el proceso y el logro de la banda a nivel nacional e
                  internacional.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-white ring-1 ring-slate-200/60">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-sky-100 shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5 text-sky-700"
                >
                  <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                  <path
                    fillRule="evenodd"
                    d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold font-display text-slate-900">
                  Actividades preparatorias y presentaciones previas
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Participación en eventos locales e internacionales de preparación, conciertos de
                  recaudación y presentaciones que contribuyen a la experiencia del grupo.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rumbo al Desfile de las Rosas 2027 */}
      <section className="relative pt-20 pb-20 overflow-hidden bg-gradient-to-b from-slate-50 via-slate-50 to-white sm:pt-24 sm:pb-24 lg:pt-32 lg:pb-32">
        <div className="max-w-screen-xl px-5 mx-auto sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-semibold font-display text-slate-900 sm:text-5xl">
              Rumbo al Desfile de las Rosas 2027
            </h2>
            <p className="mt-6 text-lg leading-8 text-slate-700">
              Un proyecto de años que representa disciplina, excelencia, orgullo y la oportunidad de
              llevar la música costarricense al escenario más importante del mundo.
            </p>
          </div>

          <div className="max-w-4xl mx-auto mt-16 space-y-8 lg:mt-20">
            <div className="p-8 overflow-hidden rounded-2xl bg-white shadow-lg shadow-slate-200/60 ring-1 ring-slate-900/5 sm:p-10">
              <h3 className="text-2xl font-semibold font-display text-slate-900">
                El desafío de una vida
              </h3>
              <div className="mt-6 space-y-4 text-base leading-7 text-slate-700">
                <p>
                  El Desfile de las Rosas (Rose Parade) es uno de los eventos más prestigiosos y
                  reconocidos a nivel mundial. Cada año, millones de personas en todo el planeta
                  sintonizan para ver este icónico desfile que se lleva a cabo en Pasadena,
                  California, el 1 de enero. Participar en este evento no es solo un honor: es un
                  reconocimiento a la excelencia musical, la disciplina y el compromiso con la
                  representación cultural.
                </p>
                <p>
                  Para la Banda CEDES Don Bosco, el camino hacia el Rose Parade 2027 comenzó hace
                  años y representa el proyecto más ambicioso de nuestra historia. Este desafío
                  requiere preparación técnica de altísimo nivel, ensayos intensivos, formación
                  musical constante, acondicionamiento físico riguroso y una logística compleja que
                  involucra a cientos de jóvenes músicos, instructores, familias y colaboradores.
                </p>
                <p>
                  Más allá de la música, este proyecto simboliza los valores que nos definen:
                  perseverancia, trabajo en equipo, respeto, orgullo nacional y el poder
                  transformador del arte. Cada ensayo, cada nota, cada paso de marcha nos acerca a
                  cumplir el sueño de representar a Costa Rica con excelencia en el escenario
                  mundial.
                </p>
              </div>
            </div>

            <div className="p-8 overflow-hidden rounded-2xl bg-sky-50/50 ring-1 ring-sky-100 sm:p-10">
              <h3 className="text-2xl font-semibold font-display text-slate-900">
                Hitos del proyecto 2025–2027
              </h3>
              <ul className="mt-8 space-y-6">
                <li className="relative pl-8">
                  <div className="absolute left-0 flex items-center justify-center w-6 h-6 rounded-full bg-sky-700">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-slate-900">
                      Fase de preparación intensiva (2025)
                    </h4>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      Inicio de ensayos especializados, clínicas con instructores internacionales,
                      fortalecimiento técnico y definición del repertorio musical para el desfile.
                    </p>
                  </div>
                </li>

                <li className="relative pl-8">
                  <div className="absolute left-0 flex items-center justify-center w-6 h-6 rounded-full bg-sky-700">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-slate-900">
                      Presentaciones preparatorias (2025–2026)
                    </h4>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      Participación en eventos locales e internacionales para ganar experiencia,
                      ajustar detalles técnicos y generar visibilidad del proyecto.
                    </p>
                  </div>
                </li>

                <li className="relative pl-8">
                  <div className="absolute left-0 flex items-center justify-center w-6 h-6 rounded-full bg-sky-700">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-slate-900">
                      Acondicionamiento físico y logístico (2026)
                    </h4>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      Programas de entrenamiento físico, gestiones migratorias, trámites
                      administrativos y coordinación logística para el viaje internacional.
                    </p>
                  </div>
                </li>

                <li className="relative pl-8">
                  <div className="absolute left-0 flex items-center justify-center w-6 h-6 rounded-full bg-sky-700">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-slate-900">
                      Ensayos finales y ajustes (2026–2027)
                    </h4>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      Perfeccionamiento de coreografías, sincronización musical, ensayos generales y
                      últimos detalles técnicos antes del evento.
                    </p>
                  </div>
                </li>

                <li className="relative pl-8">
                  <div className="absolute left-0 flex items-center justify-center w-6 h-6 rounded-full bg-sky-700">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-slate-900">
                      Viaje a Pasadena (diciembre 2026)
                    </h4>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      Traslado del grupo completo a California, ensayos in situ y preparativos
                      finales en el lugar del evento.
                    </p>
                  </div>
                </li>

                <li className="relative pl-8">
                  <div className="absolute left-0 flex items-center justify-center w-6 h-6 rounded-full bg-sky-700">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-slate-900">
                      Desfile de las Rosas 2027 (1 de enero 2027)
                    </h4>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      Participación oficial de la Banda CEDES Don Bosco en el Rose Parade,
                      representando a Costa Rica ante millones de espectadores en todo el mundo.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default INS;
