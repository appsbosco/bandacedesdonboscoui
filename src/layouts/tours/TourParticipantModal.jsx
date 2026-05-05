/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from "react";

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

function toDateTimeValue(dateString) {
  if (!dateString) return undefined;
  return `${dateString}T12:00:00.000Z`;
}

export default function TourParticipantModal({
  isOpen,
  users = [],
  usersLoading = false,
  participants = [],
  participantsLoading = false,
  showRemoveTab = true,
  onClose,
  onSubmit,
  onRequestDelete,
  creating = false,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("add");

  useEffect(() => {
    if (!isOpen) return;
    setForm(EMPTY_FORM);
    setErrors({});
    setSearch("");
    setTab("add");
  }, [isOpen]);

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

  if (!isOpen) return null;

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

    onSubmit({
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
    });
  };

  return (
    <div
      className="fixed inset-0 z-[1300] flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(event) => event.target === event.currentTarget && onClose()}
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
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-all"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-5">
          {showRemoveTab && (
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
          )}

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
                            <p className="truncate text-sm font-bold text-gray-900">{fullName}</p>
                            <p className="truncate text-xs text-gray-500">
                              {user.email || "Sin correo"} {user.carnet ? `· ${user.carnet}` : ""}
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
                  <Field label="Nombre" error={errors.firstName}>
                    <input
                      value={form.firstName}
                      onChange={(event) => setField("firstName", event.target.value)}
                      className={inputClass(errors.firstName)}
                    />
                  </Field>
                  <Field label="Primer apellido" error={errors.firstSurname}>
                    <input
                      value={form.firstSurname}
                      onChange={(event) => setField("firstSurname", event.target.value)}
                      className={inputClass(errors.firstSurname)}
                    />
                  </Field>
                  <Field label="Segundo apellido">
                    <input
                      value={form.secondSurname}
                      onChange={(event) => setField("secondSurname", event.target.value)}
                      className={inputClass()}
                    />
                  </Field>
                  <Field label="Identificación" error={errors.identification}>
                    <input
                      value={form.identification}
                      onChange={(event) => setField("identification", event.target.value)}
                      className={inputClass(errors.identification)}
                    />
                  </Field>
                  <Field label="Correo">
                    <input
                      value={form.email}
                      onChange={(event) => setField("email", event.target.value)}
                      className={inputClass()}
                    />
                  </Field>
                  <Field label="Teléfono">
                    <input
                      value={form.phone}
                      onChange={(event) => setField("phone", event.target.value)}
                      className={inputClass()}
                    />
                  </Field>
                  <Field label="Nacimiento">
                    <input
                      type="date"
                      value={form.birthDate}
                      onChange={(event) => setField("birthDate", event.target.value)}
                      className={inputClass()}
                    />
                  </Field>
                  <Field label="Instrumento">
                    <input
                      value={form.instrument}
                      onChange={(event) => setField("instrument", event.target.value)}
                      className={inputClass()}
                    />
                  </Field>
                  <Field label="Grado">
                    <input
                      value={form.grade}
                      onChange={(event) => setField("grade", event.target.value)}
                      className={inputClass()}
                    />
                  </Field>
                  <Field label="Rol">
                    <select
                      value={form.role}
                      onChange={(event) => setField("role", event.target.value)}
                      className={inputClass()}
                    >
                      <option value="MUSICIAN">Músico</option>
                      <option value="STAFF">Staff</option>
                      <option value="DIRECTOR">Director</option>
                      <option value="GUEST">Invitado</option>
                    </select>
                  </Field>
                </div>

                <Field label="Notas">
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={(event) => setField("notes", event.target.value)}
                    className={inputClass()}
                  />
                </Field>
              </section>
            </>
          )}

          {showRemoveTab && tab === "remove" && (
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
                            <p className="truncate text-sm font-bold text-gray-900">{fullName}</p>
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
                              onRequestDelete?.({
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
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, error, className = "", children }) {
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

function inputClass(hasError = false) {
  return `w-full rounded-2xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 ${
    hasError ? "border-red-400 bg-red-50" : "border-gray-200"
  }`;
}
