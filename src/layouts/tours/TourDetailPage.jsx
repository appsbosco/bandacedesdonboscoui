/* eslint-disable react/prop-types */
/**
 * TourDetailPage — detalle de gira con tabs.
 * Toma el tourId de useParams() → /tours/:tourId
 *
 * Comportamiento por rol:
 *   - Admin/Director/Subdirector: vista administrativa completa (todos los tabs)
 *   - Resto: vista self-service (solo tabs habilitados en tour.selfServiceAccess)
 */
import { useEffect, useMemo, useState } from "react";
import { gql, useMutation, useQuery } from "@apollo/client";
import { useNavigate } from "react-router-dom";
import { GET_USERS } from "graphql/queries";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { useTour } from "./useTour";
import TourImportsPage from "./tourImports/TourImportsPage";
import TourFlightsPage from "./tourFlights/TourFlightsPage";
import { Toast, TourStatusBadge, formatTourDateRange, getTourDuration } from "./TourHelpers";
import TourPaymentsPage from "./tourPayments/TourPaymentsPage";
import TourRoomsPage from "./tourRooms/TourRoomsPage";
import TourDocumentsPage from "./tourDocuments/TourDocumentsPage";
import { useTourSelfService } from "./selfService/useTourSelfService";
import TourSelfServiceDocuments from "./selfService/TourSelfServiceDocuments";
import TourSelfServicePayments from "./selfService/TourSelfServicePayments";
import TourSelfServiceConfig from "./TourSelfServiceConfig";
import TourParentView from "./selfService/TourParentView";
import { CREATE_TOUR_PARTICIPANT, DELETE_TOUR_PARTICIPANT } from "./tours.gql";

// Roles con acceso administrativo completo a giras
const ADMIN_ROLES = new Set(["Admin", "Director", "Subdirector"]);
const TOUR_FINANCE_ROLES = new Set(["CEDES Financiero"]);

// Query mínima para saber si el actor actual es un User o un Parent.
// getUser devuelve null para Parents → userData === null solo cuando ha terminado de cargar.
const CHECK_ACTOR = gql`
  query CheckTourActor {
    getUser {
      id
      role
    }
  }
`;

function toDateTimeValue(dateString) {
  if (!dateString) return undefined;
  return `${dateString}T12:00:00.000Z`;
}

