/* eslint-disable react/prop-types */
import { useState, useEffect, useRef } from "react";
import { MotorMetronomo } from "../../modules/practica/engine/MotorMetronomo";
import { PanelAfinador } from "./components/tuner/PanelAfinador";
import { PanelMetronomo } from "./components/metronome/PanelMetronomo.jsx";
import { PanelGuia } from "./components/guide/PanelGuia.jsx";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

/**
 * PracticaPage — Rediseño UI/UX
 * ─────────────────────────────────────────────────────────
 * Diagnóstico:
 * - Header con demasiada información compitiendo (icono + título + badge + subtítulo)
 * - Los tabs con rounded-t-lg crean una apariencia de pestaña "anticuada"
 * - bg-gray-50 en el fondo compite sutilmente con las cards blancas internas
 * - El fontFamily inline en style es redundante con Tailwind
 * - El tabpanel sin aria-labelledby rompe accesibilidad
 * - El sticky header no tiene backdrop-blur para cuando hay scroll
 *
 * Mejoras:
 * - Header simplificado: solo lo que el músico necesita ver en 1 segundo
 * - Ícono musical con más personalidad (fondo sutil con sombra interna)
 * - Tabs con línea de subrayado limpia, sin border-radius → más moderna
 * - Transición de tab con indicador animado
 * - backdrop-blur en el sticky header para scroll elegante
 * - aria-labelledby conectado a los tabs para A11y correcta
 * - bg-white en fondo principal → los cards internos tienen más respiro
 * - Lógica: intacta al 100%
 * ─────────────────────────────────────────────────────────
 */

const TABS = [
  {
    id: "afinador",
    label: "Afinador",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 016 0v8.25a3 3 0 01-3 3z" />
      </svg>
    ),
  },
  {
    id: "metronomo",
    label: "Metrónomo",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M12 3v1m0 16v1M5.636 5.636l.707.707m11.314 11.314.707.707M3 12h1m16 0h1M5.636 18.364l.707-.707M17.657 5.636l.707-.707" />
        <circle cx="12" cy="12" r="3" strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    id: "guia",
    label: "Guía",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
];

export default function PracticaPage({ userId = null }) {
  const [tab, setTab] = useState("afinador");
  const [a4, setA4] = useState(440);
  const motorRef = useRef(null);

  useEffect(() => {
    motorRef.current = new MotorMetronomo();
    return () => { motorRef.current?.destruir(); };
  }, []);

  return (
    <DashboardLayout>
      <DashboardNavbar />

      {/* Shell de la página */}
      <div className="min-h-screen bg-white">

        {/* ── HEADER ─────────────────────────────────────────── */}
        <div
          className="bg-white/90 border-b border-gray-200 sticky top-0 z-30"
          style={{ backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
        >
          <div className="max-w-3xl mx-auto px-5 sm:px-6">

            {/* Identidad de la herramienta */}
            <div className="flex items-center gap-3.5 pt-4 pb-3">
              {/* Ícono musical */}
              <div className="w-8 h-8 rounded-xl bg-gray-900 flex items-center justify-center flex-shrink-0 shadow-sm">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none" stroke="currentColor" strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
                </svg>
              </div>

              {/* Título */}
              <div className="min-w-0">
                <h1
                  className="text-sm font-bold text-gray-900 leading-tight tracking-tight"
                  style={{ fontFamily: "'Georgia', serif" }}
                >
                  Herramientas de práctica
                </h1>
                <p className="text-[11px] text-gray-400 leading-none mt-0.5 hidden sm:block">
                  Afinador · Metrónomo · Guía musical
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div
              className="flex gap-0"
              role="tablist"
              aria-label="Herramientas de práctica"
            >
              {TABS.map((t) => {
                const activo = tab === t.id;
                return (
                  <button
                    key={t.id}
                    id={`tab-${t.id}`}
                    role="tab"
                    aria-selected={activo}
                    aria-controls={`panel-${t.id}`}
                    onClick={() => setTab(t.id)}
                    className={`
                      relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold
                      border-b-2 transition-colors duration-150 select-none
                      ${activo
                        ? "border-gray-900 text-gray-900"
                        : "border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200"
                      }
                    `}
                  >
                    <span className={`transition-colors ${activo ? "text-gray-900" : "text-gray-400"}`}>
                      {t.icon}
                    </span>
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── CONTENIDO ──────────────────────────────────────── */}
        <div className="max-w-3xl mx-auto">

          {/* Afinador */}
          <div
            id="panel-afinador"
            role="tabpanel"
            aria-labelledby="tab-afinador"
            hidden={tab !== "afinador"}
          >
            {tab === "afinador" && (
              <PanelAfinador a4={a4} setA4={setA4} />
            )}
          </div>

          {/* Metrónomo */}
          <div
            id="panel-metronomo"
            role="tabpanel"
            aria-labelledby="tab-metronomo"
            hidden={tab !== "metronomo"}
            className="min-h-[calc(100vh-112px)] flex flex-col"
          >
            {tab === "metronomo" && (
              <PanelMetronomo motorRef={motorRef} userId={userId} />
            )}
          </div>

          {/* Guía */}
          <div
            id="panel-guia"
            role="tabpanel"
            aria-labelledby="tab-guia"
            hidden={tab !== "guia"}
          >
            {tab === "guia" && (
              <PanelGuia />
            )}
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}