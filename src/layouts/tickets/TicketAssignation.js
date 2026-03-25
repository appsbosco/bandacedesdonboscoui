/* eslint-disable react/prop-types */

import React, { useState, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { gql } from "@apollo/client";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import {
  GET_EVENTS,
  GET_TICKETS,
  ASSIGN_TICKETS,
  ASSIGN_BULK,
  PURCHASE_TICKET,
  SEND_COURTESY,
  IMPORT_TICKETS_FROM_EXCEL,
  ADD_IMPORTED_TICKET_RECIPIENT,
  Spinner,
  fmt,
} from "./Shared";
import DropZone from "layouts/tours/tourImports/DropZone";

const GET_USERS = gql`
  query GetUsers($filter: UserQueryFilterInput) {
    getUsers(filter: $filter) {
      id
      name
      firstSurName
      secondSurName
      email
      role
      instrument
      avatar
      state
    }
  }
`;

const GET_EXALUMNOS = gql`
  query GetExAlumnos {
    getExAlumnos {
      id
      fullName
      email
      instrument
      yearGraduated
    }
  }
`;

const USER_STATE_OPTIONS = ["Estudiante Activo", "Exalumno"];
const DEFAULT_BULK_QUANTITY = 2;
const STATE_PILL_STYLES = {
  "Estudiante Activo": "bg-emerald-50 text-emerald-700 border-emerald-100",
  Exalumno: "bg-blue-50 text-blue-600 border-blue-100",
};

const MODES = [
  { id: "registered", label: "Usuario registrado", icon: "👤" },
  { id: "external", label: "Compra externa", icon: "🛒" },
  { id: "courtesy", label: "Cortesía", icon: "🎁" },
  { id: "bulk", label: "Asignación masiva", icon: "📋" },
  { id: "excel", label: "Importar Excel", icon: "📥" },
];

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("No se pudo leer el archivo Excel"));
    reader.readAsDataURL(file);
  });
}

function getUserFullName(user) {
  return [user?.name, user?.firstSurName, user?.secondSurName].filter(Boolean).join(" ");
}

function normalizeCandidateState(state) {
  return String(state || "").trim() === "Exalumno" ? "Exalumno" : state || "";
}