function AdminQuickActions({ tourId, onCreated }) {
  const [isOpen, setIsOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("add");
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const EMPTY_FORM = {
    linkedUserId: "",
    firstName: "",
    firstSurname: "",
    secondSurname: "",
    identification: "",
    email: "",
    phone: "",
    birthDate: "",
    instrument: "",
    grade: "",
    role: "MUSICIAN",
    notes: "",
  };
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const { data: usersData, loading: usersLoading } = useQuery(GET_USERS, {
    skip: !isOpen,
    fetchPolicy: "cache-and-network",
  });

  const GET_TOUR_PARTICIPANTS_MODAL = gql`
    query GetTourParticipantsQuickActions($tourId: ID!) {
      getTourParticipants(tourId: $tourId) {
        id
        firstName
        firstSurname
        secondSurname
        identification
        instrument
        linkedUser {
          id
          name
          firstSurName
          secondSurName
          email
        }
      }
    }
  `;

  const {
    data: participantsData,
    loading: participantsLoading,
    refetch: refetchParticipants,
  } = useQuery(GET_TOUR_PARTICIPANTS_MODAL, {
    variables: { tourId },
    skip: !isOpen,
    fetchPolicy: "cache-and-network",
  });

  const [createParticipant, { loading: creating }] = useMutation(CREATE_TOUR_PARTICIPANT, {
    refetchQueries: [
      "GetTourParticipantsQuickActions",
      "GetTourParticipantsPlanner",
      "GetTourParticipantsForRooms",
      "GetTourParticipantsItineraryModal",
      "GetParticipantsForPayment",
      "GetFinancialTable",
      "GetFinancialSummary",
    ],
    awaitRefetchQueries: true,
    onCompleted: () => {
      setToast({ message: "Participante agregado correctamente", type: "success" });
      setIsOpen(false);
      onCreated?.();
    },
    onError: (error) => {
      setToast({ message: error.message, type: "error" });
    },
  });

  const [deleteParticipant, { loading: deleting }] = useMutation(DELETE_TOUR_PARTICIPANT, {
    onCompleted: (data) => {
      const result = data?.deleteTourParticipant;
      setToast({
        message:
          result?.deletionMode === "SOFT"
            ? "Participante retirado de la gira. Se conservó el historial financiero."
            : "Participante eliminado completamente de la gira.",
        type: "success",
      });
      setDeleteCandidate(null);
      refetchParticipants();
      onCreated?.();
    },
    onError: (error) => {
      setToast({ message: error.message, type: "error" });
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    setForm(EMPTY_FORM);
    setErrors({});
    setSearch("");
    setTab("add");
    setDeleteCandidate(null);
  }, [isOpen]);

  const users = usersData?.getUsers || [];
  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((user) =>
      [user.name, user.firstSurName, user.secondSurName, user.email, user.carnet, user.instrument]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [search, users]);

  const participants = participantsData?.getTourParticipants || [];
  const filteredParticipants = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return participants;
    return participants.filter((participant) =>
      [
        participant.firstName,
        participant.firstSurname,
        participant.secondSurname,
        participant.identification,
        participant.instrument,
        participant.linkedUser?.name,
        participant.linkedUser?.firstSurName,
        participant.linkedUser?.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [participants, search]);

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const selectUser = (user) => {
    setForm((prev) => ({
      ...prev,
      linkedUserId: user.id,
      firstName: user.name || prev.firstName,
      firstSurname: user.firstSurName || prev.firstSurname,
      secondSurname: user.secondSurName || prev.secondSurname,
      identification: prev.identification || user.carnet || "",
      email: user.email || prev.email,
      phone: user.phone || prev.phone,
      birthDate: user.birthday ? String(user.birthday).slice(0, 10) : prev.birthDate,
      instrument: user.instrument || prev.instrument,
      grade: user.grade || prev.grade,
    }));
  };

  const submit = () => {
    const nextErrors = {};
    if (!form.firstName.trim()) nextErrors.firstName = "Nombre requerido";
    if (!form.firstSurname.trim()) nextErrors.firstSurname = "Primer apellido requerido";
    if (!form.identification.trim()) nextErrors.identification = "Identificación requerida";
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    createParticipant({
      variables: {
        tourId,
        input: {
          linkedUserId: form.linkedUserId || undefined,
          firstName: form.firstName.trim(),
          firstSurname: form.firstSurname.trim(),
          secondSurname: form.secondSurname.trim() || undefined,
          identification: form.identification.trim(),
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          birthDate: toDateTimeValue(form.birthDate),
          instrument: form.instrument.trim() || undefined,
          grade: form.grade.trim() || undefined,
          role: form.role,
          notes: form.notes.trim() || undefined,
        },
      },
    });
  };

  const confirmDelete = async () => {
    if (!deleteCandidate) return;
    await deleteParticipant({ variables: { id: deleteCandidate.id } });
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-bold text-gray-900">Participantes</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Agregá y vinculá participantes desde cualquier pestaña administrativa.
          </p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-bold rounded-2xl transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Gestionar participante
        </button>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-[1300] flex items-center justify-center p-4 overflow-y-auto"
          style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
          onClick={(event) => event.target === event.currentTarget && setIsOpen(false)}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] min-h-0">
            <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900">Agregar participante</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Crear, vincular o eliminar participantes de esta gira.
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-all"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-5">
              <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl w-fit">
                {[
                  { id: "add", label: "Agregar" },
                  { id: "remove", label: "Eliminar" },
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setTab(option.id)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      tab === option.id
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {tab === "add" && (
                <>
                  <section className="space-y-2">
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 px-3 py-3 space-y-3">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div>
                          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                            Vincular usuario
                          </p>
                          <p className="text-xs text-gray-400">
                            Opcional. Si no lo vinculás, igual se crea el participante manualmente.
                          </p>
                          <p className="text-xs text-gray-400">
                            {filteredUsers.length} usuario{filteredUsers.length !== 1 ? "s" : ""}{" "}
                            visible{filteredUsers.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                        {form.linkedUserId && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                            Vinculado
                          </span>
                        )}
                      </div>

                      <input
                        type="text"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Buscar usuario…"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white"
                      />

                      <div className="max-h-64 overflow-y-auto min-h-0 space-y-2 pr-1">
                        {usersLoading ? (
                          <div className="space-y-2 animate-pulse">
                            {[1, 2, 3, 4].map((row) => (
                              <div key={row} className="h-14 bg-gray-100 rounded-2xl" />
                            ))}
                          </div>
                        ) : filteredUsers.length === 0 ? (
                          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-5 text-center text-sm text-gray-400">
                            No hay usuarios que coincidan.
                          </div>
                        ) : (
                          filteredUsers.map((user) => {
                            const fullName = [user.name, user.firstSurName, user.secondSurName]
                              .filter(Boolean)
                              .join(" ");
                            const isSelected = form.linkedUserId === user.id;
                            return (
                              <button
                                key={user.id}
                                type="button"
                                onClick={() => selectUser(user)}
                                className={`w-full rounded-2xl border px-4 py-3 text-left transition-all ${
                                  isSelected
                                    ? "border-emerald-300 bg-emerald-50"
                                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                                }`}
                              >
                                <p className="truncate text-sm font-bold text-gray-900">
                                  {fullName}
                                </p>
                                <p className="truncate text-xs text-gray-500">
                                  {user.email || "Sin correo"}{" "}
                                  {user.carnet ? `· ${user.carnet}` : ""}
                                </p>
                                <p className="truncate text-xs text-gray-400 mt-0.5">
                                  {user.instrument || "Sin instrumento"}{" "}
                                  {user.grade ? `· ${user.grade}` : ""}
                                </p>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </section>

                  <section className="space-y-3">
                    <div>
                      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                        Datos del participante
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Podés corregir la información antes de guardar.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <QuickField label="Nombre" error={errors.firstName}>
                        <input
                          value={form.firstName}
                          onChange={(e) => setField("firstName", e.target.value)}
                          className={quickInputClass(errors.firstName)}
                        />
                      </QuickField>
                      <QuickField label="Primer apellido" error={errors.firstSurname}>
                        <input
                          value={form.firstSurname}
                          onChange={(e) => setField("firstSurname", e.target.value)}
                          className={quickInputClass(errors.firstSurname)}
                        />
                      </QuickField>
                      <QuickField label="Segundo apellido">
                        <input
                          value={form.secondSurname}
                          onChange={(e) => setField("secondSurname", e.target.value)}
                          className={quickInputClass()}
                        />
                      </QuickField>
                      <QuickField label="Identificación" error={errors.identification}>
                        <input
                          value={form.identification}
                          onChange={(e) => setField("identification", e.target.value)}
                          className={quickInputClass(errors.identification)}
                        />
                      </QuickField>
                      <QuickField label="Correo">
                        <input
                          value={form.email}
                          onChange={(e) => setField("email", e.target.value)}
                          className={quickInputClass()}
                        />
                      </QuickField>
                      <QuickField label="Teléfono">
                        <input
                          value={form.phone}
                          onChange={(e) => setField("phone", e.target.value)}
                          className={quickInputClass()}
                        />
                      </QuickField>
                      <QuickField label="Nacimiento">
                        <input
                          type="date"
                          value={form.birthDate}
                          onChange={(e) => setField("birthDate", e.target.value)}
                          className={quickInputClass()}
                        />
                      </QuickField>
                      <QuickField label="Instrumento">
                        <input
                          value={form.instrument}
                          onChange={(e) => setField("instrument", e.target.value)}
                          className={quickInputClass()}
                        />
                      </QuickField>
                      <QuickField label="Grado">
                        <input
                          value={form.grade}
                          onChange={(e) => setField("grade", e.target.value)}
                          className={quickInputClass()}
                        />
                      </QuickField>
                      <QuickField label="Rol">
                        <select
                          value={form.role}
                          onChange={(e) => setField("role", e.target.value)}
                          className={quickInputClass()}
                        >
                          <option value="MUSICIAN">Músico</option>
                          <option value="STAFF">Staff</option>
                          <option value="DIRECTOR">Director</option>
                          <option value="GUEST">Invitado</option>
                        </select>
                      </QuickField>
                    </div>

                    <QuickField label="Notas">
                      <textarea
                        rows={3}
                        value={form.notes}
                        onChange={(e) => setField("notes", e.target.value)}
                        className={quickInputClass()}
                      />
                    </QuickField>
                  </section>
                </>
              )}

              {tab === "remove" && (
                <section className="space-y-3">
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 px-3 py-3 space-y-3">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                          Participantes actuales
                        </p>
                        <p className="text-xs text-gray-400">
                          {filteredParticipants.length} participante
                          {filteredParticipants.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    <input
                      type="text"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Buscar participante…"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white"
                    />

                    <div className="max-h-[420px] overflow-y-auto min-h-0 space-y-2 pr-1">
                      {participantsLoading ? (
                        <div className="space-y-2 animate-pulse">
                          {[1, 2, 3, 4].map((row) => (
                            <div key={row} className="h-16 bg-gray-100 rounded-2xl" />
                          ))}
                        </div>
                      ) : filteredParticipants.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-5 text-center text-sm text-gray-400">
                          No hay participantes que coincidan.
                        </div>
                      ) : (
                        filteredParticipants.map((participant) => {
                          const fullName = [
                            participant.firstName,
                            participant.firstSurname,
                            participant.secondSurname,
                          ]
                            .filter(Boolean)
                            .join(" ");
                          const linkedUserName = participant.linkedUser
                            ? [
                                participant.linkedUser.name,
                                participant.linkedUser.firstSurName,
                                participant.linkedUser.secondSurName,
                              ]
                                .filter(Boolean)
                                .join(" ")
                            : null;
                          return (
                            <div
                              key={participant.id}
                              className="rounded-2xl border border-gray-200 bg-white px-4 py-3 flex items-center gap-3"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold text-gray-900">
                                  {fullName}
                                </p>
                                <p className="truncate text-xs text-gray-500">
                                  {participant.identification || "Sin identificación"}{" "}
                                  {participant.instrument ? `· ${participant.instrument}` : ""}
                                </p>
                                <p className="truncate text-xs text-gray-400 mt-0.5">
                                  {linkedUserName || "Sin usuario vinculado"}
                                </p>
                              </div>
                              <button
                                onClick={() =>
                                  setDeleteCandidate({
                                    id: participant.id,
                                    fullName,
                                    identification: participant.identification,
                                    linkedUserName,
                                  })
                                }
                                className="px-3 py-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 text-xs font-bold transition-all flex-shrink-0"
                              >
                                Eliminar
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </section>
              )}
            </div>

            <div className="px-6 pb-6 flex-shrink-0 border-t border-gray-100 pt-4 space-y-2">
              {tab === "add" && (
                <button
                  onClick={submit}
                  disabled={creating}
                  className="w-full py-2.5 rounded-2xl bg-gray-900 hover:bg-gray-700 text-white font-bold text-sm disabled:opacity-50 transition-all"
                >
                  {creating ? "Guardando…" : "Agregar participante"}
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-2.5 rounded-2xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteCandidate && (
        <div
          className="fixed inset-0 z-[1310] flex items-center justify-center p-4"
          style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
          onClick={(event) => event.target === event.currentTarget && setDeleteCandidate(null)}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Eliminar participante</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Se eliminará también de vuelos, itinerarios, rutas y habitaciones.
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-2xl p-4 space-y-1">
                <p className="text-sm font-bold text-gray-900">{deleteCandidate.fullName}</p>
                <p className="text-xs text-gray-500">
                  {deleteCandidate.identification || "Sin identificación"}
                </p>
                <p className="text-xs text-gray-400">
                  {deleteCandidate.linkedUserName || "Sin usuario vinculado"}
                </p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 space-y-1">
                <p className="font-bold">Si tiene pagos:</p>
                <p>• Se retirará de la gira</p>
                <p>• Se conservará el historial financiero</p>
                <p>• Quedará marcado para auditoría</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteCandidate(null)}
                  className="flex-1 py-2.5 rounded-2xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm disabled:opacity-50 transition-all"
                >
                  {deleting ? "Eliminando…" : "Eliminar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}

function QuickField({ label, error, className = "", children }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function quickInputClass(hasError = false) {
  return `w-full rounded-2xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 ${
    hasError ? "border-red-400 bg-red-50" : "border-gray-200"
  }`;
}

function isAdminRole(role) {
  return ADMIN_ROLES.has(role);
}

function isTourFinanceRole(role) {
  return TOUR_FINANCE_ROLES.has(role);
}

// Todos los tabs disponibles en vista admin
const ADMIN_TABS = [
  { id: "documents", label: "Documentos", emoji: "📄" },
  { id: "payments", label: "Pagos", emoji: "💰" },
  { id: "flights", label: "Vuelos", emoji: "✈️" },
  { id: "rooms", label: "Habitaciones", emoji: "🏨" },
  { id: "imports", label: "Importación", emoji: "📋" },
];

const FINANCIAL_TABS = [
  { id: "documents", label: "Documentos", emoji: "📄" },
  { id: "payments", label: "Control financiero", emoji: "💰" },
];

// Tabs disponibles en self-service (solo documentos y pagos por ahora)
const SELF_SERVICE_TABS = [
  { id: "documents", label: "Mis documentos", emoji: "📄", moduleKey: "documents" },
  { id: "payments", label: "Mis pagos", emoji: "💰", moduleKey: "payments" },
];

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function TourInfoCard({ tour }) {
  const duration = getTourDuration(tour.startDate, tour.endDate);
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="text-lg font-bold text-gray-900">{tour.name}</h2>
            <TourStatusBadge status={tour.status} />
          </div>
          <div className="flex items-center gap-1.5">
            <svg
              className="w-3.5 h-3.5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
            </svg>
            <span className="text-sm text-gray-600">
              {tour.destination}, {tour.country}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <p className="text-xs text-gray-400 font-medium">Período</p>
            <p className="text-sm font-semibold text-gray-700">
              {formatTourDateRange(tour.startDate, tour.endDate)}
            </p>
          </div>
          {duration && (
            <div className="px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-xs text-gray-400">Duración</p>
              <p className="text-sm font-bold text-gray-900">{duration}</p>
            </div>
          )}
        </div>
      </div>
      {tour.description && (
        <p className="text-sm text-gray-500 mt-3 pt-3 border-t border-gray-100">
          {tour.description}
        </p>
      )}
    </div>
  );
}

// Vista admin: renderiza el sub-módulo completo por tab
function AdminTabContent({ activeTab, tour, onTourRefetch }) {
  switch (activeTab) {
    case "imports":
      return (
        <div className="space-y-5">
          {/* Config self-service — siempre visible en tab Imports para el admin */}
          <TourSelfServiceConfig tour={tour} onSaved={onTourRefetch} />
          <TourImportsPage tourId={tour.id} tourName={tour.name} />
        </div>
      );
    case "flights":
      return <TourFlightsPage tourId={tour.id} tourName={tour.name} />;
    case "rooms":
      return <TourRoomsPage tourId={tour.id} tourName={tour.name} />;
    case "payments":
      return <TourPaymentsPage tourId={tour.id} tourName={tour.name} />;
    case "documents":
      return <TourDocumentsPage tourId={tour.id} tourName={tour.name} tour={tour} />;
    default:
      return null;
  }
}

// ─── Vista self-service ───────────────────────────────────────────────────────

function SelfServiceView({ tour }) {
  const { selfServiceAccess } = tour;

  const { participant, paymentAccount, loading, isLinked, isNotLinkedError, participantError } =
    useTourSelfService({ tourId: tour.id, selfServiceAccess });

  console.log("particpant", participant);
  console.log("payment account;", paymentAccount);

  // Calcular tabs visibles para este usuario
  const visibleTabs = SELF_SERVICE_TABS.filter(
    (t) => selfServiceAccess?.enabled && selfServiceAccess?.[t.moduleKey] !== false
  );

  const [activeTab, setActiveTab] = useState(visibleTabs[0]?.id ?? "documents");

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-10 bg-gray-100 rounded-2xl" />
        <div className="h-40 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  // Auto-service no habilitado
  if (!selfServiceAccess?.enabled) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
        <p className="text-2xl mb-2">🔒</p>
        <p className="text-sm font-bold text-amber-800">Acceso self-service no disponible</p>
        <p className="text-xs text-amber-700 mt-1">
          El administrador aún no ha habilitado el acceso para participantes en esta gira.
        </p>
      </div>
    );
  }

  // Usuario no vinculado
  if (!isLinked || isNotLinkedError) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8 text-center">
        <p className="text-2xl mb-2">👤</p>
        <p className="text-sm font-bold text-blue-800">Perfil no vinculado</p>
        <p className="text-xs text-blue-700 mt-1">
          {participantError?.message ||
            "Tu perfil aún no ha sido vinculado como participante de esta gira. " +
              "Contacta al administrador."}
        </p>
      </div>
    );
  }

  if (visibleTabs.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
        <p className="text-2xl mb-2">📭</p>
        <p className="text-sm font-bold text-gray-700">Sin módulos disponibles</p>
        <p className="text-xs text-gray-500 mt-1">
          No hay módulos habilitados para tu acceso en esta gira.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Info del participante */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
          {participant.firstName?.[0]}
          {participant.firstSurname?.[0]}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">
            {participant.firstName} {participant.firstSurname} {participant.secondSurname}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {participant.role} · {participant.status}
          </p>
        </div>
      </div>

      {/* Tabs self-service */}
      {visibleTabs.length > 1 && (
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-2xl overflow-x-auto">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                activeTab === tab.id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <span>{tab.emoji}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Contenido del tab activo */}
      {activeTab === "documents" && <TourSelfServiceDocuments participant={participant} />}
      {activeTab === "payments" && <TourSelfServicePayments paymentAccount={paymentAccount} />}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function TourDetailPage() {
  const navigate = useNavigate();
  const { tour, loading, error, refetch } = useTour();
  const [activeTab, setActiveTab] = useState("documents");

  // Use query result directly — UserContext.userData relies on useState with deps (bug)
  // so it may never be set. Apollo cache makes this query free after the first load.
  // actorData?.getUser:
  //   undefined → still loading
  //   null      → Parent entity (getUser returns null for parents)
  //   {...}     → User entity with role
  const { data: actorData, loading: actorLoading } = useQuery(CHECK_ACTOR);
  const currentUser = actorData?.getUser; // undefined | null | { id, role }

  const isAdmin = !actorLoading && isAdminRole(currentUser?.role);
  const isTourFinance = !actorLoading && isTourFinanceRole(currentUser?.role);
  const isParent = !actorLoading && currentUser === null;

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <div className="p-4 mt-1 space-y-4 animate-pulse">
          <div className="h-8 w-48 bg-gray-100 rounded-xl" />
          <div className="h-28 bg-gray-100 rounded-2xl" />
          <div className="h-12 bg-gray-100 rounded-2xl" />
          <div className="h-64 bg-gray-100 rounded-2xl" />
        </div>
        <Footer />
      </DashboardLayout>
    );
  }

  if (error || !tour) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <div className="p-4 mt-1">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-10 text-center">
            <p className="text-3xl mb-3">⚠️</p>
            <p className="text-base font-bold text-red-700">Gira no encontrada</p>
            <p className="text-sm text-red-500 mt-1">
              {error?.message || "El ID no corresponde a ninguna gira."}
            </p>
            <button
              onClick={() => navigate("/tours")}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2 bg-red-700 hover:bg-red-800 text-white text-sm font-bold rounded-2xl transition-all"
            >
              ← Volver a giras
            </button>
          </div>
        </div>
        <Footer />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <div className="space-y-5 pb-16">
        {/* Breadcrumb */}
        <div className="px-4 mt-1 flex items-center gap-2">
          <button
            onClick={() => navigate("/tours")}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Giras
          </button>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-semibold text-gray-900 truncate">{tour.name}</span>
        </div>

        {/* Info card */}
        <div className="px-4">
          <TourInfoCard tour={tour} />
        </div>

        {/* Vista padre: hijos vinculados a la gira */}
        {isParent ? (
          <div className="px-4">
            <TourParentView tour={tour} />
          </div>
        ) : isAdmin ? (
          <>
            <div className="px-4">
              <AdminQuickActions tourId={tour.id} onCreated={refetch} />
            </div>
            <div className="px-4">
              <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-2xl overflow-x-auto">
                {ADMIN_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                      activeTab === tab.id
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <span>{tab.emoji}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="px-4">
              <AdminTabContent activeTab={activeTab} tour={tour} onTourRefetch={refetch} />
            </div>
          </>
        ) : isTourFinance ? (
          <>
            <div className="px-4">
              <AdminQuickActions tourId={tour.id} onCreated={refetch} />
            </div>
            <div className="px-4">
              <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-2xl overflow-x-auto">
                {FINANCIAL_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                      activeTab === tab.id
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <span>{tab.emoji}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="px-4">
              <AdminTabContent activeTab={activeTab} tour={tour} onTourRefetch={refetch} />
            </div>
          </>
        ) : (
          /* Vista self-service: solo lo que está habilitado */
          <div className="px-4">
            <SelfServiceView tour={tour} />
          </div>
        )}
      </div>
      <Footer />
    </DashboardLayout>
  );
}
