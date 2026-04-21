import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { Modal } from "components/ui/Modal";

const ALL_GRADES = [
  "Tercero Primaria",
  "Cuarto Primaria",
  "Quinto Primaria",
  "Sexto Primaria",
  "Septimo",
  "Octavo",
  "Noveno",
  "Décimo",
  "Undécimo",
  "Duodécimo",
];

// ─── Grades multi-select with checkboxes ──────────────────────────────────────

function GradesSelect({ selected, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function toggle(grade) {
    if (selected.includes(grade)) {
      onChange(selected.filter((g) => g !== grade));
    } else {
      onChange([...selected, grade]);
    }
  }

  function toggleAll() {
    if (selected.length === ALL_GRADES.length) {
      onChange([]);
    } else {
      onChange([...ALL_GRADES]);
    }
  }

  const label =
    selected.length === 0
      ? "Todos los niveles"
      : selected.length === ALL_GRADES.length
      ? "Todos los niveles"
      : selected.length === 1
      ? selected[0]
      : `${selected.length} niveles seleccionados`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <span className={selected.length === 0 ? "text-gray-400" : "text-gray-900"}>{label}</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {/* Select all */}
          <button
            type="button"
            onClick={toggleAll}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 border-b border-gray-100 transition-colors"
          >
            <span
              className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                selected.length === ALL_GRADES.length
                  ? "bg-blue-600 border-blue-600"
                  : selected.length > 0
                  ? "bg-blue-100 border-blue-400"
                  : "border-gray-300"
              }`}
            >
              {selected.length === ALL_GRADES.length && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {selected.length > 0 && selected.length < ALL_GRADES.length && (
                <span className="w-2 h-0.5 bg-blue-600 rounded" />
              )}
            </span>
            Seleccionar todos
          </button>

          <div className="max-h-48 overflow-y-auto py-1">
            {ALL_GRADES.map((grade) => {
              const checked = selected.includes(grade);
              return (
                <button
                  key={grade}
                  type="button"
                  onClick={() => toggle(grade)}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-gray-800 hover:bg-blue-50 transition-colors"
                >
                  <span
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      checked ? "bg-blue-600 border-blue-600" : "border-gray-300"
                    }`}
                  >
                    {checked && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  {grade}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

GradesSelect.propTypes = {
  selected: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
};

// ─── Subject Modal ─────────────────────────────────────────────────────────────

function SubjectModal({ isOpen, onClose, mode, subject, onSave, loading }) {
  const [form, setForm] = useState({ name: "", code: "", grades: [], bands: "", isActive: true });

  useEffect(() => {
    if (isOpen && mode === "edit" && subject) {
      setForm({
        name: subject.name || "",
        code: subject.code || "",
        grades: subject.grades || [],
        bands: (subject.bands || []).join(", "),
        isActive: subject.isActive !== false,
      });
    } else if (isOpen) {
      setForm({ name: "", code: "", grades: [], bands: "", isActive: true });
    }
  }, [isOpen, mode, subject]);

  function handleSubmit(e) {
    e.preventDefault();
    const input = {
      name: form.name.trim(),
      code: form.code.trim() || undefined,
      isActive: form.isActive,
      grades: form.grades,
      bands: form.bands ? form.bands.split(",").map((b) => b.trim()).filter(Boolean) : [],
    };
    onSave(subject?.id, input);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "edit" ? "Editar materia" : "Nueva materia"}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ej: Matemáticas"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Código (opcional)</label>
          <input
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="MAT-101"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Niveles</label>
          <GradesSelect
            selected={form.grades}
            onChange={(grades) => setForm((f) => ({ ...f, grades }))}
          />
          <p className="text-xs text-gray-400 mt-1">
            Sin selección = aplica a todos los niveles
          </p>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Bandas (opcional)</label>
          <input
            value={form.bands}
            onChange={(e) => setForm((f) => ({ ...f, bands: e.target.value }))}
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Banda A, Banda B"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="subjectActive"
            checked={form.isActive}
            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            className="w-4 h-4 rounded text-blue-500"
          />
          <label htmlFor="subjectActive" className="text-sm text-gray-700">
            Materia activa
          </label>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-500 disabled:opacity-50 transition-colors"
          >
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

SubjectModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  mode: PropTypes.string,
  subject: PropTypes.object,
  onSave: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

// ─── Period Modal ──────────────────────────────────────────────────────────────

function PeriodModal({ isOpen, onClose, mode, period, onSave, loading }) {
  const [form, setForm] = useState({
    name: "",
    year: new Date().getFullYear(),
    order: 1,
    isActive: true,
  });

  useEffect(() => {
    if (isOpen && mode === "edit" && period) {
      setForm({
        name: period.name || "",
        year: period.year || new Date().getFullYear(),
        order: period.order || 1,
        isActive: period.isActive !== false,
      });
    } else if (isOpen) {
      setForm({ name: "", year: new Date().getFullYear(), order: 1, isActive: true });
    }
  }, [isOpen, mode, period]);

  function handleSubmit(e) {
    e.preventDefault();
    const input = {
      name: form.name.trim(),
      year: parseInt(form.year),
      order: parseInt(form.order),
      isActive: form.isActive,
    };
    onSave(period?.id, input);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "edit" ? "Editar período" : "Nuevo período"}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="I Trimestre"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Año *</label>
            <input
              type="number"
              value={form.year}
              onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Orden *</label>
            <input
              type="number"
              min="1"
              value={form.order}
              onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="periodActive"
            checked={form.isActive}
            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            className="w-4 h-4 rounded text-blue-500"
          />
          <label htmlFor="periodActive" className="text-sm text-gray-700">
            Período activo
          </label>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-500 disabled:opacity-50 transition-colors"
          >
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

PeriodModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  mode: PropTypes.string,
  period: PropTypes.object,
  onSave: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

// ─── Main manager ─────────────────────────────────────────────────────────────

export function SubjectPeriodManager({
  subjects,
  periods,
  subjectModal,
  periodModal,
  openSubjectModal,
  closeSubjectModal,
  openPeriodModal,
  closePeriodModal,
  onCreateSubject,
  onUpdateSubject,
  onDeleteSubject,
  onCreatePeriod,
  onUpdatePeriod,
  creatingSubject,
  updatingSubject,
  deletingSubject,
  creatingPeriod,
  updatingPeriod,
}) {
  const [deleteModal, setDeleteModal] = useState({ open: false, subject: null });

  function openDeleteModal(subject) {
    setDeleteModal({ open: true, subject });
  }

  function closeDeleteModal() {
    setDeleteModal({ open: false, subject: null });
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        {/* Subjects */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Materias</h3>
            <button
              onClick={() => openSubjectModal("create")}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nueva
            </button>
          </div>
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {subjects.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">No hay materias</p>
            )}
            {subjects.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg"
              >
                <div>
                  <p className="text-sm text-gray-900 font-medium">{s.name}</p>
                  {s.grades?.length > 0 && (
                    <p className="text-xs text-gray-500">{s.grades.join(", ")}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${s.isActive ? "text-emerald-600" : "text-gray-400"}`}>
                    {s.isActive ? "Activa" : "Inactiva"}
                  </span>
                  <button
                    onClick={() => openSubjectModal("edit", s)}
                    className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors"
                    title="Editar materia"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => openDeleteModal(s)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                    title="Eliminar materia"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Periods */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Períodos</h3>
            <button
              onClick={() => openPeriodModal("create")}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo
            </button>
          </div>
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {periods.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">No hay períodos</p>
            )}
            {periods.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg"
              >
                <div>
                  <p className="text-sm text-gray-900 font-medium">{p.name}</p>
                  <p className="text-xs text-gray-500">
                    {p.year} · Orden {p.order}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${p.isActive ? "text-emerald-600" : "text-gray-400"}`}>
                    {p.isActive ? "Activo" : "Inactivo"}
                  </span>
                  <button
                    onClick={() => openPeriodModal("edit", p)}
                    className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modals */}
        <SubjectModal
          isOpen={subjectModal.open}
          onClose={closeSubjectModal}
          mode={subjectModal.mode}
          subject={subjectModal.subject}
          onSave={(id, input) => (id ? onUpdateSubject(id, input) : onCreateSubject(input))}
          loading={creatingSubject || updatingSubject}
        />
        <PeriodModal
          isOpen={periodModal.open}
          onClose={closePeriodModal}
          mode={periodModal.mode}
          period={periodModal.period}
          onSave={(id, input) => (id ? onUpdatePeriod(id, input) : onCreatePeriod(input))}
          loading={creatingPeriod || updatingPeriod}
        />
      </div>

      <Modal
        isOpen={deleteModal.open}
        onClose={closeDeleteModal}
        title="Eliminar materia"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            ¿Seguro que deseas eliminar la materia{" "}
            <span className="font-semibold text-gray-900">{deleteModal.subject?.name}</span>?
          </p>
          <p className="text-xs text-gray-400">
            Si la materia ya tiene evaluaciones registradas, el sistema bloqueará la eliminación y
            deberás dejarla inactiva.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={closeDeleteModal}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={deletingSubject}
              onClick={async () => {
                if (!deleteModal.subject?.id) return;
                await onDeleteSubject(deleteModal.subject.id);
                closeDeleteModal();
              }}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-500 disabled:opacity-50 transition-colors"
            >
              {deletingSubject ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

SubjectPeriodManager.propTypes = {
  subjects: PropTypes.array.isRequired,
  periods: PropTypes.array.isRequired,
  subjectModal: PropTypes.object.isRequired,
  periodModal: PropTypes.object.isRequired,
  openSubjectModal: PropTypes.func.isRequired,
  closeSubjectModal: PropTypes.func.isRequired,
  openPeriodModal: PropTypes.func.isRequired,
  closePeriodModal: PropTypes.func.isRequired,
  onCreateSubject: PropTypes.func.isRequired,
  onUpdateSubject: PropTypes.func.isRequired,
  onDeleteSubject: PropTypes.func.isRequired,
  onCreatePeriod: PropTypes.func.isRequired,
  onUpdatePeriod: PropTypes.func.isRequired,
  creatingSubject: PropTypes.bool,
  updatingSubject: PropTypes.bool,
  deletingSubject: PropTypes.bool,
  creatingPeriod: PropTypes.bool,
  updatingPeriod: PropTypes.bool,
};

export default SubjectPeriodManager;
