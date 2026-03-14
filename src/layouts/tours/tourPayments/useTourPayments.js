/**
 * useTourPayments.js — versión optimizada
 *
 * Mejoras aplicadas vs. versión original:
 *
 * 1. fmtAmount / fmtDate / fmtMonthYear — formatters cacheados como singletons
 *    (evita crear un nuevo Intl.* en cada llamada)
 *
 * 2. EMPTY_ARRAY / EMPTY_OBJ — referencias estables para evitar que useMemo
 *    invalide innecesariamente por [] !== []
 *
 * 3. tableRows — useMemo con `rawRows` como dependencia (no el objeto completo
 *    de financialTable) + búsqueda con toLowerCase() calculado una sola vez
 *
 * 4. installmentsByRow — Map<participantId, Map<order, installment>> pre-indexado
 *    Convierte el O(n²) del .find() en el render a O(1)
 *
 * 5. footerTotals — totales del footer pre-calculados en el hook, eliminando
 *    los reduce() ejecutados dentro del render del <tfoot>
 *
 * 6. Refetch selectivo por tipo de mutación (no refetchAll en todo)
 *    - registerPayment / deletePayment → solo tabla + summary
 *    - updateAccount                   → tabla + summary + accounts
 *    - createPlan / updatePlan         → planes + tabla
 *    - deletePlan                      → solo planes
 *    - setupAll                        → todo (caso justificado)
 *
 * 7. handleActions envueltos en useCallback para referencias estables
 *    → permite que React.memo en filas de la tabla funcione correctamente
 *
 * 8. useDeferredValue en search (React 18) — mantiene UI responsive mientras
 *    el usuario escribe; React puede interrumpir el filtrado si hay input nuevo
 *
 * 9. defaultPlan calculado con useMemo en lugar de .find() en cada render
 */

import { useState, useCallback, useMemo, useDeferredValue } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { DELETE_TOUR_PARTICIPANT } from "../tours.gql";
import {
  GET_FINANCIAL_TABLE,
  GET_FINANCIAL_SUMMARY,
  GET_PAYMENT_PLANS_BY_TOUR,
  GET_FINANCIAL_ACCOUNTS_BY_TOUR,
  GET_PAYMENTS_BY_PARTICIPANT,
  GET_INSTALLMENTS_BY_PARTICIPANT,
  GET_PAYMENT_FLOW,
  CREATE_PAYMENT_PLAN,
  UPDATE_PAYMENT_PLAN,
  DELETE_PAYMENT_PLAN,
  CREATE_FINANCIAL_ACCOUNTS_FOR_ALL,
  UPDATE_FINANCIAL_ACCOUNT,
  ASSIGN_PAYMENT_PLAN,
  ASSIGN_DEFAULT_PLAN_TO_ALL,
  REGISTER_PAYMENT,
  DELETE_PAYMENT,
} from "./tourPayments.gql";

// ─── Referencias estables para evitar invalidaciones de useMemo ───────────────

const EMPTY_ARRAY = Object.freeze([]);
const EMPTY_MAP = new Map();

// ─── Formatters cacheados (singleton por currency) ────────────────────────────
// Crear un Intl.NumberFormat / Intl.DateTimeFormat es costoso.
// En la versión original se creaba uno nuevo en CADA llamada a fmtAmount/fmtDate.
// Con caché: el objeto se construye una sola vez y se reutiliza indefinidamente.

const _currencyFormatters = new Map();

export function fmtAmount(n, currency = "USD") {
  if (!_currencyFormatters.has(currency)) {
    _currencyFormatters.set(
      currency,
      new Intl.NumberFormat("es-CR", { style: "currency", currency })
    );
  }
  return _currencyFormatters.get(currency).format(n ?? 0);
}

const _dateFmt = new Intl.DateTimeFormat("es-CR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const _monthYearFmt = new Intl.DateTimeFormat("es-CR", {
  month: "short",
  year: "numeric",
});

