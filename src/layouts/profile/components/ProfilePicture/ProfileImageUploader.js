/* eslint-disable react/prop-types */
import { useCallback } from "react";
import { useQuery } from "@apollo/client";
import { GET_USERS_BY_ID } from "graphql/queries";
import { useImageUpload, cloudinaryOptimized } from "hooks/useImageUpload";

const SIZE = {
  sm: "w-16 h-16",
  md: "w-20 h-20",
  lg: "w-24 h-24",
  xl: "w-32 h-32",
};

const INITIALS_SIZE = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
  xl: "text-3xl",
};

const ProfileImageUploader = ({ size = "lg" }) => {
  const { data, loading, error, refetch } = useQuery(GET_USERS_BY_ID);
  const { id, name, firstSurName, avatar, role } = data?.getUser || {};

  const isAdmin = role === "Admin" || role === "admin";

  const { state, previewUrl, progress, errorMsg, confirm, cancel, openPicker, inputProps } =
    useImageUpload(id, {
      maxWidthPx: 800,
      quality: 0.85,
      onSuccess: () => refetch(),
    });

  // Users without a photo can always upload.
  // Users with a photo can only change it if they're Admin.
  const hasPhoto = !!avatar;
  const canEdit = !hasPhoto || isAdmin;

  const getInitials = () => {
    if (name && firstSurName) return `${name[0]}${firstSurName[0]}`.toUpperCase();
    return "?";
  };

  const displayImage =
    previewUrl || (avatar ? cloudinaryOptimized(avatar, { width: 400, height: 400 }) : null);

  const handleClick = useCallback(() => {
    if (canEdit && state === "idle") openPicker();
  }, [canEdit, state, openPicker]);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      if (!canEdit) return;
      const file = e.dataTransfer.files?.[0];
      // pickFile is not needed here directly; use inputProps onChange equivalent
      if (file) {
        const dt = new DataTransfer();
        dt.items.add(file);
        // Trigger the same flow by calling inputProps onChange manually
        const fakeEvent = { target: { files: dt.files }, preventDefault: () => {} };
        inputProps.onChange(fakeEvent);
      }
    },
    [canEdit, inputProps]
  );

  if (loading) return <div className={`${SIZE[size]} rounded-full bg-slate-100 animate-pulse`} />;
  if (error)
    return (
      <div className={`${SIZE[size]} rounded-full bg-red-50 flex items-center justify-center`}>
        <span className="text-red-400 text-[10px]">Error</span>
      </div>
    );

  const isUploading = state === "uploading" || state === "compressing";
  const isPreviewing = state === "previewing";
  const isSuccess = state === "success";
  const isError = state === "error";

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      {/* ── Avatar circle ── */}
      <div className="relative group">
        <div
          className={[
            SIZE[size],
            "rounded-full overflow-hidden relative transition-all duration-300 ease-out",
            canEdit ? "cursor-pointer" : "cursor-default",
            isPreviewing ? "ring-4 ring-amber-400 ring-offset-2" : "",
            isUploading ? "ring-4 ring-blue-400  ring-offset-2" : "",
            isSuccess ? "ring-4 ring-emerald-400 ring-offset-2" : "",
            isError ? "ring-4 ring-red-400   ring-offset-2" : "",
          ].join(" ")}
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={(e) => canEdit && e.preventDefault()}
        >
          {/* Image or initials */}
          {displayImage ? (
            <img
              src={displayImage}
              alt="Foto de perfil"
              className="w-full h-full object-cover object-center transition-all duration-500"
              style={{ filter: isUploading ? "brightness(0.6)" : "brightness(1)" }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
              <span
                className={`${INITIALS_SIZE[size]} font-semibold text-slate-400 tracking-tight`}
              >
                {getInitials()}
              </span>
            </div>
          )}

          {/* Uploading / compressing overlay */}
          {isUploading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
              <svg className="w-5 h-5 text-white animate-spin mb-1" fill="none" viewBox="0 0 24 24">
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
              <span className="text-white text-[10px] font-semibold">
                {state === "compressing" ? "Optimizando…" : `${progress}%`}
              </span>
            </div>
          )}

          {/* Success overlay */}
          {isSuccess && (
            <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/70 backdrop-blur-sm">
              <svg
                className="w-7 h-7 text-white"
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

          {/* Hover overlay — only when idle and editable */}
          {state === "idle" && canEdit && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-all duration-200 flex items-center justify-center rounded-full">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center gap-0.5">
                <svg
                  className="w-4 h-4 text-white drop-shadow"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="text-white text-[9px] font-semibold tracking-wide drop-shadow">
                  {hasPhoto ? "Cambiar" : "Subir"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Circular progress ring */}
        {isUploading && state === "uploading" && (
          <svg
            className="absolute -inset-1 w-[calc(100%+8px)] h-[calc(100%+8px)] -rotate-90 pointer-events-none"
            viewBox="0 0 100 100"
          >
            <circle cx="50" cy="50" r="47" fill="none" stroke="#e2e8f0" strokeWidth="3" />
            <circle
              cx="50"
              cy="50"
              r="47"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${progress * 2.95} 295`}
              className="transition-all duration-200"
            />
          </svg>
        )}
      </div>

      {/* ── Preview actions ── */}
      {isPreviewing && (
        <div className="flex items-center gap-2">
          <button
            onClick={cancel}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-all active:scale-95"
          >
            Cancelar
          </button>
          <button
            onClick={confirm}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-full hover:bg-slate-700 transition-all active:scale-95 flex items-center gap-1.5"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            Subir foto
          </button>
        </div>
      )}

      {/* ── Success message ── */}
      {isSuccess && <p className="text-xs font-medium text-emerald-600">✓ Foto actualizada</p>}

      {/* ── Error message ── */}
      {isError && (
        <div className="flex items-center gap-1.5">
          <p className="text-xs text-red-500 font-medium max-w-[160px] text-center leading-tight">
            {errorMsg}
          </p>
          <button
            onClick={cancel}
            className="text-xs text-slate-400 hover:text-slate-600 underline whitespace-nowrap"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* ── Idle hint ── */}
      {state === "idle" && !hasPhoto && canEdit && (
        <p className="text-[10px] text-slate-400 font-medium tracking-wide">
          Toca para agregar foto
        </p>
      )}

      <input {...inputProps} />
    </div>
  );
};

export default ProfileImageUploader;
