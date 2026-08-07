/* eslint-disable react/prop-types */

import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import {
  ArrowRight,
  Check,
  ExternalLink,
  Facebook,
  Globe2,
  Heart,
  Instagram,
  Landmark,
  Music2,
  Share2,
} from "lucide-react";

import logoBanda from "assets/images/Logo-Banda-Cedes-Don-Bosco.webp";
import bigBandPhoto from "assets/images/BigBandA.webp";
import { trackDonationEvent } from "utils/donationAnalytics";
import { normalizePublicLang } from "utils/publicRoutes";

const CAMPAIGN_URL = "https://gofund.me/8fae224d6";
const INSTAGRAM_URL = "https://www.instagram.com/bandacedesdonbosco";
const FACEBOOK_URL = "https://www.facebook.com/bcdbcr";
const OFFICIAL_SITE_URL = "https://bandacedesdonbosco.com";
const OG_IMAGE_URL = `${OFFICIAL_SITE_URL}/images/rose-parade-social.jpg`;

function useCampaignMetadata(lang, t) {
  useEffect(() => {
    const previousTitle = document.title;
    const previousDocumentLang = document.documentElement.lang;
    const title = t("conecta.meta.title", { lng: lang });
    const description = t("conecta.meta.description", { lng: lang });
    const pageUrl = `${window.location.origin}/${lang}/conecta`;
    const managedNodes = [];
    const managedLinks = [];

    const setMeta = (attribute, key, content) => {
      let node = document.head.querySelector(`meta[${attribute}="${key}"]`);
      const previousContent = node?.getAttribute("content") ?? null;

      if (!node) {
        node = document.createElement("meta");
        node.setAttribute(attribute, key);
        document.head.appendChild(node);
      }

      node.setAttribute("content", content);
      managedNodes.push({ node, previousContent });
    };

    const setLink = (hreflang, href) => {
      let node = document.head.querySelector(
        `link[rel="alternate"][hreflang="${hreflang}"]`
      );
      const previousHref = node?.getAttribute("href") ?? null;

      if (!node) {
        node = document.createElement("link");
        node.setAttribute("rel", "alternate");
        node.setAttribute("hreflang", hreflang);
        document.head.appendChild(node);
      }

      node.setAttribute("href", href);
      managedLinks.push({ node, previousHref });
    };

    document.documentElement.lang = lang;
    document.title = title;
    setMeta("name", "description", description);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:type", "website");
    setMeta("property", "og:url", pageUrl);
    setMeta("property", "og:image", OG_IMAGE_URL);
    setMeta("property", "og:image:alt", t("conecta.meta.imageAlt", { lng: lang }));
    setMeta("property", "og:locale", lang === "en" ? "en_US" : "es_CR");
    setMeta("name", "twitter:card", "summary_large_image");
    setLink("es", `${window.location.origin}/es/conecta`);
    setLink("en", `${window.location.origin}/en/conecta`);
    setLink("x-default", `${window.location.origin}/conecta`);

    let canonical = document.head.querySelector('link[rel="canonical"]');
    const previousCanonical = canonical?.getAttribute("href") ?? null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", pageUrl);

    return () => {
      document.title = previousTitle;
      document.documentElement.lang = previousDocumentLang;
      managedNodes.forEach(({ node, previousContent }) => {
        if (previousContent === null) node.remove();
        else node.setAttribute("content", previousContent);
      });
      managedLinks.forEach(({ node, previousHref }) => {
        if (previousHref === null) node.remove();
        else node.setAttribute("href", previousHref);
      });
      if (previousCanonical === null) canonical.remove();
      else canonical.setAttribute("href", previousCanonical);
    };
  }, [lang, t]);
}

function ExternalLinkButton({ id, href, children, className = "", eventCategory = "link" }) {
  const handleClick = () => {
    trackDonationEvent("pasadena_cta_click", {
      linkId: id,
      category: eventCategory,
      destination: href,
    });
  };

  return (
    <a
      id={id}
      data-analytics-id={id}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={`group inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-center text-sm font-bold outline-none transition duration-300 ease-out focus-visible:ring-4 focus-visible:ring-[#df8c26] focus-visible:ring-offset-2 motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 ${className}`}
    >
      {children}
      <ExternalLink
        aria-hidden="true"
        className="h-4 w-4 shrink-0 transition-transform duration-300 motion-safe:group-hover:translate-x-0.5"
      />
    </a>
  );
}

