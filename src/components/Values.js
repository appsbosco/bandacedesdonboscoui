import React from "react";
import cover from "../assets/images/cover-landing.webp";
import coverMobile from "../assets/images/cover-landing-mobile.png";
import HandshakeIcon from "@mui/icons-material/Handshake";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import HouseIcon from "@mui/icons-material/House";
import { LazyLoadImage } from "react-lazy-load-image-component";

const Values = () => {
  return (
    <section className="relative pt-20 pb-40 overflow-hidden bg-gradient-to-b from-slate-50 via-slate-50 to-white sm:pt-24 lg:pt-32 lg:pb-64 text-justify">
      {/* Container */}
      <div className="max-w-screen-xl px-5 mx-auto sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="grid items-center max-w-xl gap-6 mx-auto lg:mx-0 lg:max-w-none lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="text-4xl font-semibold font-display text-slate-900 sm:text-5xl">
              Nuestros
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

                <span className="relative text-sky-700"> valores </span>
              </span>
            </h2>
          </div>
          <div>
            <p className="text-lg leading-8 text-slate-700">
              Amistad, pasión y familia. Nuestros miembros comparten una conexión profunda y
              trabajan juntos para ofrecer actuaciones emotivas y llenas de energía. ¡Descubre el
              talento y la unión de esta increíble banda!
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="grid max-w-xl mx-auto mt-16 gap-14 lg:mx-0 lg:mt-24 lg:max-w-none lg:grid-cols-12 lg:gap-7">
          {/* Features with icons */}
          <div className="max-w-lg lg:col-span-4">
            <ul className="relative">
              {/* Feature 1 */}
              <li>
                <div className="relative pb-24 lg:pb-20">
                  <span
                    className="absolute -ml-px border border-dashed top-24 left-10 bottom-4 border-slate-300"
                    aria-hidden="true"
                  ></span>
                  <div className="relative flex space-x-7">
                    <div>
                      <span className="flex items-center justify-center w-20 h-20 rounded-full shadow-lg bg-slate-900">
                        <HandshakeIcon style={{ color: "white" }} fontSize="large" />
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-medium font-display text-slate-900">Amistad</h3>
                      <p className="mt-2.5 text-base text-slate-700">
                        Valoramos la amistad, creando lazos fuertes y duraderos entre nuestros
                        miembros, quienes comparten su amor por la música y trabajan juntos para
                        alcanzar metas comunes.
                      </p>
                    </div>
                  </div>
                </div>
              </li>

              {/* Feature 2 */}
              <li>
                <div className="relative pb-24 lg:pb-20">
                  <span
                    className="absolute -ml-px border border-dashed top-24 left-10 bottom-4 border-slate-300"
                    aria-hidden="true"
                  ></span>
                  <div className="relative flex space-x-7">
                    <div>
                      <span className="flex items-center justify-center w-20 h-20 rounded-full shadow-lg bg-slate-900">
                        <MusicNoteIcon style={{ color: "white" }} fontSize="large" />
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-medium font-display text-slate-900">Pasión</h3>
                      <p className="mt-2.5 text-base text-slate-700">
                        Cada miembro está impulsado por un amor profundo hacia la música y se
                        esfuerza por transmitir emociones y sentimientos a través de sus
                        interpretaciones.
                      </p>
                    </div>
                  </div>
                </div>
              </li>

              {/* Feature 3 */}
              <li>
                <div className="relative">
                  <div className="relative flex space-x-7">
                    <div>
                      <span className="flex items-center justify-center w-20 h-20 rounded-full shadow-lg bg-slate-900">
                        <HouseIcon style={{ color: "white" }} fontSize="large" />
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-medium font-display text-slate-900">Familia</h3>
                      <p className="mt-2.5 text-base text-slate-700">
                        Somos una familia unida por el amor compartido por la música, creando un
                        ambiente de armonía que va más allá de la música.
                      </p>
                    </div>
                  </div>
                </div>
              </li>

              {/* Floating handwritten text with arrow */}
              <div className="absolute hidden gap-6 -bottom-36 -right-8 lg:flex">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="81"
                  height="83"
                  viewBox="0 0 81 83"
                  fill="none"
                  className="relative w-20 h-auto -top-2 text-slate-600"
                >
                  <g clipPath="url(#clip0_112_68)">
                    <path
                      d="M79.0279 62.2024C58.1227 60.567 37.0551 52.8379 23.5836 35.8709C19.6389 30.9027 16.5994 23.913 14.6598 17.809C14.25 16.519 14.0629 15.1736 13.8444 13.8392C13.6447 12.6204 8.83154 19.8767 8.22696 20.6903C1.76323 29.3888 8.93024 20.1844 10.9563 16.5611C12.5286 13.7492 13.3857 10.1847 15.3992 7.63962C17.0205 5.59024 20.2035 9.67344 21.5513 10.8281C22.9371 12.0152 33.1749 18.4514 29.1817 20.1187C22.0175 23.1101 14.7009 22.4979 7.21764 22.9016"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_112_68">
                      <rect
                        width="85"
                        height="29"
                        fill="white"
                        transform="translate(21.4469 0.837036) rotate(46.0556)"
                      />
                    </clipPath>
                  </defs>
                </svg>
                <span className="inline-block max-w-[220px] -rotate-12 transform font-writing text-2xl tracking-wide text-slate-600">
                  Lo que nos diferencia
                </span>
              </div>
            </ul>
          </div>

          {/* Graphics */}
          <div className="lg:col-span-8 lg:pl-8 xl:pl-24">
            <div className="relative w-full aspect-w-3 aspect-h-2">
              {/* <img
                className="object-cover object-center w-full h-full rounded-3xl"
                src={cover}
                alt=""
                sizes="(min-width: 1280px) 705.34px, (min-width: 1024px) calc((100vw - 64px) * 0.6667 - 32px), (min-width: 616px) 36rem, calc(100vw - 40px)"
              /> */}

              <LazyLoadImage
                className="object-cover object-center w-full h-full rounded-3xl"
                alt=""
                src={cover}
                srcSet={`${coverMobile} 480w, ${cover} 800w`}
                sizes="(max-width: 551px) 480px, 800px"
              />
              <div>
                {/* Stats */}
                <div className="absolute bottom-0 grid grid-cols-2 gap-5 px-6 py-8 text-center translate-x-1/2 right-1/2 w-max translate-y-3/4 rounded-2xl bg-sky-700/90 backdrop-blur-sm sm:translate-y-1/2 sm:gap-12 sm:p-10 lg:right-20 lg:translate-x-0">
                  <div className="flex flex-col gap-1">
                    <dt className="text-sm font-semibold leading-6 text-sky-50">Integrantes</dt>
                    <dd className="order-first text-3xl font-extrabold text-white sm:text-4xl">
                      200
                    </dd>
                  </div>

                  <div className="flex flex-col gap-1">
                    <dt className="text-sm font-semibold leading-6 text-sky-50">
                      Años de historia
                    </dt>
                    <dd className="order-first text-3xl font-extrabold text-white sm:text-4xl">
                      58
                    </dd>
                  </div>
                </div>

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="82"
                  height="84"
                  viewBox="0 0 82 84"
                  className="absolute w-20 h-auto -top-8 -right-8 text-slate-700"
                >
                  <g clipPath="url(#clip0_102_2463)">
                    <path
                      d="M41.5816 1.21606C39.7862 5.82482 40.3852 10.0977 40.5593 14.9633C40.7854 21.2812 40.9774 27.5593 41.4363 33.8661"
                      stroke="currentColor"
                      strokeWidth="1.90596"
                      strokeLinecap="round"
                    />
                    <path
                      d="M41.0651 45.1798C39.7505 51.5096 40.3418 57.6794 40.8893 64.0791C41.4093 70.1568 42.1389 76.2117 42.8566 82.2682"
                      stroke="currentColor"
                      strokeWidth="1.90596"
                      strokeLinecap="round"
                    />
                    <path
                      d="M1.13412 46.6647C5.16695 44.8703 8.9688 44.7974 13.3092 44.5029C19.8761 44.0572 26.2025 43.2089 32.656 41.952"
                      stroke="currentColor"
                      strokeWidth="1.90596"
                      strokeLinecap="round"
                    />
                    <path
                      d="M47.2629 40.0959C58.4139 39.3819 69.3895 37.5305 80.4472 35.9965"
                      stroke="currentColor"
                      strokeWidth="1.90596"
                      strokeLinecap="round"
                    />
                    <path
                      d="M49.3429 34.6508L52.917 28.1667"
                      stroke="currentColor"
                      strokeWidth="1.90596"
                      strokeLinecap="round"
                    />
                    <path
                      d="M32.9786 50.3504L28.6387 54.6391"
                      stroke="currentColor"
                      strokeWidth="1.90596"
                      strokeLinecap="round"
                    />
                    <path
                      d="M52.6361 48.6656L56.9506 51.5758"
                      stroke="currentColor"
                      strokeWidth="1.90596"
                      strokeLinecap="round"
                    />
                    <path
                      d="M31.549 30.8471C26.8741 29.4323 22.7143 27.3543 18.2738 25.3586"
                      stroke="currentColor"
                      strokeWidth="1.90596"
                      strokeLinecap="round"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_102_2463">
                      <rect width="82" height="84" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Values;
