export const COMPASES_DISPONIBLES = [
  { num: 2, den: 4 }, { num: 3, den: 4 }, { num: 4, den: 4 },
  { num: 5, den: 4 }, { num: 6, den: 4 }, { num: 7, den: 4 },
  { num: 3, den: 8 }, { num: 5, den: 8 }, { num: 6, den: 8 },
  { num: 7, den: 8 }, { num: 9, den: 8 }, { num: 12, den: 8 },
];

export const SUBDIVISIONES = [
  { v: 1, etiqueta: "Negras",      simbolo: "♩" },
  { v: 2, etiqueta: "Corcheas",    simbolo: "♪" },
  { v: 3, etiqueta: "Tresillos",   simbolo: "³" },
  { v: 4, etiqueta: "Semicorcheas", simbolo: "♬" },
];

export const SONIDOS_METRO = [
  { v: "click",   etiqueta: "Click" },
  { v: "madera",  etiqueta: "Madera" },
  { v: "digital", etiqueta: "Digital" },
  { v: "suave",   etiqueta: "Suave" },
];

export const PRESETS_ACENTO = {
  2:  [{ nombre: "Estándar", patron: [1, 0] }, { nombre: "Doble", patron: [1, 1] }],
  3:  [{ nombre: "Vals", patron: [1, 0, 0] }, { nombre: "Todos", patron: [1, 1, 1] }],
  4:  [
    { nombre: "Estándar", patron: [1, 0, 0, 0] },
    { nombre: "2 y 4",    patron: [0, 1, 0, 1] },
    { nombre: "1 y 3",    patron: [1, 0, 1, 0] },
    { nombre: "Todos",    patron: [1, 1, 1, 1] },
  ],
  5:  [
    { nombre: "3+2",      patron: [1, 0, 0, 1, 0] },
    { nombre: "2+3",      patron: [1, 0, 1, 0, 0] },
    { nombre: "Estándar", patron: [1, 0, 0, 0, 0] },
  ],
  6:  [
    { nombre: "3+3",      patron: [1, 0, 0, 1, 0, 0] },
    { nombre: "2+2+2",    patron: [1, 0, 1, 0, 1, 0] },
    { nombre: "Estándar", patron: [1, 0, 0, 0, 0, 0] },
  ],
  7:  [
    { nombre: "2+2+3",    patron: [1, 0, 1, 0, 1, 0, 0] },
    { nombre: "3+2+2",    patron: [1, 0, 0, 1, 0, 1, 0] },
    { nombre: "2+3+2",    patron: [1, 0, 1, 0, 0, 1, 0] },
    { nombre: "Estándar", patron: [1, 0, 0, 0, 0, 0, 0] },
  ],
  9:  [
    { nombre: "3+3+3",    patron: [1, 0, 0, 1, 0, 0, 1, 0, 0] },
    { nombre: "Estándar", patron: [1, 0, 0, 0, 0, 0, 0, 0, 0] },
  ],
  12: [
    { nombre: "3+3+3+3",  patron: [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0] },
    { nombre: "4+4+4",    patron: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0] },
    { nombre: "Estándar", patron: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  ],
};

export const PRESETS_BPM = [
  { bpm: 60,  nombre: "Largo" },
  { bpm: 76,  nombre: "Andante" },
  { bpm: 96,  nombre: "Moderato" },
  { bpm: 120, nombre: "Allegro" },
  { bpm: 144, nombre: "Vivace" },
  { bpm: 176, nombre: "Presto" },
];

export const BPM_MIN = 20;
export const BPM_MAX = 300;