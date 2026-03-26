export const SUPPORTED_PUBLIC_LANGS = ["es", "en"];

export const PUBLIC_ROUTE_SEGMENTS = {
  about: {
    es: "nosotros",
    en: "about",
  },
  blog: {
    es: "blog",
    en: "blog",
  },
  ensembles: {
    es: "agrupaciones",
    en: "ensembles",
  },
  calendar: {
    es: "calendario",
    en: "calendar",
  },
  contact: {
    es: "contacto",
    en: "contact",
  },
};

export function normalizePublicLang(lang) {
  return SUPPORTED_PUBLIC_LANGS.includes(lang) ? lang : "es";
}

export function getPublicSegment(lang, key) {
  const normalizedLang = normalizePublicLang(lang);
  return PUBLIC_ROUTE_SEGMENTS[key]?.[normalizedLang] ?? "";
}

export function getPublicPath(lang, key, extraPath = "") {
  const normalizedLang = normalizePublicLang(lang);
  const segment = getPublicSegment(normalizedLang, key);
  const suffix = extraPath ? `/${String(extraPath).replace(/^\/+/, "")}` : "";

  if (!segment) {
    return `/${normalizedLang}${suffix}`;
  }

  return `/${normalizedLang}/${segment}${suffix}`;
}

export function isSupportedPublicLang(lang) {
  return SUPPORTED_PUBLIC_LANGS.includes(lang);
}
