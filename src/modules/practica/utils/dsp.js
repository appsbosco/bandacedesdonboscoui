export function aplicarVentanaHamming(buf) {
  const out = new Float32Array(buf.length);
  for (let i = 0; i < buf.length; i++) {
    out[i] = buf[i] * (0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (buf.length - 1)));
  }
  return out;
}

export function calcularRMS(buf) {
  let suma = 0;
  for (let i = 0; i < buf.length; i++) suma += buf[i] * buf[i];
  return Math.sqrt(suma / buf.length);
}

export function algoritmoyYIN(buf, sampleRate) {
  const umbral = 0.08;
  const mitad = Math.floor(buf.length / 2);
  const d = new Float32Array(mitad);
  for (let tau = 1; tau < mitad; tau++) {
    for (let i = 0; i < mitad; i++) {
      const delta = buf[i] - buf[i + tau];
      d[tau] += delta * delta;
    }
  }
  d[0] = 1;
  let acumulado = 0;
  for (let tau = 1; tau < mitad; tau++) {
    acumulado += d[tau];
    d[tau] = acumulado === 0 ? 0 : (d[tau] * tau) / acumulado;
  }
  let tau = 2;
  while (tau < mitad) {
    if (d[tau] < umbral) {
      while (tau + 1 < mitad && d[tau + 1] < d[tau]) tau++;
      break;
    }
    tau++;
  }
  if (tau === mitad || d[tau] >= umbral) return -1;
  const x0 = tau > 1 ? tau - 1 : tau;
  const x2 = tau < mitad - 1 ? tau + 1 : tau;
  if (x0 === tau) return d[tau] <= d[x2] ? sampleRate / tau : sampleRate / x2;
  if (x2 === tau) return d[tau] <= d[x0] ? sampleRate / tau : sampleRate / x0;
  const s0 = d[x0], s1 = d[tau], s2 = d[x2];
  const a = (s0 + s2 - 2 * s1) / 2;
  const b = (s2 - s0) / 2;
  const refinado = a === 0 ? tau : tau - b / (2 * a);
  return sampleRate / refinado;
}