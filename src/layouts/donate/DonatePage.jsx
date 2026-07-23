/* eslint-disable react/prop-types */
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown, Copy, Download, Lock, Share2, Users } from "lucide-react";
import PropTypes from "prop-types";

import Header from "components/Header";
import Footer from "components/Footer";
import Seo from "components/Seo";
import RoseParadeProgressMark from "components/donations/RoseParadeProgressMark";
import {
  campaignProgress,
  cardPayments,
  donationAmounts,
  donationCampaign,
  sponsors,
  sponsorLevelOrder,
  transferMethods,
} from "config/donationCampaign";
import { trackDonationEvent } from "utils/donationAnalytics";

const Confetti = lazy(() => import("react-confetti"));

const money = (value, lang) =>
  new Intl.NumberFormat(lang === "en" ? "en-US" : "es-CR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

async function copyText(value) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value);
  const input = document.createElement("textarea");
  input.value = value;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  const copied = document.execCommand("copy");
  input.remove();
  if (!copied) throw new Error("copy-failed");
}

function ActionButton({ children, className = "", ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 font-semibold outline-none transition duration-200 focus-visible:ring-4 focus-visible:ring-sky-300 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

ActionButton.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

function StudentGrid({ t, lang }) {
  const funded = Math.min(
    campaignProgress.fundedStudents,
    campaignProgress.totalStudentEquivalents
  );
  const [isSimulating, setIsSimulating] = useState(false);
  const [celebrationKey, setCelebrationKey] = useState(0);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [reduceMotion, setReduceMotion] = useState(false);
  const displayedFunded = isSimulating
    ? campaignProgress.totalStudentEquivalents
    : funded;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setReduceMotion(media.matches);
    updateMotionPreference();
    media.addEventListener?.("change", updateMotionPreference);
    return () => media.removeEventListener?.("change", updateMotionPreference);
  }, []);

  useEffect(() => {
    if (!isSimulating) return undefined;
    const updateViewport = () =>
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, [isSimulating]);

  const toggleSimulation = () => {
    if (isSimulating) {
      setIsSimulating(false);
      return;
    }

    setCelebrationKey((key) => key + 1);
    setIsSimulating(true);
  };

  return (
    <div className="mt-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-950 sm:text-3xl">{t("donate.gridTitle")}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {t("donate.gridHelp", {
              remainingStudents: campaignProgress.remainingStudents,
              remainingMoney: money(campaignProgress.remaining, lang),
            })}
          </p>
        </div>
        <span className="text-sm font-semibold text-slate-600">
          {t("donate.logoProgress.total", {
            funded,
            remaining: campaignProgress.remainingStudents,
          })}
        </span>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 sm:p-8">
        {isSimulating && !reduceMotion && viewport.width > 0 && (
          <Suspense fallback={null}>
            <Confetti
              key={celebrationKey}
              width={viewport.width}
              height={viewport.height}
              numberOfPieces={750}
              recycle={false}
              gravity={0.14}
              initialVelocityX={14}
              initialVelocityY={28}
              tweenDuration={9000}
              colors={["#e4002b", "#0c4a6e", "#38bdf8", "#f5b335", "#15803d", "#f8fafc"]}
              className="pointer-events-none fixed inset-0 z-[100]"
              aria-hidden="true"
            />
          </Suspense>
        )}

        <div className="mx-auto w-full max-w-[520px]">
          <RoseParadeProgressMark
            total={campaignProgress.totalStudentEquivalents}
            funded={displayedFunded}
            t={t}
          />
        </div>

        <div className="relative z-10 mx-auto mt-6 flex max-w-2xl flex-col items-center text-center">
          <p className="min-h-6 text-sm font-semibold text-slate-700" aria-live="polite">
            {isSimulating
              ? t("donate.logoProgress.simulationActive", {
                  total: campaignProgress.totalStudentEquivalents,
                })
              : t("donate.logoProgress.simulationHelp", {
                  total: campaignProgress.totalStudentEquivalents,
                })}
          </p>
          <button
            type="button"
            onClick={toggleSimulation}
            aria-pressed={isSimulating}
            className={`mt-4 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 font-bold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-300 ${
              isSimulating
                ? "border border-slate-300 bg-white text-sky-950 hover:bg-slate-50"
                : "bg-sky-950 text-white hover:bg-sky-900"
            }`}
          >
            {isSimulating
              ? t("donate.logoProgress.restoreProgress")
              : t("donate.logoProgress.simulateGoal")}
          </button>
        </div>
      </div>
    </div>
  );
}

StudentGrid.propTypes = {
  t: PropTypes.func.isRequired,
  lang: PropTypes.oneOf(["es", "en"]).isRequired,
};

function SharePanel({ t, lang, url, announce }) {
  const [copiedKind, setCopiedKind] = useState("");
  const copiedTimer = useRef();
  const message = t("donate.shareText", {
    participants: donationCampaign.participantCount,
    remaining: campaignProgress.remainingStudents,
  });

  useEffect(
    () => () => {
      clearTimeout(copiedTimer.current);
    },
    []
  );

  const downloadStory = async () => {
    try {
      const image = new Image();
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
        image.src = "/images/story-image.png";
      });
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1920;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("canvas-unavailable");
      const drawRoundedRect = (x, y, width, height, radius) => {
        const safeRadius = Math.min(radius, width / 2, height / 2);
        context.beginPath();
        context.moveTo(x + safeRadius, y);
        context.lineTo(x + width - safeRadius, y);
        context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
        context.lineTo(x + width, y + height - safeRadius);
        context.quadraticCurveTo(
          x + width,
          y + height,
          x + width - safeRadius,
          y + height
        );
        context.lineTo(x + safeRadius, y + height);
        context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
        context.lineTo(x, y + safeRadius);
        context.quadraticCurveTo(x, y, x + safeRadius, y);
        context.closePath();
      };
      const imageScale =
        Math.max(canvas.width / image.width, canvas.height / image.height) * 1.16;
      const imageWidth = image.width * imageScale;
      const imageHeight = image.height * imageScale;
      context.drawImage(
        image,
        (canvas.width - imageWidth) / 2,
        0,
        imageWidth,
        imageHeight
      );
      const overlay = context.createLinearGradient(0, 0, 0, canvas.height);
      overlay.addColorStop(0, "rgba(8,47,73,.78)");
      overlay.addColorStop(0.24, "rgba(8,47,73,.44)");
      overlay.addColorStop(0.38, "rgba(8,47,73,.08)");
      overlay.addColorStop(0.58, "rgba(8,47,73,.12)");
      overlay.addColorStop(0.68, "rgba(8,47,73,.78)");
      overlay.addColorStop(0.84, "rgba(8,47,73,.96)");
      overlay.addColorStop(1, "rgba(8,47,73,.99)");
      context.fillStyle = overlay;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.textBaseline = "top";
      context.textAlign = "left";
      context.fillStyle = "#bae6fd";
      context.font = "700 34px Arial";
      context.fillText(t("donate.shareImageEyebrow").toUpperCase(), 72, 92);
      context.fillStyle = "#f8fafc";
      context.font = "800 72px Arial";
      [
        t("donate.shareImageMembers", { participants: donationCampaign.participantCount }),
        t("donate.shareImageDestination"),
        `${t("donate.eventName")}.`,
      ].forEach((line, index) => context.fillText(line, 72, 165 + index * 86));

      drawRoundedRect(48, 1200, 984, 286, 34);
      context.fillStyle = "rgba(8,47,73,.82)";
      context.fill();
      context.strokeStyle = "rgba(125,211,252,.28)";
      context.lineWidth = 2;
      context.stroke();

      context.fillStyle = "#7dd3fc";
      context.font = "800 68px Arial";
      context.textAlign = "left";
      context.shadowColor = "rgba(56,189,248,.3)";
      context.shadowBlur = 18;
      context.fillText(`${campaignProgress.percentage.toFixed(2)}%`, 72, 1238);
      context.shadowBlur = 0;
      context.fillStyle = "#bae6fd";
      context.font = "800 23px Arial";
      context.fillText(t("donate.logoProgress.reached").toUpperCase(), 74, 1315);
      context.fillStyle = "#e0f2fe";
      context.font = "600 28px Arial";
      context.textAlign = "right";
      context.fillText(
        `${money(donationCampaign.raised, lang)} ${t("donate.raised")}`,
        1008,
        1278
      );

      const progressX = 72;
      const progressY = 1355;
      const progressWidth = 936;
      const progressHeight = 22;
      drawRoundedRect(progressX, progressY, progressWidth, progressHeight, progressHeight / 2);
      context.fillStyle = "rgba(255,255,255,.24)";
      context.fill();
      const fundedRatio = Math.min(Math.max(campaignProgress.percentage / 100, 0), 1);
      if (fundedRatio > 0) {
        const fundedWidth = Math.max(progressHeight, progressWidth * fundedRatio);
        drawRoundedRect(progressX, progressY, fundedWidth, progressHeight, progressHeight / 2);
        context.fillStyle = "#38bdf8";
        context.fill();
      }

      context.fillStyle = "#e0f2fe";
      context.font = "600 27px Arial";
      context.textAlign = "left";
      context.fillText(
        t("donate.funded", { count: campaignProgress.fundedStudents }),
        72,
        1405
      );
      context.textAlign = "right";
      context.fillText(
        `${money(campaignProgress.remaining, lang)} ${t("donate.pending")}`,
        1008,
        1405
      );
      context.fillStyle = "#e4002b";
      drawRoundedRect(72, 1525, 936, 174, 34);
      context.fill();
      context.fillStyle = "#f8fafc";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.font = "700 24px Arial";
      context.fillText(t("donate.shareImageCtaEyebrow").toUpperCase(), 540, 1571, 840);
      context.font = "900 52px Arial";
      context.fillText(t("donate.shareImageCta").toUpperCase(), 540, 1641, 840);

      drawRoundedRect(72, 1723, 936, 137, 28);
      context.fillStyle = "#f8fafc";
      context.fill();
      context.strokeStyle = "#7dd3fc";
      context.lineWidth = 3;
      context.stroke();
      context.fillStyle = "#e4002b";
      context.font = "900 22px Arial";
      context.fillText(t("donate.shareImageDonateAt").toUpperCase(), 540, 1759);
      context.fillStyle = "#082f49";
      context.font = "800 34px Arial";
      context.fillText(url.replace(/^https?:\/\//, ""), 540, 1812, 840);

      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (file) => (file ? resolve(file) : reject(new Error("image-generation-failed"))),
          "image/jpeg",
          0.92
        );
      });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = "bcdb-desfile-de-las-rosas-story.jpg";
      link.href = downloadUrl;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 60000);
      trackDonationEvent("campaign_shared", { channel: "story_download" });
    } catch {
      announce(t("donate.storyDownloadFailed"));
    }
  };
  const share = async () => {
    try {
      if (!navigator.share) throw new Error("unsupported");
      await navigator.share({
        title: t("donate.title", { participants: donationCampaign.participantCount }),
        text: message,
        url,
      });
      trackDonationEvent("campaign_shared", { channel: "native" });
    } catch (error) {
      if (error?.name !== "AbortError") announce(t("donate.shareFailed"));
    }
  };
  const copy = async (kind, value) => {
    try {
      await copyText(value);
      const confirmation = t(kind === "link" ? "donate.linkCopied" : "donate.messageCopied");
      setCopiedKind(kind);
      clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopiedKind(""), 2500);
      announce(confirmation);
      trackDonationEvent("campaign_shared", { channel: `copy_${kind}` });
    } catch {
      setCopiedKind("");
      announce(t("donate.payment.failed"));
    }
  };
  return (
    <section
      id="compartir"
      className="relative isolate min-h-[620px] overflow-hidden bg-sky-950 text-white lg:min-h-[760px]"
    >
      <picture className="absolute inset-0 -z-20 block h-full w-full">
        <source media="(min-width: 640px)" srcSet="/images/integrantes.png" />
        <img
          src="/images/integrantes.png"
          alt=""
          className="h-full w-full object-cover object-[54%_center] sm:object-top"
          loading="lazy"
          decoding="async"
        />
      </picture>
      <div className="absolute inset-0 -z-10 bg-sky-950/90 lg:bg-gradient-to-b lg:from-sky-950/25 lg:via-sky-950/40 lg:to-sky-950/95" />

      <div className="mx-auto grid min-h-[620px] max-w-screen-xl items-center gap-10 px-5 py-16 sm:px-6 sm:py-20 lg:min-h-[760px] lg:grid-cols-[0.8fr_1.2fr] lg:items-end lg:px-8 lg:pb-16 lg:pt-[400px]">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-sky-300">
            {t("donate.eventName")}
          </p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">{t("donate.shareTitle")}</h2>
          <p className="mt-4 max-w-lg leading-7 text-sky-100">{message}</p>
          <ActionButton onClick={share} className="mt-7 bg-white text-sky-950 hover:bg-sky-100">
            <Share2 size={19} aria-hidden="true" /> {t("donate.nativeShare")}
          </ActionButton>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`${message} ${url}`)}`}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackDonationEvent("share_channel_selected", { channel: "whatsapp" })}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-sky-600/80 bg-sky-950/70 px-5 font-semibold hover:bg-sky-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-400"
            >
              {t("donate.whatsapp")}
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackDonationEvent("share_channel_selected", { channel: "facebook" })}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-sky-600/80 bg-sky-950/70 px-5 font-semibold hover:bg-sky-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-400"
            >
              {t("donate.facebook")}
            </a>
            <ActionButton
              onClick={() => copy("link", url)}
              className={`border ${
                copiedKind === "link"
                  ? "border-emerald-300 bg-emerald-950/80 text-emerald-100"
                  : "border-sky-600/80 bg-sky-950/70 hover:bg-sky-900"
              }`}
            >
              {copiedKind === "link" ? (
                <Check size={18} aria-hidden="true" />
              ) : (
                <Copy size={18} aria-hidden="true" />
              )}
              {copiedKind === "link" ? t("donate.linkCopied") : t("donate.copyLink")}
            </ActionButton>
            <ActionButton
              onClick={() => copy("message", `${message} ${url}`)}
              className={`border ${
                copiedKind === "message"
                  ? "border-emerald-300 bg-emerald-950/80 text-emerald-100"
                  : "border-sky-600/80 bg-sky-950/70 hover:bg-sky-900"
              }`}
            >
              {copiedKind === "message" ? (
                <Check size={18} aria-hidden="true" />
              ) : (
                <Copy size={18} aria-hidden="true" />
              )}
              {copiedKind === "message" ? t("donate.messageCopied") : t("donate.copyMessage")}
            </ActionButton>
            <ActionButton
              onClick={downloadStory}
              className="bg-sky-600 hover:bg-sky-500 sm:col-span-2"
            >
              <Download size={18} />
              {t("donate.downloadStory")}
            </ActionButton>
            <p className="text-sm leading-6 text-sky-100 sm:col-span-2">
              {t("donate.storyHelp")}
            </p>
        </div>
      </div>
    </section>
  );
}

SharePanel.propTypes = {
  t: PropTypes.func.isRequired,
  lang: PropTypes.oneOf(["es", "en"]).isRequired,
  url: PropTypes.string.isRequired,
  announce: PropTypes.func.isRequired,
};

function DonatePage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith("en") ? "en" : "es";
  const [amount, setAmount] = useState(100);
  const [custom, setCustom] = useState("");
  const [method, setMethod] = useState("card");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [copiedMethod, setCopiedMethod] = useState("");
  const noticeTimer = useRef();
  const copiedTimer = useRef();
  const url = `${window.location.origin}/${lang}/${lang === "en" ? "donate" : "donar"}`;
  const card = cardPayments.find((item) => item.amount === amount);
  const selectedAmount = custom !== "" ? Number(custom) : amount;
  const validAmount = Number.isFinite(selectedAmount) && selectedAmount > 0;
  const lastUpdated = donationCampaign.lastUpdated
    ? new Intl.DateTimeFormat(lang === "en" ? "en-US" : "es-CR", {
        dateStyle: "long",
        timeZone: "America/Costa_Rica",
      }).format(new Date(`${donationCampaign.lastUpdated}T12:00:00-06:00`))
    : t("donate.datePending");
  const sortedSponsors = useMemo(
    () =>
      [...sponsors].sort(
        (a, b) => (sponsorLevelOrder[a.level] ?? 99) - (sponsorLevelOrder[b.level] ?? 99)
      ),
    []
  );

  useEffect(() => {
    trackDonationEvent("donation_page_view", { language: lang });
    return () => {
      clearTimeout(noticeTimer.current);
      clearTimeout(copiedTimer.current);
    };
  }, [lang]);

  const announce = (message) => {
    setNotice(message);
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(""), 3000);
  };

  const chooseAmount = (value) => {
    setAmount(value);
    setCustom("");
    setCheckoutOpen(false);
    if (!cardPayments.some((item) => item.amount === value)) setMethod("transfer");
    trackDonationEvent("donation_amount_selected", { amount: value, currency: "USD" });
  };

  const handleCopy = async (id, value) => {
    try {
      await copyText(value);
      setCopiedMethod(id);
      clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopiedMethod(""), 2500);
      announce(t("donate.payment.copied"));
      trackDonationEvent("bank_details_copied", { method: id });
    } catch {
      setCopiedMethod("");
      announce(t("donate.payment.failed"));
    }
  };

  const contributionValue = donationCampaign.contributionPerStudent;
  const completeEquivalents = validAmount ? Math.floor(selectedAmount / contributionValue) : 0;
  const contributionRemainder = validAmount ? selectedAmount % contributionValue : 0;
  const remainingToNext = contributionValue - contributionRemainder;

  const impactText = !validAmount
    ? t("donate.invalid")
    : selectedAmount === contributionValue
    ? t("donate.selectedComplete")
    : selectedAmount > contributionValue && contributionRemainder === 0
    ? t("donate.selectedMultiple", {
        count: completeEquivalents,
      })
    : selectedAmount > contributionValue
    ? t("donate.selectedMultipleProgress", {
        count: completeEquivalents,
        amount: money(contributionRemainder, lang),
        remaining: money(remainingToNext, lang),
      })
    : t("donate.selectedImpact", {
        amount: money(selectedAmount, lang),
        remaining: money(remainingToNext, lang),
      });

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <Seo
        title={t("donate.seo.title", {
          participants: donationCampaign.participantCount,
          remaining: campaignProgress.remainingStudents,
        })}
        description={t("donate.seo.description", {
          participants: donationCampaign.participantCount,
          remaining: campaignProgress.remainingStudents,
        })}
        image={`${window.location.origin}/images/rose-parade-social.jpg`}
        path={`/${lang}/${lang === "en" ? "donate" : "donar"}`}
        type="website"
        locale={lang === "en" ? "en_US" : "es_CR"}
      />
      <Header />
      <main>
        <section className="relative isolate min-h-[720px] overflow-hidden bg-sky-950 text-white">
          <picture className="absolute inset-0 block h-full w-full">
            <source media="(min-width: 640px)" srcSet="/images/imagen%20horizontal.png" />
            <img
              src="/images/imagen%20vertical.png"
              alt=""
              className="h-full w-full object-cover object-center"
              fetchPriority="high"
            />
          </picture>
          <div className="absolute inset-0 bg-sky-950/70 sm:bg-[linear-gradient(90deg,rgba(8,47,73,.97)_0%,rgba(8,47,73,.84)_46%,rgba(8,47,73,.08)_78%)]" />
          <div className="relative mx-auto grid min-h-[720px] max-w-screen-xl items-center px-5 py-16 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:px-8">
            <div className="max-w-3xl">
              <p className="font-bold uppercase tracking-[0.2em] text-sky-300">
                {t("donate.rose")}
              </p>
              <h1 className="mt-5 text-5xl font-extrabold leading-[.98] tracking-tight sm:text-6xl lg:text-7xl">
                {t("donate.title", { participants: donationCampaign.participantCount })}
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-sky-50 sm:text-xl">
                {t("donate.intro", {
                  funded: campaignProgress.fundedStudents,
                  participants: donationCampaign.participantCount,
                  remaining: campaignProgress.remainingStudents,
                })}
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#donar-ahora"
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#e4002b] px-7 font-bold text-white hover:bg-[#bd0023] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-300"
                >
                  {t("donate.primary")}
                </a>
                <a
                  href="#compartir"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/60 px-7 font-bold hover:bg-white/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-300"
                >
                  <Share2 size={18} />
                  {t("donate.share")}
                </a>
              </div>
              <div className="mt-10 max-w-2xl" aria-label={t("donate.progressLabel")}>
                <div className="mb-3 flex items-end justify-between gap-4">
                  <span className="text-3xl font-extrabold">
                    {campaignProgress.percentage.toFixed(2)}%
                  </span>
                  <span className="text-sm text-sky-100">
                    {money(donationCampaign.raised, lang)} {t("donate.raised")}
                  </span>
                </div>
                <div
                  className="h-3 overflow-hidden rounded-full bg-white/20"
                  role="progressbar"
                  aria-valuemin="0"
                  aria-valuemax={donationCampaign.goal}
                  aria-valuenow={donationCampaign.raised}
                >
                  <div
                    className="h-full rounded-full bg-sky-400"
                    style={{ width: `${campaignProgress.percentage}%` }}
                  />
                </div>
                <div className="mt-3 flex justify-between text-sm text-sky-100">
                  <span>{t("donate.funded", { count: campaignProgress.fundedStudents })}</span>
                  <span>
                    {money(campaignProgress.remaining, lang)} {t("donate.pending")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-screen-xl px-5 sm:px-6 lg:px-8">
            <div className="grid gap-6 border-b border-slate-200 pb-10 sm:grid-cols-2 lg:grid-cols-4">
              {[
                [money(donationCampaign.raised, lang), t("donate.raised")],
                [money(donationCampaign.goal, lang), t("donate.goal")],
                [money(campaignProgress.remaining, lang), t("donate.pending")],
                [lastUpdated, t("donate.updated")],
              ].map(([value, label]) => (
                <div key={label}>
                  <p className="text-2xl font-extrabold text-sky-950 sm:text-3xl">{value}</p>
                  <p className="mt-1 text-sm text-slate-600">{label}</p>
                </div>
              ))}
            </div>
            <StudentGrid t={t} lang={lang} />
          </div>
        </section>

        <section id="donar-ahora" className="scroll-mt-6 bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-screen-xl px-5 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[.85fr_1.15fr]">
              <div>
                <p className="text-sm font-bold uppercase tracking-[.18em] text-[#e4002b]">
                  {t("donate.eventName")}
                </p>
                <h2 className="mt-3 text-3xl font-extrabold text-sky-950 sm:text-5xl">
                  {t("donate.chooseTitle")}
                </h2>
                <p className="mt-5 max-w-xl leading-7 text-slate-600">{t("donate.chooseIntro")}</p>
                <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {donationAmounts.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => chooseAmount(value)}
                      aria-pressed={custom === "" && amount === value}
                      className={`min-h-14 rounded-xl border px-3 font-bold outline-none transition focus-visible:ring-4 focus-visible:ring-sky-300 ${
                        custom === "" && amount === value
                          ? "border-sky-800 bg-sky-800 text-white"
                          : "border-slate-300 bg-white text-sky-950 hover:border-sky-600"
                      }`}
                    >
                      {money(value, lang)}
                    </button>
                  ))}
                  <label
                    className={`col-span-2 rounded-xl border p-3 sm:col-span-1 ${
                      custom !== "" ? "border-sky-800 ring-2 ring-sky-100" : "border-slate-300"
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-600">{t("donate.custom")}</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="1"
                      value={custom}
                      onChange={(e) => {
                        setCustom(e.target.value);
                        setMethod("transfer");
                        setCheckoutOpen(false);
                      }}
                      placeholder="USD"
                      aria-label={t("donate.customLabel")}
                      className="mt-1 w-full bg-transparent text-lg font-bold outline-none"
                    />
                  </label>
                </div>
                <p
                  className={`mt-5 text-lg font-bold ${
                    validAmount ? "text-sky-900" : "text-red-700"
                  }`}
                >
                  {impactText}
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold text-sky-950">{t("donate.paymentTitle")}</h3>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={!card}
                    onClick={() => {
                      setMethod("card");
                      setCheckoutOpen(false);
                      trackDonationEvent("donation_method_selected", { method: "card" });
                    }}
                    className={`min-h-14 rounded-xl border px-4 font-semibold outline-none focus-visible:ring-4 focus-visible:ring-sky-300 disabled:cursor-not-allowed disabled:opacity-45 ${
                      method === "card"
                        ? "border-sky-800 bg-sky-50 text-sky-950"
                        : "border-slate-300"
                    }`}
                  >
                    {t("donate.card")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMethod("transfer");
                      setCheckoutOpen(false);
                      trackDonationEvent("donation_method_selected", { method: "transfer" });
                    }}
                    className={`min-h-14 rounded-xl border px-4 font-semibold outline-none focus-visible:ring-4 focus-visible:ring-sky-300 ${
                      method === "transfer"
                        ? "border-sky-800 bg-sky-50 text-sky-950"
                        : "border-slate-300"
                    }`}
                  >
                    {t("donate.transfer")}
                  </button>
                </div>
                {method === "card" && card ? (
                  <div className="mt-6">
                    <p className="flex gap-2 text-sm leading-6 text-slate-600">
                      <Lock size={18} className="mt-0.5 shrink-0" />
                      {t("donate.secure")}
                    </p>
                    {!checkoutOpen ? (
                      <ActionButton
                        onClick={() => {
                          setCheckoutOpen(true);
                          trackDonationEvent("donation_checkout_opened", { amount });
                        }}
                        className="mt-5 w-full bg-[#e4002b] text-white hover:bg-[#bd0023]"
                      >
                        {t("donate.openCheckout", { amount })}
                      </ActionButton>
                    ) : (
                      <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white">
                        <iframe
                          src={card.src}
                          title={t("donate.checkoutTitle", { amount })}
                          className="h-[325px] w-full border-0"
                          loading="lazy"
                          sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-top-navigation-by-user-activation"
                        />
                        <p className="px-4 pb-4 text-xs leading-5 text-slate-500">
                          {t("donate.checkoutError")}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-6 space-y-3">
                    {transferMethods.map((item) => (
                      <div
                        key={item.id}
                        className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                            {t(item.labelKey)}
                          </p>
                          <p className="mt-1 break-all font-bold text-sky-950">{item.value}</p>
                        </div>
                        <ActionButton
                          onClick={() => handleCopy(item.id, item.value)}
                          className={`shrink-0 border px-4 text-sm ${
                            copiedMethod === item.id
                              ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                              : "border-slate-300 bg-white hover:border-sky-700"
                          }`}
                        >
                          {copiedMethod === item.id ? (
                            <Check size={17} aria-hidden="true" />
                          ) : (
                            <Copy size={17} aria-hidden="true" />
                          )}
                          <span className={copiedMethod === item.id ? "" : "hidden sm:inline"}>
                            {t(
                              copiedMethod === item.id
                                ? "donate.payment.copied"
                                : "donate.payment.copy"
                            )}
                          </span>
                        </ActionButton>
                      </div>
                    ))}
                    <div className="rounded-xl bg-sky-950 p-5 text-white">
                      <p className="text-xs font-bold uppercase tracking-wide text-sky-300">
                        {t("donate.payment.holder")}
                      </p>
                      <p className="mt-1 font-bold">{donationCampaign.accountHolder}</p>
                      <p className="mt-3 text-sm text-sky-100">
                        {t("donate.payment.instructions")}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-screen-xl px-5 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-extrabold text-sky-950 sm:text-5xl">
              {t("donate.collectiveTitle")}
            </h2>
            <p className="mt-4 text-lg text-slate-600">{t("donate.collectiveIntro")}</p>
            <div className="mt-10 divide-y divide-slate-200 border-y border-slate-200">
              {[
                [1, 2200],
                [2, 1100],
                [4, 550],
                [22, 100],
                [44, 50],
                [88, 25],
                [220, 10],
              ].map(([people, each]) => (
                <div
                  key={people}
                  className="grid grid-cols-[3.5rem_1fr] items-center gap-4 py-5 sm:grid-cols-[4.5rem_1fr] sm:gap-7"
                >
                  <span
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-100 text-lg font-extrabold text-sky-900 sm:h-16 sm:w-16 sm:text-xl"
                    aria-hidden="true"
                  >
                    {people}
                  </span>
                  <p className="max-w-3xl font-semibold leading-6 text-slate-800 sm:text-lg sm:leading-7">
                    {t(people === 1 ? "donate.collectivePlanOne" : "donate.collectivePlanMany", {
                      count: people,
                      amount: money(each, lang),
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="overflow-hidden bg-sky-950 text-white">
          <div className="grid w-full lg:grid-cols-[minmax(0,1.18fr)_minmax(480px,.82fr)]">
            <picture className="block h-[380px] overflow-hidden sm:h-[460px] lg:h-auto lg:min-h-[680px]">
              <source
                media="(min-width: 640px)"
                srcSet="/images/donations/banda-story-horizontal.png"
              />
              <img
                src="/images/donations/banda-story-vertical.png"
                alt={t("donate.storyImageAlt")}
                className="h-full w-full object-cover object-[center_38%] lg:min-h-[680px] lg:object-center"
                loading="lazy"
                decoding="async"
              />
            </picture>
            <div className="self-center px-5 py-16 sm:px-10 lg:max-w-2xl lg:px-14 lg:py-20 xl:px-16">
              <p className="text-sm font-bold uppercase tracking-[.18em] text-sky-300">
                {t("donate.storyEyebrow")}
              </p>
              <h2 className="mt-3 text-3xl font-extrabold sm:text-5xl">{t("donate.storyTitle")}</h2>
              <p className="mt-6 leading-8 text-sky-100">{t("donate.storyBody")}</p>
              <h3 className="mt-10 text-2xl font-bold">{t("donate.fundsTitle")}</h3>
              <p className="mt-3 leading-7 text-sky-100">{t("donate.fundsBody")}</p>
              <ul className="mt-5 grid gap-x-6 gap-y-3 text-sm text-sky-50 sm:grid-cols-2">
                {t("donate.fundsItems", { returnObjects: true }).map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-300"
                      aria-hidden="true"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Testimonios en pausa hasta contar con historias y autorizaciones oficiales. */}

        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-screen-xl px-5 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-extrabold text-sky-950 sm:text-5xl">
              {t("donate.sponsorsTitle")}
            </h2>
            {sortedSponsors.length ? (
              <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
                {sortedSponsors.map((sponsor) => {
                  const SponsorContainer = sponsor.url ? "a" : "article";
                  return (
                    <SponsorContainer
                      key={sponsor.id}
                      {...(sponsor.url
                        ? {
                            href: sponsor.url,
                            target: "_blank",
                            rel: "noopener noreferrer",
                            onClick: () =>
                              trackDonationEvent("sponsor_clicked", {
                                sponsor_id: sponsor.id,
                              }),
                          }
                        : {})}
                      className={`group flex items-center justify-center rounded-xl border p-6 transition-colors duration-200 ${
                        sponsor.darkBackground
                          ? "border-sky-950 bg-sky-950 hover:border-sky-700 hover:bg-sky-900"
                          : "border-slate-200 bg-white hover:border-sky-300"
                      } ${
                        sponsor.featured ? "col-span-2 min-h-44" : "min-h-36"
                      }`}
                    >
                      <img
                        src={sponsor.logo}
                        alt={sponsor.alt || sponsor.name}
                        className={`max-w-full object-contain transition-transform duration-200 group-hover:scale-[1.03] ${
                          sponsor.featured ? "max-h-24" : "max-h-20"
                        }`}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.hidden = true;
                        }}
                      />
                      <span className="sr-only">{sponsor.name}</span>
                    </SponsorContainer>
                  );
                })}
                <a
                  href={`mailto:${donationCampaign.contactEmail}?subject=${encodeURIComponent(
                    t("donate.sponsorInvitation.title")
                  )}`}
                  onClick={() =>
                    trackDonationEvent("corporate_contact_clicked", {
                      action: "sponsor_grid_invitation",
                    })
                  }
                  className="group col-span-2 flex min-h-36 flex-col justify-between rounded-xl bg-sky-950 p-5 text-white transition-colors duration-200 hover:bg-sky-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-300 sm:col-span-1 sm:p-6"
                >
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[.16em] text-sky-300">
                      {t("donate.sponsorInvitation.eyebrow")}
                    </p>
                    <h3 className="mt-3 text-lg font-extrabold leading-tight">
                      {t("donate.sponsorInvitation.title")}
                    </h3>
                    <p className="mt-3 text-sm leading-5 text-sky-100">
                      {t("donate.sponsorInvitation.body")}
                    </p>
                  </div>
                  <span className="mt-5 text-sm font-bold text-sky-200 group-hover:text-white">
                    {t("donate.sponsorInvitation.cta")} →
                  </span>
                </a>
              </div>
            ) : (
              <p className="mt-8 rounded-xl border border-dashed border-slate-300 p-6 text-slate-600">
                {t("donate.sponsorsEmpty")}
              </p>
            )}
            <div className="mt-12 border-t border-slate-200 pt-8">
              <h3 className="max-w-3xl text-2xl font-bold text-sky-950">
                {t("donate.corporateQuestion")}
              </h3>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <a
                  href={`mailto:${donationCampaign.contactEmail}?subject=${encodeURIComponent(
                    t("donate.corporateOptions")
                  )}`}
                  onClick={() =>
                    trackDonationEvent("corporate_contact_clicked", { action: "options" })
                  }
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-sky-800 px-6 font-semibold text-white hover:bg-sky-900"
                >
                  {t("donate.corporateOptions")}
                </a>
                <a
                  href={`mailto:${donationCampaign.contactEmail}`}
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-300 px-6 font-semibold text-sky-950 hover:border-sky-700"
                >
                  {t("donate.corporateContact")}
                </a>
                {/* <span
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-dashed border-slate-300 px-6 text-sm text-slate-500"
                  title={t("donate.proposalPending")}
                >
                  {t("donate.proposal")}
                </span> */}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-sky-950 py-16 text-white sm:py-24">
          <div className="mx-auto max-w-screen-xl px-5 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:gap-16">
              <div>
                <p className="text-sm font-bold uppercase tracking-[.18em] text-sky-300">
                  {t("donate.tax.eyebrow")}
                </p>
                <h2 className="mt-3 text-3xl font-extrabold leading-tight sm:text-5xl">
                  {t("donate.tax.title")}
                </h2>
                <p className="mt-6 leading-8 text-sky-100">{t("donate.tax.intro")}</p>
                <a
                  href={`https://wa.me/${
                    donationCampaign.deductibleReceiptWhatsapp
                  }?text=${encodeURIComponent(t("donate.tax.ctaMessage"))}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() =>
                    trackDonationEvent("deductible_receipt_clicked", { channel: "whatsapp" })
                  }
                  className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-[#e4002b] px-7 font-bold text-white hover:bg-[#bd0023] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-300"
                >
                  {t("donate.tax.cta")}
                </a>
              </div>
              <div>
                <ol className="divide-y divide-sky-800 border-y border-sky-800">
                  {[
                    [t("donate.tax.step1Title"), t("donate.tax.step1Body")],
                    [t("donate.tax.step2Title"), t("donate.tax.step2Body")],
                    [t("donate.tax.step3Title"), t("donate.tax.step3Body")],
                  ].map(([title, body], index) => (
                    <li key={title} className="grid grid-cols-[48px_1fr] gap-4 py-6">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-700 font-extrabold">
                        {index + 1}
                      </span>
                      <div>
                        <h3 className="text-lg font-bold">{title}</h3>
                        <p className="mt-2 leading-7 text-sky-100">{body}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                <div className="mt-6 rounded-xl bg-white p-6 text-sky-950">
                  <h3 className="font-extrabold">{t("donate.tax.limitTitle")}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {t("donate.tax.limitBody")}
                  </p>
                  <p className="mt-4 border-t border-slate-200 pt-4 text-sm font-semibold">
                    {t("donate.tax.small")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-16 sm:py-24">
          <div className="mx-auto grid max-w-screen-xl gap-12 px-5 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div>
              <h2 className="text-3xl font-extrabold text-sky-950 sm:text-5xl">
                {t("donate.transparencyTitle")}
              </h2>
              <dl className="mt-8 divide-y divide-slate-200 border-y border-slate-200">
                {[
                  [t("donate.goal"), money(donationCampaign.goal, lang)],
                  [t("donate.raised"), money(donationCampaign.raised, lang)],
                  [t("donate.updated"), lastUpdated],
                  [t("donate.responsible"), donationCampaign.accountHolder],
                  [
                    t("donate.officialMethods"),
                    "BAC Credomatic, SINPE Móvil, transferencia bancaria",
                  ],
                  [t("donate.contact"), donationCampaign.contactEmail],
                  [t("donate.useOfFunds"), t("donate.usePending")],
                ].map(([term, detail]) => (
                  <div key={term} className="grid gap-1 py-4 sm:grid-cols-[.42fr_.58fr]">
                    <dt className="font-bold text-slate-700">{term}</dt>
                    <dd className="break-words text-slate-600">{detail}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-sky-950">{t("donate.faqTitle")}</h3>
              <div className="mt-5 divide-y divide-slate-200 border-y border-slate-200">
                {[
                  [t("donate.faq1q"), t("donate.faq1a")],
                  [t("donate.faq2q"), t("donate.faq2a")],
                  [t("donate.faq3q"), t("donate.faq3a")],
                ].map(([question, answer]) => (
                  <details key={question} className="group py-5">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-sky-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-300">
                      {question}
                      <ChevronDown className="transition-transform group-open:rotate-180" />
                    </summary>
                    <p className="mt-3 leading-7 text-slate-600">{answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>

        <SharePanel t={t} lang={lang} url={url} announce={announce} />
        <section className="border-t border-sky-100 bg-white py-20 text-center sm:py-28">
          <div className="mx-auto max-w-4xl px-5">
            <Users className="mx-auto text-sky-700" size={42} />
            <h2 className="mt-5 text-4xl font-extrabold text-sky-950 sm:text-6xl">
              {t("donate.finalTitle", { count: campaignProgress.remainingStudents })}
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              {t("donate.finalBody", {
                amount: money(donationCampaign.contributionPerStudent, lang),
                participants: donationCampaign.participantCount,
              })}
            </p>
            <a
              href="#donar-ahora"
              className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-[#e4002b] px-8 font-bold text-white hover:bg-[#bd0023] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-200"
            >
              {t("donate.sticky")}
            </a>
          </div>
        </section>
      </main>
      <Footer />
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-8px_24px_rgba(15,23,42,.12)] backdrop-blur sm:hidden">
        <a
          href="#donar-ahora"
          className="flex min-h-12 w-full items-center justify-center rounded-full bg-[#e4002b] font-bold text-white"
        >
          {t("donate.sticky")}
        </a>
      </div>
      <p className="sr-only" aria-live="polite">
        {notice}
      </p>
    </div>
  );
}

export default DonatePage;
