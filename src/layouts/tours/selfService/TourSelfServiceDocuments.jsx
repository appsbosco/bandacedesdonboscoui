/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getExpiryStatus } from "../utils/tourAgeRules";
import { computeVerificationCriteria } from "./verificationCriteria";

const labels = { firstName: "Nombre", firstSurname: "Primer apellido", identification: "Identificación", email: "Correo electrónico", passport: "Pasaporte vigente", visa: "Visa vigente" };
const statusLabel = { ok: "Vigente", warning: "Por vencer", expired: "Vencido", missing: "Sin fecha" };
const statusClass = { ok: "text-emerald-700 bg-emerald-50", warning: "text-amber-700 bg-amber-50", expired: "text-red-700 bg-red-50", missing: "text-gray-500 bg-gray-50" };
const dateValue = (value) => value && !Number.isNaN(new Date(value).getTime()) ? new Date(value).toISOString().split("T")[0] : "";
const displayDate = (value) => value ? new Date(value).toLocaleDateString("es-CR", { timeZone: "UTC" }) : "—";
const dateTimeValue = (value) => value ? `${value}T00:00:00.000Z` : null;

function Field({ label, value, onChange, type = "text" }) {
  return <label className="flex flex-col gap-1"><span className="text-xs font-medium text-gray-500 uppercase">{label}</span><input type={type} value={value || ""} onChange={(event) => onChange(event.target.value)} className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400" /></label>;
}
function DocumentField({ label, value, status }) {
  return <div><p className="text-xs font-medium text-gray-500 uppercase">{label}</p><div className="flex gap-2 items-center"><span className="text-sm font-semibold">{value || "—"}</span>{status && <span className={`text-xs rounded-full px-2 py-0.5 ${statusClass[status]}`}>{statusLabel[status]}</span>}</div></div>;
}

export default function TourSelfServiceDocuments({ participant, documentSummary, documentSummaryLoading, onSaveInfo, saveLoading, onConfirm, confirmLoading, confirmError, isParentView = false, documentsPath = "/documents" }) {
  const [form, setForm] = useState({});
  const [saved, setSaved] = useState(false);
  useEffect(() => setForm({ firstName: participant?.firstName || "", firstSurname: participant?.firstSurname || "", secondSurname: participant?.secondSurname || "", identification: participant?.identification || "", email: participant?.email || "", phone: participant?.phone || "", birthDate: dateValue(participant?.birthDate) }), [participant]);
  if (!participant) return null;
  const passportStatus = getExpiryStatus(participant.passportExpiry);
  const visaStatus = participant.hasVisa ? getExpiryStatus(participant.visaExpiry) : "missing";
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
  return <div className="space-y-5">
    <div className={`text-xs border rounded-xl px-4 py-3 ${participant.selfServiceVerified ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-amber-700 bg-amber-50 border-amber-200"}`}>{participant.selfServiceVerified ? "✓ Información verificada. Los cambios de identidad requerirán confirmar nuevamente." : "Confirma que la información está completa y vigente para desbloquear itinerario y vuelos."}</div>
    <section className="bg-white rounded-2xl border border-gray-200 p-5"><h3 className="text-sm font-bold mb-4">Datos personales</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="Nombre" value={form.firstName} onChange={update("firstName")} /><Field label="Primer apellido" value={form.firstSurname} onChange={update("firstSurname")} /><Field label="Segundo apellido" value={form.secondSurname} onChange={update("secondSurname")} /><Field label="Identificación" value={form.identification} onChange={update("identification")} /><Field label="Correo electrónico" type="email" value={form.email} onChange={update("email")} /><Field label="Teléfono" value={form.phone} onChange={update("phone")} /><Field label="Fecha de nacimiento" type="date" value={form.birthDate} onChange={update("birthDate")} />
    </div><div className="flex items-center gap-3 mt-4"><button type="button" onClick={save} disabled={saveLoading} className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl disabled:opacity-50">{saveLoading ? "Guardando…" : "Guardar datos personales"}</button>{saved && <span className="text-xs text-emerald-600">✓ Guardado</span>}</div></section>
    <section className="bg-white rounded-2xl border border-gray-200 p-5"><div className="flex justify-between mb-4"><h3 className="text-sm font-bold">Pasaporte</h3>{!isParentView && <Link to={documentsPath} className="text-xs font-semibold text-blue-600">Actualizar en Mis Documentos →</Link>}</div><div className="grid sm:grid-cols-2 gap-4"><DocumentField label="Número" value={participant.passportNumber} /><DocumentField label="Vencimiento" value={displayDate(participant.passportExpiry)} status={participant.passportNumber ? passportStatus : "missing"} />{!documentSummaryLoading && documentSummary?.passport?.givenNames && <DocumentField label="Nombre en pasaporte" value={`${documentSummary.passport.givenNames} ${documentSummary.passport.surname || ""}`} />}</div>{passportStatus !== "ok" && <p className="mt-3 text-xs text-amber-700">{isParentView ? "Contacta al administrador para actualizar el pasaporte de tu hijo." : "Actualiza el pasaporte en Mis Documentos."}</p>}</section>
    <section className="bg-white rounded-2xl border border-gray-200 p-5"><div className="flex justify-between mb-4"><h3 className="text-sm font-bold">Visa y permiso</h3>{!isParentView && <Link to={documentsPath} className="text-xs font-semibold text-blue-600">Actualizar en Mis Documentos →</Link>}</div><div className="grid sm:grid-cols-2 gap-4"><DocumentField label="Visa" value={participant.hasVisa ? "Sí" : "No — pendiente"} /><DocumentField label="Vencimiento" value={displayDate(participant.visaExpiry)} status={visaStatus} /><DocumentField label="Tipo" value={documentSummary?.visa?.visaType} /><DocumentField label="Permiso de salida" value={participant.hasExitPermit ? "Sí" : "No"} /></div>{(!participant.hasVisa || visaStatus !== "ok") && <p className="mt-3 text-xs text-amber-700">{isParentView ? "Contacta al administrador para actualizar la visa de tu hijo." : "Actualiza la visa en Mis Documentos."}</p>}</section>
    <section className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3"><h3 className="text-sm font-bold">Checklist de verificación</h3>{Object.entries(criteria).map(([key, ok]) => <div key={key} className="flex justify-between bg-gray-50 rounded-lg px-3 py-2 text-xs"><span>{labels[key]}</span><span className={ok ? "text-emerald-600" : "text-red-500"}>{ok ? "✓" : "✗"}</span></div>)}{confirmError && <p className="text-xs text-red-600">{confirmError.message}</p>}<button type="button" onClick={onConfirm} disabled={!passed || confirmLoading} className="w-full px-4 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl disabled:opacity-40">{confirmLoading ? "Confirmando…" : "Confirmar mi información"}</button></section>
  </div>;
}
