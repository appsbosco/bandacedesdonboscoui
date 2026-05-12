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

const BANK_TRANSFER_OPTIONS = [
  {
    id: "sinpe",
    typeKey: "donation.bank_transfer.methods.sinpe.type",
    labelKey: "donation.bank_transfer.methods.sinpe.label",
    value: "7135-4630",
    copyValue: "7135-4630",
    accent: "sky",
  },
  {
    id: "crc",
    typeKey: "donation.bank_transfer.methods.crc.type",
    labelKey: "donation.bank_transfer.methods.crc.label",
    value: "CR94 0151 0871 0010 0032 39",
    copyValue: "CR94 0151 0871 0010 0032 39",
    accent: "red",
  },
  {
    id: "usd",
    typeKey: "donation.bank_transfer.methods.usd.type",
    labelKey: "donation.bank_transfer.methods.usd.label",
    value: "CR50 0151 0001 0026 2301 41",
    copyValue: "CR50 0151 0001 0026 2301 41",
    accent: "slate",
  },
];

const BANK_ACCOUNT_NAME = "Asociación de Oratorios Salesianos Don Bosco";

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
  } catch (error) {
    console.error("Unable to copy donation details:", error);
    return false;
  }
};

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
      className="fixed inset-0 z-[1300] flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm"
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
// SUBCOMPONENTE: SINPE Y TRANSFERENCIAS
// ============================================
const BankTransferSection = () => {
  const { t } = useTranslation();
  const [copiedId, setCopiedId] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const showCopied = (id) => {
    setCopiedId(id);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopiedId(null), 2200);
  };

  const handleCopy = async (id, text) => {
    const ok = await copyToClipboard(text);
    if (ok) showCopied(id);
  };

  const allDetails = [
    `${t("donation.bank_transfer.fields.name")}: ${BANK_ACCOUNT_NAME}`,
    ...BANK_TRANSFER_OPTIONS.map((option) => `${t(option.typeKey)}: ${option.copyValue}`),
  ].join("\n");

  return (
    <div className="mx-auto mb-10 max-w-5xl sm:mb-12">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 dark:border-slate-700 dark:bg-slate-900 dark:shadow-slate-950/20">
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-6 dark:border-slate-700 dark:bg-slate-800/70 sm:px-7 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#e4002b]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#e4002b] dark:bg-[#ff1744]/10 dark:text-[#ff5c7a]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d="M4.464 3.162A2 2 0 016.28 2h7.44a2 2 0 011.816 1.162l2.1 4.55A2 2 0 0115.82 10.55h-.32V15a3 3 0 11-6 0v-1a1 1 0 00-2 0v1a3 3 0 11-6 0v-4.45h-.32A2 2 0 01-.636 7.713l2.1-4.55z" />
                  <path d="M4 12.5A4.47 4.47 0 006.5 13a4.47 4.47 0 003.5-1.688A4.47 4.47 0 0013.5 13a4.47 4.47 0 002.5-.5V17a1 1 0 01-1 1H5a1 1 0 01-1-1v-4.5z" />
                </svg>
                {t("donation.bank_transfer.badge")}
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
                {t("donation.bank_transfer.title")}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
                {t("donation.bank_transfer.description")}
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleCopy("all", allDetails)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition-all duration-200 hover:bg-[#e4002b] hover:shadow-[#e4002b]/25 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#e4002b]/30 dark:bg-white dark:text-slate-900 dark:hover:bg-[#ff1744] dark:hover:text-white sm:w-auto"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
              </svg>
              {copiedId === "all"
                ? t("donation.bank_transfer.copy.copied_all")
                : t("donation.bank_transfer.copy.all")}
            </button>
          </div>
        </div>

        <div className="grid gap-4 p-5 sm:p-7 lg:grid-cols-3 lg:p-8">
          {BANK_TRANSFER_OPTIONS.map((option) => {
            const isCopied = copiedId === option.id;
            const accentClass =
              option.accent === "red"
                ? "bg-[#e4002b]/10 text-[#e4002b] dark:bg-[#ff1744]/10 dark:text-[#ff5c7a]"
                : option.accent === "sky"
                ? "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300"
                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";

            return (
              <article
                key={option.id}
                className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg dark:border-slate-700 dark:from-slate-800 dark:to-slate-900 dark:hover:border-slate-600"
              >
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {t(option.typeKey)}
                    </p>
                    <h4 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                      {t(option.labelKey)}
                    </h4>
                  </div>
                  <span className={`rounded-full p-2 ${accentClass}`}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-5 w-5"
                      aria-hidden="true"
                    >
                      <path d="M10.75 2.75a.75.75 0 00-1.5 0v.258a32.473 32.473 0 00-3.395.278.75.75 0 00-.62.84 30.533 30.533 0 00.622 3.04A5.5 5.5 0 003.25 11.75v.132a.75.75 0 001.5 0v-.132a4 4 0 018 0v.132a.75.75 0 001.5 0v-.132a5.5 5.5 0 00-2.607-4.584 30.533 30.533 0 00.622-3.04.75.75 0 00-.62-.84 32.473 32.473 0 00-3.395-.278V2.75z" />
                      <path
                        fillRule="evenodd"
                        d="M3.172 13.172a4 4 0 015.656 0L10 14.343l1.172-1.171a4 4 0 115.656 5.656l-1 1a.75.75 0 11-1.06-1.06l1-1a2.5 2.5 0 00-3.536-3.536l-1.702 1.701a.75.75 0 01-1.06 0l-1.702-1.701a2.5 2.5 0 00-3.536 3.536l1 1a.75.75 0 11-1.06 1.06l-1-1a4 4 0 010-5.656z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                </div>

                <div className="rounded-lg bg-white p-4 ring-1 ring-slate-200 dark:bg-slate-950/40 dark:ring-slate-700">
                  <p className="break-words text-2xl font-extrabold leading-tight tracking-normal text-slate-900 dark:text-white sm:text-3xl lg:text-2xl xl:text-3xl">
                    {option.value}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(option.id, option.copyValue)}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition-colors duration-200 hover:border-[#e4002b] hover:text-[#e4002b] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#e4002b]/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-[#ff1744] dark:hover:text-[#ff5c7a]"
                  aria-label={t("donation.bank_transfer.copy.single_aria", {
                    method: t(option.typeKey),
                  })}
                >
                  {isCopied ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-5 w-5 text-green-600"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-5 w-5"
                      aria-hidden="true"
                    >
                      <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                      <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
                    </svg>
                  )}
                  {isCopied
                    ? t("donation.bank_transfer.copy.copied")
                    : t("donation.bank_transfer.copy.single")}
                </button>
              </article>
            );
          })}
        </div>

        <div className="border-t border-slate-200 bg-sky-50/70 px-5 py-5 dark:border-slate-700 dark:bg-sky-950/20 sm:px-7 lg:px-8">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t("donation.bank_transfer.fields.name")}
              </p>
              <p className="mt-1 text-base font-bold leading-snug text-slate-900 dark:text-white sm:text-lg">
                {BANK_ACCOUNT_NAME}
              </p>
            </div>
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              <span className="font-semibold">{t("donation.bank_transfer.how_to_label")}</span>{" "}
              {t("donation.bank_transfer.how_to")}
            </p>
          </div>
          <p className="sr-only" aria-live="polite">
            {copiedId ? t("donation.bank_transfer.copy.live_region") : ""}
          </p>
        </div>
      </div>
    </div>
  );
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

        <BankTransferSection />

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
