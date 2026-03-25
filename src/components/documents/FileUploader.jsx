import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';

const ACCEPTED = 'image/jpeg,image/png,image/webp,image/heic,application/pdf';
const MAX_BYTES = 15 * 1024 * 1024;

function FileUploader({ onFileReady, label = 'Toque para adjuntar documento' }) {
  const inputRef = useRef(null);
  const [preview,  setPreview]  = useState(null);
  const [fileName, setFileName] = useState('');
  const [error,    setError]    = useState(null);

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

  return (
    <div className="flex flex-col items-center w-full px-4 py-6 gap-4">
      <div
        role="button" tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
        onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }}
        onDragOver={e => e.preventDefault()}
        className="w-full max-w-sm border-2 border-dashed border-gray-300 rounded-2xl
                   p-8 text-center cursor-pointer transition-colors
                   hover:border-indigo-400 hover:bg-indigo-50 focus:outline-none
                   focus:ring-2 focus:ring-indigo-400"
      >
        {preview ? (
          <img src={preview} alt="Vista previa" className="max-h-56 mx-auto rounded-xl" />
        ) : (
          <>
            <svg className="w-14 h-14 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6h.1a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v8" />
            </svg>
            <p className="text-sm text-gray-600 font-medium">{label}</p>
            <p className="text-xs text-gray-400 mt-1">JPG · PNG · WebP · PDF · máx 15 MB</p>
          </>
        )}
        <input ref={inputRef} type="file" accept={ACCEPTED} className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
      </div>
      {fileName && <p className="text-sm text-gray-500 truncate max-w-xs">{fileName}</p>}
      {error    && <p className="text-sm text-red-500 text-center">{error}</p>}
      {preview  && (
        <button onClick={() => { setPreview(null); setFileName(''); if (inputRef.current) inputRef.current.value = ''; }}
          className="text-sm text-gray-400 hover:text-gray-600">
          Cambiar archivo
        </button>
      )}
    </div>
  );
}
FileUploader.propTypes = { onFileReady: PropTypes.func.isRequired, label: PropTypes.string };
export default FileUploader;
