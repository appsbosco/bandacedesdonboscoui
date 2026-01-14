// src/components/wizard/WizardStep2.js
import React, { useState, useCallback } from "react";
import PropTypes from "prop-types";
import { CameraAutoScanner } from "../../components/documents/Cameraautoscanner";

export function WizardStep2({ documentType, onCapture, onCancel }) {
  const [capturedCanvas, setCapturedCanvas] = useState(null);

  const handleCapture = useCallback((canvas) => {
    setCapturedCanvas(canvas);
  }, []);

  const handleRetry = useCallback(() => {
    setCapturedCanvas(null);
  }, []);

  const handleContinue = useCallback(() => {
    if (capturedCanvas && onCapture) {
      onCapture(capturedCanvas);
    }
  }, [capturedCanvas, onCapture]);

  if (!capturedCanvas) {
    return (
      <CameraAutoScanner
        documentType={documentType}
        onCapture={handleCapture}
        onCancel={onCancel}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-10 mb-10">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={onCancel}
            className="p-2 rounded-xl hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <span className="text-sm text-slate-500">Paso 2 de 3</span>
          <div className="w-10" />
        </div>

        <div className="rounded-3xl bg-white shadow-xl ring-1 ring-slate-200 overflow-hidden">
          <div className="px-5 pt-5 pb-4 border-b border-slate-100">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-50 ring-1 ring-emerald-200 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Imagen Capturada</h2>
              <p className="text-slate-500 text-sm">Verifica que el documento se vea claramente</p>
            </div>
          </div>

          <div className="p-5">
            <div className="rounded-2xl overflow-hidden ring-1 ring-slate-200 bg-slate-100">
              <canvas
                ref={(el) => {
                  if (el && capturedCanvas) {
                    const ctx = el.getContext("2d");
                    const maxW = el.parentElement?.clientWidth || 320;
                    const scale = Math.min(maxW / capturedCanvas.width, 1);
                    el.width = Math.round(capturedCanvas.width * scale);
                    el.height = Math.round(capturedCanvas.height * scale);
                    ctx.drawImage(capturedCanvas, 0, 0, el.width, el.height);
                  }
                }}
                className="w-full block"
              />
            </div>
          </div>

          <div className="px-5 pb-5 space-y-3 mb-10">
            <button
              onClick={handleContinue}
              className="w-full py-4 rounded-2xl font-semibold bg-sky-600 hover:bg-sky-500 text-white shadow-lg transition-all"
            >
              <span className="flex items-center justify-center gap-2">
                Continuar
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </span>
            </button>

            <button
              onClick={handleRetry}
              className="w-full py-3.5 rounded-2xl font-semibold bg-white text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50 transition-colors mb-10"
            >
              Escanear de nuevo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

WizardStep2.propTypes = {
  documentType: PropTypes.string.isRequired,
  onCapture: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default WizardStep2;

// import React, { useState, useCallback } from "react";
// import { CameraAutoScanner } from "../../components/documents/Cameraautoscanner";
// import {
//   uploadToCloudinary,
//   canvasToBlob,
//   optimizeForUpload,
// } from "../../utils/uploadToCloudinary";
// import PropTypes from "prop-types";

// /**
//  * WizardStep2 - Escaneo con captura automática
//  */
// export function WizardStep2({
//   documentId,
//   documentType,
//   onCapture,
//   onCancel,
//   onAddImage,
//   isUploading,
// }) {
//   const [phase, setPhase] = useState("scanning"); // scanning, uploading, complete, error
//   const [capturedCanvas, setCapturedCanvas] = useState(null);
//   const [uploadProgress, setUploadProgress] = useState(0);
//   const [error, setError] = useState(null);

//   // Manejar captura exitosa del scanner
//   const handleCapture = useCallback(
//     async (canvas) => {
//       setCapturedCanvas(canvas);
//       setPhase("uploading");
//       setError(null);

//       try {
//         // Optimizar imagen antes de subir
//         const blob = await optimizeForUpload(canvas, {
//           maxWidth: 2048,
//           maxHeight: 2048,
//           quality: 0.92,
//         });

//         // Subir a Cloudinary
//         const result = await uploadToCloudinary(
//           blob,
//           {
//             folder: `documents/${documentType.toLowerCase()}`,
//             tags: [documentType, documentId],
//           },
//           (progress) => {
//             setUploadProgress(progress);
//           }
//         );

//         // Notificar al padre para agregar la imagen al documento
//         if (onAddImage) {
//           await onAddImage({
//             url: result.url,
//             publicId: result.publicId,
//             provider: "CLOUDINARY",
//           });
//         }

//         setPhase("complete");

//         // Continuar al siguiente paso
//         if (onCapture) {
//           onCapture(canvas, result);
//         }
//       } catch (err) {
//         console.error("Upload error:", err);
//         setError(err.message || "Error al subir la imagen");
//         setPhase("error");
//       }
//     },
//     [documentId, documentType, onAddImage, onCapture]
//   );

//   // Reintentar después de error
//   const handleRetry = useCallback(() => {
//     setCapturedCanvas(null);
//     setError(null);
//     setUploadProgress(0);
//     setPhase("scanning");
//   }, []);

//   // Fase de escaneo
//   if (phase === "scanning") {
//     return (
//       <CameraAutoScanner
//         documentType={documentType}
//         onCapture={handleCapture}
//         onCancel={onCancel}
//       />
//     );
//   }

//   // Fase de subida
//   if (phase === "uploading") {
//     return (
//       <div className="camera-fullscreen bg-scanner-bg flex flex-col items-center justify-center p-6">
//         {/* Preview de imagen capturada */}
//         {capturedCanvas && (
//           <div className="w-64 h-48 mb-8 rounded-xl overflow-hidden shadow-2xl relative">
//             <canvas
//               ref={(el) => {
//                 if (el && capturedCanvas) {
//                   const ctx = el.getContext("2d");
//                   el.width = capturedCanvas.width;
//                   el.height = capturedCanvas.height;
//                   ctx.drawImage(capturedCanvas, 0, 0);
//                 }
//               }}
//               className="w-full h-full object-cover"
//             />

//             {/* Overlay de progreso */}
//             <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
//               <div className="text-center">
//                 <div className="w-12 h-12 mx-auto mb-2 relative">
//                   <svg className="w-full h-full -rotate-90">
//                     <circle
//                       cx="24"
//                       cy="24"
//                       r="20"
//                       fill="none"
//                       stroke="currentColor"
//                       strokeWidth="4"
//                       className="text-slate-700"
//                     />
//                     <circle
//                       cx="24"
//                       cy="24"
//                       r="20"
//                       fill="none"
//                       stroke="currentColor"
//                       strokeWidth="4"
//                       strokeDasharray={`${2 * Math.PI * 20}`}
//                       strokeDashoffset={`${2 * Math.PI * 20 * (1 - uploadProgress / 100)}`}
//                       className="text-primary-400 transition-all duration-300"
//                     />
//                   </svg>
//                   <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
//                     {uploadProgress}%
//                   </span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         <div className="text-center">
//           <h3 className="text-xl font-semibold text-white mb-2">Subiendo imagen...</h3>
//           <p className="text-slate-400 text-sm mb-6">
//             Por favor espera mientras guardamos tu documento
//           </p>

//           {/* Progress bar */}
//           <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden">
//             <div
//               className="h-full bg-primary-500 rounded-full transition-all duration-300"
//               style={{ width: `${uploadProgress}%` }}
//             />
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // Fase de error
//   if (phase === "error") {
//     return (
//       <div className="camera-fullscreen bg-scanner-bg flex flex-col items-center justify-center p-6 text-center">
//         <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
//           <svg
//             className="w-10 h-10 text-red-400"
//             fill="none"
//             viewBox="0 0 24 24"
//             stroke="currentColor"
//           >
//             <path
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               strokeWidth={2}
//               d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
//             />
//           </svg>
//         </div>

//         <h3 className="text-xl font-semibold text-white mb-2">Error al subir</h3>
//         <p className="text-slate-400 mb-8 max-w-sm">{error}</p>

//         <div className="space-y-3 w-full max-w-xs">
//           <button
//             onClick={handleRetry}
//             className="w-full py-3 px-6 bg-primary-600 hover:bg-primary-500 text-white font-medium rounded-xl transition-colors touch-target"
//           >
//             Reintentar escaneo
//           </button>

//           <button
//             onClick={onCancel}
//             className="w-full py-3 px-6 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition-colors touch-target"
//           >
//             Cancelar
//           </button>
//         </div>
//       </div>
//     );
//   }

//   // Fase completa (transición rápida)
//   return (
//     <div className="camera-fullscreen bg-scanner-bg flex flex-col items-center justify-center p-6">
//       <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
//         <svg
//           className="w-10 h-10 text-green-400"
//           fill="none"
//           viewBox="0 0 24 24"
//           stroke="currentColor"
//         >
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//         </svg>
//       </div>
//       <h3 className="text-xl font-semibold text-white mb-2">¡Imagen guardada!</h3>
//       <p className="text-slate-400 text-sm">Procesando datos del documento...</p>
//     </div>
//   );
// }

// export default WizardStep2;

// WizardStep2.propTypes = {
//   documentId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,

//   documentType: PropTypes.string.isRequired,

//   onCapture: PropTypes.func,
//   onCancel: PropTypes.func.isRequired,
//   onAddImage: PropTypes.func,

//   isUploading: PropTypes.bool,
// };
