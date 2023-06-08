import React from "react";
import clarinet from "../assets/images/clarinet.png";
import sax from "../assets/images/sax.png";
import trumpet from "../assets/images/trumpet.png";
import gong from "../assets/images/gong.png";
import guitar from "../assets/images/guitar.png";

import arpa from "../assets/images/arpa.png";
import piano from "../assets/images/piano.png";
import marimba from "../assets/images/marimba.png";
import acordeon from "../assets/images/acordeon.png";
import flute from "../assets/images/flute.png";
import pandereta from "../assets/images/pandereta.png";

const Decor = () => {
  return (
    <section className="relative flex justify-center pt-16 bg-white gap-x-12 overflow-x-clip sm:gap-x-16 lg:pt-12 lg:pb-14">
      {/* Fading edges */}
      <div className="absolute inset-y-0 left-0 w-64 h-full bg-gradient-to-r from-white/50 to-white/0"></div>
      <div className="absolute inset-y-0 right-0 w-64 h-full bg-gradient-to-l from-white/50 to-white/0"></div>

      {/* Floating handwritten text with arrow */}
      <div className="absolute -top-2.5 right-4 flex transform gap-6 sm:right-16 lg:top-[unset] lg:right-0 lg:-bottom-12 xl:-bottom-20 2xl:right-32">
        <svg
          viewBox="0 0 107 62"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative -top-4 -right-1 h-auto w-[68px] rotate-[160deg] transform text-slate-600 lg:w-20 lg:rotate-[30deg] lg:-scale-x-100"
        >
          <path
            d="M0.447937 18.1614C9.81014 31.5352 18.4347 42.3598 31.519 52.0087C40.0175 58.2759 54.5547 65.2946 64.1291 57.0482C74.8617 47.8042 84.2643 34.1413 91.7659 22.1683C95.8416 15.6632 100.326 9.79988 103.994 3.06629C104.777 1.62775 106.117 0.590713 103.454 1.84721C99.6476 3.64332 95.7206 5.00081 91.7126 6.32044C84.0852 8.83174 82.4146 9.9082 92.4987 7.40962C94.8989 6.81489 101.851 3.59526 104.567 4.38527C107.097 5.12145 106.361 12.9525 106.422 14.9305C106.9 30.442 95.1386 15.7417 88.7647 11.1467"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          ></path>
        </svg>
        <span className="inline-block w-48 rotate-6 transform font-writing text-[22px] tracking-wide text-slate-600 lg:text-2xl">
          Nuestro día a día
        </span>
      </div>

      {/* Icon 1 */}
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-slate-50/90 shadow-sm shadow-sky-100 ring-1 ring-slate-100 sm:h-[88px] sm:w-[88px] mt-0">
        <img src="" alt="" className="w-8 h-auto shrink-0 sm:w-10" />
      </div>

      {/* Icon 2 */}
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-slate-50/90 shadow-sm shadow-sky-100 ring-1 ring-slate-100 sm:h-[88px] sm:w-[88px] mt-8">
        <img src={piano} alt="" className="w-8 h-auto shrink-0 sm:w-10" />
      </div>

      {/* Icon 3 */}
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-slate-50/90 shadow-sm shadow-sky-100 ring-1 ring-slate-100 sm:h-[88px] sm:w-[88px] mt-16">
        <img src={arpa} alt="" className="w-8 h-auto shrink-0 sm:w-10" />
      </div>

      {/* Icon 4 */}
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-slate-50/90 shadow-sm shadow-sky-100 ring-1 ring-slate-100 sm:h-[88px] sm:w-[88px] mt-24">
        <img src={gong} alt="" className="w-8 h-auto shrink-0 sm:w-10" />
      </div>

      {/* Icon 5 */}
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-slate-50/90 shadow-sm shadow-sky-100 ring-1 ring-slate-100 sm:h-[88px] sm:w-[88px] mt-16">
        <img src={guitar} alt="" className="w-8 h-auto shrink-0 sm:w-10" />
      </div>

      {/* Icon 6 */}
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-slate-50/90 shadow-sm shadow-sky-100 ring-1 ring-slate-100 sm:h-[88px] sm:w-[88px] mt-8">
        <img src={trumpet} alt="" className="w-8 h-auto shrink-0 sm:w-10" />
      </div>

      {/* Icon 7 */}
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-slate-50/90 shadow-sm shadow-sky-100 ring-1 ring-slate-100 sm:h-[88px] sm:w-[88px] mt-0">
        <img src={clarinet} alt="" className="w-8 h-auto shrink-0 sm:w-10" />
      </div>

      {/* Icon 8 */}
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-slate-50/90 shadow-sm shadow-sky-100 ring-1 ring-slate-100 sm:h-[88px] sm:w-[88px] mt-8">
        <img src={sax} alt="Netlify" className="w-8 h-auto shrink-0 sm:w-10" />
      </div>

      {/* Icon 9 */}
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-slate-50/90 shadow-sm shadow-sky-100 ring-1 ring-slate-100 sm:h-[88px] sm:w-[88px] mt-16">
        <img src={marimba} alt="" className="w-8 h-auto shrink-0 sm:w-10" />
      </div>

      {/* Icon 10 */}
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-slate-50/90 shadow-sm shadow-sky-100 ring-1 ring-slate-100 sm:h-[88px] sm:w-[88px] mt-24">
        <img src={acordeon} alt="" className="w-8 h-auto shrink-0 sm:w-10" />
      </div>

      {/* Icon 11 */}
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-slate-50/90 shadow-sm shadow-sky-100 ring-1 ring-slate-100 sm:h-[88px] sm:w-[88px] mt-16">
        <img src={flute} alt="" className="w-8 h-auto shrink-0 sm:w-10" />
      </div>

      {/* Icon 12 */}
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-slate-50/90 shadow-sm shadow-sky-100 ring-1 ring-slate-100 sm:h-[88px] sm:w-[88px] mt-8">
        <img src={pandereta} alt="" className="w-8 h-auto shrink-0 sm:w-10" />
      </div>

      {/* Icon 13 */}
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-slate-50/90 shadow-sm shadow-sky-100 ring-1 ring-slate-100 sm:h-[88px] sm:w-[88px] mt-0">
        <img src="" alt="" className="w-8 h-auto shrink-0 sm:w-10" />
      </div>
    </section>
  );
};

export default Decor;
