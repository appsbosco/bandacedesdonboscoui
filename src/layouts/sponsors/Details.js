import React from "react";

const Details = () => {
  return (
    <>
      <section className="py-16 overflow-hidden bg-white sm:py-20 lg:py-28">
        <div className="grid max-w-lg px-5 mx-auto sm:max-w-2xl sm:px-6 lg:max-w-6xl lg:grid-cols-10 lg:px-8 xl:px-12">
          <div className="order-2 pt-8 mt-8 border-t border-slate-200 lg:order-1 lg:col-span-3 lg:mt-0 lg:border-0 lg:pt-0 lg:pr-8">
            <dl className="space-y-8">
              <div>
                <dt className="text-lg font-medium font-display text-slate-900">Client</dt>
                <dd className="mt-2.5 max-w-sm leading-7 text-slate-700">
                  A Bi-Annual Journal of Insights and Ideas on the Frontiers of Innovation and
                  Creativity
                </dd>
              </div>

              <div>
                <dt className="text-lg font-medium font-display text-slate-900">Industry</dt>
                <dd className="mt-2.5 max-w-sm leading-7 text-slate-700">Journalism</dd>
              </div>

              <div>
                <dt className="text-lg font-medium font-display text-slate-900">Company Size</dt>
                <dd className="mt-2.5 max-w-sm leading-7 text-slate-700">50 - 100</dd>
              </div>

              <div>
                <dt className="text-lg font-medium font-display text-slate-900">Headquarters</dt>
                <dd className="mt-2.5 max-w-sm leading-7 text-slate-700">
                  Los Angeles, United States
                </dd>
              </div>

              <div>
                <dt className="text-lg font-medium font-display text-slate-900">
                  Project Duration
                </dt>
                <dd className="mt-2.5 max-w-sm leading-7 text-slate-700">
                  7 months (Mar. 2022 - Oct. 2022)
                </dd>
              </div>
            </dl>

            <a
              href="#0"
              target="_blank"
              className="bg-slate-900 text-white hover:bg-sky-800 inline-flex items-center rounded-full gap-2.5 justify-center px-7 py-3 text-md leading-none outline-offset-2 transition-all duration-200 ease-in-out active:transition-none mt-14 font-medium"
            >
              Visit Website
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5 duration-200 ease-in-out text-slate-50 group-hover:text-white"
              >
                <path
                  fillRule="evenodd"
                  d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </a>
          </div>

          <div className="order-1 lg:order-2 lg:col-span-7 lg:pl-16">
            <h3 className="text-xl font-medium leading-8 font-display text-slate-900 sm:text-2xl sm:leading-10">
              Jack’s se une al Sueño en Marcha
            </h3>

            <div className="mt-6 prose sm:prose-lg sm:mt-8">
              <p>
                La empresa costarricense líder en innovación alimentaria se convierte en
                Patrocinador Oro oficial de la Banda CEDES Don Bosco rumbo al Desfile de las Rosas
                2027.
              </p>
            </div>

            <div className="mt-6 prose sm:prose-lg sm:mt-8">
              <p>
                Con más de cinco décadas llevando sabor y alegría a las familias costarricenses,
                Jack’s se une a la historia de la Banda CEDES Don Bosco como Patrocinador Oro,
                respaldando uno de los proyectos culturales y educativos más emblemáticos del país:
                la participación de nuestra banda en el Pasadena Tournament of Roses 2027, en
                California, Estados Unidos.
              </p>
              <p>
                Esta alianza representa mucho más que un apoyo económico. Es una apuesta por el
                talento, la disciplina y el orgullo nacional, valores que tanto Jack’s como la Banda
                CEDES Don Bosco comparten y promueven.
              </p>

              <p>
                El compromiso de Jack’s con este proyecto es un reflejo de su visión de impulsar el
                potencial costarricense, especialmente entre los jóvenes que con esfuerzo y pasión
                representan a nuestro país en escenarios internacionales. Cada ensayo, cada paso y
                cada nota del desfile ahora llevan también el sello de una marca que ha estado
                presente en los momentos más dulces de nuestras vidas.
              </p>

              <p>
                La unión entre Jack’s y la Banda CEDES Don Bosco simboliza el trabajo en equipo, la
                excelencia y el amor por Costa Rica. Gracias a este patrocinio, continuamos
                fortaleciendo los programas de formación musical, logística y proyección
                internacional, que permitirán que más de 200 jóvenes costarricenses lleven nuestro
                nombre y nuestra bandera al Desfile de las Rosas 2027, ante millones de espectadores
                en todo el mundo.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Details;
