// utils/sectionMapper.js
export const INSTRUMENT_TO_SECTION_MAP = {
  flauta: "FLAUTAS",
  flute: "FLAUTAS",
  piccolo: "FLAUTAS",

  clarinete: "CLARINETES",
  clarinet: "CLARINETES",
  "clarinete bajo": "CLARINETES",
  "bass clarinet": "CLARINETES",

  saxofon: "SAXOFONES",
  saxofono: "SAXOFONES",
  saxo: "SAXOFONES",
  saxophone: "SAXOFONES",
  sax: "SAXOFONES",

  trompeta: "TROMPETAS",
  trumpet: "TROMPETAS",
  corneta: "TROMPETAS",

  trombon: "TROMBONES",
  trombone: "TROMBONES",

  eufonio: "EUFONIOS",
  euphonium: "EUFONIOS",
  baritono: "EUFONIOS",
  baritone: "EUFONIOS",

  corno: "CORNOS",
  cornos: "CORNOS",
  horn: "CORNOS",
  "corno frances": "CORNOS",
  "french horn": "CORNOS",

  tuba: "TUBAS",
  sousafon: "TUBAS",
  sousaphone: "TUBAS",

  mallets: "MALLETS",
  marimba: "MALLETS",
  xilofono: "MALLETS",
  vibrafono: "MALLETS",
  metalofono: "MALLETS",
  glockenspiel: "MALLETS",

  percusion: "PERCUSION",
  percussion: "PERCUSION",
  bateria: "PERCUSION",
  drums: "PERCUSION",
  bombo: "PERCUSION",
  tarola: "PERCUSION",
  snare: "PERCUSION",
  tenores: "PERCUSION",
  platillos: "PERCUSION",

  "color guard": "COLOR_GUARD",
  "guardia de color": "COLOR_GUARD",
  guard: "COLOR_GUARD",
  bandera: "COLOR_GUARD",
  rifle: "COLOR_GUARD",
  sable: "COLOR_GUARD",

  danza: "DANZA",
  dance: "DANZA",
};

function normalizeInstrument(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function mapInstrumentToSection(instrument) {
  const normalized = normalizeInstrument(instrument);
  if (!normalized) return "NO_APLICA";

  const exact = INSTRUMENT_TO_SECTION_MAP[normalized];
  if (exact) return exact;

  for (const [key, section] of Object.entries(INSTRUMENT_TO_SECTION_MAP)) {
    if (normalized.includes(key)) return section;
  }

  return "NO_APLICA";
}
