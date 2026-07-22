/* eslint-disable react/prop-types */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { GET_TOUR_ITINERARIES } from "../tourFlights/tourItineraries.gql";
import {
  ASSIGN_TOUR_PARTICIPANT_TICKETS,
  CREATE_TICKET_UPLOAD_AUTHORIZATION,
  TOUR_PARTICIPANT_TICKETS,
} from "./tourTickets.gql";
import { mapWithConcurrency, sha256File, uploadAuthorizedTicket } from "./ticketUpload";
import {
  detectTicketDuplicates,
  matchTicketToParticipant,
  parseTicketFilename,
  participantFullName,
} from "./ticketMatching";

const STATUS_META = {
  EXACT_MATCH: ["Coincidencia exacta", "bg-emerald-50 text-emerald-800 border-emerald-200"],
  PROBABLE_MATCH: ["Coincidencia probable", "bg-sky-50 text-sky-800 border-sky-200"],
  REVIEW_REQUIRED: ["Requiere revisión", "bg-amber-50 text-amber-800 border-amber-200"],
  AMBIGUOUS_PARTICIPANT: ["Participante ambiguo", "bg-amber-50 text-amber-800 border-amber-200"],
  NO_MATCH: ["Sin participante", "bg-rose-50 text-rose-800 border-rose-200"],
  DUPLICATE_FILE: ["Archivo duplicado", "bg-orange-50 text-orange-800 border-orange-200"],
  DUPLICATE_ASSIGNMENT: ["Asignación duplicada", "bg-orange-50 text-orange-800 border-orange-200"],
  INVALID_FORMAT: ["Formato inválido", "bg-rose-50 text-rose-800 border-rose-200"],
  NOT_PDF: ["Archivo no PDF", "bg-rose-50 text-rose-800 border-rose-200"],
  EXCLUDED: ["Excluido", "bg-slate-100 text-slate-600 border-slate-200"],
};
const FILTERS = [
  ["all", "Todos"],
  ["ready", "Listos"],
  ["EXACT_MATCH", "Exactas"],
  ["PROBABLE_MATCH", "Probables"],
  ["review", "Revisión"],
  ["NO_MATCH", "Sin coincidencia"],
  ["duplicates", "Duplicados"],
  ["EXCLUDED", "Excluidos"],
];

function effectiveStatus(row) {
  if (!row.included) return "EXCLUDED";
  if (!row.parsed.isPdf) return "NOT_PDF";
  if (row.duplicateFile) return "DUPLICATE_FILE";
  if (row.duplicateAssignment) return "DUPLICATE_ASSIGNMENT";
  if (!row.parsed.isValidPattern) return "INVALID_FORMAT";
  return row.match.status;
}
function isReady(row) {
  return row.included && ["EXACT_MATCH", "PROBABLE_MATCH"].includes(effectiveStatus(row));
}
function acceptsFilter(row, filter) {
  const status = effectiveStatus(row);
  if (filter === "all") return true;
  if (filter === "ready") return isReady(row);
  if (filter === "review") return ["REVIEW_REQUIRED", "AMBIGUOUS_PARTICIPANT"].includes(status);
  if (filter === "duplicates") return status.startsWith("DUPLICATE");
  return status === filter;
}

