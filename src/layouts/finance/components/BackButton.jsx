import { useNavigate } from "react-router-dom";

const BackButton = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center">
      <button
        type="button"
        onClick={() => navigate("/finance")}
        className="shrink-0 inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-2
               text-xs font-extrabold text-white hover:bg-black
               active:scale-95 transition-all shadow-sm"
        aria-label="Volver a Caja"
      >
        <span className="text-sm leading-none">←</span>
        <span>Caja</span>
      </button>
    </div>
  );
};

export default BackButton;
