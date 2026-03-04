import PropTypes from "prop-types";

export function DeleteConfirmModal({ open, event, onClose, onConfirm }) {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-6">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                />
              </svg>
            </div>

            <h3 className="text-base font-bold text-slate-900 text-center mb-1">Eliminar evento</h3>

            <p className="text-sm text-slate-500 text-center">
              ¿Estás seguro de que querés eliminar{" "}
              <strong className="text-slate-700">&quot;{event?.title}&quot;</strong>? Esta acción no
              se puede deshacer.
            </p>
          </div>

          <div className="px-6 pb-6 flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex-1 text-sm font-semibold text-slate-700 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>

            <button
              onClick={onConfirm}
              className="flex-1 text-sm font-semibold text-white bg-red-600 py-2.5 rounded-xl hover:bg-red-700 transition-colors"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

DeleteConfirmModal.propTypes = {
  open: PropTypes.bool.isRequired,
  event: PropTypes.shape({
    title: PropTypes.string,
  }),
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};

export default DeleteConfirmModal;
