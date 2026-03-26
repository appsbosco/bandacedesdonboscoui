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

export default function Seo({ title, description, image, path }) {
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
    if (currentUrl) {
      upsertMeta('meta[property="og:url"]', { property: "og:url", content: currentUrl });
    }
    if (image) {
      upsertMeta('meta[property="og:image"]', { property: "og:image", content: image });
    }

    return () => {
      document.title = previousTitle;
    };
  }, [description, image, path, title]);

  return null;
}

Seo.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  image: PropTypes.string,
  path: PropTypes.string,
};
