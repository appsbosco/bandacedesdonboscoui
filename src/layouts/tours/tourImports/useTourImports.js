import { useState, useCallback } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  PREVIEW_TOUR_PARTICIPANT_IMPORT,
  CONFIRM_TOUR_PARTICIPANT_IMPORT,
  CANCEL_TOUR_IMPORT_BATCH,
  GET_TOUR_IMPORT_BATCHES,
} from "./tourImports.gql";

// idle → uploading → preview → confirming → done
//                           ↘ error (any step)

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = () => reject(new Error("Error al leer el archivo"));
    reader.readAsDataURL(file);
  });
}

export function useTourImports(tourId) {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState("idle"); // idle|uploading|preview|confirming|done|error
  const [file, setFile] = useState(null);
  const [sheetName, setSheetName] = useState("");
  const [previewData, setPreviewData] = useState(null);
  const [confirmResult, setConfirmResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // ── Batch history ───────────────────────────────────────────────────────────
  const {
    data: batchesData,
    loading: batchesLoading,
    refetch: refetchBatches,
  } = useQuery(GET_TOUR_IMPORT_BATCHES, {
    variables: { tourId },
    skip: !tourId,
    fetchPolicy: "cache-and-network",
  });

  // ── Mutations ───────────────────────────────────────────────────────────────
  const [previewMutation] = useMutation(PREVIEW_TOUR_PARTICIPANT_IMPORT);
  const [confirmMutation] = useMutation(CONFIRM_TOUR_PARTICIPANT_IMPORT);
  const [cancelMutation] = useMutation(CANCEL_TOUR_IMPORT_BATCH);

  // ── Wizard open/close ───────────────────────────────────────────────────────
  const openWizard = useCallback(() => {
    setStep("idle");
    setFile(null);
    setSheetName("");
    setPreviewData(null);
    setConfirmResult(null);
    setErrorMsg(null);
    setWizardOpen(true);
  }, []);

  const closeWizard = useCallback(() => {
    setWizardOpen(false);
  }, []);

  // ── Step 1: Preview ─────────────────────────────────────────────────────────
  const handlePreview = useCallback(
    async (selectedFile, selectedSheet) => {
      if (!selectedFile) return;
      setFile(selectedFile);
      setSheetName(selectedSheet || "");
      setStep("uploading");
      setErrorMsg(null);

      try {
        const base64 = await fileToBase64(selectedFile);
        const { data } = await previewMutation({
          variables: {
            input: {
              tourId,
              fileBase64: base64,
              fileName: selectedFile.name,
              sheetName: selectedSheet || undefined,
            },
          },
        });
        setPreviewData(data.previewTourParticipantImport);
        setStep("preview");
      } catch (err) {
        setErrorMsg(err.message || "Error al procesar el archivo");
        setStep("error");
      }
    },
    [tourId, previewMutation]
  );

  const handleConfirm = useCallback(async () => {
    if (!previewData?.batchId || !file) return;
    setStep("confirming");
    setErrorMsg(null);

    console.log("Preview data", previewData);
    try {
      const base64 = await fileToBase64(file);
      const { data } = await confirmMutation({
        variables: {
          input: {
            batchId: previewData.batchId,
            fileBase64: base64,
            sheetName: sheetName || undefined,
          },
        },
      });
      setConfirmResult(data.confirmTourParticipantImport);
      setStep("done");
      refetchBatches();
    } catch (err) {
      setErrorMsg(err.message || "Error al confirmar la importación");
      setStep("error");
    }
  }, [previewData, file, sheetName, confirmMutation, refetchBatches]);

  // ── Cancel a PREVIEW batch from history ────────────────────────────────────
  const handleCancelBatch = useCallback(
    async (batchId) => {
      try {
        await cancelMutation({ variables: { batchId } });
        refetchBatches();
      } catch (err) {
        console.error("Error al cancelar batch:", err.message);
      }
    },
    [cancelMutation, refetchBatches]
  );

  // ── Reset to try again ──────────────────────────────────────────────────────
  const handleRetry = useCallback(() => {
    setStep("idle");
    setFile(null);
    setSheetName("");
    setPreviewData(null);
    setErrorMsg(null);
  }, []);

  return {
    // Wizard state
    wizardOpen,
    step,
    previewData,
    confirmResult,
    errorMsg,
    // Batch history
    batches: batchesData?.getTourImportBatches || [],
    batchesLoading,
    // Actions
    openWizard,
    closeWizard,
    handlePreview,
    handleConfirm,
    handleCancelBatch,
    handleRetry,
  };
}
