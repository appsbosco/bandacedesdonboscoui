import { useState, useCallback } from "react";
import { useLazyQuery } from "@apollo/client";
import { GET_EVALUATION_DETAIL } from "../academic.gql";

/**
 * Hook para cargar el detalle completo de una evaluación bajo demanda.
 * La evidencia original (evidenceUrl, evidencePreviewUrl) NO se carga hasta
 * que el usuario abre el modal — elimina el costo de descargar imágenes en lista.
 *
 * Uso:
 *   const { openDetail, closeDetail, detailModal } = useEvaluationDetail();
 *   <button onClick={() => openDetail(evaluationId)}>Ver</button>
 *   {detailModal.open && <EvidenceDetailModal {...detailModal} onClose={closeDetail} />}
 */
export function useEvaluationDetail() {
  const [detailModal, setDetailModal] = useState({
    open: false,
    evaluationId: null,
    data: null,
  });

  const [fetchDetail, { loading, error }] = useLazyQuery(GET_EVALUATION_DETAIL, {
    fetchPolicy: "cache-first",
    onCompleted: (data) => {
      if (data?.evaluationDetail) {
        setDetailModal((prev) => ({ ...prev, data: data.evaluationDetail }));
      }
    },
    onError: (e) => {
      console.error("[useEvaluationDetail]", e.message);
    },
  });

  const openDetail = useCallback(
    (evaluationId) => {
      setDetailModal({ open: true, evaluationId, data: null });
      fetchDetail({ variables: { id: evaluationId } });
    },
    [fetchDetail]
  );

  const closeDetail = useCallback(() => {
    setDetailModal({ open: false, evaluationId: null, data: null });
  }, []);

  return {
    detailModal,
    openDetail,
    closeDetail,
    detailLoading: loading,
    detailError: error,
  };
}
