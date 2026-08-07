import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

import GoFundMeWidget from "./GoFundMeWidget";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function GoFundMeModal({ isOpen, onClose, source }) {
  const { t } = useTranslation();
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    previousFocusRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose("escape");
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(panelRef.current?.querySelectorAll(FOCUSABLE) ?? []);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-5">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-sky-950/70 backdrop-blur-[2px]"
        onClick={() => onClose("backdrop")}
        aria-label={t("gofundme.modal.close")}
      />
      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-[480px] overflow-y-auto overscroll-contain rounded-lg bg-transparent shadow-xl sm:max-h-[calc(100dvh-2.5rem)]"
      >
        <h2 id={titleId} className="sr-only">
          {t("gofundme.modal.title")}
        </h2>
        <p id={descriptionId} className="sr-only">
          {t("gofundme.modal.description")}
        </p>
        <button
          ref={closeRef}
          type="button"
          onClick={() => onClose("button")}
          aria-label={t("gofundme.modal.close")}
          className="absolute right-2 top-2 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-700 shadow-sm transition-colors hover:bg-white hover:text-sky-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200"
        >
          <X size={20} aria-hidden="true" />
        </button>
        <GoFundMeWidget source={source} eager compact />
      </section>
    </div>,
    document.body
  );
}

GoFundMeModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  source: PropTypes.string.isRequired,
};
