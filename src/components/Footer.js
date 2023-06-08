import React from "react";
import newsletter from "../assets/images/newsletter-bg.svg";
const Footer = () => {
  return (
    <>
      <section className="pt-12 sm:pt-16 bg-white">
        <div className="relative">
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-slate-900"></div>
          <div className="relative max-w-screen-xl px-4 mx-auto sm:px-6 lg:px-8">
            <div className="relative px-5 py-12 overflow-hidden rounded-2xl bg-sky-700 sm:px-16 lg:py-14">
              <img
                src={newsletter}
                alt=""
                className="absolute inset-0 object-cover object-right w-full h-full"
              />

              <div className="relative flex flex-col items-center w-full lg:flex-row">
                <div className="max-w-2xl text-center lg:pr-4 lg:text-left">
                  <h3 className="text-4xl font-semibold text-white font-display sm:text-5xl">
                    Ponte en contacto con nosotros
                  </h3>
                  <p className="max-w-lg mx-auto mt-4 text-lg text-sky-50 lg:mx-0 lg:mt-6">
                    ¡Contáctanos en nuestras redes sociales y descubre todo lo que tenemos para
                    ofrecerte! Encuéntranos en Facebook, Instagram y WhatsApp
                  </p>
                </div>

                <form
                  action="#"
                  method="post"
                  className="relative z-10 w-full max-w-lg mt-10 lg:mt-0"
                >
                  <input
                    type="text"
                    className="h-14 w-full rounded-full border-0 bg-white/10 py-3.5 pl-5 pr-32 text-sm leading-5 text-sky-50 placeholder-sky-100/90 outline-none ring-1 ring-white/25 backdrop-blur duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-white/30 sm:pl-6"
                    required
                    placeholder="Ingresa tu mensaje "
                    autoComplete="text"
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 top-1.5 inline-flex h-11 items-center rounded-full bg-sky-900 py-3 px-5 text-sm font-semibold text-sky-50 outline-none transition duration-200 ease-in-out hover:bg-sky-800 focus:outline-none sm:px-7 sm:text-md"
                  >
                    Enviar
                  </button>
                </form>
              </div>

              <svg
                width="390"
                height="319"
                viewBox="0 0 390 319"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="absolute h-auto -bottom-24 -right-24 w-96"
              >
                <g clipPath="url(#clip0_776_176)">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M34.873 301.123C49.0025 238.088 107.966 211.273 168.222 240.483C190.777 251.415 197.856 250.42 211.586 234.377C220.916 223.483 223.457 215.284 224.068 194.133C224.954 163.469 225.473 162.37 239.847 160.666C250.341 159.421 259.073 160.089 274.02 163.287C313.702 171.778 324.748 165.182 323.138 133.968C321.464 101.499 325.66 87.1588 339.61 77.7183C348.575 71.6569 364.263 74.9076 362.796 82.5308C362.452 84.3148 362.19 84.3623 357.066 83.5862C350.182 82.5361 346.096 84.1821 340.699 90.1724C333.329 98.3593 331.997 107.044 333.336 138.233C334.814 172.771 317.209 182.6 271.916 172.519C253.722 168.47 235.489 168.412 234.734 172.404C234.154 175.443 233.647 184.125 233.256 197.636C232.676 217.794 230.011 225.964 219.795 238.868C202.835 260.3 190.736 262.128 162.105 247.584C113.637 222.966 64.0667 239.682 43.7277 287.505C37.8764 301.26 36.147 311.316 39.5467 311.777C42.3563 312.164 42.3507 315.929 39.5424 316.676C34.5673 317.996 32.5764 311.363 34.873 301.123ZM31.4012 252.649C39.787 224.248 61.9305 205.695 98.0315 196.825C111.849 193.428 118.55 194.274 145.18 202.775C177.686 213.148 193.604 195.483 183.07 160.728C177.917 143.711 178.25 132.213 184.147 123.702C191.731 112.754 197.513 112.503 223.954 121.975C252.445 132.177 274.213 119.132 270.161 94.2783C266.166 69.8088 265.939 65.2565 268.455 59.8844C274.19 47.6362 284.622 41.7789 304.56 39.6119C316.853 38.2772 318.239 37.9382 322.714 35.2211C328.814 31.5151 329.161 31.4938 329.553 34.7756C330.455 42.3298 323.607 46.1775 305.912 48.0687C280.567 50.7763 271.167 60.4362 276.038 78.7691C282.908 104.614 281.524 113.716 269.125 124.198C253.911 137.07 242.086 138.409 218.365 129.965C197.907 122.68 196.704 122.541 192.655 127.027C186.891 133.408 186.763 141.122 192.13 159.012C199.722 184.335 195.92 199.94 179.598 210.438C168.464 217.598 160.67 217.467 137.309 209.722C113.938 201.97 106.128 201.741 86.4548 208.238C67.7582 214.408 57.4748 221.2 47.0923 234.241C35.0198 249.397 29.7124 267.23 37.5496 266.294C39.0121 266.12 39.9697 266.55 40.0747 267.429C40.3241 269.518 34.334 269.995 32.1043 268.066C29.4844 265.797 29.222 260.026 31.4012 252.649ZM27.6647 220.983C32.306 201.179 50.1519 183.357 72.5364 176.182C79.8321 173.842 82.1283 173.673 100.744 174.072C134.377 174.789 144.756 165.23 143.829 134.387C143.162 112.195 145.712 102.885 155.687 91.1309C168.071 76.5394 175.321 74.2615 195.275 78.6894C224.042 85.0708 237.609 75.3248 235.913 49.4834C234.852 33.2737 237.487 26.786 247.921 19.9318C260.021 11.983 294.501 7.70851 295.26 14.0653C295.541 16.4242 296.926 16.1056 274.143 18.923C244.291 22.6166 241.738 24.951 243.253 47.1383C245.415 78.7542 226.798 93.2468 193.506 85.8604C176.37 82.0564 172.722 83.0528 162.11 94.4108C153.044 104.115 150.621 112.414 151.153 131.947C152.232 171.648 138.717 183.401 95.4441 180.398C72.8278 178.826 54.0187 186.608 40.8705 202.965C32.1592 213.801 28.051 228.813 32.9068 232.042C35.0911 233.487 35.0391 234.958 32.7994 235.226C27.9953 235.799 25.6915 229.405 27.6647 220.983Z"
                    fill="#F0F9FF"
                    fillOpacity="0.1"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_776_176">
                    <rect
                      width="277.68"
                      height="358.714"
                      fill="white"
                      transform="matrix(0.118567 0.992946 0.992946 -0.118567 0 42.5317)"
                    />
                  </clipPath>
                </defs>
              </svg>
            </div>
          </div>
        </div>
        <footer className="pt-20 pb-8 overflow-hidden bg-slate-900 sm:pt-24 sm:pb-12 lg:pt-32">
          <div className="max-w-screen-xl px-5 mx-auto sm:px-6 lg:px-8">
            <div className="grid items-center max-w-xl gap-5 mx-auto lg:mx-0 lg:max-w-none lg:grid-cols-12 lg:gap-12 xl:gap-20">
              <div className="lg:col-span-7">
                <h3 className="text-4xl font-semibold text-center text-white font-display sm:text-5xl lg:max-w-xl lg:text-left">
                  ¡ Hagamos algo grandioso juntos !
                </h3>
                <div className="hidden lg:block">
                  <a
                    href="#"
                    className="mt-12 bg-white hover:bg-sky-50 text-slate-700 inline-flex items-center rounded-full gap-2.5 justify-center px-7 py-3 text-md font-semibold leading-none outline-offset-2 transition-all duration-200 ease-in-out active:transition-none"
                  >
                    Contáctanos
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </a>
                </div>
              </div>
              <div className="flex flex-col items-center lg:col-span-5 lg:items-start">
                <p className="text-lg text-center text-slate-50 lg:max-w-sm lg:text-left">
                  Estaremos encantados de responder tus preguntas y brindarte toda la información
                  que necesites.
                </p>

                <a
                  href="#"
                  className="mt-10 inline-flex items-center justify-center gap-x-2.5 rounded-full bg-white py-3 px-7 text-md font-semibold leading-none text-slate-700 duration-200 ease-in-out hover:bg-sky-50 lg:hidden"
                >
                  Contáctanos
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>

                <div className="mt-16 grid w-full max-w-sm grid-cols-2 gap-3.5 sm:max-w-none sm:grid-cols-3 lg:mt-8 lg:gap-2.5 xl:gap-3.5">
                  <a
                    href="https://www.facebook.com/bcdbcr"
                    className="flex items-center justify-center gap-2.5 rounded-full border border-slate-600/90 py-2.5 text-sm text-slate-50 duration-200 ease-in-out hover:bg-slate-800 hover:text-white lg:gap-2 xl:gap-2.5"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="currentColor"
                      className="bi bi-facebook"
                      viewBox="0 0 16 16"
                    >
                      {" "}
                      <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z" />{" "}
                    </svg>
                    Facebook
                  </a>

                  <a
                    href="https://www.instagram.com/bandacedesdonbosco"
                    className="flex items-center justify-center gap-2.5 rounded-full border border-slate-600/90 py-2.5 text-sm text-slate-50 duration-200 ease-in-out hover:bg-slate-800 hover:text-white lg:gap-2 xl:gap-2.5"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-4 h-4 duration-200 ease-in-out shrink-0 text-slate-200 group-hover:fill-slate-100"
                    >
                      <g>
                        <path d="M12,2.982c2.937,0,3.285.011,4.445.064a6.072,6.072,0,0,1,2.042.379,3.4,3.4,0,0,1,1.265.823,3.4,3.4,0,0,1,.823,1.265,6.072,6.072,0,0,1,.379,2.042c.053,1.16.064,1.508.064,4.445s-.011,3.285-.064,4.445a6.072,6.072,0,0,1-.379,2.042,3.644,3.644,0,0,1-2.088,2.088,6.072,6.072,0,0,1-2.042.379c-1.16.053-1.508.064-4.445.064s-3.285-.011-4.445-.064a6.072,6.072,0,0,1-2.042-.379,3.4,3.4,0,0,1-1.265-.823,3.4,3.4,0,0,1-.823-1.265,6.072,6.072,0,0,1-.379-2.042c-.053-1.16-.064-1.508-.064-4.445s.011-3.285.064-4.445a6.072,6.072,0,0,1,.379-2.042,3.4,3.4,0,0,1,.823-1.265,3.4,3.4,0,0,1,1.265-.823,6.072,6.072,0,0,1,2.042-.379c1.16-.053,1.508-.064,4.445-.064M12,1c-2.987,0-3.362.013-4.535.066a8.108,8.108,0,0,0-2.67.511A5.625,5.625,0,0,0,1.577,4.8a8.108,8.108,0,0,0-.511,2.67C1.013,8.638,1,9.013,1,12s.013,3.362.066,4.535a8.108,8.108,0,0,0,.511,2.67A5.625,5.625,0,0,0,4.8,22.423a8.108,8.108,0,0,0,2.67.511C8.638,22.987,9.013,23,12,23s3.362-.013,4.535-.066a8.108,8.108,0,0,0,2.67-.511A5.625,5.625,0,0,0,22.423,19.2a8.108,8.108,0,0,0,.511-2.67C22.987,15.362,23,14.987,23,12s-.013-3.362-.066-4.535a8.108,8.108,0,0,0-.511-2.67A5.625,5.625,0,0,0,19.2,1.577a8.108,8.108,0,0,0-2.67-.511C15.362,1.013,14.987,1,12,1Z"></path>
                        <path d="M12,6.351A5.649,5.649,0,1,0,17.649,12,5.649,5.649,0,0,0,12,6.351Zm0,9.316A3.667,3.667,0,1,1,15.667,12,3.667,3.667,0,0,1,12,15.667Z"></path>
                        <circle cx="17.872" cy="6.128" r="1.32"></circle>
                      </g>
                    </svg>
                    Instagram
                  </a>

                  <a
                    href="https://wa.me/50660491166"
                    className="flex items-center justify-center gap-2.5 rounded-full border border-slate-600/90 py-2.5 text-sm text-slate-50 duration-200 ease-in-out hover:bg-slate-800 hover:text-white lg:gap-2 xl:gap-2.5"
                  >
                    <svg
                      style={{ color: "white" }}
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="currentColor"
                      className="bi bi-whatsapp"
                      viewBox="0 0 16 16"
                    >
                      {" "}
                      <path
                        d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"
                        fill="white"
                      ></path>{" "}
                    </svg>
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>

            <hr className="w-full h-px mt-12 mb-6 border-slate-600/90 sm:mt-16 sm:mb-10" />

            <div className="flex flex-col items-center justify-between md:flex-row">
              <div className="flex items-center gap-6">
                <a
                  href="index.html"
                  className="text-base font-medium duration-200 ease-in-out text-slate-100 hover:text-white"
                >
                  Home
                </a>
                <a
                  href="about.html"
                  className="text-base font-medium duration-200 ease-in-out text-slate-100 hover:text-white"
                >
                  Nosotros
                </a>

                <a
                  href="contact.html"
                  className="text-base font-medium duration-200 ease-in-out text-slate-100 hover:text-white"
                >
                  Contacto
                </a>
              </div>

              <p className="mt-8 text-base text-slate-400/90 md:mt-0">
                Copyright © 2023 Banda CEDES Don Bosco. Todos los derechos reservados{" "}
              </p>

              <p className="mt-8 text-base text-slate-400/90 md:mt-0">
                Desarrollado por Josué Chinchilla Salazar{" "}
              </p>
            </div>
          </div>
        </footer>
      </section>
    </>
  );
};

export default Footer;
