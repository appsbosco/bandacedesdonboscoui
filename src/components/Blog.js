import React, { useMemo } from "react";
import LibraryMusicIcon from "@mui/icons-material/LibraryMusic";
import { LazyLoadImage } from "react-lazy-load-image-component";

import articles from "../layouts/blog/ArticlesData";

const Blog = () => {
  const latestArticles = useMemo(() => {
    // Por si en algún momento ArticlesData deja de venir ordenado:
    const sorted = [...articles].sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
    return sorted.slice(0, 3); // últimos 3
  }, []);

  return (
    <section className="py-16 overflow-hidden bg-white sm:pt-24 lg:pt-28">
      <div className="max-w-screen-xl px-5 mx-auto sm:px-6 lg:px-8">
        <h2 className="max-w-2xl mx-auto text-4xl font-semibold leading-tight text-center font-display text-slate-900 sm:text-5xl sm:leading-tight">
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
            <span className="relative text-sky-700">Presentaciones </span>
          </span>
          <br /> recientes de nuestra banda
        </h2>

        <div className="relative grid max-w-lg gap-8 mx-auto mt-14 sm:mt-16 md:mx-0 md:max-w-none md:grid-cols-2 lg:grid-cols-3 lg:gap-y-6 lg:gap-x-5 xl:gap-x-6 xl:gap-y-8">
          {/* Texto flotante */}
          <div className="absolute hidden gap-6 -top-20 lg:-left-4 xl:flex 2xl:-left-24">
            <span className="inline-block text-2xl tracking-wide transform -rotate-12 font-writing text-slate-600">
              Últimas presentaciones
            </span>
            <svg
              viewBox="0 0 85 29"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="relative w-16 h-auto transform rotate-45 -left-1 top-2 -scale-100 text-slate-600"
            >
              <path
                d="M84.1428 1.12604C68.4579 15.0432 48.2728 24.8484 26.7076 22.7737C20.393 22.1662 13.251 19.5041 7.51 16.6647C6.29685 16.0646 5.19832 15.2656 4.08583 14.4969C3.06981 13.7949 4.95423 22.296 5.12047 23.2959C6.89794 33.9863 5.2443 22.4385 4.04146 18.4653C3.10796 15.3818 1.13626 12.2911 0.701068 9.07517C0.350636 6.4856 5.49948 7.02736 7.26614 6.8582C9.08258 6.68426 20.8214 3.77937 19.2507 7.81152C16.4328 15.0458 10.9147 19.889 6.01223 25.5572"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {latestArticles.map((article) => {
            const href = article.slug ? `/blog/${article.slug}` : `/blog/${article.id}`;
            const coverImage = article.images?.[0] ?? "";
            const typeLabel = article.type ?? "Banda de marcha";
            const dateLabel = article.date ?? "";

            return (
              <article
                key={article.id}
                className="flex flex-col items-start justify-between shadow-sm rounded-2xl bg-slate-50 shadow-sky-100/50 ring-1 ring-slate-100"
              >
                {/* Image */}
                <div className="w-full px-4 pt-4">
                  <a
                    href={href}
                    className="relative block w-full overflow-hidden group aspect-w-16 aspect-h-9 rounded-xl md:aspect-w-3 md:aspect-h-2"
                  >
                    <LazyLoadImage
                      src={coverImage}
                      alt={article.title || "Blog"}
                      className="object-cover w-full transition duration-300 rounded-xl bg-slate-100 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-slate-900/5" />
                  </a>
                </div>

                {/* Content */}
                <div className="relative flex flex-col flex-1 px-5 pt-8 pb-10 group xl:px-7">
                  <a
                    href={href}
                    className="relative z-10 flex items-center gap-2.5 text-md text-sky-700 transition duration-200 ease-in-out hover:text-sky-600"
                  >
                    <LibraryMusicIcon />
                    {typeLabel}
                  </a>

                  <div className="flex-1">
                    <h3 className="mt-4 text-xl font-medium leading-normal transition duration-200 ease-in-out font-display text-slate-900 decoration-slate-400 group-hover:text-sky-900">
                      <a href={href}>
                        <span className="absolute inset-0" />
                        {article.title}
                      </a>
                    </h3>

                    <p className="mt-3.5 text-md leading-7 text-slate-700 line-clamp-3">
                      {article.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 mt-8 text-sm text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.75"
                        stroke="currentColor"
                        className="w-5 h-5 text-slate-400"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                        />
                      </svg>

                      {/* Si tu date no es ISO, mejor no forzar dateTime */}
                      <time>{dateLabel}</time>
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Blog;
