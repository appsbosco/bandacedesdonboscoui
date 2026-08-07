import { useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

import { GOFUNDME_CAMPAIGN_URL, GOFUNDME_WIDGET_URL } from "config/gofundme";
import { loadGoFundMeEmbed } from "utils/gofundmeEmbed";
import { trackDonationEvent } from "utils/donationAnalytics";

const WIDGET_TIMEOUT_MS = 7000;

export default function GoFundMeWidget({ source, eager = false, compact = false }) {
  const { t, i18n } = useTranslation();
  const hostRef = useRef(null);
  const viewedRef = useRef(false);
  const [shouldLoad, setShouldLoad] = useState(eager);
  const [status, setStatus] = useState("idle");
  const locale = i18n.language?.startsWith("en") ? "en" : "es";

  useEffect(() => {
    if (eager || shouldLoad || !hostRef.current) return undefined;
    if (!("IntersectionObserver" in window)) {
      setShouldLoad(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "320px 0px" }
    );
    observer.observe(hostRef.current);
    return () => observer.disconnect();
  }, [eager, shouldLoad]);

  useEffect(() => {
    if (!shouldLoad) return undefined;
    let active = true;
    let timeout;
    let observer;
    setStatus("loading");

    loadGoFundMeEmbed()
      .then(() => {
        const markReady = () => {
          const iframe = hostRef.current?.querySelector("iframe");
          if (!active || !iframe) return false;
          setStatus("ready");
          if (!viewedRef.current) {
            viewedRef.current = true;
            trackDonationEvent("gofundme_widget_view", {
              locale,
              page: window.location.pathname,
              source,
              donation_method: "gofundme",
            });
          }
          return true;
        };

        if (markReady()) return;
        observer = new MutationObserver(markReady);
        if (hostRef.current) observer.observe(hostRef.current, { childList: true, subtree: true });
        timeout = window.setTimeout(() => {
          if (!active) return;
          if (!markReady()) setStatus("error");
          observer?.disconnect();
        }, WIDGET_TIMEOUT_MS);
      })
      .catch(() => active && setStatus("error"));

    return () => {
      active = false;
      window.clearTimeout(timeout);
      observer?.disconnect();
    };
  }, [locale, shouldLoad, source]);

  const trackCta = () =>
    trackDonationEvent("gofundme_cta_click", {
      locale,
      page: window.location.pathname,
      source,
      donation_method: "gofundme",
    });

  const fallback = (
    <div className={`text-center ${compact ? "px-1 py-3" : "px-5 py-10 sm:px-10"}`}>
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-700">
        {t("gofundme.officialCampaign")}
      </p>
      <h3 className="mt-3 text-2xl font-extrabold text-sky-950 sm:text-3xl">
        {t("gofundme.campaignName")}
      </h3>
      <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-600">{t("gofundme.description")}</p>
      <a
        href={GOFUNDME_CAMPAIGN_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={trackCta}
        className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-emerald-700 px-7 font-bold text-white transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
      >
        {t("gofundme.openCampaign")} <ExternalLink size={18} aria-hidden="true" />
      </a>
    </div>
  );

  return (
    <div ref={hostRef}>
      {status === "error" ? (
        fallback
      ) : (
        <>
          <div
            className="gfm-embed min-h-[500px] w-full overflow-hidden"
            data-url={GOFUNDME_WIDGET_URL}
            aria-label={t("gofundme.widgetLabel")}
          />
          {status === "loading" && (
            <p className="sr-only" role="status">
              {t("gofundme.loading")}
            </p>
          )}
        </>
      )}
    </div>
  );
}

GoFundMeWidget.propTypes = {
  source: PropTypes.string.isRequired,
  eager: PropTypes.bool,
  compact: PropTypes.bool,
};
