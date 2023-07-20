import React from "react";
import { useParams } from "react-router-dom";
import articles from "./ArticlesData";
import Header from "components/Header";
import Footer from "components/Footer";

const ArticlePage = () => {
  const { id } = useParams();
  const article = articles.find((article) => article.id === parseInt(id));

  if (!article) {
    return <div>Article not found</div>;
  }

  const copyLink = () => {
    const currentURL = window.location.href;

    const textarea = document.createElement("textarea");
    textarea.value = currentURL;
    textarea.style.position = "fixed";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
      document.execCommand("copy");
      alert("Link copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy link:", error);
    } finally {
      document.body.removeChild(textarea);
    }
  };
  return (
    <>
      <Header />
      <article>
        {/* Article Header */}
        <header className="relative py-16 bg-slate-50 sm:pt-24 lg:pt-28">
          <div className="absolute inset-x-0 bottom-0 bg-white h-1/4"></div>
          <div className="relative max-w-6xl px-4 mx-auto text-center sm:px-6 lg:px-8">
            <a
              href="#0"
              className="group inline-flex items-center justify-center gap-3.5 text-base leading-5 tracking-wide text-sky-700 transition duration-200 ease-in-out hover:text-sky-600 sm:text-lg"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-[18px] w-[18px] text-sky-700/90 transition duration-200 group-hover:text-sky-600 sm:h-5 sm:w-5"
              >
                <g
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.75"
                  transform="translate(0.5 0.5)"
                  fill="none"
                  stroke="currentColor"
                >
                  <polyline points="8.333,14 1,14 1,1 23,1 23,14 20,14"></polyline>
                  <line x1="13" y1="14" x2="19" y2="20" stroke="currentColor"></line>
                  <polygon points=" 6,7 10,19 13,14 18,11 " stroke="currentColor"></polygon>
                </g>
              </svg>
              {article.type}
            </a>
            <h1 className="mt-6 text-4xl font-semibold leading-tight text-center font-display text-slate-900 sm:text-5xl sm:leading-tight">
              {article.title}
            </h1>
            <p className="max-w-2xl mx-auto mt-6 text-lg leading-8 text-center text-slate-700">
              {article.description}
            </p>
            <div className="flex items-center justify-center gap-4 mt-8 text-md text-slate-500">
              <span className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.75"
                  stroke="currentColor"
                  className="w-6 h-6 text-slate-400"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z"
                  />
                </svg>
                <time dateTime="2023-02-27"> {article.date}</time>
              </span>
              <span className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.75"
                  stroke="currentColor"
                  className="w-6 h-6 text-slate-400"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                2 minutos de lectura
              </span>
            </div>
            <div className="w-full max-w-4xl mx-auto mt-16">
              <div className="relative block w-full overflow-hidden shadow-lg aspect-w-16 aspect-h-9 rounded-3xl shadow-sky-100/50 md:aspect-w-3 md:aspect-h-2">
                <img
                  src={article.images[0]}
                  alt="Banda CEDES Don Bosco"
                  className="object-cover w-full rounded-3xl bg-slate-100"
                />
                <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-slate-900/10"></div>
              </div>
            </div>
          </div>
        </header>

        <div className="px-4 bg-white sm:px-6 lg:px-8 text-justify">
          <div className="max-w-2xl mx-auto prose prose-lg mb-10">
            <p>{article.content[0].text}</p>

            <h2>{article.content[1].title}</h2>
            <p>{article.content[1].text}</p>

            <h2>{article.content[2].title}</h2>
            <p>{article.content[2].text}</p>

            <p>{article.content[2].subtext} </p>

            <h2>{article.content[3].title}</h2>
            <p>{article.content[3].text}</p>
            <p>{article.content[3].subtext}</p>
          </div>

          <section className="py-16 overflow-hidden bg-slate-50 sm:py-24 lg:py-28 xl:py-32">
            <div className="max-w-screen-xl px-5 mx-auto sm:px-6 lg:px-8">
              <div className="grid max-w-lg gap-8 mx-auto sm:max-w-2xl sm:grid-cols-2 lg:mx-0 lg:max-w-none">
                <div className="w-full overflow-hidden aspect-w-3 aspect-h-2 sm:aspect-w-4 sm:aspect-h-3">
                  <img
                    src={article.images[1]}
                    alt=""
                    className="object-cover object-center w-full rounded-3xl bg-slate-100"
                  />
                </div>
                <div className="w-full overflow-hidden aspect-w-3 aspect-h-2 sm:aspect-w-4 sm:aspect-h-3">
                  <img
                    src={article.images[2]}
                    alt=""
                    className="object-cover object-center w-full rounded-3xl bg-slate-100"
                  />
                </div>
                <div className="w-full overflow-hidden aspect-w-3 aspect-h-2 sm:aspect-w-4 sm:aspect-h-3">
                  <img
                    src={article.images[3]}
                    alt=""
                    className="object-cover object-center w-full rounded-3xl bg-slate-100"
                  />
                </div>
                <div className="w-full overflow-hidden aspect-w-3 aspect-h-2 sm:aspect-w-4 sm:aspect-h-3">
                  <img
                    src={article.images[4]}
                    alt=""
                    className="object-cover object-center w-full rounded-3xl bg-slate-100"
                  />
                </div>
              </div>
            </div>
          </section>

          <div className="max-w-2xl mx-auto prose prose-lg mt-10">
            <h2>{article.content[4].title}</h2>

            <p>{article.content[4].text}</p>
            <p>{article.content[5].text}</p>
          </div>
          <footer className="max-w-2xl mx-auto">
            <hr className="w-full h-px pb-6 mt-14 text-slate-300/75 sm:pb-4" />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <p className="pl-0.5 text-lg font-semibold tracking-wide text-slate-900 sm:pl-0">
                Copiar artículo
              </p>

              <div className="mt-2.5 flex gap-3 sm:mt-0 sm:gap-4">
                <button
                  onClick={copyLink}
                  className="flex items-center justify-center h-10 gap-3 px-6 text-sm font-medium duration-200 ease-in-out border rounded-full group border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    className="h-3.5 w-3.5 text-slate-500 transition duration-200 ease-in-out group-hover:text-slate-600"
                  >
                    <g
                      strokeWidth="1.25"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="2.5" y="3.5" width="10" height="12"></rect>
                      <polyline
                        points="4.5,0.5 15.5,0.5 15.5,13.5"
                        stroke="currentColor"
                      ></polyline>
                      <line x1="5.5" y1="6.5" x2="9.5" y2="6.5"></line>
                      <line x1="5.5" y1="9.5" x2="9.5" y2="9.5"></line>
                      <line x1="5.5" y1="12.5" x2="9.5" y2="12.5"></line>
                    </g>
                  </svg>
                  Copiar link
                </button>

                <a
                  href={article.socialLinks.instagram}
                  className="flex items-center justify-center w-10 h-10 duration-200 border rounded-full border-slate-200 hover:bg-slate-50"
                  aria-label="Compartir en Instagram"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-3.5 w-3.5 fill-slate-500 transition group-hover:fill-slate-600"
                  >
                    <g>
                      <path d="M12,2.982c2.937,0,3.285.011,4.445.064a6.072,6.072,0,0,1,2.042.379,3.4,3.4,0,0,1,1.265.823,3.4,3.4,0,0,1,.823,1.265,6.072,6.072,0,0,1,.379,2.042c.053,1.16.064,1.508.064,4.445s-.011,3.285-.064,4.445a6.072,6.072,0,0,1-.379,2.042,3.644,3.644,0,0,1-2.088,2.088,6.072,6.072,0,0,1-2.042.379c-1.16.053-1.508.064-4.445.064s-3.285-.011-4.445-.064a6.072,6.072,0,0,1-2.042-.379,3.4,3.4,0,0,1-1.265-.823,3.4,3.4,0,0,1-.823-1.265,6.072,6.072,0,0,1-.379-2.042c-.053-1.16-.064-1.508-.064-4.445s.011-3.285.064-4.445a6.072,6.072,0,0,1,.379-2.042,3.4,3.4,0,0,1,.823-1.265,3.4,3.4,0,0,1,1.265-.823,6.072,6.072,0,0,1,2.042-.379c1.16-.053,1.508-.064,4.445-.064M12,1c-2.987,0-3.362.013-4.535.066a8.108,8.108,0,0,0-2.67.511A5.625,5.625,0,0,0,1.577,4.8a8.108,8.108,0,0,0-.511,2.67C1.013,8.638,1,9.013,1,12s.013,3.362.066,4.535a8.108,8.108,0,0,0,.511,2.67A5.625,5.625,0,0,0,4.8,22.423a8.108,8.108,0,0,0,2.67.511C8.638,22.987,9.013,23,12,23s3.362-.013,4.535-.066a8.108,8.108,0,0,0,2.67-.511A5.625,5.625,0,0,0,22.423,19.2a8.108,8.108,0,0,0,.511-2.67C22.987,15.362,23,14.987,23,12s-.013-3.362-.066-4.535a8.108,8.108,0,0,0-.511-2.67A5.625,5.625,0,0,0,19.2,1.577a8.108,8.108,0,0,0-2.67-.511C15.362,1.013,14.987,1,12,1Z"></path>
                      <path d="M12,6.351A5.649,5.649,0,1,0,17.649,12,5.649,5.649,0,0,0,12,6.351Zm0,9.316A3.667,3.667,0,1,1,15.667,12,3.667,3.667,0,0,1,12,15.667Z"></path>
                      <circle cx="17.872" cy="6.128" r="1.32"></circle>
                    </g>
                  </svg>
                </a>

                <a
                  href={article.socialLinks.facebook}
                  className="flex items-center justify-center w-10 h-10 duration-200 border rounded-full border-slate-200 hover:bg-slate-50"
                  aria-label="Compartir en facebook"
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
                </a>
              </div>
            </div>
          </footer>
        </div>
      </article>
      <Footer />
    </>
  );
};

export default ArticlePage;
