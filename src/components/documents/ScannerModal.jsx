import React, { useEffect } from "react";
import PropTypes from "prop-types";
import PassportVisaScanner from "./PassportVisaScanner";

export default function ScannerModal({ documentId, documentType, onComplete, onCancel }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <div className="safe-area-top bg-black" style={{ paddingTop: "env(safe-area-inset-top)" }} />

      <button
        onClick={onCancel}
        className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-colors"
        style={{ top: "calc(env(safe-area-inset-top) + 1rem)" }}
        aria-label="Cerrar"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      <div className="h-full w-full">
        <PassportVisaScanner
          documentId={documentId}
          documentType={documentType}
          onComplete={onComplete}
          onCancel={onCancel}
        />
      </div>
    </div>
  );
}

ScannerModal.propTypes = {
  documentId: PropTypes.string.isRequired,
  documentType: PropTypes.oneOf(["PASSPORT", "VISA"]).isRequired,
  onComplete: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