export function fmtDate(iso) {
  if (!iso) return "—";
  return _dateFmt.format(new Date(iso));
}

export function fmtMonthYear(iso) {
  if (!iso) return "—";
  return _monthYearFmt.format(new Date(iso));
}

// ─── Constantes de configuración (sin cambios) ────────────────────────────────

export const FINANCIAL_STATUS_CONFIG = {
  PENDING: {
    label: "Sin pagos",
    dot: "bg-gray-400",
    badge: "bg-gray-100 text-gray-600 border-gray-200",
    row: "border-l-gray-300",
  },
  UP_TO_DATE: {
    label: "Al día",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    row: "border-l-emerald-400",
  },
  LATE: {
    label: "Atrasado",
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-700 border-red-200",
    row: "border-l-red-400",
  },
  PARTIAL: {
    label: "Parcial",
    dot: "bg-amber-400",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    row: "border-l-amber-400",
  },
  PAID: {
    label: "Pagado",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    row: "border-l-emerald-400",
  },
  OVERPAID: {
    label: "Excedente",
    dot: "bg-violet-500",
    badge: "bg-violet-50 text-violet-700 border-violet-200",
    row: "border-l-violet-400",
  },
};

export const INSTALLMENT_STATUS_CONFIG = {
  PENDING: { label: "Pendiente", className: "bg-gray-100 text-gray-600 border-gray-200" },
  PARTIAL: { label: "Parcial", className: "bg-amber-50 text-amber-700 border-amber-200" },
  PAID: { label: "Pagado", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  LATE: { label: "Atrasado", className: "bg-red-50 text-red-700 border-red-200" },
  WAIVED: { label: "Exonerado", className: "bg-gray-50 text-gray-500 border-gray-200" },
};

export const METHOD_LABELS = {
  CASH: "Efectivo",
  TRANSFER: "Transferencia",
  CARD: "Tarjeta",
  CHECK: "Cheque",
  OTHER: "Otro",
};

export function participantName(p) {
  if (!p) return "—";
  return [p.firstName, p.firstSurname, p.secondSurname].filter(Boolean).join(" ");
}

// ─── Hook principal ───────────────────────────────────────────────────────────

export function useTourPayments(tourId) {
  // ── UI State ────────────────────────────────────────────────────────────────
  const [activeView, setActiveView] = useState("table");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [toast, setToast] = useState(null);

  // Modals
  const [registerModal, setRegisterModal] = useState({ open: false, participant: null });
  const [deletePayModal, setDeletePayModal] = useState({ open: false, payment: null });
  const [deleteParticipantModal, setDeleteParticipantModal] = useState({ open: false, participant: null });
  const [accountModal, setAccountModal] = useState({ open: false, account: null });
  const [planModal, setPlanModal] = useState({ open: false, plan: null, mode: "create" });
  const [setupModal, setSetupModal] = useState({ open: false });
  const [detailDrawer, setDetailDrawer] = useState({
    open: false,
    participantId: null,
    tourId: null,
  });

  // ── useDeferredValue para el search ─────────────────────────────────────────
  // React 18: permite que la UI responda al input inmediatamente mientras
  // el filtrado de tableRows se ejecuta en segundo plano sin bloquear el thread.
  // Si el usuario escribe rápido, React descarta cálculos intermedios.
  const deferredSearch = useDeferredValue(search);

  // ── Queries ─────────────────────────────────────────────────────────────────
  const {
    data: tableData,
    loading: tableLoading,
    error: tableError,
    refetch: refetchTable,
  } = useQuery(GET_FINANCIAL_TABLE, {
    variables: { tourId },
    skip: !tourId,
    fetchPolicy: "cache-and-network",
  });

  const {
    data: summaryData,
    loading: summaryLoading,
    refetch: refetchSummary,
  } = useQuery(GET_FINANCIAL_SUMMARY, {
    variables: { tourId },
    skip: !tourId,
    fetchPolicy: "cache-and-network",
  });

  const {
    data: plansData,
    loading: plansLoading,
    refetch: refetchPlans,
  } = useQuery(GET_PAYMENT_PLANS_BY_TOUR, {
    variables: { tourId },
    skip: !tourId,
    fetchPolicy: "cache-and-network",
  });

  const {
    data: accountsData,
    loading: accountsLoading,
    refetch: refetchAccounts,
  } = useQuery(GET_FINANCIAL_ACCOUNTS_BY_TOUR, {
    variables: { tourId },
    skip: !tourId,
    fetchPolicy: "cache-and-network",
  });

  const { data: flowData, loading: flowLoading } = useQuery(GET_PAYMENT_FLOW, {
    variables: { tourId },
    skip: !tourId || activeView !== "summary",
    fetchPolicy: "cache-and-network",
  });

  // ── Helpers de notificación ──────────────────────────────────────────────────
  const showToast = useCallback((message, type = "success") => setToast({ message, type }), []);

  // ── Refetch selectivo ────────────────────────────────────────────────────────
  // En lugar de disparar 4 queries después de cada mutación, cada acción
  // invalida solo lo que realmente pudo haber cambiado.

  /** Pago registrado o eliminado → cambia tabla + resumen financiero */
  const refetchAfterPayment = useCallback(() => {
    refetchTable();
    refetchSummary();
  }, [refetchTable, refetchSummary]);

  /** Cuenta ajustada → cambia tabla + resumen + lista de cuentas */
  const refetchAfterAccountChange = useCallback(() => {
    refetchTable();
    refetchSummary();
    refetchAccounts();
  }, [refetchTable, refetchSummary, refetchAccounts]);

  /** Plan creado o editado → cambia planes + tabla (cuotas pueden cambiar) */
  const refetchAfterPlanChange = useCallback(() => {
    refetchPlans();
    refetchTable();
  }, [refetchPlans, refetchTable]);

  /** Setup masivo → todo cambia */
  const refetchAll = useCallback(() => {
    refetchTable();
    refetchSummary();
    refetchAccounts();
    refetchPlans();
  }, [refetchTable, refetchSummary, refetchAccounts, refetchPlans]);

  // ── Mutations ────────────────────────────────────────────────────────────────

  const [registerPayment, { loading: registering }] = useMutation(REGISTER_PAYMENT, {
    onCompleted: () => {
      showToast("Pago registrado y aplicado a cuotas");
      setRegisterModal({ open: false, participant: null });
      refetchAfterPayment();
    },
    onError: (e) => showToast(e.message, "error"),
  });

  const [deletePayment, { loading: deletingPay }] = useMutation(DELETE_PAYMENT, {
    onCompleted: () => {
      showToast("Pago eliminado y cuotas revertidas");
      setDeletePayModal({ open: false, payment: null });
      refetchAfterPayment();
    },
    onError: (e) => showToast(e.message, "error"),
  });

  const [updateAccount, { loading: updatingAccount }] = useMutation(UPDATE_FINANCIAL_ACCOUNT, {
    onCompleted: () => {
      showToast("Cuenta financiera actualizada");
      setAccountModal({ open: false, account: null });
      refetchAfterAccountChange();
    },
    onError: (e) => showToast(e.message, "error"),
  });

  const [createPlan, { loading: creatingPlan }] = useMutation(CREATE_PAYMENT_PLAN, {
    onCompleted: () => {
      showToast("Plan de pagos creado");
      setPlanModal({ open: false, plan: null, mode: "create" });
      refetchAfterPlanChange();
    },
    onError: (e) => showToast(e.message, "error"),
  });

  const [updatePlan, { loading: updatingPlan }] = useMutation(UPDATE_PAYMENT_PLAN, {
    onCompleted: () => {
      showToast("Plan de pagos actualizado");
      setPlanModal({ open: false, plan: null, mode: "create" });
      refetchAfterPlanChange();
    },
    onError: (e) => showToast(e.message, "error"),
  });

  const [deletePlan, { loading: deletingPlan }] = useMutation(DELETE_PAYMENT_PLAN, {
    onCompleted: () => {
      showToast("Plan eliminado");
      refetchPlans(); // Solo planes: nada más cambia al borrar un plan no asignado
    },
    onError: (e) => showToast(e.message, "error"),
  });

  const [createAccountsForAll, { loading: creatingAccounts }] = useMutation(
    CREATE_FINANCIAL_ACCOUNTS_FOR_ALL,
    {
      onCompleted: (data) => {
        const r = data.createFinancialAccountsForAll;
        showToast(`${r.created} cuentas creadas, ${r.skipped} ya existían`);
        refetchAll();
      },
      onError: (e) => showToast(e.message, "error"),
    }
  );

  const [assignPlanToAll, { loading: assigningPlan }] = useMutation(ASSIGN_DEFAULT_PLAN_TO_ALL, {
    onCompleted: (data) => {
      const r = data.assignDefaultPlanToAll;
      showToast(`Plan asignado a ${r.assigned} participante(s)`);
      refetchAll();
    },
    onError: (e) => showToast(e.message, "error"),
  });

  const [assignPlanToParticipant, { loading: assigningIndividual }] = useMutation(
    ASSIGN_PAYMENT_PLAN,
    {
      onCompleted: () => {
        showToast("Plan asignado");
        refetchAfterAccountChange();
      },
      onError: (e) => showToast(e.message, "error"),
    }
  );

  const [deleteParticipantMutation, { loading: deletingParticipant }] = useMutation(
    DELETE_TOUR_PARTICIPANT,
    {
      onCompleted: () => {
        showToast("Participante eliminado correctamente");
        setDeleteParticipantModal({ open: false, participant: null });
        refetchAll();
      },
      onError: (e) => showToast(e.message, "error"),
    }
  );

  // ── Datos derivados base ─────────────────────────────────────────────────────
  const financialTable = tableData?.getFinancialTable ?? null;
  const summary = summaryData?.getFinancialSummary ?? null;
  const plans = plansData?.getPaymentPlansByTour ?? EMPTY_ARRAY;
  const accounts = accountsData?.getFinancialAccountsByTour ?? EMPTY_ARRAY;
  const paymentFlow = flowData?.getPaymentFlow ?? EMPTY_ARRAY;

  // Extraer rawRows con referencia más granular para que useMemo downstream
  // no invalide cuando cambian otras partes del objeto financialTable
  const rawRows = financialTable?.rows ?? EMPTY_ARRAY;
  const tableColumns = financialTable?.columns ?? EMPTY_ARRAY;

  // defaultPlan con useMemo: .find() no debería ejecutarse en cada render
  const defaultPlan = useMemo(() => plans.find((p) => p.isDefault) ?? plans[0] ?? null, [plans]);

  // ── tableRows filtradas ──────────────────────────────────────────────────────
  // Dependencias precisas: rawRows (no financialTable completo), deferredSearch,
  // statusFilter. deferredSearch evita filtrar en cada tecla.
  const tableRows = useMemo(() => {
    if (!rawRows.length) return EMPTY_ARRAY;

    const lowerSearch = deferredSearch.toLowerCase();

    return rawRows
      .filter((row) => {
        const matchSearch =
          !lowerSearch ||
          row.fullName.toLowerCase().includes(lowerSearch) ||
          row.identification.toLowerCase().includes(lowerSearch);

        const matchStatus = statusFilter === "ALL" || row.financialStatus === statusFilter;

        return matchSearch && matchStatus;
      })
      .sort((a, b) => {
        if (a.instrument !== b.instrument) {
          return a.instrument.localeCompare(b.instrument);
        }

        return a.fullName.localeCompare(b.fullName);
      });
  }, [rawRows, deferredSearch, statusFilter]);

  // ── installmentsByRow — índice pre-computado ─────────────────────────────────
  // Estructura: Map<participantId, Map<order, installment>>
  //
  // PROBLEMA ORIGINAL: en el render de cada fila se ejecutaba
  //   row.installments.find(i => i.order === col.order)  → O(n) por celda
  // Con 100 filas × 12 columnas × 12 installments = 14,400 comparaciones/render.
  //
  // CON ESTE ÍNDICE: cada celda hace instMap.get(col.order) → O(1).
  // El índice se construye una vez cuando cambian tableRows.
  const installmentsByRow = useMemo(() => {
    if (!tableRows.length) return EMPTY_MAP;

    const outerMap = new Map();
    for (const row of tableRows) {
      if (!row.installments?.length) continue;
      const innerMap = new Map();
      for (const inst of row.installments) {
        innerMap.set(inst.order, inst);
      }
      outerMap.set(row.participantId, innerMap);
    }
    return outerMap;
  }, [tableRows]);

  // ── footerTotals — totales del <tfoot> pre-calculados ───────────────────────
  // PROBLEMA ORIGINAL: el <tfoot> ejecutaba un reduce() por cada columna
  // dentro del render, más 3 reduces para los totales globales.
  // Con 100 filas y 12 columnas = 1,500 iteraciones en el render path.
  //
  // AHORA: se calcula una sola vez en un único loop sobre tableRows.
  // El render del tfoot solo lee valores del objeto.
  const footerTotals = useMemo(() => {
    if (tableRows.length < 2) return null; // El tfoot solo se muestra con >1 fila

    const result = {
      finalAmount: 0,
      totalPaid: 0,
      balance: 0,
      byColumn: new Map(), // Map<order, paidAmount>
    };

    for (const row of tableRows) {
      result.finalAmount += row.finalAmount;
      result.totalPaid += row.totalPaid;
      result.balance += Math.max(0, row.balance);

      const instMap = installmentsByRow.get(row.participantId);
      if (instMap) {
        for (const col of tableColumns) {
          const cell = instMap.get(col.order);
          const prev = result.byColumn.get(col.order) ?? 0;
          result.byColumn.set(col.order, prev + (cell?.paidAmount ?? 0));
        }
      }
    }

    return result;
  }, [tableRows, installmentsByRow, tableColumns]);

  // ── Actions con useCallback ──────────────────────────────────────────────────
  // Envolver en useCallback garantiza referencias estables entre renders,
  // lo que permite que React.memo en <TableRow> funcione correctamente:
  // una fila no se re-renderiza si sus props (incluyendo callbacks) no cambiaron.

  const handleRegisterPayment = useCallback(
    async (input) => {
      await registerPayment({ variables: { input: { ...input, tourId } } });
    },
    [registerPayment, tourId]
  );

  const handleDeletePayment = useCallback(async () => {
    if (!deletePayModal.payment) return;
    await deletePayment({ variables: { id: deletePayModal.payment.id } });
  }, [deletePayment, deletePayModal.payment]);

  const handleUpdateAccount = useCallback(
    async (id, input) => {
      await updateAccount({ variables: { id, input } });
    },
    [updateAccount]
  );

  const handleCreatePlan = useCallback(
    async (input) => {
      await createPlan({ variables: { input: { ...input, tourId } } });
    },
    [createPlan, tourId]
  );

  const handleUpdatePlan = useCallback(
    async (id, input) => {
      await updatePlan({ variables: { id, input } });
    },
    [updatePlan]
  );

  const handleDeletePlan = useCallback(
    async (id) => {
      await deletePlan({ variables: { id } });
    },
    [deletePlan]
  );

  const handleSetupAll = useCallback(
    async (baseAmount, planId) => {
      await createAccountsForAll({ variables: { tourId, baseAmount, planId } });
      if (planId) {
        await assignPlanToAll({ variables: { tourId } });
      }
      setSetupModal({ open: false });
    },
    [createAccountsForAll, assignPlanToAll, tourId]
  );

  const handleAssignPlan = useCallback(
    async (participantId, planId) => {
      await assignPlanToParticipant({ variables: { participantId, tourId, planId } });
    },
    [assignPlanToParticipant, tourId]
  );

  const handleDeleteParticipant = useCallback(async () => {
    if (!deleteParticipantModal.participant) return;
    await deleteParticipantMutation({
      variables: { id: deleteParticipantModal.participant.participantId },
    });
  }, [deleteParticipantMutation, deleteParticipantModal.participant]);

  const loading = tableLoading || summaryLoading;

  return {
    // ── Data ──────────────────────────────────────────────────────────────────
    financialTable,
    tableRows,
    tableColumns, // expuesto por separado para evitar acceder a financialTable.columns en el render
    installmentsByRow, // Map pre-indexado: elimina O(n²) en celdas de la tabla
    footerTotals, // Totales pre-calculados: elimina reduce() en render del tfoot
    summary,
    plans,
    defaultPlan,
    accounts,
    paymentFlow,

    // ── UI state ──────────────────────────────────────────────────────────────
    activeView,
    setActiveView,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    toast,
    setToast,

    // ── Modals ────────────────────────────────────────────────────────────────
    registerModal,
    setRegisterModal,
    deletePayModal,
    setDeletePayModal,
    deleteParticipantModal,
    setDeleteParticipantModal,
    accountModal,
    setAccountModal,
    planModal,
    setPlanModal,
    setupModal,
    setSetupModal,
    detailDrawer,
    setDetailDrawer,

    // ── Actions ───────────────────────────────────────────────────────────────
    handleRegisterPayment,
    handleDeletePayment,
    handleDeleteParticipant,
    handleUpdateAccount,
    handleCreatePlan,
    handleUpdatePlan,
    handleDeletePlan,
    handleSetupAll,
    handleAssignPlan,

    // ── Loading flags ─────────────────────────────────────────────────────────
    loading,
    tableLoading,
    summaryLoading,
    plansLoading,
    accountsLoading,
    flowLoading,
    registering,
    deletingPay,
    deletingParticipant,
    updatingAccount,
    creatingPlan,
    updatingPlan,
    deletingPlan,
    creatingAccounts,
    assigningPlan,
    assigningIndividual,

    // ── Error / refetch ───────────────────────────────────────────────────────
    tableError,
    refetchAll, // Disponible para casos excepcionales
    refetchAfterPayment, // Expuesto para uso en ParticipantDetailDrawer si aplica
  };
}

// ─── Hook auxiliar: detalle de participante ───────────────────────────────────

export function useParticipantDetail(participantId, tourId) {
  const {
    data: paymentsData,
    loading: paymentsLoading,
    refetch: refetchPayments,
  } = useQuery(GET_PAYMENTS_BY_PARTICIPANT, {
    variables: { participantId, tourId },
    skip: !participantId || !tourId,
    fetchPolicy: "cache-and-network",
  });

  const {
    data: installmentsData,
    loading: installmentsLoading,
    refetch: refetchInstallments,
  } = useQuery(GET_INSTALLMENTS_BY_PARTICIPANT, {
    variables: { participantId, tourId },
    skip: !participantId || !tourId,
    fetchPolicy: "cache-and-network",
  });

  // refetch estable con useCallback para evitar re-renders en componentes
  // que reciben esta función como prop
  const refetch = useCallback(() => {
    refetchPayments();
    refetchInstallments();
  }, [refetchPayments, refetchInstallments]);

  return {
    payments: paymentsData?.getPaymentsByParticipant ?? EMPTY_ARRAY,
    installments: installmentsData?.getInstallmentsByParticipant ?? EMPTY_ARRAY,
    loading: paymentsLoading || installmentsLoading,
    refetch,
  };
}
