import { Link, useParams } from "react-router-dom";
import Header from "components/Header";
import Footer from "components/Footer";
import Seo from "components/Seo";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { ENSEMBLE_ORDER, getEnsembleContent, getLocaleContent } from "./content";
import { getPublicPath } from "utils/publicRoutes";

export default function GroupingsIndex() {
  const { lang } = useParams();
  const locale = lang === "en" ? "en" : "es";
  const content = getLocaleContent(locale);
  const hasOddCount = ENSEMBLE_ORDER.length % 2 !== 0;

  return (
    <>
      <Seo
        title={content.listing.seoTitle}
        description={content.listing.seoDescription}
        path={getPublicPath(locale, "ensembles")}
      />
      <Header />

      <section className="relative overflow-hidden bg-white lg:px-8 pt-10">
        <div className="relative max-w-screen-xl px-5 py-16 mx-auto bg-slate-50 sm:px-6 sm:py-24 lg:rounded-3xl lg:px-8 lg:py-28">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold tracking-[0.22em] text-sky-700 uppercase">
              {content.listing.eyebrow}
            </p>
            <h1 className="mt-4 text-5xl font-semibold font-display text-slate-900 sm:text-6xl">
              {content.listing.title}
            </h1>
            <p className="max-w-2xl mt-6 text-lg leading-8 text-slate-700">
              {content.listing.description}
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white sm:py-24">
        <div className="max-w-screen-xl px-5 mx-auto sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2">
            {ENSEMBLE_ORDER.map((slug, index) => {
              const ensemble = getEnsembleContent(locale, slug);
              const href = getPublicPath(locale, "ensembles", slug);
              const isFeaturedOddCard = hasOddCount && index === 0;

              return (
                <article
                  key={slug}
                  className={`overflow-hidden rounded-[32px] bg-slate-50 shadow-sm shadow-sky-100/50 ring-1 ring-slate-100 ${
                    isFeaturedOddCard ? "md:col-span-2" : ""
                  }`}
                >
                  <div
                    className={`grid h-full ${
                      isFeaturedOddCard ? "lg:grid-cols-[1.08fr,0.92fr]" : "lg:grid-cols-[1fr,0.92fr]"
                    }`}
                  >
                    <div className="p-7 sm:p-8">
                      <h2 className="text-3xl font-semibold font-display text-slate-900">
                        {ensemble.name}
                      </h2>
                      <p className="mt-4 text-md leading-7 text-slate-700">
                        {ensemble.shortDescription}
                      </p>
                      <div className="mt-8 flex flex-wrap gap-3">
                        <Link
                          to={href}
                          className="inline-flex items-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-sky-50 transition duration-200 ease-in-out hover:bg-sky-800"
                        >
                          {content.listing.cta}
                        </Link>
                        <a
                          href={`${href}#gallery`}
                          className="inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition duration-200 ease-in-out hover:bg-slate-100"
                        >
                          {locale === "en" ? "View gallery" : "Ver galería"}
                        </a>
                      </div>
                    </div>
                    <div className="relative min-h-[260px] bg-slate-200">
                      <LazyLoadImage
                        src={ensemble.heroImage}
                        alt={ensemble.name}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
