import React, { useState } from "react";
import { useMutation } from "@apollo/client";
import { CREATE_DOCUMENT } from "../../graphql/documents.gql";
import ScannerModal from "./ScannerModal";
import { useNavigate } from "react-router-dom";

export default function DocumentFlowPage() {
  const navigate = useNavigate();
  const [createDocument, { loading }] = useMutation(CREATE_DOCUMENT);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [currentDocType, setCurrentDocType] = useState(null);
  const [currentDocId, setCurrentDocId] = useState(null);

  const handleStartScan = async (docType) => {
    try {
      // Crear documento vacío
      const { data } = await createDocument({
        variables: {
          input: {
            type: docType,
            source: "OCR",
          },
        },
      });

      setCurrentDocId(data.createDocument._id);
      setCurrentDocType(docType);
      setScannerOpen(true);
    } catch (error) {
      console.error("Error creating document:", error);
      alert("Error al crear documento. Intenta de nuevo.");
    }
  };

  const handleScanComplete = (documentId) => {
    setScannerOpen(false);
    setCurrentDocId(null);
    setCurrentDocType(null);
    // Redirigir a detalle del documento o success page
    navigate(`/documents/${documentId}`);
  };

  const handleScanCancel = () => {
    setScannerOpen(false);
    setCurrentDocId(null);
    setCurrentDocType(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Document Vault</h1>
          <p className="text-gray-600">Escanea y almacena tus documentos de forma segura</p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Passport Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow">
            <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6 mx-auto">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Pasaporte</h2>
            <p className="text-gray-600 mb-6 text-center">
              Escanea tu pasaporte automáticamente con detección de MRZ
            </p>
            <button
              onClick={() => handleStartScan("PASSPORT")}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-4 px-6 rounded-xl transition-colors shadow-lg hover:shadow-xl"
            >
              {loading ? "Creando..." : "Escanear Pasaporte"}
            </button>
          </div>

          {/* Visa Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow">
            <div className="flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-6 mx-auto">
              <svg
                className="w-8 h-8 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Visa</h2>
            <p className="text-gray-600 mb-6 text-center">
              Escanea tu visa con detección inteligente de texto
            </p>
            <button
              onClick={() => handleStartScan("VISA")}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold py-4 px-6 rounded-xl transition-colors shadow-lg hover:shadow-xl"
            >
              {loading ? "Creando..." : "Escanear Visa"}
            </button>
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            Cómo funciona
          </h3>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">1.</span>
              <span>Selecciona el tipo de documento que deseas escanear</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">2.</span>
              <span>El sistema te guiará para alinear perfectamente tu documento</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">3.</span>
              <span>La captura es automática cuando la foto está perfecta</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">4.</span>
              <span>Revisa y confirma la información extraída automáticamente</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Scanner Modal */}
      {scannerOpen && (
        <ScannerModal
          documentId={currentDocId}
          documentType={currentDocType}
          onComplete={handleScanComplete}
          onCancel={handleScanCancel}
        />
      )}
    </div>
  );
}
