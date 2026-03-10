/* eslint-disable react/prop-types */

/**
 * FormationDetailPage.jsx
 *
 * Loads an existing formation by ID and passes it to FormationBuilderPage in edit mode.
 */

import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useFormationDetail } from "./useFormations.js";
import FormationBuilderPage from "./FormationBuilderPage.jsx";

export default function FormationDetailPage() {
  const { formationId } = useParams();
  const navigate = useNavigate();
  const { formation, loading } = useFormationDetail(formationId);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400 text-sm">
        Cargando formación…
      </div>
    );
  }

  if (!formation) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <p className="text-slate-500 text-sm">Formación no encontrada.</p>
        <button
          onClick={() => navigate("/formations")}
          className="text-indigo-600 text-sm hover:underline"
        >
          ← Volver
        </button>
      </div>
    );
  }

  return <FormationBuilderPage formation={formation} />;
}
