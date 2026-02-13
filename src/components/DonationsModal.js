// DonationModal.jsx
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
// SUBCOMPONENTE: TARJETA COMPACTA
// ============================================
const CompactDonationCard = ({ option, isActive, onClick }) => {
  const { t } = useTranslation();

  return (
    <article
      className={`
        relative rounded-2xl bg-gradient-to-br from-slate-50 to-white p-5 
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
        <div className="absolute -top-2.5 right-4 z-10">
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-600 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-3.5 w-3.5"
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

      <div className="mb-3 flex items-baseline gap-2">
        <span className="text-4xl font-extrabold text-[#e4002b] dark:text-[#ff1744]">
          ${option.amount}
        </span>
        <span className="text-lg font-medium text-slate-500 dark:text-slate-400">USD</span>
      </div>

      <h3 className="mb-2.5 text-lg font-semibold text-slate-900 dark:text-white">
        {t(option.labelKey)}
      </h3>

      <ul className="mb-4 space-y-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
        {option.impactBulletsKeys.slice(0, 2).map((key, idx) => (
          <li key={idx} className="flex items-start gap-1.5">
            <svg
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-600 dark:text-sky-400"
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
          inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm
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
          ${isActive ? "mt-4 max-h-[450px] opacity-100" : "max-h-0 opacity-0"}
        `}
        aria-hidden={!isActive}
      >
        <div className="mb-3 rounded-lg bg-sky-50 p-2.5 dark:bg-sky-900/20">
          <div className="mb-1.5 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4 text-sky-600 dark:text-sky-400"
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

CompactDonationCard.propTypes = {
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
// MODAL PRINCIPAL
// ============================================
const DonationModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(1);
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
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/80 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="donation-modal-title"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[95vh] w-full max-w-6xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900 sm:rounded-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95 sm:px-8">
          <div>
            <h2
              id="donation-modal-title"
              className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl"
            >
              {t("donation.header.title")}
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {t("donation.header.subtitle")}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e4002b] dark:hover:bg-slate-800 dark:hover:text-white"
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
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:gap-8">
            {DONATION_OPTIONS.map((option, index) => (
              <CompactDonationCard
                key={option.amount}
                option={option}
                isActive={activeIndex === index}
                onClick={() => setActiveIndex(index)}
              />
            ))}
          </div>

          <div className="mt-8 rounded-xl bg-sky-50/50 p-6 dark:bg-sky-900/20">
            <div className="flex items-start gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="mt-0.5 h-5 w-5 shrink-0 text-sky-600 dark:text-sky-400"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <p className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">
                  {t("donation.security.badge")}
                </p>
                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {t("donation.security.description")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

DonationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default DonationModal;
