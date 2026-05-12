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
// SUBCOMPONENTE: TRANSFERENCIAS COMPACTAS
// ============================================
const CompactBankTransferPanel = () => {
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
    <div>
      <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/70 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#e4002b]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#e4002b] dark:bg-[#ff1744]/10 dark:text-[#ff5c7a]">
              {t("donation.bank_transfer.badge")}
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              {t("donation.bank_transfer.title")}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {t("donation.bank_transfer.description")}
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleCopy("all", allDetails)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition-all duration-200 hover:bg-[#e4002b] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#e4002b]/30 dark:bg-white dark:text-slate-900 dark:hover:bg-[#ff1744] dark:hover:text-white sm:w-auto"
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

      <div className="grid gap-4 lg:grid-cols-3">
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
              className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 dark:border-slate-700 dark:from-slate-800 dark:to-slate-900"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {t(option.typeKey)}
                  </p>
                  <h4 className="mt-1 text-base font-bold text-slate-900 dark:text-white">
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
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm4.75 2.75a.75.75 0 000 1.5h2.5a.75.75 0 000-1.5h-2.5zM8 11a1 1 0 100 2h4a1 1 0 100-2H8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              </div>

              <div className="rounded-lg bg-white p-4 ring-1 ring-slate-200 dark:bg-slate-950/40 dark:ring-slate-700">
                <p className="break-words text-2xl font-extrabold leading-tight text-slate-900 dark:text-white sm:text-3xl lg:text-2xl">
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
                {isCopied ? t("donation.bank_transfer.copy.copied") : t("donation.bank_transfer.copy.single")}
              </button>
            </article>
          );
        })}
      </div>

      <div className="mt-5 rounded-2xl border border-sky-100 bg-sky-50/70 p-5 dark:border-sky-900/40 dark:bg-sky-950/20">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("donation.bank_transfer.fields.name")}
            </p>
            <p className="mt-1 text-base font-bold leading-snug text-slate-900 dark:text-white">
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
  );
};

// ============================================
// MODAL PRINCIPAL
// ============================================
const DonationModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(1);
  const [activeTab, setActiveTab] = useState("card");
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
      className="fixed inset-0 z-[1300] flex items-end justify-center bg-slate-900/80 p-0 backdrop-blur-sm sm:items-center sm:p-4"
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

        <div className="p-5 sm:p-8">
          <div
            className="mb-6 grid rounded-2xl bg-slate-100 p-1 dark:bg-slate-800 sm:inline-grid sm:grid-cols-2"
            role="tablist"
            aria-label={t("donation.modal_tabs.label")}
          >
            <button
              id="donation-card-tab"
              type="button"
              role="tab"
              aria-selected={activeTab === "card"}
              aria-controls="donation-card-panel"
              onClick={() => setActiveTab("card")}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all duration-200 ${
                activeTab === "card"
                  ? "bg-white text-[#e4002b] shadow-sm dark:bg-slate-950 dark:text-[#ff5c7a]"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              }`}
            >
              {t("donation.modal_tabs.card")}
            </button>
            <button
              id="donation-bank-tab"
              type="button"
              role="tab"
              aria-selected={activeTab === "bank"}
              aria-controls="donation-bank-panel"
              onClick={() => setActiveTab("bank")}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all duration-200 ${
                activeTab === "bank"
                  ? "bg-white text-[#e4002b] shadow-sm dark:bg-slate-950 dark:text-[#ff5c7a]"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              }`}
            >
              {t("donation.modal_tabs.bank")}
            </button>
          </div>

          <div
            id="donation-card-panel"
            role="tabpanel"
            hidden={activeTab !== "card"}
            aria-labelledby="donation-card-tab"
          >
            {activeTab === "card" && (
              <>
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
              </>
            )}
          </div>

          <div
            id="donation-bank-panel"
            role="tabpanel"
            hidden={activeTab !== "bank"}
            aria-labelledby="donation-bank-tab"
          >
            {activeTab === "bank" && <CompactBankTransferPanel />}
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
