/* eslint-disable react/prop-types */
/**
 * UserDetailsModal — premium right-side drawer.
 * Admins can edit the profile photo of any user directly from this drawer.
 */
import { useEffect, useMemo, useRef, useState } from "react";

import { useImageUpload, cloudinaryOptimized } from "hooks/useImageUpload";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fullName(user) {
  return [user?.name, user?.firstSurName, user?.secondSurName].filter(Boolean).join(" ");
}

function userInitials(user) {
  return [user?.name, user?.firstSurName]
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function AvatarArea({ user, canEdit, onZoom, onAvatarUpdated }) {
  const { state, previewUrl, progress, errorMsg, confirm, cancel, openPicker, inputProps } =
    useImageUpload(user?.id, {
      maxWidthPx: 900, // slightly larger for admin view (full-width banner)
      quality: 0.88,
      onSuccess: onAvatarUpdated,
    });

  // Reset when different user is opened
  useEffect(() => {
    cancel();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const isPending = state === "previewing";
  const isUploading = state === "uploading" || state === "compressing";
  const isSuccess = state === "success";

  // Show preview blob OR optimized Cloudinary URL
  const displaySrc =
    previewUrl ||
    (user?.avatar ? cloudinaryOptimized(user.avatar, { width: 800, height: 400 }) : null);

  return (
    <div className="relative group flex-shrink-0">
      {/* ── Image / Initials ── */}
      {displaySrc ? (
        <div className="relative">
          <img
            src={displaySrc}
            alt={fullName(user)}
            loading="lazy"
            onClick={!isPending && !isUploading ? onZoom : undefined}
            className={[
              "w-full h-48 object-cover object-top transition-all duration-300",
              isPending || isUploading ? "brightness-60" : "cursor-zoom-in",
            ].join(" ")}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

          {/* Zoom hint */}
          {!isPending && !isUploading && (
            <button
              onClick={onZoom}
              className="absolute bottom-2 right-3 text-white text-[10px] font-semibold opacity-70 hover:opacity-100 flex items-center gap-1 pointer-events-auto"
            >
              🔍 Ampliar
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-48 bg-gradient-to-br from-slate-100 to-slate-200">
          <div className="w-20 h-20 rounded-full bg-slate-300 text-slate-600 flex items-center justify-center text-3xl font-bold select-none">
            {userInitials(user)}
          </div>
        </div>
      )}

      {/* ── Admin pencil button (visible on hover when idle) ── */}
      {canEdit && state === "idle" && (
        <button
          onClick={openPicker}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center text-slate-700
            opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white active:scale-95"
          title="Cambiar foto"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>
      )}

      {/* ── Compressing / uploading overlay ── */}
      {isUploading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
          {/* Progress bar */}
          {state === "uploading" && (
            <div className="w-32 h-1 bg-white/20 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-white rounded-full transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          <svg className="w-7 h-7 text-white animate-spin mb-1.5" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <p className="text-white text-xs font-semibold">
            {state === "compressing" ? "Optimizando imagen…" : `Subiendo… ${progress}%`}
          </p>
        </div>
      )}

      {/* ── Success flash ── */}
      {isSuccess && (
        <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/60 backdrop-blur-sm pointer-events-none">
          <svg
            className="w-10 h-10 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      )}

      {/* ── Confirm / cancel bar ── */}
      {isPending && (
        <div className="absolute bottom-0 left-0 right-0 flex gap-2 px-3 py-2.5 bg-black/65 backdrop-blur-sm">
          <button
            onClick={cancel}
            className="flex-1 py-1.5 rounded-lg border border-white/25 text-white text-xs font-medium hover:bg-white/10 transition-colors active:scale-95"
          >
            Cancelar
          </button>
          <button
            onClick={confirm}
            className="flex-1 py-1.5 rounded-lg bg-white text-slate-900 text-xs font-semibold hover:bg-slate-100 transition-colors active:scale-95"
          >
            Guardar foto
          </button>
        </div>
      )}

      {/* ── Inline error ── */}
      {state === "error" && errorMsg && (
        <div className="absolute top-2 left-2 right-10 bg-red-500/90 text-white text-[10px] font-semibold px-2.5 py-1.5 rounded-lg flex items-center justify-between gap-2">
          <span>{errorMsg}</span>
          <button
            onClick={cancel}
            className="underline opacity-80 hover:opacity-100 whitespace-nowrap"
          >
            Reintentar
          </button>
        </div>
      )}

      <input {...inputProps} />
    </div>
  );
}

// ── Zoom overlay ──────────────────────────────────────────────────────────────

function ZoomOverlay({ src, onClose }) {
  useEffect(() => {
    const esc = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[1310] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <img
        src={src}
        alt="Avatar ampliado"
        className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white text-lg flex items-center justify-center transition-all"
      >
        ✕
      </button>
    </div>
  );
}

// ── Field / Section ───────────────────────────────────────────────────────────

function Field({ label, value, href }) {
  return (
    <div className="py-2.5 border-b border-gray-50 last:border-0">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      {href ? (
        <a href={href} className="text-sm text-blue-600 hover:underline mt-0.5 block">
          {value || "—"}
        </a>
      ) : (
        <p className="text-sm text-gray-800 mt-0.5">{value || "—"}</p>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-5">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{title}</p>
      <div className="bg-gray-50 rounded-2xl px-4 divide-y divide-gray-100">{children}</div>
    </div>
  );
}

// ── State pill ────────────────────────────────────────────────────────────────

const STATE_COLORS = {
  Activo: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Inactivo: "bg-gray-100 text-gray-500 border-gray-200",
  Exalumno: "bg-blue-50 text-blue-600 border-blue-100",
};

function StatePill({ state }) {
  const cls = STATE_COLORS[state] || "bg-gray-100 text-gray-500 border-gray-200";
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${cls}`}>
      {state || "—"}
    </span>
  );
}

// ── Confirm delete ────────────────────────────────────────────────────────────

function ConfirmDialog({ onConfirm, onCancel }) {
  return (
    <div
      className="fixed inset-0 z-[1305] flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.5)", backdropFilter: "blur(3px)" }}
    >
      <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm">
        <p className="text-base font-bold text-gray-900 mb-2">¿Eliminar usuario?</p>
        <p className="text-sm text-gray-500 mb-6">
          Esta acción es irreversible. El usuario y su ficha médica serán eliminados
          permanentemente.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-2xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-2xl bg-red-600 text-white text-sm font-bold hover:bg-red-700"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Profile tab ───────────────────────────────────────────────────────────────

function ProfileTab({ user }) {
  return (
    <div className="p-4 overflow-y-auto space-y-1" style={{ maxHeight: "calc(100vh - 340px)" }}>
      <Section title="Identidad">
        <Field label="Nombre completo" value={fullName(user)} />
        <Field label="Carnet" value={user.carnet} />
        <Field label="Fecha de nacimiento" value={user.birthday} />
        <Field label="Año académico" value={user.grade} />
      </Section>

      <Section title="Contacto">
        <Field
          label="Correo electrónico"
          value={user.email}
          href={user.email ? `mailto:${user.email}` : null}
        />
        <Field label="Teléfono" value={user.phone} href={user.phone ? `tel:${user.phone}` : null} />
      </Section>

      <Section title="Rol y estado">
        <div className="py-2.5 border-b border-gray-50">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Estado</p>
          <div className="mt-1.5">
            <StatePill state={user.state} />
          </div>
        </div>
        <Field label="Rol" value={user.role} />
      </Section>

      <Section title="Instrumento">
        <Field label="Instrumento / Sección" value={user.instrument} />
      </Section>

      {user.bands && user.bands.length > 0 && (
        <Section title="Agrupaciones">
          <div className="py-3 flex flex-wrap gap-1.5">
            {user.bands.map((b) => (
              <span
                key={b}
                className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold bg-gray-200 text-gray-700"
              >
                {b}
              </span>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

// ── Medical tab ───────────────────────────────────────────────────────────────

function MedicalTab({ medicalRecord }) {
  if (!medicalRecord) {
    return (
      <div className="p-8 flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-3">
          <svg
            className="w-6 h-6 text-slate-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <p className="text-sm font-bold text-gray-700">Sin ficha médica</p>
        <p className="text-xs text-gray-400 mt-1">
          Esta persona aún no ha completado su ficha médica.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 overflow-y-auto space-y-1" style={{ maxHeight: "calc(100vh - 340px)" }}>
      <Section title="Datos médicos">
        <Field label="Identificación" value={medicalRecord.identification} />
        <Field label="Sexo" value={medicalRecord.sex} />
        <Field label="Tipo de sangre" value={medicalRecord.bloodType} />
        <Field label="Dirección" value={medicalRecord.address} />
        <Field label="Enfermedades" value={medicalRecord.illness} />
        <Field label="Medicamentos" value={medicalRecord.medicine} />
        <Field label="Medicamentos en giras" value={medicalRecord.medicineOnTour} />
        <Field label="Alergias" value={medicalRecord.allergies} />
      </Section>

      <Section title="Encargado">
        <Field label="Nombre del encargado" value={medicalRecord.familyMemberName} />
        <Field label="Identificación del encargado" value={medicalRecord.familyMemberNumberId} />
        <Field label="Parentesco" value={medicalRecord.familyMemberRelationship} />
        <Field
          label="Teléfono del encargado"
          value={medicalRecord.familyMemberNumber}
          href={medicalRecord.familyMemberNumber ? `tel:${medicalRecord.familyMemberNumber}` : null}
        />
        <Field label="Ocupación" value={medicalRecord.familyMemberOccupation} />
      </Section>
    </div>
  );
}

// ── Main Drawer ───────────────────────────────────────────────────────────────

const UserDetailsModal = ({
  open,
  user,
  userRole,
  medicalRecord,
  canDeleteUser,
  onClose,
  onConfirmDelete,
}) => {
  const [tab, setTab] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Local avatar override — updated after a successful upload so the drawer
  // reflects the new photo immediately without waiting for a cache refetch.
  const [localAvatar, setLocalAvatar] = useState(null);

  useEffect(() => {
    if (!open) {
      setTab(0);
      setZoomOpen(false);
      setConfirmOpen(false);
      setLocalAvatar(null);
    }
  }, [open]);

  // Reset local avatar when a different user is opened
  useEffect(() => {
    setLocalAvatar(null);
  }, [user?.id]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const name = useMemo(() => (user ? fullName(user) : ""), [user]);

  // Admins and Directors can edit photos
  const canEditPhoto = userRole === "Admin" || userRole === "Director";
  const showDelete = canEditPhoto && canDeleteUser;

  // Merge localAvatar into user object for display purposes
  const displayUser = useMemo(
    () => (user && localAvatar ? { ...user, avatar: localAvatar } : user),
    [user, localAvatar]
  );

  const zoomSrc = localAvatar || user?.avatar;

  const handleConfirmDelete = async () => {
    const ok = await onConfirmDelete({
      userId: user?.id,
      medicalRecordId: medicalRecord?.id || null,
    });
    if (ok) {
      setConfirmOpen(false);
      onClose();
    }
  };

  if (!open && !user) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[1290] transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(3px)" }}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 z-[1295] h-full w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">
              Perfil de miembro
            </p>
            <div className="flex items-center gap-2">
              {showDelete && (
                <button
                  onClick={() => setConfirmOpen(true)}
                  className="px-3 py-1.5 rounded-xl border border-red-100 text-red-600 text-xs font-semibold hover:bg-red-50 transition-all"
                >
                  Eliminar
                </button>
              )}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all"
              >
                ✕
              </button>
            </div>
          </div>
          <h2 className="mt-2 text-lg font-bold text-gray-900 truncate">{name}</h2>
        </div>

        {/* Avatar — admin sees edit button on hover */}
        {displayUser && (
          <AvatarArea
            user={displayUser}
            canEdit={canEditPhoto}
            onZoom={() => zoomSrc && setZoomOpen(true)}
            onAvatarUpdated={setLocalAvatar}
          />
        )}

        {/* Admin hint */}
        {canEditPhoto && (
          <div className="flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 bg-slate-50 border-b border-slate-100">
            <svg
              className="w-3 h-3 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            <p className="text-[10px] text-slate-400 font-medium">
              Pasá el cursor sobre la foto para editarla
            </p>
          </div>
        )}

        {/* Tab bar */}
        <div className="flex-shrink-0 flex border-b border-gray-100">
          {["Perfil", "Ficha médica"].map((label, i) => (
            <button
              key={label}
              onClick={() => setTab(i)}
              className={`flex-1 py-3 text-xs font-semibold transition-all border-b-2 ${
                tab === i
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-400 hover:text-gray-700"
              }`}
            >
              {label}
              {label === "Ficha médica" && !medicalRecord && (
                <span className="ml-1 text-[9px] text-amber-500">●</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-hidden">
          {displayUser && tab === 0 && <ProfileTab user={displayUser} />}
          {displayUser && tab === 1 && <MedicalTab medicalRecord={medicalRecord} />}
        </div>
      </div>

      {/* Zoom overlay */}
      {zoomOpen && zoomSrc && <ZoomOverlay src={zoomSrc} onClose={() => setZoomOpen(false)} />}

      {/* Delete confirm */}
      {confirmOpen && (
        <ConfirmDialog onConfirm={handleConfirmDelete} onCancel={() => setConfirmOpen(false)} />
      )}
    </>
  );
};

export default UserDetailsModal;
