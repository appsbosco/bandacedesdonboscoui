import React from "react";
import { useTranslation } from "react-i18next";
import INS_LOGO_URL from "../assets/images/Logo INS.webp";

const INS_WEBSITE_URL = "https://www.ins-cr.com/";

const SponsorBadge = () => {
  const { t } = useTranslation();

  return (
    <section className="relative py-12 overflow-hidden bg-white sm:py-16 lg:py-20">
      <div
        className="absolute inset-0 bg-gradient-to-b from-slate-50/50 via-white to-slate-50/30"
        aria-hidden="true"
      ></div>

      <div className="relative z-10 max-w-screen-xl px-5 mx-auto sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-slate-100 ring-1 ring-slate-200/50">
              <div className="w-1.5 h-1.5 rounded-full bg-sky-600 animate-pulse"></div>
              <span className="text-xs font-medium uppercase tracking-wider text-slate-600 sm:text-sm">
                {t("sponsor.badge", "Alianza estratégica")}
              </span>
            </div>
            <h2 className="text-2xl font-semibold font-display text-slate-900 sm:text-3xl">
              {t("sponsor.title", "Patrocinador Oficial")}
            </h2>
          </div>

          <div className="relative">
            <div
              className="absolute -inset-4 bg-gradient-to-r from-sky-500/5 via-sky-400/10 to-sky-500/5 rounded-3xl blur-2xl"
              aria-hidden="true"
            ></div>

            <div className="relative grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
              <div className="lg:col-span-5">
                <div className="space-y-4 text-center lg:text-left">
                  <h3 className="text-xl font-medium font-display text-slate-900 sm:text-2xl">
                    {t("sponsor.subtitle", "Instituto Nacional de Seguros")}
                  </h3>
                  <p className="max-w-md mx-auto text-base leading-relaxed text-slate-600 lg:mx-0">
                    {t(
                      "sponsor.description",
                      "Orgullosos de contar con el respaldo del INS en nuestro camino hacia el Rose Parade 2027."
                    )}
                  </p>
                  <div className="flex items-center justify-center gap-2 pt-2 lg:justify-start">
                    <div className="flex -space-x-1">
                      <div className="w-8 h-8 rounded-full bg-sky-100 ring-2 ring-white flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="w-4 h-4 text-sky-600"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-slate-100 ring-2 ring-white flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="w-4 h-4 text-slate-600"
                        >
                          <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 01-2.07-.655zM16.44 15.98a4.97 4.97 0 002.07-.654.78.78 0 00.357-.442 3 3 0 00-4.308-3.517 6.484 6.484 0 011.907 3.96 2.32 2.32 0 01-.026.654zM18 8a2 2 0 11-4 0 2 2 0 014 0zM5.304 16.19a.844.844 0 01-.277-.71 5 5 0 019.947 0 .843.843 0 01-.277.71A6.975 6.975 0 0110 18a6.974 6.974 0 01-4.696-1.81z" />
                        </svg>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-sky-100 ring-2 ring-white flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="w-4 h-4 text-sky-600"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-slate-600">
                      {t("sponsor.trust", "Confianza y compromiso")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7">
                <a
                  href={INS_WEBSITE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                  aria-label="Visitar sitio web del INS - Instituto Nacional de Seguros"
                >
                  <div className="relative overflow-hidden rounded-2xl bg-white p-12 shadow-lg shadow-slate-200/60 ring-1 ring-slate-900/5 transition-all duration-300 hover:shadow-xl hover:shadow-slate-300/40 hover:ring-slate-900/10 sm:p-16 lg:p-20">
                    <div
                      className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-sky-50 to-transparent opacity-50"
                      aria-hidden="true"
                    ></div>
                    <div
                      className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-slate-50 to-transparent opacity-50"
                      aria-hidden="true"
                    ></div>

                    <div className="relative flex items-center justify-center">
                      <img
                        src={INS_LOGO_URL}
                        alt="Logo Instituto Nacional de Seguros - INS"
                        width={320}
                        height={107}
                        className="h-24 w-auto object-contain transition-all duration-300 group-hover:scale-105 sm:h-28 lg:h-32"
                        loading="eager"
                      />
                    </div>

                    <div className="absolute bottom-6 right-6 flex items-center gap-2 opacity-0 transition-all duration-300 group-hover:opacity-100">
                      <span className="text-xs font-medium text-slate-500">
                        {t("sponsor.visit", "Conocer más")}
                      </span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-4 w-4 text-sky-600 transition-transform duration-300 group-hover:translate-x-0.5"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
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

      <svg
        width="400"
        height="400"
        viewBox="0 0 400 400"
        className="absolute top-0 right-0 w-96 h-96 text-slate-100 opacity-20 translate-x-1/2 -translate-y-1/2"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="sponsor-pattern"
            x="0"
            y="0"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="2" cy="2" r="1" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="400" height="400" fill="url(#sponsor-pattern)" />
      </svg>
    </section>
  );
};

export const SponsorFooterBadge = () => {
  const { t } = useTranslation();

  return (
    <div className="relative border-t border-slate-700/40">
      <div
        className="absolute inset-0 bg-gradient-to-b from-slate-800/50 via-transparent to-transparent"
        aria-hidden="true"
      ></div>

      <div className="relative max-w-screen-xl px-5 mx-auto sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center py-10 sm:py-12 lg:py-14">
          <p className="mb-6 text-xs font-medium uppercase tracking-widest text-slate-400 sm:text-sm">
            {t("sponsor.footer_label", "Patrocinador Oficial")}
          </p>

          <a
            href={INS_WEBSITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex items-center justify-center"
            aria-label="Visitar sitio web del INS"
          >
            <div
              className="absolute inset-0 rounded-2xl bg-gradient-to-r from-sky-500/10 via-sky-400/5 to-sky-500/10 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100"
              aria-hidden="true"
            ></div>

            <div className="relative overflow-hidden rounded-2xl bg-slate-800/40 px-10 py-6 ring-1 ring-slate-700/50 backdrop-blur-sm transition-all duration-300 hover:bg-slate-800/60 hover:ring-slate-600/60 sm:px-12 sm:py-7">
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-700/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                aria-hidden="true"
              ></div>

              <img
                src={INS_LOGO_URL}
                alt="Logo Instituto Nacional de Seguros"
                width={180}
                height={60}
                className="relative h-11 w-auto object-contain opacity-90 transition-all duration-300 group-hover:opacity-100 group-hover:scale-105 sm:h-12"
                loading="lazy"
              />
            </div>
          </a>

          <p className="mt-5 text-xs text-center text-slate-500 max-w-md sm:text-sm">
            {t("sponsor.footer_text", "Gracias por impulsar la música y la cultura costarricense")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SponsorBadge;
