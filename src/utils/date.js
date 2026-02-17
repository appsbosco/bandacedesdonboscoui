export function convertDateEsToIso(str) {
  if (!str || typeof str !== "string") return null;

  const months = {
    enero: "01",
    febrero: "02",
    marzo: "03",
    abril: "04",
    mayo: "05",
    junio: "06",
    julio: "07",
    agosto: "08",
    septiembre: "09",
    octubre: "10",
    noviembre: "11",
    diciembre: "12",
  };

  const parts = str.split(" ");
  if (parts.length < 5) return null;

  const day = String(parts[0] || "").padStart(2, "0");
  const monthKey = parts[2];
  const year = parts[4];

  const month = months[monthKey];
  if (!month || !year) return null;

  return `${year}-${month}-${day}`;
}

export function calculateAgeFromBirthdayEs(birthdayStr) {
  const iso = convertDateEsToIso(birthdayStr);
  if (!iso) return "N/A";

  const birthday = new Date(iso);
  if (Number.isNaN(birthday.getTime())) return "N/A";

  const today = new Date();
  let age = today.getFullYear() - birthday.getFullYear();
  const monthDifference = today.getMonth() - birthday.getMonth();

  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthday.getDate())) {
    age--;
  }

  if (age < 0 || age > 120) return "N/A";
  return age;
}
