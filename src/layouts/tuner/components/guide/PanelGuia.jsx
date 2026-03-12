/* eslint-disable react/prop-types */
import { useState } from "react";

const SECCIONES_GUIA = [
  {
    titulo: "¿Qué es un compás?",
    contenido: `Un compás es la unidad de medida del tiempo en la música. Define cuántos pulsos ocurren antes de que el ciclo se repita.

En notación musical se escribe como fracción: el número de arriba (numerador) indica cuántos tiempos tiene cada compás, y el número de abajo (denominador) indica qué figura musical recibe un tiempo.

Por ejemplo, en 4/4 hay cuatro tiempos por compás y cada tiempo dura una negra. Es el compás más común en música popular, rock, jazz y clásica.`,
  },
  {
    titulo: "Compases simples: 2/4, 3/4 y 4/4",
    contenido: `En un compás simple, cada tiempo se divide en dos partes iguales. Se llama división binaria.

2/4 — Dos tiempos por compás. Sensación de marcha. Muy usado en polcas, marchas militares y música folclórica.

3/4 — Tres tiempos por compás. Sensación de vals, suave y circular. Característico de la música de baile europea clásica.

4/4 — Cuatro tiempos por compás. El acento principal cae en el 1 y un acento secundario en el 3. Es el compás más universal de la música occidental moderna.`,
  },
  {
    titulo: "Compases compuestos: 6/8, 9/8, 12/8",
    contenido: `En un compás compuesto, cada tiempo se divide en tres partes iguales. Se llama división ternaria. Esto les da una sensación más fluida y ondulatoria.

6/8 — Tiene 6 corcheas agrupadas en 2 grupos de 3. Se siente como 2 pulsos principales, cada uno con sabor ternario. Muy usado en jigs, barcarolas, y piezas de carácter lírico.

9/8 — 3 grupos de 3 corcheas. Sensación de 3 pulsos principales ternarios.

12/8 — 4 grupos de 3 corcheas. Muy común en blues lentos y baladas soul. Aunque tiene 12 corcheas, se siente como 4 pulsos amplios y redondeados.`,
  },
  {
    titulo: "Compases asimétricos: 5/4 y 7/4",
    contenido: `Los compases asimétricos no se dividen en grupos iguales, lo que les da un carácter tenso e interesante.

5/4 — Puede organizarse como 3+2 o 2+3. El famoso "Take Five" de Dave Brubeck (1959) popularizó el 5/4 en el jazz.

7/4 — Puede organizarse como 2+2+3, 3+2+2 o 2+3+2. "Money" de Pink Floyd usa 7/4. También es muy común en música turca, balcánica y jazz moderno.

El truco para practicar estos compases: encuentra la agrupación interna, apréndetela como una frase rítmica concreta, y luego practica con el metrónomo hasta que fluya naturalmente.`,
  },
  {
    titulo: "Subdivisiones: el pulso por dentro",
    contenido: `Las subdivisiones dividen cada pulso en partes más pequeñas. Practicar con subdivisiones activas es la técnica más efectiva para solidificar el pulso antes de aumentar el tempo.

Negras (♩) — Un click por tiempo. El nivel básico.

Corcheas (♪) — Dos clicks por tiempo. Muy útil para asegurarse de que los tiempos están equidistantes.

Tresillos (³) — Tres subdivisiones por tiempo. Indispensable para practicar patrones ternarios o solos de jazz.

Semicorcheas (♬) — Cuatro clicks por tiempo. El nivel de precisión más fino. Ideal para pasajes técnicos rápidos.

Consejo práctico: cuando un pasaje se sienta irregular, activa las corcheas o semicorcheas en el metrónomo. Te mostrará exactamente dónde está el problema.`,
  },
  {
    titulo: "Tempo con curva: accelerando y ritardando",
    contenido: `Un accelerando (accel.) sube gradualmente el tempo durante una sección. Un ritardando (rit.) lo baja.

En el Modo Secuencia puedes configurar secciones con curva de tempo para practicar estas transiciones de forma controlada.

Curva lineal — El tempo sube o baja a ritmo constante. La sensación más predecible.

Curva exponencial — Comienza despacio y acelera más al final. Imita la aceleración natural en momentos de clímax.

Curva logarítmica — Acelera más al principio y se estabiliza hacia el final. Útil para practicar arranques fuertes.

Practicar con curvas de tempo controladas es mucho más efectivo que simplemente "sentir" el accelerando, porque elimina la variabilidad involuntaria y te entrena la percepción del cambio de tempo.`,
  },
  {
    titulo: "Cómo practicar de forma efectiva",
    contenido: `1. Empieza siempre a un tempo donde puedas ejecutar sin errores. Si fallas, baja el BPM.

2. Usa subdivisiones para solidificar el pulso antes de subir tempo.

3. Sube el BPM en incrementos pequeños, entre 5 y 10 BPM por sesión.

4. Alterna entre el tempo objetivo y un tempo más lento (alrededor del 70%). Esta técnica mejora la retención.

5. Divide la pieza en secciones. El modo Secuencia del metrónomo está diseñado exactamente para esto: crea una sección por cada parte difícil, configura el tempo adecuado para cada una, y practica con loop controlado.

6. Graba tu práctica una vez por semana. La grabación revela problemas de ritmo que el oído en tiempo real ignora.`,
  },
];

