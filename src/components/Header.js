import React, { useState } from "react";

import logo from "../assets/images/Logo-Banda-Cedes-Don-Bosco.webp";
import { useLocation } from "react-router-dom";
import PropTypes from "prop-types";

const Header = ({ openModal }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const isAuthenticated = localStorage.getItem("token");

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="h-24 bg-white border-b border-slate-200/80">
      <div className="flex items-center w-full h-full max-w-screen-xl px-5 mx-auto sm:px-6 lg:px-8">
        <nav className="relative z-50 flex items-center justify-between w-full">
          {/* Logo */}
          <div className="flex items-center shrink-0">
            <a href="/" aria-label="Home" className="flex items-center flex-shrink-0">
              <img src={logo} alt="" className="w-auto h-16 sm:h-16 md:h-20 lg:h-24 xl:h-28" />
            </a>
          </div>

          {/* Desktop navigation links */}
          <div className="items-center hidden md:flex md:space-x-6 lg:space-x-8">
            <a
              href="/"
              className='relative duration-200 after:absolute after:left-1/2 after:-bottom-2.5 after:h-0.5 after:w-4 after:-translate-x-1/2 after:rounded-full after:bg-slate-900 after:opacity-0 after:content-[""] font-medium text-slate-700 hover:text-slate-900 hover:after:opacity-25'
            >
              Inicio
            </a>
            <a
              href="/nosotros"
              className='relative duration-200 after:absolute after:left-1/2 after:-bottom-2.5 after:h-0.5 after:w-4 after:-translate-x-1/2 after:rounded-full after:bg-slate-900 after:opacity-0 after:content-[""] font-medium text-slate-700 hover:text-slate-900 hover:after:opacity-25'
            >
              Nosotros
            </a>

            <a
              href="/blog"
              className='relative duration-200 after:absolute after:left-1/2 after:-bottom-2.5 after:h-0.5 after:w-4 after:-translate-x-1/2 after:rounded-full after:bg-slate-900 after:opacity-0 after:content-[""] font-medium text-slate-700 hover:text-slate-900 hover:after:opacity-25'
            >
              Blog
            </a>

            <a
              href="/contacto"
              className='relative duration-200 after:absolute after:left-1/2 after:-bottom-2.5 after:h-0.5 after:w-4 after:-translate-x-1/2 after:rounded-full after:bg-slate-900 after:opacity-0 after:content-[""] font-medium text-slate-700 hover:text-slate-900 hover:after:opacity-25'
            >
              Contacto
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

          <div className="flex items-center">
            {/* Call to action */}
            {isAuthenticated != null &&
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
            ) : pathname === "/proyecto-exalumnos" || pathname === "/color-guard-camp" ? (
              <>
                <button
                  onClick={openModal}
                  className="text-slate-900 shadow-sm shadow-sky-100/50 ring-1 ring-slate-100 hover:bg-slate-200/60 hover:shadow-sky-100/50 bg-slate-100/80 inline-flex items-center rounded-full gap-2.5 justify-center px-7 py-3 text-md font-semibold leading-none outline-offset-2 transition-all duration-200 ease-in-out active:transition-none"
                  href="/autenticacion/iniciar-sesion"
                  disabled
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
              <a
                className="text-slate-900 shadow-sm shadow-sky-100/50 ring-1 ring-slate-100 hover:bg-slate-200/60 hover:shadow-sky-100/50 bg-slate-100/80 inline-flex items-center rounded-full gap-2.5 justify-center px-7 py-3 text-md font-semibold leading-none outline-offset-2 transition-all duration-200 ease-in-out active:transition-none"
                href="/autenticacion/iniciar-sesion"
              >
                Iniciar Sesión
              </a>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="ml-4 md:hidden" x-data="{ mobileMenuOpen: false }">
            <button
              className="relative z-50 flex items-center justify-center p-3 transition duration-300 ease-in-out rounded-full shadow-sm cursor-pointer group bg-slate-100/80 shadow-sky-100/50 ring-1 ring-slate-900/5 hover:bg-slate-200/60 focus:outline-none md:hidden"
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
                <div
                  className="fixed inset-0 z-20 bg-opacity-50 bg-slate-900"
                  onClick={toggleMobileMenu}
                ></div>
              )}

              {/* Mobile menu popover */}
              <div
                className={`absolute inset-x-0 z-30 px-6 mt-4 overflow-hidden origin-top shadow-xl top-full rounded-2xl bg-slate-50 py-7 shadow-sky-100/40 ring-1 ring-slate-900/5 ${
                  mobileMenuOpen ? "" : "hidden"
                }`}
                onClick={toggleMobileMenu}
              >
                <div>
                  {/* Mobile menu links */}
                  <div className="flex flex-col space-y-4">
                    <a
                      href="/"
                      className="block text-base font-semibold duration-200 text-slate-700 hover:text-slate-900"
                    >
                      Inicio
                    </a>
                    <a
                      href="/nosotros"
                      className="block text-base font-semibold duration-200 text-slate-700 hover:text-slate-900"
                    >
                      Nosotros
                    </a>

                    <a
                      href="/blog"
                      className="block text-base font-semibold duration-200 text-slate-700 hover:text-slate-900"
                    >
                      Blog
                    </a>
                    <a
                      href="/contacto"
                      className="block text-base font-semibold duration-200 text-slate-700 hover:text-slate-900"
                    >
                      Contacto
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
      </div>
    </header>
  );
};

Header.propTypes = {
  openModal: PropTypes.func,
};

export default Header;
