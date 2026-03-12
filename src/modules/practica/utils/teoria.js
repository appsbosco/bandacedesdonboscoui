export const NOMBRES_NOTAS = ["Do", "Do#", "Re", "Re#", "Mi", "Fa", "Fa#", "Sol", "Sol#", "La", "La#", "Si"];
export const NOMBRES_ANGLOSAJONES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export const ENARMONICOS = {
  "Do#": "Re♭", "Re#": "Mi♭", "Fa#": "Sol♭", "Sol#": "La♭", "La#": "Si♭",
};

export function construirNotas(a4 = 440) {
  const notas = [];
  for (let midi = 21; midi <= 108; midi++) {
    const semitonos = midi - 69;
    const freq = a4 * Math.pow(2, semitonos / 12);
    const octava = Math.floor(midi / 12) - 1;
    const indice = midi % 12;
    notas.push({
      midi, freq,
      nombre: NOMBRES_NOTAS[indice],
      nombreEn: NOMBRES_ANGLOSAJONES[indice],
      octava,
      enarmonico: ENARMONICOS[NOMBRES_NOTAS[indice]] || null,
    });
  }
  return notas;
}

export function notaMasCercana(freq, notas) {
  let mejor = null, mejorDiff = Infinity;
  for (const n of notas) {
    const diff = Math.abs(freq - n.freq);
    if (diff < mejorDiff) { mejorDiff = diff; mejor = n; }
  }
  return mejor;
}

export function calcularCents(freq, freqRef) {
  return 1200 * Math.log2(freq / freqRef);
}

export function generarPatronAcento(numerador) {
  return Array.from({ length: numerador }, (_, i) => (i === 0 ? 1 : 0));
}

export function nombreTempo(bpm) {
  if (bpm < 60) return "Grave";
  if (bpm < 66) return "Largo";
  if (bpm < 76) return "Larghetto";
  if (bpm < 108) return "Andante";
  if (bpm < 120) return "Moderato";
  if (bpm < 156) return "Allegro";
  if (bpm < 176) return "Vivace";
  if (bpm < 200) return "Presto";
  return "Prestissimo";
}