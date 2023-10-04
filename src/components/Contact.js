import React from "react";
import Header from "./Header";
import Footer from "./Footer";
import contact from "../assets/images/contact.webp";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { SEND_EMAIL } from "graphql/mutations";
import { useMutation } from "@apollo/client";

const Contact = () => {
  const [sendEmail] = useMutation(SEND_EMAIL);

  const handleSubmit = (event) => {
    event.preventDefault();
    const form = event.target;

    const emailData = {
      from: form.email.value,
      to: "banda@cedesdonbosco.ed.cr",
      subject: "Contacto Banda CEDES Don Bosco",
      html: `

      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <meta http-equiv="Content-Type" content="text/html charset=UTF-8" />
      <html lang="en">
      
        <head></head>
        <div id="__react-email-preview" style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">Log in with this magic link.<div> ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿</div>
        </div>
      
        <body style="background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,&quot;Segoe UI&quot;,Roboto,Oxygen-Sans,Ubuntu,Cantarell,&quot;Helvetica Neue&quot;,sans-serif">
          <table align="center" role="presentation" cellSpacing="0" cellPadding="0" border="0" width="100%" style="max-width:37.5em;margin:0 auto;padding:20px 25px 48px;background-image:url(&quot;/assets/raycast-bg.png&quot;);background-position:bottom;background-repeat:no-repeat, no-repeat">
            <tr style="width:100%">
              <td> <img
              alt="BCDB"
              src="https://res.cloudinary.com/dnv9akklf/image/upload/q_auto,f_auto/v1686511395/LOGO_BCDB_qvjabt.png"
              style="
                display: block;
                outline: none;
                border: none;
                text-decoration: none;
                margin: 0;
                padding: 0;
                max-width: 30%;
                height: auto;
              "
            />
                <h1 style="font-size:28px;font-weight:bold;margin-top:48px">👉 De: ${form.name.value}</h1>
                <table style="margin:24px 0" align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%">
                  <tbody>
                    <tr>
                      <td>
                        <p style="font-size:16px;line-height:26px;margin:16px 0"><a target="_blank" style="color:#FF6363;text-decoration:none" href="">Correo: ${form.email.value} </a></p>
                        <p style="font-size:16px;line-height:26px;margin:16px 0">Contacto: ${form.phone.value} </p>

                        <p style="font-size:16px;line-height:26px;margin:16px 0">Mensaje: ${form.message.value} </p>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <p style="font-size:16px;line-height:26px;margin:16px 0">Best,<br />- Banda CEDES Don Bosco</p>
                <p
                style="
                  font-size: 14px;
                  line-height: 24px;
                  margin: 16px 0;
                  color: #9ca299;
                  margin-bottom: 10px;
                "
              >
                Copyright © 2023 Banda CEDES Don Bosco. Todos los derechos
                reservados
              </p>               
              </td>
            </tr>
          </table>
        </body>
      
      </html>


        `,
    };

    sendEmail({
      variables: {
        input: {
          to: "chinchillajosue50@gmail.com",
          subject: "Nuevo mensaje de contacto",
          html: emailData,
        },
      },
    })
      .then(({ data }) => {
        if (data.sendEmail.success) {
          console.log("Email sent successfully");
        } else {
          console.log("Failed to send email");
        }
      })
      .catch((error) => {
        console.error("Error sending email:", error);
      });
  };

  return (
    <>
      <Header />

      <section className="relative overflow-hidden bg-white">
        <div className="max-w-screen-xl mx-auto">
          <div className="lg:columns-2 lg:gap-8">
            {/* Contact */}
            <div className="relative bg-slate-50 py-16 px-5 sm:py-24 sm:px-6 lg:col-span-6 lg:rounded-br-[64px] lg:px-8 lg:pt-32 2xl:pl-0">
              <div className="absolute inset-y-0 left-0 hidden w-full -translate-x-full bg-slate-50 lg:block"></div>
              <div className="relative max-w-2xl mx-auto lg:mx-0 lg:max-w-none">
                <h2 className="font-display text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl sm:leading-tight lg:text-[40px] lg:leading-tight xl:text-5xl xl:leading-tight">
                  ¿Cómo podemos ayudarte? Hablemos
                  <span className="ml-4 sm:ml-6">👋</span>
                </h2>

                <div className="mt-12 aspect-w-3 aspect-h-2 sm:mt-16">
                  <LazyLoadImage
                    src={contact}
                    alt=""
                    className="object-cover w-full h-full rounded-3xl xl:translate-x-16"
                  />
                </div>

                <div className="relative mt-14 h-fit w-fit font-writing text-2xl tracking-wide text-slate-600 sm:mt-20 sm:text-[27px]">
                  <span className="inline-block w-52 max-w-[220px] transform sm:w-auto sm:-rotate-6">
                    Puedes <span className="text-sky-700">contactarnos</span> por estos canales
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="124"
                    height="121"
                    viewBox="0 0 124 121"
                    fill="none"
                    className="absolute -right-16 top-4 h-24 w-auto -rotate-90 transform text-slate-600 sm:-right-20 sm:-top-1 sm:translate-y-2 sm:rotate-[-100deg]"
                  >
                    <g clipPath="url(#clip0_257_335)">
                      <path
                        d="M101.672 26.3321C96.8237 38.134 92.186 44.0573 79.0339 44.4141C70.6979 44.6403 60.8529 42.694 53.4527 38.7688C49.1632 36.4936 56.8633 35.9887 58.3238 36.046C75.2213 36.7084 91.469 47.7751 94.8076 64.9225C96.9834 76.0979 88.4245 81.9067 78.6041 84.1752C63.6278 87.6349 47.752 81.2525 36.0397 72.0991C32.1436 69.0541 19.8172 60.5149 22.0934 54.2698C23.9793 49.0954 31.7507 55.0061 34.018 56.9118C37.2506 59.6288 44.0244 65.7437 43.9149 70.3449C43.7576 76.9438 32.7995 78.0771 28.2217 77.7848C19.5283 77.2298 10.3327 73.6012 2.05876 71.0225C1.4496 70.8325 5.37871 69.9759 6.06477 69.8198C8.02976 69.3721 9.72632 68.1441 11.7325 67.8657C13.2208 67.6592 21.2769 68.287 16.2554 69.947C14.4855 70.532 2.71379 69.3189 2.58655 69.7453C2.06535 71.4868 10.2182 79.8642 11.7371 81.4008C15.3955 85.1003 14.5874 73.4626 14.2296 71.9325"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                      />
                    </g>
                    <defs>
                      <clipPath id="clip0_257_335">
                        <rect
                          width="106"
                          height="67"
                          fill="white"
                          transform="matrix(-0.748497 0.663138 0.663138 0.748497 79.3407 0)"
                        />
                      </clipPath>
                    </defs>
                  </svg>
                </div>

                <div className="grid gap-8 mt-16 sm:mt-20 sm:grid-cols-2 sm:gap-6 xl:gap-8">
                  <div className="flex gap-[18px]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.75"
                      stroke="currentColor"
                      className="w-6 h-6 shrink-0 text-sky-600"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                      />
                    </svg>
                    <div className="sm:pt-0.5">
                      <p className="text-lg font-display text-slate-900">Email</p>
                      <p className="mt-1.5 text-base text-slate-600 sm:mt-2">
                        Te enviaremos un correo electrónico.
                        <a
                          href="mailto:hey@janedoe.com"
                          className="inline-block mt-5 duration-200 ease-in-out text-sky-700 hover:text-sky-600 sm:mt-6"
                        >
                          banda@cedesdonbosco.ed.cr
                        </a>
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-[18px]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.75"
                      stroke="currentColor"
                      className="w-6 h-6 shrink-0 text-sky-600"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                      />
                    </svg>

                    <div className="sm:pt-0.5">
                      <p className="text-lg font-display text-slate-900">Llámanos</p>
                      <p className="mt-2 text-base text-slate-600">
                        Disponible los días de semana de 7 a.m. a 6 p.m.
                        <a
                          href="tel:+13234567891"
                          className="inline-block mt-6 duration-200 ease-in-out text-sky-700 hover:text-sky-600"
                        >
                          +506 6049-1166
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="px-5 py-16 sm:py-24 sm:px-6 lg:col-span-6 lg:pl-0 lg:pr-8 lg:pt-32 xl:col-span-5 xl:col-start-8 2xl:pr-0 ">
              <div className="max-w-lg mx-auto lg:mr-0">
                <h3 className="text-3xl font-semibold font-display text-slate-900">
                  Complete nuestro formulario a continuación para comenzar
                </h3>

                <form action="#" method="POST" onSubmit={handleSubmit} className="mt-10">
                  <div className="space-y-7">
                    <div>
                      <label
                        htmlFor="name"
                        className="block font-medium leading-6 text-md text-slate-900"
                      >
                        Nombre
                      </label>
                      <div className="mt-2">
                        <input
                          type="text"
                          name="name"
                          id="name"
                          autoComplete="name"
                          placeholder="BCDB"
                          className="block w-full px-4 py-4 leading-4 transition-colors duration-200 ease-in-out border-0 shadow-sm rounded-xl bg-slate-50 text-md text-slate-900 shadow-sky-100/50 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 hover:bg-white focus:border-0 focus:bg-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-sky-600/60"
                        />
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="email"
                        className="block font-medium leading-6 text-md text-slate-900"
                      >
                        Email
                      </label>
                      <div className="mt-2">
                        <input
                          name="email"
                          id="email"
                          type="email"
                          autoComplete="email"
                          placeholder="ejemplo@email.com"
                          className="block w-full px-4 py-4 leading-4 transition-colors duration-200 ease-in-out border-0 shadow-sm rounded-xl bg-slate-50 text-md text-slate-900 shadow-sky-100/50 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 hover:bg-white focus:border-0 focus:bg-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-sky-600/60"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between leading-6 text-md">
                        <label htmlFor="phone" className="block font-medium text-slate-900">
                          {" "}
                          Celular{" "}
                        </label>
                        <p id="phone-description" className="text-slate-500/80">
                          Opcional
                        </p>
                      </div>
                      <div className="mt-2">
                        <input
                          type="tel"
                          name="phone"
                          id="phone"
                          autoComplete="tel"
                          aria-describedby="phone-description"
                          placeholder="+506 8888-8888"
                          className="block w-full px-4 py-4 leading-4 transition-colors duration-200 ease-in-out border-0 shadow-sm rounded-xl bg-slate-50 text-md text-slate-900 shadow-sky-100/50 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 hover:bg-white focus:border-0 focus:bg-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-sky-600/60"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between leading-6 text-md">
                        <label htmlFor="message" className="block font-medium text-slate-900">
                          Mensaje
                        </label>
                        <p id="message-description" className="text-slate-500/80">
                          Máximo 500 caracteres
                        </p>
                      </div>
                      <div className="mt-2">
                        <textarea
                          id="message"
                          name="message"
                          rows="5"
                          aria-describedby="message-description"
                          placeholder="Cuéntanos un poco sobre tu idea..."
                          className="block w-full px-4 py-4 leading-6 transition-colors duration-200 ease-in-out border-0 shadow-sm rounded-xl bg-slate-50 text-md text-slate-900 shadow-sky-100/50 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 hover:bg-white focus:border-0 focus:bg-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-sky-600/60"
                        ></textarea>
                      </div>
                    </div>
                  </div>
                  <div className="pt-8 mt-10 border-t border-slate-200">
                    <button
                      type="submit"
                      className="inline-flex items-center rounded-full gap-2.5 justify-center px-7 py-3 font-semibold leading-none outline-offset-2 transition-all duration-200 ease-in-out active:transition-none bg-slate-900 text-white hover:bg-sky-800 w-full text-base sm:text-lg"
                    >
                      Enviar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default Contact;
