import { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useMutation } from "@apollo/client";
import { CREATE_BOOKING_REQUEST } from "./bookingRequests.gql";
import {
  PROVINCE_OPTIONS,
  getCantonLabel,
  getCantonOptions,
  getDistrictLabel,
  getDistrictOptions,
  getProvinceLabel,
} from "./costaRicaGeo";

const inputClassName =
  "block w-full rounded-2xl border-0 bg-slate-50 px-4 py-4 text-sm leading-5 text-slate-900 shadow-sm shadow-sky-100/50 ring-1 ring-inset ring-slate-200 transition duration-200 ease-in-out placeholder:text-slate-400 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-sky-600/60 disabled:cursor-not-allowed disabled:opacity-60";

const EVENT_TYPE_OPTIONS = {
  es: [
    { value: "CONCERT", label: "Concierto" },
    { value: "FESTIVAL", label: "Festival" },
    { value: "PARADE", label: "Desfile" },
    { value: "WEDDING", label: "Boda" },
    { value: "CORPORATE", label: "Evento corporativo" },
    { value: "INSTITUTIONAL", label: "Evento institucional" },
    { value: "COMMUNITY", label: "Evento comunal" },
    { value: "PRIVATE", label: "Celebración privada" },
    { value: "PROTOCOL", label: "Acto protocolario" },
    { value: "OTHER", label: "Otro" },
  ],
  en: [
    { value: "CONCERT", label: "Concert" },
    { value: "FESTIVAL", label: "Festival" },
    { value: "PARADE", label: "Parade" },
    { value: "WEDDING", label: "Wedding" },
    { value: "CORPORATE", label: "Corporate event" },
    { value: "INSTITUTIONAL", label: "Institutional event" },
    { value: "COMMUNITY", label: "Community event" },
    { value: "PRIVATE", label: "Private celebration" },
    { value: "PROTOCOL", label: "Protocol ceremony" },
    { value: "OTHER", label: "Other" },
  ],
};

const BUDGET_CURRENCY_OPTIONS = {
  es: [
    { value: "", label: "Selecciona moneda" },
    { value: "CRC", label: "Colones (CRC)" },
    { value: "USD", label: "Dólares (USD)" },
  ],
  en: [
    { value: "", label: "Select currency" },
    { value: "CRC", label: "Costa Rican colones (CRC)" },
    { value: "USD", label: "US dollars (USD)" },
  ],
};

function toOptionalNumber(value) {
  if (value === "" || value == null) return null;
  const number = Number(value);
  return Number.isNaN(number) ? null : number;
}

function FieldLabel({ htmlFor, children, required = false }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-900">
      {children}
      {required ? <span className="ml-1 text-red-500">*</span> : null}
    </label>
  );
}

FieldLabel.propTypes = {
  htmlFor: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  required: PropTypes.bool,
};

function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-2 text-sm text-red-600">{message}</p>;
}

FieldError.propTypes = {
  message: PropTypes.string,
};

function StepPill({ index, title, isActive, isDone }) {
  return (
    <div className="flex min-w-[140px] max-w-[180px] flex-shrink-0 items-center gap-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200 sm:min-w-[156px] sm:max-w-[196px] lg:min-w-0 lg:max-w-none lg:flex-shrink lg:bg-transparent lg:px-0 lg:py-0 lg:ring-0">
      <div
        className={[
          "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold ring-1 transition",
          isActive
            ? "bg-slate-900 text-white ring-slate-900"
            : isDone
            ? "bg-sky-50 text-sky-700 ring-sky-200"
            : "bg-white text-slate-400 ring-slate-200",
        ].join(" ")}
      >
        {isDone ? "✓" : index + 1}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          Paso {index + 1}
        </p>
        <p
          className={[
            "truncate text-sm font-semibold",
            isActive ? "text-slate-900" : isDone ? "text-sky-700" : "text-slate-400",
          ].join(" ")}
        >
          {title}
        </p>
      </div>
    </div>
  );
}

StepPill.propTypes = {
  index: PropTypes.number.isRequired,
  title: PropTypes.string.isRequired,
  isActive: PropTypes.bool.isRequired,
  isDone: PropTypes.bool.isRequired,
};

function SummaryItem({ label, value }) {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-800">{value || "—"}</p>
    </div>
  );
}

SummaryItem.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

