import { useState, useEffect, useRef, useCallback } from 'react';
import { useLazyQuery } from '@apollo/client';
import { DOCUMENT_BY_ID } from '../graphql/documents/documents.gql';

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS        = 60; // 3 minutes max

const TERMINAL_SUCCESS = new Set(['OCR_SUCCESS', 'VERIFIED']);
const TERMINAL_FAIL    = new Set(['OCR_FAILED', 'REJECTED']);

/**
 * Polls documentById until OCR reaches a terminal state.
 * Call startPolling(id) to begin. Status: idle | polling | success | failed | timeout
 */
export function useOcrPolling() {
  const [status,   setStatus]   = useState('idle');
  const [document, setDocument] = useState(null);
  const [docId,    setDocId]    = useState(null);
  const pollCountRef             = useRef(0);
  const intervalRef              = useRef(null);

  const [fetchDoc] = useLazyQuery(DOCUMENT_BY_ID, {
    fetchPolicy: 'network-only',
    onCompleted(data) {
      const doc = data?.documentById;
      if (!doc) return;
      setDocument(doc);
      if (TERMINAL_SUCCESS.has(doc.status)) { setStatus('success'); _stop(); }
      else if (TERMINAL_FAIL.has(doc.status)) { setStatus('failed'); _stop(); }
    },
  });

  const _stop = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  const startPolling = useCallback((id) => {
    if (!id) return;
    setDocId(id);
    setStatus('polling');
    setDocument(null);
    pollCountRef.current = 0;
    _stop();
    fetchDoc({ variables: { id } });
    intervalRef.current = setInterval(() => {
      pollCountRef.current += 1;
      if (pollCountRef.current > MAX_POLLS) { setStatus('timeout'); _stop(); return; }
      fetchDoc({ variables: { id } });
    }, POLL_INTERVAL_MS);
  }, [fetchDoc, _stop]);

  const stopPolling = useCallback(() => { _stop(); setStatus('idle'); }, [_stop]);

  useEffect(() => () => _stop(), [_stop]);

  const progressPct = Math.min((pollCountRef.current / MAX_POLLS) * 100, 98);

  return { status, document, docId, startPolling, stopPolling, isPolling: status === 'polling', progressPct };
}
