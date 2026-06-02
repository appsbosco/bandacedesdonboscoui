/* eslint-disable react/prop-types */
import React, { useCallback, useId, useState } from "react";
import BottomSheetDialog from "components/ui/BottomSheetDialog";
import { PermissionRequestForm } from "./PermissionRequestForm";

export function PermissionRequestDialog({ isOpen, onClose, title, ...formProps }) {
  const formId = useId();
  const [submitState, setSubmitState] = useState({
    disabled: true,
    label: "Enviar solicitud",
  });
  const handleSubmitStateChange = useCallback((nextState) => setSubmitState(nextState), []);

  return (
    <BottomSheetDialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon="📋"
      maxWidth="448px"
      footer={
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form={formId}
            disabled={submitState.disabled}
            className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitState.label}
          </button>
        </div>
      }
    >
      <div className="p-4 sm:p-6">
        <PermissionRequestForm
          {...formProps}
          formId={formId}
          hideActions
          onSubmitStateChange={handleSubmitStateChange}
        />
      </div>
    </BottomSheetDialog>
  );
}