ExternalLinkButton.propTypes = {
  id: PropTypes.string.isRequired,
  href: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  eventCategory: PropTypes.string,
};

function SocialLink({ id, href, icon: Icon, label, handle, ariaLabel }) {
  return (
    <a
      id={id}
      data-analytics-id={id}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() =>
        trackDonationEvent("pasadena_cta_click", {
          linkId: id,
          category: "social",
          destination: href,
        })
      }
      className="group flex min-h-[72px] flex-1 items-center gap-3 rounded-[22px] border border-[#fffdf7]/70 bg-[#fffdf7] px-4 py-3 shadow-[0_12px_26px_-20px_rgba(0,0,0,0.8)] outline-none transition duration-300 ease-out hover:bg-[#f6f0e6] focus-visible:ring-4 focus-visible:ring-[#df8c26] motion-safe:hover:-translate-y-0.5"
      aria-label={ariaLabel}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#152346] text-[#fffdf7] shadow-sm transition-transform duration-300 motion-safe:group-hover:scale-105">
        <Icon aria-hidden="true" className="h-5 w-5" />
      </span>
      <span className="min-w-0 text-left">
        <span className="block text-sm font-bold text-slate-900">{label}</span>
        <span className="block truncate text-xs text-slate-600">@{handle}</span>
      </span>
    </a>
  );
}

SocialLink.propTypes = {
  id: PropTypes.string.isRequired,
  href: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  handle: PropTypes.string.isRequired,
  ariaLabel: PropTypes.string.isRequired,
};

