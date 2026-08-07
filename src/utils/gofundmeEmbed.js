import { GOFUNDME_EMBED_SCRIPT_URL } from "config/gofundme";

const SCRIPT_ID = "gofundme-embed-script";
let scriptPromise;

function renderPendingEmbeds() {
  const embeds = Array.from(document.querySelectorAll(".gfm-embed"));
  if (!embeds.some((embed) => !embed.querySelector("iframe"))) return;

  // The official script only scans on DOMContentLoaded. Temporarily exclude
  // completed widgets so a late-mounted React widget can be processed once.
  const completed = embeds.filter((embed) => embed.querySelector("iframe"));
  completed.forEach((embed) => embed.classList.replace("gfm-embed", "gfm-embed-ready"));
  document.dispatchEvent(new Event("DOMContentLoaded"));
  completed.forEach((embed) => embed.classList.replace("gfm-embed-ready", "gfm-embed"));
}

export function loadGoFundMeEmbed() {
  if (typeof document === "undefined") return Promise.resolve();

  if (window.gfmWidgetLoaded) {
    renderPendingEmbeds();
    return Promise.resolve();
  }

  if (scriptPromise) return scriptPromise.then(renderPendingEmbeds);

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = GOFUNDME_EMBED_SCRIPT_URL;
    script.defer = true;
    script.async = true;
    script.addEventListener("load", resolve, { once: true });
    script.addEventListener("error", () => reject(new Error("gofundme-script-failed")), {
      once: true,
    });
    document.head.appendChild(script);
  });

  return scriptPromise.then(renderPendingEmbeds);
}

export function resetGoFundMeEmbedForTests() {
  scriptPromise = undefined;
}
