"use client";

import { useState, useEffect, useCallback } from "react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { useTranslation } from "react-i18next";
import landing from "../assets/images/landing-5.webp";
// import landing2 from "../assets/images/landing-2.webp";
import landing3 from "../assets/images/landing-3.webp";
import landing4 from "../assets/images/landing-4.webp";
import landing5 from "../assets/images/landing-6.webp";
import pasion from "../assets/images/pasion.webp";
import friends from "../assets/images/friends.webp";
import family from "../assets/images/family.webp";

const HERO_IMAGES = [
  {
    src: landing,
    alt: "Banda CEDES Don Bosco - Banda de marcha",
  },
  {
    src: landing3,
    alt: "Banda CEDES Don Bosco - Presentación",
  },
  // {
  //   src: landing4,
  //   alt: "Banda CEDES Don Bosco - Ensayo",
  // },
  {
    src: landing5,
    alt: "Banda CEDES Don Bosco - Ensayo",
  },
];

const TRANSITION_INTERVAL = 5000; // 5 segundos

export default function HeroSection() {
  const { i18n, t } = useTranslation();
  const lang = i18n.language;

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const nextImage = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentImageIndex((prev) => (prev + 1) % HERO_IMAGES.length);
      setIsTransitioning(false);
    }, 300);
  }, []);

  useEffect(() => {
    const interval = setInterval(nextImage, TRANSITION_INTERVAL);
    return () => clearInterval(interval);
  }, [nextImage]);

  return (
    <div className="w-full max-w-lg mx-auto lg:mr-0">
      <div
        className="relative aspect-h-5 aspect-w-4 rounded-2xl bg-slate-50"
        style={{
          aspectRatio: "5 / 6",
        }}
      >
        {/* Preload todas las imágenes */}
        {HERO_IMAGES.map((img, idx) => (
          <LazyLoadImage
            key={img.src}
            className={`object-cover object-center w-full h-full rounded-2xl transition-opacity duration-300 ${
              idx === currentImageIndex && !isTransitioning ? "opacity-100" : "opacity-0"
            }`}
            src={img.src}
            alt={img.alt}
            sizes="(min-width: 552px) 32rem, calc(100vw - 40px)"
            fill
            priority={idx === 0}
          />
        ))}

        <div>
          {/* Floating handwritten text with arrow */}
          <div className="absolute hidden w-max md:top-16 md:left-full md:block lg:-top-8 lg:-left-28 2xl:top-16 2xl:left-full">
            <span className="inline-block transform font-writing text-2xl tracking-wide text-slate-600 md:rotate-[16deg] lg:translate-x-6 lg:rotate-[-18deg] 2xl:rotate-12">
              {t("hero.handwritten")}
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="103"
              height="102"
              viewBox="0 0 103 102"
              fill="none"
              className="h-auto w-28 text-slate-600 md:-translate-x-1/2 md:-translate-y-6 md:rotate-0 lg:translate-x-3/4 lg:-translate-y-3 lg:rotate-12 lg:-scale-x-100 2xl:-translate-x-1/2 2xl:-translate-y-6 2xl:rotate-0 2xl:scale-x-100"
            >
              <g>
                <path
                  d="M100.676 26.5417C93.9574 46.1137 83.3723 65.5204 62.3048 74.1115C51.0557 78.6989 36.7215 76.3709 36.7673 62.5332C36.7985 53.1087 42.243 38.3844 53.849 37.3949C66.6654 36.3021 46.8111 57.0334 44.2548 58.8791C32.2897 67.5184 20.2216 71.4112 5.76428 74.151C0.348605 75.1774 3.24474 76.5966 6.85897 77.2296C9.99484 77.7788 13.5771 78.3248 16.755 78.0657C17.7243 77.9867 11.502 77.2793 10.5148 77.213C6.28171 76.9284 1.40658 76.4418 2.9682 71.2948C3.21916 70.4678 6.25335 62.9691 7.53037 63.112C8.19484 63.1864 9.21134 68.8129 9.5344 69.5548C11.6329 74.3731 14.1134 76.5032 19.3253 77.6737"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </g>
            </svg>
          </div>

          {/* Floating divs over image */}
          <div>
            {/* Experience with Tech 1 */}
            <div className="absolute right-12 -top-6 inline-flex h-12 w-max items-center justify-center gap-3.5 rounded-2xl bg-white/90 px-8 text-sm font-semibold text-slate-700 shadow-lg shadow-sky-100/50 ring-1 ring-slate-900/5 backdrop-blur-md md:-left-28 md:top-14 lg:left-44 lg:-top-6 lg:px-10 2xl:-left-48 2xl:top-14">
              <LazyLoadImage width={10} height={10} src={family} alt="" className="w-4 h-auto" />
              {t("hero.label_family")}
            </div>

            {/* Experience with Tech 2 */}
            <div className="absolute top-full left-12 inline-flex h-12 w-max -translate-y-6 items-center justify-center gap-3.5 rounded-2xl bg-white/90 px-8 text-sm font-semibold text-slate-700 shadow-lg shadow-sky-100/50 ring-1 ring-slate-900/5 backdrop-blur-md md:left-0 md:-translate-x-20 md:-translate-y-24 lg:-left-3 lg:-translate-y-24 lg:px-10 xl:-left-6 xl:-translate-y-32 xl:-translate-x-28">
              <LazyLoadImage width={10} height={10} src={friends} alt="" className="w-auto h-6" />
              {t("hero.label_friends")}
            </div>

            {/* Experience with Tech 3 */}
            <div className="absolute top-[350px] hidden h-12 w-max items-center justify-center gap-3.5 rounded-2xl bg-white/90 px-8 text-sm font-semibold text-slate-700 shadow-lg shadow-sky-100/50 ring-1 ring-slate-900/5 backdrop-blur-md md:left-full md:inline-flex md:-translate-x-32 lg:left-48 lg:hidden lg:px-10 2xl:left-full 2xl:inline-flex 2xl:-translate-x-28">
              <LazyLoadImage width={10} height={10} src={pasion} alt="" className="h-auto w-7" />
              {t("hero.label_passion")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
