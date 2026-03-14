import { useState, useCallback } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  PREVIEW_TOUR_PARTICIPANT_IMPORT,
  CONFIRM_TOUR_PARTICIPANT_IMPORT,
  CANCEL_TOUR_IMPORT_BATCH,
  GET_TOUR_IMPORT_BATCHES,
} from "./tourImports.gql";

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
  const [step, setStep] = useState("idle");
  const [file, setFile] = useState(null);
  const [sheetName, setSheetName] = useState("");
  const [importMode, setImportMode] = useState("INSERT"); // "INSERT" | "UPSERT"
  const [previewData, setPreviewData] = useState(null);
  const [confirmResult, setConfirmResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const {
    data: batchesData,
    loading: batchesLoading,
    refetch: refetchBatches,
  } = useQuery(GET_TOUR_IMPORT_BATCHES, {
    variables: { tourId },
    skip: !tourId,
    fetchPolicy: "cache-and-network",
  });

  const [previewMutation] = useMutation(PREVIEW_TOUR_PARTICIPANT_IMPORT);
  const [confirmMutation] = useMutation(CONFIRM_TOUR_PARTICIPANT_IMPORT);
  const [cancelMutation] = useMutation(CANCEL_TOUR_IMPORT_BATCH);

  const openWizard = useCallback((mode = "INSERT") => {
    setStep("idle");
    setFile(null);
    setSheetName("");
    setImportMode(mode);
    setPreviewData(null);
    setConfirmResult(null);
    setErrorMsg(null);
    setWizardOpen(true);
  }, []);

  const closeWizard = useCallback(() => {
    setWizardOpen(false);
  }, []);

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
              mode: importMode,
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
    [tourId, importMode, previewMutation]
  );

  const handleConfirm = useCallback(async () => {
    if (!previewData?.batchId || !file) return;
    setStep("confirming");
    setErrorMsg(null);

    try {
      const base64 = await fileToBase64(file);
      const { data } = await confirmMutation({
        variables: {
          input: {
            batchId: previewData.batchId,
            fileBase64: base64,
            sheetName: sheetName || undefined,
            mode: importMode,
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
  }, [previewData, file, sheetName, importMode, confirmMutation, refetchBatches]);

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

  const handleRetry = useCallback(() => {
    setStep("idle");
    setFile(null);
    setSheetName("");
    setPreviewData(null);
    setErrorMsg(null);
  }, []);

  return {
    wizardOpen,
    step,
    importMode,
    setImportMode,
    previewData,
    confirmResult,
    errorMsg,
    batches: batchesData?.getTourImportBatches || [],
    batchesLoading,
    openWizard,
    closeWizard,
    handlePreview,
    handleConfirm,
    handleCancelBatch,
    handleRetry,
  };
}