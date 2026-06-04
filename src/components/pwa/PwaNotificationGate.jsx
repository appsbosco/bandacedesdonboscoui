import { createPortal } from "react-dom";
import { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { usePushNotifications } from "hooks/usePushNotifications";
import { usePwaInstall } from "hooks/usePwaInstall";
import { getPwaRuntimeInfo, refreshPermission } from "utils/pwa";

// Snooze keys in localStorage
const SNOOZE_KEY = "pwaGateSnoozeUntil";

function getSnoozeDurationMs(reason) {
  if (reason === "denied") return 7 * 24 * 60 * 60 * 1000; // 7 days
  return 24 * 60 * 60 * 1000; // 24 hours
}

function isSnoozed() {
  try {
    const until = Number(localStorage.getItem(SNOOZE_KEY));
    return until > Date.now();
  } catch {
    return false;
  }
}

function snooze(reason) {
  try {
    localStorage.setItem(SNOOZE_KEY, String(Date.now() + getSnoozeDurationMs(reason)));
  } catch {
    // ignore
  }
}

function clearSnooze() {
  try {
    localStorage.removeItem(SNOOZE_KEY);
  } catch {
    // ignore
  }
}

// ── Icons ──────────────────────────────────────────────────────────────────

function BellIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function BellOffIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      <path d="M18.63 13A17.89 17.89 0 0 1 18 8" />
      <path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14" />
      <path d="M18 8a6 6 0 0 0-9.33-5" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ── Step views ──────────────────────────────────────────────────────────────

function StepIosInstall({ onDone, onSnooze }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ color: "#3b82f6" }}>
          <PhoneIcon />
        </span>
        <span style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>
          Agrega la app a tu pantalla de inicio
        </span>
      </div>
      <p style={{ fontSize: 14, color: "#475569", marginBottom: 16, lineHeight: 1.6 }}>
        En iPhone e iPad, las notificaciones solo funcionan desde la app instalada. Sigue estos
        pasos en Safari:
      </p>
      <ol
        style={{
          paddingLeft: 20,
          margin: "0 0 20px",
          color: "#334155",
          fontSize: 14,
          lineHeight: 2,
        }}
      >
        <li>
          Abre esta página en <strong>Safari</strong>
        </li>
        <li>
          Toca el botón <strong>Compartir</strong>{" "}
          <span style={{ fontSize: 13, color: "#64748b" }}>(icono de cuadro con flecha)</span>
        </li>
        <li>
          Desplázate y elige <strong>&ldquo;Añadir a pantalla de inicio&rdquo;</strong>
        </li>
        <li>
          Toca <strong>Agregar</strong> en la esquina superior derecha
        </li>
        <li>Abre la app desde el ícono instalado</li>
      </ol>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button type="button" onClick={onDone} style={styles.btnPrimary}>
          Ya agregué la app
        </button>
        {/* <button type="button" onClick={onSnooze} style={styles.btnSecondary}>
          Más tarde
        </button> */}
      </div>
    </div>
  );
}

function StepAndroidInstall({ canInstall, onInstall, onDone, onSnooze }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ color: "#3b82f6" }}>
          <PhoneIcon />
        </span>
        <span style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>
          Instala la aplicación
        </span>
      </div>
      <p style={{ fontSize: 14, color: "#475569", marginBottom: 20, lineHeight: 1.6 }}>
        Instala la app para una mejor experiencia y para recibir notificaciones importantes de la
        Banda CEDES Don Bosco.
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {canInstall && (
          <button type="button" onClick={onInstall} style={styles.btnPrimary}>
            Instalar aplicación
          </button>
        )}
        <button
          type="button"
          onClick={onDone}
          style={canInstall ? styles.btnSecondary : styles.btnPrimary}
        >
          Ya la instalé
        </button>
        {/* <button type="button" onClick={onSnooze} style={styles.btnGhost}>
          Más tarde
        </button> */}
      </div>
    </div>
  );
}

function StepRequestPermission({ onRequest, isRegistering, onSnooze }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ color: "#3b82f6" }}>
          <BellIcon />
        </span>
        <span style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>
          Activa las notificaciones
        </span>
      </div>
      <p style={{ fontSize: 14, color: "#475569", marginBottom: 20, lineHeight: 1.6 }}>
        Recibe avisos importantes de presentaciones, ensayos y eventos de la Banda CEDES Don Bosco
        directamente en tu dispositivo.
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={onRequest}
          disabled={isRegistering}
          style={
            isRegistering
              ? { ...styles.btnPrimary, opacity: 0.7, cursor: "not-allowed" }
              : styles.btnPrimary
          }
        >
          {isRegistering ? "Activando…" : "Activar notificaciones"}
        </button>
        {/* <button type="button" onClick={onSnooze} style={styles.btnSecondary}>
          Más tarde
        </button> */}
      </div>
    </div>
  );
}

