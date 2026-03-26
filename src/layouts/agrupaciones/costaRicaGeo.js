import costaRicaData from "./costarica_json.json";

function normalizeLabel(value = "") {
  return String(value)
    .replace(/\bDe\b/g, "de")
    .replace(/\bDel\b/g, "del")
    .replace(/\bLos\b/g, "Los")
    .replace(/\bLas\b/g, "Las")
    .trim();
}

const provincesMap = costaRicaData?.provincias || {};

export const PROVINCE_OPTIONS = Object.entries(provincesMap).map(([provinceCode, province]) => ({
  value: provinceCode,
  label: normalizeLabel(province.nombre),
}));

export function getProvinceLabel(provinceCode) {
  return PROVINCE_OPTIONS.find((province) => province.value === provinceCode)?.label || "";
}

export function getCantonOptions(provinceCode) {
  const cantons = provincesMap[provinceCode]?.cantones || {};

  return Object.entries(cantons).map(([cantonCode, canton]) => ({
    value: cantonCode,
    label: normalizeLabel(canton.nombre),
  }));
}

export function getCantonLabel(provinceCode, cantonCode) {
  return getCantonOptions(provinceCode).find((canton) => canton.value === cantonCode)?.label || "";
}

export function getDistrictOptions(provinceCode, cantonCode) {
  const districts = provincesMap[provinceCode]?.cantones?.[cantonCode]?.distritos || {};

  return Object.entries(districts).map(([districtCode, districtName]) => ({
    value: districtCode,
    label: normalizeLabel(districtName),
  }));
}

export function getDistrictLabel(provinceCode, cantonCode, districtCode) {
  return getDistrictOptions(provinceCode, cantonCode).find((district) => district.value === districtCode)?.label || "";
}
