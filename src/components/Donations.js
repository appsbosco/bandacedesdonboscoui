// DonationSection.jsx
import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

// ============================================
// CONFIGURACIÓN DE DONACIONES (EDITABLE)
// ============================================
const DONATION_OPTIONS = [
  {
    amount: 10,
    labelKey: "donation.options.basic.label",
    impactBulletsKeys: [
      "donation.options.basic.impact1",
      "donation.options.basic.impact2",
      "donation.options.basic.impact3",
    ],
    src: "https://checkout.baccredomatic.com/payment_button?token=NDY1NmFlODE5YjAzZGQxLmQzNTMyMjgxNzcwOTA2NTc4&color=%23ffffff&background=%23e4002b&text=Aportar ahora&hasimage=true",
    badge: null,
  },
  {
    amount: 25,
    labelKey: "donation.options.transport.label",
    impactBulletsKeys: [
      "donation.options.transport.impact1",
      "donation.options.transport.impact2",
      "donation.options.transport.impact3",
    ],
    src: "https://checkout.baccredomatic.com/payment_button?token=NmI1Njc5ZTQ4ODI5NzcuNmI2MDdmZGYxNzcwOTA2ODY0&color=%23ffffff&background=%23e4002b&text=Aportar ahora&hasimage=true",
    badgeKey: "donation.badge.recommended",
  },
  {
    amount: 50,
    labelKey: "donation.options.equipment.label",
    impactBulletsKeys: [
      "donation.options.equipment.impact1",
      "donation.options.equipment.impact2",
      "donation.options.equipment.impact3",
    ],
    src: "https://checkout.baccredomatic.com/payment_button?token=NTIzOGQ2NjA5NzQxYi40NzRiNjkxNmUxNzcwOTA2ODAx&color=%23ffffff&background=%23e4002b&text=Aportar ahora&hasimage=true",
    badge: null,
  },
  {
    amount: 100,
    labelKey: "donation.options.international.label",
    impactBulletsKeys: [
      "donation.options.international.impact1",
      "donation.options.international.impact2",
      "donation.options.international.impact3",
    ],
    src: "https://checkout.baccredomatic.com/payment_button?token=MTg2ODg5NWQyMzY2OGUyMTcxNDEuOTcxNzcwOTA2OTA0&color=%23ffffff&background=%23e4002b&text=Aportar ahora&hasimage=true",
    badge: null,
  },
];

// ============================================
// SUBCOMPONENTE: TARJETA DE DONACIÓN
// ============================================
const DonationCard = ({ option, isActive, onClick }) => {
  const { t } = useTranslation();

  return (
    <article
      className={`
        relative rounded-2xl bg-gradient-to-br from-slate-50 to-white p-6 
        ring-2 transition-all duration-300
        ${
          isActive
            ? "ring-[#e4002b] shadow-2xl shadow-[#e4002b]/20 scale-[1.02]"
            : "ring-slate-200/60 hover:ring-[#e4002b]/50 hover:shadow-lg"
        }
        dark:from-slate-800 dark:to-slate-900 dark:ring-slate-700
      `}
    >
      {option.badgeKey && (
        <div className="absolute -top-3 right-6 z-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-600 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z"
                clipRule="evenodd"
              />
            </svg>
            {t(option.badgeKey)}
          </span>
        </div>
      )}

      <div className="mb-4 flex items-baseline gap-2">
        <span className="text-5xl font-extrabold text-[#e4002b] dark:text-[#ff1744]">
          ${option.amount}
        </span>
        <span className="text-xl font-medium text-slate-500 dark:text-slate-400">USD</span>
      </div>

      <h3 className="mb-3 text-xl font-semibold text-slate-900 dark:text-white">
        {t(option.labelKey)}
      </h3>

      <ul className="mb-5 space-y-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        {option.impactBulletsKeys.map((key, idx) => (
          <li key={idx} className="flex items-start gap-2">
            <svg
              className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                clipRule="evenodd"
              />
            </svg>
            <span>{t(key)}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onClick}
        className={`
          inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 
          font-semibold transition-all duration-200
          ${
            isActive
              ? "bg-slate-900 text-white shadow-lg dark:bg-white dark:text-slate-900"
              : "bg-[#e4002b] text-white hover:bg-[#b30022] hover:shadow-lg hover:scale-[1.02]"
          }
          focus:outline-none focus-visible:ring-4 focus-visible:ring-[#e4002b]/30
        `}
        aria-pressed={isActive}
      >
        {isActive ? t("donation.cta.selected") : t("donation.cta.select")}
      </button>

      <div
        className={`
          overflow-hidden transition-all duration-500 ease-in-out
          ${isActive ? "mt-6 max-h-[500px] opacity-100" : "max-h-0 opacity-0"}
        `}
        aria-hidden={!isActive}
      >
        <div className="mb-4 rounded-lg bg-sky-50 p-3 dark:bg-sky-900/20">
          <div className="mb-2 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5 text-sky-600 dark:text-sky-400"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {t("donation.security.badge")}
            </span>
          </div>
          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            {t("donation.security.description")}
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-inner dark:border-slate-700 dark:bg-slate-900">
          <iframe
            src={option.src}
            title={t("donation.iframe.title", { amount: option.amount })}
            className="h-[325px] w-full border-0"
            loading="lazy"
          />
        </div>
      </div>
    </article>
  );
};

