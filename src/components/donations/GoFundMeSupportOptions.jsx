import { CreditCard, ExternalLink } from "lucide-react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

import { GOFUNDME_CAMPAIGN_URL } from "config/gofundme";
import { trackDonationEvent } from "utils/donationAnalytics";

export default function GoFundMeSupportOptions({ onCardClick, source = "donation_page" }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("en") ? "en" : "es";
  const details = (method) => ({
    locale,
    page: window.location.pathname,
    source,
    donation_method: method,
  });

  return (
    <div>
      <h2 className="text-3xl font-extrabold text-sky-950 sm:text-4xl">
        {t("gofundme.options.title")}
      </h2>
      <div className="mt-7 grid gap-5 md:grid-cols-2">
        <article className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 sm:p-7">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-800">GoFundMe</p>
          <h3 className="mt-2 text-2xl font-extrabold text-sky-950">
            {t("gofundme.options.gofundmeTitle")}
          </h3>
          <p className="mt-3 leading-7 text-slate-600">{t("gofundme.options.gofundmeBody")}</p>
          <a
            href={GOFUNDME_CAMPAIGN_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackDonationEvent("gofundme_cta_click", details("gofundme"))}
            className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-emerald-700 px-6 font-bold text-white hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
          >
            {t("gofundme.options.gofundmeCta")} <ExternalLink size={18} aria-hidden="true" />
          </a>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-7">
          <CreditCard size={24} className="text-[#e4002b]" aria-hidden="true" />
          <h3 className="mt-3 text-2xl font-extrabold text-sky-950">
            {t("gofundme.options.cardTitle")}
          </h3>
          <p className="mt-3 leading-7 text-slate-600">{t("gofundme.options.cardBody")}</p>
          <button
            type="button"
            onClick={() => {
              trackDonationEvent("bac_donation_cta_click", details("bac"));
              onCardClick();
            }}
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-[#e4002b] px-6 font-bold text-white hover:bg-[#bd0023] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-200"
          >
            {t("gofundme.options.cardCta")}
          </button>
        </article>
      </div>
    </div>
  );
}

GoFundMeSupportOptions.propTypes = {
  onCardClick: PropTypes.func.isRequired,
  source: PropTypes.string,
};