function ConectaPage() {
  const { lang: routeLang } = useParams();
  const { t } = useTranslation();
  const lang = normalizePublicLang(routeLang);
  const [shareFeedback, setShareFeedback] = useState("");
  const bacDonationUrl = `${OFFICIAL_SITE_URL}/${lang}/${
    lang === "en" ? "donate" : "donar"
  }#donacion-con-tarjeta`;
  const bigBandUrl = `${OFFICIAL_SITE_URL}/${lang}/${
    lang === "en" ? "ensembles" : "agrupaciones"
  }/big-band`;
  const officialSiteUrl = `${OFFICIAL_SITE_URL}/${lang}`;
  const translate = (key, options = {}) =>
    t(`conecta.${key}`, { lng: lang, ...options });

  useCampaignMetadata(lang, t);

  const handleShare = async () => {
    const shareData = {
      title: translate("share.nativeTitle"),
      text: translate("share.nativeText"),
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setShareFeedback(translate("share.success"));
        trackDonationEvent("pasadena_share", { linkId: "share", method: "native" });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setShareFeedback(translate("share.copied"));
        trackDonationEvent("pasadena_share", { linkId: "share", method: "clipboard" });
      }
    } catch (error) {
      if (error?.name !== "AbortError") {
        setShareFeedback(translate("share.failed"));
      }
    }

    window.setTimeout(() => setShareFeedback(""), 3000);
  };

  return (
    <main className="relative min-h-screen overflow-x-clip bg-[#f6f0e6] font-['Lexend'] text-slate-900 selection:bg-[#df8c26] selection:text-[#152346]">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 opacity-[0.035] [background-image:linear-gradient(#152346_1px,transparent_1px)] [background-size:100%_48px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -left-28 top-52 hidden h-72 w-72 rounded-full border-[42px] border-[#df8c26]/10 lg:block"
      />
      <img
        src="/images/torlogo.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none fixed -right-20 top-20 hidden w-72 rotate-12 opacity-[0.07] lg:block xl:-right-10"
      />

      <div className="relative mx-auto w-full max-w-[600px] px-3 pb-10 pt-3 sm:px-5 sm:pt-5">
        <section className="group relative isolate min-h-[470px] overflow-hidden rounded-[34px] bg-[#152346] shadow-[0_24px_70px_-30px_rgba(21,35,70,0.55)] motion-safe:animate-fade-in sm:min-h-[520px]">
          <img
            src="/images/story-image.png"
            alt={translate("hero.imageAlt")}
            className="absolute inset-0 h-full w-full object-cover object-[center_32%] sm:object-[center_30%]"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(21,35,70,0.18)_5%,rgba(21,35,70,0.08)_33%,rgba(21,35,70,0.92)_77%,rgba(21,35,70,0.99)_100%)]" />

          <div className="relative flex min-h-[470px] flex-col justify-between p-5 sm:min-h-[520px] sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <span className="inline-flex items-center rounded-full border border-white/25 bg-[#152346]/80 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.13em] text-[#fffdf7] shadow-sm">
                {translate("hero.origin")}{" "}
                <span aria-hidden="true" className="mx-2 text-[#df8c26]">
                  →
                </span>{" "}
                {translate("hero.destination")}
              </span>
              <div className="flex h-16 w-20 items-center justify-center rounded-[20px] bg-[#fffdf7] p-2 shadow-lg sm:h-[72px] sm:w-24">
                <img
                  src={logoBanda}
                  alt={translate("hero.logoAlt")}
                  className="h-full w-full object-contain"
                />
              </div>
            </div>

            <div className="relative max-w-[520px]">
              <img
                src="/images/icons/icon-1-01.svg"
                alt=""
                aria-hidden="true"
                className="conecta-scroll-art conecta-scroll-art--far pointer-events-none absolute -right-6 -top-20 w-32 -rotate-6 opacity-90 drop-shadow-[0_8px_18px_rgba(21,35,70,0.45)] transition duration-500 ease-out motion-safe:group-hover:-translate-y-1 motion-safe:group-hover:rotate-0 sm:-right-1 sm:-top-24 sm:w-40"
              />
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-white/75 sm:text-sm">
                {translate("hero.eyebrow")}
              </p>
              <h1 className="font-costarica text-[clamp(4.2rem,20vw,7.4rem)] leading-[0.7] tracking-tight text-[#df8c26]">
                {translate("hero.title")}
              </h1>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-100 sm:text-base sm:leading-7">
                {translate("hero.body")}
              </p>
            </div>
          </div>
        </section>

        <div className="relative z-10 -mt-2 space-y-4 px-1 sm:px-2">
          <section
            className="group relative overflow-hidden rounded-[30px] border border-emerald-200 bg-[#f8fff9] p-5 shadow-[0_18px_45px_-28px_rgba(20,83,45,0.5)] transition duration-300 ease-out motion-safe:hover:-translate-y-0.5 sm:p-6"
            aria-labelledby="gofundme-heading"
          >
            <div
              aria-hidden="true"
              className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-emerald-100/70"
            />
            <img
              src="/images/icons/icon-1-02.svg"
              alt=""
              aria-hidden="true"
              className="conecta-scroll-art conecta-scroll-art--reverse pointer-events-none absolute -bottom-16 -right-12 w-44 rotate-12 opacity-[0.09] transition duration-500 ease-out motion-safe:group-hover:rotate-6"
              loading="lazy"
            />
            <div className="relative">
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#02a95c] text-white shadow-sm">
                  <Heart aria-hidden="true" className="h-5 w-5" fill="currentColor" />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                    {translate("gofundme.eyebrow")}
                  </p>
                  <h2
                    id="gofundme-heading"
                    className="text-xl font-bold tracking-tight text-emerald-950"
                  >
                    {translate("gofundme.title")}
                  </h2>
                </div>
              </div>
              <p className="mb-5 text-sm leading-6 text-emerald-950/75">
                {translate("gofundme.body")}
              </p>
              <ExternalLinkButton
                id="donate-gofundme"
                href={CAMPAIGN_URL}
                eventCategory="donation"
                className="bg-[#02a95c] text-white shadow-[0_12px_25px_-14px_rgba(2,169,92,0.9)] hover:bg-[#008f4e]"
              >
                {translate("gofundme.button")}
              </ExternalLinkButton>
              <p className="mt-3 text-center text-xs font-medium text-emerald-800">
                {translate("gofundme.note")}
              </p>
            </div>
          </section>

          <section
            className="rounded-[28px] border border-rose-100 bg-[#fffafa] p-5 shadow-[0_16px_40px_-30px_rgba(159,18,57,0.45)] transition duration-300 ease-out motion-safe:hover:-translate-y-0.5 sm:p-6"
            aria-labelledby="bac-heading"
          >
            <div className="flex gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                <Landmark aria-hidden="true" className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-rose-700">
                  {translate("bac.eyebrow")}
                </p>
                <h2
                  id="bac-heading"
                  className="mt-0.5 text-lg font-bold tracking-tight text-slate-900"
                >
                  {translate("bac.title")}
                </h2>
              </div>
            </div>
            <p className="my-4 text-sm leading-6 text-slate-600">
              {translate("bac.body")}
            </p>
            <ExternalLinkButton
              id="donate-bac"
              href={bacDonationUrl}
              eventCategory="donation"
              className="border border-rose-200 bg-white text-rose-700 hover:border-rose-300 hover:bg-rose-50"
            >
              {translate("bac.button")}
            </ExternalLinkButton>
          </section>

          <section
            className="relative isolate overflow-hidden rounded-[30px] px-4 py-10 text-center"
            aria-labelledby="impact-heading"
          >
            <img
              src="/images/icons/icon-1-03.svg"
              alt=""
              aria-hidden="true"
              className="conecta-scroll-art conecta-scroll-art--far pointer-events-none absolute -left-20 top-0 -z-10 w-56 -rotate-12 opacity-[0.13]"
              loading="lazy"
            />
            <div
              aria-hidden="true"
              className="mx-auto mb-5 flex max-w-[220px] items-center gap-3 text-[#df8c26]"
            >
              <span className="h-px flex-1 bg-current opacity-40" />
              <Music2 className="h-5 w-5" />
              <span className="h-px flex-1 bg-current opacity-40" />
            </div>
            <h2 id="impact-heading" className="font-costarica text-4xl leading-none text-[#152346]">
              {translate("impact.title")}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
              {translate("impact.body")}
            </p>
          </section>

          <section
            className="group relative overflow-hidden rounded-[30px] bg-[#152346] p-5 shadow-[0_18px_50px_-30px_rgba(21,35,70,0.65)] sm:p-6"
            aria-labelledby="social-heading"
          >
            <img
              src="/images/icons/icon-1-04.svg"
              alt=""
              aria-hidden="true"
              className="conecta-scroll-art conecta-scroll-art--reverse conecta-scroll-art--far pointer-events-none absolute right-0 -top-10 w-48 rotate-6 opacity-[0.28] transition duration-500 ease-out motion-safe:group-hover:rotate-3 motion-safe:group-hover:scale-105"
              loading="lazy"
            />
            <div className="relative z-10 mb-5 max-w-[360px] pr-24">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
                  {translate("social.eyebrow")}
                </p>
                <h2
                  id="social-heading"
                  className="mt-1 max-w-xs text-xl font-bold leading-6 tracking-tight text-[#fffdf7]"
                >
                  {translate("social.title")}
                </h2>
              </div>
            </div>
            <div className="relative z-10 flex flex-col gap-3 min-[420px]:flex-row">
              <SocialLink
                id="instagram"
                href={INSTAGRAM_URL}
                icon={Instagram}
                label="Instagram"
                handle="bandacedesdonbosco"
                ariaLabel={translate("social.follow", { network: "Instagram" })}
              />
              <SocialLink
                id="facebook"
                href={FACEBOOK_URL}
                icon={Facebook}
                label="Facebook"
                handle="bcdbcr"
                ariaLabel={translate("social.follow", { network: "Facebook" })}
              />
            </div>
          </section>

          <section
            className="group relative min-h-[370px] overflow-hidden rounded-[30px] bg-[#152346] shadow-[0_20px_55px_-35px_rgba(21,35,70,0.8)]"
            aria-labelledby="big-band-heading"
          >
            <img
              src={bigBandPhoto}
              alt={translate("bigBand.imageAlt")}
              className="absolute inset-0 h-full w-full object-cover object-[54%_center] transition duration-700 ease-out motion-safe:group-hover:scale-[1.02]"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(21,35,70,0.02)_25%,rgba(21,35,70,0.93)_78%,rgba(21,35,70,1)_100%)]" />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-5 top-5 z-10 flex h-20 w-20 items-center justify-center rounded-[24px] border-2 border-white/70 bg-[#df8c26] p-2 shadow-[0_14px_32px_-12px_rgba(0,0,0,0.8)] transition duration-500 ease-out motion-safe:group-hover:rotate-3 motion-safe:group-hover:scale-105"
            >
              <img
                src="/images/icons/icon-1-06.svg"
                alt=""
                className="conecta-scroll-art conecta-scroll-art--subtle h-full w-full object-contain"
              />
            </div>
            <div className="relative flex min-h-[370px] flex-col justify-end p-5 sm:p-6">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#df8c26]">
                {translate("bigBand.eyebrow")}
              </p>
              <h2
                id="big-band-heading"
                className="max-w-sm text-2xl font-bold leading-7 tracking-tight text-[#fffdf7]"
              >
                {translate("bigBand.title")}
              </h2>
              <p className="mb-5 mt-2 text-sm leading-6 text-slate-200">
                {translate("bigBand.body")}
              </p>
              <ExternalLinkButton
                id="big-band"
                href={bigBandUrl}
                className="bg-[#fffdf7] text-[#152346] hover:bg-[#df8c26]"
              >
                {translate("bigBand.button")}
              </ExternalLinkButton>
            </div>
          </section>

          <section
            className="group relative overflow-hidden rounded-[30px] bg-[#df8c26] p-6 text-[#152346] shadow-[0_18px_45px_-30px_rgba(134,83,0,0.7)] sm:p-7"
            aria-labelledby="share-heading"
          >
            <img
              src="/images/icons/icon-1-05.svg"
              alt=""
              aria-hidden="true"
              className="conecta-scroll-art conecta-scroll-art--reverse conecta-scroll-art--far pointer-events-none absolute -bottom-12 -right-14 w-52 -rotate-12 opacity-[0.14] transition duration-500 ease-out motion-safe:group-hover:-translate-y-1 motion-safe:group-hover:rotate-[-8deg]"
              loading="lazy"
            />
            <div className="relative">
              <Share2 aria-hidden="true" className="mb-4 h-7 w-7" />
              <h2 id="share-heading" className="font-costarica text-4xl leading-none">
                {translate("share.title")}
              </h2>
              <p className="mt-3 max-w-sm text-sm leading-6 text-[#152346]/80">
                {translate("share.body")}
              </p>
              <button
                id="share"
                data-analytics-id="share"
                type="button"
                onClick={handleShare}
                className="group mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#152346] px-5 py-3.5 text-sm font-bold text-[#fffdf7] outline-none transition duration-300 ease-out hover:bg-[#152346]/90 focus-visible:ring-4 focus-visible:ring-white/80 motion-safe:hover:-translate-y-0.5"
              >
                {translate("share.button")}
                <ArrowRight
                  aria-hidden="true"
                  className="h-4 w-4 transition-transform duration-300 motion-safe:group-hover:translate-x-1"
                />
              </button>
              <p
                className="mt-3 min-h-5 text-center text-xs font-bold"
                aria-live="polite"
                role="status"
              >
                {shareFeedback && (
                  <span className="inline-flex items-center gap-1.5">
                    <Check aria-hidden="true" className="h-4 w-4" />
                    {shareFeedback}
                  </span>
                )}
              </p>
            </div>
          </section>
        </div>

        <footer className="relative mt-4 overflow-hidden rounded-[30px] bg-[#152346] px-5 pb-8 pt-9 text-center shadow-[0_18px_50px_-34px_rgba(21,35,70,0.8)]">
          <img
            src="/images/icons/icon-1-07.svg"
            alt=""
            aria-hidden="true"
            className="conecta-scroll-art conecta-scroll-art--subtle pointer-events-none absolute -bottom-24 left-1/2 w-[420px] -translate-x-1/2 opacity-[0.08]"
            loading="lazy"
          />
          <div className="relative">
            <span className="mx-auto flex h-[74px] w-36 items-center justify-center rounded-[22px] bg-[#fffdf7] p-2 shadow-lg">
              <img
                src={logoBanda}
                alt=""
                aria-hidden="true"
                className="h-full w-full object-contain"
                loading="lazy"
              />
            </span>
            <p className="mt-4 text-sm font-bold text-[#fffdf7]">
              {translate("footer.organization")}
            </p>
            <p className="mt-1 text-xs text-white/70">{translate("footer.country")}</p>
            <p className="mx-auto mt-4 max-w-xs text-xs leading-5 text-slate-300">
              {translate("footer.thanks")}
            </p>
            <a
              href={officialSiteUrl}
              id="official-site"
              data-analytics-id="official-site"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackDonationEvent("pasadena_cta_click", {
                  linkId: "official-site",
                  category: "website",
                  destination: officialSiteUrl,
                })
              }
              className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold text-[#fffdf7] outline-none transition hover:bg-white/10 focus-visible:ring-4 focus-visible:ring-[#df8c26]"
            >
              <Globe2 aria-hidden="true" className="h-4 w-4" />
              {translate("footer.website")}
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}

export default ConectaPage;
