import { memo, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import roseParadeImage from "assets/images/roseparade.webp";
import { normalizeTimeTo12h } from "utils/dateHelpers";
import { getRoseParadeEventMeta } from "utils/roseParade";

const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const DAY_MS = 24 * 60 * MINUTE_MS;
const STORY_WIDTH = 1080;
const STORY_HEIGHT = 1920;

function getEventTarget(event) {
  const timestamp = Number(event.date);
  if (!Number.isFinite(timestamp)) return 0;

  const dateKey = new Date(timestamp).toISOString().slice(0, 10);
  const normalizedTime = normalizeTimeTo12h(event.time);
  const match = normalizedTime.match(/^(\d{1,2}):(\d{2})(am|pm)$/i);
  if (!match) return new Date(`${dateKey}T00:00:00-06:00`).getTime();

  let hours = Number(match[1]);
  if (match[3].toLowerCase() === "pm" && hours !== 12) hours += 12;
  if (match[3].toLowerCase() === "am" && hours === 12) hours = 0;

  return new Date(`${dateKey}T${pad(hours)}:${match[2]}:00-06:00`).getTime();
}

function getCountdown(target, now = Date.now()) {
  const remaining = Math.max(0, target - now);
  const days = Math.floor(remaining / DAY_MS);
  const hours = Math.floor((remaining % DAY_MS) / (60 * MINUTE_MS));
  const minutes = Math.floor((remaining % (60 * MINUTE_MS)) / MINUTE_MS);
  const seconds = Math.floor((remaining % MINUTE_MS) / SECOND_MS);
  return { days, hours, minutes, seconds, ended: remaining === 0 };
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function drawCentered(ctx, text, y, font, color, maxWidth) {
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.textAlign = "center";
  if (maxWidth) ctx.fillText(text, 540, y, maxWidth);
  else ctx.fillText(text, 540, y);
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function resetShadow(ctx) {
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

function drawRoundedImage(ctx, x, y, width, height, radius, drawContent) {
  ctx.save();
  roundRect(ctx, x, y, width, height, radius);
  ctx.clip();
  drawContent();
  ctx.restore();
}

function drawPill(ctx, text, x, y, width, height, background, foreground) {
  ctx.save();
  ctx.shadowColor = "rgba(15,23,42,0.1)";
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 5;
  roundRect(ctx, x, y, width, height, height / 2);
  ctx.fillStyle = background;
  ctx.fill();
  resetShadow(ctx);
  ctx.fillStyle = foreground;
  ctx.font = "800 22px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + width / 2, y + height / 2 + 1);
  ctx.restore();
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines = Infinity) {
  const words = String(text).split(/\s+/);
  let line = "";
  let lineCount = 0;

  for (let index = 0; index < words.length; index += 1) {
    const testLine = line ? `${line} ${words[index]}` : words[index];
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, y + lineCount * lineHeight);
      line = words[index];
      lineCount += 1;
      if (lineCount >= maxLines) return;
    } else {
      line = testLine;
    }
  }

  if (line && lineCount < maxLines) ctx.fillText(line, x, y + lineCount * lineHeight);
}

function drawRose(ctx, x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = "#e11d48";
  ctx.fillStyle = "#fb7185";
  ctx.lineWidth = 3 * scale;
  for (let index = 0; index < 5; index += 1) {
    ctx.save();
    ctx.rotate((index * Math.PI * 2) / 5);
    ctx.beginPath();
    ctx.ellipse(0, -10 * scale, 8 * scale, 13 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(0, 0, 7 * scale, 0, Math.PI * 2);
  ctx.fillStyle = "#be123c";
  ctx.fill();
  ctx.restore();
}

function drawCoverImage(ctx, image, x, y, width, height) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const sourceX = (image.naturalWidth - sourceWidth) / 2;
  const sourceY = (image.naturalHeight - sourceHeight) / 2;
  ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

function drawHero(ctx, image) {
  drawRoundedImage(ctx, 140, 170, 800, 400, 48, () => {
    if (image) {
      drawCoverImage(ctx, image, 140, 170, 800, 400);
      const overlay = ctx.createLinearGradient(140, 170, 140, 570);
      overlay.addColorStop(0, "rgba(15,23,42,0.04)");
      overlay.addColorStop(1, "rgba(15,23,42,0.22)");
      ctx.fillStyle = overlay;
      ctx.fillRect(140, 170, 800, 400);
      return;
    }

    const sky = ctx.createLinearGradient(140, 170, 940, 570);
    sky.addColorStop(0, "#1e3a8a");
    sky.addColorStop(0.45, "#fb7185");
    sky.addColorStop(0.72, "#f59e0b");
    sky.addColorStop(1, "#fef3c7");
    ctx.fillStyle = sky;
    ctx.fillRect(140, 170, 800, 400);

    const sun = ctx.createRadialGradient(735, 315, 12, 735, 315, 155);
    sun.addColorStop(0, "rgba(255,251,235,0.98)");
    sun.addColorStop(0.4, "rgba(253,230,138,0.55)");
    sun.addColorStop(1, "rgba(251,113,133,0)");
    ctx.fillStyle = sun;
    ctx.fillRect(550, 170, 390, 300);

    ctx.fillStyle = "rgba(15,23,42,0.42)";
    ctx.beginPath();
    ctx.moveTo(140, 495);
    ctx.bezierCurveTo(350, 430, 585, 550, 940, 440);
    ctx.lineTo(940, 570);
    ctx.lineTo(140, 570);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.42)";
    ctx.lineWidth = 3;
    for (let index = 0; index < 4; index += 1) {
      ctx.beginPath();
      ctx.moveTo(205, 305 + index * 26);
      ctx.bezierCurveTo(370, 265 + index * 28, 565, 355 + index * 24, 815, 295 + index * 22);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(255,255,255,0.88)";
    ctx.font = "700 36px Arial, sans-serif";
    ctx.fillText("♪", 290, 315);
    ctx.fillText("♫", 555, 385);
    ctx.fillText("♪", 815, 320);
    drawRose(ctx, 865, 475, 1.35);
    drawRose(ctx, 800, 510, 0.9);

    const overlay = ctx.createLinearGradient(140, 170, 140, 570);
    overlay.addColorStop(0, "rgba(15,23,42,0.02)");
    overlay.addColorStop(1, "rgba(15,23,42,0.24)");
    ctx.fillStyle = overlay;
    ctx.fillRect(140, 170, 800, 400);
  });
}

function loadImage(src) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

function drawAvatar(ctx, x, y, label, background, foreground = "#0f172a") {
  ctx.save();
  ctx.shadowColor = "rgba(15,23,42,0.12)";
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = background;
  ctx.strokeStyle = "#fafafb";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(x, y, 39, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  resetShadow(ctx);
  ctx.fillStyle = foreground;
  ctx.font = label.length > 3 ? "800 17px Arial, sans-serif" : "800 25px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x, y + 1);
  ctx.restore();
}

async function createStoryBlob(event, countdown) {
  const heroImage = await loadImage(roseParadeImage);

  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = STORY_WIDTH;
    canvas.height = STORY_HEIGHT;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#fafafb";
    ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT);

    ctx.save();
    ctx.shadowColor = "rgba(15,23,42,0.1)";
    ctx.shadowBlur = 32;
    ctx.shadowOffsetY = 12;
    roundRect(ctx, 74, 90, 932, 1740, 96);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    resetShadow(ctx);
    ctx.strokeStyle = "rgba(226,232,240,0.9)";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    drawHero(ctx, heroImage);
    drawPill(
      ctx,
      "🌹  Desfile de las Rosas",
      174,
      202,
      286,
      54,
      "rgba(250,250,251,0.9)",
      "#be123c"
    );

    drawPill(ctx, "🌹  Desfile de las Rosas", 380, 620, 320, 52, "#fff1f2", "#e11d48");
    drawCentered(ctx, "Desfile de las Rosas", 760, "900 68px Arial, sans-serif", "#111827", 820);
    drawCentered(
      ctx,
      "1 de enero de 2027 · Pasadena 2027",
      815,
      "500 30px Arial, sans-serif",
      "#6b7280"
    );

    ctx.fillStyle = "#eef2f7";
    roundRect(ctx, 130, 875, 820, 190, 32);
    ctx.fill();

    const items = [
      [String(countdown.days), "Días"],
      [pad(countdown.hours), "Horas"],
      [pad(countdown.minutes), "Minutos"],
      [pad(countdown.seconds), "Segundos"],
    ];
    items.forEach(([value, label], index) => {
      const x = 233 + index * 205;
      if (index) {
        ctx.fillStyle = "rgba(148,163,184,0.36)";
        ctx.fillRect(x - 103, 913, 2, 112);
      }
      ctx.fillStyle = "#111827";
      ctx.font = "900 68px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(value, x, 971);
      ctx.fillStyle = "#6b7280";
      ctx.font = "600 20px Arial, sans-serif";
      ctx.fillText(label, x, 1020);
    });

    const avatarY = 1142;
    const avatarStartX = 393;
    drawAvatar(ctx, avatarStartX, avatarY, "🌹", "#fff1f2");
    drawAvatar(ctx, avatarStartX + 62, avatarY, "♫", "#fef3c7", "#b45309");
    drawAvatar(ctx, avatarStartX + 124, avatarY, "🇨🇷", "#eff6ff");
    drawAvatar(ctx, avatarStartX + 186, avatarY, "BCDB", "#e2e8f0");
    drawAvatar(ctx, avatarStartX + 248, avatarY, "+2027", "#f1f5f9", "#64748b");

    ctx.fillStyle = "#111827";
    ctx.font = "800 28px Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Rumbo a Pasadena", 140, 1262);
    ctx.textAlign = "right";
    ctx.fillText("Fecha: 01-01-2027", 940, 1262);

    ctx.fillStyle = "rgba(148,163,184,0.42)";
    ctx.fillRect(140, 1302, 800, 2);

    ctx.fillStyle = "#0f172a";
    ctx.font = "900 46px Arial, sans-serif";
    ctx.textAlign = "left";
    drawWrappedText(ctx, "Costa Rica marcha hacia Pasadena", 140, 1402, 800, 55, 2);

    ctx.fillStyle = "#334155";
    ctx.font = "500 29px Arial, sans-serif";
    drawWrappedText(
      ctx,
      "La Banda CEDES Don Bosco se prepara para representar a Costa Rica en Pasadena. Cada ensayo, cada paso y cada nota nos acerca a este momento histórico.",
      140,
      1532,
      800,
      46,
      4
    );

    if (event.title && event.title !== "Desfile de las Rosas") {
      ctx.fillStyle = "#e11d48";
      ctx.font = "700 22px Arial, sans-serif";
      ctx.fillText(event.title, 140, 1752, 800);
    }

    canvas.toBlob(resolve, "image/png");
  });
}

export default function RoseParadeEventCountdown({ event, featured = false }) {
  const milestone = getRoseParadeEventMeta(event);
  const target = useMemo(() => getEventTarget(event), [event.date, event.time]);
  const [countdown, setCountdown] = useState(() => getCountdown(target));
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!milestone?.isParadeDay) return undefined;
    setCountdown(getCountdown(target));
    const timer = setInterval(() => setCountdown(getCountdown(target)), SECOND_MS);
    return () => clearInterval(timer);
  }, [milestone?.isParadeDay, target]);

  if (!milestone?.isParadeDay) return null;

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await createStoryBlob(event, countdown);
      if (!blob) return;
      const file = new File([blob], "rose-parade-2027-instagram-story.png", { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Desfile de las Rosas 2027" });
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      if (error?.name !== "AbortError") throw error;
    } finally {
      setExporting(false);
    }
  };

  if (featured) {
    return (
      <div className="rounded-2xl border border-white/20 bg-white/15 p-3 shadow-lg shadow-slate-950/10 backdrop-blur-md sm:p-4">
        <div className="grid grid-cols-4 gap-2">
          <CountdownUnit value={countdown.ended ? "00" : countdown.days} label="Días" featured />
          <CountdownUnit
            value={countdown.ended ? "00" : pad(countdown.hours)}
            label="Horas"
            featured
          />
          <CountdownUnit
            value={countdown.ended ? "00" : pad(countdown.minutes)}
            label="Min"
            featured
          />
          <CountdownUnit
            value={countdown.ended ? "00" : pad(countdown.seconds)}
            label="Seg"
            featured
          />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[24px] bg-slate-100/80 px-3 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:px-4 sm:py-5">
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-rose-600">
            Rumbo a Pasadena
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-600">Desfile de las Rosas 2027</p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-bold text-rose-600 shadow-sm ring-1 ring-slate-200/80 transition-all duration-200 hover:bg-rose-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
        >
          <ShareIcon />
          {exporting ? "Preparando..." : "Compartir"}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-4 divide-x divide-slate-200/80">
        <CountdownUnit value={countdown.ended ? "00" : countdown.days} label="Días" />
        <CountdownUnit value={countdown.ended ? "00" : pad(countdown.hours)} label="Horas" />
        <CountdownUnit value={countdown.ended ? "00" : pad(countdown.minutes)} label="Min" />
        <CountdownUnit value={countdown.ended ? "00" : pad(countdown.seconds)} label="Seg" />
      </div>
    </div>
  );
}

