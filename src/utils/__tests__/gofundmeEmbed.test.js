import { loadGoFundMeEmbed, resetGoFundMeEmbedForTests } from "../gofundmeEmbed";

const SCRIPT_ID = "gofundme-embed-script";

describe("GoFundMe embed loader", () => {
  let renderEmbeds;

  beforeEach(() => {
    resetGoFundMeEmbedForTests();
    delete window.gfmWidgetLoaded;
    document.head.querySelector(`#${SCRIPT_ID}`)?.remove();
    document.body.innerHTML = '<div class="gfm-embed"></div>';
    renderEmbeds = () => {
      document.querySelectorAll(".gfm-embed").forEach((embed) => {
        const iframe = document.createElement("iframe");
        embed.appendChild(iframe);
      });
    };
    document.addEventListener("DOMContentLoaded", renderEmbeds);
  });

  afterEach(() => {
    document.removeEventListener("DOMContentLoaded", renderEmbeds);
    document.head.querySelector(`#${SCRIPT_ID}`)?.remove();
    document.body.innerHTML = "";
  });

  it("adds the official script only once", async () => {
    const first = loadGoFundMeEmbed();
    const second = loadGoFundMeEmbed();
    const scripts = document.head.querySelectorAll(`#${SCRIPT_ID}`);

    expect(scripts).toHaveLength(1);
    scripts[0].dispatchEvent(new Event("load"));
    await Promise.all([first, second]);

    expect(document.querySelectorAll(".gfm-embed iframe")).toHaveLength(1);
  });

  it("processes a late widget without duplicating a completed widget", async () => {
    const firstLoad = loadGoFundMeEmbed();
    document.getElementById(SCRIPT_ID).dispatchEvent(new Event("load"));
    await firstLoad;
    window.gfmWidgetLoaded = true;

    const lateWidget = document.createElement("div");
    lateWidget.className = "gfm-embed";
    document.body.appendChild(lateWidget);
    await loadGoFundMeEmbed();

    expect(document.querySelectorAll(".gfm-embed")).toHaveLength(2);
    expect(document.querySelectorAll(".gfm-embed iframe")).toHaveLength(2);
  });
});
