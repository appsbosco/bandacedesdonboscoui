import { useEffect, useState } from "react";
import popupImage from "../assets/images/POP-UP.webp";

const STORAGE_KEY = "ins_popup_dismissed";

export default function INSPopupBanner() {
  const [visible, setVisible] = useState(false);
  const [neverShow, setNeverShow] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    if (neverShow) {
      localStorage.setItem(STORAGE_KEY, "true");
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && handleClose()}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        backdropFilter: "blur(2px)",
        animation: "bcdbFadeIn 0.25s ease",
      }}
    >
      <style>{`
        @keyframes bcdbFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes bcdbSlideUp { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>

      <div
        style={{
          position: "relative",
          animation: "bcdbSlideUp 0.3s ease",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <button
          onClick={handleClose}
          aria-label="Cerrar"
          style={{
            position: "absolute",
            top: "-12px",
            right: "-12px",
            zIndex: 10,
            background: "rgba(255,255,255,0.9)",
            border: "none",
            borderRadius: "50%",
            width: "32px",
            height: "32px",
            cursor: "pointer",
            color: "#111",
            fontSize: "18px",
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          }}
        >
          ×
        </button>

        <img
          src={popupImage}
          alt="Banda CEDES Don Bosco - Tournament of Roses 2027"
          style={{
            width: "100%",
            maxWidth: "380px",
            maxHeight: "85vh",
            objectFit: "contain",
            borderRadius: "12px",
            display: "block",
          }}
          loading="eager"
        />

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <input
            type="checkbox"
            id="ins-no-show"
            checked={neverShow}
            onChange={(e) => setNeverShow(e.target.checked)}
            style={{ width: "14px", height: "14px", cursor: "pointer", accentColor: "#f5a623" }}
          />
          <label
            htmlFor="ins-no-show"
            style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", cursor: "pointer" }}
          >
            No mostrar de nuevo
          </label>
        </div>
      </div>
    </div>
  );
}