function StepDenied({ isIOS, isAndroid, onRefresh, onSnooze, isChecking, checkFailed }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ color: "#ef4444" }}>
          <BellOffIcon />
        </span>
        <span style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>
          Notificaciones bloqueadas
        </span>
      </div>
      <p style={{ fontSize: 14, color: "#475569", marginBottom: 16, lineHeight: 1.6 }}>
        Las notificaciones están bloqueadas en este dispositivo. Actívalas manualmente:
      </p>
      {isIOS ? (
        <ol
          style={{
            paddingLeft: 20,
            margin: "0 0 20px",
            color: "#334155",
            fontSize: 14,
            lineHeight: 2,
          }}
        >
          <li>
            Abre <strong>Ajustes</strong> en tu iPhone/iPad
          </li>
          <li>
            Toca <strong>Notificaciones</strong>
          </li>
          <li>
            Busca la app <strong>BCDB</strong>
          </li>
          <li>
            Activa <strong>Permitir notificaciones</strong>
          </li>
          <li>Vuelve a la app y toca &ldquo;Ya las activé&rdquo;</li>
        </ol>
      ) : (
        <ol
          style={{
            paddingLeft: 20,
            margin: "0 0 20px",
            color: "#334155",
            fontSize: 14,
            lineHeight: 2,
          }}
        >
          <li>
            Abre <strong>Chrome</strong> y toca el candado junto a la URL
          </li>
          <li>
            Ve a <strong>Configuración del sitio</strong>
          </li>
          <li>
            Selecciona <strong>Notificaciones</strong>
          </li>
          <li>
            Cambia a <strong>Permitir</strong>
          </li>
          <li>Recarga la página y toca &ldquo;Ya las activé&rdquo;</li>
        </ol>
      )}
      {checkFailed && (
        <p style={{ fontSize: 13, color: "#ef4444", marginBottom: 12, marginTop: -8 }}>
          Las notificaciones siguen bloqueadas. Verifica los pasos anteriores e inténtalo de nuevo.
        </p>
      )}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isChecking}
          style={
            isChecking
              ? { ...styles.btnPrimary, opacity: 0.7, cursor: "not-allowed" }
              : styles.btnPrimary
          }
        >
          {isChecking ? "Verificando…" : "Ya las activé"}
        </button>
        {/* <button type="button" onClick={onSnooze} style={styles.btnSecondary} disabled={isChecking}>
          Más tarde
        </button> */}
      </div>
    </div>
  );
}

function StepGranted({ onClose }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ color: "#22c55e" }}>
          <CheckIcon />
        </span>
        <span style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>
          Notificaciones activadas
        </span>
      </div>
      <p style={{ fontSize: 14, color: "#475569", marginBottom: 20, lineHeight: 1.6 }}>
        Recibirás avisos importantes de la Banda CEDES Don Bosco.
      </p>
      <button type="button" onClick={onClose} style={styles.btnPrimary}>
        Continuar
      </button>
    </div>
  );
}

StepIosInstall.propTypes = {
  onDone: PropTypes.func.isRequired,
  onSnooze: PropTypes.func.isRequired,
};
StepAndroidInstall.propTypes = {
  canInstall: PropTypes.bool.isRequired,
  onInstall: PropTypes.func.isRequired,
  onDone: PropTypes.func.isRequired,
  onSnooze: PropTypes.func.isRequired,
};
StepRequestPermission.propTypes = {
  onRequest: PropTypes.func.isRequired,
  isRegistering: PropTypes.bool.isRequired,
  onSnooze: PropTypes.func.isRequired,
};
StepDenied.propTypes = {
  isIOS: PropTypes.bool.isRequired,
  isAndroid: PropTypes.bool.isRequired,
  onRefresh: PropTypes.func.isRequired,
  onSnooze: PropTypes.func.isRequired,
  isChecking: PropTypes.bool,
  checkFailed: PropTypes.bool,
};
StepGranted.propTypes = { onClose: PropTypes.func.isRequired };

// ── Main gate component ────────────────────────────────────────────────────

