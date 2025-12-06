import React from "react";
import landing from "../assets/images/landing.webp";
import pasion from "../assets/images/pasion.webp";
import friends from "../assets/images/friends.webp";
import family from "../assets/images/family.webp";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { useTranslation } from "react-i18next";
import HeroSection from "./HeroImages";

const Hero = () => {
  const { i18n, t } = useTranslation();
  const lang = i18n.language;

  return (
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

      {/* Hero content */}
      <div className="relative z-10 grid items-center max-w-screen-xl gap-16 px-5 mx-auto sm:px-6 lg:px-8 lg:grid-cols-2 lg:gap-8">
        <div className="flex flex-col items-center max-w-2xl mx-auto lg:items-start">
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
              <span className="relative">{t("hero.title_prefix")} </span>
            </span>
            {t("hero.title_suffix")}
          </h1>
          <p className="mt-6 text-lg leading-8 text-center text-slate-700 lg:text-left text-justify">
            {t("hero.description")}
          </p>
          <div className="flex flex-wrap items-center justify-center mt-10 gap-y-6 gap-x-10 lg:justify-start">
            <a
              href={`/${lang}/contacto`}
              className="h-11 bg-slate-900 text-white hover:bg-sky-800 inline-flex items-center rounded-full gap-2.5 justify-center px-7 py-3 text-md font-semibold leading-none outline-offset-2 transition-all duration-200 ease-in-out active:transition-none"
            >
              {t("hero.contact")}
            </a>

            {/* Social links */}
            <div className="flex gap-3 sm:gap-4">
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
                  <g>
                    <path d="M12,2.982c2.937,0,3.285.011,4.445.064a6.072,6.072,0,0,1,2.042.379,3.4,3.4,0,0,1,1.265.823,3.4,3.4,0,0,1,.823,1.265,6.072,6.072,0,0,1,.379,2.042c.053,1.16.064,1.508.064,4.445s-.011,3.285-.064,4.445a6.072,6.072,0,0,1-.379,2.042,3.644,3.644,0,0,1-2.088,2.088,6.072,6.072,0,0,1-2.042.379c-1.16.053-1.508.064-4.445.064s-3.285-.011-4.445-.064a6.072,6.072,0,0,1-2.042-.379,3.4,3.4,0,0,1-1.265-.823,3.4,3.4,0,0,1-.823-1.265,6.072,6.072,0,0,1-.379-2.042c-.053-1.16-.064-1.508-.064-4.445s.011-3.285.064-4.445a6.072,6.072,0,0,1,.379-2.042,3.4,3.4,0,0,1,.823-1.265,3.4,3.4,0,0,1,1.265-.823,6.072,6.072,0,0,1,2.042-.379c1.16-.053,1.508-.064,4.445-.064M12,1c-2.987,0-3.362.013-4.535.066a8.108,8.108,0,0,0-2.67.511A5.625,5.625,0,0,0,1.577,4.8a8.108,8.108,0,0,0-.511,2.67C1.013,8.638,1,9.013,1,12s.013,3.362.066,4.535a8.108,8.108,0,0,0,.511,2.67A5.625,5.625,0,0,0,4.8,22.423a8.108,8.108,0,0,0,2.67.511C8.638,22.987,9.013,23,12,23s3.362-.013,4.535-.066a8.108,8.108,0,0,0,2.67-.511A5.625,5.625,0,0,0,22.423,19.2a8.108,8.108,0,0,0,.511-2.67C22.987,15.362,23,14.987,23,12s-.013-3.362-.066-4.535a8.108,8.108,0,0,0-.511-2.67A5.625,5.625,0,0,0,19.2,1.577a8.108,8.108,0,0,0-2.67-.511C15.362,1.013,14.987,1,12,1Z"></path>
                    <path d="M12,6.351A5.649,5.649,0,1,0,17.649,12,5.649,5.649,0,0,0,12,6.351Zm0,9.316A3.667,3.667,0,1,1,15.667,12,3.667,3.667,0,0,1,12,15.667Z"></path>
                    <circle cx="17.872" cy="6.128" r="1.32"></circle>
                  </g>
                </svg>
              </a>

              {/* Link 3 */}
              <a
                className="flex items-center justify-center duration-200 border rounded-full h-11 w-11 border-slate-200 hover:bg-slate-50"
                href="https://www.facebook.com/bcdbcr"
                aria-label="Síganos en Facebook"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  className="bi bi-facebook"
                  viewBox="0 0 16 16"
                >
                  <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z"></path>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Hero graphics */}
        <HeroSection />
      </div>
    </section>
  );
};

export default Hero;
