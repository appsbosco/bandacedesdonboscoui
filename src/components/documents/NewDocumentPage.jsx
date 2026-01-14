// src/pages/NewDocumentPage.js
import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@apollo/client";
import {
  CREATE_DOCUMENT,
  ADD_DOCUMENT_IMAGE,
  UPSERT_DOCUMENT_EXTRACTED_DATA,
  MY_DOCUMENTS,
} from "../../graphql/documents/index.js";
import { WizardStep1 } from "../../components/documents/WizardStep1.jsx";
import { WizardStep2 } from "../../components/documents/WizardStep2";
import { WizardStep3 } from "../../components/documents/WizardStep3";
import { useToast } from "../../components/ui/Toast";
import { uploadToCloudinary, optimizeForUpload } from "../../utils/uploadToCloudinary.js";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Card from "@mui/material/Card";

import { DOCUMENT_TYPES } from "../../utils/constants";

// Componentes adicionales
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

function NewDocumentPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState(1);
  const [documentType, setDocumentType] = useState(null);
  const [capturedCanvas, setCapturedCanvas] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [createDocument] = useMutation(CREATE_DOCUMENT, {
    refetchQueries: [{ query: MY_DOCUMENTS }],
  });

  const [addDocumentImage] = useMutation(ADD_DOCUMENT_IMAGE);

  const [upsertExtractedData] = useMutation(UPSERT_DOCUMENT_EXTRACTED_DATA, {
    refetchQueries: [{ query: MY_DOCUMENTS }],
  });

  const handleStep1Next = useCallback(() => {
    if (!documentType) return;
    setStep(2);
  }, [documentType]);

  const handleStep2Capture = useCallback((canvas) => {
    setCapturedCanvas(canvas);
    setStep(3);
  }, []);

  const handleStep3Retry = useCallback(() => {
    setCapturedCanvas(null);
    setStep(2);
  }, []);

  const handleConfirmData = useCallback(
    async (extractedData) => {
      if (!capturedCanvas || !documentType) return;

      setIsSaving(true);

      try {
        const docTypeInfo = DOCUMENT_TYPES[documentType] || {};

        const { data: docData } = await createDocument({
          variables: {
            input: {
              type: documentType,
              source: "SCAN",
            },
          },
        });

        const documentId = docData?.createDocument?.id;
        if (!documentId) throw new Error("No se pudo crear el documento");

        const blob = await optimizeForUpload(capturedCanvas, {
          maxWidth: 2560,
          maxHeight: 2560,
          quality: 0.95,
        });

        const cloudinaryResult = await uploadToCloudinary(blob, {
          folder: `documents/${documentType.toLowerCase()}`,
          tags: [documentType, documentId],
        });

        await addDocumentImage({
          variables: {
            input: {
              documentId,
              url: cloudinaryResult.url,
              publicId: cloudinaryResult.publicId,
              provider: "CLOUDINARY",
            },
          },
        });

        // Solo guardar datos extraídos si el documento tiene MRZ o si hay datos
        if (docTypeInfo.hasMRZ || Object.values(extractedData).some((v) => v)) {
          await upsertExtractedData({
            variables: {
              input: {
                documentId,
                ...extractedData,
              },
            },
          });
        }

        toast.success("¡Documento guardado exitosamente!");
        navigate(`/documents/${documentId}`);
      } catch (error) {
        console.error("Error saving document:", error);
        toast.error(error.message || "Error al guardar el documento");
      } finally {
        setIsSaving(false);
      }
    },
    [
      capturedCanvas,
      documentType,
      createDocument,
      addDocumentImage,
      upsertExtractedData,
      toast,
      navigate,
    ]
  );
  // const handleConfirmData = useCallback(
  //   async (extractedData) => {
  //     if (!capturedCanvas || !documentType) return;

  //     setIsSaving(true);

  //     try {
  //       const { data: docData } = await createDocument({
  //         variables: {
  //           input: {
  //             type: documentType,
  //             // source: "SCAN",
  //           },
  //         },
  //       });

  //       const documentId = docData?.createDocument?.id;
  //       if (!documentId) throw new Error("No se pudo crear el documento");

  //       const blob = await optimizeForUpload(capturedCanvas, {
  //         maxWidth: 2560,
  //         maxHeight: 2560,
  //         quality: 0.95,
  //       });

  //       const cloudinaryResult = await uploadToCloudinary(blob, {
  //         folder: `documents/${documentType.toLowerCase()}`,
  //         tags: [documentType, documentId],
  //       });

  //       await addDocumentImage({
  //         variables: {
  //           input: {
  //             documentId,
  //             url: cloudinaryResult.url,
  //             publicId: cloudinaryResult.publicId,
  //             provider: "CLOUDINARY",
  //           },
  //         },
  //       });

  //       await upsertExtractedData({
  //         variables: {
  //           input: {
  //             documentId,
  //             ...extractedData,
  //           },
  //         },
  //       });

  //       toast.success("¡Documento guardado exitosamente!");
  //       navigate(`/documents/${documentId}`);
  //     } catch (error) {
  //       console.error("Error saving document:", error);
  //       toast.error(error.message || "Error al guardar el documento");
  //     } finally {
  //       setIsSaving(false);
  //     }
  //   },
  //   [
  //     capturedCanvas,
  //     documentType,
  //     createDocument,
  //     addDocumentImage,
  //     upsertExtractedData,
  //     toast,
  //     navigate,
  //   ]
  // );

  const handleCancel = useCallback(() => {
    navigate("/documents");
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-50">
      {step === 1 && (
        <>
          <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-slate-200">
            <div className="max-w-lg mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={handleCancel}
                  className="p-2 -ml-2 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <svg
                    className="w-6 h-6 text-slate-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <h1 className="text-lg font-semibold text-slate-900">Nuevo Documento</h1>
                <span className="text-sm text-slate-500">Paso {step}/3</span>
              </div>
              <div className="mt-4 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-500 rounded-full transition-all duration-500"
                  style={{ width: `${(step / 3) * 100}%` }}
                />
              </div>
            </div>
          </header>
          <main className="max-w-lg mx-auto">
            <WizardStep1
              selectedType={documentType}
              onSelectType={setDocumentType}
              onNext={handleStep1Next}
              isCreating={false}
            />
          </main>
        </>
      )}

      {step === 2 && (
        <WizardStep2
          documentType={documentType}
          onCapture={handleStep2Capture}
          onCancel={handleCancel}
        />
      )}

      {step === 3 && (
        <WizardStep3
          documentType={documentType}
          capturedCanvas={capturedCanvas}
          onConfirm={handleConfirmData}
          onRetry={handleStep3Retry}
          onCancel={handleCancel}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}

export default NewDocumentPage;

// import React, { useState, useCallback } from "react";
// import { useNavigate } from "react-router-dom";
// import { useMutation } from "@apollo/client";
// import {
//   CREATE_DOCUMENT,
//   ADD_DOCUMENT_IMAGE,
//   UPSERT_DOCUMENT_EXTRACTED_DATA,
//   MY_DOCUMENTS,
// } from "../../graphql/documents/index.js";
// import { WizardStep1 } from "../../components/documents/WizardStep1.jsx";
// import { WizardStep2 } from "../../components/documents/WizardStep2";
// import { WizardStep3 } from "../../components/documents/WizardStep3";
// import { useToast } from "../../components/ui/Toast";
// import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
// import DashboardNavbar from "examples/Navbars/DashboardNavbar";
// import Card from "@mui/material/Card";

// // Componentes adicionales
// import SoftBox from "components/SoftBox";
// import SoftTypography from "components/SoftTypography";

// // Imágenes
// /**
//  * NewDocumentPage - Wizard para crear nuevo documento con escaneo automático
//  */
// function NewDocumentPage() {
//   const navigate = useNavigate();
//   const toast = useToast();

//   // Estado del wizard
//   const [step, setStep] = useState(1);
//   const [documentType, setDocumentType] = useState(null);
//   const [documentId, setDocumentId] = useState(null);
//   const [capturedCanvas, setCapturedCanvas] = useState(null);
//   const [cloudinaryResult, setCloudinaryResult] = useState(null);

//   // Mutations
//   const [createDocument, { loading: creatingDocument }] = useMutation(CREATE_DOCUMENT, {
//     refetchQueries: [{ query: MY_DOCUMENTS }],
//   });

//   const [addDocumentImage, { loading: addingImage }] = useMutation(ADD_DOCUMENT_IMAGE);

//   const [upsertExtractedData, { loading: savingData }] = useMutation(
//     UPSERT_DOCUMENT_EXTRACTED_DATA,
//     {
//       refetchQueries: [{ query: MY_DOCUMENTS }],
//     }
//   );

//   // Paso 1: Seleccionar tipo y crear documento
//   const handleStep1Next = useCallback(async () => {
//     if (!documentType) return;

//     try {
//       const { data } = await createDocument({
//         variables: {
//           input: {
//             type: documentType,
//             // source: "SCAN",
//           },
//         },
//       });

//       if (data?.createDocument?.id) {
//         setDocumentId(data.createDocument.id);
//         setStep(2);
//       }
//     } catch (error) {
//       console.error("Error creating document:", error);
//       toast.error("Error al crear el documento");
//     }
//   }, [documentType, createDocument, toast]);

//   // Paso 2: Agregar imagen después de captura
//   const handleAddImage = useCallback(
//     async (imageData) => {
//       if (!documentId) return;

//       try {
//         await addDocumentImage({
//           variables: {
//             input: {
//               documentId,
//               url: imageData.url,
//               publicId: imageData.publicId,
//               provider: imageData.provider || "CLOUDINARY",
//             },
//           },
//         });
//       } catch (error) {
//         console.error("Error adding image:", error);
//         throw error; // Re-throw para que WizardStep2 maneje el error
//       }
//     },
//     [documentId, addDocumentImage]
//   );

//   // Paso 2: Captura completa
//   const handleCaptureComplete = useCallback((canvas, cloudinary) => {
//     setCapturedCanvas(canvas);
//     setCloudinaryResult(cloudinary);
//     setStep(3);
//   }, []);

//   // Paso 3: Confirmar datos extraídos
//   const handleConfirmData = useCallback(
//     async (extractedData) => {
//       if (!documentId) return;

//       try {
//         await upsertExtractedData({
//           variables: {
//             input: {
//               documentId,
//               ...extractedData,
//             },
//           },
//         });

//         toast.success("¡Documento guardado exitosamente!");
//         navigate(`/documents/${documentId}`);
//       } catch (error) {
//         console.error("Error saving extracted data:", error);
//         toast.error("Error al guardar los datos");
//       }
//     },
//     [documentId, upsertExtractedData, toast, navigate]
//   );

//   // Reintentar escaneo
//   const handleRetry = useCallback(() => {
//     setCapturedCanvas(null);
//     setCloudinaryResult(null);
//     setStep(2);
//   }, []);

//   // Cancelar wizard
//   const handleCancel = useCallback(() => {
//     // Si ya creamos el documento, tal vez deberíamos eliminarlo
//     // Por ahora solo navegamos atrás
//     navigate("/documents");
//   }, [navigate]);

//   // Render basado en paso actual
//   return (
//     <DashboardLayout>
//       <DashboardNavbar />
//       <Card className="text">
//         <SoftBox p={2}>
//           <div className="min-h-screen ">
//             {/* Header con progreso (solo en paso 1) */}
//             {step === 1 && (
//               <header className="sticky top-0 z-40  backdrop-blur-sm border-b border-slate-800">
//                 <div className="max-w-lg mx-auto px-4 py-4">
//                   <div className="flex items-center justify-between">
//                     <button
//                       onClick={handleCancel}
//                       className="p-2 -ml-2 rounded-lg hover:bg-slate-800 transition-colors"
//                     >
//                       <svg
//                         className="w-6 h-6 text-slate-400"
//                         fill="none"
//                         viewBox="0 0 24 24"
//                         stroke="currentColor"
//                       >
//                         <path
//                           strokeLinecap="round"
//                           strokeLinejoin="round"
//                           strokeWidth={2}
//                           d="M15 19l-7-7 7-7"
//                         />
//                       </svg>
//                     </button>

//                     <h1 className="text-lg font-medium text-black">Nuevo Documento</h1>

//                     <span className="text-sm text-slate-500">Paso {step}/3</span>
//                   </div>

//                   {/* Barra de progreso */}
//                   <div className="mt-4 h-1 bg-slate-800 rounded-full overflow-hidden">
//                     <div
//                       className="h-full bg-primary-500 rounded-full transition-all duration-500"
//                       style={{ width: `${(step / 3) * 100}%` }}
//                     />
//                   </div>
//                 </div>
//               </header>
//             )}

//             {/* Contenido del paso actual */}
//             <main className="max-w-lg mx-auto">
//               {step === 1 && (
//                 <WizardStep1
//                   selectedType={documentType}
//                   onSelectType={setDocumentType}
//                   onNext={handleStep1Next}
//                   isCreating={creatingDocument}
//                 />
//               )}

//               {step === 2 && (
//                 <WizardStep2
//                   documentId={documentId}
//                   documentType={documentType}
//                   onCapture={handleCaptureComplete}
//                   onCancel={handleCancel}
//                   onAddImage={handleAddImage}
//                   isUploading={addingImage}
//                 />
//               )}

//               {step === 3 && (
//                 <WizardStep3
//                   documentId={documentId}
//                   documentType={documentType}
//                   capturedCanvas={capturedCanvas}
//                   cloudinaryResult={cloudinaryResult}
//                   onConfirm={handleConfirmData}
//                   onRetry={handleRetry}
//                   onCancel={handleCancel}
//                   isSaving={savingData}
//                 />
//               )}
//             </main>
//           </div>
//         </SoftBox>
//       </Card>
//     </DashboardLayout>
//   );
// }

// export default NewDocumentPage;
