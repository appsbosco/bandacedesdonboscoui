import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';

const ACCEPTED = 'image/jpeg,image/png,image/webp,image/heic,application/pdf';
const MAX_BYTES = 15 * 1024 * 1024;

function FileUploader({ onFileReady, label = 'Toca para adjuntar documento' }) {
  const inputRef = useRef(null);
  const [preview,  setPreview]  = useState(null);
  const [fileName, setFileName] = useState('');
  const [error,    setError]    = useState(null);
  const [dragging, setDragging] = useState(false);

  function handleFile(file) {
    setError(null);
    if (!file) return;
    const okType = /^image\/(jpeg|png|webp|heic)$|^application\/pdf$/.test(file.type);
    if (!okType) { setError('Formato no válido. Usa JPG, PNG, WebP o PDF.'); return; }
    if (file.size > MAX_BYTES) { setError('El archivo no puede superar 15 MB.'); return; }
    setFileName(file.name);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => setPreview(e.target.result);
      reader.readAsDataURL(file);
    } else { setPreview(null); }
    onFileReady(file);
  }

  function handleReset() {
    setPreview(null);
    setFileName('');
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  const dropZoneClass = [
    'w-full rounded-3xl border-2 border-dashed cursor-pointer transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2',
    preview
      ? 'border-emerald-300 bg-emerald-50/40 p-5'
      : dragging
      ? 'border-slate-400 bg-slate-100 p-8'
      : 'border-slate-200 bg-slate-50 hover:border-slate-400 hover:bg-white p-8',
  ].join(' ');

  return (
    <div className="flex flex-col w-full gap-3">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
        onDrop={e => {
          e.preventDefault();
          setDragging(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        className={dropZoneClass}
      >
        {preview ? (
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <img
                src={preview}
                alt="Vista previa"
                className="max-h-52 rounded-2xl shadow-sm object-contain"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <p className="text-xs font-medium text-slate-600 truncate max-w-[200px]">{fileName}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-200 flex items-center justify-center">
              <svg
                className="w-7 h-7 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6h.1a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v8"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">{label}</p>
              <p className="text-xs text-slate-400 mt-1">JPG · PNG · WebP · PDF · máx 15 MB</p>
            </div>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          className="hidden"
          onChange={e => handleFile(e.target.files?.[0])}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-red-50 border border-red-100">
          <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Change file button */}
      {preview && (
        <button
          onClick={e => { e.stopPropagation(); handleReset(); }}
          className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors text-center py-1"
        >
          Cambiar archivo
        </button>
      )}
    </div>
  );
}

FileUploader.propTypes = {
  onFileReady: PropTypes.func.isRequired,
  label: PropTypes.string,
};

export default FileUploader;
