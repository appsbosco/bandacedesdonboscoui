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

      // Fallback (sin dependencias)
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
      // eslint-disable-next-line no-console
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
    <section className="relative py-12 overflow-hidden bg-gradient-to-b from-slate-50 to-white sm:py-16 lg:py-20">
      <div className="max-w-screen-xl px-5 mx-auto sm:px-6 lg:px-8">
        <div className="relative max-w-5xl mx-auto">
          <div
            className="absolute inset-0 bg-gradient-to-br from-sky-100/40 via-sky-50/20 to-transparent rounded-3xl blur-2xl"
            aria-hidden="true"
          />

          <div className="relative overflow-hidden rounded-3xl bg-white shadow-xl shadow-sky-100/50 ring-1 ring-slate-900/5">
            <div
              className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-sky-200/30 via-sky-100/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"
              aria-hidden="true"
            />

            <div className="absolute top-6 right-6 inline-flex items-center rounded-full bg-sky-700 px-4 py-1.5 text-xs font-semibold text-white shadow-sm sm:top-8 sm:right-8 sm:px-5 sm:py-2 sm:text-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4 mr-1.5"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                  clipRule="evenodd"
                />
              </svg>
              Rumbo al Desfile
            </div>

            <div className="relative px-6 py-10 sm:px-10 sm:py-14 lg:px-14 lg:py-16 mt-6">
              <div className="max-w-2xl">
                <h2 className="text-3xl font-semibold font-display text-slate-900 sm:text-4xl lg:text-5xl">
                  {title}
                </h2>
                <p className="mt-4 text-base leading-7 text-slate-700 sm:text-lg sm:mt-5">
                  Cada aporte nos acerca a este sueño. Gracias por creer en la música y en nuestra
                  banda.
                </p>
              </div>

              <div className="mt-10 rounded-2xl bg-gradient-to-br from-slate-50 to-white p-6 ring-1 ring-slate-900/5 sm:mt-12 sm:p-8">
                <h3 className="text-lg font-semibold font-display text-slate-900 sm:text-xl">
                  Para donar:
                </h3>

                <dl className="grid gap-5 mt-6 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 sm:text-sm">
                      SINPE Móvil
                    </dt>
                    <dd className="flex items-center gap-2 text-xl font-semibold font-display text-slate-900 sm:text-2xl">
                      {sinpeNumber}
                      <button
                        type="button"
                        onClick={handleCopySinpe}
                        className="inline-flex items-center justify-center rounded-lg p-1.5 text-slate-600 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
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
                  </div>

                  <div className="space-y-1.5">
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 sm:text-sm">
                      Nombre
                    </dt>
                    <dd className="text-xl font-semibold font-display text-slate-900 sm:text-2xl">
                      {sinpeName}
                    </dd>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 sm:text-sm">
                      Detalle
                    </dt>
                    <dd className="text-base font-medium text-slate-700 sm:text-lg">
                      {donationDetail}
                    </dd>
                  </div>
                </dl>

                <div className="flex flex-col gap-3 mt-8 sm:flex-row sm:items-center sm:gap-4">
                  <button
                    type="button"
                    onClick={handleCopyAll}
                    className="inline-flex items-center justify-center rounded-full gap-2.5 bg-slate-900 px-7 py-3 text-md font-semibold leading-none text-white outline-offset-2 transition-all duration-200 ease-in-out hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 sm:px-8 sm:py-3.5"
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
                    {ctaLabel}
                  </button>

                  <div className="relative flex items-center justify-center h-11 min-w-[140px] sm:justify-start">
                    <div
                      className={[
                        "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ring-1 transition-all duration-200",
                        copiedState
                          ? "opacity-100 translate-y-0 bg-green-50 text-green-700 ring-green-600/20"
                          : "opacity-0 translate-y-1 pointer-events-none bg-transparent text-transparent ring-transparent",
                      ].join(" ")}
                      aria-live="polite"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-4 h-4"
                        aria-hidden="true"
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

              <div className="flex items-start gap-3 mt-8 p-4 rounded-xl bg-sky-50/50 ring-1 ring-sky-100 sm:mt-10">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5 text-sky-700 shrink-0 mt-0.5"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm leading-6 text-slate-700">
                  Abre tu app SINPE, selecciona &quot;Transferir&quot;, ingresa el número, nombre y
                  detalle mostrados arriba. ¡Muchas gracias por tu apoyo!
                </p>
              </div>
            </div>

            <svg
              width="200"
              height="200"
              viewBox="0 0 200 200"
              className="absolute bottom-0 left-0 w-40 h-40 text-slate-100 opacity-30 -translate-x-1/3 translate-y-1/3 sm:w-48 sm:h-48"
              aria-hidden="true"
            >
              <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="2" />
              <circle cx="100" cy="100" r="60" fill="none" stroke="currentColor" strokeWidth="2" />
              <circle cx="100" cy="100" r="40" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
        </div>
      </div>
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
