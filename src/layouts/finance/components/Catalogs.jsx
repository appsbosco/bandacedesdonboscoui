/**
 * CatalogsPage — /finance/catalogs
 * CRUD de categorías de egreso y actividades/campañas.
 */
import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import PropTypes from "prop-types";

import { GET_CATEGORIES, GET_ACTIVITIES } from "graphql/queries/finance";
import {
  CREATE_CATEGORY,
  CREATE_ACTIVITY,
  TOGGLE_CATEGORY_ACTIVE,
  TOGGLE_ACTIVITY_ACTIVE,
} from "graphql/mutations/finance";
import { useNotice } from "../../../hooks/useFinance";
import { Notice, Skeleton } from "../components/FinanceAtoms";

// ─── AddForm ─────────────────────────────────────────────────────────────────

const AddForm = ({ onSubmit, loading, placeholder }) => {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const nameRef = useRef(null);

  const handle = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), code: code.trim() || undefined });
    setName("");
    setCode("");
    setTimeout(() => nameRef.current?.focus(), 80);
  };

  return (
    <form onSubmit={handle} className="flex flex-col sm:flex-row gap-2">
      <input
        ref={nameRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={placeholder}
        className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
        required
      />
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Código (opcional)"
        className="w-28 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
      />
      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="px-5 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-sm font-bold transition-all disabled:opacity-40 active:scale-95"
      >
        {loading ? "…" : "Agregar"}
      </button>
    </form>
  );
};

// ─── CatalogItem ──────────────────────────────────────────────────────────────