const TABLA_COMPASES = [
  { comp: "2/4",  tipo: "Simple",    pulsos: 2, div: "Binaria",  ej: "Marcha, Polca" },
  { comp: "3/4",  tipo: "Simple",    pulsos: 3, div: "Binaria",  ej: "Vals, Minueto" },
  { comp: "4/4",  tipo: "Simple",    pulsos: 4, div: "Binaria",  ej: "Pop, Rock, Jazz" },
  { comp: "5/4",  tipo: "Asimétrico",pulsos: 5, div: "Binaria",  ej: "Take Five, Prog" },
  { comp: "6/4",  tipo: "Simple",    pulsos: 6, div: "Binaria",  ej: "Himno, Balada" },
  { comp: "7/4",  tipo: "Asimétrico",pulsos: 7, div: "Binaria",  ej: "Money, Balcánica" },
  { comp: "6/8",  tipo: "Compuesto", pulsos: 2, div: "Ternaria", ej: "Jiga, Barcarola" },
  { comp: "9/8",  tipo: "Compuesto", pulsos: 3, div: "Ternaria", ej: "Reel irlandés" },
  { comp: "12/8", tipo: "Compuesto", pulsos: 4, div: "Ternaria", ej: "Blues, Soul lento" },
];

const BADGE_TIPO = {
  "Simple":     "bg-blue-50 border-blue-100 text-blue-600",
  "Compuesto":  "bg-amber-50 border-amber-100 text-amber-600",
  "Asimétrico": "bg-violet-50 border-violet-100 text-violet-600",
};

export function PanelGuia() {
  const [abierto, setAbierto] = useState(null);

  return (
    <div className="px-4 py-6 max-w-xl mx-auto w-full">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900">Guía musical</h2>
        <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">
          Conceptos esenciales de compás, ritmo y práctica. Desde lo más básico hasta técnicas avanzadas.
        </p>
      </div>

      {/* Acordeón */}
      <div className="flex flex-col gap-2 mb-8">
        {SECCIONES_GUIA.map((sec, i) => (
          <div key={i} className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
            <button
              onClick={() => setAbierto(abierto === i ? null : i)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
              aria-expanded={abierto === i}
            >
              <span className="text-sm font-semibold text-gray-900 pr-3">{sec.titulo}</span>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${
                  abierto === i ? "rotate-180" : ""
                }`}
                fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {abierto === i && (
              <div className="px-5 pb-5 border-t border-gray-100">
                <p className="text-sm text-gray-600 leading-relaxed mt-4 whitespace-pre-line">
                  {sec.contenido}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Tabla de referencia */}
      <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900">Referencia de compases</h3>
          <p className="text-xs text-gray-400 mt-0.5">Resumen de los compases más usados</p>
        </div>
        <div className="divide-y divide-gray-100">
          {TABLA_COMPASES.map((f) => (
            <div key={f.comp} className="flex items-center px-5 py-3 gap-4">
              <span className="text-base font-black text-gray-900 w-12 flex-shrink-0 font-mono">
                {f.comp}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-700">{f.ej}</p>
                <p className="text-xs text-gray-400">{f.pulsos} pulsos · División {f.div.toLowerCase()}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${BADGE_TIPO[f.tipo]}`}>
                {f.tipo}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}