function StatePill({ state }) {
  const cls = STATE_PILL_STYLES[state] || "bg-gray-100 text-gray-500 border-gray-200";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cls}`}
    >
      {state || "Sin estado"}
    </span>
  );
}

export default function TicketAssignation() {
  const [mode, setMode] = useState("registered");
  const [eventId, setEventId] = useState("");
  const [userId, setUserId] = useState("");
  const [ticketType, setTicketType] = useState("assigned");
  const [quantity, setQuantity] = useState(2);
  const [userSearch, setUserSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [excelFile, setExcelFile] = useState(null);
  const [importSummary, setImportSummary] = useState(null);
  const [importBuyerName, setImportBuyerName] = useState("");
  const [importBuyerEmail, setImportBuyerEmail] = useState("");
  const [importQuantity, setImportQuantity] = useState(1);
  const [importPaymentStatus, setImportPaymentStatus] = useState("assigned");
  const [selectedBulkUsers, setSelectedBulkUsers] = useState({});
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const { data: eventsData } = useQuery(GET_EVENTS);
  const {
    data: usersData,
    loading: usersLoading,
    error: usersError,
  } = useQuery(GET_USERS, {
    variables: {
      filter: {
        searchText: userSearch.trim() || undefined,
        state: stateFilter || undefined,
      },
    },
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
    notifyOnNetworkStatusChange: true,
  });
  const {
    data: exalumnosData,
    loading: exalumnosLoading,
    error: exalumnosError,
  } = useQuery(GET_EXALUMNOS, {
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
  });

  const refetchOpts = eventId ? [{ query: GET_TICKETS, variables: { eventId } }] : [];
  const onErr = (e) => setError(e.message || "Error al procesar entradas");

  const [assignTickets, { loading: l1 }] = useMutation(ASSIGN_TICKETS, {
    onCompleted: () => {
      setSuccess("¡Entradas asignadas correctamente! 🎟");
      setUserId("");
    },
    onError: onErr,
    refetchQueries: refetchOpts,
  });
  const [assignBulk, { loading: l2 }] = useMutation(ASSIGN_BULK, {
    onCompleted: (d) => {
      const r = d.assignTicketsBulk;
      r.failed.length
        ? setError(`${r.succeeded.length} ok. ${r.failed.length} fallaron.`)
        : setSuccess(`${r.total} entradas asignadas 🎉`);
      setSelectedBulkUsers({});
    },
    onError: onErr,
  });
  const [purchaseTicket, { loading: l3 }] = useMutation(PURCHASE_TICKET, {
    onCompleted: () => {
      setSuccess("Compra registrada correctamente 🎟");
      setBuyerName("");
      setBuyerEmail("");
    },
    onError: onErr,
    refetchQueries: refetchOpts,
  });
  const [sendCourtesy, { loading: l4 }] = useMutation(SEND_COURTESY, {
    onCompleted: () => {
      setSuccess("Cortesía enviada correctamente 🎁");
      setBuyerName("");
      setBuyerEmail("");
    },
    onError: onErr,
  });
  const [importTicketsFromExcel, { loading: l5 }] = useMutation(IMPORT_TICKETS_FROM_EXCEL, {
    onCompleted: (d) => {
      const result = d.importTicketsFromExcel;
      setImportSummary(result);
      setSuccess(
        `Importación lista: ${result.groupedRecipients} personas agrupadas, ${result.emailsSent} correo(s) enviados`
      );
      setExcelFile(null);
    },
    onError: onErr,
    refetchQueries: refetchOpts,
  });
  const [addImportedTicketRecipient, { loading: l6 }] = useMutation(ADD_IMPORTED_TICKET_RECIPIENT, {
    onCompleted: () => {
      setSuccess("Persona agregada al flujo importado correctamente");
      setImportBuyerName("");
      setImportBuyerEmail("");
      setImportQuantity(1);
      setImportPaymentStatus("assigned");
    },
    onError: onErr,
    refetchQueries: refetchOpts,
  });

  const isLoading = l1 || l2 || l3 || l4 || l5 || l6;
  const selectedEvent = eventsData?.getEventsT?.find((e) => e.id === eventId);
  const queriedUsers = usersData?.getUsers || [];
  const queriedExalumnos = exalumnosData?.getExAlumnos || [];
  const bulkSelectedUsers = Object.values(selectedBulkUsers);
  const bulkSelectedCount = bulkSelectedUsers.length;
  const bulkTotalQuantity = bulkSelectedUsers.reduce((sum, user) => sum + (user.quantity || 1), 0);
  const searchNeedle = userSearch.trim().toLowerCase();

  const filteredUsers = useMemo(() => {
    return queriedUsers.filter((u) => !roleFilter || u.role === roleFilter);
  }, [queriedUsers, roleFilter]);

  const registeredRoles = useMemo(
    () => [...new Set(queriedUsers.map((u) => u.role).filter(Boolean))],
    [queriedUsers]
  );

  const bulkCandidates = useMemo(() => {
    const normalizedUsers = queriedUsers.map((user) => ({
      ...user,
      kind: normalizeCandidateState(user.state) === "Exalumno" ? "exalumno" : "user",
      state: normalizeCandidateState(user.state),
      displayRole: user.role || "Usuario registrado",
      searchBlob: [
        user.name,
        user.firstSurName,
        user.secondSurName,
        user.email,
        user.role,
        user.instrument,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase(),
    }));

    const normalizedExalumnos = queriedExalumnos.map((exalumno) => ({
      id: `exalumno:${exalumno.id}`,
      externalId: exalumno.id,
      kind: "exalumno",
      name: exalumno.fullName,
      firstSurName: "",
      secondSurName: "",
      email: exalumno.email,
      role: "Exalumno",
      displayRole: exalumno.yearGraduated ? `Exalumno ${exalumno.yearGraduated}` : "Exalumno",
      instrument: exalumno.instrument,
      state: "Exalumno",
      searchBlob: [exalumno.fullName, exalumno.email, exalumno.instrument, exalumno.yearGraduated]
        .filter(Boolean)
        .join(" ")
        .toLowerCase(),
    }));

    const merged = [...normalizedUsers];
    const seenEmails = new Set(
      normalizedUsers
        .map((candidate) => String(candidate.email || "").trim().toLowerCase())
        .filter(Boolean)
    );

    normalizedExalumnos.forEach((candidate) => {
      const email = String(candidate.email || "").trim().toLowerCase();
      if (email && seenEmails.has(email)) return;
      merged.push(candidate);
    });

    return merged;
  }, [queriedExalumnos, queriedUsers]);

  const bulkRoles = useMemo(
    () => [...new Set(bulkCandidates.map((u) => u.displayRole).filter(Boolean))],
    [bulkCandidates]
  );

  const filteredBulkCandidates = useMemo(() => {
    return bulkCandidates.filter((candidate) => {
      if (stateFilter && normalizeCandidateState(candidate.state) !== stateFilter) return false;
      if (roleFilter && candidate.displayRole !== roleFilter) return false;
      if (searchNeedle && !candidate.searchBlob.includes(searchNeedle)) return false;
      return true;
    });
  }, [bulkCandidates, roleFilter, searchNeedle, stateFilter]);

  const toggleBulkUser = (user) => {
    setSelectedBulkUsers((prev) => {
      if (prev[user.id]) {
        const next = { ...prev };
        delete next[user.id];
        return next;
      }
      return {
        ...prev,
        [user.id]: {
          ...user,
          quantity: prev[user.id]?.quantity || DEFAULT_BULK_QUANTITY,
        },
      };
    });
  };

  const handleBulkQuantityChange = (userId, nextQuantity) => {
    setSelectedBulkUsers((prev) => {
      if (!prev[userId]) return prev;
      return {
        ...prev,
        [userId]: {
          ...prev[userId],
          quantity: Math.max(1, parseInt(nextQuantity, 10) || 1),
        },
      };
    });
  };

  const handleSelectAllFiltered = () => {
    setSelectedBulkUsers((prev) => {
      const next = { ...prev };
      filteredBulkCandidates.forEach((user) => {
        next[user.id] = next[user.id] || { ...user, quantity: DEFAULT_BULK_QUANTITY };
      });
      return next;
    });
  };

  const handleClearBulkSelection = () => setSelectedBulkUsers({});

  const handleSubmit = async () => {
    setError(null);
    if (!eventId) {
      setError("Selecciona un evento");
      return;
    }
    try {
      if (mode === "registered") {
        if (!userId) {
          setError("Selecciona un integrante");
          return;
        }
        await assignTickets({
          variables: { input: { userId, eventId, type: ticketType, ticketQuantity: quantity } },
        });
      } else if (mode === "external") {
        if (!buyerName || !buyerEmail) {
          setError("Completa nombre y correo");
          return;
        }
        await purchaseTicket({
          variables: { eventId, buyerName, buyerEmail, ticketQuantity: quantity },
        });
      } else if (mode === "courtesy") {
        if (!buyerName || !buyerEmail) {
          setError("Completa nombre y correo");
          return;
        }
        await sendCourtesy({
          variables: { eventId, buyerName, buyerEmail, ticketQuantity: quantity },
        });
      } else if (mode === "excel") {
        if (!excelFile) {
          setError("Sube un archivo Excel para importar");
          return;
        }
        const fileBase64 = await fileToBase64(excelFile);
        await importTicketsFromExcel({
          variables: {
            input: {
              eventId,
              fileBase64,
              filename: excelFile.name,
            },
          },
        });
      } else {
        if (!bulkSelectedCount) {
          setError("Selecciona al menos un usuario para la asignación masiva");
          return;
        }
        await assignBulk({
          variables: {
            input: {
              eventId,
              type: ticketType,
              recipients: bulkSelectedUsers.map((user) => ({
                userId: user.kind === "user" ? user.id : undefined,
                name: user.kind === "exalumno" ? getUserFullName(user) : undefined,
                email: user.kind === "exalumno" ? user.email : undefined,
                quantity: user.quantity || 1,
                skipEmail: user.kind === "exalumno" || normalizeCandidateState(user.state) === "Exalumno",
              })),
            },
          },
        });
      }
    } catch {
      /* handled by onError */
    }
  };

  const handleAddImportedRecipient = async () => {
    setError(null);
    if (!eventId) {
      setError("Selecciona un evento");
      return;
    }
    if (!importBuyerName || !importBuyerEmail) {
      setError("Completa nombre y correo para agregar la persona");
      return;
    }

    await addImportedTicketRecipient({
      variables: {
        input: {
          eventId,
          buyerName: importBuyerName,
          buyerEmail: importBuyerEmail,
          ticketQuantity: importQuantity,
          paymentStatus: importPaymentStatus,
        },
      },
    });
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">Asignar entradas</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Asigna, vende o regala entradas a miembros o personas externas
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          {/* Form */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Mode selector */}
            <div className="bg-white border border-gray-100 rounded-2xl p-2 shadow-sm grid grid-cols-2 md:grid-cols-5 gap-1">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setMode(m.id);
                    setError(null);
                    setSuccess(null);
                    setImportSummary(null);
                  }}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all text-center ${
                    mode === m.id ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-xl">{m.icon}</span>
                  <span className="text-xs font-medium leading-tight">{m.label}</span>
                </button>
              ))}
            </div>

            {/* Feedback */}
            {success && (
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <span className="text-sm text-green-700 font-medium flex-1">{success}</span>
                <button
                  onClick={() => setSuccess(null)}
                  className="text-green-500 hover:text-green-700 text-lg"
                >
                  ✕
                </button>
              </div>
            )}
            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <span className="text-lg">⚠️</span>
                <span className="text-sm text-red-700 flex-1">{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-600 text-lg"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Base fields */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
              {/* Event */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Evento *
                </label>
                <select
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  <option value="">Selecciona un evento…</option>
                  {eventsData?.getEventsT?.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name} — {fmt(ev.price)} c/u
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {mode !== "courtesy" && mode !== "excel" && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                      Tipo
                    </label>
                    <select
                      value={ticketType}
                      onChange={(e) => setTicketType(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
                    >
                      <option value="assigned">Asignada</option>
                      <option value="purchased">Comprada</option>
                      <option value="extra">Extra</option>
                    </select>
                  </div>
                )}
                {mode !== "bulk" && mode !== "excel" && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                      Cantidad *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Mode-specific */}
            {mode === "registered" && (
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <p className="text-sm font-semibold text-gray-800 mb-4">Seleccionar integrante</p>
                <div className="flex gap-2 mb-4">
                  <input
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
                    placeholder="Buscar por nombre, correo o carnet…"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                  <select
                    value={stateFilter}
                    onChange={(e) => setStateFilter(e.target.value)}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    <option value="">Todos los estados</option>
                    {USER_STATE_OPTIONS.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    <option value="">Todos los roles</option>
                    {registeredRoles.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="max-h-72 overflow-y-auto flex flex-col gap-1.5 pr-1">
                  {usersError ? (
                    <p className="text-center py-8 text-sm text-red-500">
                      {usersError.message || "No se pudo cargar la lista de usuarios"}
                    </p>
                  ) : usersLoading ? (
                    <p className="text-center py-8 text-sm text-gray-400">Cargando usuarios…</p>
                  ) : filteredUsers.length === 0 ? (
                    <p className="text-center py-8 text-sm text-gray-400">Sin resultados</p>
                  ) : (
                    filteredUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => setUserId(u.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all w-full ${
                          userId === u.id
                            ? "bg-gray-900 text-white"
                            : "border border-gray-100 hover:bg-gray-50 bg-white"
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
                            userId === u.id ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {u.name?.[0]}
                          {u.firstSurName?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium truncate ${
                              userId === u.id ? "text-white" : "text-gray-800"
                            }`}
                          >
                            {getUserFullName(u)}
                          </p>
                          <p
                            className={`text-xs truncate ${
                              userId === u.id ? "text-white/70" : "text-gray-400"
                            }`}
                          >
                            {u.role}
                            {u.instrument ? ` · ${u.instrument}` : ""}
                          </p>
                        </div>
                        {userId === u.id && <span className="text-white font-bold">✓</span>}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {(mode === "external" || mode === "courtesy") && (
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
                <p className="text-sm font-semibold text-gray-800">
                  {mode === "courtesy" ? "Datos del invitado" : "Datos del comprador"}
                </p>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Nombre completo *
                  </label>
                  <input
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
                    placeholder="Ej. María González Pérez"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Correo electrónico *
                  </label>
                  <input
                    type="email"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
                    placeholder="correo@ejemplo.com"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                  />
                </div>
              </div>
            )}

            {mode === "bulk" && (
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Asignación masiva</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Filtra usuarios, selecciónalos y asigna entradas en un solo lote.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSelectAllFiltered}
                      disabled={!filteredBulkCandidates.length || usersLoading || exalumnosLoading}
                      className="text-xs font-medium text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Seleccionar filtrados
                    </button>
                    <button
                      onClick={handleClearBulkSelection}
                      disabled={!bulkSelectedCount}
                      className="text-xs font-medium text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Limpiar selección
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)] gap-4">
                  <div className="rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex gap-2 flex-wrap">
                      <input
                        className="flex-1 min-w-[220px] border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
                        placeholder="Buscar por nombre, correo o carnet…"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                      />
                      <select
                        value={stateFilter}
                        onChange={(e) => setStateFilter(e.target.value)}
                        className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
                      >
                        <option value="">Todos los estados</option>
                        {USER_STATE_OPTIONS.map((state) => (
                          <option key={state} value={state}>
                            {state}
                          </option>
                        ))}
                      </select>
                      <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
                      >
                        <option value="">Todos los roles</option>
                        {bulkRoles.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="max-h-96 overflow-y-auto flex flex-col divide-y divide-gray-100">
                      {usersError || exalumnosError ? (
                        <p className="text-center py-8 text-sm text-red-500 px-4">
                          {usersError?.message || exalumnosError?.message || "No se pudo cargar la lista"}
                        </p>
                      ) : usersLoading || exalumnosLoading ? (
                        <p className="text-center py-8 text-sm text-gray-400 px-4">
                          Cargando usuarios…
                        </p>
                      ) : filteredBulkCandidates.length === 0 ? (
                        <p className="text-center py-8 text-sm text-gray-400 px-4">
                          Sin resultados para este filtro
                        </p>
                      ) : (
                        filteredBulkCandidates.map((u) => {
                          const isChecked = Boolean(selectedBulkUsers[u.id]);
                          return (
                            <label
                              key={u.id}
                              className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${
                                isChecked ? "bg-blue-50" : "bg-white hover:bg-gray-50"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleBulkUser(u)}
                                className="mt-1 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-medium text-gray-800 truncate">
                                    {getUserFullName(u)}
                                  </p>
                                  <StatePill state={u.state} />
                                </div>
                                <p className="text-xs text-gray-500 truncate mt-1">{u.email}</p>
                                <p className="text-xs text-gray-400 truncate mt-1">
                                  {u.displayRole || u.role}
                                  {u.instrument ? ` · ${u.instrument}` : ""}
                                </p>
                              </div>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <p className="text-sm font-semibold text-gray-800">
                        Seleccionados ({bulkSelectedCount})
                      </p>
                      {bulkSelectedCount > 0 && (
                        <span className="text-xs text-gray-500">
                          {bulkTotalQuantity} entrada{bulkTotalQuantity !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    {bulkSelectedCount === 0 ? (
                      <p className="text-sm text-gray-400 py-6 text-center">
                        No hay usuarios seleccionados todavía.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
                        {bulkSelectedUsers.map((user) => (
                          <div
                            key={user.id}
                            className="rounded-xl border border-gray-200 bg-white px-3 py-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">
                                  {getUserFullName(user)}
                                </p>
                                <p className="text-xs text-gray-500 truncate mt-1">{user.email}</p>
                              </div>
                              <button
                                onClick={() => toggleBulkUser(user)}
                                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                              >
                                Quitar
                              </button>
                            </div>
                            <div className="mt-3 flex items-center justify-between gap-3">
                              <StatePill state={user.state} />
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">Cantidad</span>
                                <input
                                  type="number"
                                  min="1"
                                  max="50"
                                  value={user.quantity || 1}
                                  onChange={(e) =>
                                    handleBulkQuantityChange(user.id, e.target.value)
                                  }
                                  className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-gray-900"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {selectedEvent && (
                  <p className="text-xs text-gray-400 mt-3">
                    Total: {bulkTotalQuantity} entradas ·{" "}
                    {fmt(bulkTotalQuantity * selectedEvent.price)}
                  </p>
                )}
              </div>
            )}

            {mode === "excel" && (
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    Importación agrupada desde Excel
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Sube un Excel con número de entrada, nombre, correo y estado (`asignada` o
                    `pagada`). El sistema agrupa por persona y solo envía un correo cuando el grupo
                    queda totalmente pagado.
                  </p>
                </div>

                <DropZone onFileSelect={setExcelFile} disabled={isLoading} />

                <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                  Encabezados aceptados:
                  <span className="font-medium">
                    {" "}
                    número de entrada, nombre, correo electrónico, estado
                  </span>
                  . La importación actualiza o crea grupos, pero no elimina tickets existentes.
                </div>

                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Agregar persona manualmente a este evento
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Usa el mismo flujo importado. Se asignan los siguientes números consecutivos
                        disponibles.
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    <input
                      className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
                      placeholder="Nombre completo"
                      value={importBuyerName}
                      onChange={(e) => setImportBuyerName(e.target.value)}
                    />
                    <input
                      type="email"
                      className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
                      placeholder="correo@ejemplo.com"
                      value={importBuyerEmail}
                      onChange={(e) => setImportBuyerEmail(e.target.value)}
                    />
                    <input
                      type="number"
                      min="1"
                      className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
                      value={importQuantity}
                      onChange={(e) => setImportQuantity(parseInt(e.target.value, 10) || 1)}
                    />
                    <select
                      value={importPaymentStatus}
                      onChange={(e) => setImportPaymentStatus(e.target.value)}
                      className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
                    >
                      <option value="assigned">Asignada</option>
                      <option value="paid">Pagada</option>
                    </select>
                  </div>

                  <button
                    onClick={handleAddImportedRecipient}
                    disabled={isLoading || !eventId}
                    className="mt-4 inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {l6 ? (
                      <>
                        <Spinner /> Agregando…
                      </>
                    ) : (
                      "Agregar persona al evento"
                    )}
                  </button>
                </div>

                {importSummary && (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                    <p className="text-sm font-semibold text-emerald-900 mb-3">
                      Resultado de la última importación
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl bg-white/80 px-3 py-2">
                        <span className="text-emerald-700">Filas</span>
                        <p className="font-semibold text-emerald-950">{importSummary.totalRows}</p>
                      </div>
                      <div className="rounded-xl bg-white/80 px-3 py-2">
                        <span className="text-emerald-700">Personas</span>
                        <p className="font-semibold text-emerald-950">
                          {importSummary.groupedRecipients}
                        </p>
                      </div>
                      <div className="rounded-xl bg-white/80 px-3 py-2">
                        <span className="text-emerald-700">Creados</span>
                        <p className="font-semibold text-emerald-950">
                          {importSummary.createdTickets}
                        </p>
                      </div>
                      <div className="rounded-xl bg-white/80 px-3 py-2">
                        <span className="text-emerald-700">Actualizados</span>
                        <p className="font-semibold text-emerald-950">
                          {importSummary.updatedTickets}
                        </p>
                      </div>
                      <div className="rounded-xl bg-white/80 px-3 py-2">
                        <span className="text-emerald-700">Correos enviados</span>
                        <p className="font-semibold text-emerald-950">{importSummary.emailsSent}</p>
                      </div>
                      <div className="rounded-xl bg-white/80 px-3 py-2">
                        <span className="text-emerald-700">Filas inválidas</span>
                        <p className="font-semibold text-emerald-950">
                          {importSummary.invalidRows}
                        </p>
                      </div>
                    </div>
                    {importSummary.failedRows?.length ? (
                      <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-2">
                          Observaciones
                        </p>
                        <div className="max-h-40 overflow-y-auto space-y-1 text-xs text-amber-900">
                          {importSummary.failedRows.map((row) => (
                            <p key={row}>{row}</p>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Summary sidebar */}
          <div className="flex flex-col gap-4 lg:sticky lg:top-20">
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <p className="text-sm font-semibold text-gray-800 mb-4">Resumen</p>
              {selectedEvent ? (
                <div className="flex flex-col gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Evento</span>
                    <span className="font-medium text-gray-900 text-right max-w-36 truncate">
                      {selectedEvent.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Precio / entrada</span>
                    <span className="font-mono text-gray-900">{fmt(selectedEvent.price)}</span>
                  </div>
                  {mode !== "bulk" && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Cantidad</span>
                      <span className="font-mono text-gray-900">{quantity}</span>
                    </div>
                  )}
                  {mode === "bulk" && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Usuarios</span>
                        <span className="font-mono text-gray-900">{bulkSelectedCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Entradas</span>
                        <span className="font-mono text-gray-900">{bulkTotalQuantity}</span>
                      </div>
                    </>
                  )}
                  <div className="border-t border-gray-100 pt-3 flex justify-between font-semibold text-gray-900">
                    <span>Total</span>
                    <span className="font-mono">
                      {mode === "courtesy"
                        ? "Gratis 🎁"
                        : mode === "bulk"
                        ? fmt(bulkTotalQuantity * selectedEvent.price)
                        : fmt(quantity * selectedEvent.price)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {selectedEvent.ticketLimit - selectedEvent.totalTickets} cupos disponibles de{" "}
                    {selectedEvent.ticketLimit}
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{
                        width: `${(selectedEvent.totalTickets / selectedEvent.ticketLimit) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-6">Selecciona un evento</p>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={isLoading || !eventId}
              className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white rounded-xl py-3.5 text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Spinner /> Procesando…
                </>
              ) : mode === "courtesy" ? (
                "🎁 Enviar cortesía"
              ) : mode === "excel" ? (
                "📥 Importar Excel"
              ) : mode === "bulk" ? (
                "📋 Asignación masiva"
              ) : (
                "🎟 Asignar entradas"
              )}
            </button>

            <p className="text-xs text-gray-400 text-center">
              {mode === "excel"
                ? "En Excel solo se enviará correo cuando la persona quede totalmente pagada"
                : "Se enviará un correo con el QR al destinatario"}
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </DashboardLayout>
  );
}
