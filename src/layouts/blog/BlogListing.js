import React, { useState } from "react";
import { Link } from "react-router-dom";
import Header from "components/Header";
import Footer from "components/Footer";
import BlogHero from "./blog-hero-bg.svg";
import articles from "./ArticlesData";
import { useParams } from "react-router-dom";

const articlesPerPage = 3;

const BlogListing = () => {
  const { lang } = useParams();
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate the index range of the articles to display on the current page
  const indexOfLastArticle = currentPage * articlesPerPage;
  const indexOfFirstArticle = indexOfLastArticle - articlesPerPage;
  const currentArticles = articles.slice(indexOfFirstArticle, indexOfLastArticle);

  // Change the page
  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div>
      <Header />

      <section className="relative overflow-hidden bg-white lg:px-8">
        <div className="relative max-w-screen-xl px-5 py-16 mx-auto sm:px-6 lg:px-8 bg-slate-50 sm:py-24 lg:rounded-b-3xl lg:py-32">
          <img src={BlogHero} alt="" className="absolute inset-0 w-full h-full" />
          <div className="relative flex flex-col items-center justify-center">
            <h1 className="text-5xl font-semibold text-center font-display text-slate-900 sm:text-6xl">
              Bienvenidos a{" "}
              <span className="relative whitespace-nowrap">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="249"
                  height="22"
                  viewBox="0 0 249 22"
                  fill="currentColor"
                  className="absolute top-2/3 left-0 h-[0.6em] w-full scale-110 fill-sky-200/75"
                >
                  <path d="M247.564 18.5807C241.772 13.3568 232.473 12.7526 225.225 11.4427C217.124 9.97395 208.996 8.57031 200.846 7.46093C186.542 5.51302 172.169 4.08854 157.79 3.01562C126.033 0.645827 94.0929 0.0338481 62.3387 2.36979C42.1785 3.85416 22.008 5.90885 2.32917 10.8463C-0.0155171 11.4349 0.207047 14.6719 2.6889 14.7083C22.0261 14.9896 41.3866 12.6406 60.7109 11.8568C79.9471 11.0807 99.2274 10.6719 118.484 10.9557C142.604 11.3125 166.719 12.8333 190.722 15.5156C199.956 16.5469 209.195 17.6016 218.411 18.8255C227.864 20.0807 237.259 22 246.767 20.7422C247.709 20.6198 248.426 19.3568 247.564 18.5807Z" />
                </svg>
                <span className="relative">nuestro blog</span>
              </span>
            </h1>
            <p className="max-w-xl mx-auto mt-6 text-lg leading-8 text-center text-slate-700">
              Aquí podrás enterarte sobre el mundo de nuestra banda y descubrir más acerca de
              nuestras presentaciones, ensayos, eventos especiales y mucho más.
            </p>
            <form action="#" method="post" className="relative w-full max-w-lg mt-12">
              <div className="absolute hidden -left-48 -top-12 lg:flex xl:-left-72">
                <span className="inline-block max-w-[175px] -rotate-12 transform font-writing text-2xl text-slate-600">
                  Suscribirse
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="91"
                  height="49"
                  viewBox="0 0 91 49"
                  fill="none"
                  className="relative left-0 w-20 h-auto -top-5 text-slate-600"
                >
                  <g clipPath="url(#clip0_324_1142)">
                    <path
                      d="M1.69238 27.312C20.3067 17.6575 42.2779 13.0915 62.6792 20.3817C68.653 22.5164 74.9261 26.8457 79.7975 31.004C80.8268 31.8828 81.6964 32.9264 82.5869 33.944C83.4001 34.8733 83.6539 26.1696 83.7375 25.1594C84.6308 14.3591 83.4075 25.9604 83.6012 30.1072C83.7516 33.3254 84.9068 36.8047 84.5415 40.0293C84.2474 42.6259 79.3878 40.8403 77.6335 40.5719C75.8298 40.2959 63.737 40.239 66.2469 36.714C70.7498 30.3895 77.2856 27.0444 83.4264 22.7486"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_324_1142">
                      <rect
                        width="85"
                        height="29"
                        fill="white"
                        transform="translate(83 49) rotate(-165.831)"
                      />
                    </clipPath>
                  </defs>
                </svg>
              </div>
              <input
                type="email"
                className="h-12 w-full rounded-full border-0 bg-white/95 py-3.5 pl-5 pr-32 text-sm leading-5 text-slate-900 placeholder-slate-400 shadow-md shadow-sky-100/50 outline-none ring-1 ring-slate-900/5 duration-200 ease-in-out focus:border-0 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-sky-900/20 sm:pl-6 sm:text-md"
                required
                placeholder="Ingrese su email"
                autoComplete="email"
              />
              <button
                type="submit"
                className="absolute inline-flex items-center h-10 px-5 text-sm font-semibold transition duration-200 ease-in-out rounded-full outline-none right-1 top-1 bg-slate-900 text-sky-50 hover:bg-sky-800 focus:outline-none sm:px-7 sm:text-md"
              >
                Enviar
              </button>
            </form>
          </div>
        </div>
      </section>

      <section id="articles" className="py-16 overflow-hidden bg-white sm:py-24 lg:py-28">
        <div className="max-w-screen-xl px-5 mx-auto sm:px-6 lg:px-8">
          <h2 className="text-4xl font-semibold text-center font-display text-slate-900 sm:text-5xl">
            Últimos artículos
          </h2>

          <div className="grid max-w-lg gap-8 mx-auto mt-14 sm:mt-16 md:mx-0 md:max-w-none md:grid-cols-2 lg:grid-cols-3 lg:gap-y-6 lg:gap-x-5 xl:gap-x-6 xl:gap-y-8">
            {currentArticles.map((article, index) => (
              <div key={article.id}>
                <Link to={`/${lang}/blog/${article.id}`}>
                  <article className="flex flex-col items-start justify-between shadow-sm rounded-2xl bg-slate-50 shadow-sky-100/50 ring-1 ring-slate-100">
                    <div className="w-full px-4 pt-4">
                      <a
                        href=""
                        className="relative block w-full overflow-hidden group aspect-w-16 aspect-h-9 rounded-xl md:aspect-w-3 md:aspect-h-2"
                      >
                        <img
                          src={article.images[0]}
                          alt=""
                          className="object-cover w-full transition duration-300 rounded-xl bg-slate-100 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-slate-900/5"></div>
                      </a>
                    </div>
                    <div className="relative flex flex-col flex-1 px-5 pt-8 pb-10 group xl:px-7">
                      <a
                        href="#0"
                        className="relative z-10 flex items-center gap-2.5 text-md text-sky-700 transition duration-200 ease-in-out hover:text-sky-600"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-4 h-4 text-sky-600"
                        >
                          <g
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.75"
                            transform="translate(0.5 0.5)"
                            fill="none"
                            stroke="currentColor"
                          >
                            <polyline points="8.333,14 1,14 1,1 23,1 23,14 20,14 "></polyline>
                            <line x1="13" y1="14" x2="19" y2="20" stroke="currentColor"></line>
                            <polygon
                              points=" 6,7 10,19 13,14 18,11 "
                              stroke="currentColor"
                            ></polygon>
                          </g>
                        </svg>
                        {article.type}
                      </a>
                      <div className="flex-1">
                        <h3 className="mt-4 text-xl font-medium leading-normal transition duration-200 ease-in-out font-display text-slate-900 decoration-slate-400 group-hover:text-sky-900">
                          <a href="">
                            <span className="absolute inset-0"></span>
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
                              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z"
                            ></path>
                          </svg>
                          <time dateTime="2023-03-24">{article.date}</time>
                        </span>
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
                              d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                            ></path>
                          </svg>
                          {article.lecture}
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-2 mt-20">
            <span
              className={`inline-flex items-center justify-center w-20 h-10 text-sm font-medium rounded-full shadow-sm bg-slate-50 text-slate-500/60 hover:bg-white hover:text-blue-500 shadow-sky-100/50 ring-1 ring-slate-900/5 transition-colors duration-300 ease-in-out ${
                currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={() => {
                if (currentPage > 1) {
                  paginate(currentPage - 1);
                }
              }}
              disabled={currentPage === 1}
            >
              Atrás
            </span>

            {/* Generate page numbers based on the number of articles */}
            {Array.from({ length: Math.ceil(articles.length / articlesPerPage) }).map(
              (_, index) => (
                <span
                  key={index}
                  className={`inline-flex items-center justify-center w-10 h-10 text-sm font-medium rounded-full shadow-sm hover:bg-white hover:text-blue-500 ${
                    currentPage === index + 1
                      ? "bg-sky-600 text-sky-50 shadow-sky-100/50 ring-1 ring-slate-900/5"
                      : "bg-slate-50 text-slate-700 shadow-sky-100/50 ring-1 ring-slate-900/5 hover:bg-white hover:text-blue-500 transition-colors"
                  }`}
                  onClick={() => paginate(index + 1)}
                >
                  {index + 1}
                </span>
              )
            )}

            <span
              className={`inline-flex items-center justify-center w-20 h-10 text-sm font-medium rounded-full shadow-sm bg-slate-50 text-slate-500/60 shadow-sky-100/50 ring-1 ring-slate-900/5 hover:bg-white hover:text-blue-500 transition-colors ${
                currentPage === Math.ceil(articles.length / articlesPerPage)
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
              onClick={() => {
                if (currentPage < Math.ceil(articles.length / articlesPerPage)) {
                  paginate(currentPage + 1);
                }
              }}
              disabled={currentPage === Math.ceil(articles.length / articlesPerPage)}
            >
              Siguiente
            </span>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BlogListing;
