// src/i18n.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import es from "./locales/es.json";
import { en as donationEn, es as donationEs } from "./locales/donationCampaign";
import { en as conectaEn, es as conectaEs } from "./locales/conecta";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    resources: {
      en: {
        translation: {
          ...en,
          ...donationEn,
          ...conectaEn,
          nav: { ...en.nav, ...donationEn.nav },
        },
      },
      es: {
        translation: {
          ...es,
          ...donationEs,
          ...conectaEs,
          nav: { ...es.nav, ...donationEs.nav },
        },
      },
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
