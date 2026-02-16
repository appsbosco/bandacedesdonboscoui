// utils/sectionMapper.js
export const INSTRUMENT_TO_SECTION_MAP = {
  Flauta: "FLAUTAS",
  Clarinete: "CLARINETES",
  Saxofón: "SAXOFONES",
  Saxofon: "SAXOFONES",
  Trompeta: "TROMPETAS",
  Trombón: "TROMBONES",
  Trombon: "TROMBONES",
  Eufonio: "EUFONIOS",
  Cornos: "CORNOS",
  "Corno Francés": "CORNOS",
  Tuba: "TUBAS",
  Mallets: "MALLETS",
  Percusión: "PERCUSION",
  Percusion: "PERCUSION",
  "Color Guard": "COLOR_GUARD",
  Guard: "COLOR_GUARD",
  Danza: "DANZA",
};

export function mapInstrumentToSection(instrument) {
  if (!instrument) return "NO_APLICA";
  return INSTRUMENT_TO_SECTION_MAP[instrument] || "NO_APLICA";
}