function DropArea({ onFiles }) {
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();
  const folderRef = useRef();
  const handle = (list) => onFiles(Array.from(list || []));
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Arrastra archivos PDF o presiona Enter para seleccionarlos"
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handle(e.dataTransfer.files);
      }}
      className={`rounded-3xl border-2 border-dashed p-8 text-center transition ${
        dragging ? "border-sky-500 bg-sky-50" : "border-slate-300 bg-slate-50"
      }`}
    >
      <div className="text-3xl" aria-hidden="true">
        ⇧
      </div>
      <p className="mt-2 font-bold text-slate-900">Arrastra aquí todos los PDF del itinerario</p>
      <p className="mt-1 text-xs text-slate-500">
        El análisis ocurre en tu navegador. Los archivos solo se enviarán después de confirmar.
      </p>
      <div className="mt-4 flex justify-center flex-wrap gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="px-4 py-2 rounded-xl bg-slate-950 text-white text-sm font-bold"
        >
          Seleccionar archivos
        </button>
        <button
          type="button"
          onClick={() => folderRef.current?.click()}
          className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-sm font-bold"
        >
          Seleccionar carpeta
        </button>
      </div>
      <input
        ref={fileRef}
        className="hidden"
        type="file"
        accept="application/pdf,.pdf"
        multiple
        onChange={(e) => {
          handle(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={folderRef}
        className="hidden"
        type="file"
        accept="application/pdf,.pdf"
        multiple
        webkitdirectory=""
        directory=""
        onChange={(e) => {
          handle(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function StatusBadge({ status }) {
  const [label, cls] = STATUS_META[status] || STATUS_META.INVALID_FORMAT;
  return (
    <span className={`inline-flex px-2 py-1 rounded-full border text-[10px] font-bold ${cls}`}>
      {label}
    </span>
  );
}

export default function TourTicketImportPage({ tourId }) {
  const [itineraryId, setItineraryId] = useState("");
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [importing, setImporting] = useState(false);
  const { data, loading, error } = useQuery(GET_TOUR_ITINERARIES, {
    variables: { tourId },
    skip: !tourId,
    fetchPolicy: "cache-and-network",
  });
  const { data: existingTicketsData } = useQuery(TOUR_PARTICIPANT_TICKETS, {
    variables: { tourId, itineraryId },
    skip: !tourId || !itineraryId,
    fetchPolicy: "cache-and-network",
  });
  const liveItineraries = data?.getTourItineraries || [];
  const itineraries = liveItineraries;
  const [createAuthorization] = useMutation(CREATE_TICKET_UPLOAD_AUTHORIZATION);
  const [assignTickets] = useMutation(ASSIGN_TOUR_PARTICIPANT_TICKETS);
  const hasPendingChanges = rows.some((row) => row.uploadStatus !== "COMPLETED");
  const selectedItinerary = itineraries.find((item) => item.id === itineraryId);
  const participants = selectedItinerary?.participants || [];
  const existingTicketParticipantIds = useMemo(
    () =>
      new Set(
        (existingTicketsData?.tourParticipantTickets || []).map((ticket) => ticket.participant.id)
      ),
    [existingTicketsData]
  );
  useEffect(() => {
    if (!itineraryId && itineraries[0]) setItineraryId(itineraries[0].id);
  }, [itineraries, itineraryId]);
  useEffect(() => {
    const beforeUnload = (event) => {
      if (hasPendingChanges) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [hasPendingChanges]);

  const process = useCallback(
    (files, baseRows = []) => {
      const created = files.map((file, index) => {
        const parsed = parseTicketFilename(file.name);
        return {
          id: `${file.name}-${file.size}-${file.lastModified}-${baseRows.length + index}`,
          file,
          parsed,
          match: matchTicketToParticipant(parsed, participants),
          itineraryId,
          included: true,
          manual: false,
          uploadStatus: "PENDING",
          uploadProgress: 0,
          uploadError: null,
        };
      });
      setRows(detectTicketDuplicates([...baseRows, ...created]));
    },
    [participants, itineraryId]
  );
  const reprocess = () =>
    process(
      rows.map((r) => r.file),
      []
    );
  const setManual = (rowId, participantId) =>
    setRows((current) =>
      detectTicketDuplicates(
        current.map((row) => {
          if (row.id !== rowId) return row;
          const participant = participants.find((p) => p.id === participantId);
          return {
            ...row,
            manual: true,
            match: {
              participantId,
              participantName: participantFullName(participant),
              participant,
              status: "PROBABLE_MATCH",
              confidence: 1,
              reasons: ["Participante seleccionado manualmente"],
              alternatives: [],
            },
          };
        })
      )
    );
  const remove = (id) =>
    setRows((current) => detectTicketDuplicates(current.filter((row) => row.id !== id)));
  const clear = () => {
    if (!rows.length || window.confirm("¿Descartar todos los archivos y revisiones de este lote?"))
      setRows([]);
  };
  const counts = useMemo(
    () => ({
      total: rows.length,
      ready: rows.filter(isReady).length,
      review: rows.filter((r) =>
        ["REVIEW_REQUIRED", "AMBIGUOUS_PARTICIPANT"].includes(effectiveStatus(r))
      ).length,
      noMatch: rows.filter((r) => effectiveStatus(r) === "NO_MATCH").length,
      duplicates: rows.filter((r) => effectiveStatus(r).startsWith("DUPLICATE")).length,
      excluded: rows.filter((r) => !r.included).length,
      invalid: rows.filter((r) => ["NOT_PDF", "INVALID_FORMAT"].includes(effectiveStatus(r)))
        .length,
    }),
    [rows]
  );
  const assignedIds = new Set(rows.filter(isReady).map((r) => r.match.participantId));
  const missing = participants.filter((p) => !assignedIds.has(p.id));
  const visibleRows = useMemo(
    () =>
      rows.filter(
        (row) =>
          (acceptsFilter(row, filter) && !search.trim()) ||
          (acceptsFilter(row, filter) &&
            [
              row.file.name,
              row.parsed.passengerNameRaw,
              row.match.participantName,
              selectedItinerary?.name,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()
              .includes(search.toLowerCase()))
      ),
    [rows, filter, search, selectedItinerary]
  );
  const critical = counts.review + counts.noMatch + counts.duplicates + counts.invalid;
  const pendingReadyCount = rows.filter(
    (row) => isReady(row) && row.uploadStatus !== "COMPLETED"
  ).length;
  const updateRow = useCallback(
    (rowId, patch) =>
      setRows((current) => current.map((row) => (row.id === rowId ? { ...row, ...patch } : row))),
    []
  );
  const confirmAssignments = async () => {
    const readyRows = rows.filter((row) => isReady(row) && row.uploadStatus !== "COMPLETED");
    if (!readyRows.length || importing) return;
    setImporting(true);
    setNotice("");
    try {
      const uploaded = await mapWithConcurrency(readyRows, 4, async (row) => {
        try {
          updateRow(row.id, { uploadStatus: "HASHING", uploadProgress: 10, uploadError: null });
          const sha256 = await sha256File(row.file);
          updateRow(row.id, { uploadStatus: "AUTHORIZING", uploadProgress: 25 });
          const { data: authorizationData } = await createAuthorization({
            variables: { input: { tourId, itineraryId } },
          });
          const authorization = authorizationData.createTourParticipantTicketUploadAuthorization;
          updateRow(row.id, { uploadStatus: "UPLOADING", uploadProgress: 45 });
          const resource = await uploadAuthorizedTicket(row.file, authorization);
          updateRow(row.id, { uploadStatus: "UPLOADED", uploadProgress: 75 });
          return {
            row,
            input: {
              clientFileId: row.id,
              tourId,
              itineraryId,
              participantId: row.match.participantId,
              publicId: resource.publicId || authorization.publicId,
              originalName: row.file.name,
              bytes: resource.bytes || row.file.size,
              mimeType: "application/pdf",
              sha256,
              idempotencyKey: `${tourId}:${itineraryId}:${row.match.participantId}:${sha256}`,
            },
          };
        } catch (uploadError) {
          updateRow(row.id, {
            uploadStatus: "FAILED",
            uploadProgress: 0,
            uploadError: uploadError.message,
          });
          return { row, error: uploadError };
        }
      });
      const validUploads = uploaded.filter((item) => item.input);
      if (!validUploads.length) throw new Error("Ningún archivo pudo subirse");
      validUploads.forEach(({ row }) =>
        updateRow(row.id, { uploadStatus: "ASSIGNING", uploadProgress: 85 })
      );
      const { data: assignmentData } = await assignTickets({
        variables: { inputs: validUploads.map((item) => item.input) },
        refetchQueries: [{ query: TOUR_PARTICIPANT_TICKETS, variables: { tourId, itineraryId } }],
      });
      const result = assignmentData.assignTourParticipantTickets;
      result.results.forEach((item) =>
        updateRow(item.clientFileId, {
          uploadStatus: item.status === "FAILED" ? "FAILED" : "COMPLETED",
          uploadProgress: item.status === "FAILED" ? 85 : 100,
          uploadError: item.status === "FAILED" ? item.message : null,
        })
      );
      setNotice(
        `${result.succeeded} asignados · ${result.skipped} omitidos · ${
          result.failed + uploaded.filter((item) => item.error).length
        } fallidos`
      );
    } catch (importError) {
      setNotice(importError.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <section className="space-y-5" aria-labelledby="ticket-import-title">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <label htmlFor="ticket-itinerary" className="text-sm font-bold text-slate-900">
          Itinerario al que pertenece este lote
        </label>
        <select
          id="ticket-itinerary"
          value={itineraryId}
          onChange={(e) => {
            if (
              !rows.length ||
              window.confirm("Cambiar el itinerario reprocesará todo el lote. ¿Continuar?")
            ) {
              setItineraryId(e.target.value);
              setRows([]);
            }
          }}
          className="mt-2 w-full rounded-xl border border-slate-300 p-3 text-sm bg-white"
          disabled={loading}
        >
          {loading
            ? "Cargando itinerarios…"
            : itineraries.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {item.participants?.length || 0} participantes
                </option>
              ))}
        </select>
        {error && (
          <p className="mt-2 text-xs text-amber-700">
            No se pudieron consultar los itinerarios: {error.message}
          </p>
        )}
      </div>
      <DropArea onFiles={(files) => process(files, rows)} />
      {rows.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2" aria-label="Resumen del lote">
            {[
              [counts.total, "Archivos"],
              [counts.ready, "Listos"],
              [counts.review, "Revisión"],
              [counts.duplicates, "Duplicados"],
              [missing.length, "Sin tiquete"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-2xl font-bold text-slate-950">{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            ))}
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex gap-2 flex-wrap items-center">
              {FILTERS.map(([id, label]) => (
                <button
                  type="button"
                  key={id}
                  onClick={() => setFilter(id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                    filter === id ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {label}
                </button>
              ))}
              <input
                aria-label="Buscar en el lote"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar archivo, participante…"
                className="ml-auto min-w-[220px] rounded-xl border border-slate-300 px-3 py-2 text-xs"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Incluir</th>
                    <th className="p-3">Archivo / nombre extraído</th>
                    <th className="p-3">Participante sugerido</th>
                    <th className="p-3">Confianza</th>
                    <th className="p-3">Estado / advertencias</th>
                    <th className="p-3">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleRows.map((row) => {
                    const status = effectiveStatus(row);
                    return (
                      <tr key={row.id} className={!row.included ? "opacity-60 bg-slate-50" : ""}>
                        <td className="p-3">
                          <input
                            type="checkbox"
                            aria-label={`Incluir ${row.file.name}`}
                            checked={row.included}
                            onChange={(e) =>
                              setRows((current) =>
                                current.map((item) =>
                                  item.id === row.id
                                    ? { ...item, included: e.target.checked }
                                    : item
                                )
                              )
                            }
                          />
                        </td>
                        <td className="p-3 max-w-[280px]">
                          <p className="font-semibold text-slate-900 break-all">{row.file.name}</p>
                          <p className="mt-1 text-slate-500">
                            {row.parsed.passengerNameRaw || "Nombre no detectado"}
                          </p>
                        </td>
                        <td className="p-3">
                          <p className="font-semibold text-slate-800">
                            {row.match.participantName || "Sin selección"}
                            {row.manual && " · Manual"}
                          </p>
                          {row.match.participantId &&
                            existingTicketParticipantIds.has(row.match.participantId) && (
                              <p className="mt-1 text-[10px] font-bold text-amber-700">
                                Ya tiene tiquete · esta asignación creará una nueva versión
                              </p>
                            )}
                          {["REVIEW_REQUIRED", "AMBIGUOUS_PARTICIPANT", "NO_MATCH"].includes(
                            row.match.status
                          ) && (
                            <select
                              aria-label={`Seleccionar participante para ${row.file.name}`}
                              value={row.match.participantId || ""}
                              onChange={(e) => setManual(row.id, e.target.value)}
                              className="mt-2 max-w-[260px] rounded-lg border border-slate-300 p-2 bg-white"
                            >
                              <option value="">Revisar participante…</option>
                              {participants.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {participantFullName(p)} · {p.instrument || p.role}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="p-3">
                          <p className="font-bold">
                            {Math.round((row.match.confidence || 0) * 100)}%
                          </p>
                          <p className="mt-1 text-slate-500 max-w-[180px]">
                            {row.match.reasons?.[0]}
                          </p>
                        </td>
                        <td className="p-3">
                          <StatusBadge status={status} />
                          {row.uploadStatus !== "PENDING" && (
                            <div className="mt-2">
                              <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                                <div
                                  className={`h-full ${
                                    row.uploadStatus === "FAILED" ? "bg-rose-500" : "bg-sky-500"
                                  }`}
                                  style={{ width: `${row.uploadProgress}%` }}
                                />
                              </div>
                              <p
                                className={`mt-1 text-[10px] font-semibold ${
                                  row.uploadStatus === "FAILED" ? "text-rose-700" : "text-slate-500"
                                }`}
                              >
                                {row.uploadError || row.uploadStatus}
                              </p>
                            </div>
                          )}
                          {row.parsed.warnings.slice(0, 2).map((warning) => (
                            <p key={warning} className="mt-1 text-[10px] text-slate-500">
                              • {warning}
                            </p>
                          ))}
                        </td>
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() => remove(row.id)}
                            className="font-bold text-rose-700"
                          >
                            Quitar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="font-bold text-slate-900">Participantes sin tiquete detectado</h3>
              <p className="mt-1 text-xs text-slate-500">
                {missing.length} de {participants.length} participantes del itinerario.
              </p>
              <div className="mt-3 max-h-44 overflow-auto divide-y divide-slate-100">
                {missing.map((p) => (
                  <div key={p.id} className="py-2 flex justify-between gap-3 text-xs">
                    <span className="font-semibold">{participantFullName(p)}</span>
                    <span className="text-slate-500">
                      {p.instrument || p.role}
                      {!p.linkedUser ? " · Sin usuario vinculado" : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <aside className="rounded-2xl border border-sky-200 bg-sky-50 p-5">
              <p className="text-[10px] uppercase tracking-widest font-bold text-sky-700">
                Vista previa de notificación
              </p>
              <p className="mt-3 text-sm font-bold">Tu tiquete aéreo fue asignado</p>
              <p className="mt-1 text-xs text-slate-600">
                Ya puedes ver y descargar tu tiquete desde la sección “Tiquete aéreo” de la gira.
              </p>
              <p className="mt-3 text-[10px] text-sky-700">
                Se enviará únicamente cuando exista un usuario vinculado.
              </p>
            </aside>
          </div>
          <div className="sticky bottom-3 rounded-2xl border border-slate-200 bg-white/95 backdrop-blur p-3 shadow-xl flex flex-wrap justify-between gap-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={reprocess}
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
              >
                Reprocesar
              </button>
              <button
                type="button"
                onClick={clear}
                className="px-3 py-2 rounded-xl text-rose-700 text-xs font-bold"
              >
                Limpiar lote
              </button>
            </div>
            <button
              type="button"
              disabled={critical > 0 || pendingReadyCount === 0 || importing}
              onClick={confirmAssignments}
              className="px-5 py-2 rounded-xl bg-sky-600 text-white text-sm font-bold disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              {importing ? "Procesando lote…" : "Confirmar asignaciones"}
            </button>
          </div>
          {notice && (
            <div
              role="status"
              className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800"
            >
              {notice}
            </div>
          )}
        </>
      )}
    </section>
  );
}
