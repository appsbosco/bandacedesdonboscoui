import { useEffect } from "react";
import PropTypes from "prop-types";

function upsertMeta(selector, attributes) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
}

export default function Seo({ title, description, image, path, type = "website", locale }) {
  useEffect(() => {
    const previousTitle = document.title;
    const currentUrl =
      typeof window !== "undefined" ? `${window.location.origin}${path || window.location.pathname}` : "";

    document.title = title;

    if (description) {
      upsertMeta('meta[name="description"]', { name: "description", content: description });
      upsertMeta('meta[property="og:description"]', {
        property: "og:description",
        content: description,
      });
    }

    upsertMeta('meta[property="og:title"]', { property: "og:title", content: title });
    upsertMeta('meta[property="og:type"]', { property: "og:type", content: type });
    upsertMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: title });
    if (description) {
      upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: description });
    }
    if (locale) {
      upsertMeta('meta[property="og:locale"]', { property: "og:locale", content: locale });
    }
    if (currentUrl) {
      upsertMeta('meta[property="og:url"]', { property: "og:url", content: currentUrl });
    }
    if (image) {
      upsertMeta('meta[property="og:image"]', { property: "og:image", content: image });
      upsertMeta('meta[name="twitter:image"]', { name: "twitter:image", content: image });
    }
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    if (currentUrl) canonical.href = currentUrl;

    return () => {
      document.title = previousTitle;
    };
  }, [description, image, locale, path, title, type]);

  return null;
}

Seo.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  image: PropTypes.string,
  path: PropTypes.string,
  type: PropTypes.string,
  locale: PropTypes.string,
};
