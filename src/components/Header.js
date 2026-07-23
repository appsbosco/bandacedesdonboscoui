import React, { useState } from "react";

import logo from "../assets/images/Logo-Banda-Cedes-Don-Bosco.webp";
import { useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import DonationModal from "./DonationsModal";
import { getPublicPath, normalizePublicLang } from "utils/publicRoutes";

const Header = ({ openModal }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);

  const { pathname } = useLocation();
  const { i18n, t } = useTranslation();

  const lang = normalizePublicLang(i18n.language?.slice(0, 2));
  const isAuthenticated = localStorage.getItem("token");

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="h-20 border-b border-slate-200/80 bg-white sm:h-24">
      <div className="mx-auto flex h-full w-full max-w-screen-xl items-center px-3 sm:px-6 lg:px-8">
        <nav className="relative z-50 flex items-center justify-between w-full">
          {/* Logo */}
          <div className="flex items-center shrink-0">
            <a href={getPublicPath(lang, "home")} aria-label={t("nav.home")} className="flex items-center flex-shrink-0">
              <img
                src={logo}
                width={120}
                height={120}
                alt=""
                className="h-12 w-auto sm:h-16 md:h-20 lg:h-24 xl:h-28"
              />
            </a>
          </div>

          {/* Desktop navigation links */}
          <div className="items-center hidden md:flex md:space-x-6 lg:space-x-8">
            <a
              href={getPublicPath(lang, "home")}
              className='relative duration-200 after:absolute after:left-1/2 after:-bottom-2.5 after:h-0.5 after:w-4 after:-translate-x-1/2 after:rounded-full after:bg-slate-900 after:opacity-0 after:content-[""] font-medium text-slate-700 hover:text-slate-900 hover:after:opacity-25'
            >
              {t("nav.home")}
            </a>
            <a
              href={getPublicPath(lang, "about")}
              className='relative duration-200 after:absolute after:left-1/2 after:-bottom-2.5 after:h-0.5 after:w-4 after:-translate-x-1/2 after:rounded-full after:bg-slate-900 after:opacity-0 after:content-[""] font-medium text-slate-700 hover:text-slate-900 hover:after:opacity-25'
            >
              {t("nav.about")}
            </a>

            <a
              href={getPublicPath(lang, "ensembles")}
              className='relative duration-200 after:absolute after:left-1/2 after:-bottom-2.5 after:h-0.5 after:w-4 after:-translate-x-1/2 after:rounded-full after:bg-slate-900 after:opacity-0 after:content-[""] font-medium text-slate-700 hover:text-slate-900 hover:after:opacity-25'
            >
              {t("nav.ensembles", lang === "en" ? "Ensembles" : "Agrupaciones")}
            </a>

            <a
              href={getPublicPath(lang, "blog")}
              className='relative duration-200 after:absolute after:left-1/2 after:-bottom-2.5 after:h-0.5 after:w-4 after:-translate-x-1/2 after:rounded-full after:bg-slate-900 after:opacity-0 after:content-[""] font-medium text-slate-700 hover:text-slate-900 hover:after:opacity-25'
            >
              {t("nav.blog")}
            </a>

            <a
              href={getPublicPath(lang, "calendar")}
              className='relative duration-200 after:absolute after:left-1/2 after:-bottom-2.5 after:h-0.5 after:w-4 after:-translate-x-1/2 after:rounded-full after:bg-slate-900 after:opacity-0 after:content-[""] font-medium text-slate-700 hover:text-slate-900 hover:after:opacity-25'
            >
              {t("nav.calendar")}
            </a>

            <a
              href={getPublicPath(lang, "contact")}
              className='relative duration-200 after:absolute after:left-1/2 after:-bottom-2.5 after:h-0.5 after:w-4 after:-translate-x-1/2 after:rounded-full after:bg-slate-900 after:opacity-0 after:content-[""] font-medium text-slate-700 hover:text-slate-900 hover:after:opacity-25'
            >
              {t("nav.contact")}
            </a>

            {/* {!(
              pathname === "/autenticacion/registrarse-privado" ||
              pathname === "/autenticacion/iniciar-sesion"
            ) &&
              isAuthenticated === null && (
                <a
                  href="/autenticacion/registrarse-privado"
                  className="relative duration-200 after:absolute after:left-1/2 after:-bottom-2.5 after:h-0.5 after:w-4 after:-translate-x-1/2 after:rounded-full after:bg-slate-900 after:opacity-0 after:content-[''] font-medium text-slate-700 hover:text-slate-900 hover:after:opacity-25"
                >
                  Registrarse
                </a>
              )} */}
          </div>

          <div className="ml-auto flex items-center">
            {/* Call to action */}
            {isAuthenticated != null &&
            pathname !== "/gira-panama" &&
            pathname !== "/60-aniversario" &&
            pathname !== "/grupo-apoyo" &&
            pathname !== "/proyecto-exalumnos" &&
            pathname !== "/color-guard-camp" ? (
              <a
                className="text-slate-900 shadow-sm shadow-sky-100/50 ring-1 ring-slate-100 hover:bg-slate-200/60 hover:shadow-sky-100/50 bg-slate-100/80 inline-flex items-center rounded-full gap-2.5 justify-center px-7 py-3 text-md font-semibold leading-none outline-offset-2 transition-all duration-200 ease-in-out active:transition-none"
                href="/dashboard"
              >
                Dashboard
              </a>
            ) : pathname === "/autenticacion/iniciar-sesion" ? (
              <></>
            ) : pathname === "/60-aniversario" ? (
              <>
                <button
                  type="button"
                  onClick={openModal}
                  className="text-slate-900 shadow-sm shadow-sky-100/50 ring-1 ring-slate-100 hover:bg-slate-200/60 hover:shadow-sky-100/50 bg-slate-100/80 inline-flex items-center rounded-full gap-2.5 justify-center px-7 py-3 text-md font-semibold leading-none outline-offset-2 transition-all duration-200 ease-in-out active:transition-none"
                  // href="/autenticacion/iniciar-sesion"
                >
                  Reservar entradas
                </button>
              </>
            ) : pathname === "/gira-panama" ||
              pathname === "/60-aniversario" ||
              pathname === "/proyecto-exalumnos" ||
              pathname === "/color-guard-camp" ||
              pathname === "/grupo-apoyo" ? (
              <>
                <button
                  type="button"
                  onClick={openModal}
                  className="text-slate-900 shadow-sm shadow-sky-100/50 ring-1 ring-slate-100 hover:bg-slate-200/60 hover:shadow-sky-100/50 bg-slate-100/80 inline-flex items-center rounded-full gap-2.5 justify-center px-7 py-3 text-md font-semibold leading-none outline-offset-2 transition-all duration-200 ease-in-out active:transition-none"
                  // href="/autenticacion/iniciar-sesion"
                >
                  Inscribirme
                </button>
              </>
            ) : (
              // <a
              //   className="text-slate-900 shadow-sm shadow-sky-100/50 ring-1 ring-slate-100 hover:bg-slate-200/60 hover:shadow-sky-100/50 bg-slate-100/80 inline-flex items-center rounded-full gap-2.5 justify-center px-7 py-3 text-md font-semibold leading-none outline-offset-2 transition-all duration-200 ease-in-out active:transition-none"
              //   href="/autenticacion/registrarse-privado"
              // >
              //   Registrarse
              // </a>

              // <a
              //   className="text-slate-900 shadow-sm shadow-sky-100/50 ring-1 ring-slate-100 hover:bg-slate-200/60 hover:shadow-sky-100/50 bg-slate-100/80 inline-flex items-center rounded-full gap-2.5 justify-center px-7 py-3 text-md font-semibold leading-none outline-offset-2 transition-all duration-200 ease-in-out active:transition-none"
              //   href="/autenticacion/iniciar-sesion"
              // >
              //   Iniciar Sesión
              // </a>
              <a
                href={getPublicPath(lang, "donate")}
                className="group inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-sky-950/15 bg-white px-4 py-2 text-sm font-bold text-sky-950 shadow-sm transition-colors duration-200 hover:border-sky-950/30 hover:bg-sky-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 sm:min-h-11 sm:gap-2.5 sm:px-6 sm:py-2.5"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  className="h-[18px] w-[18px] text-[#e4002b] sm:h-5 sm:w-5"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"
                  />
                </svg>
                {t("nav.campaign", "Donar")}
              </a>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="ml-2 md:hidden sm:ml-4" x-data="{ mobileMenuOpen: false }">
            <button
              type="button"
              className="group relative z-50 flex min-h-10 min-w-10 cursor-pointer items-center justify-center rounded-full bg-slate-100 p-2.5 shadow-sm ring-1 ring-slate-900/5 transition duration-300 ease-in-out hover:bg-slate-200 focus:outline-none md:hidden sm:min-h-11 sm:min-w-11 sm:p-3"
              aria-label="Toggle Navigation"
              onClick={toggleMobileMenu}
            >
              <span className="relative h-3.5 w-4 transform transition duration-500 ease-in-out">
                <span
                  className={`absolute block h-0.5 rotate-0 transform rounded-full bg-slate-700 opacity-100 transition-all duration-300 ease-in-out group-hover:bg-slate-900 ${
                    mobileMenuOpen ? "top-1.5 left-1/2 w-0" : "top-0 left-0 w-full"
                  }`}
                ></span>
                <span
                  className={`absolute left-0 top-1.5 block h-0.5 w-full transform rounded-full bg-slate-700 opacity-100 transition-all duration-300 ease-in-out group-hover:bg-slate-900 ${
                    mobileMenuOpen ? "rotate-45" : "rotate-0"
                  }`}
                ></span>
                <span
                  className={`absolute left-0 top-1.5 block h-0.5 w-full transform rounded-full bg-slate-700 opacity-100 transition-all duration-300 ease-in-out group-hover:bg-slate-900 ${
                    mobileMenuOpen ? "-rotate-45" : "rotate-0"
                  }`}
                ></span>
                <span
                  className={`absolute block h-0.5 rotate-0 transform rounded-full bg-slate-700 opacity-100 transition-all duration-300 ease-in-out group-hover:bg-slate-900 ${
                    mobileMenuOpen ? "top-1.5 left-1/2 w-0" : "left-0 top-3 w-full"
                  }`}
                ></span>
              </span>
            </button>

            {/* Mobile menu container */}
            <div className="md:hidden">
              {/* Background dark overlay when mobile menu is open */}
              {mobileMenuOpen && (
                <button
                  type="button"
                  className="fixed inset-0 z-20 bg-opacity-50 bg-slate-900"
                  onClick={toggleMobileMenu}
                  aria-label={t("nav.close", "Cerrar navegación")}
                />
              )}

              {/* Mobile menu popover */}
              <div
                className={`absolute inset-x-0 z-30 px-6 mt-4 overflow-hidden origin-top shadow-xl top-full rounded-2xl bg-slate-50 py-7 shadow-sky-100/40 ring-1 ring-slate-900/5 ${
                  mobileMenuOpen ? "" : "hidden"
                }`}
              >
                <div>
                  {/* Mobile menu links */}
                  <div className="flex flex-col space-y-4">
                    <a
                      href={getPublicPath(lang, "home")}
                      className="block text-base font-semibold duration-200 text-slate-700 hover:text-slate-900"
                    >
                      {t("nav.home")}
                    </a>
                    <a
                      href={getPublicPath(lang, "about")}
                      className="block text-base font-semibold duration-200 text-slate-700 hover:text-slate-900"
                    >
                      {t("nav.about")}
                    </a>

                    <a
                      href={getPublicPath(lang, "ensembles")}
                      className="block text-base font-semibold duration-200 text-slate-700 hover:text-slate-900"
                    >
                      {t("nav.ensembles", lang === "en" ? "Ensembles" : "Agrupaciones")}
                    </a>

                    <a
                      href={getPublicPath(lang, "blog")}
                      className="block text-base font-semibold duration-200 text-slate-700 hover:text-slate-900"
                    >
                      {t("nav.blog")}
                    </a>
                    <a
                      href={getPublicPath(lang, "calendar")}
                      className="block text-base font-semibold duration-200 text-slate-700 hover:text-slate-900"
                    >
                      {t("nav.calendar")}
                    </a>
                    <a
                      href={getPublicPath(lang, "contact")}
                      className="block text-base font-semibold duration-200 text-slate-700 hover:text-slate-900"
                    >
                      {t("nav.contact")}
                    </a>
                    <a
                      href={getPublicPath(lang, "donate")}
                      className="flex min-h-12 items-center justify-center gap-2.5 rounded-xl border border-sky-950/15 bg-white px-5 py-3 text-base font-bold text-sky-950 shadow-sm transition-colors duration-200 hover:border-sky-950/30 hover:bg-sky-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.9"
                        className="h-5 w-5 text-[#e4002b]"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"
                        />
                      </svg>
                      {t("nav.campaign", "Donar")}
                    </a>
                    <a
                      href={`/autenticacion/iniciar-sesion`}
                      className="block text-base font-semibold duration-200 text-slate-700 hover:text-slate-900"
                    >
                      {t("nav.login")}
                    </a>
                    {/* {pathname !== "/autenticacion/registrarse-privado" &&
                      pathname !== "/autenticacion/iniciar-sesion" && (
                        <a
                          href="/autenticacion/registrarse-privado"
                          className="block text-base font-semibold duration-200 text-slate-700 hover:text-slate-900"
                        >
                          Registrarse
                        </a>
                      )} */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <DonationModal isOpen={isDonationModalOpen} onClose={() => setIsDonationModalOpen(false)} />
      </div>
    </header>
  );
};

Header.propTypes = {
  openModal: PropTypes.func,
};

export default Header;
