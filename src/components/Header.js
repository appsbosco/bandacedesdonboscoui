import React, { useEffect, useState } from "react";

import logo from "../assets/images/Logo-Banda-Cedes-Don-Bosco.webp";
import { useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import DonationModal from "./DonationsModal";
import { getPublicPath, normalizePublicLang } from "utils/publicRoutes";
import BrandArtwork from "./BrandArtwork";

const Header = ({ openModal }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);

  const { pathname } = useLocation();
  const { i18n, t } = useTranslation();

  const lang = normalizePublicLang(i18n.language?.slice(0, 2));
  const isAuthenticated = localStorage.getItem("token");
  const isCurrentRoute = (route) => {
    const target = getPublicPath(lang, route);
    return pathname === target || (route !== "home" && pathname.startsWith(`${target}/`));
  };
  const mobileNavItems = [
    { route: "home", label: t("nav.home") },
    { route: "about", label: t("nav.about") },
    {
      route: "ensembles",
      label: t("nav.ensembles", lang === "en" ? "Ensembles" : "Agrupaciones"),
    },
    { route: "blog", label: t("nav.blog") },
    { route: "calendar", label: t("nav.calendar") },
    { route: "contact", label: t("nav.contact") },
  ];

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    const menu = document.getElementById("mobile-navigation");
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
        return;
      }

      if (event.key !== "Tab" || !menu) return;

      const focusableElements = Array.from(
        menu.querySelectorAll(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (!firstElement || !lastElement) return;

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };
    const focusFrame = window.requestAnimationFrame(() => {
      document.getElementById("mobile-navigation-close")?.focus();
    });

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus();
      }
    };
  }, [mobileMenuOpen]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="h-24 bg-white border-b border-slate-200/80">
      <div className="flex items-center w-full h-full max-w-screen-xl px-5 mx-auto sm:px-6 lg:px-8">
        <nav className="relative z-50 flex items-center justify-between w-full">
          {/* Logo */}
          <div className="flex items-center shrink-0">
            <a href={getPublicPath(lang, "home")} aria-label={t("nav.home")} className="flex items-center flex-shrink-0">
              <img
                src={logo}
                width={120}
                height={120}
                alt=""
                className="w-auto h-16 sm:h-16 md:h-20 lg:h-24 xl:h-28"
              />
            </a>
          </div>

          {/* Desktop navigation links */}
          <div className="absolute left-1/2 hidden -translate-x-1/2 items-center lg:flex lg:space-x-8">
            <a
              href={getPublicPath(lang, "home")}
              aria-current={isCurrentRoute("home") ? "page" : undefined}
              className='relative duration-200 after:absolute after:left-1/2 after:-bottom-2.5 after:h-0.5 after:w-4 after:-translate-x-1/2 after:rounded-full after:bg-slate-900 after:opacity-0 after:content-[""] font-medium text-slate-700 hover:text-slate-900 hover:after:opacity-25'
            >
              {t("nav.home")}
            </a>
            <a
              href={getPublicPath(lang, "about")}
              aria-current={isCurrentRoute("about") ? "page" : undefined}
              className='relative duration-200 after:absolute after:left-1/2 after:-bottom-2.5 after:h-0.5 after:w-4 after:-translate-x-1/2 after:rounded-full after:bg-slate-900 after:opacity-0 after:content-[""] font-medium text-slate-700 hover:text-slate-900 hover:after:opacity-25'
            >
              {t("nav.about")}
            </a>

            <a
              href={getPublicPath(lang, "ensembles")}
              aria-current={isCurrentRoute("ensembles") ? "page" : undefined}
              className='relative duration-200 after:absolute after:left-1/2 after:-bottom-2.5 after:h-0.5 after:w-4 after:-translate-x-1/2 after:rounded-full after:bg-slate-900 after:opacity-0 after:content-[""] font-medium text-slate-700 hover:text-slate-900 hover:after:opacity-25'
            >
              {t("nav.ensembles", lang === "en" ? "Ensembles" : "Agrupaciones")}
            </a>

            <a
              href={getPublicPath(lang, "blog")}
              aria-current={isCurrentRoute("blog") ? "page" : undefined}
              className='relative duration-200 after:absolute after:left-1/2 after:-bottom-2.5 after:h-0.5 after:w-4 after:-translate-x-1/2 after:rounded-full after:bg-slate-900 after:opacity-0 after:content-[""] font-medium text-slate-700 hover:text-slate-900 hover:after:opacity-25'
            >
              {t("nav.blog")}
            </a>

            <a
              href={getPublicPath(lang, "calendar")}
              aria-current={isCurrentRoute("calendar") ? "page" : undefined}
              className='relative duration-200 after:absolute after:left-1/2 after:-bottom-2.5 after:h-0.5 after:w-4 after:-translate-x-1/2 after:rounded-full after:bg-slate-900 after:opacity-0 after:content-[""] font-medium text-slate-700 hover:text-slate-900 hover:after:opacity-25'
            >
              {t("nav.calendar")}
            </a>

            <a
              href={getPublicPath(lang, "contact")}
              aria-current={isCurrentRoute("contact") ? "page" : undefined}
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
                className="group inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#e4002b] px-4 py-2 text-sm font-bold text-white shadow-sm shadow-red-950/15 ring-1 ring-[#c90026] transition-colors duration-200 hover:bg-[#c90026] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e4002b] sm:min-h-11 sm:gap-2.5 sm:px-7 sm:py-2.5"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  className="h-[18px] w-[18px] text-white sm:h-5 sm:w-5"
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
          <div className="ml-4 lg:hidden" x-data="{ mobileMenuOpen: false }">
            <button
              id="mobile-navigation-toggle"
              type="button"
              className="relative z-50 flex items-center justify-center p-3 transition duration-300 ease-in-out rounded-full shadow-sm cursor-pointer group bg-slate-100/80 shadow-sky-100/50 ring-1 ring-slate-900/5 hover:bg-slate-200/60 focus:outline-none lg:hidden"
              aria-label={t("nav.open", "Abrir navegación")}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
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

            {mobileMenuOpen && (
              <div
                id="mobile-navigation"
                className="fixed left-0 top-0 z-[100] flex h-[100dvh] w-full max-w-none flex-col overflow-hidden bg-[#fffdf7] text-[#152346]"
                role="dialog"
                aria-modal="true"
                aria-label={t("nav.navigation", "Navegación principal")}
              >
                <BrandArtwork
                  artwork="hummingbird"
                  motion="none"
                  className="absolute -right-10 top-20 w-52 rotate-[-8deg] opacity-[0.12] sm:w-64"
                />

                <div className="relative z-10 flex h-24 shrink-0 items-center justify-between border-b border-[#152346]/10 px-5 sm:px-7">
                  <a
                    href={getPublicPath(lang, "home")}
                    className="inline-flex rounded-xl px-1 py-1.5"
                    aria-label={t("nav.home")}
                  >
                    <img src={logo} width={112} height={72} alt="" className="h-14 w-auto" />
                  </a>
                  <button
                    id="mobile-navigation-close"
                    type="button"
                    onClick={toggleMobileMenu}
                    className="grid h-12 w-12 place-items-center rounded-full border border-[#152346]/15 bg-[#f6f0e6] text-[#152346] transition-colors duration-200 hover:bg-[#df8c26]/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#df8c26]"
                    aria-label={t("nav.close", "Cerrar navegación")}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="h-6 w-6"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
                    </svg>
                  </button>
                </div>

                <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col overflow-y-auto overscroll-contain px-6 pb-8 pt-7 sm:px-8 sm:pt-10">
                  <nav className="border-y border-[#152346]/10" aria-label={t("nav.navigation", "Navegación principal") }>
                    {mobileNavItems.map(({ route, label }) => {
                      const isActive = isCurrentRoute(route);
                      return (
                        <a
                          key={route}
                          href={getPublicPath(lang, route)}
                          aria-current={isActive ? "page" : undefined}
                          className={`group flex min-h-14 items-center justify-between border-b border-[#152346]/10 py-3.5 font-display text-2xl font-semibold transition-colors duration-200 last:border-b-0 sm:min-h-16 sm:text-3xl ${
                            isActive ? "text-[#df8c26]" : "text-[#152346] hover:text-[#df8c26]"
                          }`}
                        >
                          <span>{label}</span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1"
                            aria-hidden="true"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
                          </svg>
                        </a>
                      );
                    })}
                  </nav>

                  <div className="mt-auto pt-8">
                    <a
                      href={getPublicPath(lang, "donate")}
                      className="flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#e4002b] px-6 py-4 text-lg font-bold text-white shadow-lg shadow-black/15 transition-transform duration-200 hover:scale-[1.01] hover:bg-[#c90026] motion-reduce:transform-none"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.9"
                        className="h-6 w-6"
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
                      href="/autenticacion/iniciar-sesion"
                      className="mt-4 flex min-h-12 items-center justify-center rounded-xl text-base font-semibold text-[#152346]/65 transition-colors duration-200 hover:text-[#df8c26]"
                    >
                      {t("nav.login")}
                    </a>
                  </div>
                </div>
              </div>
            )}
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
