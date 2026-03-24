/* eslint-disable react/prop-types */

import React, { useRef, useState, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import jsQR from "jsqr";
import { useMutation, useQuery } from "@apollo/client";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import {
  VALIDATE_TICKET,
  GET_EVENTS,
  GET_TICKETS,
  GET_EVENT_STATS,
  ScanResultOverlay,
  Spinner,
} from "./Shared";

const COOLDOWN_MS = 2200;
const FRAME_INTERVAL_MS = 180;

function HistoryRow({ entry }) {
  const isOk = entry.canEnter;
  const time = entry.time.toLocaleTimeString("es-CR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
          isOk ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
        }`}
      >
        {isOk ? "✓" : "✕"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">
          {entry.name || `Ticket …${entry.ticketId?.slice(-6) || "?"}`}
        </p>
        <p className="text-xs text-gray-400 truncate">{entry.message}</p>
      </div>
      <span className="text-xs text-gray-400 font-mono flex-shrink-0">{time}</span>
    </div>
  );
}

export default function QRScanner() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const lastDecodedRef = useRef("");
  const lastDecodedAtRef = useRef(0);
  const cooldownUntilRef = useRef(0);
  const lastFrameAtRef = useRef(0);
  const overlayTimeoutRef = useRef(null);

  const [overlayResult, setOverlayResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [cameraError, setCameraError] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [flash, setFlash] = useState(null);
  const [stats, setStats] = useState({ ok: 0, denied: 0 });

  const { data: eventsData } = useQuery(GET_EVENTS);

  const [validateTicket, { loading: validating }] = useMutation(VALIDATE_TICKET, {
    awaitRefetchQueries: true,
  });

  const registerResult = useCallback((validation) => {
    const ticket = validation?.ticket || null;
    const name = ticket
      ? ticket.userId
        ? `${ticket.userId.name} ${ticket.userId.firstSurName}`.trim()
        : ticket.buyerName
      : null;

    setFlash(validation.canEnter ? "ok" : "error");
    setTimeout(() => setFlash(null), 650);
    setOverlayResult(validation);
    setStats((prev) => ({
      ok: prev.ok + (validation.canEnter ? 1 : 0),
      denied: prev.denied + (!validation.canEnter ? 1 : 0),
    }));
    setHistory((prev) => [
      {
        id: Date.now(),
        time: new Date(),
        canEnter: validation.canEnter,
        message: validation.message,
        name,
        ticketId: ticket?.id || null,
        result: validation.result,
      },
      ...prev.slice(0, 29),
    ]);

    if (overlayTimeoutRef.current) clearTimeout(overlayTimeoutRef.current);
    overlayTimeoutRef.current = setTimeout(() => {
      setOverlayResult(null);
    }, 2600);
  }, []);

  const handleScan = useCallback(
    async (raw) => {
      if (scanning || validating) return;
      setScanning(true);

      try {
        const refetchQueries = [];
        if (selectedEvent) {
          refetchQueries.push({ query: GET_TICKETS, variables: { eventId: selectedEvent } });
          refetchQueries.push({ query: GET_EVENT_STATS, variables: { eventId: selectedEvent } });
        }

        const res = await validateTicket({
          variables: {
            qrPayload: raw,
            location: selectedEvent
              ? eventsData?.getEventsT?.find((event) => event.id === selectedEvent)?.name
              : "Scanner general",
          },
          refetchQueries,
        });

        const validation = res.data?.validateTicket;
        if (!validation) throw new Error("Respuesta vacía");
        registerResult(validation);
      } catch (err) {
        registerResult({
          result: "invalid",
          canEnter: false,
          message: err.message || "Error al validar",
          ticket: null,
        });
      } finally {
        setScanning(false);
      }
    },
    [eventsData, registerResult, scanning, selectedEvent, validateTicket, validating]
  );

  const processFrame = useCallback(() => {
    const webcam = webcamRef.current;
    const video = webcam?.video;
    const canvas = canvasRef.current;

    if (!video || !canvas || !cameraReady || scanning || validating) return;
    if (video.readyState < 2) return;

    const now = Date.now();
    if (now < cooldownUntilRef.current) return;

    const width = video.videoWidth || 0;
    const height = video.videoHeight || 0;
    if (!width || !height) return;

    const cropWidth = Math.floor(width * 0.64);
    const cropHeight = Math.floor(height * 0.46);
    const cropX = Math.floor((width - cropWidth) / 2);
    const cropY = Math.floor((height - cropHeight) / 2);

    const targetWidth = Math.min(960, cropWidth);
    const targetHeight = Math.floor((cropHeight / cropWidth) * targetWidth);

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    ctx.drawImage(video, cropX, cropY, cropWidth, cropHeight, 0, 0, targetWidth, targetHeight);
    const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "attemptBoth",
    });

    if (!code?.data) return;
    if (code.data === lastDecodedRef.current && now - lastDecodedAtRef.current < COOLDOWN_MS) {
      return;
    }

    lastDecodedRef.current = code.data;
    lastDecodedAtRef.current = now;
    cooldownUntilRef.current = now + COOLDOWN_MS;
    handleScan(code.data);
  }, [cameraReady, handleScan, scanning, validating]);

  const loop = useCallback(
    (timestamp) => {
      rafRef.current = requestAnimationFrame(loop);
      if (timestamp - lastFrameAtRef.current < FRAME_INTERVAL_MS) return;
      lastFrameAtRef.current = timestamp;
      processFrame();
    },
    [processFrame]
  );

  useEffect(() => {
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (overlayTimeoutRef.current) clearTimeout(overlayTimeoutRef.current);
    };
  }, [loop]);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Escáner de entradas</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Detecta QR en tiempo real y consume la cantidad exacta de ingresos disponibles
            </p>
          </div>
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="">Sin filtro de evento</option>
            {eventsData?.getEventsT?.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="bg-white border border-gray-100 rounded-2xl px-6 py-4 flex items-center gap-6 shadow-sm">
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-gray-900">{stats.ok + stats.denied}</span>
                <span className="text-xs text-gray-400 uppercase tracking-wider">Total</span>
              </div>
              <div className="w-px h-8 bg-gray-100" />
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-green-600">{stats.ok}</span>
                <span className="text-xs text-gray-400 uppercase tracking-wider">Autorizados</span>
              </div>
              <div className="w-px h-8 bg-gray-100" />
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-red-500">{stats.denied}</span>
                <span className="text-xs text-gray-400 uppercase tracking-wider">Denegados</span>
              </div>
              <button
                onClick={() => setStats({ ok: 0, denied: 0 })}
                className="ml-auto text-xs text-gray-400 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
              >
                Reiniciar
              </button>
            </div>

            <div className="relative bg-gray-900 rounded-2xl overflow-hidden">
              {flash && (
                <div
                  className={`absolute inset-0 z-10 pointer-events-none rounded-2xl transition-opacity ${
                    flash === "ok" ? "bg-green-500/30" : "bg-red-500/30"
                  }`}
                />
              )}

              <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                <svg width="220" height="220" viewBox="0 0 220 220" fill="none">
                  <path d="M18 60L18 18L60 18" stroke="white" strokeWidth="4" strokeLinecap="round" strokeOpacity=".9" />
                  <path d="M160 18L202 18L202 60" stroke="white" strokeWidth="4" strokeLinecap="round" strokeOpacity=".9" />
                  <path d="M18 160L18 202L60 202" stroke="white" strokeWidth="4" strokeLinecap="round" strokeOpacity=".9" />
                  <path d="M160 202L202 202L202 160" stroke="white" strokeWidth="4" strokeLinecap="round" strokeOpacity=".9" />
                </svg>
              </div>

              <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none overflow-hidden">
                <div className="w-52 animate-pulse">
                  <div className="h-px bg-white/60" />
                </div>
              </div>

              {cameraError ? (
                <div className="h-80 flex flex-col items-center justify-center gap-3 text-white">
                  <span className="text-4xl">📷</span>
                  <span className="font-medium">Cámara no disponible</span>
                  <span className="text-sm text-white/60 text-center px-8">
                    Verifica los permisos y usa la cámara trasera del dispositivo
                  </span>
                </div>
              ) : (
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  mirrored={false}
                  forceScreenshotSourceSize
                  videoConstraints={{
                    facingMode: { ideal: "environment" },
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                  }}
                  onUserMedia={() => {
                    setCameraError(false);
                    setCameraReady(true);
                  }}
                  onUserMediaError={() => {
                    setCameraError(true);
                    setCameraReady(false);
                  }}
                  className="w-full block"
                  style={{ maxHeight: 500, objectFit: "cover" }}
                />
              )}

              <canvas ref={canvasRef} className="hidden" />

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-4 py-2 text-white text-xs font-medium">
                {validating || scanning ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                    Validando…
                  </>
                ) : cameraReady ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    Escaneando
                  </>
                ) : (
                  <>
                    <Spinner />
                    Inicializando cámara
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col overflow-hidden max-h-[640px]">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-800">Historial</span>
              {history.length > 0 && (
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                  {history.length}
                </span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-300">
                  <span className="text-3xl">📋</span>
                  <span className="text-xs">Los escaneos aparecerán aquí</span>
                </div>
              ) : (
                history.map((entry) => <HistoryRow key={entry.id} entry={entry} />)
              )}
            </div>
          </div>
        </div>
      </div>

      {overlayResult && (
        <ScanResultOverlay
          result={overlayResult}
          onDismiss={() => {
            setOverlayResult(null);
            lastDecodedRef.current = "";
            lastDecodedAtRef.current = 0;
          }}
        />
      )}
      <Footer />
    </DashboardLayout>
  );
}