DonationCard.propTypes = {
  option: PropTypes.shape({
    amount: PropTypes.number.isRequired,
    labelKey: PropTypes.string.isRequired,
    impactBulletsKeys: PropTypes.arrayOf(PropTypes.string).isRequired,
    src: PropTypes.string.isRequired,
    badgeKey: PropTypes.string,
  }).isRequired,
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
};

// ============================================
// SUBCOMPONENTE: MODAL DE IMPACTO
// ============================================
const ImpactModal = ({ isOpen, onClose, triggerRef }) => {
  const { t } = useTranslation();
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements?.[0];
    const lastFocusable = focusableElements?.[focusableElements.length - 1];

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
      if (e.key === "Tab") {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable?.focus();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable?.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
      triggerRef.current?.focus();
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="impact-modal-title"
      aria-describedby="impact-modal-description"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-slate-800"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-800 sm:px-8">
          <div>
            <h2
              id="impact-modal-title"
              className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl"
            >
              {t("donation.modal.title")}
            </h2>
            <p
              id="impact-modal-description"
              className="mt-1 text-sm text-slate-600 dark:text-slate-400"
            >
              {t("donation.modal.description")}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e4002b] dark:hover:bg-slate-700 dark:hover:text-white"
            aria-label={t("donation.modal.close")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-6 w-6"
              aria-hidden="true"
            >
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        <div className="p-6 sm:p-8">
          <div className="grid gap-6 sm:grid-cols-2">
            {DONATION_OPTIONS.map((option) => (
              <div
                key={option.amount}
                className="rounded-xl border-l-4 border-[#e4002b] bg-slate-50 p-5 dark:bg-slate-700/50"
              >
                <div className="mb-3 flex items-baseline gap-2">
                  <h3 className="text-2xl font-bold text-[#e4002b] dark:text-[#ff1744]">
                    ${option.amount}
                  </h3>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {t(option.labelKey)}
                  </span>
                </div>
                <ul className="space-y-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {option.impactBulletsKeys.map((key, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <svg
                        className="mt-0.5 h-4 w-4 shrink-0 text-sky-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{t(key)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-lg bg-sky-50 p-4 dark:bg-sky-900/20">
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {t("donation.modal.footer")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

ImpactModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  triggerRef: PropTypes.object,
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
const DonationSection = () => {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(1);
  const [showImpactModal, setShowImpactModal] = useState(false);
  const impactButtonRef = useRef(null);

  return (
    <section className="relative overflow-hidden py-16 sm:py-20 lg:py-28">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-sky-100/20 via-transparent to-transparent dark:from-sky-900/10"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-screen-xl px-5 sm:px-6 lg:px-8">
        <div className="mb-10 text-center sm:mb-12 lg:mb-14">
          <div className="mb-6 inline-flex items-center gap-2.5 rounded-full bg-sky-700 px-4 py-2 shadow-lg shadow-sky-700/20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4 text-white"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-semibold text-white">{t("donation.header.badge")}</span>
          </div>

          <h2 className="mb-5 text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">
            {t("donation.header.title")}
          </h2>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">
            {t("donation.header.subtitle")}
          </p>
        </div>

        <div className="mx-auto mb-10 max-w-5xl">
          <div className="mb-6 flex items-center justify-center">
            <button
              ref={impactButtonRef}
              onClick={() => setShowImpactModal(true)}
              className="inline-flex items-center gap-2 rounded-full border-2 border-slate-300 bg-white px-7 py-3 font-semibold text-slate-900 transition-all duration-200 hover:border-[#e4002b] hover:bg-[#e4002b]/5 hover:text-[#e4002b] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#e4002b]/30 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:hover:border-[#e4002b] dark:hover:bg-[#e4002b]/10"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                <path
                  fillRule="evenodd"
                  d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                  clipRule="evenodd"
                />
              </svg>
              {t("donation.impact_button")}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
            {DONATION_OPTIONS.map((option, index) => (
              <DonationCard
                key={option.amount}
                option={option}
                isActive={activeIndex === index}
                onClick={() => setActiveIndex(index)}
              />
            ))}
          </div>
        </div>

        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-slate-50/50 p-6 dark:border-slate-700 dark:bg-slate-800/50 sm:p-8">
          <h3 className="mb-6 text-center text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
            {t("donation.faq.title")}
          </h3>
          <div className="space-y-5">
            <div>
              <h4 className="mb-1.5 font-semibold text-slate-900 dark:text-white">
                {t("donation.faq.q1.question")}
              </h4>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {t("donation.faq.q1.answer")}
              </p>
            </div>
            <div>
              <h4 className="mb-1.5 font-semibold text-slate-900 dark:text-white">
                {t("donation.faq.q2.question")}
              </h4>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {t("donation.faq.q2.answer")}
              </p>
            </div>
            <div>
              <h4 className="mb-1.5 font-semibold text-slate-900 dark:text-white">
                {t("donation.faq.q3.question")}
              </h4>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {t("donation.faq.q3.answer")}
              </p>
            </div>
            <div>
              <h4 className="mb-1.5 font-semibold text-slate-900 dark:text-white">
                {t("donation.faq.q4.question")}
              </h4>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {t("donation.faq.q4.answer")}{" "}
                <a
                  href="mailto:banda@cedesdonbosco.ed.cr"
                  className="font-medium text-sky-600 underline hover:text-sky-700 dark:text-sky-400"
                >
                  banda@cedesdonbosco.ed.cr
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-2xl bg-slate-100 p-8 text-center dark:bg-slate-800/50 sm:mt-12 sm:p-10">
          <h3 className="mb-3 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
            {t("donation.thanks.title")}
          </h3>
          <p className="text-lg text-slate-700 dark:text-slate-300">
            {t("donation.thanks.message")}
          </p>
        </div>
      </div>

      <ImpactModal
        isOpen={showImpactModal}
        onClose={() => setShowImpactModal(false)}
        triggerRef={impactButtonRef}
      />
    </section>
  );
};

export default DonationSection;

const donationOptionPropType = PropTypes.shape({
  amount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  labelKey: PropTypes.string.isRequired,
  impactBulletsKeys: PropTypes.arrayOf(PropTypes.string).isRequired,
  src: PropTypes.string.isRequired,
  badgeKey: PropTypes.string,
});

DonationCard.propTypes = {
  option: donationOptionPropType.isRequired,
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
};

ImpactModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  triggerRef: PropTypes.shape({ current: PropTypes.any }), // evita problemas SSR
};
