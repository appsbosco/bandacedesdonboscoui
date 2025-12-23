import React from "react";
import { useTranslation } from "react-i18next";
import INS_LOGO_URL from "../assets/images/Logo INS.webp";

const INS_WEBSITE_URL = "https://www.ins-cr.com/";

const SponsorBadge = () => {
  const { t } = useTranslation();

  return (
    <section className="relative py-16 overflow-hidden bg-gradient-to-b from-white via-slate-50 to-white sm:py-20 lg:py-24">
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-100/40 via-transparent to-transparent"
        aria-hidden="true"
      ></div>

      <svg
        width="1728"
        height="894"
        viewBox="0 0 1728 894"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-x-0 w-auto -top-32 opacity-40 lg:inset-y-0"
        aria-hidden="true"
      >
        <g clipPath="url(#clip0_sponsor)">
          <g opacity="0.6" filter="url(#filter0_f_sponsor)">
            <path
              d="M201.4 582.997H330V342.155L23 501.52L201.4 582.997Z"
              fill="#60A5FA"
              fillOpacity="0.35"
            />
            <path
              d="M330 342.155V284H90H-70L23 501.52L330 342.155Z"
              fill="#7DD3FC"
              fillOpacity="0.6"
            />
            <path
              d="M-70 582.997H201.4L23 501.52L-70 284V582.997Z"
              fill="#F0FDFA"
              fillOpacity="0.4"
            />
          </g>
        </g>
        <defs>
          <filter
            id="filter0_f_sponsor"
            x="-370"
            y="-16"
            width="1000"
            height="898.997"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
            <feGaussianBlur stdDeviation="150" result="effect1_foregroundBlur_sponsor" />
          </filter>
          <clipPath id="clip0_sponsor">
            <rect width="1728" height="894" fill="white" />
          </clipPath>
        </defs>
      </svg>

      <div className="relative z-10 max-w-screen-xl px-5 mx-auto sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="relative">
            <div
              className="absolute inset-0 bg-gradient-to-r from-sky-600/10 via-sky-500/5 to-transparent rounded-3xl blur-3xl"
              aria-hidden="true"
            ></div>

            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white to-slate-50/80 shadow-2xl shadow-sky-200/40 ring-1 ring-slate-900/5">
              <div
                className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-sky-600 via-sky-500 to-sky-600"
                aria-hidden="true"
              ></div>

              <div
                className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-sky-200/20 via-sky-100/10 to-transparent rounded-full blur-3xl -translate-y-1/3 translate-x-1/3"
                aria-hidden="true"
              ></div>
              <div
                className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-sky-100/20 via-transparent to-transparent rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"
                aria-hidden="true"
              ></div>

              <div className="relative px-6 py-12 sm:px-10 sm:py-16 lg:px-16 lg:py-20">
                <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                  <div className="text-center lg:text-left">
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
                        {t("sponsor.badge", "Orgullosamente patrocinados por")}
                      </span>
                    </div>

                    <h2 className="text-3xl font-semibold font-display text-slate-900 sm:text-4xl lg:text-5xl">
                      {t("sponsor.title", "Nuestro patrocinador")}
                      <span className="relative block mt-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="249"
                          height="22"
                          viewBox="0 0 249 22"
                          fill="currentColor"
                          className="absolute top-2/3 left-0 h-[0.58em] w-full fill-sky-200/90 hidden lg:block"
                        >
                          <path d="M247.564 18.5808C241.772 13.3568 232.473 12.7526 225.225 11.4427C217.124 9.97398 208.996 8.57034 200.846 7.46096C186.542 5.51305 172.169 4.08857 157.79 3.01565C126.033 0.645858 94.0929 0.0338786 62.3387 2.36982C42.1785 3.85419 22.008 5.90888 2.32917 10.8464C-0.0155171 11.4349 0.207047 14.6719 2.6889 14.7084C22.0261 14.9896 41.3866 12.6406 60.7109 11.8568C79.9471 11.0808 99.2274 10.6719 118.484 10.9558C142.604 11.3125 166.719 12.8334 190.722 15.5156C199.956 16.5469 209.195 17.6016 218.411 18.8255C227.864 20.0808 237.259 22 246.767 20.7422C247.709 20.6198 248.426 19.3568 247.564 18.5808Z" />
                        </svg>
                        <span className="relative text-sky-700">
                          {t("sponsor.highlight", "oficial")}
                        </span>
                      </span>
                    </h2>

                    <p className="max-w-lg mx-auto mt-5 text-base leading-7 text-slate-700 lg:mx-0 lg:mt-6 sm:text-lg">
                      {t(
                        "sponsor.description",
                        "Juntos construimos sueños y llevamos la música costarricense a nuevas alturas. Gracias por creer en nuestra banda."
                      )}
                    </p>
                  </div>

                  <div className="flex items-center justify-center">
                    <a
                      href={INS_WEBSITE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative inline-flex items-center justify-center"
                      aria-label="Visitar sitio web del INS - Instituto Nacional de Seguros"
                    >
                      <div
                        className="absolute inset-0 rounded-3xl bg-gradient-to-br from-sky-200/40 via-sky-100/20 to-transparent blur-2xl transition-all duration-300 group-hover:blur-3xl group-hover:scale-110"
                        aria-hidden="true"
                      ></div>

                      <div className="relative overflow-hidden rounded-3xl bg-white p-10 shadow-xl shadow-sky-100/50 ring-1 ring-slate-900/5 transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-sky-200/60 group-hover:ring-slate-900/10 group-hover:scale-105 sm:p-12 lg:p-14">
                        <div
                          className="absolute inset-0 bg-gradient-to-br from-sky-50/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                          aria-hidden="true"
                        ></div>

                        <img
                          src={INS_LOGO_URL}
                          alt="Logo Instituto Nacional de Seguros - INS"
                          width={280}
                          height={93}
                          className="relative h-20 w-auto object-contain transition-all duration-300 group-hover:scale-105 sm:h-24 lg:h-28"
                          loading="eager"
                        />

                        <div className="absolute bottom-4 right-4 flex items-center gap-1.5 opacity-0 transition-all duration-300 group-hover:opacity-100">
                          <span className="text-xs font-medium text-slate-600">
                            {t("sponsor.visit", "Visitar sitio")}
                          </span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="h-4 w-4 text-sky-600"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export const SponsorFooterBadge = () => {
  const { t } = useTranslation();

  return (
    <div className="relative flex flex-col items-center justify-center gap-4 pb-12 pt-8 sm:pb-14 sm:pt-10">
      <div
        className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-800/30 to-transparent"
        aria-hidden="true"
      ></div>

      <p className="relative text-xs font-semibold uppercase tracking-wider text-slate-400 sm:text-sm">
        {t("sponsor.footer_label", "Con el apoyo de")}
      </p>

      <a
        href={INS_WEBSITE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative inline-flex items-center justify-center rounded-2xl bg-slate-800/60 px-8 py-4 ring-1 ring-slate-700/60 backdrop-blur-sm transition-all duration-200 hover:bg-slate-800/80 hover:ring-slate-600/60 sm:px-10 sm:py-5"
        aria-label="Visitar sitio web del INS"
      >
        <div
          className="absolute inset-0 rounded-2xl bg-gradient-to-r from-sky-500/0 via-sky-500/5 to-sky-500/0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          aria-hidden="true"
        ></div>

        <img
          src={INS_LOGO_URL}
          alt="Logo Instituto Nacional de Seguros"
          width={160}
          height={53}
          className="relative h-10 w-auto object-contain opacity-95 transition-all duration-200 group-hover:opacity-100 group-hover:scale-105 sm:h-12"
          loading="lazy"
        />
      </a>
    </div>
  );
};

export default SponsorBadge;