export default function BookingRequestForm({ ensembleKey, ensembleName, locale }) {
  const [successId, setSuccessId] = useState(null);
  const [step, setStep] = useState(0);
  const eventTypeOptions = EVENT_TYPE_OPTIONS[locale];
  const budgetCurrencyOptions = BUDGET_CURRENCY_OPTIONS[locale];

  const copy =
    locale === "en"
      ? {
          title: "Request a quote",
          description:
            "A guided process to gather the right information and speed up the first response from our team.",
          helper: "Required fields are marked with *.",
          steps: ["Contact", "Event", "Location", "Review"],
          next: "Continue",
          back: "Back",
          submit: "Send request",
          submitting: "Sending...",
          success: "Your request was submitted successfully. We will contact you soon.",
          policy: "I accept the use of my information for contact and quotation follow-up.",
          selectedEnsemble: "Selected ensemble",
          stepDescriptions: [
            "Who should we contact?",
            "Tell us what kind of event you are planning.",
            "Where will the event take place?",
            "Review the request before submitting it.",
          ],
        }
      : {
          title: "Solicitar cotización",
          description:
            "Un flujo guiado para reunir la información importante y facilitar una respuesta más rápida de nuestro equipo.",
          helper: "Los campos obligatorios están marcados con *.",
          steps: ["Contacto", "Evento", "Ubicación", "Revisión"],
          next: "Continuar",
          back: "Atrás",
          submit: "Enviar solicitud",
          submitting: "Enviando...",
          success: "Tu solicitud fue enviada correctamente. Te contactaremos pronto.",
          policy: "Acepto el tratamiento de mis datos para contacto y seguimiento de cotización.",
          selectedEnsemble: "Agrupación seleccionada",
          stepDescriptions: [
            "¿Con quién debemos dar seguimiento?",
            "Cuéntanos qué tipo de evento estás organizando.",
            "Define la ubicación del evento con mayor precisión.",
            "Verifica todo antes de enviar la solicitud.",
          ],
        };

  const validationSchema = useMemo(
    () =>
      Yup.object({
        fullName: Yup.string().min(3).required("Campo requerido"),
        company: Yup.string(),
        email: Yup.string().email("Correo inválido").required("Campo requerido"),
        phone: Yup.string().min(7, "Teléfono inválido").required("Campo requerido"),
        eventType: Yup.string()
          .oneOf(eventTypeOptions.map((option) => option.value))
          .required("Campo requerido"),
        eventTypeOther: Yup.string().when("eventType", {
          is: "OTHER",
          then: (schema) =>
            schema.min(3, "Describe mejor el tipo de evento").required("Campo requerido"),
          otherwise: (schema) => schema.optional(),
        }),
        eventDate: Yup.string().required("Campo requerido"),
        eventTime: Yup.string().required("Campo requerido"),
        venue: Yup.string().min(3, "Campo inválido").required("Campo requerido"),
        estimatedDuration: Yup.string().min(2, "Campo inválido").required("Campo requerido"),
        expectedAudience: Yup.number().nullable().min(0, "No puede ser negativo"),
        estimatedBudget: Yup.number().nullable().min(0, "No puede ser negativo"),
        budgetCurrency: Yup.string().when("estimatedBudget", {
          is: (value) => value !== "" && value != null,
          then: (schema) => schema.required("Campo requerido"),
          otherwise: (schema) => schema.optional(),
        }),
        province: Yup.string().required("Campo requerido"),
        canton: Yup.string().required("Campo requerido"),
        district: Yup.string().required("Campo requerido"),
        address: Yup.string().min(10, "Describe mejor la dirección").required("Campo requerido"),
        message: Yup.string().min(20, "Agrega un poco más de contexto").required("Campo requerido"),
        acceptedDataPolicy: Yup.boolean().oneOf([true], "Debes aceptar este campo"),
      }),
    [eventTypeOptions]
  );

  const stepFields = [
    ["fullName", "company", "email", "phone"],
    [
      "eventType",
      "eventTypeOther",
      "eventDate",
      "eventTime",
      "venue",
      "estimatedDuration",
      "expectedAudience",
      "estimatedBudget",
      "budgetCurrency",
    ],
    ["province", "canton", "district", "address"],
    ["message", "acceptedDataPolicy"],
  ];

  const [createBookingRequest, { loading, error }] = useMutation(CREATE_BOOKING_REQUEST);

  const formik = useFormik({
    initialValues: {
      fullName: "",
      company: "",
      email: "",
      phone: "",
      eventType: "",
      eventTypeOther: "",
      eventDate: "",
      eventTime: "",
      venue: "",
      estimatedDuration: "",
      expectedAudience: "",
      estimatedBudget: "",
      budgetCurrency: "",
      province: "",
      canton: "",
      district: "",
      address: "",
      message: "",
      acceptedDataPolicy: false,
    },
    validationSchema,
    onSubmit: async (values, helpers) => {
      setSuccessId(null);
      const estimatedBudget = toOptionalNumber(values.estimatedBudget);
      const expectedAudience = toOptionalNumber(values.expectedAudience);

      const { data } = await createBookingRequest({
        variables: {
          input: {
            ensemble: ensembleKey,
            fullName: values.fullName,
            company: values.company,
            email: values.email,
            phone: values.phone,
            eventType: values.eventType,
            eventTypeOther: values.eventType === "OTHER" ? values.eventTypeOther : "",
            eventDate: values.eventDate,
            eventTime: values.eventTime,
            venue: values.venue,
            province: getProvinceLabel(values.province) || values.province,
            canton: getCantonLabel(values.province, values.canton) || values.canton,
            district:
              getDistrictLabel(values.province, values.canton, values.district) || values.district,
            address: values.address,
            estimatedDuration: values.estimatedDuration,
            expectedAudience,
            estimatedBudget,
            budgetCurrency: estimatedBudget == null ? null : values.budgetCurrency,
            message: values.message,
            acceptedDataPolicy: values.acceptedDataPolicy,
          },
        },
      });

      setSuccessId(data?.createBookingRequest?.id || "ok");
      helpers.resetForm();
      setStep(0);
    },
  });

  const cantonOptions = useMemo(
    () => getCantonOptions(formik.values.province),
    [formik.values.province]
  );
  const districtOptions = useMemo(
    () => getDistrictOptions(formik.values.province, formik.values.canton),
    [formik.values.canton, formik.values.province]
  );

  const markTouched = (fields) => {
    formik.setTouched(
      fields.reduce((acc, field) => {
        acc[field] = true;
        return acc;
      }, {}),
      true
    );
  };

  const goNext = async () => {
    const fields = stepFields[step];
    markTouched(fields);
    const errors = await formik.validateForm();
    const visibleErrors = fields.filter((field) => errors[field]);

    if (visibleErrors.length === 0) {
      setStep((current) => Math.min(current + 1, stepFields.length - 1));
    }
  };

  const handleProvinceChange = (event) => {
    const province = event.target.value;
    formik.setFieldValue("province", province);
    formik.setFieldValue("canton", "");
    formik.setFieldValue("district", "");
  };

  const handleCantonChange = (event) => {
    const canton = event.target.value;
    formik.setFieldValue("canton", canton);
    formik.setFieldValue("district", "");
  };

  const getFieldError = (name) =>
    formik.touched[name] && formik.errors[name] ? formik.errors[name] : "";

  const currentEventLabel =
    eventTypeOptions.find((option) => option.value === formik.values.eventType)?.label || "—";
  const currentBudgetLabel =
    formik.values.estimatedBudget && formik.values.budgetCurrency
      ? `${formik.values.estimatedBudget} ${
          budgetCurrencyOptions.find((option) => option.value === formik.values.budgetCurrency)
            ?.label || ""
        }`
      : "No indicado";

  return (
    <section id="booking-form" className="overflow-x-hidden bg-slate-50 py-16 sm:py-24">
      <div className="mx-auto max-w-screen-xl px-5 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.82fr,1.18fr] lg:gap-10">
          <div className="min-w-0 rounded-[32px] bg-white p-8 shadow-sm shadow-sky-100/60 ring-1 ring-slate-100 sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-700">
              {ensembleName}
            </p>
            <h2 className="mt-4 text-4xl font-semibold font-display text-slate-900 sm:text-5xl">
              {copy.title}
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">{copy.description}</p>
            <p className="mt-4 text-sm font-medium text-slate-500">{copy.helper}</p>

            <div className="mt-8 rounded-[28px] bg-slate-50 p-5 ring-1 ring-slate-200">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {copy.selectedEnsemble}
              </p>
              <p className="mt-2 text-xl font-display text-slate-900">{ensembleName}</p>
            </div>

            {/* <div className="mt-8 min-w-0 space-y-5">
              <div className="mx-[-0.125rem] flex max-w-full gap-3 overflow-x-auto overscroll-x-contain px-[0.125rem] pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
                {copy.steps.map((title, index) => (
                  <StepPill
                    key={title}
                    index={index}
                    title={title}
                    isActive={index === step}
                    isDone={index < step}
                  />
                ))}
              </div>
            </div> */}

            <div className="mt-8 rounded-[28px] bg-gradient-to-br from-slate-900 to-sky-800 p-6 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100/80">
                Paso {step + 1} de {stepFields.length}
              </p>
              <p className="mt-2 text-lg font-semibold text-white">{copy.steps[step]}</p>
              <p className="mt-3 text-lg leading-7 text-sky-50">{copy.stepDescriptions[step]}</p>
            </div>
          </div>

          <div className="min-w-0 overflow-hidden rounded-[32px] bg-white p-8 shadow-sm shadow-sky-100/60 ring-1 ring-slate-100 sm:p-10">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
                Paso {step + 1} de {stepFields.length}
              </p>
              <h3 className="mt-2 text-2xl font-semibold font-display text-slate-900 sm:text-3xl">
                {copy.steps[step]}
              </h3>
            </div>
            <div className="mb-8 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-slate-900 to-sky-700 transition-all duration-300"
                style={{ width: `${((step + 1) / stepFields.length) * 100}%` }}
              />
            </div>

            <form onSubmit={formik.handleSubmit} className="min-w-0 space-y-8" noValidate>
              {step === 0 ? (
                <div className="grid min-w-0 grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <FieldLabel htmlFor="fullName" required>
                      {locale === "en" ? "Full name" : "Nombre completo"}
                    </FieldLabel>
                    <input
                      id="fullName"
                      name="fullName"
                      className={inputClassName}
                      value={formik.values.fullName}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    <FieldError message={getFieldError("fullName")} />
                  </div>

                  <div className="sm:col-span-2">
                    <FieldLabel htmlFor="company">
                      {locale === "en" ? "Company or organization" : "Empresa u organización"}
                    </FieldLabel>
                    <input
                      id="company"
                      name="company"
                      className={inputClassName}
                      value={formik.values.company}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    <FieldError message={getFieldError("company")} />
                  </div>

                  <div>
                    <FieldLabel htmlFor="email" required>
                      Email
                    </FieldLabel>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      className={inputClassName}
                      value={formik.values.email}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    <FieldError message={getFieldError("email")} />
                  </div>

                  <div>
                    <FieldLabel htmlFor="phone" required>
                      {locale === "en" ? "Phone / WhatsApp" : "Teléfono / WhatsApp"}
                    </FieldLabel>
                    <input
                      id="phone"
                      name="phone"
                      className={inputClassName}
                      value={formik.values.phone}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    <FieldError message={getFieldError("phone")} />
                  </div>
                </div>
              ) : null}

              {step === 1 ? (
                <div className="grid min-w-0 grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <FieldLabel htmlFor="eventType" required>
                      {locale === "en" ? "Event type" : "Tipo de evento"}
                    </FieldLabel>
                    <select
                      id="eventType"
                      name="eventType"
                      className={inputClassName}
                      value={formik.values.eventType}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    >
                      <option value="">
                        {locale === "en" ? "Select an option" : "Selecciona una opción"}
                      </option>
                      {eventTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <FieldError message={getFieldError("eventType")} />
                  </div>

                  <div>
                    <FieldLabel htmlFor="venue" required>
                      {locale === "en" ? "Venue" : "Lugar del evento"}
                    </FieldLabel>
                    <input
                      id="venue"
                      name="venue"
                      className={inputClassName}
                      value={formik.values.venue}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    <FieldError message={getFieldError("venue")} />
                  </div>

                  {formik.values.eventType === "OTHER" ? (
                    <div className="sm:col-span-2">
                      <FieldLabel htmlFor="eventTypeOther" required>
                        {locale === "en" ? "Specify event type" : "Especifica el tipo de evento"}
                      </FieldLabel>
                      <input
                        id="eventTypeOther"
                        name="eventTypeOther"
                        className={inputClassName}
                        value={formik.values.eventTypeOther}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      />
                      <FieldError message={getFieldError("eventTypeOther")} />
                    </div>
                  ) : null}

                  <div>
                    <FieldLabel htmlFor="eventDate" required>
                      {locale === "en" ? "Event date" : "Fecha del evento"}
                    </FieldLabel>
                    <input
                      id="eventDate"
                      name="eventDate"
                      type="date"
                      className={inputClassName}
                      value={formik.values.eventDate}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    <FieldError message={getFieldError("eventDate")} />
                  </div>

                  <div>
                    <FieldLabel htmlFor="eventTime" required>
                      {locale === "en" ? "Event time" : "Hora del evento"}
                    </FieldLabel>
                    <input
                      id="eventTime"
                      name="eventTime"
                      type="time"
                      className={inputClassName}
                      value={formik.values.eventTime}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    <FieldError message={getFieldError("eventTime")} />
                  </div>

                  <div>
                    <FieldLabel htmlFor="estimatedDuration" required>
                      {locale === "en" ? "Estimated duration" : "Duración estimada"}
                    </FieldLabel>
                    <input
                      id="estimatedDuration"
                      name="estimatedDuration"
                      className={inputClassName}
                      placeholder={locale === "en" ? "Example: 90 minutes" : "Ejemplo: 90 minutos"}
                      value={formik.values.estimatedDuration}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    <FieldError message={getFieldError("estimatedDuration")} />
                  </div>

                  <div>
                    <FieldLabel htmlFor="expectedAudience">
                      {locale === "en" ? "Expected audience" : "Público esperado (Opcional)"}
                    </FieldLabel>
                    <input
                      id="expectedAudience"
                      name="expectedAudience"
                      type="number"
                      min="0"
                      className={inputClassName}
                      value={formik.values.expectedAudience}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    <FieldError message={getFieldError("expectedAudience")} />
                  </div>

                  <div>
                    <FieldLabel htmlFor="estimatedBudget">
                      {locale === "en" ? "Estimated budget" : "Presupuesto estimado"}
                    </FieldLabel>
                    <input
                      id="estimatedBudget"
                      name="estimatedBudget"
                      type="number"
                      min="0"
                      className={inputClassName}
                      value={formik.values.estimatedBudget}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    <FieldError message={getFieldError("estimatedBudget")} />
                  </div>

                  <div>
                    <FieldLabel htmlFor="budgetCurrency">
                      {locale === "en" ? "Currency" : "Moneda"}
                    </FieldLabel>
                    <select
                      id="budgetCurrency"
                      name="budgetCurrency"
                      disabled={!formik.values.estimatedBudget}
                      className={inputClassName}
                      value={formik.values.budgetCurrency}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    >
                      {budgetCurrencyOptions.map((option) => (
                        <option key={option.value || "empty"} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <FieldError message={getFieldError("budgetCurrency")} />
                  </div>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="grid min-w-0 grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <FieldLabel htmlFor="province" required>
                      {locale === "en" ? "Province" : "Provincia"}
                    </FieldLabel>
                    <select
                      id="province"
                      name="province"
                      className={inputClassName}
                      value={formik.values.province}
                      onChange={handleProvinceChange}
                      onBlur={formik.handleBlur}
                    >
                      <option value="">
                        {locale === "en" ? "Select province" : "Selecciona provincia"}
                      </option>
                      {PROVINCE_OPTIONS.map((province) => (
                        <option key={province.value} value={province.value}>
                          {province.label}
                        </option>
                      ))}
                    </select>
                    <FieldError message={getFieldError("province")} />
                  </div>

                  <div>
                    <FieldLabel htmlFor="canton" required>
                      {locale === "en" ? "Canton" : "Cantón"}
                    </FieldLabel>
                    <select
                      id="canton"
                      name="canton"
                      disabled={!formik.values.province}
                      className={inputClassName}
                      value={formik.values.canton}
                      onChange={handleCantonChange}
                      onBlur={formik.handleBlur}
                    >
                      <option value="">
                        {locale === "en" ? "Select canton" : "Selecciona cantón"}
                      </option>
                      {cantonOptions.map((canton) => (
                        <option key={canton.value} value={canton.value}>
                          {canton.label}
                        </option>
                      ))}
                    </select>
                    <FieldError message={getFieldError("canton")} />
                  </div>

                  <div className="sm:col-span-2">
                    <FieldLabel htmlFor="district" required>
                      {locale === "en" ? "District" : "Distrito"}
                    </FieldLabel>
                    <select
                      id="district"
                      name="district"
                      disabled={!formik.values.canton}
                      className={inputClassName}
                      value={formik.values.district}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    >
                      <option value="">
                        {locale === "en" ? "Select district" : "Selecciona distrito"}
                      </option>
                      {districtOptions.map((district) => (
                        <option key={district.value} value={district.value}>
                          {district.label}
                        </option>
                      ))}
                    </select>
                    <FieldError message={getFieldError("district")} />
                  </div>

                  <div className="sm:col-span-2">
                    <FieldLabel htmlFor="address" required>
                      {locale === "en"
                        ? "Exact address and references"
                        : "Dirección exacta y referencias"}
                    </FieldLabel>
                    <textarea
                      id="address"
                      name="address"
                      rows="5"
                      className={inputClassName}
                      placeholder={
                        locale === "en"
                          ? "Add details such as access, parking, stage area, or nearby landmarks."
                          : "Incluye referencias de acceso, parqueo, área de montaje o puntos de referencia."
                      }
                      value={formik.values.address}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    <FieldError message={getFieldError("address")} />
                  </div>
                </div>
              ) : null}

              {step === 3 ? (
                <div className="space-y-6">
                  <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
                    <SummaryItem
                      label={locale === "en" ? "Contact" : "Contacto"}
                      value={`${formik.values.fullName} · ${formik.values.email}`}
                    />
                    <SummaryItem
                      label={locale === "en" ? "Phone" : "Teléfono"}
                      value={formik.values.phone || "—"}
                    />
                    <SummaryItem
                      label={locale === "en" ? "Event type" : "Tipo de evento"}
                      value={
                        formik.values.eventType === "OTHER"
                          ? `${currentEventLabel}: ${formik.values.eventTypeOther}`
                          : currentEventLabel
                      }
                    />
                    <SummaryItem
                      label={locale === "en" ? "Schedule" : "Horario"}
                      value={`${formik.values.eventDate || "—"} · ${
                        formik.values.eventTime || "—"
                      }`}
                    />
                    <SummaryItem
                      label={locale === "en" ? "Location" : "Ubicación"}
                      value={[
                        getProvinceLabel(formik.values.province),
                        getCantonLabel(formik.values.province, formik.values.canton),
                        getDistrictLabel(
                          formik.values.province,
                          formik.values.canton,
                          formik.values.district
                        ),
                      ]
                        .filter(Boolean)
                        .join(" / ")}
                    />
                    <SummaryItem
                      label={locale === "en" ? "Budget" : "Presupuesto"}
                      value={currentBudgetLabel}
                    />
                  </div>

                  <div>
                    <FieldLabel htmlFor="message" required>
                      {locale === "en" ? "Additional message" : "Mensaje adicional"}
                    </FieldLabel>
                    <textarea
                      id="message"
                      name="message"
                      rows="5"
                      className={inputClassName}
                      placeholder={
                        locale === "en"
                          ? "Share any artistic, technical, or logistical considerations."
                          : "Cuéntanos detalles artísticos, técnicos o logísticos que debamos considerar."
                      }
                      value={formik.values.message}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    <FieldError message={getFieldError("message")} />
                  </div>

                  <label className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <input
                      type="checkbox"
                      name="acceptedDataPolicy"
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-600"
                      checked={formik.values.acceptedDataPolicy}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    <span className="text-sm leading-6 text-slate-700">{copy.policy}</span>
                  </label>
                  <FieldError message={getFieldError("acceptedDataPolicy")} />
                </div>
              ) : null}

              {error ? (
                <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
                  {error.message}
                </div>
              ) : null}

              {successId ? (
                <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-emerald-200">
                  {copy.success}
                </div>
              ) : null}

              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:justify-between">
                {step > 0 ? (
                  <button
                    type="button"
                    onClick={() => setStep((current) => Math.max(current - 1, 0))}
                    className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
                  >
                    {copy.back}
                  </button>
                ) : (
                  <div />
                )}

                {step < stepFields.length - 1 ? (
                  <button
                    type="button"
                    onClick={goNext}
                    className="inline-flex items-center justify-center rounded-full bg-slate-900 px-7 py-3 text-sm font-semibold text-white transition hover:bg-sky-800"
                  >
                    {copy.next}
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center rounded-full bg-slate-900 px-7 py-3 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? copy.submitting : copy.submit}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

BookingRequestForm.propTypes = {
  ensembleKey: PropTypes.string.isRequired,
  ensembleName: PropTypes.string.isRequired,
  locale: PropTypes.oneOf(["es", "en"]).isRequired,
};
