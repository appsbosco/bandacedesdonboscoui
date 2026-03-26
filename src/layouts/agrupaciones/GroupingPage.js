import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PropTypes from "prop-types";
import Header from "components/Header";
import Footer from "components/Footer";
import Seo from "components/Seo";
import { LazyLoadImage } from "react-lazy-load-image-component";
import BookingRequestForm from "./BookingRequestForm";
import { ENSEMBLE_META, getEnsembleContent } from "./content";
import { getPublicPath } from "utils/publicRoutes";

function StatCard({ title, text }) {
  return (
    <div className="rounded-3xl bg-slate-50 p-6 shadow-sm shadow-sky-100/50 ring-1 ring-slate-100">
      <h3 className="text-xl font-semibold font-display text-slate-900">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-700">{text}</p>
    </div>
  );
}

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
};

export default function GroupingPage() {
  const { lang, slug } = useParams();
  const locale = lang === "en" ? "en" : "es";
  const primaryCtaRef = useRef(null);
  const bookingFormRef = useRef(null);
  const [showFloatingCta, setShowFloatingCta] = useState(false);
  const ensemble = getEnsembleContent(locale, slug);
  const meta = ENSEMBLE_META[slug];

  if (!ensemble || !meta) {
    return null;
  }

  const listingPath = getPublicPath(locale, "ensembles");
  const currentPath = getPublicPath(locale, "ensembles", slug);

  useEffect(() => {
    const target = primaryCtaRef.current;
    const bookingTarget = bookingFormRef.current;
    if (!target || !bookingTarget || typeof window === "undefined") return undefined;

    const mediaQuery = window.matchMedia("(max-width: 767px)");
    let ctaVisible = true;
    let formVisible = false;
    let ctaObserver;
    let formObserver;

    const attachObserver = () => {
      if (!mediaQuery.matches) {
        setShowFloatingCta(false);
        return;
      }

      ctaObserver = new IntersectionObserver(
        ([entry]) => {
          ctaVisible = entry.isIntersecting;
          setShowFloatingCta(!ctaVisible && !formVisible);
        },
        {
          threshold: 0.35,
        }
      );

      formObserver = new IntersectionObserver(
        ([entry]) => {
          formVisible = entry.isIntersecting;
          setShowFloatingCta(!ctaVisible && !formVisible);
        },
        {
          threshold: 0.15,
        }
      );

      ctaObserver.observe(target);
      formObserver.observe(bookingTarget);
    };

    attachObserver();

    const handleChange = () => {
      if (ctaObserver) ctaObserver.disconnect();
      if (formObserver) formObserver.disconnect();
      attachObserver();
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (ctaObserver) ctaObserver.disconnect();
      if (formObserver) formObserver.disconnect();
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  return (
    <>
      <Seo
        title={ensemble.seoTitle}
        description={ensemble.seoDescription}
        image={ensemble.heroImage}
        path={currentPath}
      />
      <Header />

      <section className="relative overflow-hidden bg-white">
        <div className="max-w-screen-xl px-5 py-16 mx-auto sm:px-6 lg:px-8 lg:py-20">
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <Link to={listingPath} className="transition hover:text-slate-700">
              {locale === "en" ? "Ensembles" : "Agrupaciones"}
            </Link>
            <span>/</span>
            <span className="text-slate-700">{ensemble.name}</span>
          </div>

          <div className="mt-8 grid gap-10 lg:grid-cols-[0.98fr,1.02fr] lg:items-center">
            <div>
              <h1 className="text-5xl font-semibold font-display text-slate-900 sm:text-6xl">
                {ensemble.name}
              </h1>
              <p className="mt-6 text-lg leading-8 text-slate-700">{ensemble.heroSubtitle}</p>
              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  ref={primaryCtaRef}
                  href="#booking-form"
                  className="inline-flex items-center rounded-full bg-slate-900 px-7 py-3 text-md font-semibold text-sky-50 transition duration-200 ease-in-out hover:bg-sky-800"
                >
                  {locale === "en" ? "Request booking" : "Solicitar contratación"}
                </a>
                <a
                  href="#gallery"
                  className="inline-flex items-center rounded-full bg-slate-100/80 px-7 py-3 text-md font-semibold text-slate-900 ring-1 ring-slate-100 transition duration-200 ease-in-out hover:bg-slate-200/60"
                >
                  {locale === "en" ? "View gallery" : "Ver galería"}
                </a>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[32px] bg-slate-200 shadow-lg shadow-sky-100/60">
              <LazyLoadImage
                src={ensemble.heroImage}
                alt={ensemble.name}
                className="h-full min-h-[360px] w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white sm:py-20">
        <div className="max-w-screen-xl px-5 mx-auto sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.05fr,0.95fr]">
            <div>
              <h2 className="text-4xl font-semibold font-display text-slate-900 sm:text-5xl">
                {locale === "en" ? "Artistic proposal" : "Propuesta artística"}
              </h2>
              <div className="mt-6 space-y-5 text-lg leading-8 text-slate-700">
                {ensemble.description.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>

            <div className="grid gap-5">
              {ensemble.highlights.map((highlight) => (
                <StatCard key={highlight.title} title={highlight.title} text={highlight.text} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50 sm:py-20">
        <div className="max-w-screen-xl px-5 mx-auto sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-[32px] bg-white p-8 shadow-sm shadow-sky-100/60 ring-1 ring-slate-100">
              <h2 className="text-3xl font-semibold font-display text-slate-900">
                {locale === "en" ? "Repertoire" : "Repertorio"}
              </h2>
              <ul className="mt-6 space-y-4">
                {ensemble.repertoire.map((item) => (
                  <li key={item} className="flex gap-3 text-md leading-7 text-slate-700">
                    <span className="mt-2 h-2.5 w-2.5 rounded-full bg-sky-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[32px] bg-white p-8 shadow-sm shadow-sky-100/60 ring-1 ring-slate-100">
              <h2 className="text-3xl font-semibold font-display text-slate-900">
                {locale === "en" ? "Recommended events" : "Eventos recomendados"}
              </h2>
              <ul className="mt-6 flex flex-wrap gap-3">
                {ensemble.recommendedEvents.map((item) => (
                  <li
                    key={item}
                    className="rounded-full bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="gallery" className="py-16 bg-white sm:py-24">
        <div className="max-w-screen-xl px-5 mx-auto sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-4xl font-semibold font-display text-slate-900 sm:text-5xl">
                {locale === "en" ? "Gallery" : "Galería"}
              </h2>
            </div>
            <p className="text-sm font-medium text-slate-500">
              {locale === "en" ? "Swipe or scroll sideways" : "Desliza o haz scroll lateral"}
            </p>
          </div>

          <div className="relative mt-10">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-14 bg-gradient-to-r from-white to-transparent lg:block" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-14 bg-gradient-to-l from-white to-transparent lg:block" />
            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-5">
              {ensemble.gallery.map((image, index) => (
                <div
                  key={`${ensemble.name}-${index}`}
                  className="group relative min-w-[84%] snap-center overflow-hidden rounded-[28px] bg-slate-100 shadow-sm shadow-sky-100/50 ring-1 ring-slate-100 sm:min-w-[58%] lg:min-w-[33%] xl:min-w-[28%]"
                >
                  <LazyLoadImage
                    src={image}
                    alt={`${ensemble.name} ${index + 1}`}
                    className="h-80 w-full object-cover transition duration-500 group-hover:scale-105 sm:h-[26rem] lg:h-[28rem]"
                  />
                  {/* <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100/80">
                      {locale === "en" ? `Image ${index + 1}` : `Imagen ${index + 1}`}
                    </p>
                    <p className="mt-2 text-lg font-display text-white">{ensemble.name}</p>
                  </div> */}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50 sm:py-20">
        <div className="max-w-screen-xl px-5 mx-auto sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.92fr,1.08fr]">
            <div>
              <h2 className="text-4xl font-semibold font-display text-slate-900 sm:text-5xl">
                FAQ
              </h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                {locale === "en"
                  ? "The most common questions before confirming a booking."
                  : "Las consultas más comunes antes de confirmar una contratación."}
              </p>
            </div>
            <div className="space-y-4">
              {ensemble.faqs.map((faq) => (
                <details
                  key={faq.question}
                  className="group rounded-[28px] bg-white p-6 shadow-sm shadow-sky-100/60 ring-1 ring-slate-100"
                >
                  <summary className="cursor-pointer list-none text-lg font-semibold text-slate-900">
                    {faq.question}
                  </summary>
                  <p className="mt-4 text-md leading-7 text-slate-700">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div ref={bookingFormRef}>
        <BookingRequestForm ensembleKey={meta.key} ensembleName={ensemble.name} locale={locale} />
      </div>
      <Footer />

      {showFloatingCta ? (
        <div className="fixed inset-x-0 bottom-4 z-[1100] px-4 md:hidden">
          <div className="mx-auto flex max-w-sm items-center justify-between gap-3 rounded-full border border-white/60 bg-slate-900/90 px-3 py-3 shadow-2xl shadow-slate-900/30 ring-1 ring-sky-200/20 backdrop-blur-xl">
            <div className="min-w-0 pl-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-200/80">
                {locale === "en" ? "Quick Access" : "Acceso rápido"}
              </p>
              <p className="truncate text-sm font-semibold text-white">
                {locale === "en" ? "Request a quote" : "Solicitar cotización"}
              </p>
            </div>
            <a
              href="#booking-form"
              className="inline-flex flex-shrink-0 items-center rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition duration-200 ease-in-out hover:bg-sky-50"
            >
              {locale === "en" ? "Open" : "Abrir"}
            </a>
          </div>
        </div>
      ) : null}
    </>
  );
}
