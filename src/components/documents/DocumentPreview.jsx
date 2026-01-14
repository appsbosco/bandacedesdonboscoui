// import React, { useState } from "react";
// import { useMutation } from "@apollo/client";
// import {
//   ADD_DOCUMENT_IMAGE,
//   UPSERT_DOCUMENT_EXTRACTED_DATA,
//   SET_DOCUMENT_STATUS,
// } from "../../graphql/documents/documents.gql";
// import { uploadToCloudinary } from "../../services/cloudinaryUpload";
// import { extractMRZFromImage } from "../../utils/extractMRZFromImage";
// import DocumentConfirmForm from "./DocumentConfirmForm";
// import PropTypes from "prop-types";

// export default function DocumentPreview({ image, documentId, documentType, onRetake, onComplete }) {
//   const [addDocumentImage] = useMutation(ADD_DOCUMENT_IMAGE);
//   const [upsertExtractedData] = useMutation(UPSERT_DOCUMENT_EXTRACTED_DATA);
//   const [setDocumentStatus] = useMutation(SET_DOCUMENT_STATUS);

//   const [status, setStatus] = useState("PREVIEW");
//   const [uploadProgress, setUploadProgress] = useState(0);
//   const [extractedData, setExtractedData] = useState(null);
//   const [imageUrl, setImageUrl] = useState(null);

//   const previewUrl = URL.createObjectURL(image);

//   const handleUsePhoto = async () => {
//     try {
//       // Upload
//       setStatus("UPLOADING");
//       const cloudinaryResult = await uploadToCloudinary(image, (progress) => {
//         setUploadProgress(progress);
//       });

//       setImageUrl(cloudinaryResult.secure_url);

//       // Add image
//       await addDocumentImage({
//         variables: {
//           input: {
//             documentId,
//             url: cloudinaryResult.secure_url,
//             provider: "CLOUDINARY",
//             publicId: cloudinaryResult.public_id,
//           },
//         },
//       });

//       // Extract
//       setStatus("EXTRACTING");

//       if (documentType === "PASSPORT") {
//         const mrzData = await extractMRZFromImage(image);
//         setExtractedData(mrzData);
//       } else {
//         setExtractedData({ needsManualReview: true });
//       }

//       setStatus("CONFIRM");
//     } catch (error) {
//       console.error("Error processing image:", error);
//       alert("Error procesando imagen: " + error.message);
//       onRetake();
//     }
//   };

//   const handleConfirmData = async (formData) => {
//     try {
//       await upsertExtractedData({
//         variables: {
//           input: {
//             documentId,
//             ...formData,
//           },
//         },
//       });

//       const finalStatus =
//         documentType === "PASSPORT" && formData.mrzValid
//           ? "DATA_CAPTURED"
//           : formData.ocrConfidence && formData.ocrConfidence > 0.8
//           ? "OCR_SUCCESS"
//           : "DATA_CAPTURED";

//       await setDocumentStatus({
//         variables: {
//           documentId,
//           status: finalStatus,
//         },
//       });

//       onComplete(documentId);
//     } catch (error) {
//       console.error("Error saving data:", error);
//       alert("Error guardando datos: " + error.message);
//     }
//   };

//   if (status === "CONFIRM") {
//     return (
//       <DocumentConfirmForm
//         documentId={documentId}
//         documentType={documentType}
//         initialData={extractedData}
//         imageUrl={imageUrl}
//         onConfirm={handleConfirmData}
//         onCancel={onRetake}
//       />
//     );
//   }

//   return (
//     <div className="h-full bg-gradient-to-br from-gray-900 to-black flex flex-col">
//       <div className="flex-1 relative flex items-center justify-center p-4">
//         <img
//           src={previewUrl}
//           alt="Preview"
//           className="max-w-full max-h-full rounded-xl shadow-2xl"
//         />

//         {(status === "UPLOADING" || status === "EXTRACTING") && (
//           <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center">
//             <div className="text-center text-white p-8">
//               <div className="mb-6">
//                 <svg
//                   className="animate-spin h-16 w-16 mx-auto text-blue-500"
//                   fill="none"
//                   viewBox="0 0 24 24"
//                 >
//                   <circle
//                     className="opacity-25"
//                     cx="12"
//                     cy="12"
//                     r="10"
//                     stroke="currentColor"
//                     strokeWidth="4"
//                   />
//                   <path
//                     className="opacity-75"
//                     fill="currentColor"
//                     d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                   />
//                 </svg>
//               </div>
//               <h3 className="text-xl font-bold mb-2">
//                 {status === "UPLOADING" ? "Subiendo imagen..." : "Analizando documento..."}
//               </h3>
//               <p className="text-gray-400 text-sm">
//                 {status === "UPLOADING"
//                   ? "Esto puede tomar unos segundos"
//                   : "Extrayendo información del documento"}
//               </p>
//               {status === "UPLOADING" && (
//                 <div className="w-64 bg-white/10 rounded-full h-2 overflow-hidden mx-auto mt-4">
//                   <div
//                     className="bg-blue-500 h-full transition-all duration-300"
//                     style={{ width: `${uploadProgress}%` }}
//                   />
//                 </div>
//               )}
//             </div>
//           </div>
//         )}
//       </div>

//       {status === "PREVIEW" && (
//         <div
//           className="p-6 pb-8 space-y-3"
//           style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 2rem)" }}
//         >
//           <button
//             onClick={handleUsePhoto}
//             className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-colors shadow-lg"
//           >
//             Usar esta foto
//           </button>
//           <button
//             onClick={onRetake}
//             className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold py-4 px-6 rounded-xl transition-colors"
//           >
//             Tomar otra foto
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }

// DocumentPreview.propTypes = {
//   image: PropTypes.oneOfType([PropTypes.instanceOf(File), PropTypes.instanceOf(Blob)]).isRequired,
//   documentId: PropTypes.string.isRequired,
//   documentType: PropTypes.oneOf(["PASSPORT", "VISA"]).isRequired,
//   onRetake: PropTypes.func.isRequired,
//   onComplete: PropTypes.func.isRequired,
// };
