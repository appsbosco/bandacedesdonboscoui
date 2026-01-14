// src/components/scanner/QualityIndicators.js
import React from "react";
import PropTypes from "prop-types";

export function QualityIndicators({ analysis }) {
  const indicators = [
    { key: "focus", label: analysis.focus.label, ok: analysis.focus.ok },
    { key: "brightness", label: analysis.brightness.label, ok: analysis.brightness.ok },
    { key: "glare", label: analysis.glare.label, ok: analysis.glare.ok },
    { key: "alignment", label: analysis.alignment.label, ok: analysis.alignment.ok },
  ];

  return (
    <div className="absolute top-20 left-0 right-0 z-20 px-4">
      <div className="flex flex-wrap justify-center gap-2">
        {indicators.map(({ key, label, ok }) => (
          <div
            key={key}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm transition-all duration-300 ${
              ok
                ? "bg-emerald-500/20 text-emerald-100 border border-emerald-400/40"
                : "bg-white/10 text-white/70 border border-white/20"
            }`}
          >
            <span>{label}</span>
            {ok && (
              <svg
                className="w-3 h-3 text-emerald-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-3">
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm transition-all duration-300 ${
            analysis.documentDetected
              ? "bg-emerald-500/20 text-emerald-100 border border-emerald-400/40"
              : "bg-amber-500/20 text-amber-100 border border-amber-400/40"
          }`}
        >
          {analysis.documentDetected ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Documento detectado</span>
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4 animate-pulse"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <span>Buscando documento...</span>
            </>
          )}
        </div>
      </div>

      {analysis.documentDetected && (
        <div className="mt-4 max-w-xs mx-auto">
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                analysis.overallOk ? "bg-emerald-400" : "bg-sky-400"
              }`}
              style={{ width: `${analysis.overallScore * 100}%` }}
            />
          </div>
          <p className="text-center text-xs text-white/60 mt-1">
            Calidad: {Math.round(analysis.overallScore * 100)}%
          </p>
        </div>
      )}
    </div>
  );
}

QualityIndicators.propTypes = {
  analysis: PropTypes.object.isRequired,
};

export default QualityIndicators;

// import React from "react";
// import PropTypes from "prop-types";

// /**
//  * Componente que muestra indicadores de calidad en tiempo real
//  */
// export function QualityIndicators({ analysis }) {
//   if (!analysis) return null;

//   const indicators = [
//     {
//       key: "focus",
//       icon: "🎯",
//       label: analysis.focus?.label || "Enfoque",
//       ok: analysis.focus?.ok,
//       score: analysis.focus?.score,
//     },
//     {
//       key: "brightness",
//       icon: "💡",
//       label: analysis.brightness?.label || "Luz",
//       ok: analysis.brightness?.ok,
//       score: analysis.brightness?.score,
//       raw: analysis.brightness?.raw,
//     },
//     {
//       key: "glare",
//       icon: "✨",
//       label: analysis.glare?.label || "Reflejo",
//       ok: analysis.glare?.ok,
//       score: analysis.glare?.score,
//       percent: analysis.glare?.percent,
//     },
//     {
//       key: "contrast",
//       icon: "◐",
//       label: analysis.contrast?.label || "Contraste",
//       ok: analysis.contrast?.ok,
//       score: analysis.contrast?.score,
//     },
//     {
//       key: "alignment",
//       icon: "📐",
//       label: analysis.alignment?.label || "Alineación",
//       ok: analysis.alignment?.ok,
//       score: analysis.alignment?.score,
//     },
//   ];

//   return (
//     <div className="absolute top-20 left-4 right-4 z-10">
//       <div className="bg-black/60 backdrop-blur-md rounded-2xl p-4 space-y-2">
//         {/* Score general */}
//         <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/10">
//           <span className="text-white/90 text-sm font-medium">Calidad general</span>
//           <div className="flex items-center gap-2">
//             <div className="w-24 h-2 bg-white/20 rounded-full overflow-hidden">
//               <div
//                 className={`h-full rounded-full transition-all duration-300 ${
//                   analysis.overallScore > 0.85
//                     ? "bg-green-400"
//                     : analysis.overallScore > 0.6
//                     ? "bg-yellow-400"
//                     : "bg-red-400"
//                 }`}
//                 style={{ width: `${(analysis.overallScore || 0) * 100}%` }}
//               />
//             </div>
//             <span className="text-white text-sm font-bold min-w-[3ch]">
//               {Math.round((analysis.overallScore || 0) * 100)}%
//             </span>
//           </div>
//         </div>

//         {/* Indicadores individuales */}
//         {indicators.map((indicator) => (
//           <div key={indicator.key} className="flex items-center justify-between">
//             <div className="flex items-center gap-2">
//               <span className="text-lg">{indicator.icon}</span>
//               <span className="text-white/80 text-sm">{indicator.label}</span>
//             </div>

//             <div className="flex items-center gap-2">
//               {/* Debug info (opcional, comentar en producción) */}
//               {indicator.raw !== undefined && (
//                 <span className="text-white/40 text-xs">({Math.round(indicator.raw)})</span>
//               )}
//               {indicator.percent !== undefined && (
//                 <span className="text-white/40 text-xs">
//                   ({Math.round(indicator.percent * 100)}%)
//                 </span>
//               )}

//               {/* Status icon */}
//               <div
//                 className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
//                   indicator.ok
//                     ? "bg-green-500/30 ring-2 ring-green-400"
//                     : "bg-red-500/30 ring-2 ring-red-400"
//                 }`}
//               >
//                 {indicator.ok ? (
//                   <svg
//                     className="w-4 h-4 text-green-400"
//                     fill="none"
//                     viewBox="0 0 24 24"
//                     stroke="currentColor"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth={3}
//                       d="M5 13l4 4L19 7"
//                     />
//                   </svg>
//                 ) : (
//                   <svg
//                     className="w-4 h-4 text-red-400"
//                     fill="none"
//                     viewBox="0 0 24 24"
//                     stroke="currentColor"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth={3}
//                       d="M6 18L18 6M6 6l12 12"
//                     />
//                   </svg>
//                 )}
//               </div>
//             </div>
//           </div>
//         ))}

//         {/* Documento detectado */}
//         <div className="flex items-center justify-between pt-2 border-t border-white/10">
//           <div className="flex items-center gap-2">
//             <span className="text-lg">📄</span>
//             <span className="text-white/80 text-sm">Documento</span>
//           </div>
//           <span
//             className={`text-sm font-medium ${
//               analysis.documentDetected ? "text-green-400" : "text-red-400"
//             }`}
//           >
//             {analysis.documentDetected ? "Detectado" : "No detectado"}
//           </span>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default QualityIndicators;

// QualityIndicators.propTypes = {
//   analysis: PropTypes.shape({
//     overallScore: PropTypes.number,
//     documentDetected: PropTypes.bool,

//     focus: PropTypes.shape({
//       label: PropTypes.string,
//       ok: PropTypes.bool,
//       score: PropTypes.number,
//     }),

//     brightness: PropTypes.shape({
//       label: PropTypes.string,
//       ok: PropTypes.bool,
//       score: PropTypes.number,
//       raw: PropTypes.number,
//     }),

//     glare: PropTypes.shape({
//       label: PropTypes.string,
//       ok: PropTypes.bool,
//       score: PropTypes.number,
//       percent: PropTypes.number,
//     }),

//     contrast: PropTypes.shape({
//       label: PropTypes.string,
//       ok: PropTypes.bool,
//       score: PropTypes.number,
//     }),

//     alignment: PropTypes.shape({
//       label: PropTypes.string,
//       ok: PropTypes.bool,
//       score: PropTypes.number,
//     }),
//   }),
// };

// import React from "react";
// import PropTypes from "prop-types";

// /**
//  * QualityIndicators - Chips que muestran el estado de cada métrica
//  */
// export function QualityIndicators({ analysis }) {
//   const indicators = [
//     {
//       key: "focus",
//       label: analysis.focus.label,
//       ok: analysis.focus.ok,
//       icon: (
//         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//           <path
//             strokeLinecap="round"
//             strokeLinejoin="round"
//             strokeWidth={2}
//             d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
//           />
//           <path
//             strokeLinecap="round"
//             strokeLinejoin="round"
//             strokeWidth={2}
//             d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
//           />
//         </svg>
//       ),
//     },
//     {
//       key: "brightness",
//       label: analysis.brightness.label,
//       ok: analysis.brightness.ok,
//       icon: (
//         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//           <path
//             strokeLinecap="round"
//             strokeLinejoin="round"
//             strokeWidth={2}
//             d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
//           />
//         </svg>
//       ),
//     },
//     {
//       key: "glare",
//       label: analysis.glare.label,
//       ok: analysis.glare.ok,
//       icon: (
//         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//           <path
//             strokeLinecap="round"
//             strokeLinejoin="round"
//             strokeWidth={2}
//             d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
//           />
//         </svg>
//       ),
//     },
//     {
//       key: "alignment",
//       label: analysis.alignment.label,
//       ok: analysis.alignment.ok,
//       icon: (
//         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//           <path
//             strokeLinecap="round"
//             strokeLinejoin="round"
//             strokeWidth={2}
//             d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
//           />
//         </svg>
//       ),
//     },
//   ];

//   return (
//     <div className="absolute top-20 left-0 right-0 z-20 px-4">
//       <div className="flex flex-wrap justify-center gap-2">
//         {indicators.map(({ key, label, ok, icon }) => (
//           <div
//             key={key}
//             className={`
//               flex items-center gap-2 px-3 py-1.5
//               rounded-full text-xs font-medium
//               backdrop-blur-sm transition-all duration-300
//               ${
//                 ok
//                   ? "bg-green-500/20 text-green-300 border border-green-500/30"
//                   : "bg-slate-800/80 text-slate-400 border border-slate-700/50"
//               }
//             `}
//           >
//             <span className={ok ? "text-green-400" : "text-slate-500"}>{icon}</span>
//             <span>{label}</span>
//             {ok && (
//               <svg
//                 className="w-3 h-3 text-green-400"
//                 fill="none"
//                 viewBox="0 0 24 24"
//                 stroke="currentColor"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={3}
//                   d="M5 13l4 4L19 7"
//                 />
//               </svg>
//             )}
//           </div>
//         ))}
//       </div>

//       {/* Indicador de documento detectado */}
//       <div className="flex justify-center mt-3">
//         <div
//           className={`
//           flex items-center gap-2 px-4 py-2
//           rounded-full text-sm font-medium
//           backdrop-blur-sm transition-all duration-300
//           ${
//             analysis.documentDetected
//               ? "bg-primary-500/20 text-primary-300 border border-primary-500/30"
//               : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
//           }
//         `}
//         >
//           {analysis.documentDetected ? (
//             <>
//               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
//                 />
//               </svg>
//               <span>Documento detectado</span>
//             </>
//           ) : (
//             <>
//               <svg
//                 className="w-4 h-4 animate-pulse"
//                 fill="none"
//                 viewBox="0 0 24 24"
//                 stroke="currentColor"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
//                 />
//               </svg>
//               <span>Buscando documento...</span>
//             </>
//           )}
//         </div>
//       </div>

//       {/* Barra de progreso general */}
//       {analysis.documentDetected && (
//         <div className="mt-4 max-w-xs mx-auto">
//           <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
//             <div
//               className={`
//                 h-full rounded-full transition-all duration-500
//                 ${analysis.overallOk ? "bg-green-400" : "bg-primary-500"}
//               `}
//               style={{ width: `${analysis.overallScore * 100}%` }}
//             />
//           </div>
//           <p className="text-center text-xs text-slate-500 mt-1">
//             Calidad: {Math.round(analysis.overallScore * 100)}%
//           </p>
//         </div>
//       )}
//     </div>
//   );
// }

// export default QualityIndicators;

// const MetricShape = PropTypes.shape({
//   label: PropTypes.string.isRequired,
//   ok: PropTypes.bool.isRequired,
// });

// QualityIndicators.propTypes = {
//   analysis: PropTypes.shape({
//     focus: MetricShape.isRequired,
//     brightness: MetricShape.isRequired,
//     glare: MetricShape.isRequired,
//     alignment: MetricShape.isRequired,
//     documentDetected: PropTypes.bool.isRequired,
//     overallOk: PropTypes.bool.isRequired,
//     overallScore: PropTypes.number.isRequired, // 0..1
//   }).isRequired,
// };

// // Opcional: default útil por si renderiza antes de tener data
// QualityIndicators.defaultProps = {
//   analysis: {
//     focus: { label: "", ok: false },
//     brightness: { label: "", ok: false },
//     glare: { label: "", ok: false },
//     alignment: { label: "", ok: false },
//     documentDetected: false,
//     overallOk: false,
//     overallScore: 0,
//   },
// };