const CatalogItem = ({ item, onToggle, loading }) => (
  <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
    <div className="min-w-0">
      <p className="text-sm font-semibold text-slate-900">{item.name}</p>
      {item.code && <p className="text-xs text-slate-400 mt-0.5">Código: {item.code}</p>}
    </div>
    <div className="flex items-center gap-3 shrink-0">
      <span
        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
          item.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
        }`}
      >
        {item.isActive ? "Activa" : "Inactiva"}
      </span>
      <button
        onClick={() => onToggle(item.id)}
        disabled={loading}
        className={`text-xs font-semibold transition-colors disabled:opacity-40 ${
          item.isActive
            ? "text-slate-400 hover:text-red-500"
            : "text-emerald-600 hover:text-emerald-700"
        }`}
      >
        {item.isActive ? "Desactivar" : "Activar"}
      </button>
    </div>
  </div>
);

// ─── CategoriesSection ────────────────────────────────────────────────────────

const CategoriesSection = () => {
  const [notice, showNotice] = useNotice();
  const [showAll, setShowAll] = useState(false);

  const { data, loading } = useQuery(GET_CATEGORIES);

  const [createCat, { loading: creating }] = useMutation(CREATE_CATEGORY, {
    refetchQueries: [{ query: GET_CATEGORIES }],
    onCompleted: () => showNotice("success", "Categoría creada ✓"),
    onError: (e) => showNotice("error", e.message),
  });

  const [toggleCat, { loading: toggling }] = useMutation(TOGGLE_CATEGORY_ACTIVE, {
    refetchQueries: [{ query: GET_CATEGORIES }],
    onError: (e) => showNotice("error", e.message),
  });

  const categories = data?.categories || [];
  const visible = showAll ? categories : categories.filter((c) => c.isActive);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Categorías de egreso</h2>
          <p className="text-xs text-slate-400 mt-0.5">Clasificá los gastos de la banda</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-400">{categories.length} total</span>
          <button
            onClick={() => setShowAll((v) => !v)}
            className="text-xs text-rose-700 font-semibold hover:underline"
          >
            {showAll ? "Ver activas" : "Ver todas"}
          </button>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <Notice notice={notice} />
        <AddForm
          onSubmit={(input) => createCat({ variables: { input } })}
          loading={creating}
          placeholder="Ej: Alimentación, Transporte, Uniformes…"
        />

        <div>
          {loading && <Skeleton />}
          {!loading && visible.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-2xl mb-1">🗂️</p>
              <p className="text-sm font-semibold text-slate-600">Sin categorías</p>
              <p className="text-xs text-slate-400 mt-1">
                Agregá una categoría para clasificar gastos.
              </p>
            </div>
          )}
          {!loading &&
            visible.map((cat) => (
              <CatalogItem
                key={cat.id}
                item={cat}
                onToggle={(id) => toggleCat({ variables: { id } })}
                loading={toggling}
              />
            ))}
        </div>
      </div>

      {/* Tip */}
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
        <p className="text-xs text-slate-400">
          💡 La categoría se guarda en cada egreso. Desactivarla no afecta registros anteriores.
        </p>
      </div>
    </div>
  );
};

// ─── ActivitiesSection ────────────────────────────────────────────────────────

const ActivitiesSection = () => {
  const [notice, showNotice] = useNotice();
  const [showAll, setShowAll] = useState(false);

  const { data, loading } = useQuery(GET_ACTIVITIES);

  const [createAct, { loading: creating }] = useMutation(CREATE_ACTIVITY, {
    refetchQueries: [{ query: GET_ACTIVITIES }],
    onCompleted: () => showNotice("success", "Actividad creada ✓"),
    onError: (e) => showNotice("error", e.message),
  });

  const [toggleAct, { loading: toggling }] = useMutation(TOGGLE_ACTIVITY_ACTIVE, {
    refetchQueries: [{ query: GET_ACTIVITIES }],
    onError: (e) => showNotice("error", e.message),
  });

  const activities = data?.activities || [];
  const visible = showAll ? activities : activities.filter((a) => a.isActive);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Actividades / Campañas</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Asignables a ingresos y gastos para reportes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-400">{activities.length} total</span>
          <button
            onClick={() => setShowAll((v) => !v)}
            className="text-xs text-rose-700 font-semibold hover:underline"
          >
            {showAll ? "Ver activas" : "Ver todas"}
          </button>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <Notice notice={notice} />
        <AddForm
          onSubmit={(input) => createAct({ variables: { input } })}
          loading={creating}
          placeholder="Ej: Festival, Torneo regional, Almuerzos…"
        />

        <div>
          {loading && <Skeleton />}
          {!loading && visible.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-2xl mb-1">🎪</p>
              <p className="text-sm font-semibold text-slate-600">Sin actividades</p>
              <p className="text-xs text-slate-400 mt-1">
                Agregá actividades para ver reportes por evento.
              </p>
            </div>
          )}
          {!loading &&
            visible.map((act) => (
              <CatalogItem
                key={act.id}
                item={act}
                onToggle={(id) => toggleAct({ variables: { id } })}
                loading={toggling}
              />
            ))}
        </div>
      </div>

      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
        <p className="text-xs text-slate-400">
          💡 Las actividades aparecen como filtros opcionales al registrar ventas y gastos.
        </p>
      </div>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const CatalogsPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("categories");

  const TABS = [
    { id: "categories", label: "🗂️ Categorías" },
    { id: "activities", label: "🎪 Actividades" },
  ];

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <div className="page-content space-y-5">
        <div>
          <button
            onClick={() => navigate("/finance")}
            className="text-xs text-slate-400 hover:text-slate-600 mb-1 flex items-center gap-1"
          >
            ← Caja
          </button>
          <h1 className="text-2xl font-bold text-slate-900">Catálogos</h1>
          <p className="text-sm text-slate-500 mt-1">
            Configurá categorías de gastos y actividades para tus reportes.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl self-start">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                tab === t.id
                  ? "bg-white shadow-sm text-slate-900"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "categories" && <CategoriesSection />}
        {tab === "activities" && <ActivitiesSection />}
      </div>
      <Footer />
    </DashboardLayout>
  );
};

export default CatalogsPage;

AddForm.propTypes = {
  onSubmit: PropTypes.func,
  loading: PropTypes.bool,
  placeholder: PropTypes.string,
};
CatalogItem.propTypes = {
  item: PropTypes.object,
  onToggle: PropTypes.func,
  loading: PropTypes.bool,
};
