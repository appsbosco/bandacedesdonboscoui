import React, { useState, useEffect } from "react";
import { useMutation } from "@apollo/client";
import { useNavigate } from "react-router-dom";
import {
  CREATE_DOCUMENT,
  ADD_DOCUMENT_IMAGE,
  UPSERT_DOCUMENT_EXTRACTED_DATA,
  SET_DOCUMENT_STATUS,
  MY_DOCUMENTS,
} from "../../graphql/documents/documents.gql";
import { Button } from "../ui/Button";
import { Select } from "../ui/Select";
import { Input } from "../ui/Input";
import { DocumentImageUploader } from "./DocumentImageUploader";
import { DocumentForm } from "./DocumentForm";
import { useToast } from "../ui/Toast";
import { PassportScanner } from "./PassportScanner";
import PropTypes from "prop-types";

const STEPS = {
  TYPE: 0,
  IMAGES: 1,
  DATA: 2,
};

console.log("CLOUDINARY CONFIG:", {
  cloudName: process.env.REACT_APP_CLOUDINARY_CLOUD_NAME,
  uploadPreset: process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET,
});

export function DocumentWizard() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [currentStep, setCurrentStep] = useState(STEPS.TYPE);
  const [documentData, setDocumentData] = useState({
    type: "",
    source: "MANUAL",
    notes: "",
    retentionUntil: null,
  });
  const [createdDocument, setCreatedDocument] = useState(null);

  const [createDocument, { loading: creating }] = useMutation(CREATE_DOCUMENT, {
    refetchQueries: [{ query: MY_DOCUMENTS }],
    onCompleted: (data) => {
      setCreatedDocument(data.createDocument);
      setCurrentStep(STEPS.IMAGES);
      addToast("Documento creado exitosamente", "success");
    },
    onError: (error) => {
      addToast(`Error: ${error.message}`, "error");
    },
  });

  const [addImage] = useMutation(ADD_DOCUMENT_IMAGE, {
    onError: (error) => {
      addToast(`Error al agregar imagen: ${error.message}`, "error");
    },
  });

  const [upsertData, { loading: saving }] = useMutation(UPSERT_DOCUMENT_EXTRACTED_DATA, {
    onCompleted: () => {
      addToast("Datos guardados exitosamente", "success");
      navigate(`/documents/${createdDocument._id}`);
    },
    onError: (error) => {
      addToast(`Error: ${error.message}`, "error");
    },
  });

  const [setStatus] = useMutation(SET_DOCUMENT_STATUS);

  const handleStepOne = async () => {
    if (!documentData.type) {
      addToast("Por favor selecciona el tipo de documento", "error");
      return;
    }

    await createDocument({
      variables: {
        input: {
          type: documentData.type,
          source: documentData.source,
          notes: documentData.notes || undefined,
          retentionUntil: documentData.retentionUntil || undefined,
        },
      },
    });
  };

  const handleImageUploaded = async (imageData) => {
    if (!createdDocument) return;

    await addImage({
      variables: {
        input: {
          documentId: createdDocument._id,
          url: imageData.url,
          publicId: imageData.publicId,
          provider: imageData.provider,
        },
      },
    });
  };

  const handleStepTwo = () => {
    setCurrentStep(STEPS.DATA);
  };

  const handleStepThree = async (extractedData) => {
    if (!createdDocument) return;

    await upsertData({
      variables: {
        input: {
          documentId: createdDocument._id,
          ...extractedData,
        },
      },
    });

    // Opcionalmente actualizar status
    await setStatus({
      variables: {
        documentId: createdDocument._id,
        status: "DATA_CAPTURED",
      },
    });
  };

  const handleBack = () => {
    if (currentStep > STEPS.TYPE) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCancel = () => {
    if (window.confirm("¿Estás seguro? Se perderá el progreso.")) {
      navigate("/documents");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Agregar Nuevo Documento</h1>
        <p className="text-gray-600 mt-1">Completa los pasos para registrar tu pasaporte o visa</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {["Tipo", "Imágenes", "Datos"].map((label, index) => (
            <React.Fragment key={index}>
              <div className="flex items-center">
                <div
                  className={`
                  flex items-center justify-center w-10 h-10 rounded-full font-semibold
                  ${index <= currentStep ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-600"}
                `}
                >
                  {index < currentStep ? "✓" : index + 1}
                </div>
                <span
                  className={`ml-2 text-sm font-medium ${
                    index <= currentStep ? "text-gray-900" : "text-gray-500"
                  }`}
                >
                  {label}
                </span>
              </div>
              {index < 2 && (
                <div
                  className={`flex-1 h-1 mx-4 ${
                    index < currentStep ? "bg-indigo-600" : "bg-gray-200"
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
        {currentStep === STEPS.TYPE && (
          <StepOne
            data={documentData}
            onChange={setDocumentData}
            onNext={handleStepOne}
            onCancel={handleCancel}
            loading={creating}
          />
        )}

        {currentStep === STEPS.IMAGES && (
          <StepTwo
            document={createdDocument}
            onImageUploaded={handleImageUploaded}
            onNext={handleStepTwo}
            onBack={handleBack}
            addToast={addToast}
          />
        )}

        {currentStep === STEPS.DATA && (
          <StepThree
            documentType={createdDocument?.type}
            onSubmit={handleStepThree}
            onBack={handleBack}
            loading={saving}
          />
        )}
      </div>
    </div>
  );
}

// Step Components
function StepOne({ data, onChange, onNext, onCancel, loading }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Paso 1: Tipo de Documento</h2>
        <p className="text-gray-600 mb-6">Selecciona el tipo de documento que deseas registrar</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => onChange({ ...data, type: "PASSPORT" })}
          className={`
            p-6 rounded-lg border-2 transition-all
            ${
              data.type === "PASSPORT"
                ? "border-indigo-600 bg-indigo-50"
                : "border-gray-200 hover:border-gray-300"
            }
          `}
        >
          <div className="text-4xl mb-2">🛂</div>
          <div className="font-semibold text-gray-900">Pasaporte</div>
          <div className="text-sm text-gray-600 mt-1">
            Documento de identidad para viajes internacionales
          </div>
        </button>

        <button
          onClick={() => onChange({ ...data, type: "VISA" })}
          className={`
            p-6 rounded-lg border-2 transition-all
            ${
              data.type === "VISA"
                ? "border-indigo-600 bg-indigo-50"
                : "border-gray-200 hover:border-gray-300"
            }
          `}
        >
          <div className="text-4xl mb-2">✈️</div>
          <div className="font-semibold text-gray-900">Visa</div>
          <div className="text-sm text-gray-600 mt-1">Permiso de entrada a un país específico</div>
        </button>
      </div>

      <Select
        label="Fuente de Datos"
        value={data.source}
        onChange={(e) => onChange({ ...data, source: e.target.value })}
        options={[
          { label: "Manual", value: "MANUAL" },
          { label: "OCR (Futuro)", value: "OCR" },
        ]}
      />

      <Input
        label="Notas (Opcional)"
        value={data.notes}
        onChange={(e) => onChange({ ...data, notes: e.target.value })}
        placeholder="Agrega cualquier nota o comentario sobre este documento"
      />

      <Input
        label="Retención hasta (Opcional)"
        type="date"
        value={data.retentionUntil}
        onChange={(e) => onChange({ ...data, retentionUntil: e.target.value })}
        helperText="Fecha límite para conservar este documento. Después se puede eliminar."
      />

      <div className="flex gap-3 justify-end pt-4 border-t">
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={onNext} disabled={!data.type} loading={loading}>
          Continuar
        </Button>
      </div>
    </div>
  );
}

function StepTwo({ document, onImageUploaded, onNext, onBack }) {
  const [mode, setMode] = useState(null); // null | 'scan' | 'upload'
  const [showScanner, setShowScanner] = useState(false);

  // En StepTwo, dentro de handleScanComplete:
  const { addToast } = useToast(); // Debe estar accesible

  const handleScanComplete = async (capturedData) => {
    setShowScanner(false);

    // Validar env vars
    if (
      !process.env.REACT_APP_CLOUDINARY_CLOUD_NAME ||
      !process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET
    ) {
      addToast("❌ Error: Variables de Cloudinary no configuradas", "error");
      setMode(null);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", capturedData.blob);
      formData.append("upload_preset", process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET);
      formData.append("folder", "documents");

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );

      if (!response.ok) throw new Error("Error subiendo a Cloudinary");

      const data = await response.json();

      await onImageUploaded({
        url: data.secure_url,
        publicId: data.public_id,
        provider: "CLOUDINARY",
      });

      addToast("✅ Documento guardado exitosamente", "success");
      onNext();
    } catch (error) {
      console.error("Upload error:", error);
      addToast(`❌ ${error.message}`, "error");
      setMode(null);
    }
  };

  const handleScanCancel = () => {
    setShowScanner(false);
    setMode(null);
  };

  // Scanner en fullscreen
  if (showScanner) {
    return (
      <PassportScanner
        documentType={document?.type}
        onCapture={handleScanComplete}
        onCancel={handleScanCancel}
      />
    );
  }

  // Selección de método
  if (!mode) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Paso 2: Capturar Documento</h2>
          <p className="text-gray-600 mb-6">
            Escanea tu {document?.type === "PASSPORT" ? "pasaporte" : "visa"} con detección
            automática
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* Opción de escaneo profesional */}
          <button
            type="button"
            onClick={() => {
              setMode("scan");
              setShowScanner(true);
            }}
            className="relative overflow-hidden p-8 rounded-xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 hover:border-indigo-400 transition-all group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-200 rounded-full -mr-16 -mt-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <div className="relative">
              <div className="text-5xl mb-3">📸</div>
              <div className="font-bold text-xl text-gray-900 mb-2">Escaneo Inteligente</div>
              <div className="text-sm text-gray-600">
                Detección automática • Captura perfecta • Sin esfuerzo
              </div>
              <div className="mt-4 inline-flex items-center gap-2 text-indigo-600 font-medium">
                <span>Recomendado</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </button>

          {/* Opción de subida manual */}
          <button
            type="button"
            onClick={() => setMode("upload")}
            className="p-6 rounded-xl border-2 border-gray-200 hover:border-gray-400 transition-all"
          >
            <div className="text-4xl mb-2">📁</div>
            <div className="font-semibold text-gray-900 mb-1">Subir desde Galería</div>
            <div className="text-sm text-gray-600">Selecciona una foto existente</div>
          </button>
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button variant="secondary" onClick={onBack}>
            Atrás
          </Button>
        </div>
      </div>
    );
  }

  // Modo upload tradicional
  if (mode === "upload") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Subir Imágenes</h2>
        </div>

        <DocumentImageUploader
          documentId={document?._id}
          onImageUploaded={onImageUploaded}
          existingImages={document?.images || []}
        />

        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button variant="secondary" onClick={() => setMode(null)}>
            Cambiar Método
          </Button>
          <Button onClick={onNext}>Continuar</Button>
        </div>
      </div>
    );
  }
}

function StepThree({ documentType, onSubmit, onBack, loading }) {
  // Cargar datos MRZ si existen
  const [initialData, setInitialData] = useState({});

  useEffect(() => {
    const mrzDataStr = window.sessionStorage.getItem("mrzData");
    if (mrzDataStr) {
      const mrzData = JSON.parse(mrzDataStr);
      setInitialData({
        fullName: mrzData.fullName,
        givenNames: mrzData.givenNames,
        surname: mrzData.surname,
        nationality: mrzData.nationality,
        issuingCountry: mrzData.issuingCountry,
        passportNumber: mrzData.passportNumber,
        dateOfBirth: mrzData.dateOfBirth,
        sex: mrzData.sex,
        expirationDate: mrzData.expirationDate,
        mrzRaw: mrzData.mrzRaw,
      });

      // Limpiar después de cargar
      window.sessionStorage.removeItem("mrzData");
    }
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Paso 3: Datos del Documento</h2>
        <p className="text-gray-600 mb-6">
          {Object.keys(initialData).length > 0
            ? "Datos detectados automáticamente. Verifica y corrige si es necesario."
            : "Completa la información del documento"}
        </p>
      </div>

      <DocumentForm
        documentType={documentType}
        initialData={initialData}
        onSubmit={onSubmit}
        submitLabel={loading ? "Guardando..." : "Finalizar"}
      />

      <div className="flex gap-3 justify-start pt-4 border-t">
        <Button variant="secondary" onClick={onBack} disabled={loading}>
          Atrás
        </Button>
      </div>
    </div>
  );
}

const documentShape = PropTypes.shape({
  _id: PropTypes.string.isRequired,
  type: PropTypes.oneOf(["PASSPORT", "VISA"]).isRequired,
  images: PropTypes.arrayOf(
    PropTypes.shape({
      url: PropTypes.string.isRequired,
      publicId: PropTypes.string,
      provider: PropTypes.string,
      uploadedAt: PropTypes.string,
    })
  ),
});

StepOne.propTypes = {
  data: PropTypes.shape({
    type: PropTypes.oneOf(["PASSPORT", "VISA"]),
    source: PropTypes.string,
    notes: PropTypes.string,
    retentionUntil: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.instanceOf(Date),
      PropTypes.oneOf([null]),
    ]),
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

StepTwo.propTypes = {
  document: documentShape,
  onImageUploaded: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
};

StepThree.propTypes = {
  documentType: PropTypes.oneOf(["PASSPORT", "VISA"]).isRequired,
  onSubmit: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  addToast: PropTypes.func.isRequired,
};
