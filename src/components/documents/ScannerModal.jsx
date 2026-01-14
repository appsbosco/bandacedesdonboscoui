import React, { useEffect } from "react";
import PassportVisaScanner from "./PassportVisaScanner";
import PropTypes from "prop-types";

export default function ScannerModal({ documentId, documentType, onComplete, onCancel }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <PassportVisaScanner
        documentId={documentId}
        documentType={documentType}
        onComplete={onComplete}
        onCancel={onCancel}
      />
    </div>
  );
}

ScannerModal.propTypes = {
  documentId: PropTypes.string.isRequired,
  documentType: PropTypes.oneOf(["PASSPORT", "VISA"]).isRequired,
  onComplete: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
