/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getExpiryStatus } from "../utils/tourAgeRules";
import { computeVerificationCriteria } from "./verificationCriteria";

const labels = {
  firstName: "Nombre",
  firstSurname: "Primer apellido",
  identification: "Identificación",
  email: "Correo electrónico",
  passport: "Pasaporte vigente",
  visa: "Visa vigente",
};
const statusLabel = {
  ok: "Vigente",
  warning: "Por vencer",
  expired: "Vencido",
  missing: "Sin fecha",
};
const statusClass = {
  ok: "text-emerald-700 bg-emerald-50",
  warning: "text-amber-700 bg-amber-50",
  expired: "text-red-700 bg-red-50",
  missing: "text-gray-500 bg-gray-50",
};
const dateValue = (value) =>
  value && !Number.isNaN(new Date(value).getTime())
    ? new Date(value).toISOString().split("T")[0]
    : "";
const displayDate = (value) =>
  value ? new Date(value).toLocaleDateString("es-CR", { timeZone: "UTC" }) : "—";
const dateTimeValue = (value) => (value ? `${value}T00:00:00.000Z` : null);
const displaySex = (value) => ({ M: "Masculino", F: "Femenino", X: "Otro" }[value] || value || "—");

function Field({ label, value, onChange, type = "text" }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-500 uppercase">{label}</span>
      <input
        type={type}
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
      />
    </label>
  );
}
function DocumentField({ label, value, status }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase">{label}</p>
      <div className="flex gap-2 items-center">
        <span className="text-sm font-semibold">{value || "—"}</span>
        {status && (
          <span className={`text-xs rounded-full px-2 py-0.5 ${statusClass[status]}`}>
            {statusLabel[status]}
          </span>
        )}
      </div>
    </div>
  );
}