export default function PwaNotificationGate({ userId }) {
  const [visible, setVisible] = useState(false);
  const [info, setInfo] = useState(() => getPwaRuntimeInfo());
  const [isCheckingPermission, setIsCheckingPermission] = useState(false);
  const [checkFailed, setCheckFailed] = useState(false);
  // Android/Desktop: install is optional — push works from browser. Once the user
  // acknowledges the install step (via either button), advance to permissions.
  const [skippedInstall, setSkippedInstall] = useState(false);

  const push = usePushNotifications(userId);
  const install = usePwaInstall();

  // Determine if we need to show the gate at all
  const needsAction = info.permission !== "granted" || (info.isIOS && !info.isStandalone);

  useEffect(() => {
    if (!userId) return;
    if (!needsAction) return;
    if (isSnoozed()) return;
    setVisible(true);
  }, [userId, needsAction]);

  // Close when permission becomes granted and we have a token
  useEffect(() => {
    if (push.permission === "granted" && push.token) {
      clearSnooze();
      setVisible(false);
    }
  }, [push.permission, push.token]);

  const handleSnooze = useCallback(() => {
    snooze(push.permission === "denied" ? "denied" : "default");
    setVisible(false);
  }, [push.permission]);

  const handleClose = useCallback(() => {
    setVisible(false);
  }, []);

  const handleRefreshPermission = useCallback(async () => {
    setIsCheckingPermission(true);
    setCheckFailed(false);
    // Brief pause so "Verificando…" label is visible before browser re-reads the value
    await new Promise((r) => setTimeout(r, 600));
    push.refreshStatus();
    const newInfo = getPwaRuntimeInfo();
    setInfo(newInfo);
    setIsCheckingPermission(false);
    if (newInfo.permission === "denied") {
      setCheckFailed(true);
    }
  }, [push]);

  const handleRecheckInstall = useCallback(() => {
    // Always advance past the install step when the user acknowledges it.
    // For iOS we re-check standalone (push truly requires it).
    // For Android/Desktop, install is optional — push works from browser mode,
    // so we skip regardless of whether standalone is detected.
    install.recheckInstalled();
    setInfo(getPwaRuntimeInfo());
    setSkippedInstall(true);
  }, [install]);

  const handleAndroidInstall = useCallback(async () => {
    await install.promptInstall();
    setInfo(getPwaRuntimeInfo());
    setSkippedInstall(true);
  }, [install]);

  if (!visible || !userId) return null;

  // Determine which step to show
  let step = null;

  if (info.isIOS && !info.isStandalone) {
    // iOS: push notifications require standalone mode — keep showing until resolved
    step = <StepIosInstall onDone={handleRecheckInstall} onSnooze={handleSnooze} />;
  } else if (
    !skippedInstall &&
    !info.isStandalone &&
    !info.isIOS &&
    (install.canInstall || install.requiresManualGuide)
  ) {
    // Android/Desktop: offer install (skipped once user acknowledges)
    step = (
      <StepAndroidInstall
        canInstall={install.canInstall}
        onInstall={handleAndroidInstall}
        onDone={handleRecheckInstall}
        onSnooze={handleSnooze}
      />
    );
  } else if (push.permission === "denied") {
    step = (
      <StepDenied
        isIOS={info.isIOS}
        isAndroid={info.isAndroid}
        onRefresh={handleRefreshPermission}
        onSnooze={handleSnooze}
        isChecking={isCheckingPermission}
        checkFailed={checkFailed}
      />
    );
  } else if (push.permission === "granted" && push.token) {
    step = <StepGranted onClose={handleClose} />;
  } else {
    // default or granted-but-no-token
    step = (
      <StepRequestPermission
        onRequest={push.requestPermissionAndRegister}
        isRegistering={push.isRegistering}
        onSnooze={handleSnooze}
      />
    );
  }

  const sheet = (
    <div style={styles.backdrop} aria-live="polite">
      <div
        style={styles.sheet}
        role="dialog"
        aria-modal="false"
        aria-label="Configuración de notificaciones"
      >
        {/* Header row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 4,
          }}
        >
          <div style={{ flex: 1 }}>{step}</div>
          <button type="button" onClick={handleSnooze} aria-label="Cerrar" style={styles.closeBtn}>
            <CloseIcon />
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}

PwaNotificationGate.propTypes = {
  userId: PropTypes.string,
};

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = {
  backdrop: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9000,
    display: "flex",
    justifyContent: "center",
    padding: "0 16px 16px",
    pointerEvents: "none",
  },
  sheet: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    boxShadow: "0 -4px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)",
    padding: "20px 20px 20px 24px",
    width: "100%",
    maxWidth: 540,
    pointerEvents: "auto",
    animation: "pwaSheetSlideUp 0.25s ease-out",
  },
  btnPrimary: {
    background: "#0f172a",
    color: "#ffffff",
    border: "none",
    borderRadius: 8,
    padding: "10px 20px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  btnSecondary: {
    background: "#f1f5f9",
    color: "#334155",
    border: "none",
    borderRadius: 8,
    padding: "10px 20px",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  btnGhost: {
    background: "transparent",
    color: "#94a3b8",
    border: "none",
    borderRadius: 8,
    padding: "10px 12px",
    fontSize: 13,
    fontWeight: 400,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: "#94a3b8",
    padding: 6,
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginLeft: 8,
    marginTop: -2,
  },
};
