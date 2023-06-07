import React from "react";

function HeroSection() {
  return (
    <div className="relative z-10 grid items-center max-w-screen-xl gap-16 px-5 mx-auto sm:px-6 lg:px-8 lg:grid-cols-2 lg:gap-8">
      <div className="flex flex-col items-center max-w-2xl mx-auto lg:items-start">
        <h1 className="text-5xl font-semibold text-center font-display text-slate-900 sm:text-6xl lg:text-left">
          <span className="relative whitespace-nowrap">
            {/* Headline underline */}
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
            <span className="relative">Bienvenido</span>
          </span>
          a la página oficial de la Banda CEDES Don Bosco
        </h1>
        <p className="mt-6 text-lg leading-8 text-center text-slate-700 lg:text-left">
          Aquí podrán conocer de la música y el talento de nuestra reconocida banda. Conformada por
          músicos apasionados y comprometidos, nuestra banda destaca por su excelencia y energía en
          el escenario. ¡Gracias por visitarnos!
        </p>
        <div className="flex flex-wrap items-center justify-center mt-10 gap-y-6 gap-x-10 lg:justify-start">
          <a
            href="contact.html"
            className="h-11 bg-slate-900 text-white hover:bg-sky-800 inline-flex items-center rounded-full gap-2.5 justify-center px-7 py-3 text-md font-semibold leading-none outline-offset-2 transition-all duration-200 ease-in-out active:transition-none"
          >
            Contáctanos
          </a>

          {/* Social links */}
          <div className="flex gap-3 sm:gap-4">
            {/* Link 1 */}
            {/* Add your first social link here */}

            {/* Link 2 */}
            <a
              className="flex items-center justify-center duration-200 border rounded-full h-11 w-11 border-slate-200 hover:bg-slate-50"
              href="https://www.instagram.com/bandacedesdonbosco"
              aria-label="Síganos en Instagram"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-4 h-4 transition fill-slate-600 group-hover:fill-slate-700"
              >
                {/* Add Instagram icon path here */}
              </svg>
            </a>

            {/* Link 3 */}
            <a
              className="flex items-center justify-center duration-200 border rounded-full h-11 w-11 border-slate-200 hover:bg-slate-50"
              href="https://www.facebook.com/bcdbcr"
              aria-label="Síganos en Facebook"
            >
              <svg
                style={{ color: "rgb(98, 98, 98)" }}
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                className="bi bi-facebook"
                viewBox="0 0 16 16"
              >
                {/* Add Facebook icon path here */}
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Hero graphics */}
      <div className="w-full max-w-lg mx-auto lg:mr-0">
        <div className="relative aspect-h-5 aspect-w-4 rounded-2xl bg-slate-50">
          <img
            className="object-cover object-center w-full h-full rounded-2xl"
            src="./images/landing.jpg"
            alt=""
            sizes="(min-width: 552px) 32rem, calc(100vw - 40px)"
          />
          <div>
            {/* Floating handwritten text with arrow */}
            <div className="absolute hidden w-max md:top-16 md:left-full md:block lg:-top-8 lg:-left-28 2xl:top-16 2xl:left-full">
              <span className="inline-block transform font-writing text-2xl tracking-wide text-slate-600 md:rotate-[16deg] lg:translate-x-6 lg:rotate-[-18deg] 2xl:rotate-12">
                Más que una banda!
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="103"
                height="102"
                viewBox="0 0 103 102"
                fill="none"
                className="h-auto w-28 text-slate-600 md:-translate-x-1/2 md:-translate-y-6 md:rotate-0 lg:translate-x-3/4 lg:-translate-y-3 lg:rotate-12 lg:-scale-x-100 2xl:-translate-x-1/2 2xl:-translate-y-6 2xl:rotate-0 2xl:scale-x-100"
              >
                {/* Add arrow path here */}
              </svg>
            </div>

            {/* Floating divs over image */}
            <div>
              {/* Experience with Tech 1 */}
              <div className="absolute right-12 -top-6 inline-flex h-12 w-max items-center justify-center gap-3.5 rounded-2xl bg-white/90 px-8 text-sm font-semibold text-slate-700 shadow-lg shadow-sky-100/50 ring-1 ring-slate-900/5 backdrop-blur-md md:-left-28 md:top-14 lg:left-44 lg:-top-6 lg:px-10 2xl:-left-48 2xl:top-14">
                <img src="./images/family.png" alt="" className="w-4 h-auto" />
                Familia
              </div>

              {/* Experience with Tech 2 */}
              <div className="absolute top-full left-12 inline-flex h-12 w-max -translate-y-6 items-center justify-center gap-3.5 rounded-2xl bg-white/90 px-8 text-sm font-semibold text-slate-700 shadow-lg shadow-sky-100/50 ring-1 ring-slate-900/5 backdrop-blur-md md:left-0 md:-translate-x-20 md:-translate-y-24 lg:-left-3 lg:-translate-y-24 lg:px-10 xl:-left-6 xl:-translate-y-32 xl:-translate-x-28">
                <image src="./images/friends.png" alt="" className="w-auto h-6" />
                Amigos
              </div>

              {/* Experience with Tech 3 */}
              <div className="absolute top-[350px] hidden h-12 w-max items-center justify-center gap-3.5 rounded-2xl bg-white/90 px-8 text-sm font-semibold text-slate-700 shadow-lg shadow-sky-100/50 ring-1 ring-slate-900/5 backdrop-blur-md md:left-full md:inline-flex md:-translate-x-32 lg:left-48 lg:hidden lg:px-10 2xl:left-full 2xl:inline-flex 2xl:-translate-x-28">
                <img src="./images/pasion.png" alt="" className="h-auto w-7" />
                Pasión
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeroSection;