const CountdownUnit = memo(function CountdownUnit({ value, label, featured = false }) {
  return (
    <div
      className={`px-1.5 py-2 text-center sm:px-2 ${
        featured ? "rounded-xl bg-white/10 text-white" : "text-slate-950"
      }`}
    >
      <strong className="block text-2xl font-black tracking-tight sm:text-3xl">{value}</strong>
      <span
        className={`mt-1 block text-[9px] font-bold uppercase tracking-[0.12em] ${
          featured ? "text-white/75" : "text-slate-400"
        }`}
      >
        {label}
      </span>
    </div>
  );
});

const ShareIcon = () => (
  <svg
    className="h-3.5 w-3.5"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="2"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M7.5 12h9m0 0-3.75-3.75M16.5 12l-3.75 3.75M6 3.75h12A2.25 2.25 0 0 1 20.25 6v12A2.25 2.25 0 0 1 18 20.25H6A2.25 2.25 0 0 1 3.75 18V6A2.25 2.25 0 0 1 6 3.75Z"
    />
  </svg>
);

RoseParadeEventCountdown.propTypes = {
  event: PropTypes.object.isRequired,
  featured: PropTypes.bool,
};

CountdownUnit.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  label: PropTypes.string.isRequired,
  featured: PropTypes.bool,
};
