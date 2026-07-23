import { campaignProgress, donationCampaign } from "../../src/config/donationCampaign.js";

const CAMPAIGNS = {
  es: {
    title: `${donationCampaign.participantCount} integrantes. Un destino: Desfile de las Rosas. | Banda CEDES Don Bosco`,
    description: `Ayúdanos a reunir los ${campaignProgress.remainingStudents} apoyos de USD 2,200 que aún necesitamos para llevar a nuestros ${donationCampaign.participantCount} integrantes al Desfile de las Rosas.`,
    locale: "es_CR",
    canonicalPath: "/es/donar",
  },
  en: {
    title: `${donationCampaign.participantCount} members. One destination: Rose Parade. | Banda CEDES Don Bosco`,
    description: `Help us raise the remaining ${campaignProgress.remainingStudents} USD 2,200 support goals needed to take our ${donationCampaign.participantCount} members to the Rose Parade.`,
    locale: "en_US",
    canonicalPath: "/en/donate",
  },
};

function metaTags(origin, campaign) {
  const canonical = `${origin}${campaign.canonicalPath}`;
  const image = `${origin}/images/rose-parade-social.jpg`;

  return `
    <meta name="description" content="${campaign.description}" />
    <meta property="og:title" content="${campaign.title}" />
    <meta property="og:description" content="${campaign.description}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:secure_url" content="${image}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="Integrantes de la Banda CEDES Don Bosco rumbo al Rose Parade" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Banda CEDES Don Bosco" />
    <meta property="og:locale" content="${campaign.locale}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${campaign.title}" />
    <meta name="twitter:description" content="${campaign.description}" />
    <meta name="twitter:image" content="${image}" />
    <link rel="canonical" href="${canonical}" />
  `;
}

export default async function donationSocialMeta(request, context) {
  const response = await context.next();
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("text/html")) return response;

  const url = new URL(request.url);
  const lang = url.pathname === "/en/donate" || url.pathname === "/donate" ? "en" : "es";
  const campaign = CAMPAIGNS[lang];
  const html = await response.text();
  const updatedHtml = html
    .replace(/<title>.*?<\/title>/i, `<title>${campaign.title}</title>`)
    .replace("</head>", `${metaTags(url.origin, campaign)}</head>`);
  const headers = new Headers(response.headers);
  headers.delete("content-length");

  return new Response(updatedHtml, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export const config = {
  path: ["/es/donar", "/en/donate", "/donar", "/donate"],
  onError: "bypass",
};
