import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";

const DonationSinpeCard = ({
  sinpeNumber = "71354630",
  sinpeName = "Asociación Oratorios Salesianos Don Bosco",
  donationDetail = "ROSAS",
  ctaLabel = "Copiar datos",
  title = "Apoyá nuestro rumbo al Desfile de las Rosas",
}) => {
  const [copiedState, setCopiedState] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const showCopied = (state) => {
    setCopiedState(state);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopiedState(null), 2500);
  };

  const copyToClipboard = async (text) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }

      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.top = "-9999px";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      return ok;
    } catch (err) {
      console.error("Error al copiar:", err);
      return false;
    }
  };

  const handleCopyAll = async () => {
    const text = `SINPE: ${sinpeNumber}\nNombre: ${sinpeName}\nDetalle: ${donationDetail}`;
    const ok = await copyToClipboard(text);
    if (ok) showCopied("all");
  };

  const handleCopySinpe = async () => {
    const ok = await copyToClipboard(sinpeNumber);
    if (ok) showCopied("sinpe");
  };

  return (
    <section className="relative py-16 overflow-hidden bg-gradient-to-b from-white via-sky-50/30 to-white sm:py-20 lg:py-28">
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-sky-100/20 via-transparent to-transparent"
        aria-hidden="true"
      ></div>

      <div className="relative z-10 max-w-screen-xl px-5 mx-auto sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10 sm:mb-12 lg:mb-14">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 mb-6 rounded-full bg-sky-700 shadow-lg shadow-sky-700/20">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4 text-white"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-semibold text-white">Rumbo al Rose Parade 2027</span>
            </div>

            <h2 className="text-3xl font-semibold font-display text-slate-900 sm:text-4xl lg:text-5xl">
              {title}
            </h2>
            <p className="max-w-2xl mx-auto mt-5 text-base leading-relaxed text-slate-600 sm:text-lg sm:mt-6">
              Cada aporte nos acerca a este sueño. Gracias por creer en la música y en nuestra
              banda.
            </p>
          </div>

          <div className="relative">
            <div
              className="absolute -inset-6 bg-gradient-to-r from-sky-400/10 via-sky-300/20 to-sky-400/10 rounded-3xl blur-3xl"
              aria-hidden="true"
            ></div>

            <div className="relative overflow-hidden rounded-2xl bg-white shadow-xl shadow-slate-200/60 ring-1 ring-slate-900/5 sm:rounded-3xl">
              <div
                className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-sky-600 to-sky-500"
                aria-hidden="true"
              ></div>

              <div className="px-6 py-8 sm:px-10 sm:py-12 lg:px-12 lg:py-14">
                <div className="flex items-center gap-3 pb-6 mb-8 border-b border-slate-200">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-sky-100">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-5 h-5 text-sky-700"
                    >
                      <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 01-2.07-.655zM16.44 15.98a4.97 4.97 0 002.07-.654.78.78 0 00.357-.442 3 3 0 00-4.308-3.517 6.484 6.484 0 011.907 3.96 2.32 2.32 0 01-.026.654zM18 8a2 2 0 11-4 0 2 2 0 014 0zM5.304 16.19a.844.844 0 01-.277-.71 5 5 0 019.947 0 .843.843 0 01-.277.71A6.975 6.975 0 0110 18a6.974 6.974 0 01-4.696-1.81z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold font-display text-slate-900 sm:text-2xl">
                    Datos para tu donación
                  </h3>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:gap-8">
                  <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-white p-5 ring-1 ring-slate-200/60 transition-all duration-200 hover:ring-slate-300 sm:p-6">
                    <div
                      className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-sky-100/40 to-transparent rounded-full blur-2xl opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                      aria-hidden="true"
                    ></div>
                    <dt className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-4 h-4 text-sky-600"
                      >
                        <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
                        <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
                      </svg>
                      SINPE Móvil
                    </dt>
                    {/* <dl className="grid gap-5 mt-6 sm:grid-cols-2">
                      <dd className="flex items-center gap-2 text-xl font-semibold font-display text-slate-900 sm:text-2xl">
                        {sinpeNumber}
                        <button
                          type="button"
                          onClick={handleCopySinpe}
                          className="inline-flex items-center mr-3 justify-center rounded-lg p-1.5 text-slate-600 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
                          aria-label="Copiar número SINPE"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="w-5 h-5"
                            aria-hidden="true"
                          >
                            <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                            <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
                          </svg>
                        </button>
                      </dd>
                    </dl> */}
                    <dl className="grid gap-5 mt-6 sm:grid-cols-2">
                      <dd className="flex items-center justify-between">
                        <span className="text-2xl font-bold font-display text-slate-900 sm:text-3xl">
                          {sinpeNumber}
                        </span>

                        <button
                          type="button"
                          onClick={handleCopySinpe}
                          className="relative z-10 inline-flex items-center justify-center rounded-lg p-1.5 text-slate-600 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
                          aria-label="Copiar número SINPE"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="w-5 h-5"
                            aria-hidden="true"
                          >
                            <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                            <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
                          </svg>
                        </button>
                      </dd>
                    </dl>
                  </div>

                  <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-white p-5 ring-1 ring-slate-200/60 sm:p-6">
                    <dt className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-4 h-4 text-sky-600"
                      >
                        <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
                      </svg>
                      Nombre
                    </dt>
                    <dd className="text-lg font-semibold font-display text-slate-900 leading-tight sm:text-xl">
                      {sinpeName}
                    </dd>
                  </div>

                  <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-white p-5 ring-1 ring-slate-200/60 sm:col-span-2 sm:p-6">
                    <dt className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-4 h-4 text-sky-600"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Detalle
                    </dt>
                    <dd className="text-base font-medium text-slate-700 sm:text-lg">
                      {donationDetail}
                    </dd>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-4 pt-8 mt-8 border-t border-slate-200 sm:flex-row sm:justify-between">
                  <button
                    type="button"
                    onClick={handleCopyAll}
                    className="inline-flex items-center justify-center w-full gap-2.5 rounded-full bg-slate-900 px-8 py-4 text-base font-semibold leading-none text-white shadow-lg shadow-slate-900/20 transition-all duration-200 hover:bg-sky-700 hover:shadow-sky-700/30 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 active:scale-95 sm:w-auto sm:px-10"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-5 h-5"
                    >
                      <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                      <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
                    </svg>
                    {ctaLabel}
                  </button>

                  <div className="relative flex items-center justify-center h-12 min-w-[160px]">
                    <div
                      className={[
                        "absolute inset-0 flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ring-1 transition-all duration-200",
                        copiedState
                          ? "opacity-100 scale-100 bg-green-50 text-green-700 ring-green-600/30"
                          : "opacity-0 scale-95 pointer-events-none bg-transparent text-transparent ring-transparent",
                      ].join(" ")}
                      aria-live="polite"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {copiedState === "all"
                        ? "Datos copiados"
                        : copiedState === "sinpe"
                        ? "SINPE copiado"
                        : " "}
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-5 bg-sky-50/50 border-t border-sky-100 sm:px-10 sm:py-6 lg:px-12">
                <div className="flex items-start gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-5 h-5 text-sky-700 shrink-0 mt-0.5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.94 6.94a.75.75 0 11-1.061-1.061 3 3 0 112.871 5.026v.345a.75.75 0 01-1.5 0v-.5c0-.72.57-1.172 1.081-1.287A1.5 1.5 0 108.94 6.94zM10 15a1 1 0 100-2 1 1 0 000 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-sm leading-relaxed text-slate-700">
                    <span className="font-medium">Cómo donar:</span> Abre tu app SINPE, selecciona
                    &quot;Transferir&quot;, ingresa el número, nombre y detalle mostrados arriba.
                    ¡Muchas gracias por tu apoyo!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <svg
        width="600"
        height="600"
        viewBox="0 0 600 600"
        className="absolute bottom-0 left-0 w-[600px] h-[600px] text-sky-100 opacity-30 -translate-x-1/2 translate-y-1/2"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="donation-gradient">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="300" cy="300" r="300" fill="url(#donation-gradient)" />
      </svg>
    </section>
  );
};

DonationSinpeCard.propTypes = {
  sinpeNumber: PropTypes.string,
  sinpeName: PropTypes.string,
  donationDetail: PropTypes.string,
  ctaLabel: PropTypes.string,
  title: PropTypes.string,
};

export default DonationSinpeCard;