function ResponsibilityDialog({ isParentView, loading, onCancel, onConfirm }) {
  const [accepted, setAccepted] = useState(false);
  const dialogRef = useRef(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);
  return (
    <dialog
      ref={dialogRef}
      onCancel={onCancel}
      className="m-auto max-w-lg border-0 bg-transparent p-0 backdrop:bg-slate-950/55"
      style={{ width: "calc(100% - 2rem)" }}
      aria-labelledby="verification-warning-title"
    >
      <div className="w-full rounded-2xl bg-white shadow-2xl">
        <div className="border-b border-slate-100 px-6 py-5">
          <div
            className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-xl"
            aria-hidden="true"
          >
            ⚠️
          </div>
          <h2 id="verification-warning-title" className="text-lg font-bold text-slate-900">
            Confirma únicamente después de revisar cada dato
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            La información del pasaporte y la visa será utilizada para reservas, emisión de boletos
            y trámites migratorios. Un nombre, número o fecha incorrectos pueden causar costos
            adicionales, rechazo de abordaje o impedimentos de viaje.
          </p>
        </div>
        <div className="space-y-4 px-6 py-5">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(event) => setAccepted(event.target.checked)}
              className="mt-0.5 h-4 w-4 accent-amber-700"
            />
            <span className="text-sm font-semibold leading-5 text-amber-950">
              {isParentView
                ? "Declaro que revisé cuidadosamente los datos de mi hijo y asumo la responsabilidad por su exactitud."
                : "Declaro que revisé cuidadosamente mis datos y asumo la responsabilidad por su exactitud."}
            </span>
          </label>
          <p className="text-xs leading-5 text-slate-500">
            Si algo no coincide con los documentos físicos, cancela y corrígelo antes de continuar.
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="min-h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Volver a revisar
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={!accepted || loading}
              className="min-h-10 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? "Confirmando…" : "Confirmar y asumir responsabilidad"}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}

export default function TourSelfServiceDocuments({
  participant,
  documentSummary,
  documentSummaryLoading,
  onSaveInfo,
  saveLoading,
  onConfirm,
  confirmLoading,
  confirmError,
  isParentView = false,
  documentsPath = "/documents",
}) {
  const [form, setForm] = useState({});
  const [saved, setSaved] = useState(false);
  const [showResponsibility, setShowResponsibility] = useState(false);
  useEffect(
    () =>
      setForm({
        firstName: participant?.firstName || "",
        firstSurname: participant?.firstSurname || "",
        secondSurname: participant?.secondSurname || "",
        identification: participant?.identification || "",
        email: participant?.email || "",
        phone: participant?.phone || "",
        birthDate: dateValue(participant?.birthDate),
      }),
    [participant]
  );
  if (!participant) return null;
  const passportStatus = getExpiryStatus(participant.passportExpiry);
  const visaStatus = participant.hasVisa ? getExpiryStatus(participant.visaExpiry) : "missing";
  const passport = documentSummary?.passport;
  const visa = documentSummary?.visa;
  const { criteria, passed } = computeVerificationCriteria(participant);
  const update = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));
  const save = async () => {
    await onSaveInfo({
      ...form,
      secondSurname: form.secondSurname || null,
      email: form.email || null,
      phone: form.phone || null,
      birthDate: dateTimeValue(form.birthDate),
    });
    setSaved(true);
  };
  return (
    <div className="space-y-5">
      <div
        className={`text-xs border rounded-xl px-4 py-3 ${
          participant.selfServiceVerified
            ? "text-emerald-700 bg-emerald-50 border-emerald-200"
            : "text-amber-700 bg-amber-50 border-amber-200"
        }`}
      >
        {participant.selfServiceVerified
          ? "✓ Información verificada. Los cambios de identidad requerirán confirmar nuevamente."
          : "Confirma que la información está completa y vigente para desbloquear itinerario y vuelos."}
      </div>
      <section className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="text-sm font-bold mb-4">Datos personales</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nombre" value={form.firstName} onChange={update("firstName")} />
          <Field
            label="Primer apellido"
            value={form.firstSurname}
            onChange={update("firstSurname")}
          />
          <Field
            label="Segundo apellido"
            value={form.secondSurname}
            onChange={update("secondSurname")}
          />
          <Field
            label="Identificación"
            value={form.identification}
            onChange={update("identification")}
          />
          <Field
            label="Correo electrónico"
            type="email"
            value={form.email}
            onChange={update("email")}
          />
          <Field label="Teléfono" value={form.phone} onChange={update("phone")} />
          <Field
            label="Fecha de nacimiento"
            type="date"
            value={form.birthDate}
            onChange={update("birthDate")}
          />
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button
            type="button"
            onClick={save}
            disabled={saveLoading}
            className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl disabled:opacity-50"
          >
            {saveLoading ? "Guardando…" : "Guardar datos personales"}
          </button>
          {saved && <span className="text-xs text-emerald-600">✓ Guardado</span>}
        </div>
      </section>
      <section className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex justify-between mb-1">
          <h3 className="text-sm font-bold">Pasaporte</h3>
          {!isParentView && (
            <Link to={documentsPath} className="text-xs font-semibold text-blue-600">
              Corregir en Mis Documentos →
            </Link>
          )}
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Revisa que estos datos coincidan exactamente con el pasaporte físico.
        </p>
        {documentSummaryLoading ? (
          <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <DocumentField
              label="Nombre completo"
              value={
                passport?.fullName ||
                [passport?.givenNames, passport?.surname].filter(Boolean).join(" ")
              }
            />
            <DocumentField label="Nombres" value={passport?.givenNames} />
            <DocumentField label="Apellidos" value={passport?.surname} />
            <DocumentField
              label="Número de pasaporte"
              value={
                passport?.passportNumber || passport?.documentNumber || participant.passportNumber
              }
            />
            <DocumentField label="Fecha de nacimiento" value={displayDate(passport?.dateOfBirth)} />
            <DocumentField label="Sexo" value={displaySex(passport?.sex)} />
            <DocumentField label="Nacionalidad" value={passport?.nationality} />
            <DocumentField label="País emisor" value={passport?.issuingCountry} />
            <DocumentField label="Fecha de emisión" value={displayDate(passport?.issueDate)} />
            <DocumentField
              label="Vencimiento"
              value={displayDate(passport?.expirationDate || participant.passportExpiry)}
              status={participant.passportNumber ? passportStatus : "missing"}
            />
          </div>
        )}
        {passportStatus !== "ok" && (
          <p className="mt-3 text-xs text-amber-700">
            {isParentView
              ? "Contacta al administrador para actualizar el pasaporte de tu hijo."
              : "El pasaporte está incompleto o no vigente. Corrígelo en Mis Documentos."}
          </p>
        )}
      </section>
      <section className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex justify-between mb-1">
          <h3 className="text-sm font-bold">Visa</h3>
          {!isParentView && (
            <Link to={documentsPath} className="text-xs font-semibold text-blue-600">
              Corregir en Mis Documentos →
            </Link>
          )}
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Revisa todos los datos impresos en la visa antes de confirmar.
        </p>
        {documentSummaryLoading ? (
          <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <DocumentField
              label="Estado"
              value={participant.hasVisa ? "Registrada" : "No — pendiente"}
            />
            <DocumentField label="Tipo de visa" value={visa?.visaType} />
            <DocumentField label="Número de control" value={visa?.visaControlNumber} />
            <DocumentField label="País emisor" value={visa?.issuingCountry} />
            <DocumentField label="Fecha de emisión" value={displayDate(visa?.issueDate)} />
            <DocumentField
              label="Vencimiento"
              value={displayDate(visa?.expirationDate || participant.visaExpiry)}
              status={visaStatus}
            />
          </div>
        )}
        {(!participant.hasVisa || visaStatus !== "ok") && (
          <p className="mt-3 text-xs text-amber-700">
            {isParentView
              ? "Contacta al administrador para actualizar la visa de tu hijo."
              : "La visa está incompleta o no vigente. Corrígela en Mis Documentos."}
          </p>
        )}
      </section>
      <section className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="text-sm font-bold mb-3">Permiso de salida</h3>
        <DocumentField
          label="Estado"
          value={participant.hasExitPermit ? "Registrado" : "No registrado"}
        />
      </section>
      <section className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
        <h3 className="text-sm font-bold">Checklist de verificación</h3>
        {Object.entries(criteria).map(([key, ok]) => (
          <div key={key} className="flex justify-between bg-gray-50 rounded-lg px-3 py-2 text-xs">
            <span>{labels[key]}</span>
            <span className={ok ? "text-emerald-600" : "text-red-500"}>{ok ? "✓" : "✗"}</span>
          </div>
        ))}
        {confirmError && <p className="text-xs text-red-600">{confirmError.message}</p>}
        <button
          type="button"
          onClick={() => setShowResponsibility(true)}
          disabled={!passed || confirmLoading || participant.selfServiceVerified}
          className="w-full px-4 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl disabled:opacity-40"
        >
          {participant.selfServiceVerified
            ? "Información ya verificada"
            : "Confirmar mi información"}
        </button>
      </section>
      {showResponsibility && (
        <ResponsibilityDialog
          isParentView={isParentView}
          loading={confirmLoading}
          onCancel={() => setShowResponsibility(false)}
          onConfirm={async () => {
            await onConfirm();
            setShowResponsibility(false);
          }}
        />
      )}
    </div>
  );
}
