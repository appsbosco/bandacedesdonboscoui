import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_TOUR_PARTICIPANTS_DOCS,
  GET_TOUR_DOCUMENT_EXTRACTED_DATA,
  UPDATE_PARTICIPANT_DOCS,
  UPDATE_PARTICIPANT_VISA_STATUS,
  REVOKE_PARTICIPANT_VERIFICATION,
} from "./tourDocuments.gql";
import {
  getTourReferenceDate,
  computeParticipantDocStatus,
  isExitPermitRequired,
  getExpiryStatus,
} from "../utils/tourAgeRules";

function getVisaDenialLabel(count) {
  if (!count) return null;
  if (count === 1) return "1ra negativa";
  if (count === 2) return "2da negativa";
  return `${count} negativas`;
}

export function useTourDocuments(tourId, tour) {
  const [toast, setToast] = useState(null);
  const [detailParticipant, setDetailParticipant] = useState(null);
  const [editParticipant, setEditParticipant] = useState(null);

  const showToast = (message, type = "success") => setToast({ message, type });

  // ── Query ─────────────────────────────────────────────────────────────────────
  const { data, loading, error, refetch } = useQuery(GET_TOUR_PARTICIPANTS_DOCS, {
    variables: { tourId },
    skip: !tourId,
    fetchPolicy: "cache-and-network",
  });
  const {
    data: extractedData,
    loading: loadingExtractedData,
    error: extractedDataError,
    refetch: refetchExtractedData,
  } = useQuery(GET_TOUR_DOCUMENT_EXTRACTED_DATA, {
    variables: { tourId },
    skip: !tourId,
    fetchPolicy: "cache-and-network",
  });

  // ── Mutation ──────────────────────────────────────────────────────────────────
  const [updateParticipant, { loading: savingDocs }] = useMutation(UPDATE_PARTICIPANT_DOCS);
  const [updateParticipantVisaStatus, { loading: savingVisa }] = useMutation(
    UPDATE_PARTICIPANT_VISA_STATUS
  );
  const [revokeVerification, { loading: revokingVerification }] = useMutation(
    REVOKE_PARTICIPANT_VERIFICATION
  );

  const handleRevokeVerification = useCallback(
    async (participantId, reason) => {
      try {
        await revokeVerification({ variables: { participantId, reason } });
        showToast(
          "Verificación retirada. El participante deberá revisar y confirmar nuevamente.",
          "success"
        );
        await refetch();
      } catch (error) {
        showToast(error.message || "No se pudo retirar la verificación", "error");
        throw error;
      }
    },
    [refetch, revokeVerification]
  );

  const handleSave = useCallback(
    async (participantId, input) => {
      const { visaStatusUpdate, ...documentInput } = input || {};

      const shouldUpdateDocuments = Object.keys(documentInput).length > 0;
      const shouldUpdateVisa = Boolean(visaStatusUpdate?.status);

      try {
        if (shouldUpdateDocuments) {
          await updateParticipant({ variables: { id: participantId, input: documentInput } });
        }
        if (shouldUpdateVisa) {
          await updateParticipantVisaStatus({
            variables: { participantId, input: visaStatusUpdate },
          });
        }

        showToast("Documentos y estado de visa actualizados correctamente", "success");
        setEditParticipant(null);
        await Promise.all([refetch(), refetchExtractedData()]);
      } catch (e) {
        showToast(e.message || "Error al guardar", "error");
      }
    },
    [refetch, refetchExtractedData, updateParticipant, updateParticipantVisaStatus]
  );

  // ── Reference date + computed statuses ───────────────────────────────────────
  const refDate = useMemo(() => getTourReferenceDate(tour), [tour]);
  const hasRefDate = !!refDate;

  const participants = useMemo(() => data?.getTourParticipants || [], [data]);
  const extractedByParticipant = useMemo(
    () =>
      new Map(
        (extractedData?.getTourAviancaDocumentData || []).map((entry) => [
          entry.participantId,
          entry,
        ])
      ),
    [extractedData]
  );

  const enriched = useMemo(
    () =>
      participants.map((p) => ({
        ...p,
        __documentData: extractedByParticipant.get(p.id) || null,
        _docStatus: computeParticipantDocStatus(p, refDate),
        _passportExpiry: getExpiryStatus(p.passportExpiry),
        // hasVisa=false → "missing" (no puede pintarse como ok)
        _visaExpiry: p.hasVisa ? getExpiryStatus(p.visaExpiry) : "missing",
        _exitRequired: isExitPermitRequired(p.birthDate, refDate),
        _visaDenied: p.visaStatus === "DENIED",
        _visaDeniedLabel: getVisaDenialLabel(p.visaDeniedCount),
      })),
    [participants, refDate, extractedByParticipant]
  );

  const docCounts = useMemo(
    () =>
      enriched.reduce(
        (acc, p) => {
          acc[p._docStatus] = (acc[p._docStatus] || 0) + 1;
          return acc;
        },
        { COMPLETE: 0, INCOMPLETE: 0, EXPIRED: 0, EXPIRING: 0 }
      ),
    [enriched]
  );

  return {
    participants: enriched,
    loading: loading || loadingExtractedData,
    error: error || extractedDataError,
    refetch: () => Promise.all([refetch(), refetchExtractedData()]),
    refDate,
    hasRefDate,
    docCounts,
    // Detail drawer
    detailParticipant,
    openDetail: setDetailParticipant,
    closeDetail: () => setDetailParticipant(null),
    // Edit modal
    editParticipant,
    openEdit: setEditParticipant,
    closeEdit: () => setEditParticipant(null),
    // Save
    handleSave,
    saving: savingDocs || savingVisa,
    handleRevokeVerification,
    revokingVerification,
    // Toast
    toast,
    setToast,
  };
}
